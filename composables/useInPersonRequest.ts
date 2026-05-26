// In-person shopping booking — state shared across the 3-step flow at
// /shop/in-person/*. Persisted to localStorage so a refresh mid-flow
// doesn't lose selections. Cleared on successful booking or "start over".

import { computed, ref } from 'vue'

export interface InPersonTrip {
  id: number
  location: string
  trip_date: string
  start_time: string | null
  end_time: string | null
  notes: string | null
}

// { [store_id]: [category_id, ...] }
export type StoreCategoryMap = Record<number, number[]>

interface PersistedState {
  selectedTrip: InPersonTrip | null
  selectedStoreIds: number[]
  storeCategoryMap: StoreCategoryMap
}

const STORAGE_KEY = 'boxly_in_person_booking_v1'

const selectedTrip      = ref<InPersonTrip | null>(null)
const selectedStoreIds  = ref<number[]>([])
const storeCategoryMap  = ref<StoreCategoryMap>({})

let initialized = false

function persist() {
  if (typeof window === 'undefined') return
  try {
    const payload: PersistedState = {
      selectedTrip:     selectedTrip.value,
      selectedStoreIds: selectedStoreIds.value,
      storeCategoryMap: storeCategoryMap.value,
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
    selectedTrip.value     = parsed.selectedTrip ?? null
    selectedStoreIds.value = parsed.selectedStoreIds ?? []
    storeCategoryMap.value = parsed.storeCategoryMap ?? {}
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
    trip:   selectedTrip.value !== null,
    stores: selectedStoreIds.value.length > 0,
  }))

  function setTrip(trip: InPersonTrip | null) {
    selectedTrip.value = trip
    persist()
  }

  function toggleStore(id: number) {
    const idx = selectedStoreIds.value.indexOf(id)
    if (idx >= 0) {
      selectedStoreIds.value.splice(idx, 1)
      // Drop that store's category prefs too.
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
    const idx     = current.indexOf(categoryId)
    const next    = idx >= 0
      ? current.filter((c) => c !== categoryId)
      : [...current, categoryId]
    storeCategoryMap.value = { ...storeCategoryMap.value, [storeId]: next }
    persist()
  }

  function categoriesForStore(storeId: number): number[] {
    return storeCategoryMap.value[storeId] ?? []
  }

  function reset() {
    selectedTrip.value     = null
    selectedStoreIds.value = []
    storeCategoryMap.value = {}
    if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY)
  }

  return {
    selectedTrip,
    selectedStoreIds,
    storeCategoryMap,
    stepsReady,
    setTrip,
    toggleStore,
    toggleStoreCategory,
    categoriesForStore,
    reset,
  }
}
