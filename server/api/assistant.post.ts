import { bareStoreAsk } from '../utils/bareStore'
import { pickedOptions } from '../../utils/variantPick'
import { pickerCards, resolveTypedPick, pickerCardsAsText, pickerCardPhoto } from '../../utils/typedPick'
import { streamText, tool, convertToModelMessages, stepCountIs, createUIMessageStreamResponse } from 'ai'
import { extractText, getDocumentProxy } from 'unpdf'
import { z } from 'zod'
import { itemUnits, itemKg, isUnboxable, archetypeOf, fitTier, ARCH_LABEL } from '../utils/boxMath'
import { FALLBACK_KNOWLEDGE } from '../utils/boxlyKnowledge'
import { chatModel, isAnthropic, providerOptions, hasModelKey } from '../utils/aiProvider'
import { ageGalleries, windowMessages, withContextOnLastUser, dropToolParts, legacyToolsAsText, contextStats, WINDOW_DEFAULTS } from '../utils/chatContext'
import { generateFollowups, followupPart, followupsWithin, attachFollowupChips } from '../utils/followups'
import { readSummary, summaryBlock, summarize, shouldSummarize } from '../utils/chatSummary'
import { boxFromMessages, withEarlierItems, wantedFromBox, planCart, storeOptionFixes, withStoreOptions, type CarriedStore } from '../utils/boxCheckout'
import { pickedColourImage } from '../../utils/pickerLogic'
import { checkStoreLock } from '../utils/storeLock'
import { storeHostsFromLiveStores, tagCarriedStores } from '../utils/storeHosts'
import { resolveLiveStores, liveGalleryQuery, liveResultsAsText, type LiveStore } from '../../utils/liveGallery'

/**
 * AI shopping-assistant chat backend.
 *
 * The flow (since 2026-09-28, when Boxly Lab's flow became the product): one narrowing question when the ask is
 * vague → live_gallery opens the store(s) in live browsers the shopper watches, and the engine builds the gallery
 * from the store's own search → the shopper picks (size/colour in the product modal) → show_shipment puts it in the
 * box, which is mirrored into the store's real cart by the agent (cart sync) → finalize_order runs the real store
 * checkouts live → purchase request → the invoice card with the Stripe payment link.
 *
 * Also: authed tools (get_profile / list_orders / show_orders / update_shopping_profile / plan_in_person) that call
 * the Boxly API with the user's bearer token, and CLIENT-executed tools (create_account, create_self_order,
 * cancel_order — no server execute) the browser completes itself.
 *
 * The frontend (useChat) sends { messages, token?, conversationId?, shoppingProfile?, savedProducts?, … }.
 */

const API_BASE = (process.env.API_URL || 'https://api.boxly.mx').replace(/\/$/, '')

// THE LIVE STORE GALLERY IS THE ONLY PRODUCT SEARCH (Alex, 2026-09-28: "Remove the whole Lab and SerpAPI and old
// catalog logic"). A product request goes straight to the computer-use engine: live_gallery opens the store(s) in
// real browsers the shopper watches in the chat, and the engine builds the gallery from each store's OWN search
// (utils/liveGallery.ts). The catalog search/curate/collection tools, the Google Shopping / Amazon / eBay / Bing /
// Walmart web fan-out, web_search and the page-extract tools that used to live here are gone with it.

// VARIANTS for ONE product URL — sizes/colours with availability + price per variant. The moment the
// shopper commits to a product we go straight to its STORED URL (catalog or live row): no grid navigation,
// no re-search. The catalog service answers from its mirror when the product was checked recently, else it
// reads the product page live (headless browser, up to ~40s). Fails SOFT: {variants: [], reason}.
/**
 * PAGE FURNITURE IS NOT A VARIANT.
 *
 * Erick Martos, 2026-09-22. Three products in a row could not be added to his box:
 *
 *   "…en color Black"  → axes: Style ["Additional details", "here", "Measurements"]
 *   (tapped Add)       → axes: Style ["Return details", "Measurements", "Sponsored", …]
 *   "…en color Blue"   → axes: Color ["3+", "Green", "Blue"] + Style ["here", "User guide"]
 *
 * Those are Amazon's own links and section headings, read off the page as if they were
 * a choice. And ONE of them is enough to trap the shopper for good: the hold gate needs
 * EVERY multi-value axis answered, so on the third the Color axis was satisfied — he
 * said Blue, Blue was there — and the junk Style axis held it anyway. He was asked to
 * pick something he had already picked, from options that meant nothing, and replied "?".
 *
 * Fixed at the one place both readers pass through, so a store we have never seen gets
 * the same guard. Anchored patterns only: a colour really can be called "Floral Details",
 * so nothing matches on a substring.
 */
const CHROME_VALUE = /^(?:here|sponsored|more|see (?:more|all|less)|learn more|show more|compare|report(?: an issue)?|(?:additional|return|product|more|shipping|delivery|payment)? ?details?|measurements?|specifications?|description|dimensions|user guide|size (?:chart|guide)|about this item|customer (?:reviews?|questions?)|reviews?|questions?|q&a|videos?|images?|photos?|visit the .*store|shipping(?: (?:&|and) returns)?|returns?|warranty|help|support|terms|privacy|feedback|add to (?:list|cart|registry)|\d+\+)$/i

/** Real, choosable values — page chrome and blanks removed. */
function cleanValues(values: any[]): any[] {
  return (values || []).filter((v) => { const t = String(v ?? '').trim(); return t && !CHROME_VALUE.test(t) })
}

/**
 * Drop the chrome from every axis, then drop any axis that no longer offers a choice.
 * An axis with one real value is not a decision; an axis with none never was.
 */
export function cleanAxes(axes: any[]): any[] {
  return (Array.isArray(axes) ? axes : [])
    .map((a: any) => ({ ...a, values: cleanValues(a?.values) }))
    .filter((a: any) => (a.values?.length || 0) > 0)
}

/** The same cut applied to the flat variant list the chips are drawn from. */
export function cleanVariants(variants: any[]): any[] {
  return (Array.isArray(variants) ? variants : []).filter((v: any) => {
    const parts = [v?.size, v?.color].filter((x) => x != null && String(x).trim() !== '')
    if (!parts.length) return true
    return parts.every((x) => !CHROME_VALUE.test(String(x).trim()))
  })
}

const variantCache = new Map<string, { at: number; r: any }>()
async function getProductVariantsApi(url: string, maxAgeS = 900) {
  // Every read populates variantCache, whichever tool asked for it: the box's hold gate and the finalize rail both
  // consult it, and when only get_product_variants had run they saw nothing and waved the item through.
  const hit = variantCache.get(url)
  if (hit && Date.now() - hit.at < 15 * 60_000) return hit.r
  let data: any = {}
  try {
    data = await callApi('/catalog/product-variants', { method: 'POST', body: { url, max_age_s: maxAgeS }, timeoutMs: 58000 })
  } catch (e: any) { console.warn('[assistant] product-variants unreachable:', e?.message || e); data = { error: 'unreachable' } }
  const variants: any[] = cleanVariants(Array.isArray(data?.variants) ? data.variants : [])
  // Judged on what SURVIVED the chrome cut, not on what the reader sent: a page whose
  // only "variants" were "Sponsored" and "Return details" has no variants, and saying
  // so out loud is what lets the item into the box instead of stalling on a null reason.
  const reason: string | null = data?.error ? String(data.error) : (!variants.length ? (data?.reason || 'no_variants') : null)
  const out = {
    product: data?.product || null,
    // Chrome out before anyone counts axes: the hold gate, the chips and the model's
    // note all read these, and one junk axis traps the shopper (see CHROME_VALUE).
    axes: cleanAxes(data?.axes),
    // TRI-STATE AVAILABILITY, never coerced. `!!v.available` turned every UNKNOWN into SOLD OUT here, so an
    // Adidas product — whose API never publishes per-size stock — rendered 21 disabled chips reading
    // "0 de 21 disponibles" and could not be added to a box at all (live test, 2026-09-11).
    variants: variants.map((v: any) => ({ key: v.key || [v.color, v.size].filter(Boolean).join(' / '), size: v.size ?? null, color: v.color ?? null, available: v.available === true ? true : v.available === false ? false : null, price: v.price ?? null, list_price: v.list_price ?? null, low_stock: v.low_stock || null })),
    selected: data?.selected || null,
    checked_at: data?.checked_at || null,
    source: data?.source || null,
    store_id: data?.store_id || null,
    reason,
  }
  if (out.variants?.length || out.axes?.length) variantCache.set(url, { at: Date.now(), r: out })
  return out
}
// Which model/provider runs this chat is decided centrally in ../utils/aiProvider
// (chatModel()), so the whole app can switch between Gemini and Claude via env.

// Admin-managed knowledge wiki (Mode 1 — Expert). Cached briefly; falls back to a
// built-in constant if the API is unreachable so the concierge never goes dark.
let wikiCache: { markdown: string; at: number } | null = null
let wikiRefreshing = false
const WIKI_TTL_MS = 300_000 // 5 min
// Fetch the wiki in the background and update the cache. Never throws.
function refreshKnowledge(): void {
  if (wikiRefreshing) return
  wikiRefreshing = true
  fetch(`${API_BASE}/knowledge`, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000) })
    .then((res) => res.json().then((data) => ({ ok: res.ok, md: data?.data?.markdown })))
    .then(({ ok, md }) => { if (ok && typeof md === 'string' && md.trim()) wikiCache = { markdown: md, at: Date.now() } })
    .catch(() => { /* keep last good cache */ })
    .finally(() => { wikiRefreshing = false })
}
// Stale-while-revalidate: NEVER block the chat on the wiki. If we have any cached
// copy we return it instantly (and refresh in the background when stale). Only the
// very first request with an empty cache waits — briefly — then falls back.
async function getKnowledge(): Promise<string> {
  if (wikiCache) {
    if (Date.now() - wikiCache.at > WIKI_TTL_MS) refreshKnowledge() // non-blocking
    return wikiCache.markdown
  }
  try {
    const res = await fetch(`${API_BASE}/knowledge`, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(4000) })
    const data = await res.json()
    const md = data?.data?.markdown
    if (res.ok && typeof md === 'string' && md.trim()) {
      wikiCache = { markdown: md, at: Date.now() }
      return md
    }
  } catch { /* fall through */ }
  return FALLBACK_KNOWLEDGE
}

// Pull the latest user message's text out of UI messages (parts[] or content).
function lastUserText(messages: any[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]
    if (m?.role !== 'user') continue
    if (typeof m.content === 'string') return m.content
    if (Array.isArray(m.parts)) return m.parts.filter((p: any) => p?.type === 'text').map((p: any) => p.text).join(' ').trim()
  }
  return ''
}

// Things Boxly does not bring (Alex, 2026-09-13). The prompt says so too, but a prompt
// rule is a suggestion: "cigarros marlboro" once answered with a live link to buy a
// carton, and after the rule was added "vape desechable de sandía" still came back with
// 48 products. So the search tools refuse these outright, before any engine is called.
// Deliberately narrow and whole-word: vitamins, OTC remedies, kitchen knives, heat guns,
// water/nerf guns, airsoft, pet supplies and alcohol are all normal products and must
// keep working — alcohol stays on the knowledge base's own "a riesgo del cliente" rule.
const RESTRICTED_RE = new RegExp([
  String.raw`\b(?:cigarr?o|cigarros|cigarrillos?|cigarettes?|marlboro|newport|lucky strike)\b`,
  String.raw`\b(?:vape|vapes|vapeador(?:es)?|vaper|vapear|e-?cigs?|e-?cigarettes?|nicotina|nicotine|zyn|tabaco|hookah|shisha|narguile|cigars?)\b`,
  String.raw`\b(?:municion(?:es)?|ammo|ammunition|balas?|rifles?|escopetas?|revolver(?:es)?|firearms?|glock|ar-?15|ak-?47|silenciador|taser|pepper spray|gas pimienta)\b`,
  String.raw`\bpistolas?\b(?!\s+(?:de\s+)?(?:agua|calor|silic|pintura|clavos|pegamento|juguete|nerf))`,
  String.raw`\b(?:medicamentos?\s+controlados?|con\s+receta|receta\s+m[eé]dica|prescription\s+(?:drugs?|medication)|adderall|oxycodone|oxicodona|xanax|tramadol)\b`,
  String.raw`\b(?:animal(?:es)?\s+vivos?|cachorros?\s+(?:de\s+)?venta|comprar\s+un\s+(?:perro|gato|perico|loro|conejo|h[aá]mster))\b`,
].join('|'), 'i')

const plainText = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '')

// ── AN AUDIENCE-SHAPED HOLE IN THE ASK — DECIDED IN CODE ─────────────────────
//
// "Camisa polo" returned a girls' Ralph Lauren polo as the first result (Alex,
// 2026-09-17). The ask_to_narrow tool existed, was reachable, had a card, had
// tests and had a prompt rule — and the model searched anyway, because two other
// rules gave it permission to:
//
//   · the narrowing rule itself ends "if in doubt, search first and let them refine"
//   · the long-term memory block says "use their saved gender … automatically,
//     and never re-ask for anything already here"
//
// A rule with an escape hatch is a suggestion, and this is the third time in this
// file that a prompt-only guarantee has lost (see prepareStep's old web_search note and
// show_shipment's forced variant read). So the decision moves here: CODE decides
// whether there is a question to ask, the MODEL still decides how to phrase it and
// in which language. When this fires, prepareStep hands it no tool but ask_to_narrow.

/** Says who the product is for. Any of these and there is nothing left to ask. */
const RE_AUDIENCE = /\b(?:hombres?|caballeros?|masculin[oa]s?|men|mens|man|male|mujer(?:es)?|damas?|femenin[oa]s?|women|womens|woman|female|nin[oa]s?|kids?|child(?:ren)?|toddler|bebes?|baby|infant|junior|juvenil|unisex|para ella|para mi (?:hijo|hija|esposa|esposo|novio|novia|mama|papa))\b/i

/**
 * Categories where the men's and the women's product are DIFFERENT PRODUCTS, so
 * guessing wrong wastes the whole gallery. Not a list of everything ambiguous —
 * a list of things where the answer changes the rows.
 */
const RE_GENDERED_CATEGORY = /\b(?:camisas?|camisetas?|playeras?|polos?|shirts?|tees?|t-shirts?|pantalon(?:es)?|jeans|mezclilla|shorts?|bermudas?|sudaderas?|hoodies?|sweat(?:er|shirt)s?|sueter(?:es)?|chamarras?|jackets?|abrigos?|coats?|chalecos?|trajes? de bano|swimsuits?|banador(?:es)?|ropa interior|underwear|calcetin(?:es)?|socks?|tenis|sneakers?|zapatos?|shoes?|botas?|boots?|sandalias?|sandals?|pijamas?|pajamas|disfra(?:z|ces)|costumes?|reloj(?:es)?|watch(?:es)?|lentes|gafas|sunglasses|perfumes?|colonias?|fragancias?|fragrances?|colognes?|ropa deportiva|activewear|ropa)\b/i

/** Gendered by the word itself — asking "¿hombre o mujer?" about a vestido is silly. */
const RE_SELF_GENDERED = /\b(?:vestidos?|faldas?|blusas?|brasier(?:es)?|bras?|bikinis?|tacon(?:es)?|heels?|corbatas?|tuxedos?|esmoquin|calzoncillos?|boxers?|lenceria|lingerie|maternidad|maternity)\b/i

/** Did we already put a narrowing card on screen in the last assistant turn? */
function askedToNarrowLast(messages: any[]): boolean {
  for (let i = (messages?.length || 0) - 1; i >= 0; i--) {
    const m = messages[i]
    if (m?.role === 'user') continue
    if (m?.role !== 'assistant') break
    return (m.parts || []).some((p: any) => p?.type === 'tool-ask_to_narrow')
  }
  return false
}

/**
 * True when the shopper named a category whose answer depends on WHO IT IS FOR,
 * and never said who.
 *
 * Deliberately narrow, because a shopper who wanted to browse must not be
 * interrogated. It stays quiet for an ask that is already specific (a size, a
 * pasted link, a long detailed sentence), for a category that is gendered by its
 * own name, and for a second question in a row.
 *
 * NOT quiet for a shopper whose profile has a saved gender. A saved gender is the
 * SHOPPER's, and people buy for other people — the polo may be for his wife.
 */
function audienceGap(messages: any[]): boolean {
  const t = plainText(lastUserText(messages)).toLowerCase()
  if (!t || /https?:\/\//i.test(t)) return false
  if (t.trim().split(/\s+/).length > 14) return false
  if (/\b(?:talla|size|medida)\b/i.test(t)) return false
  if (RE_SELF_GENDERED.test(t)) return false
  if (RE_AUDIENCE.test(t)) return false
  if (!RE_GENDERED_CATEGORY.test(t)) return false
  return !askedToNarrowLast(messages)
}

function restrictedAsk(messages: any[]): boolean {
  return RESTRICTED_RE.test(plainText(lastUserText(messages)))
}
// What a refusing tool hands back: no products, and an instruction the model cannot
// turn into a shopping answer.
const REFUSAL = {
  products: [],
  refused: true,
  note: 'BOXLY DOES NOT BRING THIS (tobacco/nicotine, weapons and ammunition, prescription or controlled medication, or live animals). Decline in ONE warm line and offer to help with something else. Do NOT call another tool for it, do NOT name a store, do NOT give a link, and do NOT explain how to get it another way.',
}

// The product tool — a turn that used it is a SEARCH in the analytics (see logSearch).
const PRODUCT_TOOLS = new Set(['live_gallery'])

// Tools that RENDER a product gallery on the client. We enforce "ONE gallery per
// reply" in CODE, not just the prompt: once one of these answers, a per-request flag
// flips and prepareStep() removes the gallery tools for the rest of the turn — so the
// model physically cannot fire a second one. live_gallery puts the live store browser
// up at once (its products land later, as a tool-live_results part the API appends);
// show_saved_products re-shows the chat's own registry and fetches nothing.
const GALLERY_TOOLS = ['live_gallery', 'show_saved_products']
// Everything the model may still use AFTER a gallery has rendered (write text, build the box, finalize…).
const NON_GALLERY_TOOLS = [
  'show_shipment', 'show_box_guide', 'feature_products', 'get_product_variants',
  'get_profile', 'list_orders', 'show_orders',
  // The WhatsApp handoff for something no box can take (a fridge, a mattress, a 60" TV). The prompt has told
  // the model to "call show_contact_whatsapp" for those all along and the card has always been rendered — the
  // tool was simply never in a toolset, so an un-boxable ask had nowhere to go (found 2026-09-16 by the
  // reachability test written for ask_to_narrow).
  'show_contact_whatsapp',
  'update_shopping_profile', 'create_self_order', 'cancel_order', 'plan_in_person', 'create_account',
  // Finalizar: the box becomes the Boxly cart's order, checked out live in each store (see finalize_order).
  'finalize_order',
]
// The loop toolset before a gallery has shown: everything except suggest_followups —
// the chips are generated OFF the loop (server/utils/followups.ts), so the model never
// spends a round-trip on them (its persisted parts are dropped from the transcript).
// ask_to_narrow belongs to the moment BEFORE a gallery: once rows are on screen the shopper refines by
// looking, not by answering a question. It is deliberately NOT in NON_GALLERY_TOOLS for that reason — and
// leaving it out of BOTH lists is how it shipped dead: registered, described, tested, and never once offered
// to the model, which went on searching "Halloween costume" blind (Alex, 2026-09-16).
const LOOP_TOOLS = [...GALLERY_TOOLS, ...NON_GALLERY_TOOLS, 'ask_to_narrow']
// Chats from before 2026-09-28 carry parts of tools that no longer exist. Their galleries are replayed to the model
// as one line of text (legacyToolsAsText) and the rest are dropped, so it is never shown a call to a tool it lacks.
const LEGACY_GALLERY_TOOLS = ['search_products', 'curate_products', 'show_collection', 'find_live_product', 'find_on_google', 'find_on_amazon', 'browse_store', 'browse_stores', 'show_products']
const LEGACY_TOOLS = ['web_search', 'extract_product', 'show_assisted_summary', 'finalize_lab_order', 'create_purchase_request']
// Registry id of a product (FNV-1a of its URL) — MUST match the JS/PHP implementations
// (ShoppingAssistant.vue / ConversationController::productId); used by the gallery markers.
function registryId(p: any): string | null {
  const key = p?.url || p?.product_url || (p?.title ? p.title + (p.store || '') : '')
  if (!key) return null
  let h = 2166136261
  for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0 }
  return 'p' + h.toString(36)
}

