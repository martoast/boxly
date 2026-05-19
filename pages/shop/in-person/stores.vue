<template>
  <!-- Step 2: store picker. Mobile-first card grid of popular brands by
       default, with search that switches to filtered results. Selected
       stores live as small chips above so the customer can keep track
       without losing them when they scroll the grid. -->
  <section class="min-h-screen bg-gray-50 pb-32">
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-3xl mx-auto px-4 py-5">
        <div class="flex items-start gap-3 mb-5">
          <NuxtLink to="/shop/in-person" class="p-2 -ml-2 hover:bg-gray-100 rounded-lg" :aria-label="t.back">
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          </NuxtLink>
          <div class="flex-1 min-w-0">
            <h1 class="text-xl font-bold text-gray-900">{{ t.title }}</h1>
            <p class="text-sm text-gray-500 mt-0.5">{{ t.subtitle }}</p>
          </div>
        </div>
        <InPersonStepper :current="2" :steps="stepLabels" />
      </div>
    </div>

    <div class="max-w-3xl mx-auto px-4 py-5 space-y-4">
      <!-- Compact pricing card -->
      <div class="bg-primary-600 text-white rounded-xl p-4">
        <div class="flex items-baseline justify-between gap-3">
          <div class="min-w-0">
            <div class="text-[10px] uppercase tracking-wider opacity-75 font-semibold">{{ t.pricingLabel }}</div>
            <div class="text-2xl font-bold mt-0.5">${{ totalServiceFee.toFixed(2) }}<span class="text-xs opacity-70 ml-1.5">USD</span></div>
          </div>
          <div class="text-right text-[11px] opacity-80 leading-tight flex-shrink-0">
            {{ selectedStoreIds.length }} {{ selectedStoreIds.length === 1 ? t.storeOne : t.storeMany }}<br>${{ perStoreFee.toFixed(0) }} {{ t.each }}
          </div>
        </div>
        <div class="text-[11px] opacity-75 mt-2.5 pt-2.5 border-t border-white/15 leading-snug">
          {{ t.plusFee.replace('{pct}', servicePct) }}
        </div>
      </div>

      <!-- Selected chips — only shown when at least one picked -->
      <div v-if="pickedStores.length > 0" class="flex flex-wrap gap-1.5">
        <button
          v-for="store in pickedStores"
          :key="store.id"
          type="button"
          @click="toggleStore(store.id)"
          class="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 bg-primary-50 text-primary-700 border border-primary-100 rounded-full text-xs font-medium hover:bg-primary-100 transition-colors"
        >
          {{ store.name }}
          <span class="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary-100">
            <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </span>
        </button>
      </div>

      <!-- Search input -->
      <div class="relative">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </div>
        <input
          v-model="query"
          type="text"
          :placeholder="t.searchPlaceholder.replace('{n}', String(stores.length))"
          class="pl-10 pr-10 w-full rounded-xl bg-white border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none py-3 text-sm shadow-sm"
          autocomplete="off"
        >
        <button v-if="query" @click="query = ''" class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <div v-if="loading" class="text-center py-10 text-gray-500 text-sm">{{ t.loading }}</div>

      <!-- Default state: suggested brands + see-all toggle -->
      <template v-else-if="!query">
        <div>
          <div class="flex items-center justify-between mb-2.5">
            <h3 class="text-xs uppercase tracking-wider text-gray-500 font-semibold">
              {{ showAll ? t.allStoresLabel.replace('{n}', String(stores.length)) : t.popularLabel }}
            </h3>
            <button
              type="button"
              @click="showAll = !showAll"
              class="text-xs font-medium text-primary-600 hover:text-primary-700"
            >{{ showAll ? t.showPopular : t.showAll.replace('{n}', String(stores.length)) }}</button>
          </div>
          <div class="grid grid-cols-2 gap-2.5">
            <InPersonStoreCard
              v-for="store in (showAll ? stores : suggested)"
              :key="store.id"
              :store="store"
              :selected="selectedStoreIds.includes(store.id)"
              @click="toggleStore(store.id)"
            />
          </div>
        </div>
      </template>

      <!-- Search results -->
      <template v-else>
        <div v-if="filtered.length === 0" class="bg-white rounded-xl border border-gray-200 p-6 text-center text-sm text-gray-500">
          {{ t.noMatches.replace('{q}', query) }}
        </div>
        <div v-else>
          <div class="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2.5">
            {{ t.resultsLabel.replace('{n}', String(filtered.length)) }}
          </div>
          <div class="grid grid-cols-2 gap-2.5">
            <InPersonStoreCard
              v-for="store in filtered.slice(0, 60)"
              :key="store.id"
              :store="store"
              :selected="selectedStoreIds.includes(store.id)"
              @click="toggleStore(store.id)"
            />
          </div>
          <div v-if="filtered.length > 60" class="text-center text-xs text-gray-400 py-2 mt-2">
            {{ t.refineHint.replace('{shown}', '60').replace('{total}', String(filtered.length)) }}
          </div>
        </div>
      </template>
    </div>

    <div class="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 px-4 py-3.5 shadow-[0_-4px_12px_rgba(0,0,0,0.04)]">
      <div class="max-w-3xl mx-auto">
        <NuxtLink
          v-if="selectedStoreIds.length > 0"
          to="/shop/in-person/details"
          class="w-full inline-flex items-center justify-center gap-2 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors"
        >
          {{ t.continue }} ({{ selectedStoreIds.length }})
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
        </NuxtLink>
        <button v-else disabled class="w-full py-3.5 bg-gray-100 text-gray-400 font-semibold rounded-xl cursor-not-allowed">
          {{ t.pickAtLeastOne }}
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

