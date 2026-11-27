// BOXLY LAB — THE LIVE STORE GALLERY (Alex, 2026-09-28: "the request the user makes goes straight to the computer
// use agent to search for their products and build the product gallery"). For a Lab member a product request starts
// an engine search session: the store(s) open in real browsers the shopper watches in the chat (the live card), the
// engine reads each store's OWN search results into cards, and the finished gallery lands in the conversation as a
// `tool-live_results` part (the API's ProcessLiveShoppingResultJob). No catalog, no SerpAPI on this path.
//
// Pure helpers shared by the assistant route (server/api/assistant.post.ts) and the chat (ShoppingAssistant.vue);
// tested in utils/liveGallery.test.mjs.

/** The part the API appends when an engine search session ends (products are ProductV1). */
export const LIVE_RESULTS_PART = 'tool-live_results'

export interface LiveStore { id: string; name: string; url?: string }

/** "New Balance" / "new-balance" / "NewBalance" / "Bath & Body Works" → one comparable key. */
export function storeKey(v: unknown): string {
  return String(v ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '')
}

/** Shoppers' shorthand for a live store (Karla 2026-11-12 "Sale de tenis para dama MK": "MK" was taken for a brand sold elsewhere). */
/** storeKey with shoppers' shorthand resolved ("MK" → "michaelkors"). */
export function liveStoreKey(v: unknown): string { const k = storeKey(v); return STORE_SHORTHAND[k] || k }
const STORE_SHORTHAND: Record<string, string> = { mk: 'michaelkors', vs: 'victoriassecret', bbw: 'bathandbodyworks', ae: 'americaneagle', nb: 'newbalance', tj: 'tjmaxx', tjmax: 'tjmaxx', nrack: 'nordstromrack' }

/** True when the shopper's brand IS one of the stores searched: no filter then (every card there is that brand, and titles often leave
 * it out). Matched by name OR id, like the own-store routing (lab 2026-11-23: brand "Alo" at "Alo Yoga" (id alo) filtered out all 10 cards). */
export function brandIsStore(brand: unknown, stores: LiveStore[]): boolean {
  const k = liveStoreKey(brand)
  // …and the store's LEADING words ("Coach" at "Coach Outlet", Andrea 2026-11-26: the filter kept 1 of 9 wallets — outlet titles
  // leave "Coach" out; "Alo" at "Alo Yoga"), whole words only ("On" is not "Old Navy")
  const words = (v: unknown) => String(v ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/&/g, 'and').split(/[^a-z0-9]+/).filter(Boolean)
  const b = words(brand)
  const leads = (name: unknown) => { const w = words(name); return b.length > 0 && b.length < w.length && b.every((x, i) => w[i] === x) }
  return !!k && stores.some((st) => liveStoreKey(st.name) === k || liveStoreKey(st.id) === k || leads(st.name) || leads(st.id))
}

/**
 * The stores a live gallery may open: each requested name or id matched against the ENGINE's store list (GET
 * /live-shopping/stores — the only stores a session can be created for), distinct, in request order, at most `max`
 * (the engine's advertised max_stores_per_session). What matched nothing is returned so the model can be told.
 */
export function resolveLiveStores(requested: unknown, catalog: LiveStore[], max: number): { stores: LiveStore[]; unknown: string[] } {
  const byKey = new Map<string, LiveStore>()
  for (const s of Array.isArray(catalog) ? catalog : []) {
    if (!s || typeof s.id !== 'string' || typeof s.name !== 'string') continue
    for (const k of [storeKey(s.id), storeKey(s.name)]) if (k && !byKey.has(k)) byKey.set(k, { id: s.id, name: s.name })
  }
  const stores: LiveStore[] = []
  const unknown: string[] = []
  const cap = Math.max(1, Math.min(4, Math.floor(Number(max) || 1)))
  for (const raw of Array.isArray(requested) ? requested : []) {
    const k0 = storeKey(raw)
    const k = STORE_SHORTHAND[k0] || k0
    if (!k) continue
    const hit = byKey.get(k) || byKey.get(k.replace(/(?:com|store|shop|official|usa|us)$/, ''))
    if (!hit) { unknown.push(String(raw).slice(0, 60)); continue }
    if (stores.some((s) => s.id === hit.id)) continue
    if (stores.length < cap) stores.push(hit)
  }
  return { stores, unknown }
}

/** What goes in the store's own search box: one short line of product words. */
export function liveGalleryQuery(v: unknown): string {
  // a spaced slash separates brands ("men Versace / Armani cologne"), never typed into a store's search box; "1/2 zip" keeps its own
  return String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+\/\s+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120).trim()
}

const usd = (m: any): number | null => (m && typeof m === 'object' && m.currency === 'USD' && typeof m.amount === 'number' && Number.isFinite(m.amount) && m.amount >= 0 ? m.amount : null)

/**
 * ProductV1 (the engine's frozen shape: current_price/list_price {amount, currency}) → the gallery row every chat
 * surface reads (title, url, image, price, was, on_sale, store, store_id) — what ProductGallery renders and what the
 * registry / add-to-box / Boxly cart bind (cartPayloadFromChatProduct needs store_id + url + title). USD only: a
 * figure in another currency is shown priceless rather than as a wrong dollar price. A row already in gallery shape
 * passes through unchanged.
 */
