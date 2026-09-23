// The Boxly cart — pure helpers behind composables/useBoxlyCart.ts and /app/cart.
// The cart itself lives on the API (GET /cart, POST /cart/items, PATCH/DELETE
// /cart/items/{id}, POST /cart/finalize); nothing here talks to the network.
// Tested in utils/boxlyCart.test.mjs.

export const CART_STORE_ID_RE = /^[a-z0-9][a-z0-9_-]{0,39}$/
export const MAX_VARIANT_KEYS = 6
const MAX_VARIANT_KEY_CHARS = 40
const MAX_VARIANT_VALUE_CHARS = 120

export type CartSource = 'chat' | 'live' | 'extension'
export type SyncStatus = 'pending' | 'syncing' | 'in_store_cart' | 'unavailable' | 'failed'

export interface CartItem {
  id: number | string
  store_id: string
  store_name: string | null
  product_url: string
  title: string
  image_url: string | null
  price: number | null
  currency: string
  quantity: number
  variants: Record<string, string>
  source: CartSource | string
  saved_id: string | null
  sync_status: SyncStatus | string
  sync_note: string | null
  created_at?: string | null
  updated_at?: string | null
}
export interface CartStore { store_id: string; store_name: string | null; item_count: number; subtotal: number; has_unpriced?: boolean }
export interface Cart {
  id: number | string | null
  status: string
  conversation_id?: number | string | null
  items: CartItem[]
  stores: CartStore[]
  item_count: number
  subtotal: number
  has_unpriced?: boolean
  updated_at?: string | null
}
export interface CartAddPayload {
  store_id: string
  store_name?: string
  product_url: string
  title: string
  image_url?: string
  price?: number
  quantity?: number
  variants?: Record<string, string>
  source: CartSource
  saved_id?: string
  conversation_id?: number | string
}

export function emptyCart(): Cart {
  return { id: null, status: 'open', items: [], stores: [], item_count: 0, subtotal: 0, has_unpriced: false }
}

const num = (v: any): number | null => {
  if (typeof v === 'number') return Number.isFinite(v) && v >= 0 ? v : null
  if (typeof v === 'string' && v.trim()) {
    const n = Number(v.replace(/[$,\s]/g, '').replace(/usd$/i, ''))
    return Number.isFinite(n) && n >= 0 ? n : null
  }
  return null
}
const str = (v: any, max = 2048): string | null => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null)
const httpUrl = (v: any): string | null => {
  const s = str(v)
  if (!s) return null
  try { const u = new URL(s); return u.protocol === 'https:' || u.protocol === 'http:' ? s : null } catch { return null }
}

/** Variants as the API takes them: string→string, trimmed, keys lower-cased, empties dropped, at most 6 keys. */
export function normalizeVariants(v: any): Record<string, string> {
  const out: Record<string, string> = {}
  if (!v || typeof v !== 'object' || Array.isArray(v)) return out
  for (const [rawKey, rawVal] of Object.entries(v)) {
    if (Object.keys(out).length >= MAX_VARIANT_KEYS) break
    const key = String(rawKey).trim().toLowerCase().slice(0, MAX_VARIANT_KEY_CHARS)
    if (!key || key in out) continue
    const val = typeof rawVal === 'number' ? String(rawVal) : typeof rawVal === 'string' ? rawVal.trim() : ''
    if (!val) continue
    out[key] = val.slice(0, MAX_VARIANT_VALUE_CHARS)
  }
  return out
}

/** A chat product (gallery row / saved registry row / modal pick) → the add payload, or null when it cannot go
 *  into the Boxly cart yet (no catalog store slug — web rows from Google/Amazon — or no real product link). */
export function cartPayloadFromChatProduct(p: any, opts: { conversationId?: number | string | null } = {}): CartAddPayload | null {
  if (!p || typeof p !== 'object') return null
  const storeId = typeof p.store_id === 'string' ? p.store_id : ''
  if (!CART_STORE_ID_RE.test(storeId)) return null
  const url = httpUrl(p.product_url) || httpUrl(p.url)
  const title = str(p.title, 300) || str(p.name, 300)
  if (!url || !title) return null
  const payload: CartAddPayload = { store_id: storeId, product_url: url, title, source: 'chat', quantity: 1 }
  const storeName = str(p.store, 120)
  if (storeName) payload.store_name = storeName
  const image = httpUrl(p.image) || httpUrl(p.image_url)
  if (image) payload.image_url = image
  const price = num(p.price)
  if (price !== null) payload.price = price
  const variants = normalizeVariants(p.pick?.variants ?? p.variants)
  if (Object.keys(variants).length) payload.variants = variants
  const savedId = str(p.saved_id, 64) || str(p.id, 64)
  if (savedId) payload.saved_id = savedId
  if (opts.conversationId != null && opts.conversationId !== '') payload.conversation_id = opts.conversationId
  return payload
}

/** A live-store candidate (ProductV1) → the add payload. The route's store slug wins over the candidate's
 *  (the session was opened for that store); null when neither is a valid slug. */
export function cartPayloadFromCandidate(c: any, routeStoreId?: string | null): CartAddPayload | null {
  if (!c || typeof c !== 'object') return null
  const storeId = [routeStoreId, c.store_id].find((s) => typeof s === 'string' && CART_STORE_ID_RE.test(s)) as string | undefined
  const url = httpUrl(c.url)
  const title = str(c.title, 300)
  if (!storeId || !url || !title) return null
  const payload: CartAddPayload = { store_id: storeId, product_url: url, title, source: 'live', quantity: 1 }
  const storeName = str(c.store, 120)
  if (storeName) payload.store_name = storeName
  const image = httpUrl(c.image)
  if (image) payload.image_url = image
  const price = c.current_price && typeof c.current_price === 'object' ? num(c.current_price.amount) : null
  if (price !== null) payload.price = price
  return payload
}

