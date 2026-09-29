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
    const k = storeKey(raw)
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
  return String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120).trim()
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
        const list = rows.slice(0, 12).map((r) => `${String(r.title || '').slice(0, 80)} (${r.store || r.store_id || ''}${r.price != null ? `, $${r.price}` : ''})`).join('; ')
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
