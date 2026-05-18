<template>
  <!-- Step 2: smart-search store picker. 163 Las Americas brands is too many
       for a scroll list; user types a brand name and we surface matches.
       Selected stores always visible as removable chips above search so
       customer can build a list without losing their selections. Pricing
       card sticks to the top so the running $10/store total is always in
       view as they pick. -->
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
      <!-- Pricing card -->
      <div class="relative rounded-2xl bg-gradient-to-br from-boxly-blue to-boxly-blue-500 text-white p-5 shadow-md overflow-hidden">
        <div class="absolute top-0 left-0 right-0 h-1 bg-boxly-yellow"></div>
        <div class="text-xs uppercase tracking-wider opacity-80 font-semibold">{{ t.pricingLabel }}</div>
        <div class="flex items-baseline gap-2 mt-1">
          <span class="text-3xl font-extrabold text-boxly-yellow">${{ totalServiceFee.toFixed(2) }}</span>
          <span class="text-sm opacity-80">USD</span>
        </div>
        <div class="text-sm opacity-90 mt-1">
          {{ selectedStoreIds.length }} × ${{ perStoreFee.toFixed(2) }} {{ t.perStore }}
        </div>
        <div class="mt-3 pt-3 border-t border-white/20 text-xs opacity-85">
          {{ t.plusFee.replace('{pct}', servicePct) }}
        </div>
      </div>

      <!-- Selected chips -->
      <div v-if="pickedStores.length > 0" class="bg-white rounded-2xl border border-gray-200 p-4">
        <div class="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">{{ t.selectedLabel }} ({{ pickedStores.length }})</div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="store in pickedStores"
            :key="store.id"
            type="button"
            @click="toggleStore(store.id)"
            class="inline-flex items-center gap-1.5 pl-3 pr-1 py-1 bg-boxly-blue-100 text-boxly-blue-800 rounded-full text-sm font-medium hover:bg-boxly-blue-200 transition-colors"
          >
            {{ store.name }}
            <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-boxly-blue-200 hover:bg-boxly-blue-300">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </span>
          </button>
        </div>
      </div>

      <!-- Search input -->
      <div class="bg-white rounded-2xl border border-gray-200 p-4 sticky top-2 z-10 shadow-sm">
        <label class="block">
          <span class="sr-only">{{ t.searchLabel }}</span>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
            <input
              v-model="query"
              type="text"
              :placeholder="t.searchPlaceholder.replace('{n}', String(stores.length))"
              class="pl-10 pr-10 w-full rounded-xl border-gray-300 focus:border-boxly-blue-500 focus:ring-boxly-blue-500 py-3 text-sm"
              autocomplete="off"
            >
            <button v-if="query" @click="query = ''" class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </label>
      </div>

      <!-- Results -->
      <div v-if="loading" class="text-center py-12 text-gray-500 text-sm">{{ t.loading }}</div>

      <div v-else-if="!query" class="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center">
        <div class="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </div>
        <p class="text-sm text-gray-600 font-medium">{{ t.emptyTitle }}</p>
        <p class="text-xs text-gray-400 mt-1">{{ t.emptyDesc.replace('{n}', String(stores.length)) }}</p>
      </div>

      <div v-else-if="filtered.length === 0" class="bg-white rounded-2xl border border-gray-200 p-6 text-center text-sm text-gray-500">
        {{ t.noMatches.replace('{q}', query) }}
      </div>

      <div v-else class="space-y-2">
        <button
          v-for="store in filtered.slice(0, 30)"
          :key="store.id"
          @click="toggleStore(store.id)"
          :class="[
            'w-full text-left bg-white rounded-xl border-2 p-3 flex items-center gap-3 transition-all',
            selectedStoreIds.includes(store.id) ? 'border-boxly-blue ring-2 ring-boxly-blue-100' : 'border-gray-200 hover:border-boxly-blue-300'
          ]"
        >
          <div class="w-11 h-11 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0" :style="{ background: store.logo_url ? '#f3f4f6' : initialBg(store.name) }">
            <img v-if="store.logo_url" :src="store.logo_url" :alt="store.name" class="w-full h-full object-contain p-1">
            <span v-else class="text-white font-bold text-base">{{ store.name.charAt(0).toUpperCase() }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-semibold text-gray-900 truncate">{{ store.name }}</div>
            <div v-if="store.description" class="text-xs text-gray-500 truncate">{{ store.description }}</div>
          </div>
          <div
            :class="[
              'w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0',
              selectedStoreIds.includes(store.id) ? 'bg-boxly-blue text-white' : 'border-2 border-gray-300'
            ]"
          >
            <svg v-if="selectedStoreIds.includes(store.id)" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
          </div>
        </button>
        <div v-if="filtered.length > 30" class="text-center text-xs text-gray-400 py-2">
          {{ t.refineHint.replace('{shown}', '30').replace('{total}', String(filtered.length)) }}
        </div>
      </div>
    </div>

    <div class="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 px-4 py-4 shadow-lg">
      <div class="max-w-3xl mx-auto">
        <NuxtLink
          v-if="selectedStoreIds.length > 0"
          to="/shop/in-person/details"
          class="w-full inline-flex items-center justify-center gap-2 py-3.5 bg-boxly-blue hover:bg-boxly-blue-700 text-white font-bold rounded-xl shadow-lg shadow-boxly-blue/30 hover:shadow-boxly-yellow/50 transition-all transition-colors"
        >
          {{ t.continue }}
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
        </NuxtLink>
        <button v-else disabled class="w-full py-3.5 bg-gray-300 text-white font-bold rounded-xl cursor-not-allowed">
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
  back:          { es: 'Volver', en: 'Back' },
  title:         { es: 'Elige las tiendas', en: 'Pick the stores' },
  subtitle:      { es: 'Busca la tienda que quieres visitar.', en: 'Search for the store you want us to visit.' },
  searchLabel:   { es: 'Buscar tienda', en: 'Search store' },
  searchPlaceholder: { es: 'Buscar entre {n} tiendas (Nike, Coach, Tommy…)', en: 'Search {n} stores (Nike, Coach, Tommy…)' },
  selectedLabel: { es: 'Seleccionadas', en: 'Selected' },
  pricingLabel:  { es: 'Cuota de servicio en persona', en: 'In-person service fee' },
  perStore:      { es: 'por tienda', en: 'per store' },
  plusFee:       { es: '+ {pct}% sobre el valor de la compra (se calcula después de la visita)', en: '+ {pct}% on the purchase value (calculated after the trip)' },
  loading:       { es: 'Cargando tiendas…', en: 'Loading stores…' },
  emptyTitle:    { es: 'Empieza a escribir para buscar', en: 'Start typing to search' },
  emptyDesc:     { es: 'Hay {n} tiendas disponibles en Las Américas Outlets.', en: '{n} stores available at Las Americas Outlets.' },
  noMatches:     { es: 'No encontramos resultados para "{q}".', en: 'No matches for "{q}".' },
  refineHint:    { es: 'Mostrando {shown} de {total} resultados — refina tu búsqueda para ver más.', en: 'Showing {shown} of {total} matches — refine your search to narrow down.' },
  continue:      { es: 'Continuar', en: 'Continue' },
  pickAtLeastOne:{ es: 'Elige al menos una tienda', en: 'Pick at least one store' },
})

