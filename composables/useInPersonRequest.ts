// In-person shopping request — state shared across the 4-step flow at
// /shop/in-person/*. Singleton like useStoreCart so all steps see the
// same values; persisted to localStorage so a refresh mid-flow doesn't
// nuke the customer's selections.
//
// Cleared on successful submit (or when the customer hits "start over").

import { computed, ref } from 'vue'

export interface InPersonWishlistItem {
  product_name: string
  product_url: string
  product_image_url: string
  notes: string
  options: Record<string, string>
  quantity: number
  // File handle + preview URL — File can't be JSON-serialized, so it's
  // dropped from localStorage. User would need to reattach after refresh.
  image: File | null
  imagePreview: string | null
}

export interface InPersonTrip {
  id: number
  location: string
  trip_date: string
  start_time: string | null
  end_time: string | null
  notes: string | null
}

export interface InPersonStore {
  id: number
  name: string
  slug: string
  logo_url: string | null
  description: string | null
}

// { [store_id]: [category_id, ...] } — what the customer wants us to
// look for at each store. Stored as plain object so it survives JSON
// round-tripping in localStorage. Backend persists the same shape into
// the `store_categories` JSON column on purchase_requests.
export type StoreCategoryMap = Record<number, number[]>

interface PersistedState {
  selectedTrip: InPersonTrip | null
  selectedStoreIds: number[]
  storeCategoryMap: StoreCategoryMap
  minimumBudgetUsd: number | null
  customerNotes: string
  // Wishlist persisted without image File — only metadata survives refresh.
  wishlist: Omit<InPersonWishlistItem, 'image'>[]
}

const STORAGE_KEY = 'boxly_in_person_request_v2'

const selectedTrip = ref<InPersonTrip | null>(null)
const selectedStoreIds = ref<number[]>([])
const storeCategoryMap = ref<StoreCategoryMap>({})
const minimumBudgetUsd = ref<number | null>(null)
const customerNotes = ref<string>('')
const wishlist = ref<InPersonWishlistItem[]>([])

let initialized = false

function persist() {
  if (typeof window === 'undefined') return
  try {
    const payload: PersistedState = {
      selectedTrip: selectedTrip.value,
      selectedStoreIds: selectedStoreIds.value,
      storeCategoryMap: storeCategoryMap.value,
      minimumBudgetUsd: minimumBudgetUsd.value,
      customerNotes: customerNotes.value,
      // Strip File handles before serialising — they can't round-trip.
      wishlist: wishlist.value.map(({ image, ...rest }) => rest),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {}
}

function rehydrate() {
  if (typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const parsed: PersistedState = JSON.parse(raw)
    selectedTrip.value = parsed.selectedTrip ?? null
    selectedStoreIds.value = parsed.selectedStoreIds ?? []
    storeCategoryMap.value = parsed.storeCategoryMap ?? {}
    minimumBudgetUsd.value = parsed.minimumBudgetUsd ?? null
    customerNotes.value = parsed.customerNotes ?? ''
    wishlist.value = (parsed.wishlist ?? []).map((w) => ({ ...w, image: null }))
  } catch {}
}

function initOnce() {
  if (initialized) return
  initialized = true
  rehydrate()
}

export function useInPersonRequest() {
  initOnce()

  const stepsReady = computed(() => ({
    trip: selectedTrip.value !== null,
    stores: selectedStoreIds.value.length > 0,
    details: minimumBudgetUsd.value !== null && minimumBudgetUsd.value > 0,
  }))

  function setTrip(trip: InPersonTrip | null) {
    selectedTrip.value = trip
    persist()
  }

  function toggleStore(id: number) {
    const idx = selectedStoreIds.value.indexOf(id)
    if (idx >= 0) {
      selectedStoreIds.value.splice(idx, 1)
      // Deselecting a store drops its category preferences too — they're
      // meaningless without the store.
      if (storeCategoryMap.value[id]) {
        const { [id]: _, ...rest } = storeCategoryMap.value
        storeCategoryMap.value = rest
      }
    } else {
      selectedStoreIds.value.push(id)
    }
    persist()
  }

  function toggleStoreCategory(storeId: number, categoryId: number) {
    const current = storeCategoryMap.value[storeId] ?? []
    const idx = current.indexOf(categoryId)
    const next = idx >= 0
      ? current.filter((c) => c !== categoryId)
      : [...current, categoryId]
    storeCategoryMap.value = { ...storeCategoryMap.value, [storeId]: next }
    persist()
  }

  function categoriesForStore(storeId: number): number[] {
    return storeCategoryMap.value[storeId] ?? []
  }

  function setBudget(value: number | null) {
    minimumBudgetUsd.value = value
    persist()
  }

  function setNotes(value: string) {
    customerNotes.value = value
    persist()
  }

  function addWishlistItem(item: InPersonWishlistItem) {
    wishlist.value.push(item)
    persist()
  }

  function removeWishlistItem(index: number) {
    wishlist.value.splice(index, 1)
    persist()
  }

  function reset() {
    selectedTrip.value = null
    selectedStoreIds.value = []
    storeCategoryMap.value = {}
    minimumBudgetUsd.value = null
    customerNotes.value = ''
    wishlist.value = []
    if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY)
  }

  return {
    selectedTrip,
    selectedStoreIds,
    storeCategoryMap,
    minimumBudgetUsd,
    customerNotes,
    wishlist,
    stepsReady,
    setTrip,
    toggleStore,
    toggleStoreCategory,
    categoriesForStore,
    setBudget,
    setNotes,
    addWishlistItem,
    removeWishlistItem,
    reset,
  }
}
