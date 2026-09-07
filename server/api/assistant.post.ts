import { streamText, tool, convertToModelMessages, stepCountIs, createUIMessageStreamResponse } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { extractText, getDocumentProxy } from 'unpdf'
import { z } from 'zod'
import { FALLBACK_KNOWLEDGE } from '../utils/boxlyKnowledge'
import { curateProducts, floatRequestedStore } from '../utils/curate'
import { chatModel, isAnthropic, providerOptions, hasModelKey } from '../utils/aiProvider'
import { ageGalleries, windowMessages, withContextOnLastUser, dropToolParts, contextStats, WINDOW_DEFAULTS } from '../utils/chatContext'
import { generateFollowups, followupPart, followupsWithin, attachFollowupChips } from '../utils/followups'
import { readSummary, summaryBlock, summarize, shouldSummarize } from '../utils/chatSummary'

/**
 * AI shopping-assistant chat backend (Phase 2).
 *
 * Streams Claude with:
 *  - web_search (native) for product discovery,
 *  - extract_product (public API) to read a chosen product page,
 *  - authed tools (get_profile / list_orders /
 *    update_shopping_profile) that call the Boxly API with the user's bearer
 *    token, and
 *  - create_account: a CLIENT-executed tool (no server execute) so the browser
 *    runs /auth/chat-register itself and gets the SPA session cookie.
 *
 * The frontend (useChat) sends { messages, token?, shoppingProfile? }.
 */

const API_BASE = (process.env.API_URL || 'https://api.boxly.mx').replace(/\/$/, '')

// The Boxly product catalog (our SERP replacement): products harvested from our
// favorite stores by the computer-use agents. The app reaches it through the
// Boxly API's /catalog/search, which proxies the standalone catalog service on
// the fullstack domain (app → Boxly API → catalog API).
interface CatalogSearchArgs {
  query?: string; store?: string; brands?: string[]; category?: string
  min_price?: number; max_price?: number; min_discount?: number; sale?: boolean; sort?: string
}
async function searchCatalogApi(a: CatalogSearchArgs) {
  const qs = new URLSearchParams()
  if (a.query) qs.set('q', a.query)
  if (a.store) qs.set('store', a.store)
  if (a.brands && a.brands.length) qs.set('brands', a.brands.join(','))
  if (a.category) qs.set('category', a.category)
  if (a.min_price != null) qs.set('min', String(a.min_price))
  if (a.max_price != null) qs.set('max', String(a.max_price))
  if (a.min_discount != null) qs.set('min_discount', String(a.min_discount))
  if (a.sale) qs.set('sale', '1')
  if (a.sort) qs.set('sort', a.sort)
  qs.set('limit', '16')
  let products: any[] = []
  let miss: any = {}
  try {
    const data: any = await callApi(`/catalog/search?${qs.toString()}`, { timeoutMs: 12000 })
    products = Array.isArray(data?.products) ? data.products : []
    // Miss signals the model MUST act on (go live for the exact item). no_exact_match =
    // a specific model the shopper named (e.g. "9060") is in NO result; query_matched=false
    // = nothing actually matched their words (the rows are same-store/deal filler).
    miss = { no_exact_match: !!data?.no_exact_match, missing_terms: data?.missing_terms || [], query_matched: data?.query_matched !== false }
  } catch { products = [] }
  return { products: products.map(toGalleryProduct), source: 'catalog', ...miss }
}

// One catalog/live SERP row → the gallery's product shape.
function toGalleryProduct(p: any) {
  return {
    title: p.title,
    url: p.url,
    source_url: p.url,
    product_url: p.url,
    price: p.price,
    was: p.was,
    on_sale: p.on_sale,
    discount_pct: p.discount_pct,
    image: p.image || null,
    images: p.image ? [p.image] : [],
    store: p.store,
    availability: p.availability,
    see_in_cart: p.see_in_cart,
    seen_at: p.seen_at,
  }
}

// The DYNAMIC "showing": curate over the catalog's UNDERSTANDING layer (gender,
// department, category, deal_score/tier, style/occasion/season tags, variant dedupe).
// For broad/deal queries this beats a raw search — it returns a personalized, VARIED,
// suspect-free best-of set (a per-call seed rotates it, so the same request never shows
// the same list twice). Each item carries a precomputed evergreen `why` (Spanish) the
// model speaks to; the live price/discount come from the row itself.
interface CurateArgs {
  query?: string; intent?: string; department?: string; genders?: string[]; categories?: string[]
  occasion_tags?: string[]; season_tags?: string[]; style_tags?: string[]; gift?: boolean
  brand_tiers?: string[]; store?: string; min_price?: number; max_price?: number; limit?: number
}
async function curateCatalogApi(a: CurateArgs) {
  const body: any = {
    query: a.query, intent: a.intent || 'deals', department: a.department, genders: a.genders,
    categories: a.categories, occasion_tags: a.occasion_tags, season_tags: a.season_tags,
    style_tags: a.style_tags, gift: a.gift, brand_tiers: a.brand_tiers, store: a.store,
    pool_size: 48, per_store_cap: 2, limit: a.limit ?? 12,
    seed: (Math.random() * 1e9) | 0, // fresh rotation each call → never the same list
  }
  if (a.min_price != null) body.price_min = a.min_price
  if (a.max_price != null) body.price_max = a.max_price
  let products: any[] = []
  let query_matched = true
  try {
    const data: any = await callApi('/catalog/curate', { method: 'POST', body, timeoutMs: 12000 })
    products = Array.isArray(data?.products) ? data.products : []
    // query_matched=false → the shopper's words matched nothing; these are best-DEALS filler,
    // not what they asked for. The model must not present them as the answer.
    query_matched = data?.query_matched !== false
  } catch { products = [] }
  return { products: products.map(toCurateGalleryProduct), source: 'catalog', query_matched }
}
// Curate row → gallery shape + the enrichment fields the model speaks to (why/deal_tier).
function toCurateGalleryProduct(p: any) {
  return { ...toGalleryProduct(p), why: p.why_good || null, who_for: p.who_its_for || null, deal_tier: p.deal_tier || null }
}

// Curated COLLECTIONS — the precomputed "understanding → showing" sets the assistant
// surfaces proactively (deal-driven + store-spotlight). The menu is stable and mirrors
// catalog/collections.mjs; it's injected into the prompt so the model picks one from the
// conversation and calls show_collection with its id (one tool call, no discovery hop).
const COLLECTION_MENU: { id: string; title: string }[] = [
  { id: 'ofertas-estrella', title: 'Ofertas estrella (los descuentos más fuertes)' },
  { id: 'ofertas-ropa', title: 'Ofertas en ropa' },
  { id: 'ofertas-bolsas', title: 'Ofertas en bolsas' },
  { id: 'ofertas-belleza', title: 'Ofertas en belleza' },
  { id: 'ofertas-tenis', title: 'Ofertas en tenis' },
  { id: 'ofertas-hombre', title: 'Ofertas para él' },
  { id: 'ofertas-mujer', title: 'Ofertas para ella' },
  { id: 'spotlight-coach-outlet', title: 'Lo mejor de Coach Outlet' },
  { id: 'spotlight-kipling', title: 'Kipling en oferta' },
  { id: 'spotlight-old-navy', title: 'Lo mejor de Old Navy' },
  { id: 'spotlight-gap', title: 'Lo mejor de Gap' },
  { id: 'spotlight-nike', title: 'Nike en oferta' },
  { id: 'spotlight-dicks', title: 'Deportes en oferta (Dick’s)' },
  { id: 'spotlight-bath-body-works', title: 'Bath & Body Works en oferta' },
]
const COLLECTION_IDS = COLLECTION_MENU.map((c) => c.id) as [string, ...string[]]

// One curated collection by id, served live (rotates per call). Returns the products in
// the same gallery shape as curate, plus the collection header (title/subtitle) so the
// gallery can headline it. Fails SOFT to empty.
async function getCollectionApi(id: string, exclude_ids?: string[]) {
  const body: any = { id, limit: 12, seed: (Math.random() * 1e9) | 0 }
  if (exclude_ids?.length) body.exclude_ids = exclude_ids
  let data: any = {}
  try { data = await callApi('/catalog/collection', { method: 'POST', body, timeoutMs: 12000 }) } catch { data = {} }
  const products = Array.isArray(data?.products) ? data.products.map(toCurateGalleryProduct) : []
  return { products, source: 'catalog', collection: { id, title: data?.title || null, subtitle: data?.subtitle || null, kind: data?.kind || null } }
}

// The live-grab fallback: fetch a specific product our catalog doesn't have with the
// computer-use agent (a pasted link, or store+query). Heavy (~7-9s) — the AI only
// reaches for it on a genuine catalog miss or a pasted link. Fails SOFT: any error/
// block/miss comes back as empty products plus a `reason` the model can act on.
async function liveGrabApi(a: { url?: string; store?: string; query?: string }) {
  let data: any = {}
  try {
    data = await callApi('/catalog/live-grab', { method: 'POST', body: a, timeoutMs: 58000 })
  } catch { data = { error: 'unreachable' } }
  // Upstream returns {product} (exact) | {products, note:'closest'} | {error|blocked|no_match|busy}.
  const raw: any[] = Array.isArray(data?.products) ? data.products : (data?.product ? [data.product] : [])
  const reason: string | null = data?.error ? String(data.error)
    : data?.blocked ? 'blocked'
    : data?.busy ? 'busy'
    : data?.no_match ? 'no_match'
    : null
  return {
    products: raw.map(toGalleryProduct),
    live: true,
    exact: !!data?.product,
    note: data?.note || null, // 'closest' when the exact item wasn't found
    reason,                    // null on success; a code the model can explain otherwise
    source: 'live',
  }
}
// The OUT-OF-CATALOG fallback: when Boxly doesn't carry a product, the computer-use agent
// runs a GOOGLE SHOPPING search and returns real cross-web options (merchant, price, image,
// buyable link) — the shopper orders it through Boxly. Heavy (~16-32s) + rate-limited
// (Google walls sustained use → {blocked, cooling}). Fails SOFT: any block/miss/error comes
// back as empty products + a reason the model explains.
async function getGoogleShopApi(query: string) {
  let data: any = {}
  try {
    data = await callApi('/catalog/google-shop', { method: 'POST', body: { query }, timeoutMs: 58000 })
  } catch { data = { error: 'unreachable' } }
  const raw: any[] = Array.isArray(data?.products) ? data.products : []
  const reason: string | null = data?.error ? String(data.error)
    : data?.blocked ? (data?.cooling ? 'cooling' : 'blocked')
    : data?.busy ? 'busy'
    : data?.no_results ? 'no_results'
    : null
  return {
    products: raw.map((p) => ({ ...toGalleryProduct(p), merchant: p.merchant || p.store || null, source: 'google' })),
    source: 'google',
    from_web: true,          // the model MUST frame these as found on the web, orderable via Boxly
    reason,                  // null on success; 'cooling'/'blocked'/'no_results'/an error code otherwise
    retry_after_s: data?.retry_after_s ?? null,
  }
}
// Which model/provider runs this chat is decided centrally in ../utils/aiProvider
// (chatModel()), so the whole app can switch between Gemini and Claude via env.

// Gallery ranking now lives in one shared "smart curate" pass — see
// server/utils/curate.ts (relevance + color/attribute match + trust in a single
// model call, plus the deterministic requested-store float). Used below by
// search_products.

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

const PRODUCT_TOOLS = new Set(['search_products', 'curate_products', 'show_collection', 'find_live_product', 'find_on_google', 'browse_store', 'browse_stores', 'show_products', 'show_saved_products', 'extract_product', 'web_search'])

