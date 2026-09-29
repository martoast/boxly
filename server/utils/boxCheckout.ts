// "Finalizar carrito" in the chat (Boxly Lab 2026-09-24; every shopper's since 2026-09-28). The box the shopper sees
// in the chat (the latest show_shipment card) becomes their Boxly cart — mirrored into each store's real cart as they
// shop (cart sync) — which is then finalized: a purchase request plus one live checkout quote per store, and the
// automatic invoice when every store is verified.
// Pure helpers (no network): which items the box holds, what each one is in cart terms, and how to make the
// API cart match. The tools in server/api/assistant.post.ts do the calls. Tested in boxCheckout.test.mjs.

const STORE_ID_RE = /^[a-z0-9][a-z0-9_-]{0,39}$/

export interface BoxItem { saved_id?: string, name?: string, quantity?: number, image?: string, price?: number, url?: string, size?: string, color?: string, options?: Record<string, string> }
export interface WantedItem {
  store_id: string
  store_name?: string
  product_url: string
  title: string
  image_url?: string
  price?: number
  quantity: number
  variants: Record<string, string>
  saved_id?: string
  /** Search to cart: the engine finds this product with the store's own search (product_url is then the store's site). */
  find?: string
}
export interface CartLine { id: number | string, product_url: string, quantity: number, variants?: Record<string, string> | null, sync_status?: string | null, saved_id?: string | null, title?: string | null, store_id?: string | null }
/** A store the agent can buy at: its id, display name and web host (catalog facets). */
export interface CarriedStore { id: string, name: string, host: string }
export interface CartPlan {
  add: WantedItem[]
  update: Array<{ id: number | string, body: { quantity?: number, variants?: Record<string, string> } }>
  remove: Array<number | string>
}

/** The box as the shopper last saw it: the items of the newest show_shipment card (a held last item is not in it). */
/**
 * The store's own option values, per product, from every box card so far (assistant.post.ts store_options) plus any
 * `extra` (the card being built now): the model's words ("negro", "S") are replaced by what the store calls them, and
 * an option the product page does not offer is dropped (live Gymshark 2026-09-28: "negro" on the black colourway's
 * page failed the store add). Pure.
 */
export function storeOptionFixes(messages: any[], extra: any[] = []): Map<string, any> {
  const fixes = new Map<string, any>()
  for (const m of messages || []) {
    for (const p of (m?.role === 'assistant' ? (m.parts || []) : [])) {
      if (p?.type !== 'tool-show_shipment' || p.state !== 'output-available') continue
      for (const o of Array.isArray(p.output?.store_options) ? p.output.store_options : []) if (o?.key) fixes.set(String(o.key), o)
    }
  }
  for (const o of extra || []) if (o?.key) fixes.set(String(o.key), o)
  return fixes
}
/** PURE. A box item with its store option values applied (see storeOptionFixes). */
export function withStoreOptions(it: BoxItem, fixes: Map<string, any>): BoxItem {
  const o = fixes.get(String((it as any).saved_id || (it as any).url || (it as any).name || ''))
  if (!o) return it
  const out: any = { ...it }
  if ('size' in o) { if (o.size) out.size = o.size; else delete out.size }
  if ('color' in o) { if (o.color) out.color = o.color; else delete out.color }
  if (o.options && typeof o.options === 'object' && Object.keys(o.options).length) out.options = { ...o.options }
  return out
}

export function boxFromMessages(messages: any[]): BoxItem[] | null {
  const fixes = storeOptionFixes(messages)
  const fixed = (it: BoxItem) => withStoreOptions(it, fixes)
  for (let i = (messages || []).length - 1; i >= 0; i--) {
    const parts = messages[i]?.role === 'assistant' ? (messages[i].parts || []) : []
    for (let j = parts.length - 1; j >= 0; j--) {
      const p = parts[j]
      if (p?.type !== 'tool-show_shipment' || p.state !== 'output-available') continue
      const items: BoxItem[] = (Array.isArray(p.input?.items) ? p.input.items : []).map(fixed)
      return p.output?.hold ? items.slice(0, -1) : items
    }
  }
  return null
}