const stepLabels = computed(() => [
  language.value === 'es' ? 'Fecha' : 'Date',
  language.value === 'es' ? 'Tiendas' : 'Stores',
  language.value === 'es' ? 'Detalles' : 'Details',
  language.value === 'es' ? 'Revisar' : 'Review',
])

const stores = ref([])
const perStoreFee = ref(10)
const servicePct = ref(8)
const loading = ref(true)
const query = ref('')

const totalServiceFee = computed(() => selectedStoreIds.value.length * perStoreFee.value)
const pickedStores = computed(() => stores.value.filter((s) => selectedStoreIds.value.includes(s.id)))

// Normalize for accent-insensitive match — search "calvin" should hit "Cálvin"
// if it ever shows up, and "h&m" should hit "H & M" without needing exact form.
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

// Deterministic colorful background for the letter-fallback so each
// brand looks distinct without needing a logo upload.
const PALETTE = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#10b981', '#06b6d4', '#3b82f6', '#a855f7']
function initialBg(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return PALETTE[hash % PALETTE.length]
}

onMounted(async () => {
  if (!selectedTrip.value) {
    router.replace('/shop/in-person')
    return
  }

  try {
    const res = await $customFetch('/shopping-trips/in-person-stores')
    stores.value = res?.data?.stores ?? []
    perStoreFee.value = res?.data?.per_store_fee_usd ?? 10
    servicePct.value = res?.data?.service_fee_percent ?? 8
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>