// Is this search a PURE store/brand lookup (e.g. "Rhode", "Gymshark", "productos
// de Nike") rather than an attribute search ("owala rosa", "black wide-leg jeans")?
// A store-only search wants that brand's catalog shown INSTANTLY — the deterministic
// store-float already puts the brand first, so we skip the AI relevance re-rank
// (which can add up to ~3.5s). We only run curate when the shopper added real
// descriptive terms to filter by. Signal: the `store` param is set, and stripping
// the store words + generic filler from the query leaves nothing meaningful.
const STORE_FILLER = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'from', 'in', 'en', 'the', 'a', 'my', 'mi', 'productos', 'products', 'producto', 'product', 'tienda', 'store', 'marca', 'brand', 'all', 'todo', 'toda', 'todos', 'todas', 'cosas', 'articulos', 'articulo', 'items', 'item'])
function isPureStoreQuery(query: string, store?: string): boolean {
  if (!store || !store.trim()) return false
  // NFD + strip non-alphanumerics: "café" → "cafe", so accents don't split tokens.
  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, ' ').trim()
  const q = norm(query)
  if (!q) return true
  const storeTokens = new Set(norm(store).split(' ').filter(Boolean))
  const remaining = q.split(' ').filter((t) => t && !storeTokens.has(t) && !STORE_FILLER.has(t))
  return remaining.length === 0
}

// Tools that RENDER a product gallery on the client. We enforce "ONE gallery per
// reply" in CODE, not just the prompt: once one of these returns products, a
// per-request flag flips and prepareStep() removes ALL gallery tools from the
// toolset for the rest of the turn — so the model physically cannot fire a second
// (often empty) gallery. Claude obeyed the prompt rule; Gemini does not, calling a
// gallery tool again in a later step and rendering a duplicate empty gallery.
const GALLERY_TOOLS = ['search_products', 'curate_products', 'show_collection', 'find_live_product', 'find_on_google', 'browse_store', 'browse_stores', 'show_products', 'show_saved_products']
// Everything the model may still use AFTER a gallery has rendered (write text, add
// follow-ups, build the shipment, take the order) — i.e. all tools minus GALLERY_TOOLS.
const NON_GALLERY_TOOLS = [
  'web_search', 'extract_product', 'show_shipment', 'show_box_guide', 'feature_products',
  'show_assisted_summary', 'get_profile', 'list_orders', 'show_orders',
  'update_shopping_profile', 'create_self_order', 'cancel_order', 'plan_in_person', 'create_account',
]
// The loop toolset before a gallery has shown: everything except suggest_followups —
// the chips are generated OFF the loop (server/utils/followups.ts), so the model never
// spends a round-trip on them (its persisted parts are dropped from the transcript).
const LOOP_TOOLS = [...GALLERY_TOOLS, ...NON_GALLERY_TOOLS]
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

// Analytics: a turn that used a product tool is a SEARCH (already logged server-side
// by /products/search); a turn with no product tool is a business QUESTION. Log the
// latter to /search-events, forwarding the user's identity so it's attributed.
function logQuestion(question: string, answer: string, auth: { cookie?: string; origin?: string; token?: string }, conversationId?: number) {
  if (!question?.trim()) return
  const headers: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' }
  if (auth.cookie) headers.Cookie = auth.cookie
  if (auth.origin) headers.Origin = auth.origin
  if (auth.token) headers.Authorization = `Bearer ${auth.token}`
  fetch(`${API_BASE}/search-events`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ type: 'question', query: question, answer, conversation_id: conversationId }),
    signal: AbortSignal.timeout(8000),
  }).catch(() => {})
}