export function liveGalleryRows(products: unknown): any[] {
  const out: any[] = []
  for (const p of Array.isArray(products) ? products : []) {
    if (!p || typeof p !== 'object') continue
    const x: any = p
    if (!('current_price' in x) && !('list_price' in x)) { out.push(x); continue }
    const price = usd(x.current_price)
    const listed = usd(x.list_price)
    const was = listed !== null && price !== null && listed > price ? listed : null
    out.push({
      title: x.title, url: x.url, image: x.image ?? null,
      price, was, on_sale: was !== null,
      // A tile showing a price RANGE ("$37.00 - $180.00", Ulta sizes): the price is the low end, shown as "desde".
      ...(x.price_from === true ? { price_from: true } : {}),
      store: x.store ?? null, store_id: x.store_id ?? null,
      availability: x.availability ?? 'unknown',
      source: 'live',
    })
  }
  return out
}

/** A message's parts with every live-results part's products in gallery-row shape (history and fresh results alike). */
export function withLiveRows(parts: unknown): any[] {
  return (Array.isArray(parts) ? parts : []).map((p: any) => (p?.type === LIVE_RESULTS_PART && Array.isArray(p?.output?.products)
    ? { ...p, output: { ...p.output, products: liveGalleryRows(p.output.products) } }
    : p))
}

/**
 * For the MODEL: a live-results part is not a tool call it made (the API appended it; it has no toolCallId), so it is
 * replayed as one line of text naming what the gallery showed. The products themselves stay in the shopper's registry
 * (PRODUCTS ALREADY SHOWN, with their ids), which is how the model adds one to the box.
 */
export function liveResultsAsText(messages: any[]): any[] {
  return (messages || []).map((m: any) => {
    if (!Array.isArray(m?.parts) || !m.parts.some((p: any) => p?.type === LIVE_RESULTS_PART)) return m
    return {
      ...m,
      parts: m.parts.map((p: any) => {
        if (p?.type !== LIVE_RESULTS_PART) return p
        const rows = liveGalleryRows(p?.output?.products)
        if (!rows.length) return { type: 'text', text: '[Galería en vivo: la tienda no devolvió productos para esa búsqueda.]' }
        const list = rows.slice(0, 12).map((r) => `${String(r.title || '').slice(0, 80)} (${r.store || r.store_id || ''}${r.price != null ? `, ${r.price_from ? 'desde ' : ''}$${r.price}` : ''})`).join('; ')
        return { type: 'text', text: `[Galería en vivo mostrada en el chat — ${rows.length} productos leídos del sitio de la tienda: ${list}${rows.length > 12 ? '; …' : ''}. Están en PRODUCTS ALREADY SHOWN con sus ids.]` }
      }),
    }
  })
}

/** Server messages (GET /conversations/{id}) carrying live results that the chat does not show yet. */
export function newLiveResultMessages(serverMessages: unknown, shownIds: Set<string>): any[] {
  return (Array.isArray(serverMessages) ? serverMessages : []).filter((m: any) => m && !shownIds.has(String(m.id))
    && m.role === 'assistant' && Array.isArray(m?.content?.parts) && m.content.parts.some((p: any) => p?.type === LIVE_RESULTS_PART))
}

// "PROMOCIONES" IS ASKED, NEVER INHERITED (Miguel 2026-11-23: after "algunos con descuento" for Versace, his next ask "Valentino locion
// de roma" was still searched as deals only — 2 of 12 kept). on_sale stands when a shopper message since the last live search asks for
// deals, or the message is "Ver más" (the same search again).
const DEAL_RE = /\b(?:promo\w*|ofertas?|descuentos?|rebajas?|liquidaci\w*|remates?|sale|deals?|black\s*friday|cyber\s*monday|buen\s*fin|outlet|clearance|barat\w*|off)\b|%/i
const msgText = (m: any): string => typeof m?.content === 'string' ? m.content : Array.isArray(m?.parts) ? m.parts.filter((p: any) => p?.type === 'text').map((p: any) => p.text || '').join(' ') : ''
export function dealAskedSinceLastSearch(messages: any[]): boolean {
  const list = Array.isArray(messages) ? messages : []
  let i = list.length - 1
  const texts: string[] = []
  for (; i >= 0; i--) {
    const m = list[i]
    if (m?.role === 'assistant' && Array.isArray(m.parts) && m.parts.some((p: any) => p?.type === 'tool-live_gallery')) break
    if (m?.role === 'user') texts.push(msgText(m))
  }
  if (/^\s*ver m[aá]s\b/i.test(texts[0] || '')) return true
  return texts.some((t) => DEAL_RE.test(t))
}

// "LOCIÓN" IN MEXICO IS A FRAGRANCE (Miguel 2026-11-23: "Valentino locion de roma" was searched as "lotion" — body lotions): unless the
// shopper says it is for the body or hands, the store search gets "cologne".
export function fragranceQuery(query: string, messages: any[]): string {
  // the last few shopper messages ("Valentino locion de roma" … "Para hombres")
  const said = (Array.isArray(messages) ? messages : []).filter((m: any) => m?.role === 'user').slice(-3).map(msgText).join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  if (!/\blocion(?:es)?\b/.test(said) || /\b(?:corporal|cuerpo|body|manos|hand|crema|hidratante)\b/.test(said)) return query
  return String(query || '').replace(/\blotions?\b/gi, 'cologne')
}