/** The API's cart (or its {data} envelope) → a Cart with every field present. Never throws. */
export function normalizeCart(raw: any): Cart {
  const c = raw && typeof raw === 'object' && raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data) && 'items' in raw.data ? raw.data : raw
  if (!c || typeof c !== 'object') return emptyCart()
  const items: CartItem[] = (Array.isArray(c.items) ? c.items : []).filter((i: any) => i && typeof i === 'object' && i.id != null).map((i: any) => ({
    ...i,
    store_name: i.store_name ?? null,
    image_url: i.image_url ?? null,
    price: num(i.price),
    currency: i.currency || 'USD',
    quantity: Math.max(1, Number(i.quantity) || 1),
    variants: normalizeVariants(i.variants),
    saved_id: i.saved_id ?? null,
    sync_status: i.sync_status || 'pending',
    sync_note: i.sync_note ?? null,
  }))
  return {
    ...c,
    id: c.id ?? null,
    status: c.status || 'open',
    items,
    stores: Array.isArray(c.stores) ? c.stores : [],
    item_count: Number.isFinite(Number(c.item_count)) ? Number(c.item_count) : items.reduce((n, i) => n + i.quantity, 0),
    subtotal: num(c.subtotal) ?? 0,
    has_unpriced: typeof c.has_unpriced === 'boolean' ? c.has_unpriced : items.some((i) => i.price === null),
  }
}

export interface CartGroup { store_id: string; store_name: string; items: CartItem[]; item_count: number; subtotal: number; has_unpriced: boolean }

/** Items grouped by store for display, in the API's store order (then first appearance). The server's per-store
 *  totals are used when present; otherwise they are computed here. */
export function groupCartItems(cart: Pick<Cart, 'items' | 'stores'> | null | undefined): CartGroup[] {
  const items = cart?.items || []
  const stores = cart?.stores || []
  const order: string[] = []
  const byStore = new Map<string, CartItem[]>()
  for (const s of stores) if (s?.store_id && !byStore.has(s.store_id)) { byStore.set(s.store_id, []); order.push(s.store_id) }
  for (const it of items) {
    if (!byStore.has(it.store_id)) { byStore.set(it.store_id, []); order.push(it.store_id) }
    byStore.get(it.store_id)!.push(it)
  }
  return order.filter((id) => byStore.get(id)!.length).map((id) => {
    const list = byStore.get(id)!
    const s = stores.find((x) => x?.store_id === id)
    const computedUnpriced = list.some((i) => i.price === null)
    return {
      store_id: id,
      store_name: s?.store_name || list.find((i) => i.store_name)?.store_name || id,
      items: list,
      item_count: list.reduce((n, i) => n + i.quantity, 0),
      subtotal: num(s?.subtotal) ?? lineTotal(list),
      has_unpriced: typeof s?.has_unpriced === 'boolean' ? s.has_unpriced : computedUnpriced,
    }
  })
}

function lineTotal(list: CartItem[]): number {
  return Math.round(list.reduce((sum, i) => sum + (i.price ?? 0) * i.quantity, 0) * 100) / 100
}

/** The cart with one line's quantity changed (optimistic stepper); totals recomputed, per-store totals dropped
 *  so the display computes them until the server's answer replaces this. */
export function withQuantity(cart: Cart, id: CartItem['id'], quantity: number): Cart {
  const q = Math.max(1, Math.floor(Number(quantity) || 1))
  return recompute(cart, cart.items.map((i) => (i.id === id ? { ...i, quantity: q } : i)))
}
/** The cart without one line (optimistic remove). */
export function withoutItem(cart: Cart, id: CartItem['id']): Cart {
  return recompute(cart, cart.items.filter((i) => i.id !== id))
}
function recompute(cart: Cart, items: CartItem[]): Cart {
  return {
    ...cart, items, stores: [],
    item_count: items.reduce((n, i) => n + i.quantity, 0),
    subtotal: lineTotal(items),
    has_unpriced: items.some((i) => i.price === null),
  }
}

export const SYNC_STATUS: Record<SyncStatus, { label: string; tone: 'amber' | 'blue' | 'green' | 'red' }> = {
  pending: { label: 'Pendiente de agregar en la tienda', tone: 'amber' },
  syncing: { label: 'Agregando en la tienda…', tone: 'blue' },
  in_store_cart: { label: 'En el carrito de la tienda', tone: 'green' },
  unavailable: { label: 'No disponible en la tienda', tone: 'red' },
  failed: { label: 'No se pudo agregar en la tienda', tone: 'red' },
}
/** Spanish label + colour tone for an item's sync_status (an unknown status reads as pending). */
export function syncStatusLabel(status: string | null | undefined): { label: string; tone: 'amber' | 'blue' | 'green' | 'red' } {
  return (SYNC_STATUS as any)[status || ''] || SYNC_STATUS.pending
}

/** "Talla M · Color Negro" — variants for a cart line. */
const VARIANT_LABELS: Record<string, string> = { size: 'Talla', talla: 'Talla', color: 'Color', colour: 'Color', length: 'Largo', width: 'Ancho', capacity: 'Capacidad', scent: 'Aroma', pack: 'Paquete', material: 'Material' }
export function variantsText(v: Record<string, string> | null | undefined): string {
  return Object.entries(v || {}).map(([k, val]) => `${VARIANT_LABELS[k] || k.charAt(0).toUpperCase() + k.slice(1)} ${val}`).join(' · ')
}

export function formatUsd(n: number | null | undefined): string {
  if (typeof n !== 'number' || !Number.isFinite(n)) return ''
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`
}
