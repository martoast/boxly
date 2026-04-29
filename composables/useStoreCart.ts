// Boxly Store cart composable
// - Persists cart to localStorage (works for both guests and logged-in users)
// - Syncs across tabs via storage event
// - Computes box estimate based on (cart + open shipment) combined weight

import { computed, ref, watch } from 'vue'

export interface CartItem {
  product_id: number
  variant_id: number | null
  slug: string
  name: string
  price_cents: number
  weight_kg: number
  image_url: string | null
  size: string | null
  color: string | null
  quantity: number
}

export interface OpenOrderSummary {
  id: number
  order_number: string
  total_weight_kg: number
  item_count: number
}

// Bumped to v2 so old cart data (without variants) is dropped on first load
const STORAGE_KEY = 'boxly_store_cart_v2'

// Box thresholds — mirror BoxPricing.vue (landing page) exactly
export const BOX_TIERS = [
  { size: 'XS', weight: 8,  price_cents: 120000 },
  { size: 'S',  weight: 15, price_cents: 220000 },
  { size: 'M',  weight: 25, price_cents: 400000 },
  { size: 'L',  weight: 35, price_cents: 510000 },
  { size: 'XL', weight: 50, price_cents: 625000 },
] as const

// Singleton state — shared across all consumers of useStoreCart()
const items = ref<CartItem[]>([])
const openOrder = ref<OpenOrderSummary | null>(null)
let initialized = false

function persist() {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.value))
  } catch {}
}

function rehydrate() {
  if (typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) items.value = JSON.parse(raw)
  } catch {
    items.value = []
  }
}

function initOnce() {
  if (initialized) return
  initialized = true
  rehydrate()

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY) rehydrate()
    })
    // Persist on any change
    watch(items, () => persist(), { deep: true })
  }
}

export function useStoreCart() {
  initOnce()

  const totalItems = computed(() =>
    items.value.reduce((sum, item) => sum + item.quantity, 0)
  )

  const cartWeightKg = computed(() =>
    items.value.reduce((sum, item) => sum + item.weight_kg * item.quantity, 0)
  )

  const cartSubtotalCents = computed(() =>
    items.value.reduce((sum, item) => sum + item.price_cents * item.quantity, 0)
  )

  const openOrderWeightKg = computed(() => openOrder.value?.total_weight_kg ?? 0)

  const combinedWeightKg = computed(() => cartWeightKg.value + openOrderWeightKg.value)

  const estimatedBox = computed(() => {
    const w = combinedWeightKg.value
    if (w <= 0) return null
    if (w > 50) return 'over_50'
    return BOX_TIERS.find(t => w <= t.weight)?.size ?? null
  })

  const estimatedShippingCents = computed(() => {
    const box = estimatedBox.value
    if (!box || box === 'over_50') return null
    return BOX_TIERS.find(t => t.size === box)?.price_cents ?? null
  })

  const fillPercent = computed(() => {
    const box = estimatedBox.value
    if (!box || box === 'over_50') return 0
    const tier = BOX_TIERS.find(t => t.size === box)
    if (!tier) return 0
    return Math.min(100, Math.round((combinedWeightKg.value / tier.weight) * 100))
  })

  const nextBoxThresholdKg = computed(() => {
    const box = estimatedBox.value
    if (!box || box === 'over_50') return null
    const idx = BOX_TIERS.findIndex(t => t.size === box)
    if (idx < 0 || idx >= BOX_TIERS.length - 1) return null
    return BOX_TIERS[idx + 1].weight - combinedWeightKg.value
  })

  /** Compose a unique key for a cart line — different variants of the same product are separate lines. */
  function lineKey(productId: number, variantId: number | null): string {
    return `${productId}:${variantId ?? ''}`
  }

  function add(product: Omit<CartItem, 'quantity'>, qty: number = 1) {
    const existing = items.value.find(
      i => i.product_id === product.product_id && i.variant_id === product.variant_id
    )
    if (existing) {
      existing.quantity += qty
    } else {
      items.value.push({ ...product, quantity: qty })
    }
  }

  function setQuantity(productId: number, variantId: number | null, qty: number) {
    const idx = items.value.findIndex(
      i => i.product_id === productId && i.variant_id === variantId
    )
    if (idx < 0) return
    if (qty <= 0) {
      items.value.splice(idx, 1)
    } else {
      items.value[idx].quantity = qty
    }
  }

  function remove(productId: number, variantId: number | null = null) {
    const idx = items.value.findIndex(
      i => i.product_id === productId && i.variant_id === variantId
    )
    if (idx >= 0) items.value.splice(idx, 1)
  }

  function clear() {
    items.value = []
  }

  async function refreshOpenOrder() {
    const { $customFetch } = useNuxtApp()
    const userState = useState<any>('user')
    if (!userState.value) {
      openOrder.value = null
      return
    }
    try {
      const res: any = await $customFetch('/marketplace/orders/current')
      const order = res?.data
      if (!order) {
        openOrder.value = null
        return
      }
      const totalWeight = (order.items ?? []).reduce(
        (sum: number, it: any) => sum + Number(it.weight_kg_snapshot) * it.quantity,
        0
      )
      openOrder.value = {
        id: order.id,
        order_number: order.order_number,
        total_weight_kg: totalWeight,
        item_count: (order.items ?? []).reduce((s: number, i: any) => s + i.quantity, 0),
      }
    } catch {
      openOrder.value = null
    }
  }

  return {
    items,
    openOrder,
    totalItems,
    cartWeightKg,
    cartSubtotalCents,
    openOrderWeightKg,
    combinedWeightKg,
    estimatedBox,
    estimatedShippingCents,
    fillPercent,
    nextBoxThresholdKg,
    add,
    setQuantity,
    remove,
    clear,
    refreshOpenOrder,
    lineKey,
  }
}
