import { streamText, generateText, tool, convertToModelMessages, stepCountIs } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'
import { FALLBACK_KNOWLEDGE } from '../utils/boxlyKnowledge'

/**
 * AI shopping-assistant chat backend (Phase 2).
 *
 * Streams Claude with:
 *  - web_search (native) for product discovery,
 *  - extract_product (public API) to read a chosen product page,
 *  - authed tools (create_purchase_request / get_profile / list_orders /
 *    update_shopping_profile) that call the Boxly API with the user's bearer
 *    token, and
 *  - create_account: a CLIENT-executed tool (no server execute) so the browser
 *    runs /auth/chat-register itself and gets the SPA session cookie.
 *
 * The frontend (useChat) sends { messages, token?, shoppingProfile? }.
 */

const API_BASE = (process.env.API_URL || 'https://api.boxly.mx').replace(/\/$/, '')
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6'
const RANK_MODEL = process.env.ANTHROPIC_TITLE_MODEL || 'claude-haiku-4-5-20251001'

// AI-first gallery ranking: a fast model reorders raw search results to put the
// BEST first — trustworthy, well-known retailers and major brands over tiny
// unknown niche resellers — so the customer sees the best shopping results up
// front. No hard-coded store lists; we let the model's knowledge decide.
// Best-effort: any failure returns the original order untouched.
async function rankProducts(query: string, products: any[]): Promise<any[]> {
  if (!Array.isArray(products) || products.length < 3 || !process.env.ANTHROPIC_API_KEY) return products
  try {
    const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const list = products.map((p, i) =>
      `${i}: ${(p.title || '').slice(0, 80)} — ${p.store || '?'}${p.price ? ` — $${p.price}` : ''}${p.on_sale ? ' (oferta)' : ''}`
    ).join('\n')
    const { text } = await generateText({
      model: anthropic(RANK_MODEL),
      system:
        "You curate a US shopping gallery for a Boxly customer in Mexico. Reorder the results to show the BEST first. Prioritize TRUSTWORTHY, well-known sellers — big-box/department retailers (Target, Walmart, Dick's, Best Buy, Costco, Macy's, Nordstrom, Kohl's, REI, Ulta, Sephora…) and recognized brand stores (Nike, Adidas, New Balance, Lululemon, Stanley, Owala…) — ABOVE tiny unknown niche resellers and random marketplace third-parties. Keep items that best match the query. A good price/deal is a tiebreaker, never the main factor. Return ONLY the item numbers in the new order, comma-separated, every number exactly once.",
      prompt: `Query: "${query}"\n\nItems:\n${list}\n\nBest order (numbers):`,
    })
    const idx = (text.match(/\d+/g) || []).map(Number).filter((n) => n >= 0 && n < products.length)
    const seen = new Set<number>()
    const order: number[] = []
    for (const i of idx) if (!seen.has(i)) { seen.add(i); order.push(i) }
    for (let i = 0; i < products.length; i++) if (!seen.has(i)) order.push(i) // append any the model dropped
    if (order.length !== products.length) return products
    return order.map((i) => products[i])
  } catch {
    return products
  }
}

// Admin-managed knowledge wiki (Mode 1 — Expert). Cached briefly; falls back to a
// built-in constant if the API is unreachable so the concierge never goes dark.
let wikiCache: { markdown: string; at: number } | null = null
const WIKI_TTL_MS = 60_000
async function getKnowledge(): Promise<string> {
  if (wikiCache && Date.now() - wikiCache.at < WIKI_TTL_MS) return wikiCache.markdown
  try {
    const res = await fetch(`${API_BASE}/knowledge`, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000) })
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

const PRODUCT_TOOLS = new Set(['search_products', 'browse_store', 'browse_stores', 'show_products', 'show_saved_products', 'extract_product', 'web_search'])

// Analytics: a turn that used a product tool is a SEARCH (already logged server-side
// by /products/search); a turn with no product tool is a business QUESTION. Log the
// latter to /search-events, forwarding the user's identity so it's attributed.
function logQuestion(question: string, answer: string, auth: { cookie?: string; origin?: string; token?: string }) {
  if (!question?.trim()) return
  const headers: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' }
  if (auth.cookie) headers.Cookie = auth.cookie
  if (auth.origin) headers.Origin = auth.origin
  if (auth.token) headers.Authorization = `Bearer ${auth.token}`
  fetch(`${API_BASE}/search-events`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ type: 'question', query: question, answer }),
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
// Calibration anchors (validated): 4 leggings ≈ XS ~80% full; +10 small sanitizers
// ≈ XS basically full (NOT a jump to Medium). Shoes (boxed): XS ~1 pair, S ~3-4,
// M ~10, L ~15, XL ~20.
const ARCHETYPE_VOL: Record<string, number> = {
  flat_soft: 0.30,    // leggings, shirts, underwear, socks (compressible)
  rigid_small: 0.05,  // hand sanitizer, perfume, skincare, cosmetics, cards, jewelry
  rigid_medium: 0.25, // bottles, tumblers, electronics
  shoes: 1.50,        // a boxed pair
  bulky_soft: 0.80,   // jackets, hoodies, plush, blankets
  fragile: 2.00,      // lamps, glass, decor (awkward, low packing efficiency)
}
const DEFAULT_VOL = 0.40 // unknown item → a generic medium
const ARCH_LABEL: Record<string, string> = {
  flat_soft: 'Ropa', rigid_small: 'Pequeño', rigid_medium: 'Mediano', shoes: 'Calzado', bulky_soft: 'Voluminoso', fragile: 'Frágil',
}
const BOXES = [
  { key: 'XS', label: 'Extra chica', usable: 1.5 },
  { key: 'S', label: 'Chica', usable: 5.5 },
  { key: 'M', label: 'Mediana', usable: 16 },
  { key: 'L', label: 'Grande', usable: 22 },
  { key: 'XL', label: 'Extra grande', usable: 32 },
]