definePageMeta({
  layout: 'shop',
  middleware: ['auth', 'customer', 'complete-profile'],
})

const { $customFetch } = useNuxtApp()
const { t: createTranslations, language } = useLanguage()
const router = useRouter()
const { selectedTrip, selectedStoreIds, toggleStore } = useInPersonRequest()

const t = createTranslations({
  back:            { es: 'Volver', en: 'Back' },
  title:           { es: 'Elige las tiendas', en: 'Pick the stores' },
  subtitle:        { es: 'Busca o elige de las más populares.', en: 'Search or pick from the most popular.' },
  pricingLabel:    { es: 'Cuota de servicio en persona', en: 'In-person service fee' },
  storeOne:        { es: 'tienda', en: 'store' },
  storeMany:       { es: 'tiendas', en: 'stores' },
  each:            { es: 'c/u', en: 'each' },
  plusFee:         { es: '+ {pct}% sobre la compra (se calcula después de la visita)', en: '+ {pct}% on the purchase (calculated after the trip)' },
  searchPlaceholder:{ es: 'Buscar entre {n} tiendas…', en: 'Search {n} stores…' },
  loading:         { es: 'Cargando…', en: 'Loading…' },
  popularLabel:    { es: 'Más populares', en: 'Most popular' },
  allStoresLabel:  { es: 'Todas las tiendas ({n})', en: 'All stores ({n})' },
  showAll:         { es: 'Ver las {n}', en: 'See all {n}' },
  showPopular:     { es: 'Solo populares', en: 'Just popular' },
  resultsLabel:    { es: 'Resultados ({n})', en: 'Results ({n})' },
  noMatches:       { es: 'Sin resultados para "{q}".', en: 'No matches for "{q}".' },
  refineHint:      { es: 'Mostrando {shown} de {total}. Refina la búsqueda.', en: 'Showing {shown} of {total}. Refine your search.' },
  continue:        { es: 'Continuar', en: 'Continue' },
  pickAtLeastOne:  { es: 'Elige al menos una tienda', en: 'Pick at least one store' },
})

const stepLabels = computed(() => [
  language.value === 'es' ? 'Fecha' : 'Date',
  language.value === 'es' ? 'Tiendas' : 'Stores',
  language.value === 'es' ? 'Detalles' : 'Details',
  language.value === 'es' ? 'Revisar' : 'Review',
])

const stores = ref([])
const perStoreFee = ref(10)
const servicePct = ref(10)
const loading = ref(true)
const query = ref('')
const showAll = ref(false)

// Brand slugs that go in the "Most popular" default grid. Chosen for
// recognizability with Mexican expat shoppers — high-end casual,
// athletic, and luxury accessories. Filtered against the actual API
// response so an admin disabling a brand doesn't leave a dead card.
const POPULAR_SLUGS = [
  'nike-factory-store',
  'adidas-outlet-store',
  'coach-outlet',
  'michael-kors-outlet',
  'polo-ralph-lauren-factory-store',
  'tommy-hilfiger',
  'calvin-klein',
  'kate-spade-new-york-outlet',
]

const totalServiceFee = computed(() => selectedStoreIds.value.length * perStoreFee.value)
const pickedStores = computed(() => stores.value.filter((s) => selectedStoreIds.value.includes(s.id)))

const suggested = computed(() => {
  const bySlug = new Map(stores.value.map((s) => [s.slug, s]))
  return POPULAR_SLUGS.map((slug) => bySlug.get(slug)).filter(Boolean)
})

function normalize(s) {
  return (s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

const filtered = computed(() => {
  const q = normalize(query.value)
  if (!q) return []
  return stores.value.filter((s) => normalize(s.name).includes(q))
})

onMounted(async () => {
  if (!selectedTrip.value) {
    router.replace('/shop/in-person')
    return
  }

  try {
    const res = await $customFetch('/shopping-trips/in-person-stores')
    stores.value = res?.data?.stores ?? []
    perStoreFee.value = res?.data?.per_store_fee_usd ?? 10
    servicePct.value = res?.data?.service_fee_percent ?? 10
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>