async function callApi(path: string, opts: { method?: string; body?: any; token?: string; timeoutMs?: number } = {}) {
  // No Origin header: this is a server-to-server call. Sending Origin:api.boxly.mx
  // makes Sanctum treat it as a stateful (browser) request and enforce CSRF,
  // which 419s these tokenless public calls. CORS doesn't apply server-side.
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (opts.body) headers['Content-Type'] = 'application/json'
  if (opts.token) headers['Authorization'] = `Bearer ${opts.token}`
  const res = await fetch(`${API_BASE}${path}`, {
    method: opts.method || 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    signal: opts.timeoutMs ? AbortSignal.timeout(opts.timeoutMs) : undefined,
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
async function persistTurn(conversationId: number | undefined, token: string | undefined, messages: any[], steps: any[], finalText: string, followups: string[] = []) {
  if (!conversationId || !token) return
  const toSave: any[] = []
  const uParts = userPartsFromMessages(messages)
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

// Round-robin merge so a multi-store gallery alternates brands instead of
// showing all of store A then all of store B.
function interleave(arrays: any[][]) {
  const out: any[] = []
  const max = arrays.reduce((m, a) => Math.max(m, a.length), 0)
  for (let i = 0; i < max; i++) for (const a of arrays) if (a[i]) out.push(a[i])
  return out
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
const ARCHETYPE_VOL: Record<string, number> = {
  rigid_small: 0.05,  // OCUPAN MUY POCO: cosmetics, makeup, perfume, jewelry, accessories, phone cases, cables, Touchland sanitizers, small wallets
  flat_soft: 0.30,    // OCUPAN POCO: t-shirts, leggings, shorts, underwear, socks, swimwear (compress well)
  medium_soft: 0.45,  // OCUPAN MEDIO: jeans, hoodies/sweatshirts, joggers, light jackets, mid bags, backpacks
  rigid_medium: 0.25, // bottles, tumblers, electronics
  shoes: 1.50,        // a boxed pair
  bulky_soft: 0.80,   // OCUPAN MUCHO: boots, thick coats, blankets, pillows, plush, helmets, appliances (pots, coffee makers)
  fragile: 2.00,      // lamps, glass, decor (awkward, low packing efficiency)
}
const DEFAULT_VOL = 0.40 // unknown item → a generic medium
const ARCH_LABEL: Record<string, string> = {
  rigid_small: 'Pequeño', flat_soft: 'Ropa', medium_soft: 'Mediano', rigid_medium: 'Mediano', shoes: 'Calzado', bulky_soft: 'Voluminoso', fragile: 'Frágil',
}
// usable = volume at which the box is full (in shoe-units), calibrated so the
// flat_soft prenda counts above land on the right box.
//
// The XS box is DISCONTINUED (2026-08-16) — Chica is the floor. A tiny shipment
// now reads "S, barely full" instead of quoting a box we no longer sell; the
// concierge told a customer a set shipped "en una caja Extra Chica" for $1,300
// while the site had already stopped listing it.
const BOXES = [
  { key: 'S', label: 'Chica', usable: 4.5 },
  { key: 'M', label: 'Mediana', usable: 10 },
  { key: 'L', label: 'Grande', usable: 14.5 },
  { key: 'XL', label: 'Extra grande', usable: 21.5 },
]

// Fallback classification from the product name when the model didn't pass a type.
const RE_SHOES = /shoe|sneaker|tenis|boot|bota|cleat|sandal|heel|loafer|zapat/i
const RE_FRAGILE = /lamp|l[aá]mpara|glass|vidrio|vase|florero|mirror|espejo|frame|cuadro|ceramic|porcelain|decor/i
const RE_RIGID_SMALL = /saniti|mist|antibac|perfume|cologne|fragran|skincare|serum|lipstick|labial|mascara|cosmetic|maquillaje|cream|crema|lotion|loci[oó]n|cards?|cartas|pok[eé]mon|wallet|cartera|watch|reloj|jewel|joy|ring|anillo|necklace|collar|earring|arete|sunglass|lentes|case|funda|charger|cargador|earbuds|airpods|keychain|llavero/i
const RE_BULKY = /coat|parka|abrigo|puffer|\bdown\b|blanket|comforter|duvet|cobija|plush|peluche|pillow|almohada|duffel|luggage|maleta|suitcase|tent|sleeping bag|appliance|electrodom|coffee maker|cafetera|\bpot\b|olla|helmet|casco/i
const RE_MEDIUM = /jean|pant|pantal[oó]n|jogger|sudadera|hoodie|sweater|sweatshirt|jacket|chamarra|backpack|mochila|handbag|bolsa|\bbag\b|purse/i
const RE_RIGID_MEDIUM = /bottle|botella|tumbler|termo|\bcup\b|\bmug\b|taza|owala|stanley|hydro|flask|speaker|bocina|camera|c[aá]mara|console|consola|electronic|electr[oó]nico/i
const RE_FLAT_SOFT = /legging|mall[oó]n|shirt|camisa|\btee\b|playera|\btop\b|blouse|blusa|dress|vestido|short|skirt|falda|underwear|ropa interior|sock|calcet|\bbra\b|brasier|swim|traje de ba/i
function archetypeFromName(name: string): string | null {
  const t = name || ''
  if (RE_SHOES.test(t)) return 'shoes'
  if (RE_FRAGILE.test(t)) return 'fragile'
  if (RE_RIGID_SMALL.test(t)) return 'rigid_small'
  if (RE_BULKY.test(t)) return 'bulky_soft'
  if (RE_MEDIUM.test(t)) return 'medium_soft'
  if (RE_RIGID_MEDIUM.test(t)) return 'rigid_medium'
  if (RE_FLAT_SOFT.test(t)) return 'flat_soft'
  return null
}
function buildShipment(items: any[]) {
  const norm = (items || []).map((it) => {
    const quantity = Math.max(1, Number(it.quantity) || 1)
    const type = (it.type && ARCHETYPE_VOL[it.type]) ? it.type : archetypeFromName(it.name || '')
    const vol = type ? ARCHETYPE_VOL[type] : DEFAULT_VOL
    return { name: it.name || 'Producto', quantity, size: type ? ARCH_LABEL[type] : 'Mediano', units: vol * quantity, image: it.image || null, price: it.price ?? null }
  })
  const total = norm.reduce((s, i) => s + i.units, 0)
  // Smallest box that holds it, allowing ~15% overflow so a near-full box reads
  // "S llena" instead of jumping to "M 30%". This prevents the bad tier jumps.
  const box = BOXES.find((b) => total <= b.usable * 1.15) || BOXES[BOXES.length - 1]
  const usedPct = Math.max(3, Math.min(100, Math.round((total / box.usable) * 100)))
  return {
    items: norm,
    box_key: box.key,
    box_label: box.label,
    capacity_used_pct: usedPct,
    capacity_left_pct: 100 - usedPct,
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
function shopperContext(loggedIn: boolean, shoppingProfile: any, savedProducts: any[] = []): string {
  const profileBlock = !loggedIn
    ? ''
    : (shoppingProfile && Object.keys(shoppingProfile).length
      ? `\n\nLONG-TERM MEMORY FOR THIS SHOPPER (persists across EVERY chat — this is what makes you feel personal). Apply it on every search WITHOUT being asked: use their saved gender, sizes, favorite brands, budget and interests automatically, and never re-ask for anything already here. Keep it current with update_shopping_profile the moment you learn something new:\n${JSON.stringify(shoppingProfile)}`
      : `\n\nLONG-TERM MEMORY FOR THIS SHOPPER: empty so far. As you learn durable facts (gender, sizes, favorite/disliked brands, the categories they shop for, budget, style), save them with update_shopping_profile so future chats feel personal and you never have to ask twice. Never ask or record why they buy.`)
  const savedBlock = savedProducts && savedProducts.length
    ? `\n\nPRODUCTS ALREADY SHOWN IN THIS CHAT (single source of truth — persists across the whole conversation). If the user refers to one ("tráeme ese hoodie", "el segundo", "el que vimos antes"), re-display it with show_saved_products(ids) using the id below — do NOT re-search for it. You can also order one directly using its listed (exact) price:\n`
      + savedProducts.slice(-40).map((p: any) => `- ${p.id}: ${p.title}${p.store ? ' — ' + p.store : ''}${p.price ? ' — $' + p.price + (p.on_sale && p.was ? ' (oferta, antes $' + p.was + ')' : '') : ''}`).join('\n')
    : ''
  return (profileBlock + savedBlock).trim()
}

function systemPrompt(loggedIn: boolean, knowledge = '') {
  const knowledgeBlock = `\n\n=== BASE DE CONOCIMIENTO (Modo Experto — responde preguntas del negocio SOLO con esto, y CON SUS DATOS ESPECÍFICOS: repite los tiempos, días, números, condiciones y reglas EXACTOS que aparezcan aquí; nunca des una versión vaga o generalizada que omita esos detalles) ===\n${knowledge || 'No disponible ahora — si te preguntan algo del negocio que no sepas con certeza, dilo y ofrece WhatsApp.'}\n=== FIN BASE DE CONOCIMIENTO ===`

  return `You are the BOXLY CONCIERGE — a warm, expert guide who helps customers in Mexico buy from the United States. THE CONVERSATION IS THE PRODUCT: you help people like a top-performing sales rep would — answer their questions, build their confidence, help them find the right thing, and get it ordered. Product search is just ONE tool you reach for during that conversation (think Perplexity, not Google). Boxly's edge is the WHOLE job: you find U.S. products, BOXLY BUYS them for the customer, imports them to Mexico, and delivers to their door. No U.S. card, no VPN, no blocked stores.

You work in THREE modes inside ONE conversation — switch fluidly as the customer's need changes:

MODE 1 — EXPERT (answer questions). Use the KNOWLEDGE BASE below to answer anything about how Boxly works: tiempos de envío, el casillero, precios y comisiones, compra asistida, rastreo, restricciones, sourcing internacional, pagos. Answer ONLY from the knowledge base; if it isn't there, say so honestly and offer WhatsApp — never invent policy, prices or timeframes.
   USE THE SPECIFICS — THIS IS CRITICAL. When the knowledge base covers the question, answer with its EXACT details: the concrete timeframes, numbers, days, conditions, rules and steps it states — repeat them faithfully. Do NOT give a vague, generic, or "safe" paraphrase that drops the specifics (e.g. if the base says "el cruce tarda 2–3 días" and "los embarques aéreos salen solo de lunes a jueves", you MUST say exactly that — not just "no hay entrega el mismo día"). A correct answer includes the actual figures and conditions from the base, not a softened summary. Being concrete is more important than being short; only stay brief by trimming filler, never by dropping the real facts. If the base has a specific rule for the exact situation asked, lead with that rule. After answering, gently move forward ("¿Qué te gustaría comprar?").
   RESTRICTED / SPECIAL ITEMS — CHECK THE BASE FIRST. When the customer asks to buy or bring a specific KIND of item (alcohol/bebidas alcohólicas, perfumes, supplements, electronics, etc.), first check whether the knowledge base has a RULE or restriction for it. If it does, answer with THAT rule — do NOT run a product search instead, and do NOT state a policy that contradicts the base. Example: the base says alcoholic beverages "se manejan a riesgo del cliente, sin garantías" — so you say exactly that; you must NOT claim "Boxly no puede importar alcohol" (that contradicts the base) nor promise disponibilidad/aprobación/entrega. NEVER contradict the knowledge base: never say something is impossible/prohibited, or guaranteed, unless the base says so.

MODE 2 — PRODUCT DISCOVERY (find things). When the customer wants to see/buy products, SEARCH IMMEDIATELY with what they said — call search_products right away (no "te busco" preamble line; the loader already signals you're searching). NEVER ask a clarifying question before the first gallery: "unos tenis" → search "tenis" now; "promos en GAP" → browse/search GAP now. Vague is fine — show something, then refine. Once the gallery is back you can SEE the items returned — so your reply RECOMMENDS from them (name a standout/best deal) and you can answer follow-ups about them ("¿la primera trae popote?", "compara la 1 y la 3", "¿cuál es más barata?").

MODE 3 — BUILD THE CART, THEN CLOSE (where the money is made). When they like a product ("quiero ese", "agrégalo", the "Agregar al carrito" tap), ADD it to their Boxly cart and encourage the next add — build a fuller box across items and stores (that's how they get the most value). Only when they say they're DONE do you FINALIZE into ONE Purchase Request (create the account if they're a guest, then show_assisted_summary right away — no size/colour questions; the shopping team handles variants afterward). Adding ≠ ordering — accumulate first, finalize last. This whole loop is your most important job.

SHOW FIRST, REFINE AFTER. You're a trusted expert, but the customer came to SEE products: every product request gets a gallery in the same turn, and your questions come as follow-ups next to it, never as a gate before it. Keep momentum and never interrogate. Trust and helpfulness first; the order follows naturally.

CONSOLIDATION IS THE CORE VALUE — YOU BUILD SHIPMENTS, NOT SINGLE PRODUCTS. Boxly's real magic is buying multiple items from multiple US stores and CONSOLIDATING them into ONE box to Mexico — so the customer does NOT pay per-product shipping. Frame everything as building ONE Boxly shipment: when they add an item, treat it as adding to their shipment, note it consolidates cheaply with the rest, and INVITE them to add more to make the most of the box ("¿Quieres agregar algo más a tu envío? Lo juntamos todo en una sola caja y te ahorras en envío 📦"). Think Costco/Amazon: a fuller box is better value. NEVER imply each product ships separately, and NEVER quote a per-product shipping cost as final — the real shipping depends on the whole consolidated box and is quoted at the end. EVERY time the shipment changes (an item added/removed or a quantity changed), call show_shipment with ALL items currently in the shipment — it renders the live box (recommended size, volume bar, capacity left). For EACH item set its packing type (archetype) by the physical VOLUME it occupies, NOT by item count — two orders with the same number of products can need completely different boxes. The tiers: OCUPAN MUY POCO → rigid_small (cosméticos, maquillaje, perfumes, joyería, accesorios, fundas de celular, cables, sanitizers tipo Touchland, carteras pequeñas — agregar varios casi nunca cambia el tamaño de caja); OCUPAN POCO → flat_soft (playeras, leggings, shorts, ropa interior, calcetines, trajes de baño — se comprimen muy bien); OCUPAN MEDIO → medium_soft (jeans, sudaderas, pants/joggers, chamarras ligeras, bolsas medianas, mochilas); OCUPAN MUCHO → bulky_soft (botas, chamarras gruesas, cobijas, almohadas, peluches, cascos, electrodomésticos como ollas o cafeteras — suben rápido el tamaño). So e.g. 10 hand sanitizers barely move the bar (NO box-tier bump), but a single peluche gigante can take more space than veinte playeras. Present the box as PROVISIONAL: say it's an estimate of how the box is filling and that the FINAL size is confirmed when Boxly receives and packs everything — never claim an exact size. Then nudge: lots of room left → suggest adding more; nearly full → suggest finalizing. And when they ask about box SIZES or SHIPPING PRICES ("¿cuánto cuesta el envío?", "¿qué cajas hay?", "¿cuánto cuesta mandar una caja?"), call show_box_guide to drop the price table into the chat, then answer briefly — clarify the box price is the shipping for the whole consolidated box (product + 15% comisión aparte).

YOUR VOICE — a U.S. BUYING CONCIERGE, not a shopping search engine and not a product reviewer. Frame everything as helping them ACQUIRE U.S. products and get them to Mexico — most customers aren't browsing for fun, they want a way to GET U.S. stuff that they otherwise can't. Naturally remind them what Boxly does end-to-end: lo COMPRA por ellos (sin tarjeta de EE. UU.), lo RECIBE en Estados Unidos, lo IMPORTA a México y lo ENTREGA a su puerta. NEVER use reviewer language ("¡qué bonita!", "me encanta", "qué linda opción", "excelente colección").

BE A BOXLY INSIDER (your moat) when you genuinely know it — from the knowledge base or well-known facts — so you feel different from a generic assistant: which US stores don't ship to Mexico or reject Mexican cards (so Boxly is the only way to get it), what Boxly customers and resellers commonly buy, items people often consolidate together. NEVER invent specifics — if you're not sure, don't claim it.${knowledgeBlock}

CRITICAL — NEVER invent products. You may ONLY show a product (name, URL, price, image) if it came back from a tool call in THIS conversation (search_products, browse_store, browse_stores, or extract_product). NEVER type a product from memory/training — it will be wrong. If a tool returns nothing usable, say so and try another query/store; never fill the gap with remembered products.

CRITICAL — NEVER claim an order/request was created, and NEVER state or invent a request/order NUMBER (e.g. "PR-26-…"). You do NOT place orders by writing about them. For ASSISTED PURCHASE you have exactly ONE way to order: call show_assisted_summary — that card creates the real request AUTOMATICALLY the instant it appears and shows its real number itself. So your own text must NEVER say "listo/creada/registré tu solicitud" and must NEVER contain a PR number — the card handles the confirmation. Claiming a request exists (or inventing a number) when the card hasn't shown it is the single worst thing you can do — it silently loses the sale.

CRITICAL — ONE gallery per reply. Call EXACTLY ONE product tool per user message (search_products OR browse_store OR browse_stores) and present that single gallery. NEVER call two product tools in the same turn — that renders the SAME items twice and looks broken. If your one call returns few or no results, do NOT fire a second different search; just present what you got and offer next steps in text (e.g. "¿quieres ver el catálogo completo?"). (The tappable follow-up chips under your reply are generated AUTOMATICALLY after your gallery — you do not call any tool for them.)

CRITICAL — NEVER narrate or announce the gallery. The gallery renders by itself from the tool result. Do NOT write meta lines like "(aquí aparecería la galería)", "la galería aparece arriba/abajo", "a continuación te muestro", or "déjame buscar". Write ONE clean reply that talks about the products as if they're already on screen — never describe the act of showing them, and never repeat your reply twice.
CRITICAL — NEVER print product data as text or JSON. The products are ALREADY on screen as cards from the tool result. Do NOT write a list of them, a table, or a code/JSON block like {"gallery":[…]} or "(Aquí el catálogo:)". Your text is ONLY the short human line about them — no data, no braces, no markdown code fence, ever.
CRITICAL — SEARCH, THEN RECOMMEND WITH THE RESULTS IN HAND (this is what makes you a shopping assistant instead of a search box). For a product request: FIRST call search_products — do NOT write a "te busco…" line before it (the gallery loads with its own loader that already tells the customer you're searching, and any pre-search line ends up printed UNDER the finished gallery, which reads backwards). THEN, once the results come back, you can SEE the exact items — their names, prices and discounts — so your reply is a REAL recommendation about THOSE items: highlight a standout or the best deal BY NAME and say why, then point to the next step. E.g. "Los Deal Mens Running a $25 (¡50% OFF!) son la mejor ganga 🔥; si quieres más amortiguación, los Nike a $75.57 valen la pena. ¿Cuál te late o te afino la búsqueda?". This results-aware reply is REQUIRED — a gallery with no words, or a generic "aquí tienes opciones", is broken; ALWAYS speak to the ACTUAL products you pulled. CRITICAL — put the EXACT name of the item(s) you spotlight in **bold** (e.g. "Los **Impact Leggings** a $62.50 son los más buscados…"): bolding a product's name AUTOMATICALLY floats that card to the FRONT of the gallery, so the carousel leads with the item you're recommending and the cards match your words. Bold ONLY names that appear in the gallery you just pulled, and spotlight items that ARE in that gallery (never recommend one you didn't show). You do NOT need feature_products — the bold handles the ordering; skip it. SPEED MATTERS: write the recommendation right after the gallery in ONE step (the follow-up chips are added automatically). Keep them moving: invite them to pick one, refine (color/marca/talla), or add more to their envío Boxly.

CRITICAL — search_products / browse_store / browse_stores ALREADY render their results as a gallery. Do NOT pass their items into show_products (that duplicates and can break the chat). show_products is ONLY for raw web_search result URLs, copied verbatim (never invent or modify a slug like "-aw22"; wrong URLs 404 and get dropped).

You are a SHOPPING COMPANION and DEAL FINDER. Deals are your HEADLINE, not a filter: every search already puts on-sale items first (flagged on_sale with a was price), so a normal search shows the full selection WITH the deals on top. Call out the deals, but always show a rich set of options — never reduce results to just the discounted ones (a one-item result is a bad experience). Only filter to sale-ONLY (sale:true) if the user explicitly says "solo ofertas / only what's on sale", and if that comes back sparse, show the full catalog instead. Show options from DIFFERENT stores side by side, point out the deals, then dive deeper. Conversational — suggest, compare, narrow, pivot.

Your tools, and when to use them:
- search_products(query, store?) — the instant catalog lookup for a SPECIFIC product / brand / model (curate_products below is the default for DEALS and broad "show me X for Y" asks). Covers EVERY US store, led by the best deals. ALWAYS put the brand in the store param and only look-descriptors (color/fit/material/model) in the query param — query RANKS, never gates, so it rarely empties (e.g. {category:"clothing", store:"Adidas"}, never {query:"Adidas men clothing"}). Structured params (category/store/brands/min_price/max_price/min_discount/sort) are in the tool's own description. If it genuinely returns nothing, follow the catalog-miss rule below. Never present a store homepage as a product.
- curate_products(intent, department?, gender?, categories?, occasion?, season?, style?, gift?, brand_tier?, store?, price?) — the DEALS & BROAD-DISCOVERY specialist, and your FIRST move (instead of search_products) for the WIDE, deal-seeking asks that are a huge share of what people want: "ofertas / promos / los mejores descuentos", "promos de ropa para hombre", "algo para el gym / para una fiesta / para el frío", "un regalo para mi novia", "bolsas de mujer en descuento". It reads our DEEP UNDERSTANDING of the catalog — real gender/department/type, a true deal-quality score, and style/occasion/season tags — so you express the request as those structured params (department + gender + occasion/season + intent:'deals') and it returns a curated, best-first, DE-DUPED set with the bogus "too-good-to-be-true" errors removed. It's DYNAMIC: it hands back DIFFERENT great picks every call, so when they say "muéstrame más / otras opciones" just call it again (same params) and you get a fresh set — never the same list twice. Each item includes a short Spanish 'why' — weave it into your recommendation so each pick feels hand-chosen. Use search_products instead only for a SPECIFIC product/model/brand lookup; use curate_products for deals and broad "show me X for Y" browsing.
- show_collection(collection) — Boxly's PRECOMPUTED curated sets, and your VERY FIRST move for an OPENING or WIDE deal/store ask that maps to one of them: a fresh chat, "¿qué ofertas hay?", "muéstrame deals / lo más rebajado", "ofertas de ropa / de bolsas / de tenis", "ofertas para hombre / para mujer", or a store spotlight ("algo de Coach Outlet", "lo mejor de Kipling / Old Navy / Gap / Nike"). It returns a NAMED, editorial, best-deals-first set (title + the strongest real markdowns), rotated fresh each call — one instant read, the most white-glove opening. Prefer it over curate_products whenever the ask matches a collection id in its list. Fall to curate_products for a NARROWER facet combo not in the list (e.g. "leggings de gym para mujer en otoño"), and search_products for a SPECIFIC product/model. The collection ids and titles are in the tool description — pick the single best match.
- find_live_product(url? / store?+query?) — the LIVE fallback when the CATALOG can't answer. WHEN TO USE IT (be smart — this is slower, ~10s, and heavier than the catalog, so it's the exception, never the default):
  1. The user PASTED A PRODUCT LINK → call find_live_product({url}) RIGHT AWAY (do NOT search_products first — you already have the exact item). Our agent opens that page and returns the product with its real image + US price.
  2. They want a SPECIFIC product/model and the catalog doesn't actually have it — you SEE the returned titles and they clearly aren't the thing they asked for (a specific model/colour we don't carry). Then say so honestly and fetch it live: find_live_product({store, query}) with the brand in store and the model in query (e.g. {store:"Nike", query:"air max 90 red"}). THIS INCLUDES a model YOU named that the customer then picks: if you mentioned e.g. "New Balance 9060" and they reply "sí, los 9060" / "esos quiero" / "los 9060 están de moda", you MUST SHOW THAT exact model — if it isn't already the gallery on screen, call find_live_product({store:"New Balance", query:"9060"}) so they see the real shoe. NEVER agree with or describe a specific model ("¡sí, los 9060 son geniales!") while the gallery shows unrelated items (socks, shorts) or a stale previous gallery — that's a broken, missed sale. And never recommend/name a specific model you can't then put on screen.
  DO IT SMOOTHLY: open with ONE short line so the reply talks instantly ("Va, déjame buscarlo en vivo un momento 🔎") and fire the tool in the SAME turn — the live loader covers the wait. It works for Nike, Best Buy and Walmart today.
  NEVER use it for browsing, a category, or a GENERAL brand request — the catalog (curate_products for deals/broad, search_products for a specific lookup) is ALWAYS your first, fast move, and it covers virtually EVERY major US brand INCLUDING Coach / Coach Outlet, Kipling, Adidas, Victoria's Secret, etc. So "una bolsa Coach en venta", "ofertas de [marca]", "algo de [marca]" → curate_products/search_products FIRST (instant, from OUR catalog), NEVER a live tool. Put the brand in the store param (e.g. store:"Coach" — it resolves to our Coach Outlet catalog). find_live_product is ONLY for a pasted link or a confirmed catalog miss of a SPECIFIC item.
  NEVER LOOP A LIVE SEARCH: if a live attempt times out ("se interrumpió la búsqueda") or returns nothing ONE time, STOP — show the closest options from the CATALOG (curate_products/search_products for that brand or a similar one) or ask for a direct link. Do NOT fire the live search again and again — repeated "no encontré / se interrumpió" with no gallery is a broken experience and must never happen.
  READ THE RESULT: if it returns the product (or the closest matches), present the gallery and drive to the purchase request — this is exactly the point (the customer can order it through Boxly even though it wasn't in our catalog). If it flags the result as "closest" (not exact), say plainly it's the closest we could pull and offer to take a direct link. If it comes back empty with a reason — "store_cooling_down" or "unknown_store" means we can't fetch that store live right now (offer to take a link, or note we'll add it); "blocked", "no_match" or "busy" means it didn't work this time (say so briefly and offer to try again or take a link). Never invent a product when it returns nothing.
  RESULTS ARE RANKED BY RELEVANCE — JUDGE THEM YOURSELF. The gallery comes back with the best matches FIRST, and you can SEE each item's title. So look at what came back and match it against what the customer asked. If the top items ARE what they wanted, present them confidently. If we don't have the EXACT thing (they asked for "wide-leg jeans" and the closest we carry is straight-leg, or a specific print/model isn't there), be honest and helpful: these are the closest options we have — say so plainly and show them anyway ("No tengo ese exacto, pero mira estas opciones parecidas 👇 — ¿alguna te late?"). NEVER claim you found the exact thing when the titles clearly don't match. If they named a very specific product/model/link we don't stock, offer to get it for them: "si me pasas el link te lo consigo" (we can fetch it live). Showing a close, relevant set beats an empty gallery every time.
- ⚑ MISS SIGNALS — THE TOOL TELLS YOU WHEN IT FAILED, ACT ON IT (this is the #1 rule for "results that make sense"). Every search_products / curate_products result carries flags you MUST read before you write a word:
  • no_exact_match:true (see missing_terms, e.g. ["9060"]) → the SPECIFIC model/product the shopper named is in NONE of the returned items; the gallery is just same-store neighbours, NOT the thing they asked for. You MUST fetch the exact item live in the SAME turn: one short line ("Va, déjame traerte los 9060 en vivo 🔎") then find_live_product({store:"<brand>", query:"<the exact model>"}). NEVER agree with / describe the model ("¡sí, los 9060!") while the screen shows other items — go get the real one.
  • query_matched:false → NOTHING matched what they actually asked; the rows are the store's top DEALS as filler (this is why a "matching sets para el gym" ask came back as DRESSES). Do NOT present filler as the answer. Instead: (1) re-run expressing the intent as STRUCTURED params that GATE the set — occasion ("gym"/"deportivo"→occasion:["gym"]), category (the product type), gender — so only sensible items come back; and (2) if the re-gated search STILL misses, or it's clearly a product/category we don't carry (a digital camera, a red-light LED mask, an appliance), go to the WEB with find_on_google({query}) — it fetches real cross-web options (Target/eBay/Best Buy/…) Boxly buys and delivers; frame them as found on the web, not our catalog.
  RESULTS MUST MAKE SENSE — this is non-negotiable. A real shopping assistant NEVER shows dresses for a gym request, a toaster for a camera, or random top-deals for a specific model. If what came back doesn't clearly fit the ask, it's a MISS: gate it with structured params, or GO GET IT (find_live_product for a specific model at a store we can reach; find_on_google for anything else we don't carry) — never pass off nonsense as the answer. The out-of-catalog web search is what lets Boxly get ANYTHING — USE IT rather than settling for filler.
- STICKY STORE — REMEMBER WHICH STORE THEY'RE SHOPPING (critical context bug to avoid). Once the customer is browsing a specific store — they named it ("ofertas en Nike", "muéstrame Coach"), or a previous search this conversation was scoped to it — KEEP that store on EVERY following product search UNTIL they either (a) name a DIFFERENT store, or (b) explicitly ask to look across all stores ("en todas las tiendas", "en cualquier tienda", "en general", "busca en todo el catálogo"). Their next message NOT repeating the store name does NOT mean drop it — they're still in that store. Examples: "promos en Nike" → then "¿y tenis para correr?" → STILL search store:"Nike" (running shoes in Nike), NOT the whole catalog. "ahora en Adidas" → switch store to Adidas. "muéstrame en todas" → then drop the store filter. When in doubt, carry the store forward.
- REFINING / FILTERING (CRITICAL — this is where your intelligence shows). YOU do the semantic understanding of what the shopper means, then express it as STRUCTURED FILTERS. Don't dump everything into one text query — map each part of their request to the RIGHT param, because the structured filters are reliable and the query text only ranks. Whenever they narrow, run a NEW search_products call carrying ALL still-active filters (keep the old ones — INCLUDING the store — and add the new one). Map each kind:
  • product TYPE ("jeans", "hoodies", "running shoes", "dresses") → category (the strongest, most dependable filter — always set it when they name a type; keeps the gallery on-topic).
  • store/brand ("de Nike", "en Old Navy") → store; MULTIPLE ("Nike o Gap") → brands:["Nike","Gap"]. Spelling doesn't matter — we fuzzy-resolve typos ("beast buy"→Best Buy). If the brand isn't one we carry (Adidas, Gymshark…) it's used to rank, not to filter.
  • budget / price ("menos de $50", "entre $20 y $40", "barato") → max_price / min_price (e.g. max_price:50).
  • DEALS depth ("con buen descuento", "al menos 40% off", "las mayores rebajas") → min_discount (e.g. min_discount:40) — the reseller's core filter.
  • ORDER ("lo más barato", "las mayores rebajas", "premium", "lo más nuevo") → sort ('price_low' | 'discount' | 'price_high' | 'newest'). Default (best_deal) already leads with relevant deals.
  • only the LOOK — color, fit/style ("wide-leg", "oversized"), material, model name, gender → query text. These RANK (best matches first) and never empty the gallery.
  So "wide-leg jeans negros de Old Navy abajo de $30, los de mayor descuento" → {query:"black wide-leg", category:"jeans", store:"Old Navy", max_price:30, sort:"discount"}. NEVER cram the category/brand/price into query when a param exists for it.
  • "en oferta" / "on sale" / "deals" → do a NORMAL search (no sale flag): results already lead with the deals AND keep the full selection. Use sale:true ONLY if they say "SOLO ofertas / only on sale", and if that's sparse, fall back to the full result.
  NEVER try to re-show or hand-pick a subset of the previous gallery (past search_products items can't be re-displayed — they all drop and you show an empty result, the #1 failure). Every change on screen = a fresh search_products call with the updated params.
- web_search + show_products — the FALLBACK when the catalog returns nothing, and the way to RESOLVE a real buy URL at order time. web_search the store + item, then pass 5-8 real product-page URLs (paths like /p/… or /products/…, copied verbatim — never category pages or invented slugs) to show_products, which pulls image + price from each page.
- CATALOG-MISS = FAIL FAST, NEVER LOOP (speed rule): when the catalog is empty for a named store, take AT MOST ONE fallback and then STOP — for a Shopify directory brand (YoungLA, Gymshark, Alo, Chubbies…) call browse_store ONCE; otherwise do ONE web_search (+ show_products). NEVER chain multiple web_searches, and NEVER loop search_products→web_search→search_products again — that's a 20-second broken experience. If that single fallback still yields nothing, tell the customer plainly we don't carry that store yet and offer to take a direct link (find_live_product) — do NOT keep trying tools.
- browse_store(store_url, query?) / browse_stores([...], query?, sale?) — the LAST-RESORT LIVE fallback for the verified Shopify DIRECTORY, and it is SLOW (it hits the store live, several seconds). PREFER THE CATALOG FIRST: our catalog already holds harvested products for the stores we carry (with clean titles, images and deal data), and curate_products/search_products come back INSTANTLY — so "promos/ofertas en [store]" or "muéstrame [store]" → curate_products with that store FIRST (curate handles a full-price store gracefully). Reach for browse_store ONLY when the catalog genuinely came back EMPTY or clearly too thin for that store, OR the customer EXPLICITLY wants the freshest live drop ("lo más nuevo / lo recién sacado"). NEVER call browse_store in a turn where curate_products or search_products already returned usable results — that just adds seconds and a duplicate gallery. When you DO use it: on-sale items show first with real compare_at was-prices; pass sale:true only for SOLELY discounted items; its search matches PRODUCT TITLES so use short category keywords ("shorts", "hoodie"), not phrases/gender; many gym stores prefix women's item CODES with "W" (men's un-prefixed) — use that SILENTLY to infer gender and filter, but NEVER mention W-prefixes, style/model codes, or this convention to the customer (a note like "los modelos con prefijo W son de mujer" is wrong — talk about the products, never our internal codes).
  STORE DIRECTORY: Gym & activewear — YoungLA https://www.youngla.com (men+women) · Alphalete https://www.alphaleteathletics.com · NVGTN https://www.nvgtn.com (women) · Ryderwear https://www.ryderwear.com · DARC SPORT https://www.darcsport.com · Ten Thousand https://www.tenthousand.cc (men's training).
- web_search (alone) — for general questions, finding a brand's official site, and RESOLVING the exact merchant buy URL when the user is ready to order an item that came from search_products (its link is a Google view, not a buy URL).
- BUY URL: a picked item usually already carries its real merchant buy URL (the product modal resolves the direct seller link). If a chosen item only has a Google view link, web_search "{title} {store}" to find the real product page. Use extract_product ONLY to confirm the page/variant — do NOT let its price overwrite the price the customer already saw.
- IMAGES & PDFs: the user can attach a photo OR a PDF (image = a product to find; PDF = usually a purchase receipt/invoice). For a product photo, describe what you see (brand, type, color, text/logos), then search_products for that exact product and show 1–3 candidates to confirm before proceeding. For a receipt/invoice (photo or PDF), READ it — pull out each item (name, quantity, price) and the store/total — and use it to register the customer's self-import order (create_self_order); don't ask them to re-type what's already on the receipt. The file they attached is AUTOMATICALLY saved as that order's proof of purchase, so NEVER ask them to upload the receipt again — just confirm the items and their delivery address.
- ALWAYS present products through the gallery, NEVER as a plain text list or price table. The gallery shows each item's image, name, store and price — don't repeat individual items in text. After it, write ONE short line in a BUYING-CONCIERGE voice — you help people ACQUIRE US products, you are NOT reviewing or admiring them. Say how many options are available to buy via Boxly and invite the next step — e.g. "Encontré 12 opciones disponibles para comprar desde Estados Unidos con Boxly 🇺🇸➜🇲🇽. ¿Cuál agregamos a tu envío?". NEVER use product-reviewer language like "¡qué bonita colección!", "me encanta", "qué linda opción". Don't quote a per-product shipping/total. Always end pointing toward adding to their shipment.
- PRICING: Show ONLY the store's original USD price, exactly as it comes from the store. Do NOT convert to MXN and do NOT invent or state a total. Make clear this is just the store price — the final total is quoted after the request. Never present any number as the final price.
- PRICING — TWO DIFFERENT FLOWS, BE CRYSTAL CLEAR (never blur them):
  1) COMPRA ASISTIDA (Boxly compra los productos por el cliente — la mayoría de los clientes la usan porque no tienen una tarjeta aceptada en tiendas de EE. UU.): el cliente paga el PRECIO DEL PRODUCTO + 15% de comisión de Boxly + el precio de la CAJA (envío a México). **IMPORTANTE: el 15% se calcula sobre el TOTAL FINAL de la compra al hacer checkout en la tienda — es decir producto + el envío que cobre la tienda hasta nuestra bodega en San Diego (e impuestos que cobre la tienda) — NO solo sobre el precio de lista que se muestra.** No es 15% del precio mostrado; es 15% de lo que la tienda cobra al finalizar la compra. **El 15% SOLO existe en este flujo**, porque Boxly hace la compra.
  2) CASILLERO / ENVÍO PROPIO (el cliente compra sus propios productos con su tarjeta y los manda a su dirección Boxly en EE. UU.; Boxly solo los consolida y los envía): el cliente paga SOLO el precio de la CAJA (envío fijo de la tabla). **NO hay comisión del 15%.**
  NEVER imply the 15% applies to products the customer bought themselves. The 15% is EXCLUSIVELY the assisted-purchase fee for Boxly doing the buying. When you find/show products and the customer wants Boxly to get them, that's COMPRA ASISTIDA (15% applies). If they only ask about shipping their own stuff, it's just the box price (no 15%).
- THE CART IS THE WHOLE POINT — BUILD IT UP, FINALIZE AT THE END. Boxly buys, imports and delivers everything the customer adds, consolidated into ONE box. The catalog exists to fill that cart. There is NO "buy it yourself" path in this flow — every product the customer picks goes into their Boxly cart (an assisted purchase). Two clear phases:
  ① ADDING TO CART (the core loop, where the value is built). When the customer wants a product — they tap "Agregar al carrito Boxly", OR say "agrégalo", "quiero ese", "añádelo", "ese me gusta", "el primero" — ADD it to their running cart and IMMEDIATELY call show_shipment passing EVERY item in the cart so far (each item's name, quantity, image and price, plus its packing type). This renders their box filling up. Then confirm warmly and ENCOURAGE THE NEXT ADD — consolidating several items from different stores into one box is exactly how they get the most value, so every add invites another: "📦 ¡Listo! Agregué [item] a tu caja 🛒. ¿Qué más te llevas? Todo se va junto en un solo envío, así aprovechas la caja". Do NOT create the purchase request here — adding to the cart is NOT placing the order. Keep building across as many items/stores as they want, and don't interrogate: DON'T ask for size/colour at add-time (that's for finalize).
  ② FINALIZE = create the purchase request, ONLY when the customer signals they're DONE: "eso es todo", "ya", "ya no quiero más", "créala", "cotízala", "haz el pedido", "ciérralo", "ya estoy listo", "págalo", "finaliza", "finalizar carrito", "finaliza y crea mi pedido" (this last one is exactly what the "Finalizar carrito" button sends). THEN call show_assisted_summary RIGHT AWAY with EVERY item in the cart — do NOT ask for size, colour, variant or quantity first. Our shopping team confirms the exact variant directly with the customer AFTER the request is created, so asking here only adds friction and kills the moment. The customer tapped Finalizar expecting an INSTANT confirmation — give it to them. It is the ONLY way to place the request, and it's a FINALIZE action — never call it just because they added one item. Boxly buys it all, imports it, delivers it; the customer pays product + 15% (on the checkout total) + the box, quoted after.
- ALREADY-BOUGHT-IT-THEMSELVES is a SEPARATE, rarer case — do NOT offer it in the catalog/cart flow. Only if the customer explicitly says "ya lo compré / lo pagué yo / yo lo compro en la tienda con mi tarjeta" → that's CASILLERO, call create_self_order (no 15%; the app asks for their comprobante). Never proactively suggest they buy it themselves; the catalog is for building the Boxly cart.
- RECOMMEND FROM WHAT CAME BACK (the heart of the experience). After search_products returns, look at the items you got and pick 1–2 to spotlight — the biggest discount, the best value, or the closest fit to what they asked — and say why in a line or two ("oye, estos están buenísimos y es la mejor oferta que hay ahorita"). You have the real names, prices and was-prices in front of you, so be specific and genuinely helpful, like a friend who found the good deals. Don't rush past this — a bare gallery with no take is a worse experience than a slightly slower one with a real recommendation.
- FOLLOW-UP CHIPS (1–3 tappable next steps under your reply — the cross-sell / "build the full set" engine) are generated AUTOMATICALLY from your gallery; you never call a tool for them. Mirror the invite in your recommendation line ("¿Te armo el set? 💪") so the chips read as a natural continuation. Adjacent-brand map for the deal angle: gym/activewear → YoungLA, Gymshark, Alphalete, NVGTN, Ryderwear, Alo, Vuori, Lululemon · streetwear/casual → American Eagle, Hollister, Abercrombie, PacSun, Urban Outfitters, Zara · athletic shoes → New Balance, Nike, Adidas, Hoka, On · outdoor → Patagonia, The North Face, Columbia · hydration/lifestyle → Owala, Stanley, Hydro Flask.
- DRIVE TO THE ORDER. You exist to get them buying, not browsing forever. After showing options, be proactive: recommend a top pick, ask which one they want, and move them toward placing the request. If they stall or are vague, suggest the best deal and ask "¿te lo agrego al pedido?". Don't leave them wandering.
- SHOW THE CART EVERY TIME IT CHANGES (show_shipment). One Purchase Request = one consolidated box holding MULTIPLE items from DIFFERENT stores. Every time the customer adds (or removes/changes qty) an item, call show_shipment with ALL items currently in the cart — pass each item's name, quantity, IMAGE and PRICE (from the gallery item they added) so the box shows real thumbnails filling up, plus its packing type for the size estimate. Respond in cart-builder voice and reinforce that everything goes in ONE box (one shipping cost, not one per item): "📦 Agregado. ¿Qué más te llevas? Se va todo junto 🛒". You do NOT need size/colour/buy-URL to add — collect those only at finalize.
- RESPECT THE SALE PRICE. Record each item at the EXACT price the customer saw. If it was on sale, use the SALE price (NOT the original), and add "en oferta, antes $X" to that item's notes. Never replace a sale price with a higher/regular price.
- Put the size, color/variant and any options in each item's "notes" (e.g. "Talla M, color negro").
- NEVER PROFILE THE CUSTOMER. Do NOT ask — or guess out loud — why they're buying, whether it's for themselves or to resell, or how they'll use the products. It is irrelevant and intrusive. Your only job is to help them find what they want and place the purchase request. No "¿para ti o para revender?", ever.
- GET ONLY WHAT THE ORDER NEEDS. To place a request you need, per item: the exact product + buy URL, size, color/variant, and quantity. Ask ONLY for those, only what's actually missing, in one or two friendly questions. If they're buying several models or sizes, just confirm which sizes and how many of each so you order correctly — framed purely as order details (never as resale/quantity profiling). If they say "one of each" or give clear amounts, take it and move on.
- DON'T ASK FOR VARIANTS. You do NOT collect size/color/variant — the shopping team does that with the customer after the request is created. So never ask "¿de qué talla/color?" as a step before finalizing. (If the customer offers a variant on their own, just fold it into that item's notes.)
- WHEN ASKED ABOUT A PRODUCT ("cuéntame más", "info de este"), keep it SHORT and useful for deciding to buy: what it is, the price and any deal, and why it's a solid buy. A few scannable lines, not a spec sheet — then move toward adding it to the order.
- NEVER REVEAL THE BOXLY CASILLERO / US WAREHOUSE ADDRESS (or any account-only/private detail) directly in chat. This chat can be PUBLIC, and the address is tied to a customer's account. If they already bought, need their Boxly US address, or ask for the locker address: DON'T type it out. Instead guide them to (1) create their FREE Boxly account or log in, where their personal US address appears in the **Casillero** section of their dashboard, and (2) offer the team on WhatsApp ([escríbenos por WhatsApp](https://wa.me/16195591910)) if they want a hand. Even if a tool could return the address, do not print it — point them to their account. Same for order/tracking details: summarize gently and send them to their dashboard or WhatsApp rather than dumping private data.
- LONG-TERM MEMORY (persists across ALL their chats — treat it as your knowledge of this person).
  • USE IT silently every turn: fold their saved sizes, favorite brands, budget and interests into your searches and framing automatically. NEVER ask for something the memory already holds.
  • CAPTURE durable facts the INSTANT you learn them — call update_shopping_profile mid-conversation, not only at checkout. Save: gender; sizes per category (a LIST — they may carry several); favorite_brands; disliked_brands / things they avoid; the categories they shop for; typical and max budget; style notes; recurring interests. A passing "I wear a 9.5" or "I love YoungLA" is worth saving immediately. Don't save one-off trivia, and NEVER record why they buy.
  • CANONICAL SHAPE to merge into: {gender, sizes:{shoe:["9 US","10 US"], tops:["M"], …}, favorite_brands:[], disliked_brands:[], categories:[], budget:{typical,max}, interests:[], style_notes}. Merge is additive (lists union, keys overwrite) — sending a size adds it to that category's range.
- SIZE / COLOR / VARIANT — DO NOT ASK. Never ask the customer what size, colour or variant they want, and never block finalize on it. Our shopping team collects the exact variant DIRECTLY with the customer AFTER the purchase request is created — that's their job, not a gate on placing the request. So when they finalize, create it immediately. If the customer VOLUNTEERS a size/colour ("la quiero en M negro"), pass it through in that item's notes; otherwise leave it blank — never write placeholders like "a confirmar", never interrogate, never scrape the page for options.
- FINALIZE ONLY WHEN THEY'RE DONE, THEN DON'T MAKE THEM CONFIRM TWICE. Adding items to the cart NEVER places the order — an "Agrégalo a mi carrito" / "quiero ese" is an ADD (show_shipment), not a finalize. Only when the customer signals they're done ("eso es todo", "créala", "cotízala", "haz el pedido", "ya estoy listo", the Finalizar carrito button) do you FINALIZE: call show_assisted_summary ONCE with EVERY item in the cart — immediately, WITHOUT asking for size, colour, variant or any confirmation (the shopping team collects variants with the customer afterward). That card places the request automatically and shows the real confirmation (real number + that nuestro equipo de compras will reach out) — do NOT ask "¿lo confirmo?" or "¿qué talla?" first. Your own text must NEVER say the request is created and must NEVER contain a PR number — the card does that.
- THE CARD IS THE WHOLE CART, AND THERE IS ONLY ONE REQUEST PER CHAT. show_assisted_summary is a SNAPSHOT of the full shipment, not an "add this item" action: every time you call it, pass EVERY item the customer has agreed to in this conversation so far — the new one AND all the previous ones, unchanged. Showing it again UPDATES that same request (same number, same box, one quote); it does NOT open a second one. Never call it with only the newest item, and never tell the customer they have more than one solicitud.
- PRICE (assisted purchase): the listed store price is only a REFERENCE, not the final amount. If they merely ASK what it would cost ("¿cuánto costaría?", "¿cuánto sería con comisión?"), answer in ONE short line — "El total será el precio final al hacer checkout en la tienda + 15% de comisión Boxly (la caja se cotiza aparte)" — and do NOT call show_assisted_summary for that (that card PLACES the order; calling it just to quote a price would create a request they didn't ask for). Only call show_assisted_summary once they've DECIDED to finalize. When you do, pass each item with the exact product_name/store/price/url/image you have (from the product they chose or the registry); leave size/color out unless the customer volunteered them (then put them in notes) — the shopping team confirms variants after.
${loggedIn
  ? '- This user is signed in. When they finalize, call show_assisted_summary (with all items) right away — do NOT ask for size/colour/variant first (the shopping team collects those after). It places the request automatically. You never place it yourself and never state a PR number.'
  : '- This user is a GUEST. A Boxly account is required to place ANY order. The moment they confirm they want to order (assisted purchase OR self-purchase), call create_account — this opens a button that takes them to register (email or Google) and brings them back here with the order ready. Do NOT ask for name/email/phone yourself, and do NOT call show_assisted_summary/create_self_order for a guest before the account exists. After they return signed in, the chat resumes and you finish the order.'}
- Be concise, friendly, and in the user's language (default Spanish, es-MX).`
}

// ── HUB (OS) preamble ─────────────────────────────────────────────────────────
// On the logged-in dashboard the assistant is the SINGLE interface for everything
// Boxly does. This block turns the shopping concierge into a full logistics OS that
// ROUTES the customer into the right pipeline and DRIVES it end-to-end in chat. It's
// prepended to the shopping system prompt (which still governs product discovery).
const PIPELINE_HINT: Record<string, string> = {
  search: 'The customer tapped **Comprar en EE.UU.** — the shopping flow. Help them FIND products (PRODUCT DISCOVERY) or take a pasted product link, then drive the COMPRA ASISTIDA (Boxly buys it for them, +15%) when they settle on something.',
  register: 'The customer tapped **Registrar compra** — they ALREADY BOUGHT something themselves and want Boxly to receive/import it (CASILLERO, no 15%). Ask them to upload the receipt/confirmation OR tell you what they bought, then use create_self_order.',
  assisted: 'The customer tapped **Compra asistida** — they want Boxly to BUY a product for them (+15%). Ask for the product link or what they want, then call show_assisted_summary — that card places the request automatically (no size/colour questions, no extra confirmation step; the shopping team confirms variants after).',
  status: 'The customer tapped **Estado de envío** — they want to track their orders/shipments. Show their orders and their status.',
  in_person: 'The customer tapped **Compras presenciales** — they want Boxly to shop in person at San Diego outlets. Help them schedule a trip and pick stores.',
}
function hubPreamble(loggedIn: boolean, pipeline?: string): string {
  const hint = pipeline && PIPELINE_HINT[pipeline] ? `\n\nACTIVE PIPELINE THIS TURN: ${PIPELINE_HINT[pipeline]}` : ''
  return `=== BOXLY OS MODE (logged-in dashboard) ===
You are the customer's SINGLE interface to everything Boxly. You are not just a product search box — you are their personal shopping + logistics assistant, and the conversation is how they run their whole Boxly account. Route them into the RIGHT pipeline and drive it to completion, all in chat. Answer with your interactive tools/components, never long paragraphs.

THE FOUR THINGS A CUSTOMER CAN DO (route to the one that fits their message):
1) BUSCAR PRODUCTOS 🛍️ — find/buy products from US stores (PRODUCT DISCOVERY, your search tools).
2) COMPRA ASISTIDA 💳 — Boxly BUYS a product for them (they paste a link / describe it). Once they've settled on the item(s), call show_assisted_summary right away (no size/colour questions — the shopping team collects variants after). That card places the request AUTOMATICALLY the instant it appears and shows the real confirmation — do NOT ask them to confirm again, do NOT call anything else, do NOT say it's created, and do NOT invent a PR number. Use when they don't have a US card or just want us to buy it.
3) REGISTRAR COMPRA (CASILLERO) 📦 — they ALREADY bought it themselves and want Boxly to receive + import it. Ends in create_self_order. NO 15% commission — never mention it here.
5) COMPRAS PRESENCIALES 🏬 — Boxly shops IN PERSON at San Diego / Las Americas outlets for them (boutiques, wholesale, multi-store). When they want this ('vayan por mí', 'compras presenciales', 'en persona'), call plan_in_person to render the date/store/interest planner; they pick and pay a small deposit.
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

  // The per-chat rolling summary (phase 2, on by default) is read in parallel
  // with the wiki so it adds no latency; it is null for guests / short chats.
  const [knowledge, summaryState] = await Promise.all([getKnowledge(), readSummary(callApi, conversationId, token)])

  // web_search: on Claude we use Anthropic's native server-side web search. On any
  // other provider (Gemini, OpenAI) we expose web_search as a normal function tool
  // backed by the API's SerpAPI organic search — same role: find stores/URLs. (On
  // Gemini the built-in google_search also can't coexist with our function tools.)
  const webSearchTool = isAnthropic()
    ? createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY }).tools.webSearch_20250305({ maxUses: 6 })
    : tool({
        description: "Search the web (Google) for stores, product pages and general info. FALLBACK when search_products returns nothing, and the way to find a real merchant product-page URL at order time. Returns results with title, url and snippet — pass good product-page URLs to show_products or extract_product.",
        inputSchema: z.object({ query: z.string().describe('What to search for, e.g. "YoungLA joggers men", "owala 24oz official site".') }),
        execute: async ({ query }) => callApi('/products/web-search', { method: 'POST', body: { query }, timeoutMs: 12000 }),
      })

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
  const ctx = [summaryBlock(summaryState), shopperContext(!!token, shoppingProfile, savedProducts)].filter(Boolean).join('\n\n')
  // History → model, bounded (see server/utils/chatContext.ts):
  //  1. old galleries collapse to a one-line marker (the products stay in the registry),
  //  2. hysteresis window (MAX 14 msgs / 6k tokens → keep 8; hard cap 9k),
  //  3. the per-shopper block rides on the NEWEST user message, so everything before
  //     it is byte-identical turn to turn and Gemini's implicit prefix cache covers
  //     the system prompt, the tools AND the recent history (it used to sit between
  //     the system prompt and the history, invalidating the cache every gallery turn).
  // suggest_followups parts are UI-only (chips) and the tool is no longer declared to
  // the model, so they are dropped from the transcript rather than replayed.
  const cleaned = dropToolParts(sanitizeToolInputs(stripIncompleteToolCalls(await pdfPartsToText(messages))), ['suggest_followups'])
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
  const markGallery = (r: any) => {
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
      ({ steps }: any) => {
        if (!galleryShown) return false
        return (steps || []).some((s: any) => String(s?.text || '').trim().length > 0)
      },
    ],
    // Once a gallery has rendered, only non-gallery tools remain available — the
    // model can write its closing line and add follow-ups, but can't draw a 2nd gallery.
    //
    // ALSO cap gallery-tool attempts at 2, even when nothing has rendered. The
    // prompt tells the model to retry once with a broader query and then stop,
    // but it does not reliably obey: conversation 331 (a real customer asking for
    // Kipling bags, while SerpAPI's shopping engine was down and every search
    // returned nothing) shows it emitting "Encontré varias bolsas Kipling en
    // oferta" and searching again, six times over. stepCountIs(10) was the only
    // brake, and ten steps of searching is far past the ~30s the host allows a
    // request — so the stream was cut, onFinish never ran, the turn was never
    // saved, and the customer sat on a spinner and got nothing.
    //
    // Two attempts is the same budget the prompt asks for. After that the gallery
    // tools go away and the model has to answer in text, which is a real reply
    // ("no encontré, ¿probamos otra marca?") instead of a hang.
    prepareStep: ({ steps }: any) => {
      if (galleryShown) return { activeTools: NON_GALLERY_TOOLS }
      const galleryAttempts = (steps || []).reduce(
        (n: number, s: any) => n + (s.toolCalls || []).filter((c: any) => GALLERY_TOOLS.includes(c.toolName)).length,
        0
      )
      // suggest_followups is never offered to the model (chips come from followupsPromise).
      return { activeTools: galleryAttempts >= 2 ? NON_GALLERY_TOOLS : LOOP_TOOLS }
    },
    onError: ({ error }) => console.error('[assistant] error:', error instanceof Error ? error.message : error),
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
      // A turn that used a product tool is a SEARCH (logged server-side by
      // /products/search). A turn with no product tool is a business QUESTION.
      const usedProductTool = (steps || []).some((s: any) => (s.toolCalls || []).some((c: any) => PRODUCT_TOOLS.has(c.toolName)))
      if (!usedProductTool) logQuestion(question, text || '', auth, conversationId)
      // Durably save the turn server-side (awaited so it completes within the
      // stream lifecycle — see persistTurn). Authoritative writer of chat history.
      await persistTurn(conversationId, token, messages, steps, text || '', chips)
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
      web_search: webSearchTool,

      extract_product: tool({
        description: 'Fetch clean details (title, USD price, image, store) from a specific US product URL the user picked.',
        inputSchema: z.object({ url: z.string().describe('The product page URL.') }),
        execute: async ({ url }) => callApi('/products/extract', { method: 'POST', body: { url } }),
      }),

      browse_store: tool({
        description: "SLOW LIVE fallback — pull products straight from a Shopify store's own site (YoungLA, Gymshark, Alo, Chubbies…) in real time (several seconds). PREFER THE CATALOG FIRST: for a named store use curate_products/search_products (instant, already has our harvested products with clean titles). Use browse_store ONLY when the catalog came back empty/too thin for that store, or the user explicitly wants the freshest live drop — and NEVER in a turn where curate/search already returned usable results. Results are filtered to items orderable right now (gated future-dated drops excluded) and render as a gallery with real images/prices. If it returns nothing the store isn't supported — fall back to web_search.",
        inputSchema: z.object({
          store_url: z.string().describe('Store homepage or any URL on it, e.g. https://www.youngla.com'),
          query: z.string().describe('Optional keyword to search within the store; omit for the latest drop.').optional(),
          sale: z.boolean().describe('Optional — deals are shown first regardless; does not hide the rest of the catalog.').optional(),
        }),
        execute: async ({ store_url, query, sale }) => markGallery(await callApi('/products/store-feed', { method: 'POST', body: { url: store_url, query: query || undefined, sale: sale || undefined, limit: 12 }, timeoutMs: 25000 })),
        toModelOutput: galleryModelOutput,
      }),

      browse_stores: tool({
        description: "Browse MULTIPLE US stores AT ONCE and return a single mixed gallery of real products tagged by store. Use this for broad/category requests (e.g. 'gym clothes', 'cozy hoodies', 'something for the beach') to show variety across brands, or with sale:true to surface current DEALS across stores. Pass 2-5 Shopify store URLs (use the store directory in your instructions, or stores you found via web_search). Results render as a gallery the user can filter by store. If a store returns nothing it's skipped.",
        inputSchema: z.object({
          stores: z.array(z.object({
            name: z.string().describe('Display/brand name, e.g. "YoungLA".').optional(),
            url: z.string().describe('Store homepage URL, e.g. https://www.youngla.com'),
          })).min(1).max(6),
          query: z.string().describe('Optional keyword to search within each store, e.g. "joggers"; omit for each store\'s latest drop.').optional(),
          sale: z.boolean().describe('Optional — deals are shown first regardless; does not hide non-sale items.').optional(),
        }),
        execute: async ({ stores, query, sale }) => {
          const list = (stores || []).slice(0, 6)
          const per = list.length >= 5 ? 3 : list.length >= 3 ? 4 : 6
          const perStore = await Promise.all(list.map(async (s) => {
            try {
              const r: any = await callApi('/products/store-feed', {
                method: 'POST',
                body: { url: s.url, query: query || undefined, sale: sale || undefined, limit: per },
                timeoutMs: 20000,
              })
              return (r?.products || []).map((p: any) => ({ ...p, store: s.name || r?.store || p.store }))
            } catch { return [] }
          }))
          return markGallery({ products: interleave(perStore) })
        },
        toModelOutput: galleryModelOutput,
      }),

      search_products: tool({
        description: "THE DEFAULT product search and your FIRST move for ANY product request — it reads Boxly's OWN curated catalog (harvested daily from our favorite US stores: Target, Nike, Dick's, Best Buy, Walmart, New Balance, Gap, Old Navy, Alo and more) and returns INSTANTLY, already ranked with the best deals first. Works for ANY store/brand (set store — or brands[] for several — to the brand name; typos are fuzzy-resolved) and for broad/category or cross-store discovery. Returns a gallery with real images, prices (incl. sale prices) and each item's store. Drive it with STRUCTURED filters: category (product type), store/brands, min_price/max_price (budget), min_discount (deal depth, %), sort (best_deal|discount|price_low|price_high|newest). Leave only the LOOK-descriptors (color, fit/style, material, model name) in query — query ranks results, it does not gate them, so it rarely returns empty. If it somehow does, THEN fall back to browse_store (for a Shopify directory brand) or web_search.",
        inputSchema: z.object({
          query: z.string().describe('The FREE-TEXT descriptors only — color, style/fit ("wide-leg", "oversized"), material, model name, gender. Keep it to the words that describe the LOOK. It RANKS results (best matches first) and never empties the gallery, so extra words are safe. Put the CATEGORY, BRAND, PRICE and DISCOUNT in the dedicated params below instead of here — that filtering is far more reliable. E.g. for "black wide-leg jeans from Old Navy under $30" → query:"black wide-leg", category:"jeans", store:"Old Navy", max_price:30.'),
          store: z.string().describe('The store/brand the customer is shopping — set it whenever they name one ("de/from/en <store>"), AND KEEP IT SET on every follow-up search in the same conversation until they name a DIFFERENT store or ask to search across all stores (the STICKY STORE rule). Typos/loose spelling are fine (we fuzzy-resolve: "beast buy"→Best Buy, "naik"→Nike). A brand we don\'t carry is used to rank instead. For MULTIPLE stores use brands[].').optional(),
          brands: z.array(z.string()).describe('Multiple stores/brands to include at once, e.g. ["Nike","Old Navy"] for "jeans from Nike or Old Navy". Same fuzzy resolution as store. Use this OR store, not both.').optional(),
          category: z.string().describe('The product TYPE, matched reliably against our category field: "jeans", "hoodies", "running shoes", "dresses", "headphones", "backpack", "leggings", "sweaters", "jackets". Prefer this over putting the category in query — it is the strongest, most dependable filter and keeps the gallery on-topic.').optional(),
          min_price: z.number().describe('Minimum USD price (e.g. "over $50" → min_price:50).').optional(),
          max_price: z.number().describe('Maximum USD price — budgets like "under $50" → max_price:50.').optional(),
          min_discount: z.number().describe('Minimum discount PERCENT — the reseller\'s deal filter. "at least 40% off" / "big discounts" → min_discount:40. Implies on-sale only.').optional(),
          sort: z.enum(['best_deal', 'discount', 'price_low', 'price_high', 'newest']).describe('Ordering. Default best_deal (relevant deals first). Use discount for "biggest markdowns", price_low for "cheapest", price_high for "premium", newest for "latest".').optional(),
          sale: z.boolean().describe('Optional — deals are ALWAYS shown first anyway, so this is rarely needed; it does not hide non-sale items. Use only for "SOLO ofertas / only on sale".').optional(),
        }),
        execute: async ({ query, store, brands, category, min_price, max_price, min_discount, sale, sort }) => {
          // SERP replacement: our OWN catalog, harvested by the computer-use agents
          // and served from catalog.fullstacklabs.org. The catalog does the fuzzy
          // store resolution, structured filtering and relevance ranking; free-text
          // query ranks (never gates), so results come back best-match-first and the
          // gallery stays full — the model judges exactness from the titles it gets.
          const r: any = await searchCatalogApi({ query, store, brands, category, min_price, max_price, min_discount, sale, sort })
          return markGallery(r)
        },
        toModelOutput: galleryModelOutput,
      }),
      find_on_google: tool({
        description: "OUT-OF-CATALOG WEB SEARCH — the fallback for a product Boxly does NOT carry. Our agent runs a GOOGLE SHOPPING search and returns real cross-web options (merchant, price, image, a buyable link); Boxly buys it in the US and delivers to Mexico. USE IT ONLY AFTER the catalog genuinely missed — i.e. search_products/curate_products came back empty, or with no_exact_match:true, or query_matched:false, OR it's clearly a category/product we don't stock (a digital camera, a red-light LED mask, an appliance, a very specific model). The catalog is ALWAYS your first move; this is the exception. SLOW (~20-30s): open with ONE short line in the SAME turn ('Eso no lo tenemos en el catálogo — déjame buscarlo en la web 🔎') so the loader covers the wait, then fire it. Pass the product as `query` with the brand/model included. FRAME the results as found on the WEB (Target, eBay, Best Buy, Walmart…) and orderable through Boxly — NOT our catalog. If it comes back with reason 'cooling'/'blocked' (Google rate-limited us) say we couldn't search the web this moment and offer to take a direct link or try shortly; 'no_results' means the web search found nothing — ask for a link.",
        inputSchema: z.object({
          query: z.string().describe('The product to find on the web, with brand/model, e.g. "red light led face mask", "Sony ZV-1F camera", "New Balance 9060 grey".'),
        }),
        execute: async ({ query }: any) => markGallery(await getGoogleShopApi(query)),
        toModelOutput: galleryModelOutput,
      }),

      curate_products: tool({
        description: "The DEALS & BROAD-DISCOVERY specialist — use it INSTEAD of search_products whenever the request is about DEALS/PROMOS ('ofertas', 'promos', 'lo más rebajado', 'deals'), or is a WIDE 'show me X for [men/women/kids]' / 'algo para [el gym / una fiesta / otoño / un regalo]' kind of ask (the wide, vibe-y requests — a big share of what shoppers want). It reads Boxly's DEEP UNDERSTANDING of the catalog (real gender, product type, brand tier, a true deal-quality score, and style/occasion/season tags) and returns a PERSONALIZED, VARIED, best-first curated set — one representative per product (no duplicate colors), too-good-to-be-true errors filtered out, and DIFFERENT great picks each time you call it (so 'muéstrame más' or a repeat ask never shows the same list). Each item comes back with a short Spanish `why` you should weave into your recommendation. Prefer this for deals and broad/curated asks; use search_products for a SPECIFIC product/model/brand lookup.",
        inputSchema: z.object({
          query: z.string().describe('OPTIONAL free-text look descriptors only (color, style, model). Ranks, never gates. Put type/gender/occasion in their own params.').optional(),
          intent: z.enum(['deals', 'browse']).describe("deals (DEFAULT) = only real markdowns, ranked by deal quality — use for ANY oferta/promo/deal request. browse = include full-price too, for a general curated browse when they're not deal-focused.").optional(),
          department: z.enum(['apparel', 'footwear', 'bags', 'accessories', 'beauty', 'electronics', 'home', 'toys', 'sports']).describe('Top-level type. "ropa"→apparel, "tenis/zapatos"→footwear, "bolsas/mochilas"→bags, "maquillaje/skincare/perfume"→beauty, "audífonos/tv/laptop"→electronics, "juguetes/lego/funko"→toys.').optional(),
          gender: z.enum(['women', 'men', 'kids']).describe('Who it is for — "para hombre/hombres"→men, "para mujer/mujeres"→women, "para niños"→kids. Unisex items are auto-included; leave unset if not specified.').optional(),
          categories: z.array(z.string()).describe('Specific product types when narrower than department: "hoodie","leggings","sneakers","handbag","crossbody","headphones","dress","jeans". Optional.').optional(),
          occasion: z.array(z.string()).describe('Occasion/use: "gym","everyday","work","travel","party","outdoor". Great for "algo para el gym", "para una fiesta".').optional(),
          season: z.array(z.string()).describe('Season: "fall","winter","summer","spring","holiday". For "ropa de otoño", "para el frío".').optional(),
          style: z.array(z.string()).describe('Aesthetic: "streetwear","athleisure","classic","minimalist","cozy","luxury","preppy".').optional(),
          gift: z.boolean().describe('true for gift asks ("un regalo para…").').optional(),
          brand_tier: z.enum(['mass', 'mid', 'premium', 'luxury']).describe('"de lujo/marca fina"→luxury; "de marca"→premium; "económico/barato"→mass. Optional.').optional(),
          store: z.string().describe('Focus on one store/brand (fuzzy-resolved). Keep it set on follow-ups until they name a different store (STICKY STORE).').optional(),
          min_price: z.number().describe('Minimum USD price.').optional(),
          max_price: z.number().describe('Maximum USD price — budgets like "menos de $50" → max_price:50.').optional(),
        }),
        execute: async (a: any) => {
          const genders = a.gender === 'men' ? ['men', 'unisex'] : a.gender === 'women' ? ['women', 'unisex'] : a.gender === 'kids' ? ['kids'] : undefined
          const r: any = await curateCatalogApi({
            query: a.query, intent: a.intent || 'deals', department: a.department, genders,
            categories: a.categories, occasion_tags: a.occasion, season_tags: a.season, style_tags: a.style,
            gift: a.gift, brand_tiers: a.brand_tier ? [a.brand_tier] : undefined, store: a.store,
            min_price: a.min_price, max_price: a.max_price,
          })
          return markGallery(r)
        },
        toModelOutput: galleryModelOutput,
      }),
      show_collection: tool({
        description: "Surface a PRECOMPUTED curated collection — the fastest, most white-glove way to answer a BROAD or OPENING ask (a fresh chat, 'qué ofertas hay', 'muéstrame deals', 'algo de Coach Outlet', 'lo mejor de Kipling'). These are hand-curated deal-driven and store-spotlight sets Boxly maintains, each with a title and the best real markdowns, rotated so it's fresh every time. Prefer this over curate_products when the request maps to one of the collections below — it's one instant read and leads with a named, editorial set. Pass the collection `id`. Available collections:\n" + COLLECTION_MENU.map((c) => `  • ${c.id} — ${c.title}`).join('\n') + "\nPick the single best-matching id from the conversation. For a specific product/model use search_products; for a narrow facet combo not covered here use curate_products.",
        inputSchema: z.object({
          collection: z.enum(COLLECTION_IDS).describe('The collection id to show — the single best match for what the shopper wants.'),
        }),
        execute: async ({ collection }: any) => markGallery(await getCollectionApi(collection)),
        toModelOutput: galleryModelOutput,
      }),
      find_live_product: tool({
        description: "LIVE product fetch with our OWN shopping agent — the fallback for when the catalog can't answer. Use it in EXACTLY two cases: (1) the user PASTED a product link → pass {url}; (2) they want a SPECIFIC product that search_products just didn't have → pass {store, query}. It sends the agent to the store and grabs that exact product in real time. It's SLOWER (~10s), so open with ONE short line first ('Va, déjame buscarlo en vivo un momento… 🔎') — the loader shows while it works. Works for Nike, Best Buy and Walmart today. Returns the product (or the closest matches) with a real image + US price, ready to add to a purchase request. NEVER use it for browsing, categories, or a general search — search_products (the catalog) is ALWAYS your first, fast move; find_live_product is only for a miss or a pasted link.",
        inputSchema: z.object({
          url: z.string().describe('The exact product URL the user pasted. Use this form for a pasted link (no store/query needed).').optional(),
          store: z.string().describe('Store to search live, e.g. "Nike" (typos are fine). Use WITH query when the user named a product but gave no link.').optional(),
          query: z.string().describe('The specific product to find, short, e.g. "air max 90 red" or "pegasus 41". No store words here — put those in store.').optional(),
        }),
        execute: async ({ url, store, query }) => markGallery(await liveGrabApi({ url, store, query })),
        toModelOutput: galleryModelOutput,
      }),

      show_saved_products: tool({
        description: "Re-display products that were ALREADY shown earlier in THIS chat (listed under 'PRODUCTS ALREADY SHOWN IN THIS CHAT'). Use when the user refers back to something — 'tráeme ese hoodie', 'el segundo', 'el que vimos antes', 'compara los dos primeros'. Pass their ids. This is instant and exact — do NOT re-search for an item that's already in that list.",
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

      show_products: tool({
        description: 'Display a visual GALLERY of product recommendations to the user (cards with image, price, link they can tap). ALWAYS use this to present products you found — never just list them as plain text. Provide up to 6 real products, each with a real product_url. The gallery fetches the real image automatically.',
        inputSchema: z.object({
          products: z.array(z.object({
            title: z.string(),
            product_url: z.string().describe('Direct URL to the product page.'),
            price: z.number().describe('USD price if known.').optional(),
            store: z.string().describe('Store/brand name.').optional(),
            reason: z.string().describe('Short note on why it fits (optional).').optional(),
          })).min(1).max(6),
        }),
        execute: async ({ products }) => {
          const enriched = await Promise.all((products || []).map(async (p) => {
            let image: string | null = null
            let price = p.price ?? null
            let store = p.store ?? null
            let ok = false
            try {
              const ex: any = await callApi('/products/extract', { method: 'POST', body: { url: p.product_url }, timeoutMs: 15000 })
              if (ex && ex.image) image = ex.image
              if (price == null && ex?.price != null) price = ex.price
              if (!store && ex?.store) store = ex.store
              // Require a real IMAGE — a store homepage (or a category page) yields a
              // price but no product image, and a card with no image is a broken,
              // blank tile. Only render items that extracted an actual product photo.
              ok = !!image
            } catch { /* best-effort */ }
            return { title: p.title, url: p.product_url, image, price, store, note: p.reason ?? null, ok }
          }))
          // Only return products we could verify (real image/price). If none
          // verify, return empty so nothing renders — better than broken cards
          // (the model likely already showed a good gallery via search_products).
          const verified = enriched.filter((p) => p.ok).map(({ ok, ...p }) => p)
          // Say WHY it's empty. Returning a bare [] read as "nothing exists", so
          // the model apologised and handed the customer a link to the store —
          // while the web_search snippet it already had listed the real items and
          // prices. An explicit failure tells it to use what it has.
          const failed = enriched.filter((p) => !p.ok).map((p) => p.url)
          if (!verified.length) {
            return {
              products: [],
              error: 'no_product_page_resolved',
              failed_urls: failed,
              note: 'None of these URLs resolved to a real product page (invented slugs and category/homepage URLs both fail). Do NOT tell the customer you could not load the catalog and do NOT just hand them a store link. Retry show_products with product URLs copied VERBATIM from web_search results, or — if you have none — name the specific items and prices from the web_search snippets in your reply and offer to quote whichever one they pick.',
            }
          }
          return markGallery({ products: verified })
        },
        toModelOutput: galleryModelOutput,
      }),

      show_shipment: tool({
        description: "Show/UPDATE the customer's live BOXLY shipment (their consolidation box). Call this EVERY time the shipment changes — an item is added, removed, or a quantity changes — passing ALL items currently in the shipment (not just the new one). It renders a card with the recommended box size, a volume bar and capacity remaining, so the customer watches their box fill up and is encouraged to consolidate more. Display only — it does NOT place the order (call show_assisted_summary to finalize an assisted purchase). This is separate from the product gallery; you may call it in the same turn as confirming an add.",
        inputSchema: z.object({
          items: z.array(z.object({
            name: z.string().describe('Product name, e.g. "Touchland Power Mist" or "Owala FreeSip 24oz".'),
            quantity: z.number().int().min(1).default(1),
            image: z.string().describe('Product image URL — pass it whenever you have it (from the gallery item the customer added) so the box shows the thumbnail. This makes the cart feel real as it fills up.').optional(),
            price: z.number().describe('USD price the customer saw (sale price if on sale) — shown under the item in the box.').optional(),
            type: z.enum(['rigid_small', 'flat_soft', 'medium_soft', 'rigid_medium', 'shoes', 'bulky_soft', 'fragile']).describe('Packing archetype by VOLUME, not item count (two orders with the same number of items can need totally different boxes). rigid_small=ocupan muy poco — cosmetics/makeup/perfume/jewelry/accessories/phone cases/cables/Touchland sanitizers/small wallets (adding several barely changes the box); flat_soft=ocupan poco — t-shirts/leggings/shorts/underwear/socks/swimwear (compress well); medium_soft=ocupan medio — jeans/hoodies/sweatshirts/joggers/light jackets/mid bags/backpacks; rigid_medium=bottles/tumblers/electronics; shoes=a boxed pair; bulky_soft=ocupan mucho — boots/thick coats/blankets/pillows/plush/helmets/appliances (pots, coffee makers); fragile=lamps/glass/decor. A Touchland Power Mist sanitizer is rigid_small.').optional(),
          })).min(1),
        }),
        execute: async ({ items }) => buildShipment(items),
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

      show_assisted_summary: tool({
        description: "Place an ASSISTED PURCHASE. This card CREATES the real purchase request AUTOMATICALLY the instant it appears (client-side, real number) — it is the ONLY way to place an assisted order, and there is no separate confirm step. You do NOT place the request yourself and never receive its number, so NEVER say it's created and NEVER state a PR number — the card shows the confirmation. Call this as soon as the customer finalizes the cart — do NOT ask for size, colour or variant first (the size/color fields are OPTIONAL; only fill them if the customer volunteered a variant). Our shopping team confirms the exact size/colour directly with the customer AFTER the request exists, so never block or delay placing it to collect variants.",
        inputSchema: z.object({
          items: z.array(z.object({
            name: z.string().describe('Product name.'),
            store: z.string().describe('Store/brand.').optional(),
            price: z.number().describe('Reference USD price the customer saw (use the sale price if on sale); 0 if unknown.').optional(),
            quantity: z.number().int().min(1).default(1),
            image: z.string().describe('Product image URL if known.').optional(),
            url: z.string().describe('Direct product URL so Boxly buys the EXACT item — include it whenever you have it (from the registry / the page the user chose).').optional(),
            // Deliberately separate named fields rather than free prose in notes.
            // As a line in the prompt this kept getting skipped; as a field the
            // model has to decide about, it gets filled.
            size: z.string().describe('OPTIONAL — only if the customer VOLUNTEERED it, verbatim ("M", "9.5 US"). Do NOT ask for it and do NOT guess; leave it blank otherwise (the shopping team collects it after). Never write a placeholder like "a confirmar".').optional(),
            color: z.string().describe('OPTIONAL — only if the customer VOLUNTEERED it, verbatim ("negro"). Do NOT ask for it and do NOT guess; leave it blank otherwise (the shopping team collects it after). Never write a placeholder like "a confirmar".').optional(),
            notes: z.string().describe('ONLY extra detail that is not size or colour — e.g. "en oferta, antes $42". Do NOT repeat the size or colour here; they have their own fields.').optional(),
          })).min(1),
        }),
        // Fold size/colour into notes so they land in the single field the admin
        // order view already renders (NOTAS DEL CLIENTE) — the shopping team sees
        // them without any API or admin-UI change.
        execute: async ({ items }) => ({
          items: (items || []).map((it) => {
            const bits = [
              it.size ? `Talla ${it.size}` : null,
              it.color ? `Color ${it.color}` : null,
              it.notes || null,
            ].filter(Boolean)
            return { ...it, quantity: it.quantity || 1, notes: bits.join(' · ') || undefined }
          }),
        }),
      }),

      // NOTE: there is deliberately NO create_purchase_request tool. Letting the
      // model place the order directly was unreliable — it would fabricate a PR
      // number in its reply ("He registrado tu solicitud PR-26-ALEPE") with NO
      // request ever created. Assisted purchase is DETERMINISTIC: the model shows
      // show_assisted_summary, whose card auto-creates the real request client-side
      // (confirmAssisted, the instant it appears) and displays the real number. The
      // model can neither create a request nor obtain a number to narrate.

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
      // In-person (Las Americas) planner: loads open trip dates + in-person stores +
      // categories so the customer picks a date, stores and interests right in chat.
      plan_in_person: tool({
        description: "Show the IN-PERSON shopping planner (Boxly shops for the customer at San Diego / Las Americas outlets). Call this when they want in-person / presencial shopping ('vayan por mí a Las Americas', 'compras presenciales', 'shop for me at the outlets'). It renders a card to pick a trip DATE, choose STORES and interests, and set a minimum budget; then they pay a small deposit. Requires the user to be signed in.",
        inputSchema: z.object({}),
        execute: async () => {
          if (!token) return authedNote
          const [avail, storesRes, cats]: any = await Promise.all([
            callApi('/shopping-trips/availability', { token }),
            callApi('/shopping-trips/in-person-stores', { token }),
            callApi('/shopping-trips/categories', { token }),
          ])
          return {
            trips: Array.isArray(avail) ? avail : [],
            stores: storesRes?.stores || [],
            categories: Array.isArray(cats) ? cats : [],
            per_store_fee_usd: storesRes?.per_store_fee_usd ?? 10,
          }
        },
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
        description: "Open the account gate for a GUEST who wants to place an order (purchase request or self-purchase). The app shows a button that takes them to register (email or Google) and returns them to this chat with their order ready to confirm — so you do NOT need to ask for name/email/phone yourself. Call it the moment a guest confirms they want to order. After this, the conversation continues once they're back and signed in.",
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