// Token efficiency: a gallery tool returns rich product objects, but most of each
// is DISPLAY-ONLY — the image URL, the buy/Google link, and especially the
// immersive `token` (an opaque page token that can be THOUSANDS of chars, used
// only by the frontend modal). The UI renders all of that from the full tool
// output; the MODEL never uses it. So we keep only the fields the model reasons
// over and feed THAT to the model via `toModelOutput`, while the client still
// receives the complete object. On a 16-item search that's the difference between
// the model re-reading ~16 long tokens + URLs every turn vs. a tiny summary.
const MODEL_FIELDS = ['id', 'title', 'store', 'price', 'was', 'on_sale', 'rating', 'reviews', 'discount_pct', 'deal_tier', 'why']
function compactProduct(p: any) {
  if (!p || typeof p !== 'object') return p
  const o: any = {}
  for (const k of MODEL_FIELDS) if (p[k] !== undefined && p[k] !== null) o[k] = p[k]
  if (p.snippet) o.snippet = String(p.snippet).slice(0, 140)
  return o
}
// toModelOutput for gallery tools: full output → client (rendering); compact
// products → model (context). Non-product fields (price_range, has_more…) pass through.
function galleryModelOutput({ output }: { output: any }) {
  if (output && Array.isArray(output.products)) {
    return { type: 'json' as const, value: { ...output, products: output.products.map(compactProduct) } }
  }
  return { type: 'json' as const, value: output ?? null }
}

// For convertToModelMessages: the SDK applies a tool's `toModelOutput` to HISTORY
// parts only when it is handed the tools — without this map every past gallery is
// replayed as the FULL product objects (~3× the compact size, per gallery, per turn).
const HISTORY_TOOLS: any = Object.fromEntries(GALLERY_TOOLS.map((t) => [t, { toModelOutput: galleryModelOutput }]))

// Analytics: a turn that used a product tool is a SEARCH, a turn with no product tool is
// a business QUESTION. BOTH are reported from here.
//
// The search half used to be written server-side inside /products/search, which saw the
// rows it served. Catalog reads now go straight to the catalog service (see below), so
// that endpoint stopped being called and search telemetry went dark on 2026-09-04 — the
// admin dashboard read 0 searches for ten days while questions kept flowing, which is
// precisely why nobody noticed. Reporting both from the same place means a future change
// of read path cannot silently take the analytics with it again.
function logEvent(body: Record<string, unknown>, auth: { cookie?: string; origin?: string; token?: string }) {
  const headers: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' }
  if (auth.cookie) headers.Cookie = auth.cookie
  if (auth.origin) headers.Origin = auth.origin
  if (auth.token) headers.Authorization = `Bearer ${auth.token}`
  fetch(`${API_BASE}/search-events`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  }).catch(() => {})
}

function logQuestion(question: string, answer: string, auth: { cookie?: string; origin?: string; token?: string }, conversationId?: number) {
  if (!question?.trim()) return
  logEvent({ type: 'question', query: question, answer, conversation_id: conversationId }, auth)
}

/**
 * The product tool this turn actually searched with, and what it served back. A live gallery's products land AFTER
 * the turn (the engine appends them), so its search is logged with results null — unknown, not zero — and the stores
 * it opened as the served query.
 */
export function searchFromSteps(steps: any[]): { query: string; results: number | null; broadened: boolean; served_query: string | null; results_sample: any[] } | null {
  for (const step of steps || []) {
    const results = new Map((step?.toolResults || []).map((r: any) => [r.toolCallId, r]))
    for (const call of (step?.toolCalls || [])) {
      if (!PRODUCT_TOOLS.has(call.toolName)) continue
      const input: any = call.input ?? call.args ?? {}
      // What the SHOPPER asked for: the words typed into the store's search box.
      const query = String(input.query ?? input.q ?? '').trim()
      if (!query) continue
      const out: any = (results.get(call.toolCallId) as any)?.output ?? (results.get(call.toolCallId) as any)?.result ?? {}
      const rows: any[] = Array.isArray(out?.products) ? out.products : []
      const stores: string[] = Array.isArray(out?.stores) ? out.stores : Array.isArray(input.stores) ? input.stores : []
      return {
        query,
        results: Array.isArray(out?.products) ? rows.length : null,
        broadened: false,
        served_query: stores.length ? `${query} @ ${stores.join(', ')}`.slice(0, 255) : null,
        results_sample: rows.slice(0, 12).map((p: any) => ({
          store: p?.store ?? p?.store_id ?? null,
          title: typeof p?.title === 'string' ? p.title.slice(0, 140) : null,
          price: typeof p?.price === 'number' ? p.price : null,
        })),
      }
    }
  }
  return null
}

function logSearch(steps: any[], auth: { cookie?: string; origin?: string; token?: string }, conversationId?: number) {
  const s = searchFromSteps(steps)
  // A search that served NOTHING is the most useful row in the table — it is demand we
  // failed — so it is reported exactly like one that served rows.
  if (s) logEvent({ type: 'search', ...s, conversation_id: conversationId }, auth)
}

// THE VARIANT READ GOES STRAIGHT TO THE CATALOG SERVICE (2026-09-11): the Laravel API only proxied it verbatim, and
// its small PHP-FPM pool stalled it behind slow calls. The service reads the product page live in our browser.
// (It is the only catalog-service call left in the chat: the catalog SEARCH went with the live store gallery.)
const CATALOG_BASE = 'https://catalog.fullstacklabs.org'
const CATALOG_DIRECT_RE = /^\/catalog\/product-variants(?:[/?]|$)/

// The stores the ENGINE can open (GET /live-shopping/stores — its catalog: id, name and, when known, the store's own
// url) and how many one session may open at once. Cached a minute per server instance (the API caches the engine the same minute); null when the
// engine is off or unreachable, which the tool reports honestly instead of guessing a store.
let liveStoresCache: { at: number, stores: LiveStore[], max: number } | null = null
async function liveStoreList(token: string): Promise<{ stores: LiveStore[], max: number } | null> {
  if (liveStoresCache && Date.now() - liveStoresCache.at < 60_000) return liveStoresCache
  const r: any = await callApi('/live-shopping/stores', { token, timeoutMs: 6000 }).catch(() => null)
  const stores = Array.isArray(r?.stores) ? r.stores.filter((s: any) => typeof s?.id === 'string' && typeof s?.name === 'string').map((s: any) => ({ id: s.id, name: s.name, ...(typeof s.url === 'string' ? { url: s.url } : {}) })) : []
  if (!stores.length) return liveStoresCache
  liveStoresCache = { at: Date.now(), stores, max: Number.isInteger(r?.max_stores_per_session) ? r.max_stores_per_session : 1 }
  return liveStoresCache
}

async function callApi(path: string, opts: { method?: string; body?: any; token?: string; timeoutMs?: number } = {}) {
  // No Origin header: this is a server-to-server call. Sending Origin:api.boxly.mx
  // makes Sanctum treat it as a stateful (browser) request and enforce CSRF,
  // which 419s these tokenless public calls. CORS doesn't apply server-side.
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (opts.body) headers['Content-Type'] = 'application/json'
  const direct = CATALOG_DIRECT_RE.test(path)
  if (opts.token && !direct) headers['Authorization'] = `Bearer ${opts.token}`
  const res = await fetch(`${direct ? CATALOG_BASE : API_BASE}${path}`, {
    method: opts.method || 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    // NEVER unbounded. A call with no deadline that never answers takes the whole turn
    // with it: the tool never returns, so the SSE stream just ends and the shopper is
    // left staring at a loader with no gallery, no text and no error — the exact shape
    // of the failures seen on 2026-09-12. Most call sites pass their own budget; the
    // ones that did not (profile, orders, shopping-trips, extract) were the unguarded
    // ones, and they hang hardest precisely when the API is already struggling.
    signal: AbortSignal.timeout(opts.timeoutMs ?? 15000),
  })
  const text = await res.text()
  let data: any
  try { data = JSON.parse(text) } catch { data = { raw: text } }
  if (!res.ok) return { ok: false, status: res.status, ...(data || {}) }
  return data?.data ?? data
}

// ── AUTHORITATIVE server-side turn persistence ──────────────────────────────
// History used to be written ONLY by the browser, after the stream reached
// 'ready'. That silently lost whole conversations whenever the client never got
// there: a disconnect/tab-close mid-turn, or a CLIENT-executed tool
// (create_account / create_self_order / cancel_order) that parks the chat waiting
// for a tool result the user never completes. onFinish runs SERVER-SIDE the moment
// generation finishes, regardless of the client — so persisting here captures the
// turn no matter what the browser does. (Best-effort; never blocks the reply.)

// Strip heavy base64 thumbnails from tool outputs so history rows stay small
// (mirrors the old client cleanParts — the live gallery already rendered them).
function stripBase64Products(output: any): any {
  const prods = output?.products
  if (!Array.isArray(prods)) return output
  return { ...output, products: prods.map((p: any) => (typeof p?.image === 'string' && p.image.startsWith('data:') ? { ...p, image: null } : p)) }
}

// Rebuild the assistant message's UI parts from the stream steps, in the SAME
// shape the admin viewer + chat resume expect: text parts and `tool-<name>` parts
// carrying { input, output, state }.
function assistantPartsFromSteps(steps: any[], finalText: string): any[] {
  const parts: any[] = []
  for (const step of steps || []) {
    const results = new Map((step?.toolResults || []).map((r: any) => [r.toolCallId, r]))
    for (const call of (step?.toolCalls || [])) {
      const r: any = results.get(call.toolCallId)
      const out = r ? (r.output ?? r.result) : undefined
      parts.push({
        type: 'tool-' + call.toolName,
        toolCallId: call.toolCallId,
        state: r ? 'output-available' : 'input-available',
        input: call.input ?? call.args ?? {},
        ...(out !== undefined ? { output: stripBase64Products(out) } : {}),
      })
    }
    const t = String(step?.text || '')
    if (t.trim()) parts.push({ type: 'text', text: t })
  }
  if (finalText?.trim() && !parts.some((p) => p.type === 'text')) parts.push({ type: 'text', text: finalText })
  return parts
}

// The user's NEW message = the last role:'user' entry sent this turn. Attached
// files become a light marker (never store base64 in history).
function userPartsFromMessages(messages: any[]): any[] | null {
  for (let i = (messages?.length || 0) - 1; i >= 0; i--) {
    const m = messages[i]
    if (m?.role !== 'user') continue
    const raw = Array.isArray(m.parts) ? m.parts : (typeof m.content === 'string' ? [{ type: 'text', text: m.content }] : [])
    const parts = raw
      .map((p: any) => (p?.type === 'file' ? { type: 'text', text: String(p.mediaType || '').includes('pdf') ? '📎 (PDF)' : '📎 (imagen)' } : p))
      .filter((p: any) => p && (p.type !== 'text' || String(p.text || '').length))
    return parts.length ? parts : null
  }
  return null
}

// Save this turn (new user message + assistant reply) to the conversation. No-op
// for guests / threads without an id or token.
async function persistTurn(conversationId: number | undefined, token: string | undefined, messages: any[], steps: any[], finalText: string, followups: string[] = [], { withUser = true } = {}) {
  if (!conversationId || !token) return
  const toSave: any[] = []
  const uParts = withUser ? userPartsFromMessages(messages) : null
  if (uParts) toSave.push({ role: 'user', content: { parts: uParts } })
  const aParts = assistantPartsFromSteps(steps, finalText)
  // Off-loop follow-up chips → the same tool part shape the UI renders on resume.
  if (followups.length) aParts.push(followupPart(followups))
  if (aParts.length) toSave.push({ role: 'assistant', content: { parts: aParts } })
  if (!toSave.length) return
  try {
    await callApi(`/conversations/${conversationId}/messages`, { method: 'POST', body: { messages: toSave }, token, timeoutMs: 10000 })
  } catch (e) {
    console.error('[assistant] persistTurn failed:', e instanceof Error ? e.message : e)
  }
}

// Replace attached PDF file parts with their extracted TEXT before the model sees
// them. WHY: not every chat model accepts a PDF document part (older Claude/Gemini
// variants reject it, which fails the whole turn — the "I sent a PDF and got no
// response" bug). Extracting text server-side makes PDFs work on ANY provider/model,
// and gives the model cleaner input than page images. Falls back to the original
// file part when a PDF has no text layer (e.g. a scan) so a vision model can still try.
async function pdfPartsToText(messages: any[]): Promise<any[]> {
  const out: any[] = []
  for (const m of messages || []) {
    if (!Array.isArray(m?.parts)) { out.push(m); continue }
    const parts: any[] = []
    for (const p of m.parts) {
      const isPdf = p?.type === 'file' && String(p?.mediaType || '').includes('pdf') && typeof p?.url === 'string'
      if (!isPdf) { parts.push(p); continue }
      try {
        const b64 = p.url.includes(',') ? p.url.slice(p.url.indexOf(',') + 1) : p.url
        const bytes = new Uint8Array(Buffer.from(b64, 'base64'))
        const pdf = await getDocumentProxy(bytes)
        const res: any = await extractText(pdf, { mergePages: true })
        const clean = (Array.isArray(res?.text) ? res.text.join('\n') : String(res?.text || '')).trim()
        if (clean.length >= 20) {
          const name = p.filename ? ` "${p.filename}"` : ''
          parts.push({ type: 'text', text: `[Documento PDF adjunto por el cliente${name} — contenido extraído:\n${clean.slice(0, 12000)}\n]` })
        } else {
          parts.push(p) // no extractable text (scanned) → let a vision model try the file
        }
      } catch {
        parts.push(p) // extraction failed → fall back to the raw file part
      }
    }
    out.push({ ...m, parts })
  }
  return out
}

// No-arg tool calls (show_orders, list_orders, show_shipment…) get persisted with
// `input` as an empty ARRAY [] instead of {}. Replayed to Gemini, that serializes
// functionCall.args as a list, which the API hard-rejects ("Unknown name args …
// Proto field is not repeating, cannot start list") and kills the whole turn with
// no reply — the real cause of "I sent a message and got nothing back". Coerce any
// array tool input back to a plain object.
function sanitizeToolInputs(messages: any[]): any[] {
  return (messages || []).map((m) => {
    if (!Array.isArray(m?.parts)) return m
    const parts = m.parts.map((p: any) =>
      typeof p?.type === 'string' && p.type.startsWith('tool-') && Array.isArray(p.input)
        ? { ...p, input: {} }
        : p
    )
    return { ...m, parts }
  })
}

// Drop tool-call parts that never reached a terminal state (no output) before
// replaying history to the model. A tool_use without a matching tool_result is
// invalid for Anthropic and makes the next turn fail silently — which happens
// if a tool call gets cut off at the end of a stream (e.g. a slow enrichment).
function stripIncompleteToolCalls(messages: any[]) {
  return (messages || []).map((m) => {
    if (m?.role !== 'assistant' || !Array.isArray(m.parts)) return m
    const parts = m.parts.filter((p: any) =>
      typeof p?.type === 'string' && p.type.startsWith('tool-')
        ? p.state === 'output-available' || p.state === 'output-error'
        : true
    )
    return { ...m, parts }
  })
}

// Short human date (es-MX) for order cards. Server-side (Node Intl); null-safe.
function fmtDate(d: any): string | null {
  if (!d) return null
  try {
    const dt = new Date(d)
    if (isNaN(dt.getTime())) return null
    return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }).format(dt)
  } catch { return null }
}
// Trim a full order row to just what the tracking card + model need.
function compactOrder(raw: any) {
  if (!raw || typeof raw !== 'object') return raw
  const items = Array.isArray(raw.items) ? raw.items : []
  return {
    id: raw.id,
    order_number: raw.order_number || '—',
    status: raw.status || 'collecting',
    order_type: raw.order_type || 'shipping',
    tracking_number: raw.tracking_number || null,
    item_count: items.length || (raw.items_count ?? 0),
    created: fmtDate(raw.created_at),
    eta: fmtDate(raw.estimated_delivery_date),
  }
}

