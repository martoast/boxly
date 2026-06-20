// Cross-page shopping cart for the search-first flow. A single PURCHASE REQUEST
// is created from the whole cart at checkout. Module-level state = one shared
// cart across every component; persisted to localStorage so it survives refresh.
import { ref, computed, watch } from 'vue'

const KEY = 'boxly_cart_v1'
const items = ref([])
const open = ref(false) // cart drawer visibility (shared across pages)
let initialized = false

function lineKey(it) {
  return `${it.url || it.title || ''}|${it.variant || ''}`
}

export function useCart() {
  if (import.meta.client && !initialized) {
    initialized = true
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) items.value = JSON.parse(raw) || []
    } catch { /* ignore */ }
    watch(items, (v) => {
      try { localStorage.setItem(KEY, JSON.stringify(v)) } catch { /* ignore */ }
    }, { deep: true })
  }

  const count = computed(() => items.value.reduce((n, i) => n + (Number(i.quantity) || 1), 0))
  const subtotal = computed(() =>
    items.value.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0)
  )

  function add(item) {
    const key = lineKey(item)
    const existing = items.value.find((i) => lineKey(i) === key)
    if (existing) {
      existing.quantity = (Number(existing.quantity) || 1) + (Number(item.quantity) || 1)
    } else {
      items.value.push({ ...item, quantity: Number(item.quantity) || 1 })
    }
  }
  function remove(key) { items.value = items.value.filter((i) => lineKey(i) !== key) }
  function setQty(key, q) {
    const i = items.value.find((x) => lineKey(x) === key)
    if (i) i.quantity = Math.max(1, Number(q) || 1)
  }
  function clear() { items.value = [] }
  function openCart() { open.value = true }

  return { items, count, subtotal, add, remove, setQty, clear, lineKey, open, openCart }
}