const https = (v: any): string | null => {
  if (typeof v !== 'string' || !v.trim()) return null
  try {
    const u = new URL(v.trim())
    if (u.protocol === 'http:') u.protocol = 'https:'
    return u.protocol === 'https:' ? u.toString() : null
  } catch { return null }
}
const bare = (u: string) => String(u).split('#')[0].split('?')[0].replace(/\/+$/, '')
const sameName = (a: any, b: any) => a && b && String(a).trim().toLowerCase() === String(b).trim().toLowerCase()

/**
 * Each box item as a cart item, resolved through the chat's product registry (saved_id → url → name, as the box
 * card does). `unsupported` names what cannot go into a store cart: a web result with no catalog store.
 */
const words = (v: any) => String(v ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/[^a-z0-9]+/).filter(Boolean)

/**
 * SEARCH TO CART (2026-09-28): the carried store a web result's TITLE names first — "Owala FreeSip 24oz…" from an
 * outside seller is an Owala product, which the agent can find on owalalife.com with its own search. Only a title
 * that STARTS with the store's name (all its words, in order), so a store name mid-title never claims a product.
 * The longest matching name wins ("Coach Outlet" over "Coach"). Pure.
 */
export function carriedStoreForTitle(title: any, carried: CarriedStore[]): CarriedStore | null {
  const t = words(title)
  let best: CarriedStore | null = null, bestLen = 0
  for (const s of carried || []) {
    const n = words(s?.name)
    if (!n.length || n.length > t.length || !n.every((w, i) => t[i] === w)) continue
    if (n.length > bestLen) { best = s; bestLen = n.length }
  }
  return best
}

// ANY STORE (Alex 2026-09-28): a product on any shop's own site goes to that shop's real cart. Its store id IS its
// site ("www.hydroflask.com" -> "hydroflask-com") — the engine accepts exactly that (engine_service/web_store.mjs,
// same rules). Marketplaces are not a store's own checkout; they stay unsupported.
const NOT_A_STORE = /(?:^|\.)(?:amazon|ebay|google|bing|aliexpress|alibaba|temu|shein|wish|etsy|facebook|instagram|tiktok|pinterest|youtube|mercadolibre|walmart|target)\.[a-z.]+$/i
export function webStoreId(url: any): string | null {
  let host = ''
  try { const u = new URL(String(url)); if (u.protocol !== 'https:') return null; host = u.hostname.toLowerCase().replace(/^www\./, '') } catch { return null }
  if (!/^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(host) || !/\.[a-z]{2,}$/.test(host)) return null
  if (/(?:^|\.)(?:localhost|local|internal|lan|home|test|example|invalid)$/.test(host) || NOT_A_STORE.test(host)) return null
  const id = host.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return id.length >= 3 && id.length <= 40 ? id : null
}

