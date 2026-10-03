// The Boxly cart — server-persisted, ONE PER CHAT (Alex 2026-10-03: a new chat is a
// new order). State lives in useState so every component sees the same instance;
// the API is the source of truth and each call's answer replaces the local copy.
// `chat`: the open chat's id (its own cart), null for a new chat with no id yet (an
// empty cart, nothing fetched), undefined outside the chat (/app/cart, store pages:
// the API's most recently updated open cart). Pure rules: utils/boxlyCart.ts.
import { computed } from 'vue'
import { cartNeedsSyncPoll, emptyCart, normalizeCart, withQuantity, withoutItem, type Cart, type CartAddPayload, type CartItem } from '../utils/boxlyCart'

const errorMessage = (e: any, fallback: string) => e?.data?.message || fallback

export function useBoxlyCart() {
  const { $customFetch } = useNuxtApp() as any
  const cart = useState<Cart>('boxly-cart', () => emptyCart())
  const loaded = useState<boolean>('boxly-cart-loaded', () => false)
  const loading = useState<boolean>('boxly-cart-loading', () => false)
  const error = useState<string>('boxly-cart-error', () => '')
  // Units added but not yet confirmed by the server: the navbar count moves the moment the shopper taps.
  const pendingAdds = useState<number>('boxly-cart-pending', () => 0)
  const chat = useState<number | null | undefined>('boxly-cart-chat', () => undefined)
  const chatQuery = () => (typeof chat.value === 'number' ? { conversation_id: chat.value } : {})

  /** The chat whose cart this is (see above). A different chat replaces the cart at once and reloads it. */
  async function setChat(id: number | null | undefined) {
    const next = id == null ? id : Number(id)
    if (next === chat.value && loaded.value) return cart.value
    chat.value = next
    cart.value = emptyCart(); loaded.value = false
    return load({ force: true })
  }

  const count = computed(() => (cart.value?.item_count || 0) + pendingAdds.value)

  function apply(raw: any) { cart.value = normalizeCart(raw); loaded.value = true }

  async function load(opts: { force?: boolean } = {}) {
    if (!opts.force && (loading.value || loaded.value)) return cart.value   // forced: a chat switch must not wait on another chat's read
    if (chat.value === null) { apply(emptyCart()); return cart.value }   // a new chat: a clean slate, nothing to fetch
    const asked = chat.value
    loading.value = true; error.value = ''
    try {
      const r = await $customFetch('/cart', { query: chatQuery() })
      if (asked === chat.value) apply(r?.data)   // the shopper switched chats meanwhile: that answer is not this chat's
    } catch (e: any) {
      error.value = errorMessage(e, 'No pudimos cargar tu carrito.')
    } finally { loading.value = false }
    return cart.value
  }

  /** Adds a line (the server merges same url + same variants). Returns the created item, or throws. */
  async function add(payload: CartAddPayload): Promise<CartItem | null> {
    const qty = Math.max(1, Number(payload.quantity) || 1)
    pendingAdds.value += qty
    error.value = ''
    try {
      const r = await $customFetch('/cart/items', { method: 'POST', body: { ...chatQuery(), ...payload } })
      if (r?.data?.cart) apply(r.data.cart)
      if (cartNeedsSyncPoll(cart.value)) pollWhileSyncing()
      return r?.data?.item || null
    } catch (e: any) {
      error.value = errorMessage(e, 'No se pudo agregar a tu carrito.')
      throw e
    } finally { pendingAdds.value = Math.max(0, pendingAdds.value - qty) }
  }

  async function update(id: CartItem['id'], patch: { quantity?: number; variants?: Record<string, string> }) {
    const before = cart.value
    if (patch.quantity != null) cart.value = withQuantity(before, id, patch.quantity)
    error.value = ''
    try {
      const r = await $customFetch(`/cart/items/${id}`, { method: 'PATCH', body: patch })
      if (r?.data?.cart) apply(r.data.cart)
    } catch (e: any) {
      cart.value = before
      error.value = errorMessage(e, 'No se pudo actualizar el producto.')
      throw e
    }
  }

  async function remove(id: CartItem['id']) {
    const before = cart.value
    cart.value = withoutItem(before, id)
    error.value = ''
    try {
      const r = await $customFetch(`/cart/items/${id}`, { method: 'DELETE' })
      if (r?.data?.cart) apply(r.data.cart)
    } catch (e: any) {
      cart.value = before
      error.value = errorMessage(e, 'No se pudo quitar el producto.')
      throw e
    }
  }

  /** Turns the open cart into a purchase request. Returns {purchase_request_id, request_number}. */
  async function finalize(notes?: string): Promise<{ purchase_request_id: number | string; request_number: string }> {
    error.value = ''
    try {
      const r = await $customFetch('/cart/finalize', { method: 'POST', body: { ...chatQuery(), ...(notes ? { notes } : {}) } })
      const d = r?.data || {}
      apply(d.cart || emptyCart())
      return { purchase_request_id: d.purchase_request_id, request_number: d.request_number }
    } catch (e: any) {
      error.value = errorMessage(e, 'No se pudo finalizar tu pedido. Intenta de nuevo.')
      throw e
    }
  }

  // C3: while items are still reaching the real store carts, re-read the cart
  // every few seconds so the status chips move; stop when nothing is in flight.
  // One shared timer app-wide (the navbar and /app/cart both ask for it).
  const pollTimer = useState<any>('boxly-cart-poll', () => null)
  function pollWhileSyncing(intervalMs = 8000) {
    if (!import.meta.client || pollTimer.value) return
    pollTimer.value = setInterval(async () => {
      if (!cartNeedsSyncPoll(cart.value)) { stopPolling(); return }
      await load({ force: true })
    }, intervalMs)
  }
  function stopPolling() { if (pollTimer.value) { clearInterval(pollTimer.value); pollTimer.value = null } }

  return { cart, count, loaded, loading, error, chat, setChat, load, add, update, remove, finalize, pollWhileSyncing, stopPolling }
}