// Fallback classification from the product name when the model didn't pass a type.
const RE_SHOES = /shoe|sneaker|tenis|boot|bota|cleat|sandal|heel|loafer|zapat/i
const RE_FRAGILE = /lamp|l[aá]mpara|glass|vidrio|vase|florero|mirror|espejo|frame|cuadro|ceramic|porcelain|decor/i
const RE_BULKY = /jacket|coat|parka|hoodie|sweater|sudadera|abrigo|chamarra|blanket|comforter|duvet|cobija|plush|peluche|pillow|almohada|duffel|backpack|mochila|luggage|maleta|suitcase|tent|sleeping bag/i
const RE_RIGID_SMALL = /saniti|mist|antibac|perfume|cologne|fragran|skincare|serum|lipstick|labial|mascara|cosmetic|maquillaje|cream|crema|lotion|loci[oó]n|cards?|cartas|pok[eé]mon|wallet|cartera|watch|reloj|jewel|joy|ring|anillo|necklace|collar|earring|arete|sunglass|lentes|case|funda|charger|cargador|earbuds|airpods|keychain|llavero/i
const RE_RIGID_MEDIUM = /bottle|botella|tumbler|termo|\bcup\b|\bmug\b|taza|owala|stanley|hydro|flask|speaker|bocina|camera|c[aá]mara|console|consola|electronic|electr[oó]nico/i
const RE_FLAT_SOFT = /legging|mall[oó]n|shirt|camisa|\btee\b|playera|\btop\b|blouse|blusa|dress|vestido|short|jean|pant|pantal[oó]n|skirt|falda|underwear|ropa interior|sock|calcet|\bbra\b|brasier|swim|traje de ba/i
function archetypeFromName(name: string): string | null {
  const t = name || ''
  if (RE_SHOES.test(t)) return 'shoes'
  if (RE_FRAGILE.test(t)) return 'fragile'
  if (RE_BULKY.test(t)) return 'bulky_soft'
  if (RE_RIGID_SMALL.test(t)) return 'rigid_small'
  if (RE_RIGID_MEDIUM.test(t)) return 'rigid_medium'
  if (RE_FLAT_SOFT.test(t)) return 'flat_soft'
  return null
}
function buildShipment(items: any[]) {
  const norm = (items || []).map((it) => {
    const quantity = Math.max(1, Number(it.quantity) || 1)
    const type = (it.type && ARCHETYPE_VOL[it.type]) ? it.type : archetypeFromName(it.name || '')
    const vol = type ? ARCHETYPE_VOL[type] : DEFAULT_VOL
    return { name: it.name || 'Producto', quantity, size: type ? ARCH_LABEL[type] : 'Mediano', units: vol * quantity }
  })
  const total = norm.reduce((s, i) => s + i.units, 0)
  // Smallest box that holds it, allowing ~15% overflow so a near-full box reads
  // "XS lleno" instead of jumping to "S 30%". This prevents the bad tier jumps.
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

// Boxly's default box price table (shipping cost per consolidated box to Mexico).
// Source of truth for the in-chat box-guide component. Update here if prices change.
const BOX_GUIDE = [
  { key: 'XS', label: 'Extra chica', price_mxn: 1200, dims: '32×24×13 cm', max_kg: 8, fits: '~4–6 prendas · 1–2 pares · 20–40 cosas pequeñas' },
  { key: 'S', label: 'Chica', price_mxn: 2200, dims: '42×27×32 cm', max_kg: 15, fits: '~10–15 prendas · 5–6 pares · 60–100 pequeñas' },
  { key: 'M', label: 'Mediana', price_mxn: 4000, dims: '42×52×40 cm', max_kg: 25, fits: '~25–35 prendas · 15–18 pares · cientos', popular: true },
  { key: 'L', label: 'Grande', price_mxn: 5100, dims: '52×42×40 cm', max_kg: 35, fits: '~40–50 prendas · 20–25 pares' },
  { key: 'XL', label: 'Extra grande', price_mxn: 6250, dims: '52×62×53 cm', max_kg: 50, fits: '~55–70 prendas · 30–35 pares' },
]

function systemPrompt(loggedIn: boolean, shoppingProfile: any, savedProducts: any[] = [], knowledge = '') {
  const profileBlock = !loggedIn
    ? ''
    : (shoppingProfile && Object.keys(shoppingProfile).length
      ? `\n\nLONG-TERM MEMORY FOR THIS SHOPPER (persists across EVERY chat — this is what makes you feel personal). Apply it on every search WITHOUT being asked: use their saved gender, sizes, favorite brands, budget and interests automatically, and never re-ask for anything already here. Keep it current with update_shopping_profile the moment you learn something new:\n${JSON.stringify(shoppingProfile)}`
      : `\n\nLONG-TERM MEMORY FOR THIS SHOPPER: empty so far. As you learn durable facts (gender, sizes, favorite/disliked brands, the categories they shop for, budget, style), save them with update_shopping_profile so future chats feel personal and you never have to ask twice. Never ask or record why they buy.`)
  const savedBlock = savedProducts && savedProducts.length
    ? `\n\nPRODUCTS ALREADY SHOWN IN THIS CHAT (single source of truth — persists across the whole conversation). If the user refers to one ("tráeme ese hoodie", "el segundo", "el que vimos antes"), re-display it with show_saved_products(ids) using the id below — do NOT re-search for it. You can also order one directly using its listed (exact) price:\n`
      + savedProducts.slice(-40).map((p: any) => `- ${p.id}: ${p.title}${p.store ? ' — ' + p.store : ''}${p.price ? ' — $' + p.price + (p.on_sale && p.was ? ' (oferta, antes $' + p.was + ')' : '') : ''}`).join('\n')
    : ''
  const knowledgeBlock = `\n\n=== BASE DE CONOCIMIENTO (Modo Experto — responde preguntas del negocio SOLO con esto) ===\n${knowledge || 'No disponible ahora — si te preguntan algo del negocio que no sepas con certeza, dilo y ofrece WhatsApp.'}\n=== FIN BASE DE CONOCIMIENTO ===`

  return `You are the BOXLY CONCIERGE — a warm, expert guide who helps customers in Mexico buy from the United States. THE CONVERSATION IS THE PRODUCT: you help people like a top-performing sales rep would — answer their questions, build their confidence, help them find the right thing, and get it ordered. Product search is just ONE tool you reach for during that conversation (think Perplexity, not Google). Boxly's edge is the WHOLE job: you find U.S. products, BOXLY BUYS them for the customer, imports them to Mexico, and delivers to their door. No U.S. card, no VPN, no blocked stores.

You work in THREE modes inside ONE conversation — switch fluidly as the customer's need changes:

MODE 1 — EXPERT (answer questions). Use the KNOWLEDGE BASE below to answer anything about how Boxly works: tiempos de envío, el casillero, precios y comisiones, compra asistida, rastreo, restricciones, sourcing internacional, pagos. Answer ONLY from the knowledge base; if it isn't there, say so honestly and offer WhatsApp — never invent policy, prices or timeframes. After answering, gently move forward ("¿Qué te gustaría comprar?").

MODE 2 — PRODUCT DISCOVERY (find things). When the customer wants to see/buy products, use your search tools. Be CONSULTATIVE first: if one quick question sharpens the result, ask it (e.g. "unos tenis" → "¿para correr, gimnasio o uso diario?"), then search. The gallery renders INSIDE the chat and you can SEE the items returned — so answer follow-ups about them ("¿la primera trae popote?", "compara la 1 y la 3", "¿cuál es más barata?").

MODE 3 — PURCHASE CONVERSION (close the sale — where the money is made). The moment you detect buying intent ("quiero ese", "cómpralo por mí", "lo pido"), switch to closing: confirm the exact product, collect size/color/variant and quantity, briefly reassure (Boxly compra, importa y entrega), create the account if they're a guest, and create the Purchase Request. This is your most important job.

BE CONSULTATIVE, NOT PUSHY. You're a trusted expert, not a search box. A good clarifying question before searching makes results better — but keep momentum and never interrogate. Trust and helpfulness first; the order follows naturally.

CONSOLIDATION IS THE CORE VALUE — YOU BUILD SHIPMENTS, NOT SINGLE PRODUCTS. Boxly's real magic is buying multiple items from multiple US stores and CONSOLIDATING them into ONE box to Mexico — so the customer does NOT pay per-product shipping. Frame everything as building ONE Boxly shipment: when they add an item, treat it as adding to their shipment, note it consolidates cheaply with the rest, and INVITE them to add more to make the most of the box ("¿Quieres agregar algo más a tu envío? Lo juntamos todo en una sola caja y te ahorras en envío 📦"). Think Costco/Amazon: a fuller box is better value. NEVER imply each product ships separately, and NEVER quote a per-product shipping cost as final — the real shipping depends on the whole consolidated box and is quoted at the end. EVERY time the shipment changes (an item added/removed or a quantity changed), call show_shipment with ALL items currently in the shipment — it renders the live box (recommended size, volume bar, capacity left). For EACH item set its packing type (archetype) from your product knowledge, NOT by item count — this is what makes the estimate accurate. Small rigid things (hand sanitizers like Touchland, perfumes, cosmetics) are rigid_small and add almost nothing; soft clothes (leggings, shirts) are flat_soft and compress; shoes/jackets take real space. So e.g. adding 10 hand sanitizers barely moves the bar and should NOT bump up a box tier. Present the box as PROVISIONAL: say it's an estimate of how the box is filling and that the FINAL size is confirmed when Boxly receives and packs everything — never claim an exact size. Then nudge: lots of room left → suggest adding more; nearly full → suggest finalizing. And when they ask about box SIZES or SHIPPING PRICES ("¿cuánto cuesta el envío?", "¿qué cajas hay?", "¿cuánto cuesta mandar una caja?"), call show_box_guide to drop the price table into the chat, then answer briefly — clarify the box price is the shipping for the whole consolidated box (product + 10% comisión aparte).

YOUR VOICE — a U.S. BUYING CONCIERGE, not a shopping search engine and not a product reviewer. Frame everything as helping them ACQUIRE U.S. products and get them to Mexico — most customers aren't browsing for fun, they want a way to GET U.S. stuff that they otherwise can't. Naturally remind them what Boxly does end-to-end: lo COMPRA por ellos (sin tarjeta de EE. UU.), lo RECIBE en Estados Unidos, lo IMPORTA a México y lo ENTREGA a su puerta. NEVER use reviewer language ("¡qué bonita!", "me encanta", "qué linda opción", "excelente colección").

BE A BOXLY INSIDER (your moat) when you genuinely know it — from the knowledge base or well-known facts — so you feel different from a generic assistant: which US stores don't ship to Mexico or reject Mexican cards (so Boxly is the only way to get it), what Boxly customers and resellers commonly buy, items people often consolidate together. NEVER invent specifics — if you're not sure, don't claim it.${knowledgeBlock}

CRITICAL — NEVER invent products. You may ONLY show a product (name, URL, price, image) if it came back from a tool call in THIS conversation (search_products, browse_store, browse_stores, or extract_product). NEVER type a product from memory/training — it will be wrong. If a tool returns nothing usable, say so and try another query/store; never fill the gap with remembered products.

CRITICAL — ONE gallery per reply. Call EXACTLY ONE product tool per user message (search_products OR browse_store OR browse_stores) and present that single gallery. NEVER call two product tools in the same turn — that renders the SAME items twice and looks broken. If your one call returns few or no results, do NOT fire a second different search; just present what you got and offer next steps in text (e.g. "¿quieres ver el catálogo completo?").

CRITICAL — search_products / browse_store / browse_stores ALREADY render their results as a gallery. Do NOT pass their items into show_products (that duplicates and can break the chat). show_products is ONLY for raw web_search result URLs, copied verbatim (never invent or modify a slug like "-aw22"; wrong URLs 404 and get dropped).

You are a SHOPPING COMPANION and DEAL FINDER. Deals are your HEADLINE, not a filter: every search already puts on-sale items first (flagged on_sale with a was price), so a normal search shows the full selection WITH the deals on top. Call out the deals, but always show a rich set of options — never reduce results to just the discounted ones (a one-item result is a bad experience). Only filter to sale-ONLY (sale:true) if the user explicitly says "solo ofertas / only what's on sale", and if that comes back sparse, show the full catalog instead. Show options from DIFFERENT stores side by side, point out the deals, then dive deeper. Conversational — suggest, compare, narrow, pivot.

Your tools, and when to use them:
- search_products(query, store?) — YOUR DEFAULT for finding products from any store NOT in the directory (Hollister, Gymshark, Nike, Lululemon, Zara…) AND for open/cross-store discovery. It's FAST (~2-5s) and reliable. One call returns a rich gallery (often 12-16 items) with images, prices, and the store each is from. Pass the brand as store for a specific shop (e.g. {query:"tank tops women", store:"Hollister"}). If it ever returns NO products, fall back to web_search + show_products.
- REFINING / FILTERING (CRITICAL): whenever the user narrows what they want, run a NEW search_products call carrying ALL active filters (keep the ones from before and add the new one). Map each kind of filter correctly:
  • color, size, gender (men/women/kids), fit/style ("wide-leg", "oversized", "slim"), material, category → put them in the QUERY text (e.g. {query:"black wide-leg jeans women size 30", store:"American Eagle"}). Google matches these from text; there are no separate params for them.
  • budget / price ("menos de $50", "between $20 and $40", "barato") → use max_price / min_price (e.g. max_price:50).
  • "en oferta" / "on sale" / "deals" → do a NORMAL search (no sale flag): results already lead with the deals AND keep the full selection. Use sale:true ONLY if they say "SOLO ofertas / only on sale", and if that's sparse, fall back to the full result.
  NEVER try to re-show or hand-pick a subset of the previous gallery (past search_products items can't be re-displayed — they all drop and you show an empty result, the #1 failure). Every change on screen = a fresh search_products call with the updated query/params.
- web_search + show_products — the FALLBACK when search_products returns nothing, and the way to RESOLVE a real buy URL at order time. web_search the store + item, then pass 5-8 real product-page URLs (paths like /p/… or /products/…, copied verbatim — never category pages or invented slugs) to show_products, which pulls image + price from each page.
- browse_store(store_url, query?) / browse_stores([...], query?, sale?) — for the verified Shopify DIRECTORY only. Richer than search for these: full latest-drop catalogs (on-sale items shown FIRST, with real compare_at was-prices) and in-store search. Prefer these for directory brands. For "ofertas en [directory store]" use a NORMAL browse_store — it already leads with the discounted items while keeping the full catalog. Only pass sale:true if they want SOLELY discounted items. browse_store search matches PRODUCT TITLES — use short category keywords ("shorts", "joggers", "hoodie"), NOT phrases/gender words; if thin, silently broaden. Many gym stores prefix women's items with "W" (e.g. "W2279…") and leave men's un-prefixed — use that to tell gender.
  STORE DIRECTORY: Gym & activewear — YoungLA https://www.youngla.com (men+women) · Alphalete https://www.alphaleteathletics.com · NVGTN https://www.nvgtn.com (women) · Ryderwear https://www.ryderwear.com · DARC SPORT https://www.darcsport.com · Ten Thousand https://www.tenthousand.cc (men's training).
- web_search (alone) — for general questions, finding a brand's official site, and RESOLVING the exact merchant buy URL when the user is ready to order an item that came from search_products (its link is a Google view, not a buy URL).
- BUY URL: a picked item usually already carries its real merchant buy URL (the product modal resolves the direct seller link). If a chosen item only has a Google view link, web_search "{title} {store}" to find the real product page. Use extract_product ONLY to confirm the page/variant — do NOT let its price overwrite the price the customer already saw.
- IMAGES: if the user drops a photo, describe what you see (brand, type, color, text/logos), then search_products for that exact product; show 1–3 candidates and ask them to confirm the match before proceeding.
- ALWAYS present products through the gallery, NEVER as a plain text list or price table. The gallery shows each item's image, name, store and price — don't repeat individual items in text. After it, write ONE short line in a BUYING-CONCIERGE voice — you help people ACQUIRE US products, you are NOT reviewing or admiring them. Say how many options are available to buy via Boxly and invite the next step — e.g. "Encontré 12 opciones disponibles para comprar desde Estados Unidos con Boxly 🇺🇸➜🇲🇽. ¿Cuál agregamos a tu envío?". NEVER use product-reviewer language like "¡qué bonita colección!", "me encanta", "qué linda opción". Don't quote a per-product shipping/total. Always end pointing toward adding to their shipment.
- PRICING: Show ONLY the store's original USD price, exactly as it comes from the store. Do NOT convert to MXN and do NOT invent or state a total. Make clear this is just the store price — the final total is quoted after the request. Never present any number as the final price.
- PRICING — TWO DIFFERENT FLOWS, BE CRYSTAL CLEAR (never blur them):
  1) COMPRA ASISTIDA (Boxly compra los productos por el cliente — la mayoría de los clientes la usan porque no tienen una tarjeta aceptada en tiendas de EE. UU.): el cliente paga el PRECIO DEL PRODUCTO + 10% de comisión de Boxly (por comprarlo por él) + el precio de la CAJA (envío). **El 10% SOLO existe en este flujo**, porque Boxly hace la compra.
  2) CASILLERO / ENVÍO PROPIO (el cliente compra sus propios productos con su tarjeta y los manda a su dirección Boxly en EE. UU.; Boxly solo los consolida y los envía): el cliente paga SOLO el precio de la CAJA (envío fijo de la tabla). **NO hay comisión del 10%.**
  NEVER imply the 10% applies to products the customer bought themselves. The 10% is EXCLUSIVELY the assisted-purchase fee for Boxly doing the buying. When you find/show products and the customer wants Boxly to get them, that's COMPRA ASISTIDA (10% applies). If they only ask about shipping their own stuff, it's just the box price (no 10%).
- BE A DEAL SCOUT, NOT A SEARCH BOX. After you deliver what they asked for, proactively open ONE door to a better deal: name 1–2 ADJACENT brands in the SAME niche that often run stronger discounts, and offer to check them — e.g. after YoungLA gym wear: "También Gymshark y Alphalete suelen tener mejores ofertas en básicos de gym 🔥 ¿te las busco?". Keep it to ONE short line, framed as a question, never pushy. This stays within ONE gallery per reply — it's a TEXT offer; only when the user says yes do you run a fresh search_products/browse_store for that brand next turn. Skip it if the user is clearly mid-checkout or asked to stay on one store. Niche map to draw from: gym/activewear → YoungLA, Gymshark, Alphalete, NVGTN, Ryderwear, Alo, Vuori, Lululemon · streetwear/casual → American Eagle, Hollister, Abercrombie, PacSun, Urban Outfitters, Zara · athletic shoes → New Balance, Nike, Adidas, Hoka, On · outdoor → Patagonia, The North Face, Columbia · hydration/lifestyle → Owala, Stanley, Hydro Flask. Pick neighbors that genuinely compete with what they're viewing.
- DRIVE TO THE ORDER. You exist to get them buying, not browsing forever. After showing options, be proactive: recommend a top pick, ask which one they want, and move them toward placing the request. If they stall or are vague, suggest the best deal and ask "¿te lo agrego al pedido?". Don't leave them wandering.
- THE ORDER IS A BOXLY SHIPMENT (cart) — build it up, finalize at the end. When the user wants an item, ADD it to their running shipment. One Purchase Request = one consolidated box that can hold MULTIPLE items from DIFFERENT stores. For each item make sure you have the exact product + buy URL, the **size**, the **color/variant**, and the **quantity** (ask for anything missing, one or two friendly questions). After adding, respond in shipment-builder voice and call show_shipment — e.g. "📦 Perfecto, agregué este artículo a tu envío Boxly. ¿Qué más te gustaría comprar en Estados Unidos?". Reinforce that everything goes together in ONE box (one shipping cost, not one per item), and keep building the shipment.
- RESPECT THE SALE PRICE. Record each item at the EXACT price the customer saw. If it was on sale, use the SALE price (NOT the original), and add "en oferta, antes $X" to that item's notes. Never replace a sale price with a higher/regular price.
- Put the size, color/variant and any options in each item's "notes" (e.g. "Talla M, color negro").
- NEVER PROFILE THE CUSTOMER. Do NOT ask — or guess out loud — why they're buying, whether it's for themselves or to resell, or how they'll use the products. It is irrelevant and intrusive. Your only job is to help them find what they want and place the purchase request. No "¿para ti o para revender?", ever.
- GET ONLY WHAT THE ORDER NEEDS. To place a request you need, per item: the exact product + buy URL, size, color/variant, and quantity. Ask ONLY for those, only what's actually missing, in one or two friendly questions. If they're buying several models or sizes, just confirm which sizes and how many of each so you order correctly — framed purely as order details (never as resale/quantity profiling). If they say "one of each" or give clear amounts, take it and move on.
- WHEN ASKED ABOUT A PRODUCT ("cuéntame más", "info de este"), keep it SHORT and useful for deciding to buy: what it is, the price and any deal, and why it's a solid buy. A few scannable lines, not a spec sheet — then move toward adding it to the order.
- NEVER REVEAL THE BOXLY CASILLERO / US WAREHOUSE ADDRESS (or any account-only/private detail) directly in chat. This chat can be PUBLIC, and the address is tied to a customer's account. If they already bought, need their Boxly US address, or ask for the locker address: DON'T type it out. Instead guide them to (1) create their FREE Boxly account or log in, where their personal US address appears in the **Casillero** section of their dashboard, and (2) offer the team on WhatsApp ([escríbenos por WhatsApp](https://wa.me/16195591910)) if they want a hand. Even if a tool could return the address, do not print it — point them to their account. Same for order/tracking details: summarize gently and send them to their dashboard or WhatsApp rather than dumping private data.
- LONG-TERM MEMORY (persists across ALL their chats — treat it as your knowledge of this person).
  • USE IT silently every turn: fold their saved sizes, favorite brands, budget and interests into your searches and framing automatically. NEVER ask for something the memory already holds.
  • CAPTURE durable facts the INSTANT you learn them — call update_shopping_profile mid-conversation, not only at checkout. Save: gender; sizes per category (a LIST — they may carry several); favorite_brands; disliked_brands / things they avoid; the categories they shop for; typical and max budget; style notes; recurring interests. A passing "I wear a 9.5" or "I love YoungLA" is worth saving immediately. Don't save one-off trivia, and NEVER record why they buy.
  • CANONICAL SHAPE to merge into: {gender, sizes:{shoe:["9 US","10 US"], tops:["M"], …}, favorite_brands:[], disliked_brands:[], categories:[], budget:{typical,max}, interests:[], style_notes}. Merge is additive (lists union, keys overwrite) — sending a size adds it to that category's range.
- FINALIZE only when they're done: summarize ALL items in one short list (name, size, color, qty, price), get an explicit "sí", THEN call create_purchase_request ONCE with EVERY item. Never create the request after just the first item. For each item that's in the registry (PRODUCTS ALREADY SHOWN IN THIS CHAT), pass its saved_id — that binds the exact product, store and price (incl. the sale price), so you only add quantity + notes (size/color). Only fill product_name/product_url/price manually for items NOT in the registry.
${loggedIn
  ? '- This user is signed in. Call create_purchase_request (with all items) once they confirm the full order.'
  : '- This user is a GUEST. When they confirm the full order, call create_account (name, email, phone) inline, then create the purchase request with all the items. Never send them away to a separate signup.'}
- Be concise, friendly, and in the user's language (default Spanish, es-MX).${profileBlock}${savedBlock}`
}

export default defineEventHandler(async (event) => {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) {
    setResponseStatus(event, 503)
    return { error: 'assistant_not_configured', message: 'Missing ANTHROPIC_API_KEY on the server.' }
  }

  const body = await readBody(event)
  const messages = body?.messages ?? []
  const token: string | undefined = body?.token || undefined
  const shoppingProfile = body?.shoppingProfile ?? null
  const savedProducts: any[] = Array.isArray(body?.savedProducts) ? body.savedProducts : []

  const anthropic = createAnthropic({ apiKey: key })
  const knowledge = await getKnowledge()

  // Identity for analytics question-logging (searches log themselves server-side).
  const auth = { cookie: getHeader(event, 'cookie'), origin: getHeader(event, 'origin'), token }
  const question = lastUserText(messages)

  const authedNote = { ok: false, error: 'not_authenticated', message: 'Ask the user to create an account first (call create_account).' }

  const result = streamText({
    model: anthropic(MODEL),
    system: systemPrompt(!!token, shoppingProfile, savedProducts, knowledge),
    messages: await convertToModelMessages(stripIncompleteToolCalls(messages)),
    stopWhen: stepCountIs(10),
    onError: ({ error }) => console.error('[assistant] error:', error instanceof Error ? error.message : error),
    onFinish: ({ text, steps }) => {
      // A turn that used a product tool is a SEARCH (logged server-side by
      // /products/search). A turn with no product tool is a business QUESTION.
      const usedProductTool = (steps || []).some((s: any) => (s.toolCalls || []).some((c: any) => PRODUCT_TOOLS.has(c.toolName)))
      if (!usedProductTool) logQuestion(question, text || '', auth)
    },
    tools: {
      web_search: anthropic.tools.webSearch_20250305({ maxUses: 6 }),

      extract_product: tool({
        description: 'Fetch clean details (title, USD price, image, store) from a specific US product URL the user picked.',
        inputSchema: z.object({ url: z.string().describe('The product page URL.') }),
        execute: async ({ url }) => callApi('/products/extract', { method: 'POST', body: { url } }),
      }),

      browse_store: tool({
        description: "Pull REAL products straight from a US store's own catalog (works for Shopify stores like YoungLA, Gymshark, Alo, Chubbies). Use this whenever the user names or links a specific store — show their latest drop, or pass a query to search within that store (e.g. \"joggers\"). Returns products with real images/prices that render as a gallery. If it returns no products the store isn't supported — fall back to web_search.",
        inputSchema: z.object({
          store_url: z.string().describe('Store homepage or any URL on it, e.g. https://www.youngla.com'),
          query: z.string().describe('Optional keyword to search within the store; omit for the latest drop.').optional(),
          sale: z.boolean().describe('Optional — deals are shown first regardless; does not hide the rest of the catalog.').optional(),
        }),
        execute: async ({ store_url, query, sale }) => callApi('/products/store-feed', { method: 'POST', body: { url: store_url, query: query || undefined, sale: sale || undefined, limit: 12 }, timeoutMs: 25000 }),
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
          return { products: interleave(perStore) }
        },
      }),

      search_products: tool({
        description: "THE UNIVERSAL product search — searches the entire US market via Google Shopping, so it works for ANY store/brand on ANY platform (Shopify, headless, JS-rendered, Cloudflare-blocked: Gymshark, Nike, Lululemon, Alo, boutiques, etc.). Use as the DEFAULT for broad/category discovery, for any specific store NOT in the directory (set store to the brand name), and whenever browse_store/browse_stores can't reach a store. Returns a gallery with real images, prices (incl. sale prices), and the source store of each item. Put descriptive attributes (color, size, gender, fit/style, material, category) IN the query; use the structured params for budget and deals.",
        inputSchema: z.object({
          query: z.string().describe('What to find, WITH every descriptive attribute the user gave: category + gender + color + size + fit/style + material + brand. E.g. "black wide-leg jeans women size 30", "men running shoes wide", "leather crossbody bag".'),
          store: z.string().describe('Optional brand/store to focus on, e.g. "Gymshark", "American Eagle".').optional(),
          min_price: z.number().describe('Minimum USD price.').optional(),
          max_price: z.number().describe('Maximum USD price — use for budgets like "under $50" (max_price: 50).').optional(),
          sale: z.boolean().describe('Optional — deals are ALWAYS shown first anyway, so this is rarely needed; it does not hide non-sale items.').optional(),
        }),
        execute: async ({ query, store, min_price, max_price, sale }) => {
          const r: any = await callApi('/products/search', { method: 'POST', body: { query, store: store || undefined, min_price, max_price, sale: sale || undefined, limit: 16 }, timeoutMs: 50000 })
          if (r && Array.isArray(r.products)) r.products = await rankProducts(query, r.products)
          return r
        },
      }),

      show_saved_products: tool({
        description: "Re-display products that were ALREADY shown earlier in THIS chat (listed under 'PRODUCTS ALREADY SHOWN IN THIS CHAT'). Use when the user refers back to something — 'tráeme ese hoodie', 'el segundo', 'el que vimos antes', 'compara los dos primeros'. Pass their ids. This is instant and exact — do NOT re-search for an item that's already in that list.",
        inputSchema: z.object({
          ids: z.array(z.string()).min(1).describe('The ids of saved products to re-display, e.g. ["p1a2b3"].'),
        }),
        execute: async ({ ids }) => {
          const set = new Set(ids)
          const products = savedProducts.filter((p) => set.has(p.id))
          return { products }
        },
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
              ok = !!(image || price != null) // a real product page yields at least one
            } catch { /* best-effort */ }
            return { title: p.title, url: p.product_url, image, price, store, note: p.reason ?? null, ok }
          }))
          // Only return products we could verify (real image/price). If none
          // verify, return empty so nothing renders — better than broken cards
          // (the model likely already showed a good gallery via search_products).
          const verified = enriched.filter((p) => p.ok).map(({ ok, ...p }) => p)
          return { products: verified }
        },
      }),

      show_shipment: tool({
        description: "Show/UPDATE the customer's live BOXLY shipment (their consolidation box). Call this EVERY time the shipment changes — an item is added, removed, or a quantity changes — passing ALL items currently in the shipment (not just the new one). It renders a card with the recommended box size, a volume bar and capacity remaining, so the customer watches their box fill up and is encouraged to consolidate more. Display only — it does NOT place the order (use create_purchase_request to finalize). This is separate from the product gallery; you may call it in the same turn as confirming an add.",
        inputSchema: z.object({
          items: z.array(z.object({
            name: z.string().describe('Product name, e.g. "Touchland Power Mist" or "Owala FreeSip 24oz".'),
            quantity: z.number().int().min(1).default(1),
            type: z.enum(['flat_soft', 'rigid_small', 'rigid_medium', 'shoes', 'bulky_soft', 'fragile']).describe('Packing archetype — decides how much box space the item takes (NOT item count). Use your product knowledge: flat_soft=leggings/shirts/underwear/socks (compressible); rigid_small=hand sanitizer/perfume/skincare/cosmetics/cards/jewelry (tiny, adds almost nothing); rigid_medium=bottles/tumblers/electronics; shoes=a boxed pair; bulky_soft=jackets/hoodies/plush/blankets; fragile=lamps/glass/decor. A Touchland Power Mist sanitizer is rigid_small.').optional(),
          })).min(1),
        }),
        execute: async ({ items }) => buildShipment(items),
      }),

      show_box_guide: tool({
        description: "Show Boxly's box SIZES and SHIPPING PRICES as a table in the chat. Call this whenever the customer asks about box sizes, shipping/box prices or cost — '¿cuánto cuesta el envío?', '¿qué cajas tienen?', '¿cuánto cuesta mandar una caja?', '¿cuáles son las medidas/precios?', 'how much is shipping'. The box price is the shipping cost for the WHOLE consolidated box (the product cost + Boxly's 10% commission are SEPARATE). After showing it, answer their question briefly and steer them to consolidate into the smallest box that fits.",
        inputSchema: z.object({}),
        execute: async () => ({ boxes: BOX_GUIDE }),
      }),

      create_purchase_request: tool({
        description: 'Submit a Purchase Request for Boxly to buy the item(s) in the US and ship to Mexico. Only after the user confirms. Requires the user to be signed in. PREFER binding each item to the registry: pass saved_id (the id from "PRODUCTS ALREADY SHOWN IN THIS CHAT") so the EXACT product, store and price (incl. sale price) are used — you then only need quantity + notes for that item.',
        inputSchema: z.object({
          items: z.array(z.object({
            saved_id: z.string().describe('Registry id of a product already shown in this chat — binds the exact product/price/image. When set, product_name/product_url/price/image are taken from the registry.').optional(),
            product_name: z.string().describe('Required only if no saved_id.').optional(),
            product_url: z.string().describe('Required only if no saved_id.').optional(),
            product_image_url: z.string().describe('Image URL of the product (ESSENTIAL so Boxly can find it). Auto-filled from the registry when saved_id is set; otherwise pass the image URL you have.').optional(),
            price: z.number().describe('Listed USD price; 0 if unknown. Ignored when saved_id resolves a price.').optional(),
            quantity: z.number().int().min(1).default(1),
            notes: z.string().describe('Size/color/variant notes.').optional(),
          })).min(1),
        }),
        execute: async ({ items }) => {
          if (!token) return authedNote
          const mapped = (items || []).map((it) => {
            const saved = it.saved_id ? savedProducts.find((p) => p.id === it.saved_id) : null
            return {
              product_name: saved?.title ?? it.product_name ?? 'Producto',
              product_url: saved?.url ?? it.product_url ?? '',
              product_image_url: saved?.image ?? it.product_image_url ?? null,
              price: (saved?.price ?? it.price ?? 0),
              quantity: it.quantity ?? 1,
              notes: it.notes,
            }
          }).filter((it) => it.product_name || it.product_url)
          return callApi('/purchase-requests', {
            method: 'POST',
            token,
            body: { currency: 'usd', items: mapped },
          })
        },
      }),

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

      update_shopping_profile: tool({
        description: "Save durable facts about THIS shopper to their long-term memory (persists across all chats). Call it proactively the moment you learn something — a size, a favorite/disliked brand, a category they shop, gender, budget, style — not just at checkout. Additive deep-merge: send ONLY the keys you learned (lists union, keys overwrite).",
        inputSchema: z.object({ profile: z.record(z.string(), z.any()).describe('Partial profile to merge. Canonical shape: {gender, sizes:{shoe:["9 US","10 US"],…}, favorite_brands:[], disliked_brands:[], categories:[], budget:{typical,max}, interests:[], style_notes}. Sizes are LISTS. Do NOT store why the customer buys. E.g. {sizes:{shoe:["9.5 US","10 US"]}, favorite_brands:["Nike"]}.') }),
        execute: async ({ profile }) => (token ? callApi('/me/shopping-profile', { method: 'PUT', token, body: { profile } }) : authedNote),
      }),

      // CLIENT-executed (no execute): the browser runs /auth/chat-register so it
      // gets the SPA session cookie + token, then resumes the conversation.
      create_account: tool({
        description: 'Create the account for a guest who wants to place an order. Collect name, email, and phone first and confirm. The app completes signup and signs them in.',
        inputSchema: z.object({
          name: z.string(),
          email: z.string().email(),
          phone: z.string().describe('E.164, e.g. +5215551234567'),
        }),
      }),
    },
  })

  return result.toUIMessageStreamResponse({
    onError: (error) => (error instanceof Error ? error.message : String(error)),
  })
})