export function wantedFromBox(box: BoxItem[], savedProducts: any[], carried: CarriedStore[] = []): { wanted: WantedItem[], unsupported: string[] } {
  const wanted: WantedItem[] = []
  const unsupported: string[] = []
  const reg = Array.isArray(savedProducts) ? savedProducts : []
  for (const it of box || []) {
    const saved = (it.saved_id ? reg.find((p: any) => p?.id === it.saved_id) : null)
      || (it.url ? reg.find((p: any) => p?.url && bare(p.url) === bare(String(it.url))) : null)
      || (it.name ? reg.find((p: any) => sameName(p?.title, it.name)) : null)
    const title = String(saved?.title || it.name || '').trim().slice(0, 300)
    const url = https(saved?.url || it.url)
    let storeId = typeof saved?.store_id === 'string' ? saved.store_id : ''
    let productUrl = url
    let find: string | undefined
    // A web result with no carried store, whose title names one: found on that store's own site by the agent.
    if (title && !STORE_ID_RE.test(storeId)) {
      const brand = carriedStoreForTitle(title, carried)
      if (brand && STORE_ID_RE.test(brand.id) && brand.host) {
        storeId = brand.id
        find = title
        // One line per product searched: the store's site, keyed by what is searched (the cart dedupes by url).
        productUrl = `https://${brand.host}/?boxly_find=${encodeURIComponent(words(title).join('-').slice(0, 80))}`
      }
    }
    // Any other shop's own product page: that shop's real cart (a web store).
    let webHost: string | null = null
    if (title && url && !STORE_ID_RE.test(storeId)) {
      const id = webStoreId(url)
      if (id) { storeId = id; try { webHost = new URL(url).hostname.replace(/^www\./, '') } catch {} }
    }
    if (!productUrl || !title || !STORE_ID_RE.test(storeId)) { unsupported.push(title || 'un producto'); continue }
    const variants: Record<string, string> = {}
    if (it.size && String(it.size).trim()) variants.size = String(it.size).trim().slice(0, 120)
    if (it.color && String(it.color).trim()) variants.color = String(it.color).trim().slice(0, 120)
    // Other options picked on the chips (width, length, fit…), as the store names them.
    for (const [k, v] of Object.entries((it as any).options || {})) if (k && typeof v === 'string' && v.trim() && !(k in variants) && Object.keys(variants).length < 8) variants[String(k).toLowerCase().slice(0, 40)] = v.trim().slice(0, 120)
    const w: WantedItem = { store_id: storeId, product_url: productUrl, title, quantity: Math.min(20, Math.max(1, Math.round(Number(it.quantity) || 1))), variants }
    if (find) { w.find = find; const brand = carriedStoreForTitle(title, carried); if (brand?.name) w.store_name = brand.name.slice(0, 120) }
    else if (saved?.store) w.store_name = String(saved.store).slice(0, 120)
    else if (webHost) w.store_name = webHost.slice(0, 120)
    const image = https(saved?.image || it.image)
    if (image) w.image_url = image
    const price = Number(saved?.price ?? it.price)
    if (Number.isFinite(price) && price > 0) w.price = price
    if (saved?.id) w.saved_id = String(saved.id).slice(0, 64)
    wanted.push(w)
  }
  return { wanted, unsupported }
}

const norm = (v: any) => String(v ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9.]+/g, '')

/**
 * What to do to the API cart so it holds exactly the box. The box wins. A cart line of the same product keeps
 * its own variants (a tap from the product modal carries the store's exact option names) unless the box names a
 * size/colour that line does not have; lines the box no longer holds are removed.
 */
export function planCart(cart: CartLine[], wanted: WantedItem[], opts: { retryUrl?: string | null } = {}): CartPlan {
  const plan: CartPlan = { add: [], update: [], remove: [] }
  const free = [...(cart || [])]
  for (const w of wanted) {
    const exact = free.findIndex((l) => l.product_url === w.product_url)
    // A found product's line carries the page the search found, not the box's search link: the product's own id
    // (saved_id) still names it, so it is not removed and re-added on every card.
    const bySaved = exact < 0 && w.saved_id ? free.findIndex((l) => l.saved_id && l.saved_id === w.saved_id) : -1
    // A web row often has no registry id (live Lab 2026-09-28: the Owala line was found, the next card re-added it
    // and the quote searched all over again): a searched item is the same line when the store and title match.
    const byTitle = exact < 0 && bySaved < 0 && w.find ? free.findIndex((l) => l.store_id === w.store_id && sameName(l.title, w.title)) : -1
    const at = exact >= 0 ? exact : bySaved >= 0 ? bySaved : byTitle >= 0 ? byTitle : free.findIndex((l) => bare(l.product_url) === bare(w.product_url))
    if (at < 0) { plan.add.push(w); continue }
    const line = free.splice(at, 1)[0]
    // The item the shopper just (re)picked, whose last try at the store failed: go again. Nothing else changed,
    // so without this the box and the cart agree and the agent is never asked (Gymshark M, 2026-09-25). Only
    // for the item being added this turn — every box card re-sends every item, and those must not re-run.
    if (opts.retryUrl && line.product_url === opts.retryUrl && ['failed', 'unavailable'].includes(String(line.sync_status))) {
      plan.remove.push(line.id); plan.add.push(w); continue
    }
    const have = Object.values(line.variants || {}).map(norm)
    const body: { quantity?: number, variants?: Record<string, string> } = {}
    if (Number(line.quantity) !== w.quantity) body.quantity = w.quantity
    if (Object.values(w.variants).some((v) => !have.includes(norm(v)))) body.variants = w.variants
    if (Object.keys(body).length) plan.update.push({ id: line.id, body })
  }
  plan.remove.push(...free.map((l) => l.id))
  return plan
}