// ── Live BOXLY shipment (consolidation box) PACKING ESTIMATE ──────────────────
// Don't estimate by item COUNT — classify each item into a packing ARCHETYPE and
// convert to a volume in "shoe-units" (1 = one boxed pair of shoes). Box tiers are
// calibrated to real-world benchmarks. Soft items are pre-discounted for
// compressibility; small rigid items (sanitizers, cosmetics) add very little. It's
// an ESTIMATE — the real box is confirmed when Boxly receives and packs the items.
//
// Calibration (updated 2026-06-29 to the new box capacities). Folded-clothes
// capacity per box: S ~10–15, M ~24–34, L ~38–48, XL ~52–72 prendas, at
// flat_soft = 0.30 shoe-units/garment. VOLUME, not count: 10 small sanitizers
// barely move the bar; one thick coat fills more than many shirts. Shoes are boxed
// pairs and are NOT part of the prenda capacity.
// The archetype model itself lives in server/utils/boxMath.ts — ONE table, because
// this file used to keep a second copy of it and the two drifted: rigid_large and
// oversize_long were added here on 2026-09-15 and never there, so this card sized a
// PlayStation at 2.20 while the cost card beside it (which reads boxMath) sized the
// same console at the 0.40 default. Only the DISPLAY ladder is local — chat shows the
// four sizes the box guide lists, while pricing uses all seven.
//
// usable = volume at which the box is full (in shoe-units), calibrated so the
// flat_soft prenda counts above land on the right box. max_kg is the box guide's
// published weight limit, and it is a real lid: a bowling ball is ~5% of a Chica by
// volume and half of its 15 kg allowance.
//
// The XS box is DISCONTINUED (2026-08-16) — Chica is the floor. A tiny shipment
// now reads "S, barely full" instead of quoting a box we no longer sell; the
// concierge told a customer a set shipped "en una caja Extra Chica" for $1,300
// while the site had already stopped listing it.
const BOXES = [
  { key: 'S', label: 'Chica', usable: 4.5, max_kg: 15 },
  { key: 'M', label: 'Mediana', usable: 10, max_kg: 25 },
  { key: 'L', label: 'Grande', usable: 14.5, max_kg: 35 },
  { key: 'XL', label: 'Extra grande', usable: 21.5, max_kg: 50 },
]
// The last product link the shopper pasted in this conversation — the fallback URL for a box item that has no
// registry entry. Scans newest-first and skips our own domains. Pure.
function lastPastedUrl(msgs: any[]): string | null {
  for (let i = (msgs?.length || 0) - 1; i >= 0; i--) {
    const m = msgs[i]
    if (m?.role !== 'user') continue
    const text = (m.parts || []).filter((p: any) => p?.type === 'text').map((p: any) => p.text).join(' ')
    const hit = [...String(text).matchAll(/https?:\/\/[^\s<>"')]+/gi)].map((x) => x[0]).filter((u) => !/boxly\.mx|localhost/i.test(u)).pop()
    if (hit) return hit.replace(/[.,;]+$/, '')
  }
  return null
}

// The product link in the shopper's NEWEST message only (the picker's add names the picked style's page). Pure.
function newestUserUrl(msgs: any[]): string | null {
  const m = [...(msgs || [])].reverse().find((x: any) => x?.role === 'user')
  const text = (m?.parts || []).filter((p: any) => p?.type === 'text').map((p: any) => p.text).join(' ')
  const hit = [...String(text).matchAll(/https?:\/\/[^\s<>"')]+/gi)].map((x) => x[0]).filter((u) => !/boxly\.mx|localhost/i.test(u)).pop()
  return hit ? hit.replace(/[.,;]+$/, '') : null
}

function buildShipment(items: any[]) {
  const norm = (items || []).map((it) => {
    const quantity = Math.max(1, Number(it.quantity) || 1)
    const type = archetypeOf(it.name || '', it.type)
    return {
      saved_id: it.saved_id || null,
      name: it.name || 'Producto',
      quantity,
      size: type ? ARCH_LABEL[type] : 'Mediano',
      units: itemUnits(it.name || '', it.type) * quantity,
      kg: itemKg(it.name || '', it.type) * quantity,
      // No box on the ladder takes this one, whatever the model called it.
      unboxable: isUnboxable(it.name || '', it.type),
      chosen: [it.color, it.size].filter(Boolean).join(' · ') || null,
      image: it.image || null,
      price: it.price ?? null,
    }
  })

  // A pool is not a big item in the box, it is an item that is not in the box.
  // Sizing it as one is how "Intex Rectangular Frame Above Ground Pool" came out
  // as 0.80 shoe-units and the card invited Alex to add more (2026-09-16).
  const packed = norm.filter((i) => !i.unboxable)
  const freight = norm.filter((i) => i.unboxable)

  const total = packed.reduce((s, i) => s + i.units, 0)
  const kg = packed.reduce((s, i) => s + i.kg, 0)
  // Smallest box that holds it, allowing ~15% overflow on VOLUME so a near-full
  // box reads "S llena" instead of jumping to "M 30%" — this prevents the bad
  // tier jumps. Weight gets no such squeeze: you cannot compress a bowling ball.
  const box = fitTier(BOXES, total, kg)
  const volPct = Math.round((total / box.usable) * 100)
  const kgPct = Math.round((kg / box.max_kg) * 100)
  // The bar shows whichever lid is closer, because that is the one that decides
  // whether the next item fits. Seven kilos of bowling ball is 5% of a Caja Chica
  // by volume and 47% of what it may weigh.
  const usedPct = Math.max(3, Math.min(100, Math.max(volPct, kgPct)))
  // A GUESS MULTIPLIED NINETY TIMES IS NOT AN ESTIMATE ANY MORE.
  //
  // Every per-piece volume here is inferred from a product TITLE, so it is good to
  // maybe a factor of two. At three items that is the difference between "half full"
  // and "quite full" and nobody is harmed. At ninety it is the difference between one
  // box and three — the error never grows, the consequence does. A real customer was
  // told 90 packs of face wipes filled a Caja Chica at 100%, and invited to finalise,
  // when 90 needed a Grande (Alex, 2026-09-21).
  //
  // So at bulk the card stops nudging and the model is told what it may not claim.
  const BULK_QTY = 25
  const bulk = packed.some((i) => i.quantity >= BULK_QTY)
  return {
    items: norm,
    bulk,
    box_key: box.key,
    box_label: box.label,
    capacity_used_pct: usedPct,
    capacity_left_pct: 100 - usedPct,
    limited_by: kgPct > volPct ? 'weight' : 'volume',
    weight_kg: Math.round(kg * 10) / 10,
    max_kg: box.max_kg,
    // Named, so the card can say so and the model can hand them to a human.
    unboxable: freight.map((i) => i.name),
    // Everything in this shipment is freight — there is no box to draw at all.
    all_unboxable: !!freight.length && !packed.length,
  }
}

// Boxly's box table (shipping cost per consolidated box to Mexico) as shown in
// chat. Dimensions/weights/capacity live here; the PRICES are pulled live from
// Stripe by boxGuide() below — these values are only the offline fallback, so
// the concierge can never quote a price the customer won't actually be charged.
const BOX_GUIDE = [
  { key: 'S', label: 'Chica', price_mxn: 2400, dims: '42×27×32 cm', max_kg: 15, fits: '~10–15 prendas dobladas' },
  { key: 'M', label: 'Mediana', price_mxn: 4400, dims: '42×52×40 cm', max_kg: 25, fits: '~24–34 prendas dobladas', popular: true },
  { key: 'L', label: 'Grande', price_mxn: 5600, dims: '52×42×40 cm', max_kg: 35, fits: '~38–48 prendas dobladas' },
  { key: 'XL', label: 'Extra grande', price_mxn: 6900, dims: '52×62×53 cm', max_kg: 50, fits: '~52–72 prendas dobladas' },
]

// LIVE box prices, read from the Stripe catalog (/products) and cached for a few
// minutes so a price change reaches the chat without a deploy. Each size has
// several active prices — the list price is the highest for that size; the
// cheaper ones are the in-between amounts used for odd shipments and must never
// be quoted as the public price. shipping=false is the border-pickup "Crossing"
// catalog, a different service entirely.
// "Extra Small Box" is deliberately absent: it still exists in Stripe for boxes
// already in flight, and mapping it here would put a retired size back in the
// table the concierge quotes from.
const BOX_SIZE_BY_NAME: Record<string, string> = {
  'small box': 'S', 'medium box': 'M', 'large box': 'L', 'extra large box': 'XL',
}
let boxPriceCache: { at: number; prices: Record<string, number> } | null = null
async function boxGuide() {
  if (!boxPriceCache || Date.now() - boxPriceCache.at > 10 * 60 * 1000) {
    try {
      const res = await callApi('/products', { timeoutMs: 8000 })
      const next: Record<string, number> = {}
      for (const p of Array.isArray(res) ? res : []) {
        if (String(p?.shipping) !== 'true') continue
        const size = BOX_SIZE_BY_NAME[String(p?.name || '').trim().toLowerCase()]
        const price = Number(p?.price)
        if (!size || !Number.isFinite(price)) continue
        if (next[size] === undefined || price > next[size]) next[size] = price
      }
      // Only accept a COMPLETE table; a partial catalog must not half-update the
      // quote the customer sees.
      if (BOX_GUIDE.every((b) => next[b.key] > 0)) boxPriceCache = { at: Date.now(), prices: next }
    } catch { /* keep the last good prices, or the static fallback above */ }
  }
  const live = boxPriceCache?.prices
  return BOX_GUIDE.map((b) => ({ ...b, price_mxn: live?.[b.key] ?? b.price_mxn }))
}

// The per-shopper, per-turn context: long-term memory + the in-chat product
// registry. Kept SEPARATE from systemPrompt() so it can be sent as its own
// (uncached) system block — it changes during a conversation, while the big
// static instructions above stay byte-identical and stay cached.
/**
 * What the model is told when audienceGap() has fired.
 *
 * prepareStep already guarantees it CAN only call ask_to_narrow; this says what
 * the question is about, so it doesn't ask about colour or budget instead. The
 * wording, the language and the option order are still its own.
 */
function narrowBlock(mustNarrow: boolean): string {
  if (!mustNarrow) return ''
  return 'THIS ASK IS MISSING WHO IT IS FOR, and that changes which products come back. Call ask_to_narrow — nothing else — with ONE short question asking who the item is for, in the shopper\'s own language, and 2-3 tappable answers (hombre / mujer / niño, or whichever fit this category). Write NO other text: the card asks it. If their profile has a saved gender, put that option FIRST but still offer the others — they may be buying for someone else. The moment they tap, search with it.'
}

function shopperContext(loggedIn: boolean, shoppingProfile: any, savedProducts: any[] = []): string {
  const profileBlock = !loggedIn
    ? ''
    : (shoppingProfile && Object.keys(shoppingProfile).length
      ? `\n\nLONG-TERM MEMORY FOR THIS SHOPPER (persists across EVERY chat — this is what makes you feel personal). Apply it on every search WITHOUT being asked: use their saved sizes, favorite brands, budget and interests automatically, and never re-ask for those. ONE EXCEPTION — WHO THE PURCHASE IS FOR. A saved gender is the SHOPPER's own, not the recipient's, and people buy for other people: a man shopping for a polo may be shopping for his wife. So a saved gender NEVER answers "¿para quién es?" for a category where it changes which products come back (ropa, calzado, relojes, perfumes, disfraces) — ask that one with ask_to_narrow and let them tap. Use the saved gender only to ORDER the options, putting theirs first. Keep it current with update_shopping_profile the moment you learn something new:\n${JSON.stringify(shoppingProfile)}`
      : `\n\nLONG-TERM MEMORY FOR THIS SHOPPER: empty so far. As you learn durable facts (gender, sizes, favorite/disliked brands, the categories they shop for, budget, style), save them with update_shopping_profile so future chats feel personal and you never have to ask twice. Never ask or record why they buy.`)
  const savedBlock = savedProducts && savedProducts.length
    ? `\n\nPRODUCTS ALREADY SHOWN IN THIS CHAT (single source of truth — persists across the whole conversation). If the user refers to one ("tráeme ese hoodie", "el segundo", "el que vimos antes"), re-display it with show_saved_products(ids) using the id below — do NOT re-search for it. MORE OF A KIND ALREADY SHOWN ("quiero agregar más velas", "otra vela", "enséñame las velas otra vez") → call show_saved_products with EVERY id of that kind from that store below, so the same gallery comes back as cards — NEVER answer with a text list of them. Search again (live_gallery) only when they ask for something those don't cover (another scent/type/store, "otras", "más opciones"). You can also order one directly using its listed (exact) price:\n`
      + savedProducts.slice(-40).map((p: any) => `- ${p.id}: ${p.title}${p.store ? ' — ' + p.store : ''}${p.price ? ' — ' + (p.price_from ? 'desde $' : '$') + p.price + (p.on_sale && p.was ? ' (oferta, antes $' + p.was + ')' : '') : ''}`).join('\n')
    : ''
  return (profileBlock + savedBlock).trim()
}

function systemPrompt(loggedIn: boolean, knowledge = '') {
  const knowledgeBlock = `\n\n=== BASE DE CONOCIMIENTO (Modo Experto — responde preguntas del negocio SOLO con esto, y CON SUS DATOS ESPECÍFICOS: repite los tiempos, días, números, condiciones y reglas EXACTOS que aparezcan aquí; nunca des una versión vaga o generalizada que omita esos detalles) ===\n${knowledge || 'No disponible ahora — si te preguntan algo del negocio que no sepas con certeza, dilo y ofrece WhatsApp.'}\n=== FIN BASE DE CONOCIMIENTO ===`

  return `You are the BOXLY CONCIERGE — a warm, expert guide who helps customers in Mexico buy from the United States. THE CONVERSATION IS THE PRODUCT: you help people like a top-performing sales rep would — answer their questions, build their confidence, help them find the right thing, and get it ordered. Product search is just ONE tool you reach for during that conversation (think Perplexity, not Google). Boxly's edge is the WHOLE job: you find U.S. products, BOXLY BUYS them for the customer, imports them to Mexico, and delivers to their door. No U.S. card, no VPN, no blocked stores.

You work in THREE modes inside ONE conversation — switch fluidly as the customer's need changes:

MODE 1 — EXPERT (answer questions). Use the KNOWLEDGE BASE below to answer anything about how Boxly works: tiempos de envío, el casillero, precios y comisiones, compra asistida, rastreo, restricciones, sourcing internacional, pagos. Answer ONLY from the knowledge base; if it isn't there, say so honestly and offer WhatsApp — never invent policy, prices or timeframes.
   USE THE SPECIFICS — THIS IS CRITICAL. When the knowledge base covers the question, answer with its EXACT details: the concrete timeframes, numbers, days, conditions, rules and steps it states — repeat them faithfully. Do NOT give a vague, generic, or "safe" paraphrase that drops the specifics (e.g. if the base says "el cruce tarda 2–3 días" and "los embarques aéreos salen solo de lunes a jueves", you MUST say exactly that — not just "no hay entrega el mismo día"). A correct answer includes the actual figures and conditions from the base, not a softened summary. Being concrete is more important than being short; only stay brief by trimming filler, never by dropping the real facts. If the base has a specific rule for the exact situation asked, lead with that rule. After answering, gently move forward ("¿Qué te gustaría comprar?").
   BOXES — EXACTLY FOUR. Boxly sells Chica, Mediana, Grande and Extra grande; Chica is the smallest and cheapest. There is NO "Extra chica", "XS" or extra-small box (retired) — never mention, quote or suggest one, even if older text says so. For prices use show_box_guide.
   RESTRICTED / SPECIAL ITEMS — CHECK THE BASE FIRST. When the customer asks to buy or bring a specific KIND of item (alcohol/bebidas alcohólicas, perfumes, supplements, electronics, etc.), first check whether the knowledge base has a RULE or restriction for it. If it does, answer with THAT rule — do NOT run a product search instead, and do NOT state a policy that contradicts the base. Example: the base says alcoholic beverages "se manejan a riesgo del cliente, sin garantías" — so you say exactly that; you must NOT claim "Boxly no puede importar alcohol" (that contradicts the base) nor promise disponibilidad/aprobación/entrega. NEVER contradict the knowledge base: never say something is impossible/prohibited, or guaranteed, unless the base says so.

  ⛔ BOXLY DOES NOT BRING THESE, EVER — decline, in one warm line, and move on (Alex, 2026-09-13). This is the ONE place you may say something is not possible without the base saying it, because the base is silent on them and silence was being answered with a purchase link:
  • tobacco and nicotine — cigarettes/cigarros, puros, vapes, e-cigarettes, nicotine pouches, hookah/shisha
  • weapons — firearms, ammunition, gun parts, tasers, pepper spray
  • prescription and controlled medication — anything needing a prescription, plus controlled substances
  • live animals of any kind
  Say plainly that Boxly cannot bring that, then offer to help with something else ("Eso no lo podemos traer, pero dime qué más buscas y te lo consigo 🛒"). Do NOT run ANY tool for it, do NOT show a gallery, do NOT name a store or link where it could be bought, and do NOT describe how someone might get it another way. A shopper asked for "cigarros marlboro" and got a live link to buy a carton — that must never happen again.
  This list is EXACT, not a theme. Vitamins, supplements and over-the-counter remedies are NORMAL products — sell them. So are kitchen knives, tools, toy/water/nerf guns, airsoft and paintball gear, pet food and pet supplies, and alcohol (alcohol stays on the knowledge base's rule above, NOT on this list).


MODE 2 — PRODUCT DISCOVERY, LIVE IN THE STORES (find things). Every product request is answered with live_gallery: it opens the store's OWN website in a real browser the shopper watches in the chat, searches the store's own search box, and the gallery (photo, name, price, link) lands in the chat by itself about 10–30 s later. There is no other product search — no catalog, no web search — so never answer a product ask with text alone, and never with products from memory.
  • WHERE: the store they named (a brand's own store: "tenis Nike" → Nike; "leggings Alo" → Alo). If they named none, the best-known stores for that category among LIVE STORES (the list is in the context block, with how many stores one search may open). A store that is not on LIVE STORES cannot be opened live yet — say so in one line and offer the closest one that is.
  • WHAT: query = what to type in the store's search box, SHORT and IN ENGLISH ("tacos de americano" → "football cleats", "tenis" → "sneakers", "sudadera" → "hoodie", "tele" → "tv"). No store names, prices or sizes in it.
  • WHAT THE SHOPPER SEES: the instant you call live_gallery the chat itself shows them a message in your voice — "¡Va! Déjame revisar New Balance por ti 🔎 Abro su tienda en un navegador en vivo…" — then the live browser, then the gallery. So call live_gallery RIGHT AWAY and write NO text of your own before or after it (it would say the same thing twice). Only when it cannot start (or a store you asked for cannot be opened live) do you write ONE short line. NEVER list, invent or promise products, prices or links — the gallery speaks for itself when it lands.
  THESE ARE ALL PRODUCT ASKS TOO, and each deserves live_gallery (after at most ONE narrowing question): a COMPARISON ("¿Nike o Adidas?" → both stores in one search, then compare the real items), ONE WORD or an EMOJI ("audífonos", "🎮" → video games and consoles, "👟" → sneakers), a STORE with no item ("qué hay en Target" → ask what they want there, then search it), a promo ask ("ofertas en Alo", "¿hay promociones en Target?", "promos de Walmart USA" → live_gallery RIGHT AWAY, NO narrowing question, searching that store for "sale" (or "deals"/"clearance" if that is the store's word; with an item named, that item + "sale"); its gallery shows each item's real was-price when it is on sale — never promise discounts the store does not have). AN iPHONE (new phone, not a case/charger) is searched at Walmart even when they name Best Buy or Target: those two only sell it tied to a US carrier plan, which cannot work in Mexico; say so in one short line and show Walmart's unlocked ones.

"VER MÁS" — the gallery's own button sends \`Ver más: "<query>" en <stores>\`: call live_gallery AT ONCE with EXACTLY that query (character for character) and those stores — no question, no narrowing, no other words in the query. The live store browser answers it with the NEXT products of that search (it skips the ones already shown). Say nothing but the usual one short line.
ONE QUESTION BEFORE A VAGUE SEARCH, NEVER MORE. The live browser has to go somewhere SPECIFIC. When the ask is too broad to search a store with — who it is for is missing ("un disfraz de Batman": hombre, mujer o niño are three different products), no product type ("un regalo", "algo para el gym", "ropa"), or only a store name ("Gymshark"; a store + promos/ofertas is NOT this — search its sale) — call ask_to_narrow with ONE question and 2-4 tappable answers, in a turn of its own, and say nothing else. The card asks it; do not repeat the question in your text and do not call live_gallery in the same turn. Then search with what they tapped. NEVER ask about size or colour (the picker handles those), never twice in a row, and never for an ask that is already specific — "tenis Nike Pegasus 41" goes straight to live_gallery.

MODE 3 — BUILD THE BOX, THEN FINALIZE (where the money is made). The box IS their real cart: every item the box card shows goes into their Boxly cart at once, and they keep shopping. The point is to CONSOLIDATE several stores into one box: after each add, push for more from that store, then for the next store. When they tap Finalizar, the Boxly agent fills each store's REAL cart and checks out (live in the chat), creates their purchase request and sends the invoice with its Stripe payment link.
  ⓪ PICK, THEN ADD. When the shopper picks a product from the gallery ("quiero ese", "el segundo", a tap on "Agregar"), call show_shipment with EVERY item in the box — each with its saved_id (the registry id of the product), quantity and packing type. A product with real sizes/colours comes back "NOT IN THE BOX" and its picker card in the chat shows the options: say one line asking for the pick, never claim it was added, and add it on the NEXT turn with size/color set. When the shopper TYPES their choice for a product whose picker card is in the chat ("la negra en talla 9"), call show_shipment adding that product (its saved_id) with what they said — the box checks their words against the card and adds it only on an exact, in-stock match; otherwise it tells you what to ask. A product with nothing to choose is added immediately.
  ① AFTER show_shipment, FOLLOW THE TOOL'S NOTE EXACTLY. Its note says whether the item is now in their box (the store cart is built at Finalizar: confirm it and push for more from that store, then other stores) or being put in the store's cart live (then write EXACTLY the line it gives, nothing else). Never claim an item is in a STORE's cart unless a message says the store confirmed it.
  ② A PASTED PRODUCT LINK is a product they already chose: add it with show_shipment (pass url, and a short name from the link). The box reads the product page itself — photo, price, sizes/colours — and the same pick-then-add rule applies. (A link from a store that is NOT on LIVE STORES — eBay, Temu, Shein… — cannot be bought by the agent: the tool says so; offer the same kind of product from a store on LIVE STORES. A store ON LIVE STORES is bought from, outside sellers included on Walmart and Amazon.)
  ③ FINALIZE ONLY WHEN THEY'RE DONE — "eso es todo", "ya", "créala", "haz el pedido", "finaliza", or the "Finalizar carrito" button. Then call finalize_order (no input): it places the order from the box; the agent builds each store's cart in the background and the invoice is EMAILED to them in a few minutes (it also appears in the chat's order card with Pagar). After it succeeds, write ONE short line: they can watch live right here as we build their cart in each store, and the invoice arrives by email in a few minutes (so closing the app is fine too). Do NOT ask for anything first and do NOT make them confirm twice. Adding items NEVER places the order.
  ⚑ AFTER A FINALIZE, A NEW BOX. Once finalize_order succeeded, that box is CLOSED (its order is placed). If they keep shopping in this chat, it is a NEW order: the next show_shipment lists ONLY the items added after the finalize — never re-list what was already ordered.
  ⚑ "QUIERO AGREGAR ALGO MÁS" — ASK, don't guess a brand. When they want to add more but do NOT say WHAT, ask what they'd like, framed around the box value: "Tienes espacio de sobra en tu caja 📦 — ¿qué más te late sumar para aprovechar el mismo envío? ¿Ropa, tenis, algo de tecnología, para la casa, un regalo…?" Then search that.
  ⚑ COMMIT TO A PRODUCT = GO STRAIGHT TO ITS PAGE. When the shopper asks about the sizes, colours or stock of a product already on screen, call get_product_variants({saved_id}) — it reads that product's own page live. Never search again for a product that is already on screen (show_saved_products re-shows it).
  ⚑ A PICK IS A PICK. When their message names a size/colour for a product in the box or just shown ("Quiero los X en talla 9", "talla M, color negro", a tapped chip), that IS their choice: add it with show_shipment carrying that size/color and confirm in one short line. Do not re-read variants unless they say the size they want isn't listed.

BUYING IN VOLUME IS A DIFFERENT CONVERSATION. When someone asks for a QUANTITY of one product ("quiero traer 130 piezas", "cuántas caben", "para revender"), they are pricing inventory, not shopping. The one thing worth saying out loud is the direction: the box is a single cost spread over every piece, so each extra piece lands cheaper. And DO NOT invent how many fit: give the box guide (show_box_guide) and the live box estimate (show_shipment), say the final size is confirmed when we pack it, and never state a piece-count capacity as fact — a guessed "caben entre 100 y 140" is a number the customer will hold us to. For a large order, offer the human: our purchasing team can confirm stock, price at volume and lead time before anything is paid.
CONSOLIDATION IS THE CORE VALUE — YOU BUILD SHIPMENTS, NOT SINGLE PRODUCTS. Boxly's real magic is buying multiple items from multiple US stores and CONSOLIDATING them into ONE box to Mexico — so the customer does NOT pay per-product shipping. Frame everything as building ONE Boxly shipment: when they add an item, treat it as adding to their shipment, note it consolidates cheaply with the rest, and INVITE them to add more to make the most of the box ("¿Quieres agregar algo más a tu envío? Lo juntamos todo en una sola caja y te ahorras en envío 📦"). Think Costco/Amazon: a fuller box is better value. NEVER imply each product ships separately, and NEVER quote a per-product shipping cost as final — the real shipping depends on the whole consolidated box and is quoted at the end. EVERY time the shipment changes (an item added/removed or a quantity changed), call show_shipment with ALL items currently in the shipment — it renders the live box (recommended size, volume bar, capacity left). For EACH item set its packing type (archetype) by the physical VOLUME it occupies, NOT by item count — two orders with the same number of products can need completely different boxes. The tiers: OCUPAN MUY POCO → rigid_small (cosméticos, maquillaje, perfumes, joyería, accesorios, fundas de celular, cables, sanitizers tipo Touchland, carteras pequeñas — agregar varios casi nunca cambia el tamaño de caja); PAQUETE DE FARMACIA → toiletry (toallitas desmaquillantes, shampoo, acondicionador, jabón líquido, desodorante, bloqueador, discos de algodón, pañales — el doble que un perfume y pesan, porque son mojados; un bote de toallitas NO es un labial); OCUPAN POCO → flat_soft (playeras, leggings, shorts, ropa interior, calcetines, trajes de baño — se comprimen muy bien); OCUPAN MEDIO → medium_soft (jeans, sudaderas, pants/joggers, chamarras ligeras, bolsas medianas, mochilas); OCUPAN MUCHO → bulky_soft (botas, chamarras gruesas, cobijas, almohadas, peluches, cascos, electrodomésticos como ollas o cafeteras — suben rápido el tamaño); ELECTRÓNICA GRANDE EN CAJA → rigid_large (consolas PlayStation/Xbox/Switch, monitores, impresoras, microondas, freidoras de aire, aspiradoras — son rígidos, NO se comprimen y la caja del producto es casi todo el volumen; una consola NO es un termo); LARGO Y RÍGIDO → oversize_long (manubrios de bici, patinetas, palos de golf, esquís, guitarras — no caben junto con lo demás y prácticamente piden su propia caja); NO CABE EN NINGUNA CAJA → oversize_freight (albercas armables, colchones, refrigeradores, lavadoras, sofás, camas, caminadoras, asadores, TVs de 55" o más — la caja más grande mide 52×62×53 cm, así que NO existe caja para esto: el artículo NO entra a la caja, no lo presentes como si cupiera, y llama show_contact_whatsapp para que el equipo lo cotice como carga especial). Y EL PESO TAMBIÉN ES UN LÍMITE: la caja Chica aguanta 15 kg, Mediana 25, Grande 35, Extra grande 50. Una bola de boliche pesa ~7 kg y ocupa casi nada, así que la barra puede ir por PESO y no por volumen — cuando la tarjeta diga que el límite es el peso, no invites a agregar más cosas pesadas. So e.g. 10 hand sanitizers barely move the bar (NO box-tier bump), but a single peluche gigante can take more space than veinte playeras. Present the box as PROVISIONAL: say it's an estimate of how the box is filling and that the FINAL size is confirmed when Boxly receives and packs everything — never claim an exact size. Then nudge: lots of room left → suggest adding more; nearly full → suggest finalizing. And when they ask about box SIZES or SHIPPING PRICES ("¿cuánto cuesta el envío?", "¿qué cajas hay?", "¿cuánto cuesta mandar una caja?"), call show_box_guide to drop the price table into the chat, then answer briefly — clarify the box price is the shipping for the whole consolidated box (product + 15% comisión aparte).

YOUR VOICE — a U.S. BUYING CONCIERGE, not a shopping search engine and not a product reviewer. Frame everything as helping them ACQUIRE U.S. products and get them to Mexico — most customers aren't browsing for fun, they want a way to GET U.S. stuff that they otherwise can't. Naturally remind them what Boxly does end-to-end: lo COMPRA por ellos (sin tarjeta de EE. UU.), lo RECIBE en Estados Unidos, lo IMPORTA a México y lo ENTREGA a su puerta. NEVER use reviewer language ("¡qué bonita!", "me encanta", "qué linda opción", "excelente colección").

BE A BOXLY INSIDER (your moat) when you genuinely know it — from the knowledge base or well-known facts — so you feel different from a generic assistant: which US stores don't ship to Mexico or reject Mexican cards (so Boxly is the only way to get it), what Boxly customers and resellers commonly buy, items people often consolidate together. NEVER invent specifics — if you're not sure, don't claim it.${knowledgeBlock}

CRITICAL — NEVER invent products. You may ONLY talk about a product (name, URL, price, image) that is on screen in THIS conversation — a live gallery, a product in the box, or one the shopper pasted. NEVER type a product from memory/training — it will be wrong. If a live gallery came back empty, say so and offer another search or store; never fill the gap with remembered products.

CRITICAL — NEVER claim an order/request was created, and NEVER state or invent a request/order NUMBER (e.g. "PR-26-…"). You do NOT place orders by writing about them: finalize_order places it, and its checkout card shows the real request, the store totals and the invoice. So your own text must NEVER contain a PR number, a total or an invoice amount — the card shows them. Claiming a request exists when finalize_order did not succeed is the single worst thing you can do.

CRITICAL — ONE gallery per reply. Call live_gallery AT MOST ONCE per user message (several stores go in that one call). If it could not start, say so in one line and offer to try again — do not fire it again and again.
CRITICAL — NEVER narrate or announce the gallery. The gallery renders by itself from the tool result. Do NOT write meta lines like "(aquí aparecería la galería)", "la galería aparece arriba/abajo", "a continuación te muestro", or "déjame buscar". Never describe the act of showing them, and never repeat your reply twice.
CRITICAL — NEVER print product data as text or JSON. The products are ALREADY on screen as cards from the tool result. Do NOT write a list of them, a table, or a code/JSON block like {"gallery":[…]} or "(Aquí el catálogo:)". Your text is ONLY the short human line about them — no data, no braces, no markdown code fence, ever.
CRITICAL — WHEN THE GALLERY IS ON SCREEN (it lands as "[Galería en vivo mostrada en el chat …]" with its products in PRODUCTS ALREADY SHOWN), you can SEE the exact items — names, prices, was-prices — so when the shopper talks about them, answer like a real shopping assistant: highlight a standout or the best deal BY NAME and say why, compare the ones they ask about, and point to the next step (pick one → the box). Put the EXACT name of an item you spotlight in **bold** — bolding a name floats that card to the front of the gallery. Bold ONLY names that are in that gallery.

- IMAGES & PDFs: the user can attach a photo OR a PDF (image = a product to find; PDF = usually a purchase receipt/invoice). For a product photo, describe what you see (brand, type, color, text/logos), then live_gallery for that exact product in its brand's store. For a receipt/invoice (photo or PDF), READ it — pull out each item (name, quantity, price) and the store/total — and use it to register the customer's self-import order (create_self_order); don't ask them to re-type what's already on the receipt. The file they attached is AUTOMATICALLY saved as that order's proof of purchase, so NEVER ask them to upload the receipt again — just confirm the items and their delivery address.
- ⚑ BIG ITEMS — two cases:
  (a) LARGE-BUT-SHIPPABLE (a guitar or other instrument, a skateboard/longboard/snowboard, golf clubs, a small appliance): this DOES ship — search it like anything else and, when they add it, mark it type:"oversize_long" so the box shows it as its own big box (~100% full, it doesn't consolidate). Do NOT send these to WhatsApp.
  (b) TRULY UN-BOXABLE (a 60"+ flat-screen TV, a fridge/washer/large appliance, furniture, a mattress, an ABOVE-GROUND POOL or anything else longer than 52 cm on every side, tires, a vehicle/golf cart): standard box shipping can't cover it → call show_contact_whatsapp. If it is already in their box, ALSO pass type "oversize_freight" on that item in show_shipment so the box card stops counting it as if it fit (one short line + the WhatsApp button, no essay). Normal-sized goods (clothing, shoes, bags, most electronics, beauty, toys) are business as usual — never route those to WhatsApp.
- STICKY STORE — once the shopper is shopping a specific store (they named it, or the last search was there), KEEP that store on every following live_gallery UNTIL they name a DIFFERENT store or ask to look across stores ("en otras tiendas", "en cualquier tienda"). "promos en Nike" → then "¿y tenis para correr?" → still Nike.
- PRICING: Show ONLY the store's USD price, exactly as the gallery shows it. A price listed as "desde $X" is the store's lowest size/option (a price range): always say "desde $X", never $X flat. Do NOT convert to MXN and do NOT invent or state a total — the real total (store shipping and tax to our warehouse included) comes from the live checkout at Finalizar, on the checkout card.
- PRICING — TWO DIFFERENT FLOWS, BE CRYSTAL CLEAR (never blur them):
  1) COMPRA ASISTIDA (Boxly compra los productos por el cliente — la mayoría de los clientes la usan porque no tienen una tarjeta aceptada en tiendas de EE. UU.): el cliente paga el PRECIO DEL PRODUCTO + 15% de comisión de Boxly + el precio de la CAJA (envío a México). **IMPORTANTE: el 15% se calcula sobre el TOTAL FINAL de la compra al hacer checkout en la tienda — es decir producto + el envío que cobre la tienda hasta nuestra bodega en San Diego (e impuestos que cobre la tienda) — NO solo sobre el precio de lista que se muestra.** No es 15% del precio mostrado; es 15% de lo que la tienda cobra al finalizar la compra. **El 15% SOLO existe en este flujo**, porque Boxly hace la compra.
  2) CASILLERO / ENVÍO PROPIO (el cliente compra sus propios productos con su tarjeta y los manda a su dirección Boxly en EE. UU.; Boxly solo los consolida y los envía): el cliente paga SOLO el precio de la CAJA (envío fijo de la tabla). **NO hay comisión del 15%.**
  NEVER imply the 15% applies to products the customer bought themselves. The 15% is EXCLUSIVELY the assisted-purchase fee for Boxly doing the buying. When you find/show products and the customer wants Boxly to get them, that's COMPRA ASISTIDA (15% applies). If they only ask about shipping their own stuff, it's just the box price (no 15%).
- RESPECT THE SALE PRICE. Record each item at the EXACT price the customer saw. If it was on sale, use the SALE price (NOT the original).
- ALREADY-BOUGHT-IT-THEMSELVES is a SEPARATE, rarer case — do NOT offer it in the shopping flow. Only if the customer explicitly says "ya lo compré / lo pagué yo / yo lo compro en la tienda con mi tarjeta" → that's CASILLERO, call create_self_order (no 15%; the app asks for their comprobante). Never proactively suggest they buy it themselves.
- WHEN ASKED ABOUT A PRODUCT ("cuéntame más", "info de este"), keep it SHORT and useful for deciding to buy: what it is, the price and any deal, and why it's a solid buy. A few scannable lines, not a spec sheet — then move toward adding it to the box.
- DRIVE TO THE ORDER. You exist to get them buying, not browsing forever: once the gallery is on screen, recommend a top pick, ask which one they want, and move them toward the box and Finalizar.
- NEVER PROFILE THE CUSTOMER. Do NOT ask — or guess out loud — why they're buying, whether it's for themselves or to resell, or how they'll use the products. It is irrelevant and intrusive. Your only job is to help them find what they want and get it ordered. No "¿para ti o para revender?", ever.
- NEVER REVEAL THE BOXLY CASILLERO / US WAREHOUSE ADDRESS (or any account-only/private detail) directly in chat. This chat can be PUBLIC, and the address is tied to a customer's account. If they already bought, need their Boxly US address, or ask for the locker address: DON'T type it out. Instead guide them to (1) create their FREE Boxly account or log in, where their personal US address appears in the **Casillero** section of their dashboard, and (2) offer the team on WhatsApp ([escríbenos por WhatsApp](https://wa.me/16195591910)) if they want a hand. Even if a tool could return the address, do not print it — point them to their account. Same for order/tracking details: summarize gently and send them to their dashboard or WhatsApp rather than dumping private data.
- LONG-TERM MEMORY (persists across ALL their chats — treat it as your knowledge of this person).
  • USE IT silently every turn: fold their saved sizes, favorite brands, budget and interests into your searches and framing automatically. NEVER ask for something the memory already holds.
  • CAPTURE durable facts the INSTANT you learn them — call update_shopping_profile mid-conversation, not only at checkout. Save: gender; sizes per category (a LIST — they may carry several); favorite_brands; disliked_brands / things they avoid; the categories they shop for; typical and max budget; style notes; recurring interests. A passing "I wear a 9.5" or "I love YoungLA" is worth saving immediately. Don't save one-off trivia, and NEVER record why they buy.
  • CANONICAL SHAPE to merge into: {gender, sizes:{shoe:["9 US","10 US"], tops:["M"], …}, favorite_brands:[], disliked_brands:[], categories:[], budget:{typical,max}, interests:[], style_notes}. Merge is additive (lists union, keys overwrite) — sending a size adds it to that category's range.
- KEEP SHOPPING AFTER AN ORDER. Finalizar does NOT end the chat — the customer can keep going and place ANOTHER order in the same conversation. After an order: stay warm and proactive ("¡Listo! 🎉 ¿Buscamos algo más?"); a new box starts from scratch (the items already ordered are DONE — do not re-add them).
${loggedIn
  ? '- This user is signed in: live search, the box (their real store carts) and Finalizar are all theirs.'
  : '- This user is a GUEST. Live search, the box and every order need a Boxly account (the live browser, the cart and the order are theirs). For ANY product request or order, call create_account — it opens a button that takes them to register (email or Google) and brings them back here to continue. Do NOT ask for name/email/phone yourself, and never describe or invent products for a guest. Questions about Boxly itself are answered normally.'}
- Be concise, friendly, and in the user's language (default Spanish, es-MX).`
}


// ── HUB (OS) preamble ─────────────────────────────────────────────────────────
// On the logged-in dashboard the assistant is the SINGLE interface for everything
// Boxly does. This block turns the shopping concierge into a full logistics OS that
// ROUTES the customer into the right pipeline and DRIVES it end-to-end in chat. It's
// prepended to the shopping system prompt (which still governs product discovery).
const PIPELINE_HINT: Record<string, string> = {
  search: 'The customer tapped **Comprar en EE.UU.** — the shopping flow. Help them FIND products live in the stores (live_gallery) or take a pasted product link into the box (show_shipment), then drive it to Finalizar (Boxly buys it for them, +15%).',
  register: 'The customer tapped **Registrar compra** — they ALREADY BOUGHT something themselves and want Boxly to receive/import it (CASILLERO, no 15%). Ask them to upload the receipt/confirmation OR tell you what they bought, then use create_self_order.',
  assisted: 'The customer tapped **Compra asistida** — they want Boxly to BUY a product for them (+15%). Ask for the product link or what they want: a link goes into the box (show_shipment with its url), a description is searched live (live_gallery); then Finalizar (finalize_order) runs the real checkout and sends the invoice.',
  status: 'The customer tapped **Estado de envío** — they want to track their orders/shipments. Show their orders and their status.',
  in_person: 'The customer tapped **Compras presenciales** — they want Boxly to shop in person at San Diego outlets. Call plan_in_person: they pick a day and hour on the booking page and pay a deposit there to reserve it.',
}
function hubPreamble(loggedIn: boolean, pipeline?: string): string {
  const hint = pipeline && PIPELINE_HINT[pipeline] ? `\n\nACTIVE PIPELINE THIS TURN: ${PIPELINE_HINT[pipeline]}` : ''
  return `=== BOXLY OS MODE (logged-in dashboard) ===
You are the customer's SINGLE interface to everything Boxly. You are not just a product search box — you are their personal shopping + logistics assistant, and the conversation is how they run their whole Boxly account. Route them into the RIGHT pipeline and drive it to completion, all in chat. Answer with your interactive tools/components, never long paragraphs.

THE FOUR THINGS A CUSTOMER CAN DO (route to the one that fits their message):
1) BUSCAR PRODUCTOS 🛍️ — find/buy products from US stores, live in the stores' own sites (live_gallery).
2) COMPRA ASISTIDA 💳 — Boxly BUYS a product for them (they paste a link / describe it). A link goes straight into the box (show_shipment with its url); a description is searched live. When they're done, finalize_order places the order; the carts are built in the background and the invoice is emailed in a few minutes (they can close the app). Do NOT invent a PR number. Use when they don't have a US card or just want us to buy it.
3) REGISTRAR COMPRA (CASILLERO) 📦 — they ALREADY bought it themselves and want Boxly to receive + import it. Ends in create_self_order. NO 15% commission — never mention it here.
5) COMPRAS PRESENCIALES 🏬 — Boxly shops IN PERSON for them anywhere in San Diego (any mall, outlet, boutique or store; wholesale, multi-store) — say "en San Diego", never one mall. When they want this ('vayan por mí', 'compras presenciales', 'en persona'), call plan_in_person to show the 'Reserva tu horario' card; they pick a day and hour on the booking page and pay a deposit there to reserve it.
4) ESTADO / MIS PEDIDOS 🚚 — track and MANAGE existing orders. ALWAYS use show_orders (NOT plain text): no args → a tappable list of their orders; with order_id/order_number → that order's visual status timeline. Answer "¿dónde está mi envío/pedido?", "mis pedidos", "estado de mi orden" by calling show_orders, then add ONE short line. To CANCEL an order they ask to cancel, call cancel_order (it opens a confirm dialog — never cancel without it).

ROUTING: infer intent from what they say. A link or "cómprenlo por mí" → asistida. "Ya lo compré / aquí está mi recibo" → registrar (casillero). "¿dónde está mi caja / mi pedido?" → estado. Otherwise, if they're looking for something to buy → búsqueda. When it's genuinely ambiguous, ask ONE short question. Switch pipelines fluidly as their need changes within the same conversation.

ALWAYS SUGGEST THE NEXT STEP (Boxly's signature — never a dead end). End EVERY turn by gently moving them one step deeper: after registering a purchase → "¿Quieres agregar algo más a este envío?"; after showing a shipment with room left → "Todavía tienes espacio, ¿buscamos algo más?"; after a search → offer a complementary item or to order one; after tracking → offer to keep shopping. One short, natural nudge — helpful, never pushy.

This customer is ${loggedIn ? 'SIGNED IN — you can create orders/requests and read their orders directly.' : 'a GUEST — gate any order behind create_account first.'}${hint}
=== END BOXLY OS MODE ===

`
}

export default defineEventHandler(async (event) => {
  if (!hasModelKey()) {
    setResponseStatus(event, 503)
    return { error: 'assistant_not_configured', message: 'Missing LLM provider API key on the server.' }
  }

  const body = await readBody(event)
  const messages = body?.messages ?? []
  const token: string | undefined = body?.token || undefined
  // PHASE MARKERS. A few turns per hundred hang and never reach onFinish or onError, so
  // nothing about them appears in the logs at all — and one hung the full 90s even after
  // the model stream was given a 45s abort, which means the stall is NOT inside
  // streamText. These two lines cost nothing and say which side of setup it died on: a
  // "start" with no "stream" is the handler; a "stream" with no "usage" is the provider.
  const turnId = Math.random().toString(36).slice(2, 8)
  const turnStartedAt = Date.now()
  console.log(`[assistant] start ${turnId} ${JSON.stringify(String(lastUserText(messages)).slice(0, 60))}`)
  // The chat thread this turn belongs to — logged onto each search/question event
  // so admins can open the full conversation from the AI-search view. Null for guests.
  const conversationId: number | undefined = Number(body?.conversationId) > 0 ? Number(body.conversationId) : undefined
  const shoppingProfile = body?.shoppingProfile ?? null
  const savedProducts: any[] = Array.isArray(body?.savedProducts) ? body.savedProducts : []
  // Surface tells us WHERE the chat runs: 'hub' = the logged-in dashboard where the
  // assistant is the OS for ALL pipelines (casillero, assisted, in-person, tracking);
  // 'search' (default) = the public concierge funnel (shopping-only). `pipeline` is the
  // action card the user tapped (search|register|assisted|status|in_person), a routing hint.
  const surface: string = body?.surface === 'hub' ? 'hub' : 'search'
  const pipeline: string | undefined = typeof body?.pipeline === 'string' ? body.pipeline : undefined
  // THE LAB FLOW IS THE PRODUCT (Alex, 2026-09-28). What Boxly Lab testers had is every signed-in shopper's now:
  // product requests open the stores live (live_gallery), the box is mirrored into the real store carts (cart
  // sync) and Finalizar runs the real checkouts (finalize_order) → purchase request → invoice. `finalizeTap` = the
  // box card's "Finalizar carrito" was tapped this turn, so finalizing is the one move.
  const finalizeTap: boolean = !!token && body?.finalizeTap === true
  // The agent finished putting a box item in the store's real cart (or the store refused). The client sends this
  // as a hidden turn; the assistant confirms it — the ONLY moment it may say the item is in the cart.
  const ce = token && body?.cartEvent && typeof body.cartEvent === 'object' ? body.cartEvent : null
  const cartEvent = ce && ['in_store_cart', 'unavailable', 'failed'].includes(ce.status)
    ? { title: String(ce.title || 'el producto').slice(0, 200), store: String(ce.store || 'la tienda').slice(0, 80), status: ce.status as string, variants: String(ce.variants || '').slice(0, 120), note: ce.note ? String(ce.note).slice(0, 200) : null }
    : null
  // The engine's store list, read before the loop (the prompt names it; live_gallery validates against it). A guest
  // has none: live search needs an account (the session, its conversation and the cart are per shopper).
  const liveCatalog = token ? await liveStoreList(token) : null
  // The live stores' own sites (host → engine store id): a pasted link or a registry row on one of them is that
  // store's product, and a box item whose title starts with a store's name is searched for on its site.
  const liveHosts = storeHostsFromLiveStores(liveCatalog?.stores)
  // Make the shopper's Boxly cart hold exactly this box (the box wins). Every add lands in the cart the
  // moment the box card shows it, so the agent fills the real store cart in the background while they keep
  // shopping (cart sync) — Finalizar then only checks out. Returns null when done, else an error code.
  // Items the agent cannot buy (a marketplace link, no product page) are skipped here; finalize refuses them.
  // `retryUrl`: the item picked this turn — if its last store try failed, it goes again. Also returns, via
  // `sent`, the product URLs this sync asked the agent to put in the store cart (added / changed / retried).
  // The shopper's product registry with rows on a live store's site tagged with its store id (an older chat's rows).
  const storeRegistry = tagCarriedStores(savedProducts, liveHosts)
  // The live stores (id, name, host) for search to cart: an item whose title names one is found on its site.
  const carriedStores: CarriedStore[] = [...liveHosts.entries()].map(([host, st]) => ({ id: st.id, name: st.name || st.id, host }))
  // Is the card's last item new to the box (not on the previous box card)? Then this card is an ADD.
  const isNewAdd = (box: any[]) => {
    const prev = boxFromMessages(messages) || []
    const key = (it: any) => String(it?.saved_id || it?.url || it?.name || '')
    const last = box[box.length - 1]
    return !!last && !prev.some((p: any) => key(p) === key(last))
  }
  let syncOnAdd = true   // set by syncBox from the API's cart (sync_on_add)
  async function syncBox(box: any[], retryUrl: string | null = null, sent: Set<string> = new Set(), { keepOthers = false } = {}): Promise<string | null> {
    const { wanted } = wantedFromBox(box, storeRegistry, carriedStores, (u, c) => pickedColourImage(messages, u, c))
    // This chat's own cart (one cart per chat, Alex 2026-10-03)
    const cart = await callApi(conversationId ? `/cart?conversation_id=${conversationId}` : '/cart', { token })
    if (cart?.ok === false || !Array.isArray(cart?.items)) return 'cart_unavailable'
    // false: an add waits in the Boxly cart and the store carts are built at Finalizar (Alex 2026-10-03)
    syncOnAdd = cart?.sync_on_add !== false
    // Lines the box no longer holds go first (so a variant change can never collide with them).
    const plan = planCart(cart.items, wanted, { retryUrl })
    if (keepOthers) plan.remove = []
    for (const w of plan.add) sent.add(w.product_url)
    for (const u of plan.update) { const l = cart.items.find((x: any) => x.id === u.id); if (l) sent.add(l.product_url) }
    const failed = (r: any) => r?.ok === false
    for (const id of plan.remove) if (failed(await callApi(`/cart/items/${id}`, { method: 'DELETE', token }))) return 'cart_update_failed'
    for (const u of plan.update) if (failed(await callApi(`/cart/items/${u.id}`, { method: 'PATCH', token, body: u.body }))) return 'cart_update_failed'
    for (const w of plan.add) {
      const { variants, ...rest } = w
      const r = await callApi('/cart/items', { method: 'POST', token, body: { ...rest, ...(Object.keys(variants).length ? { variants } : {}), source: 'chat', ...(conversationId ? { conversation_id: conversationId } : {}) } })
      if (failed(r)) return 'cart_update_failed'
    }
    return null
  }

  // The per-chat rolling summary (phase 2, on by default) is read in parallel
  // with the wiki so it adds no latency; it is null for guests / short chats.
  const [knowledge, summaryState] = await Promise.all([getKnowledge(), readSummary(callApi, conversationId, token)])

  // Identity for analytics question-logging (searches log themselves server-side).
  const auth = { cookie: getHeader(event, 'cookie'), origin: getHeader(event, 'origin'), token }
  const question = lastUserText(messages)

  const authedNote = { ok: false, error: 'not_authenticated', message: 'Ask the user to create an account first (call create_account).' }

  // Prompt caching: the big static instructions (+ tool defs, which Anthropic
  // caches as part of the same prefix) go in ONE system block with an ephemeral
  // cache breakpoint, so every turn after the first reads them from cache (~90%
  // cheaper) instead of re-billing ~9k tokens. The per-shopper memory + in-chat
  // product registry change mid-conversation, so they ride at the very END of the
  // prompt (on the newest user message, see below) — keeping everything before
  // them byte-identical for Anthropic's breakpoint AND Gemini's implicit cache.
  // Is there an audience-shaped hole in this ask? Decided before the loop starts,
  // because prepareStep must know it on step 0 (see audienceGap).
  //
  // Never for a STARTER CARD. Those are advertised, and the one rule about them is that
  // every tap ends in a gallery of that store — but "tenis Adidas" and "Tenis New
  // Balance" name a gendered category with nobody to wear it, so the gate answered two
  // advertised cards with a question instead of the store. The card narrows the search
  // by naming the brand; the prompt asks its question AFTER the gallery is up.
  const mustNarrow = !body?.fromStarterCard && audienceGap(messages)
  // A message that is only a store's name ("Gymshark") asks to see that store (Alex, 2026-09-28: it got a pitch about
  // shipping and cards and no products). The live browser needs somewhere specific to go, so the first step is the
  // one question "¿qué buscas en Gymshark?" (ask_to_narrow). Short messages only; the stores are the engine's.
  const bareStore = !body?.fromStarterCard && !cartEvent && !finalizeTap && !mustNarrow && String(question || '').split(/\s+/).length <= 7
    ? bareStoreAsk(String(question || ''), liveCatalog?.stores || [])
    : null
  const cartEventBlock = cartEvent
    ? `STORE CART RESULT (automatic — the shopper did not type this; the "⟦carrito⟧" message is hidden from them). "${cartEvent.title}"${cartEvent.variants ? ` (${cartEvent.variants})` : ''} at ${cartEvent.store}: ${
      cartEvent.status === 'in_store_cart'
        ? `the Boxly agent PUT IT IN ${cartEvent.store}'s REAL CART. Reply in Spanish with EXACTLY these two short paragraphs (fill in the product and store; no other text, no list, no link): "¡Listo! ✅ Ya quedó **${cartEvent.title}**${cartEvent.variants ? ` (${cartEvent.variants})` : ''} en tu carrito de **${cartEvent.store}**." then "Puedes seguir buscando y agregando productos de **cualquier tienda** — todo va en una sola factura. Cuando termines, toca **Finalizar carrito** y calculo el total real con envío e impuestos."`
        : cartEvent.status === 'unavailable'
          ? `${cartEvent.store} says it is SOLD OUT${cartEvent.variants ? ' in that option' : ''}. Reply in Spanish in one or two short lines: it could not go in the cart because ${cartEvent.store} has it agotado${cartEvent.variants ? ` en ${cartEvent.variants}` : ''}; suggest picking another size/colour or a similar product. Do NOT say it was added.`
          : `the agent could NOT add it to ${cartEvent.store}'s cart${cartEvent.note ? ` (agent's note: ${cartEvent.note} — do not quote it)` : ''}. Reply in Spanish in one or two short lines: it didn't go into the ${cartEvent.store} cart this time, and offer to try again right away ("¿Lo intento de nuevo?"). Do NOT guess why — in particular do NOT say it is sold out/agotado (a sold-out result comes separately); the store just didn't take it this try (Alex 2026-09-30: a New Balance add that failed on our side was blamed on stock). Do NOT say it was added.`
    } Write only that reply; no tools, no gallery.`
    : ''
  // The live stores and how many one search may open change with the engine, so they ride here, not in the
  // cached system prompt. A guest gets the sign-in line instead (live search needs an account).
  const liveBlock = token
    ? (liveCatalog
      ? `LIVE STORES (the only stores live_gallery can open right now; one search opens ${liveCatalog.max > 1 ? `1-${Math.min(4, liveCatalog.max)} of them side by side — for an ask with no store named, the ${Math.min(4, liveCatalog.max)} best-known for the category` : 'exactly 1 — for an ask with no store named, the single best-known for the category'}): ${liveCatalog.stores.map((st) => st.name).join(', ')}.`
      : 'LIVE STORES: the live store browser is unavailable right now — for a product request say so in ONE short line and offer to try again in a moment; do not describe products.')
    : 'THIS VISITOR IS NOT SIGNED IN. For ANY product request or order, call create_account right away with ONE short line in Spanish ("Para buscarlo en vivo en la tienda necesito que entres a tu cuenta Boxly — es gratis y te traigo de vuelta aquí 👇"); never describe, list or invent products. Questions about Boxly itself (envíos, precios, casillero) are answered normally.'
  const bareStoreBlock = token && bareStore
    ? `THE SHOPPER TYPED ONLY A STORE: "${bareStore}". Ask what they want there with ask_to_narrow — ONE short question ("¿Qué buscas en ${bareStore}?") and 3-4 of that store's main categories as the answers — so the live browser goes straight to it. No products and no other text this turn.`
    : ''
  const ctx = [summaryBlock(summaryState), shopperContext(!!token, shoppingProfile, savedProducts), narrowBlock(mustNarrow), liveBlock, cartEventBlock, bareStoreBlock].filter(Boolean).join('\n\n')
  // History → model, bounded (see server/utils/chatContext.ts):
  //  1. old galleries collapse to a one-line marker (the products stay in the registry),
  //  2. hysteresis window (MAX 14 msgs / 6k tokens → keep 8; hard cap 9k),
  //  3. the per-shopper block rides on the NEWEST user message, so everything before
  //     it is byte-identical turn to turn and Gemini's implicit prefix cache covers
  //     the system prompt, the tools AND the recent history (it used to sit between
  //     the system prompt and the history, invalidating the cache every gallery turn).
  // suggest_followups parts are UI-only (chips) and the tool is no longer declared to
  // the model, so they are dropped from the transcript rather than replayed.
  // A live-results part (the live gallery, appended by the API) is not a call the model made: it is replayed as one
  // line of text (liveResultsAsText) before anything else looks at tool parts — and so is a gallery of a tool that
  // no longer exists, in a chat from before 2026-09-28 (legacyToolsAsText; the rest of those parts are dropped).
  // A product's picker card (appended by the app, not called by the model) is replayed as text the same way.
  const cleaned = dropToolParts(sanitizeToolInputs(stripIncompleteToolCalls(legacyToolsAsText(pickerCardsAsText(liveResultsAsText(await pdfPartsToText(messages)), registryId), LEGACY_GALLERY_TOOLS, LEGACY_TOOLS, registryId))), ['suggest_followups'])
  const windowed = windowMessages(ageGalleries(cleaned, GALLERY_TOOLS, { keepLast: 2, productId: registryId, compactProduct }))
  const promptStats = contextStats(cleaned, windowed.messages, windowed.dropped)
  // On the hub surface the assistant becomes the OS for all pipelines. The router is
  // kept in a SEPARATE, uncached system block (it varies with the tapped pipeline)
  // so the big static shopping prompt above stays byte-identical and stays cached.
  const hubBlock = surface === 'hub' ? hubPreamble(!!token, pipeline) : ''
  const modelMessages: any[] = [
    {
      role: 'system',
      content: systemPrompt(!!token, knowledge),
      // Anthropic-only prompt caching of the big static prefix. Gemini does its own
      // implicit caching automatically, so we just omit the breakpoint there.
      // Anthropic-only prompt caching (Gemini caches implicitly; OpenAI has its own).
      ...(isAnthropic() ? { providerOptions: { anthropic: { cacheControl: { type: 'ephemeral' } } } } : {}),
    },
    ...(hubBlock ? [{ role: 'system', content: hubBlock }] : []),
    ...await convertToModelMessages(withContextOnLastUser(windowed.messages, ctx), { tools: HISTORY_TOOLS }),
  ]

  // Follow-up chips are produced OFF the agent loop (server/utils/followups.ts):
  // the first gallery that returns products kicks off a cheap aux-model call in
  // PARALLEL with the model's recommendation text; the chips are attached to the
  // same assistant message just before the stream finishes (and persisted with it).
  let followupsPromise: Promise<string[]> | null = null

  // "One gallery per reply" guard (see GALLERY_TOOLS): a gallery tool flips this
  // when it returns products; prepareStep() then strips gallery tools from later
  // steps. Wrap a gallery tool's result with markGallery() to arm it.
  let galleryShown = false
  // A live search that started for every store asked: the chat itself already told the shopper what is happening (the
  // "¡Va! Déjame revisar … por ti" message drawn from the call — ShoppingAssistant.vue), so the turn ends right there.
  let liveSearchQuiet = false
  const markGallery = async (r: any) => {
    // A row on a live store's site is that store's product: tag it, so the box can put it in that store's real cart.
    if (r && Array.isArray(r.products) && r.products.some((p: any) => !p?.store_id)) {
      const tagged = tagCarriedStores(r.products, liveHosts)
      if (tagged !== r.products) r = { ...r, products: tagged }
    }
    if (r && Array.isArray(r.products) && r.products.length > 0) {
      galleryShown = true
      if (!followupsPromise) followupsPromise = generateFollowups({ question, products: r.products, store: r.products[0]?.store })
    }
    return r
  }

  // Latency instrumentation: t0 = just before the first model call. onChunk marks
  // time-to-first-chunk (RT1 tool round-trip done, RT2 producing) and time-to-first-text
  // (the closing line begins streaming). onFinish logs the breakdown so the real
  // bottleneck (RT1 vs tool call vs RT2) is measurable in prod, not guessed.
  const t0 = Date.now()
  let firstChunkAt = 0
  let firstTextAt = 0
  // what onStepFinish has already saved of this turn (see there)
  const stepsSeen: any[] = []
  let stepsSaved = 0, userSaved = false, stepSaves: Promise<void> = Promise.resolve()
  console.log(`[assistant] stream ${turnId} setup=${Date.now() - turnStartedAt}ms`)
  const result = streamText({
    model: chatModel(),
    providerOptions: providerOptions(),
    messages: modelMessages,
    onChunk: ({ chunk }: any) => {
      if (!firstChunkAt) firstChunkAt = Date.now()
      if (!firstTextAt && chunk?.type === 'text-delta') firstTextAt = Date.now()
    },
    // Stop at 10 steps, OR — once a gallery has shown — as soon as the model has
    // written its recommendation (gallery → one closing line → done; the follow-up
    // chips are generated off-loop, see followupsPromise). This prevents a runaway
    // extra step where some models (Gemini) re-answer the whole thing a second time.
    // Gated on galleryShown so normal multi-step turns (ordering, profile updates)
    // are unaffected.
    stopWhen: [
      stepCountIs(10),
      // End the turn only once a gallery has shown AND the model has actually SAID
      // something. A gallery with no words leaves the customer a wall of cards and no
      // shopping-assistant voice — so we don't stop until a non-empty text line
      // exists, giving the model the step it needs to write it (stepCountIs is the
      // backstop).
      () => liveSearchQuiet,
      ({ steps }: any) => {
        if (!galleryShown) return false
        return (steps || []).some((s: any) => String(s?.text || '').trim().length > 0)
      },
    ],
    // Once a gallery has rendered, only non-gallery tools remain available — the
    // model can write its closing line and add follow-ups, but can't draw a 2nd gallery.
    //
    // ALSO cap gallery-tool attempts at 2, even when nothing has rendered. The
    // prompt tells the model to retry once and then stop, but it does not reliably
    // obey: conversation 331 (a real customer asking for Kipling bags, while the
    // search engine of the day returned nothing) shows it emitting "Encontré varias
    // bolsas Kipling en oferta" and searching again, six times over. stepCountIs(10) was the only
    // brake, and ten steps of searching is far past the ~30s the host allows a
    // request — so the stream was cut, onFinish never ran, the turn was never
    // saved, and the customer sat on a spinner and got nothing.
    //
    // Two attempts is the same budget the prompt asks for. After that the gallery
    // tools go away and the model has to answer in text, which is a real reply
    // ("no encontré, ¿probamos otra marca?") instead of a hang.
    prepareStep: ({ steps }: any) => {
      // A store-cart result: text only.
      if (cartEvent) return { activeTools: [], toolChoice: 'none' }
      // A Finalizar tap: finalize, then one line of text — nothing else this turn.
      if (finalizeTap) return (steps || []).length ? { activeTools: [], toolChoice: 'none' } : { activeTools: ['finalize_order'], toolChoice: 'required' }
      if (galleryShown) return { activeTools: NON_GALLERY_TOOLS }
      // THE QUESTION IS NOT OPTIONAL when the ask has an audience-shaped hole in it
      // (see audienceGap). Offering ask_to_narrow alongside the search tools is what
      // we did before, and the model searched every time — searching is the obvious
      // move and the prompt gave it an out. Here it is the ONLY move: one tool, and
      // toolChoice makes calling it mandatory. The model still writes the question.
      if (mustNarrow && !(steps || []).length) return { activeTools: ['ask_to_narrow'], toolChoice: 'required' }
      // A bare store name gets its question first (the live browser needs somewhere specific to go).
      if (bareStore && !(steps || []).length) return { activeTools: ['ask_to_narrow'], toolChoice: 'required' }
      const galleryAttempts = (steps || []).reduce(
        (n: number, s: any) => n + (s.toolCalls || []).filter((c: any) => GALLERY_TOOLS.includes(c.toolName)).length,
        0
      )
      // suggest_followups is never offered to the model (chips come from followupsPromise).
      return { activeTools: galleryAttempts >= 2 ? NON_GALLERY_TOOLS : LOOP_TOOLS }
    },
    // THE TURN MUST END. The model stream had no deadline of any kind, and the provider
    // connection can simply stall: across 200 logged turns the slowest to COMPLETE was
    // 18.3s, yet a few requests hung past 90s and never reached onFinish or onError at
    // all — no gallery, no text, no error, just a spinner. It is bimodal (fast, or
    // forever), it happened once before any tool had run, and it still happened after
    // every callApi was given a deadline, so it is this call and not ours. 45s is far
    // past any healthy turn; anything beyond it is a stall, and a bounded failure the
    // client can react to beats an open-ended one it cannot.
    abortSignal: AbortSignal.timeout(45000),
    onError: ({ error }) => console.error('[assistant] error:', error instanceof Error ? error.message : error),
    // A STEP THAT DREW A CARD IS SAVED WHEN IT FINISHES (live 2026-10-07, lab chat 1166: the add turn took 30 s — the box
    // card showed, then the host cut the request before onFinish, nothing was saved, and on reload the box and its
    // Finalizar button were gone). The closing line and chips are saved at the end as before.
    onStepFinish: (step: any) => {
      stepsSeen.push(step)
      if (!(step?.toolCalls || []).length) return
      const fresh = stepsSeen.slice(stepsSaved), withUser = !userSaved
      stepsSaved = stepsSeen.length; userSaved = true
      stepSaves = stepSaves.then(() => persistTurn(conversationId, token, messages, fresh, '', [], { withUser }))
    },
    onFinish: async ({ text, steps, totalUsage }) => {
      // Prompt-size + cache telemetry (one line per turn) so the effect of the
      // context window and the prefix cache can be measured in prod.
      const u: any = totalUsage || {}
      const done = Date.now()
      const toolsUsed = (steps || []).flatMap((s: any) => (s.toolCalls || []).map((c: any) => c.toolName))
      console.log('[assistant] usage', JSON.stringify({
        conversation: conversationId ?? null, steps: (steps || []).length,
        input: u.inputTokens ?? null, cache_read: u.inputTokenDetails?.cacheReadTokens ?? u.cachedInputTokens ?? null,
        output: u.outputTokens ?? null, ...promptStats,
        has_summary: !!summaryState?.running_summary, summary_chars: summaryState?.running_summary?.length ?? 0,
        // Latency breakdown (ms): ttfc = to first stream chunk (RT1+tool done), ttft = to
        // first TEXT (RT2 begins speaking), total = full turn. tools = what ran this turn.
        ms_ttfc: firstChunkAt ? firstChunkAt - t0 : null,
        ms_ttft: firstTextAt ? firstTextAt - t0 : null,
        ms_total: done - t0, tools: toolsUsed,
      }))
      // The chips ride on the message via the stream (see the end of this handler);
      // wait for the same bounded promise so the persisted turn carries them too.
      const chips = await followupsWithin(followupsPromise)
      // A turn that used a product tool is a SEARCH; a turn with no product tool is a
      // business QUESTION. Both are reported from here (see logEvent).
      const usedProductTool = (steps || []).some((s: any) => (s.toolCalls || []).some((c: any) => PRODUCT_TOOLS.has(c.toolName)))
      if (usedProductTool) logSearch(steps || [], auth, conversationId)
      else logQuestion(question, text || '', auth, conversationId)
      // Durably save the turn server-side (awaited so it completes within the
      // stream lifecycle — see persistTurn). Authoritative writer of chat history.
      await stepSaves
      await persistTurn(conversationId, token, messages, (steps || []).slice(stepsSaved), stepsSaved ? '' : text || '', chips, { withUser: !userSaved })
      // Fold the turns the window no longer shows into the per-chat summary. After
      // the reply and the persist, fire-and-forget, cheap aux model; every failure
      // keeps the previous summary (see server/utils/chatSummary.ts).
      if (conversationId && token && shouldSummarize(windowed.dropped, summaryState, WINDOW_DEFAULTS.keep)) {
        summarize(conversationId, token, WINDOW_DEFAULTS.keep, callApi, (l) => console.error(l))
          .then((r) => { if (r.ran) console.log('[assistant] summary', JSON.stringify({ conversation: conversationId, ...r })) })
          .catch(() => {})
      }
    },
    tools: {
      get_product_variants: tool({
        description: "THE STEP BEFORE AN ORDER for a sized/coloured product. The moment the shopper commits to a SPECIFIC product we showed ('quiero esos', 'agrégalo', 'lo compro', 'ese', 'los del medio') call this with its saved_id (the registry id from the gallery) — it goes STRAIGHT to that product's stored URL (no new search, no browsing) and returns every variant (size / colour) with whether it is AVAILABLE right now and its price. Then offer ONLY the available sizes/colours (the chat renders them as tappable chips) and ask which one they want; once they pick, add it with show_shipment carrying that size/color. If it comes back with no variants (reason set: unsupported store, timeout, single-variant item), do NOT stall — add it to the box as it is. Slow on some stores (~10-40s): open with ONE short line ('Déjame revisar tallas y disponibilidad 👟') in the same turn. Never call it for browsing; only for a product the shopper has chosen.",
        inputSchema: z.object({
          saved_id: z.string().describe('Registry id of the product the shopper chose (from the gallery). Preferred — it resolves the exact stored URL.').optional(),
          url: z.string().describe('Direct product URL, only when the shopper pasted a link and there is no saved_id.').optional(),
        }),
        execute: async ({ saved_id, url }: any) => {
          const saved = saved_id ? savedProducts.find((p: any) => p.id === saved_id) : null
          const target = saved?.url || saved?.product_url || url
          if (!target) return { variants: [], reason: 'no_url', note: 'No stored URL for that product. Do not stall: add it to the box with show_shipment as it is.' }
          const r: any = await getProductVariantsApi(String(target))
          const avail = r.variants.filter((v: any) => v.available)
          // THERE ARE ONLY CHIPS WHEN THERE IS A CHOICE. The picker hides any axis with a single value — there
          // is nothing to pick — so a one-size product renders NO chips. Telling the shopper to "elige la talla"
          // while also forbidding the options in text left them staring at a screen with neither (Alex, PUMA
          // 6-Pack Crew Socks, One Size, 2026-09-15). A real choice means an axis with more than one value.
          const realChoice = (r.axes || []).some((a: any) => (a?.values?.length || 0) > 1)
          const note = !r.variants.length
            ? `NO VARIANT DATA (${r.reason}). Do not stall: add it to the box with show_shipment as it is — the agent adds it in the store's own cart, where the store's page decides.`
            : !realChoice
              ? `READ OK, NOTHING TO CHOOSE: this product comes one way only${r.axes?.[0]?.values?.[0] ? ` (${r.axes[0].name}: ${r.axes[0].values[0]})` : ''}. There are NO chips on screen, so never tell them to pick — say what it comes as in one short line and add it with show_shipment now, carrying that value.`
              : `VARIANTS ON SCREEN${r.checked_at ? ' (checked ' + r.checked_at + ')' : ''}: ${avail.length} of ${r.variants.length} available. THE ITEM IS NOT IN THE BOX and you must not say it is — "agregué"/"agregado"/"ya está en tu caja" are FORBIDDEN here. The shopper picks size, colour and QUANTITY on the chips themselves, so do NOT list the options in text. Reply with ONE short line: "Elige la talla y la cantidad y lo agrego a tu caja 👇". Add it only on the NEXT turn, with show_shipment carrying size, color and quantity.`
          return { ...r, product_title: saved?.title || r.product?.title || null, saved_id: saved_id || null, note }
        },
      }),
      show_saved_products: tool({
        description: "Re-display products that were ALREADY shown earlier in THIS chat (listed under 'PRODUCTS ALREADY SHOWN IN THIS CHAT'). Use when the user refers back to something — 'tráeme ese hoodie', 'el segundo', 'el que vimos antes', 'compara los dos primeros' — or asks for MORE of a kind already shown ('quiero agregar más velas' after adding a candle: pass every candle id from that store, the same gallery comes back). Pass their ids. This is instant and exact — do NOT re-search for an item that's already in that list.",
        inputSchema: z.object({
          ids: z.array(z.string()).min(1).describe('The ids of saved products to re-display, e.g. ["p1a2b3"].'),
        }),
        execute: async ({ ids }) => {
          const set = new Set(ids)
          const products = savedProducts.filter((p) => set.has(p.id))
          return markGallery({ products })
        },
        toModelOutput: galleryModelOutput,
      }),

      show_shipment: tool({
        description: "Show/UPDATE the customer's live BOXLY shipment (their consolidation box). Call this EVERY time the shipment changes — an item is added, removed, or a quantity changes — passing ALL items currently in the shipment (not just the new one). It renders a card with the recommended box size, a volume bar and capacity remaining, so the customer watches their box fill up and is encouraged to consolidate more. It does NOT place the order (finalize_order does, when they tap Finalizar) — but for a signed-in shopper every item it shows goes into their Boxly cart and the agent adds it to the store's real cart. This is separate from the product gallery; you may call it in the same turn as confirming an add. For a sized/coloured item just added (shoes, apparel) the card ALSO reads that product's sizes/colours with live availability from its stored URL and returns them as `variants_for` (+ a `note`): the chips are on screen — ask ONE short question for their pick, and carry it into show_assisted_summary's size/color at finalize.",
        inputSchema: z.object({
          items: z.array(z.object({
            saved_id: z.string().describe('Registry id of the gallery product the customer added — ALWAYS set it so the box shows the real thumbnail/price without you retyping a long image URL.').optional(),
            name: z.string().describe('Product name, e.g. "Touchland Power Mist" or "Owala FreeSip 24oz".'),
            quantity: z.number().int().min(1).default(1),
            image: z.string().describe('Product image URL — auto-filled from the registry when saved_id is set; pass it directly only if there is no saved_id.').optional(),
            price: z.number().describe('USD price the customer saw (sale price if on sale) — shown under the item in the box.').optional(),
            type: z.enum(['rigid_small', 'toiletry', 'flat_soft', 'medium_soft', 'rigid_medium', 'rigid_large', 'shoes', 'bulky_soft', 'fragile', 'oversize_long', 'oversize_freight']).describe('Packing archetype by VOLUME and WEIGHT, not item count. oversize_freight = it does NOT FIT IN ANY BOXLY BOX at all (an above-ground pool, a mattress, a fridge or washer, a sofa or bed frame, a treadmill, a 55"+ TV, a BBQ grill, a kayak) — the biggest box is 52x62x53 cm, so the answer is a human, not a bigger box: set this and then call show_contact_whatsapp. rigid_large = boxed big electronics/appliances that do not compress (PlayStation/Xbox/Switch consoles, monitors, printers, microwaves, air fryers, vacuums) — a console is NOT a water bottle. oversize_long = a LONG rigid item that needs a big box on its own and fills it ~100% (a guitar / other large instrument, a skateboard/longboard/snowboard/surfboard, golf clubs) — it does not consolidate with much else. (two orders with the same number of items can need totally different boxes). rigid_small=ocupan muy poco — cosmetics/makeup/perfume/jewelry/accessories/phone cases/cables/Touchland sanitizers/small wallets (adding several barely changes the box); toiletry=a DRUGSTORE PACKAGE, about twice a perfume carton — a tub or pack of wipes/towelettes, shampoo, conditioner, body wash, deodorant, sunscreen, cotton pads, diapers, a refill bottle (a tub of makeup-remover wipes is NOT a lipstick, and wet goods are heavy); flat_soft=ocupan poco — t-shirts/leggings/shorts/underwear/socks/swimwear (compress well); medium_soft=ocupan medio — jeans/hoodies/sweatshirts/joggers/light jackets/mid bags/backpacks; rigid_medium=bottles/tumblers/electronics; shoes=a boxed pair; bulky_soft=ocupan mucho — boots/thick coats/blankets/pillows/plush/helmets/appliances (pots, coffee makers); fragile=lamps/glass/decor. A Touchland Power Mist sanitizer is rigid_small.').optional(),
            url: z.string().describe('The product page URL — REQUIRED when there is no saved_id (a link the shopper pasted). It is how the box reads the real sizes/colours; without it no picker can be shown.').optional(),
            size: z.string().describe('The size the shopper CHOSE, e.g. "Medium", "34C", "10.5". Pass it as soon as they say it — an item with choosable sizes is NOT added to the box until this is set.').optional(),
            color: z.string().describe('The colour/finish the shopper CHOSE, e.g. "Black", "Blue Oasis". Same rule as size.').optional(),
          })).min(1),
        }),
        execute: async ({ items: drawn }) => {
          // a card that adds never drops what the box already held (the model sometimes lists only the new store's items)
          const input = withEarlierItems(boxFromMessages(messages), drawn)
          // THE QUANTITY PICKED ON THE CARD (Alex 2026-10-05: five leggings): the newest user message carries it as
          // metadata.quantity; the item just added takes it, whatever the model typed.
          {
            const said = Number([...(messages || [])].reverse().find((m: any) => m?.role === 'user')?.metadata?.quantity)
            if (Number.isInteger(said) && said >= 1 && said <= 20 && input.length) input[input.length - 1] = { ...input[input.length - 1], quantity: said }
          }
          const out: any = await (async (items: any[]) => {
          // The registry is the truth for anything the model would otherwise retype: the box card must show the
          // REAL thumbnail / price / name for a saved_id (the model invented "https://example.com/nike_ultrafly.jpg"
          // in a live run), so resolve before building the card.
          // A saved_id can go stale — the item was added turns ago and the registry the client sent has moved
          // on — so fall back to matching the product by URL and then by name. And a registry hit that carries
          // NO image must not erase one the model did pass: the box card showed a grey placeholder for an item
          // whose name, colour and size were all correct (Alex, BMX handlebar, 2026-09-15).
          const sameUrl = (a: any, b: any) => a && b && String(a).split('?')[0] === String(b).split('?')[0]
          const sameName = (a: any, b: any) => a && b && String(a).trim().toLowerCase() === String(b).trim().toLowerCase()
          items = (items || []).map((it: any) => {
            const saved = (it.saved_id ? savedProducts.find((p: any) => p.id === it.saved_id) : null)
              || (it.url ? savedProducts.find((p: any) => sameUrl(p.url, it.url)) : null)
              || (it.name ? savedProducts.find((p: any) => sameName(p.title, it.name)) : null)
            // A gallery tile without a photo (Dick's, 2026-09-30) leaves the registry with none; the product's picker
            // card read the page itself, so its photo stands in (utils/typedPick.ts).
            const photo = (u: any) => (u ? pickerCardPhoto(messages, u) : null)
            if (!saved) return it.image ? it : { ...it, image: photo(it.url) }
            return { ...it, name: saved.title || it.name, image: saved.image || it.image || photo(saved.url || it.url), price: saved.price ?? it.price }
          })
          const ship: any = await buildShipment(items)
          // ENFORCED IN CODE (Alex): the moment a sized/coloured product lands in the box is THE moment to read
          // its variants — straight from the product's stored URL, no grid navigation. The fast models skipped
          // the get_product_variants step when left to the prompt, so the box card does it itself for the item
          // just added (the last one), bounded so the card never waits more than ~30s. Cached per URL for
          // 15 min so repeated box updates in one chat don't re-read the store.
          const last = Array.isArray(items) && items.length ? items[items.length - 1] : null
          // Not gated on the packing archetype: the model filed a pair of Nike running shoes as rigid_small in a
          // live run, which skipped the read. Any product with a stored URL gets one read; a product with no
          // variants comes back as a single SKU and shows nothing extra.
          const saved = last?.saved_id ? savedProducts.find((p: any) => p.id === last.saved_id) : null
          // A PASTED LINK HAS NO REGISTRY ENTRY (Alex, 2026-09-11: he pasted a YoungLA product and got no picker).
          // Take the URL the model carried on the item, and failing that the last http(s) link in the conversation,
          // so a pasted product reads its variants exactly like a gallery one.
          const url = saved?.url || saved?.product_url || (typeof last?.url === 'string' && /^https?:\/\//i.test(last.url) ? last.url : null) || lastPastedUrl(messages)
          if (url) {
            const cached = variantCache.get(url)
            let r: any = cached && Date.now() - cached.at < 15 * 60_000 ? cached.r : null
            if (!r) {
              r = await Promise.race([
                getProductVariantsApi(String(url)).catch(() => null),
                new Promise((resolve) => setTimeout(() => resolve(null), 30_000)),
              ])
              if (r) variantCache.set(url, { at: Date.now(), r })
            }
            // A PASTED LINK HAS NO REGISTRY ROW, so the box card had no image and drew a grey placeholder next to
            // items that did have one (Alex, 2026-09-11: the DFYNE shorts). The live read knows the product's own
            // photo — use it for the card, and its price when the model did not carry one.
            if (r?.product) {
              const pi = r.product.image || (Array.isArray(r.product.images) ? r.product.images[0] : null)
              if (pi && !last.image) { last.image = pi; const inShip = ship.items?.[ship.items.length - 1]; if (inShip && !inShip.image) inShip.image = pi }
              if (last.price == null && r.product.price != null) last.price = r.product.price
            }
            if (r?.variants?.length) {
              const avail = r.variants.filter((v: any) => v.available)
              // The AXES and the PRODUCT (with its url) ride along: the chat's product modal opens only when it can see
              // a real choice (an axis with 2+ values) and a page to open (live Lab 2026-09-28: without them the
              // modal never opened, the reply said "Elige la talla y el color 👇" and the add sat held forever).
              ship.variants_for = { saved_id: last.saved_id, product_title: saved?.title || last.name || null, variants: r.variants, axes: Array.isArray(r.axes) ? r.axes : undefined, product: { ...(r.product || {}), url: r.product?.url || url, title: r.product?.title || saved?.title || last.name || null, image: saved?.image || last.image || r.product?.image || (Array.isArray(r.product?.images) ? r.product.images[0] : null) || null, price: r.product?.price ?? saved?.price ?? last.price ?? null, store: r.product?.store || saved?.store || null }, checked_at: r.checked_at, source: r.source }
              // PICK FIRST, THEN ADD (Alex, 2026-09-11: "it should FIRST pull up the variants and then when you
              // choose it ONLY THEN does it get added to cart"). A product with a REAL choice to make — some axis
              // with two or more values — is held out of the box until the shopper's size/colour is known, so an
              // unsized item can never sit in the cart and go into a purchase request half-specified. Anything
              // without a real choice (single SKU, one-value axes) is added immediately, as is a read that failed:
              // our reader must never block a purchase.
              const axes: any[] = Array.isArray(r.axes) ? r.axes : []
              const realChoice = axes.some((a: any) => (a?.values?.length || 0) > 1)
              // A PICK ONLY COUNTS IF THE STORE ACTUALLY OFFERS IT. A fast model filled size with "soporte" in a
              // local run, which would have waved a junk value straight past this gate and into the box. Every
              // multi-value axis must be answered by one of ITS OWN values (loose compare: case, accents, spacing).
              const norm = (v: any) => String(v ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '')
              // THE SHOPPER'S OWN WORDS COUNT. A fast model dropped the size the shopper had just given and the
              // item stayed held forever — so recover any axis value they actually typed ("talla Medium, color
              // Black", or a bare "Medium"). Still validated against the store's own values, so junk never passes.
              const said = (() => {
                for (let i = (messages || []).length - 1; i >= 0; i--) {
                  const m = messages[i]
                  if (m?.role !== 'user') continue
                  return (m.parts || []).filter((p: any) => p?.type === 'text').map((p: any) => p.text).join(' ')
                }
                return ''
              })()
              const saidNorm = norm(said)
              // A STORE'S VALUE IS USUALLY RICHER THAN WHAT THE SHOPPER TYPES. They write "talla 8.5"; Amazon
              // calls it "8.5 Women". Requiring the whole value to appear in their sentence missed that, so a
              // shopper who had already given size AND colour was asked for both again and the item stayed held
              // (Alex, On Cloudultra, 2026-09-15). So match the other way too: a value counts as chosen when one
              // of ITS OWN tokens is exactly something they said. Token-exact, never substring — "talla 8" must
              // not satisfy "8.5".
              const saidTokens = new Set(String(said).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/[^a-z0-9.]+/).map((t) => norm(t)).filter(Boolean))
              const valueTokens = (v: any) => String(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/[^a-z0-9.]+/).map((t) => norm(t)).filter(Boolean)
              const saidIt = (v: any) => {
                const n = norm(v)
                if (!n) return false
                // A ONE- OR TWO-LETTER VALUE CANNOT BE MATCHED BY SUBSTRING. "S", "M", "L" live inside ordinary
                // words — "quiero el negro" contains the "l" of "el" and used to pick size L. Short values must
                // be said as their own word.
                if (n.length <= 2) return saidTokens.has(n)
                if (saidNorm.includes(n)) return true                           // they typed the value verbatim
                const parts = valueTokens(v)
                // Every token of a one-word value must be said; for a multi-word value one exact token is enough
                // ("8.5" out of "8.5 Women"), which is how people actually write a size.
                return parts.length > 1 ? parts.some((t) => saidTokens.has(t)) : false
              }
              void saidIt
              // THE SHOPPER PICKS ON THE CHIPS (Alex, 2026-09-28: "let the user do that — they see all the available
              // options and pick them themselves, so it feels like a real shopping experience"). A size or colour typed
              // in the chat never adds a product with options and is never pre-selected: only the picker's own choice
              // counts (it rides on the message as metadata.pick, keyed by the axis kind or name), or a pick this chat
              // already made for this product (a later box update must not reopen the picker).
              const itemKey = String(last.saved_id || last.url || last.name || '')
              const lastUser = [...(messages || [])].reverse().find((m: any) => m?.role === 'user')
              let pickRaw: any = lastUser?.metadata?.pick && typeof lastUser.metadata.pick === 'object' ? lastUser.metadata.pick : null
              // A CHOICE TYPED FOR A PRODUCT WHOSE PICKER CARD IS OPEN (Alex, 2026-09-29: "I can even just say it in a
              // message … and the AI should still be smart"). It counts exactly like the chips' pick, but only when it
              // names one value of every choice on exactly ONE card, that card is this product's, and the combination is
              // buyable (utils/typedPick.ts). No card in the chat → nothing typed counts (the first search never preselects).
              let typedWhy: string | null = null
              if (!pickRaw) {
                const cards = pickerCards(messages)
                const mine = cards.some((c) => c.urls.some((u) => sameUrl(u, url)))
                const typed = cards.length ? resolveTypedPick(said, cards) : null
                if (typed?.ok && typed.urls.some((u) => sameUrl(u, url))) pickRaw = typed.pick
                else if (mine && typed && typed.ok === false && typed.reason !== 'no_match') {
                  typedWhy = typed.reason === 'marketplace' ? 'it is sold by a third-party marketplace seller (the card says who) — Boxly only buys what the store sells itself: say so and offer a similar product sold by the store'
                    : typed.reason === 'sold_out' ? 'the combination they typed is SOLD OUT — say so and ask them to choose another on the card'
                    : typed.reason === 'incomplete' ? `they did not say ${(typed.missing || []).join(' + ')} — ask for it (on the card)`
                    : typed.reason === 'colorway' ? 'the colour they typed is another colourway page — ask them to tap that colour on the card'
                    : 'their message matches more than one option or more than one open product card — ask which one, pointing at the card'
                }
              }
              let prior: any = null
              for (const m of messages || []) for (const p of (m?.role === 'assistant' ? (m.parts || []) : [])) {
                if (p?.type === 'tool-show_shipment' && p.state === 'output-available') for (const o of (Array.isArray(p.output?.store_options) ? p.output.store_options : [])) if (String(o?.key) === itemKey) prior = o
              }
              const multi = axes.filter((a: any) => (a?.values?.length || 0) > 1)
              const { chosen, missing } = pickedOptions(axes, pickRaw, prior)
              const given = Object.values(chosen).map(norm)
              const picked = missing.length === 0
              const isSize = (a: any) => a?.kind === 'size' || /size|talla/i.test(String(a?.name || ''))
              const isColour = (a: any) => a?.kind === 'color' || /colou?r/i.test(String(a?.name || ''))
              const askFor = multi.length === 1 && isSize(multi[0]) ? 'la talla'
                : multi.length === 1 && isColour(multi[0]) ? 'el color'
                : multi.every((a: any) => isSize(a) || isColour(a)) && multi.some(isSize) && multi.some(isColour) ? 'la talla y el color'
                : 'las opciones'
              if (realChoice && !picked) {
                const held = await buildShipment(items.slice(0, -1))
                return {
                  ...held, hold: true,
                  pending_item: { saved_id: last.saved_id, name: saved?.title || last.name || null, image: saved?.image || last.image || null, price: saved?.price ?? last.price ?? null },
                  variants_for: ship.variants_for,
                  note: `STOP — "${saved?.title || last.name}" IS NOT IN THE BOX AND YOU MUST NOT SAY IT IS. The words "agregué", "agregado", "ya está en tu caja", "añadí" are FORBIDDEN in this reply. It needs the shopper to pick ${multi.map((a: any) => a.name).join(' + ')} on the product's picker card in the chat (a typed choice counts only when it names exactly one option of every choice on that card and the combination is in stock${typedWhy ? ` — this one did not: ${typedWhy}` : ''}; nothing is pre-selected) (${avail.length} of ${r.variants.length} combinations available; the chips are already on screen, do NOT list the options in text). Reply with ONE short line in this shape: "Elige ${askFor} y lo agrego a tu caja 👇". Then STOP — no other tool calls. When the shopper picks on the chips, call show_shipment again for this product WITH that size and color, and only THEN say it is in the box.`,
                }
              }
              // THE STORE'S OWN WORDS GO TO THE STORE (live 2026-09-28: "color negro" reached Gymshark's cart run for a
              // product whose page IS the black colourway — it offers sizes only — and the add failed as "variant
              // unavailable"). An option the page offers is sent as the store's value ("S" -> "S (4-6)"); one it does
              // not offer is dropped (the page fixes it). boxFromMessages applies these to the box by product.
              {
                const sizeAxis = axes.find((a: any) => a?.kind === 'size' || /size|talla/i.test(String(a?.name || '')))
                const colourAxis = axes.find((a: any) => a?.kind === 'color' || /colou?r/i.test(String(a?.name || '')))
                const storeValue = (axis: any, said: any) => {
                  if (!axis) return null
                  const v = chosen[axis.name] ?? (axis.values || []).find((x: any) => norm(x) === norm(said)) ?? (axis.values || []).find((x: any) => given.includes(norm(x)))
                  return v != null ? String(v) : (axis.values?.length === 1 ? String(axis.values[0]) : (said ? String(said) : null))
                }
                if (axes.length) {
                  ship.store_options = [{
                    key: itemKey,
                    size: last.size || sizeAxis ? storeValue(sizeAxis, last.size) : null,
                    color: last.color || colourAxis ? storeValue(colourAxis, last.color) : null,
                    // Every other option picked on the chips (live New Balance: width "Standard (D)" never reached the
                    // store, so the agent read the page's default width and reported the size sold out).
                    options: Object.fromEntries(axes.filter((a: any) => a !== sizeAxis && a !== colourAxis && chosen[a.name] != null).map((a: any) => [String(a.kind && a.kind !== 'other' ? a.kind : a.name).toLowerCase(), chosen[a.name]])),
                  }]
                }
              }
              // A product with nothing to choose (the reader's lone "single" variant): never offer "single" as a size — live
              // 2026-10-01 the model added a BBW candle with size "single" and the invoice showed it.
              if (!axes.length) ship.note = `"${saved?.title || last.name}" has no size or colour to choose (one option${avail.length ? '' : ', out of stock'}): add it to the box as it is, with NO size and NO color.`
              // Past the hold above, the item IS going in with what was picked (Gerardo, Nike, 2026-10-01: this note still
              // said "ask which size/colour" while the box added Black/Sail/Sail M — two instructions that disagree).
              else ship.note = `"${saved?.title || last.name}" goes into the box with ${Object.entries(chosen).map(([k, v]) => `${k}: ${v}`).join(', ') || 'its only option'} (picked on the card). Do NOT ask for size or colour again.`
            } else if (r) {
              ship.note = `Variant read for "${saved?.title || last.name}" returned nothing (${r.reason || 'no_variants'}) — don't ask for size now; add it to the box as it is.`
            }
          }
          // A FREIGHT ITEM IN THE BOX IS A HANDOFF, NOT A SIZE. The card already draws it
          // outside the box; the model has to be told to stop selling it as a shipment and
          // hand it to a person — appended, so a variant note above survives.
          // The prompt already says "never state a piece-count capacity as fact — a guessed
          // 'caben entre 100 y 140' is a number the customer will hold us to". The model
          // opened with "llenarías la caja Chica con aproximadamente 85 a 90 paquetes"
          // anyway. Fourth prompt-only guarantee in this file to lose; same remedy.
          if (ship.bulk) {
            const bulkNote = `BULK ORDER (${Math.max(...ship.items.map((i: any) => i.quantity))} of one item). The box here is sized from a per-piece estimate inferred from the product title, which is good to about a factor of two — fine for three items, NOT fine for this many. You must NOT state how many pieces fit ("caben 90", "llenarías la Chica con 85 a 90") — that is a number the customer will hold us to and we have been wrong by a whole box size. Say the box shown is provisional and the exact count is confirmed when our team physically packs it in San Diego. Talk about the box as ONE cost spread over every piece, and offer the human: our purchasing team confirms stock, volume price and lead time before anything is paid.`
            ship.note = ship.note ? `${ship.note}\n\n${bulkNote}` : bulkNote
          }
          if (ship.unboxable?.length) {
            const freightNote = `NOT SHIPPABLE IN ANY BOX: ${ship.unboxable.join(', ')}. The biggest Boxly box is 52×62×53 cm, so there is no box size that works and you must NOT present one${ship.all_unboxable ? ' — there is no box in this shipment at all' : ' (the rest of the shipment is boxed normally)'}. Say ONE short line that this goes as carga especial, then call show_contact_whatsapp so the team can quote it. Do NOT invite them to add more to "aprovechar la caja" for this item.`
            ship.note = ship.note ? `${ship.note}\n\n${freightNote}` : freightNote
          }
          return ship
          })(input)
          // THE WHOLE BOX, as drawn (live 2026-10-05: the model sent only the new item, so this card's INPUT held one item;
          // the next add rebuilt the box from that input and the first store's product disappeared). The next card merges
          // onto this list, never onto the model's partial input (boxFromMessages).
          if (out && typeof out === 'object') out.box_items = input
          // What the card shows goes into the Boxly cart now (a held last item is not in the box yet), and
          // the item just added is checked for a store that closed its whole site (drop / waiting room) — the
          // agent's live browser will show that page, so the chat says it in words.
          if (token) {
            // The store's own option values go to the cart (not the model's words), from this card and earlier ones.
            const fixes = storeOptionFixes(messages, Array.isArray(out?.store_options) ? out.store_options : [])
            // The item just added keeps the exact page the shopper's add message named (the picker sends the picked
            // style's pinned link; the registry holds the gallery's family link) — only the same page, only this turn's add.
            const pinned = newestUserUrl(messages)
            const page = (u: any) => String(u || '').split(/[?#]/)[0].replace(/\/+$/, '')
            const samePage = (it: any) => !!pinned && (!it.url || page(it.url) === page(pinned)) && !!it.saved_id && storeRegistry.some((p: any) => p?.id === it.saved_id && p.url && page(p.url) === page(pinned))
            const pinnedInput = input.map((it: any, i: number) => i === input.length - 1 && samePage(it) ? { ...it, url: pinned } : it)
            const boxNow = (out?.hold ? pinnedInput.slice(0, -1) : pinnedInput).map((it: any) => withStoreOptions(it, fixes))
            const added = out?.hold ? null : wantedFromBox(boxNow.slice(-1), storeRegistry, carriedStores).wanted[0]
            const sent = new Set<string>()
            const [, lock] = await Promise.all([
              // A card that is ADDING a product (or holding one for its pick) never removes other cart lines: the model
              // sometimes lists only the new item, and the sync then emptied the real cart (live 2026-09-28: the
              // Gymshark leggings vanished when New Balance was added). Removing happens on a card that adds nothing.
              (out?.hold ? Promise.resolve(null) : syncBox(boxNow, added?.product_url ?? null, sent, { keepOthers: !!added && isNewAdd(boxNow) })).catch((e: any) => console.warn('[cart] box sync failed', e?.message || e)),
              added ? checkStoreLock(added.product_url) : null,
            ])
            // THE BOX IS NOT THE STORE CART (Alex, 2026-09-25: "ONLY after it's actually added to the store's cart
            // should the AI say ok, it's in your cart"). The agent is filling it now; the confirmation (or the
            // store's refusal) comes as its own message when the agent finishes — so this reply must not claim it.
            // An item the agent cannot buy (a marketplace link, no product page): in the box, but no store cart will
            // hold it — say so now, not at Finalizar.
            const unsupportedAdd = out?.hold ? null : wantedFromBox(input.slice(-1), storeRegistry, carriedStores).unsupported[0]
            if (unsupportedAdd) {
              const n = `STORE CART: "${unsupportedAdd}" is not from a store the Boxly agent can buy from (a store not on LIVE STORES, or no product page), so it will NOT go into a real store cart and Finalizar will refuse it. Tell the shopper in ONE short line (Spanish) that you can't add this one automatically, and offer to search the same kind of product live in a store that can. Do NOT say it was added to a cart.`
              out.note = out.note ? `${out.note}\n\n${n}` : n
            }
            if (added && !lock && sent.has(added.product_url) && !syncOnAdd) {
              // AN ADD IS INSTANT (Alex 2026-10-03: "boom, add it to cart and then just keep browsing … once they're done,
              // they click to finalize, and now they have all the carts built from multiple stores"). Nothing goes to the
              // store yet: the item is in their box, and the push is to keep consolidating — this store first, then others.
              const store = added.store_name || added.store_id
              out.store_cart = 'in_box'
              const boxNote = `IN THE BOX: "${added.title}" is in their Boxly box now (their options are saved). The store's real cart is built later, when they tap Finalizar, together with every other store, so do NOT say it is in ${store}'s cart and do NOT mention any live browser or video. Reply in Spanish with at most TWO short lines: (1) confirm it is in their box ✅, (2) push to consolidate: ask whether they want anything else from ${store}, and if not, which other store they want to shop next (everything ships together in one box, so more stores = better use of the same shipment). Mention Finalizar only as the step for when they are done shopping. No list, no link.`
              out.note = out.note ? `${out.note}\n\n${boxNote}` : boxNote
            }
            if (added && !lock && sent.has(added.product_url) && syncOnAdd) {
              const store = added.store_name || added.store_id
              out.store_cart = 'adding'
              // EXACT text, like the store-cart result's (Alex 2026-10-01: "¿…o pasamos a finalizar?" came while the agent was
              // still adding — the box room and Finalizar belong to the confirmation that follows, not to this line).
              const addingLine = added.find ? `Lo estoy buscando en ${store} y agregando a tu carrito — míralo en vivo aquí 👇` : `Lo estoy agregando a tu carrito de ${store} — míralo en vivo aquí 👇`
              const addingNote = `STORE CART: "${added.title}" is going into ${store}'s REAL cart RIGHT NOW — the Boxly agent is adding it in the live browser card below. Reply with EXACTLY this one line and nothing else (no box space, no "algo más", no Finalizar, no question, no link): "${addingLine}". A message follows automatically as soon as ${store} confirms it (or says it can't).`
              out.note = out.note ? `${out.note}\n\n${addingNote}` : addingNote
            }
            if (lock && added) {
              const store = added.store_name || added.store_id
              out.store_closed = { store, message: lock.message }
              const why = lock.kind === 'queue'
                ? `${store} has every visitor in a virtual waiting line right now`
                : `${store} has closed its whole website right now${lock.message ? ` — its page says: "${lock.message}"` : ''}`
              const closedNote = `STORE CLOSED: ${why}. The item stays in the box, but the Boxly agent cannot put it in ${store}'s cart until the store opens; the live browser card in the chat shows exactly that page. Tell the shopper in ONE or two short lines in Spanish: ${store} cerró su tienda por ahora (translate the store's reason and opening time, converting nothing), they can see it in the live browser below, and they can wait until it opens or pick the same kind of product from another store (offer to search). Do NOT say it is in ${store}'s cart, and write NO link or URL (the live card is the view).`
              out.note = out.note ? `${out.note}\n\n${closedNote}` : closedNote
            }
          }
          return out
        },
      }),

      show_contact_whatsapp: tool({
        description: "Show a WhatsApp contact button. Use it when Boxly CANNOT handle the request through normal box shipping — an OVERSIZED / non-box item that won't fit our standard consolidation boxes (a vehicle or golf cart, a large appliance like a fridge / washer / freeze dryer, furniture, a mattress, tires, or anything very large or heavy), OR any case the customer clearly needs a person for (a special/bulk order, a problem). Keep YOUR text SHORT — ONE friendly line ('Eso es más grande de lo que entra en nuestras cajas estándar, pero el equipo te puede ayudar directo 👇') — then call this so they get a WhatsApp button. Do NOT write a long essay listing what we can/can't ship, and do NOT try to search for it. Pass a short es-MX `reason` for the card.",
        inputSchema: z.object({
          reason: z.string().describe('One short es-MX line for the card, e.g. "Para artículos grandes que no entran en caja, te ayudamos directo por WhatsApp."').optional(),
        }),
        execute: async ({ reason }: any) => ({ whatsapp: 'https://wa.me/16195591910', reason: reason || 'Para este tipo de artículo, nuestro equipo te ayuda directo por WhatsApp.' }),
      }),
      // ONE TAPPABLE QUESTION BEATS A VAGUE GALLERY. "Un disfraz de Batman" could be for a man, a woman or a
      // five-year-old, and those are three different products — searching before knowing spends the turn on
      // rows that are mostly wrong. Asking in TEXT is worse than not asking, because the shopper then has to
      // type; these render as buttons they tap (Alex, 2026-09-15, comparing how Meta's assistant does it).
      ask_to_narrow: tool({
        description: "Ask ONE short question with 2-4 tappable answers, when the ask is too broad for a good gallery and the answer would genuinely change WHICH PRODUCTS you return — who it is for (hombre / mujer / niño), a category fork (disfraz completo / solo la máscara), an occasion. Use it BEFORE searching, in a turn of its own: do NOT call a product tool in the same turn, and do NOT repeat the question in your text — the card shows it. Never use it for size or colour (the variant picker does that), never for anything you can reasonably assume, and never twice in a row — one question, then search with what they answered. A specific ask ('tenis Nike Pegasus 41 talla 9') must go straight to the search.",
        inputSchema: z.object({
          question: z.string().describe('The question, short and in the shopper\'s language, e.g. "¿Para quién es el disfraz?"'),
          options: z.array(z.string().describe('One tappable answer, 1-4 words, e.g. "Para hombre". It is sent as the shopper\'s next message, so write it as something they would say.')).min(2).max(4),
        }),
        // UI-only, exactly like suggest_followups: the card is the answer, there is nothing to fetch.
        execute: async ({ question, options }: any) => ({ question, options }),
      }),

      show_box_guide: tool({
        description: "Show Boxly's box SIZES and SHIPPING PRICES as a table in the chat. Call this whenever the customer asks about box sizes, shipping/box prices or cost — '¿cuánto cuesta el envío?', '¿qué cajas tienen?', '¿cuánto cuesta mandar una caja?', '¿cuáles son las medidas/precios?', 'how much is shipping'. The box price is the shipping cost for the WHOLE consolidated box (the product cost + Boxly's 15% commission are SEPARATE). After showing it, answer their question briefly and steer them to consolidate into the smallest box that fits.",
        inputSchema: z.object({}),
        execute: async () => ({ boxes: await boxGuide() }),
      }),

      feature_products: tool({
        description: "Reorder the gallery to lead with the product(s) you just recommended, so what's shown FIRST matches your recommendation. Call this in the SAME turn, right after your recommendation text, passing the EXACT title(s) of the item(s) you spotlighted (best first, 1–3). The customer sees your top pick at the front of the carousel instead of having to scroll to it. Always do this whenever you highlight specific products.",
        inputSchema: z.object({
          titles: z.array(z.string()).min(1).max(3).describe('Exact title(s) of the recommended product(s), best first — copied from the gallery items you just saw.'),
        }),
        execute: async ({ titles }) => ({ featured: (titles || []).map((t) => String(t).trim()).filter(Boolean).slice(0, 3) }),
      }),

      suggest_followups: tool({
        description: "Offer 1–3 SHORT, tappable next steps right after you show a product gallery — your cross-sell / 'build the full set' nudge. Lead with a COMPLEMENTARY item that pairs with what you just showed (e.g. after pink leggings → a matching pink sports bra, then a matching top/hoodie), and you may add another color/variant or an adjacent deal-heavy brand. Each suggestion MUST be a ready-to-send FIRST-PERSON shopper message (exactly what the user taps to say), e.g. \"Búscame un sports bra rosa de YoungLA que combine\" or \"Muéstrame un top que haga juego\". Be specific to what was just shown — never generic like \"ver más\". This is NOT a product/gallery tool, so call it in the SAME turn IN ADDITION to your one product tool, as the LAST thing after your short text line. Renders as tappable chips under your message.",
        inputSchema: z.object({
          suggestions: z.array(z.string()).min(1).max(3).describe('1–3 ready-to-send first-person follow-up messages, complementary to what was just shown.'),
        }),
        execute: async ({ suggestions }) => ({ suggestions: (suggestions || []).map((s) => String(s).trim()).filter(Boolean).slice(0, 3) }),
      }),

      live_gallery: tool({
        description: "THE product search — show products by opening the store's OWN website in a live browser the shopper watches in the chat. It searches the store's own search box for `query` and the gallery (photo, name, price, link) appears in the chat by itself when the browser is done (about 10–30 s); this call returns at once with the live browser on screen. `stores`: the store the shopper named, or — when they named none — the best-known stores for the category from LIVE STORES (several run side by side). Use it for EVERY product request, after at most ONE narrowing question when the ask is vague. Never list or invent products before the gallery arrives.",
        inputSchema: z.object({
          query: z.string().describe('What to type in the store\'s own search box: SHORT product words IN ENGLISH, e.g. "running shoes", "leggings", "women hoodie". No store names, no prices, no sizes.'),
          stores: z.array(z.string()).min(1).max(4).describe('Store names from LIVE STORES, e.g. ["Gymshark"] or ["On", "New Balance", "Nike"]. The store the shopper named, else the best-known ones for this category.'),
        }),
        execute: async ({ query, stores }: any) => {
          if (restrictedAsk(messages)) return REFUSAL
          // A guest: live search needs an account (the session, the conversation and the cart are theirs).
          if (!token) return { ok: false, error: 'not_authenticated', note: 'NO LIVE GALLERY — this visitor is not signed in. Call create_account now with ONE short line in Spanish saying that to search it live in the store they need their free Boxly account and you bring them right back here. Do NOT describe or list products.' }
          const stop = (error: string, why: string) => ({ ok: false, error, note: `NO LIVE GALLERY — ${why} Nothing is on screen; do NOT describe products.` })
          if (!conversationId) return stop('no_conversation', 'this chat is not saved yet. Say ONE short line asking them to send the request again.')
          const q = liveGalleryQuery(query)
          if (q.length < 2) return stop('empty_query', 'there was nothing to search for. Ask what they are looking for with ask_to_narrow.')
          const live = liveCatalog || await liveStoreList(token)
          if (!live) return stop('live_unavailable', 'the live store browser is not available right now. Say so in ONE short line and offer to try again in a moment.')
          const { stores: picked, unknown } = resolveLiveStores(stores, live.stores, live.max)
          if (!picked.length) return stop('unknown_store', `${unknown.join(', ') || 'That store'} cannot be opened live yet. Say so in ONE short line and offer the closest store from: ${live.stores.map((st) => st.name).join(', ')}.`)
          const r: any = await callApi('/live-shopping/sessions', {
            method: 'POST', token, timeoutMs: 15000,
            body: { conversation_id: conversationId, objective: q, store_id: picked[0].id, ...(picked.length > 1 ? { store_ids: picked.map((st) => st.id) } : {}) },
          }).catch(() => ({ ok: false, status: 0 }))
          if (r?.ok === false || !Number.isInteger(r?.id)) {
            if (r?.status === 409) return stop('live_busy', 'a live store browser is still running for this shopper. Say ONE short line: the one on screen is finishing, and to ask again in a moment.')
            if (r?.code === 'too_many_stores') liveStoresCache = null
            return stop(r?.code === 'store_unsupported' ? 'store_unsupported' : 'live_unavailable', 'the live store browser could not start. Say so in ONE short line and offer to try again in a moment.')
          }
          // The live card goes up now; the products land in the chat when the engine is done (the API appends them
          // as a live-results message, and the chat fetches it the moment the browser ends).
          galleryShown = true
          liveSearchQuiet = !unknown.length
          const names = picked.map((st) => st.name)
          return {
            ok: true,
            query: q,
            stores: names,
            live_session: { id: r.id, store_id: r.store_id || picked[0].id, store_name: names.join(' · '), status: r.status || 'pending', note: `Buscando "${q}" en ${names.join(', ')}` },
            ...(unknown.length ? { skipped: unknown } : {}),
            note: unknown.length ? `LIVE — the browser is on screen, searching "${q}" at ${names.join(', ')}; the gallery appears by itself. Write ONE short line in Spanish only saying ${unknown.join(', ')} cannot be opened live yet. Do NOT list, invent or promise products.` : `LIVE — the chat already showed the shopper that you are checking ${names.join(', ')} in a live browser. Write NO text. Do NOT list, invent or promise products — the gallery arrives by itself.`,
          }
        },
      }),

      finalize_order: tool({
        description: "Finalize the shopper's box. Takes NO input: it reads the box card itself, puts exactly those items in the shopper's Boxly cart and places the order. The Boxly agent then fills each store's real cart and checks out to our San Diego warehouse live in the chat (the card shows each store's browser and its real total), and the invoice with a Pagar button appears in that same card when every total is verified. Call it when the shopper finalizes (\"finaliza\", \"eso es todo\", \"crea mi pedido\"). ",
        inputSchema: z.object({}),
        execute: async () => {
          if (!token) return authedNote
          const stop = (error: string, why: string) => ({ ok: false, error, note: `NOT FINALIZED — ${why} Nothing was ordered and no card is on screen; do NOT say the order was placed.` })
          const box = boxFromMessages(messages)
          if (!box?.length) return stop('empty_box', 'the box is empty. Say ONE short line inviting them to add products first.')
          const { wanted, unsupported } = wantedFromBox(box, storeRegistry, carriedStores)
          if (unsupported.length) {
            return { ...stop('unsupported_items', `${unsupported.join(', ')} ${unsupported.length > 1 ? 'are' : 'is'} not from a store the Boxly agent can buy from (a marketplace, or no product page). Say ONE short line naming ${unsupported.length > 1 ? 'them' : 'it'} and ask the shopper to take ${unsupported.length > 1 ? 'them' : 'it'} out of the box, or to search the same product live in a store that can.`), unsupported }
          }
          // FINALIZAR NEVER REMOVES (live 2026-10-03: the last card listed only the Gymshark items and the sync deleted the two Alo
          // lines from the order): the chat's cart is the order; this sync only adds or updates what the box card shows.
          if (await syncBox(box, null, new Set(), { keepOthers: true })) return stop('cart_update_failed', 'the cart could not be updated. Say ONE short line that it failed and to tap Finalizar again in a moment.')
          const cartNow = await callApi(conversationId ? `/cart?conversation_id=${conversationId}` : '/cart', { token })
          const fin = await callApi('/cart/finalize', { method: 'POST', token, body: conversationId ? { conversation_id: conversationId } : {} })
          if (fin?.ok === false || !fin?.purchase_request_id) return stop('finalize_failed', 'the order could not be placed. Say ONE short line that it failed and to tap Finalizar again in a moment.')
          // every store the order holds (the cart), not only the stores on the last card
          const stores = [...new Set([...(Array.isArray(cartNow?.items) ? cartNow.items : []), ...wanted].map((w: any) => w.store_name || w.store_id))]
          return {
            ok: true,
            purchase_request_id: fin.purchase_request_id,
            request_number: fin.request_number ?? null,
            stores,
            note: `DONE — the order is placed. The Boxly agent is now building the real cart at ${stores.join(', ')} in the background and checking out to our warehouse; the invoice is EMAILED to the shopper in a few minutes (it also appears in the order card with Pagar). The chat shows the checkout LIVE (Alex 2026-10-07). Say ONE short line in Spanish, like: "¡Listo! 🙌 Mira en vivo cómo armamos tu carrito en ${stores.join(' y ')} 👀 En unos minutos te llega la factura a tu correo."  Do NOT state prices, totals or the request number, and call no other tool.`,
          }
        },
      }),

      // NOTE: there is deliberately NO create_purchase_request tool. Letting the
      // model place the order directly was unreliable — it would fabricate a PR
      // number in its reply ("He registrado tu solicitud PR-26-ALEPE") with NO
      // request ever created. The order is placed by finalize_order from the box the
      // shopper sees, and only its checkout card shows the real request.

      get_profile: tool({
        description: "Get the signed-in user's profile for PERSONALIZATION (sizes, brands, preferences). Do NOT read the casillero/US address out loud — if they need it, send them to the Casillero section of their dashboard or WhatsApp.",
        inputSchema: z.object({}),
        execute: async () => (token ? callApi('/profile', { token }) : authedNote),
      }),

      list_orders: tool({
        description: "List the signed-in user's orders and their status.",
        inputSchema: z.object({}),
        execute: async () => (token ? callApi('/orders', { token }) : authedNote),
      }),

      // Rich tracking card (hub). Renders a visual shipment status timeline for one
      // order, or a tappable list of all the user's orders. PREFER this over
      // list_orders on the dashboard — it draws the UI instead of listing text.
      // In-person (Las Americas): the customer books a day and hour on /in-person, so the
      // tool only renders a "Reserva tu horario" link card (nothing to load here).
      plan_in_person: tool({
        description: "Show a 'Reserva tu horario' card linking to the IN-PERSON shopping booking page (Boxly's shopper goes shopping anywhere in San Diego for the customer: they pick a day and hour there and pay a deposit to hold it). Call this when they want in-person / presencial shopping ('vayan por mí', 'compras presenciales', 'compras en San Diego', 'shop for me at the outlets'). Requires the user to be signed in.",
        inputSchema: z.object({}),
        execute: async () => (token ? { url: '/in-person' } : authedNote),
      }),

      show_orders: tool({
        description: "Show the customer's orders/shipments as an INTERACTIVE card (not text). Call with no args to render a tappable LIST of all their orders; call with order_id (or order_number) to render that order's visual STATUS TIMELINE (Recibido → Cotización → Pagado, etc.) with its tracking number and ETA. Use this whenever they ask '¿dónde está mi envío/pedido?', 'mis pedidos', 'estado de mi orden', or tap a shipment. Requires the user to be signed in.",
        inputSchema: z.object({
          order_id: z.union([z.number(), z.string()]).describe('A specific order id or order_number to show the status timeline for. Omit to list all their orders.').optional(),
        }),
        execute: async ({ order_id }) => {
          if (!token) return authedNote
          if (order_id != null && String(order_id).trim() !== '') {
            // Accept either a numeric id or an order_number (resolve the latter).
            let id: any = order_id
            if (!/^\d+$/.test(String(order_id))) {
              const listed: any = await callApi('/orders', { token })
              const arr = Array.isArray(listed?.data) ? listed.data : (Array.isArray(listed) ? listed : [])
              const match = arr.find((o: any) => String(o.order_number).toLowerCase() === String(order_id).toLowerCase())
              id = match?.id ?? order_id
            }
            const r: any = await callApi(`/orders/${id}`, { token })
            if (!r || r.ok === false) return { error: 'not_found', message: 'No encontré ese pedido.' }
            return { order: compactOrder(r) }
          }
          const r: any = await callApi('/orders', { token })
          const arr = Array.isArray(r?.data) ? r.data : (Array.isArray(r) ? r : [])
          return { orders: arr.map(compactOrder) }
        },
      }),

      update_shopping_profile: tool({
        description: "Save durable facts about THIS shopper to their long-term memory (persists across all chats). Call it proactively the moment you learn something — a size, a favorite/disliked brand, a category they shop, gender, budget, style — not just at checkout. Additive deep-merge: send ONLY the keys you learned (lists union, keys overwrite).",
        inputSchema: z.object({ profile: z.record(z.string(), z.any()).describe('Partial profile to merge. Canonical shape: {gender, sizes:{shoe:["9 US","10 US"],…}, favorite_brands:[], disliked_brands:[], categories:[], budget:{typical,max}, interests:[], style_notes}. Sizes are LISTS. Do NOT store why the customer buys. E.g. {sizes:{shoe:["9.5 US","10 US"]}, favorite_brands:["Nike"]}.') }),
        execute: async ({ profile }) => (token ? callApi('/me/shopping-profile', { method: 'PUT', token, body: { profile } }) : authedNote),
      }),

      // CLIENT-executed (no execute): the browser collects the PROOF OF PURCHASE
      // file (which only exists in the browser) + confirms the delivery address,
      // then creates a normal SHIPPING order (casillero / compra propia, NO 15%)
      // for an item the user bought THEMSELVES, and resumes the conversation.
      create_self_order: tool({
        description: 'Create a normal SHIPPING order (CASILLERO / compra propia) for a product the user ALREADY BOUGHT THEMSELVES — NOT a Purchase Request, and NO 15% commission (that fee is exclusive to assisted purchase). Call this the moment the user says they bought it on their own ("ya lo compré", "lo compré yo", "yo lo compro"/"lo compro yo en la tienda"). The app then asks them to upload their proof of purchase (comprobante/recibo) to verify it and to confirm the Mexico delivery address, then creates the order. PREFER binding each item to the registry via saved_id so the exact product/store/price/image are used.',
        inputSchema: z.object({
          items: z.array(z.object({
            saved_id: z.string().describe('Registry id of a product already shown in this chat — binds the exact product/price/image. When set, product_name/product_url/price/image are taken from the registry.').optional(),
            product_name: z.string().describe('Required only if no saved_id.').optional(),
            product_url: z.string().describe('Required only if no saved_id.').optional(),
            product_image_url: z.string().describe('Image URL of the product. Auto-filled from the registry when saved_id is set.').optional(),
            price: z.number().describe('Listed USD price they paid; 0 if unknown. Ignored when saved_id resolves a price.').optional(),
            quantity: z.number().int().min(1).default(1),
            notes: z.string().describe('Size/color/variant notes.').optional(),
          })).min(1),
        }),
      }),

      // CLIENT-executed (no execute): the browser shows a ConfirmDialog, and on
      // confirm cancels the order via the API. Kept client-side so the user has an
      // explicit confirm gate before a destructive write (never cancel silently).
      cancel_order: tool({
        description: "Cancel one of the customer's orders. Use when they clearly ask to cancel/remove an order (e.g. 'cancela mi pedido 26AB', 'ya no quiero ese envío'). Pass the order_id or order_number. This opens a confirmation dialog — the customer must confirm before anything is cancelled. Only works while the order is still collecting/awaiting packages; the app will say if it can't be cancelled.",
        inputSchema: z.object({
          order_id: z.union([z.number(), z.string()]).describe('The order id or order_number to cancel.'),
          order_number: z.string().describe('The order number for display, if known.').optional(),
        }),
      }),

      // CLIENT-executed (no execute): the browser shows a "create account" button
      // that sends the guest to the register page (email or Google) and brings
      // them back to THIS chat, resumed, to finish the order. You do NOT collect
      // their details — the register page does. Just call this to open the gate.
      create_account: tool({
        description: "Open the account gate for a GUEST: live product search, the box and every order need a Boxly account (the live browser, the cart and the order are theirs). The app shows a button that takes them to register (email or Google) and returns them to this chat with their order ready to confirm — so you do NOT need to ask for name/email/phone yourself. Call it the moment a guest asks for products or wants to order. After this, the conversation continues once they're back and signed in.",
        inputSchema: z.object({}),
      }),
    },
  })

  // Attach the off-loop follow-up chips to THIS assistant message right before its
  // `finish` chunk: wait (bounded) for followupsPromise — it started when the gallery
  // returned, so by the time the recommendation text has streamed it is normally
  // already resolved — and emit the same tool chunks the model used to produce.
  const ui = result.toUIMessageStream({ onError: (error) => (error instanceof Error ? error.message : String(error)) })
  return createUIMessageStreamResponse({ stream: attachFollowupChips(ui, () => followupsWithin(followupsPromise)) })
})
