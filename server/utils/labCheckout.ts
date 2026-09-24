// Boxly Lab — "Finalizar carrito" in the chat (2026-09-24). The box the shopper sees in the chat (the latest
// show_shipment card) becomes their Boxly cart, which is then finalized: a purchase request plus one live
// checkout quote per store, and the automatic invoice when every store is verified.
// Pure helpers (no network): which items the box holds, what each one is in cart terms, and how to make the
// API cart match. The tool in server/api/assistant.post.ts does the calls. Tested in labCheckout.test.mjs.

const STORE_ID_RE = /^[a-z0-9][a-z0-9_-]{0,39}$/

export interface BoxItem { saved_id?: string, name?: string, quantity?: number, image?: string, price?: number, url?: string, size?: string, color?: string }
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
}
export interface CartLine { id: number | string, product_url: string, quantity: number, variants?: Record<string, string> | null }
export interface CartPlan {
  add: WantedItem[]
  update: Array<{ id: number | string, body: { quantity?: number, variants?: Record<string, string> } }>
  remove: Array<number | string>
}

/** The box as the shopper last saw it: the items of the newest show_shipment card (a held last item is not in it). */
export function boxFromMessages(messages: any[]): BoxItem[] | null {
  for (let i = (messages || []).length - 1; i >= 0; i--) {
    const parts = messages[i]?.role === 'assistant' ? (messages[i].parts || []) : []
    for (let j = parts.length - 1; j >= 0; j--) {
      const p = parts[j]
      if (p?.type !== 'tool-show_shipment' || p.state !== 'output-available') continue
      const items: BoxItem[] = Array.isArray(p.input?.items) ? p.input.items : []
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
export function wantedFromBox(box: BoxItem[], savedProducts: any[]): { wanted: WantedItem[], unsupported: string[] } {
  const wanted: WantedItem[] = []
  const unsupported: string[] = []
  const reg = Array.isArray(savedProducts) ? savedProducts : []
  for (const it of box || []) {
    const saved = (it.saved_id ? reg.find((p: any) => p?.id === it.saved_id) : null)
      || (it.url ? reg.find((p: any) => p?.url && bare(p.url) === bare(String(it.url))) : null)
      || (it.name ? reg.find((p: any) => sameName(p?.title, it.name)) : null)
    const title = String(saved?.title || it.name || '').trim().slice(0, 300)
    const url = https(saved?.url || it.url)
    const storeId = typeof saved?.store_id === 'string' ? saved.store_id : ''
    if (!url || !title || !STORE_ID_RE.test(storeId)) { unsupported.push(title || 'un producto'); continue }
    const variants: Record<string, string> = {}
    if (it.size && String(it.size).trim()) variants.size = String(it.size).trim().slice(0, 120)
    if (it.color && String(it.color).trim()) variants.color = String(it.color).trim().slice(0, 120)
    const w: WantedItem = { store_id: storeId, product_url: url, title, quantity: Math.min(20, Math.max(1, Math.round(Number(it.quantity) || 1))), variants }
    if (saved?.store) w.store_name = String(saved.store).slice(0, 120)
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
export function planCart(cart: CartLine[], wanted: WantedItem[]): CartPlan {
  const plan: CartPlan = { add: [], update: [], remove: [] }
  const free = [...(cart || [])]
  for (const w of wanted) {
    const exact = free.findIndex((l) => l.product_url === w.product_url)
    const at = exact >= 0 ? exact : free.findIndex((l) => bare(l.product_url) === bare(w.product_url))
    if (at < 0) { plan.add.push(w); continue }
    const line = free.splice(at, 1)[0]
    const have = Object.values(line.variants || {}).map(norm)
    const body: { quantity?: number, variants?: Record<string, string> } = {}
    if (Number(line.quantity) !== w.quantity) body.quantity = w.quantity
    if (Object.values(w.variants).some((v) => !have.includes(norm(v)))) body.variants = w.variants
    if (Object.keys(body).length) plan.update.push({ id: line.id, body })
  }
  plan.remove = free.map((l) => l.id)
  return plan
}
