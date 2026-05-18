<template>
  <!-- Step 2: multi-select stores. Pricing card surfaces the $10/store
       service charge so the customer sees the running total before
       committing. 8% on the purchase is mentioned but not computed
       here — it's applied at quote time after the trip. -->
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

    <div class="max-w-3xl mx-auto px-4 py-6">
      <!-- Pricing card -->
      <div class="rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-5 mb-5 shadow-md">
        <div class="text-xs uppercase tracking-wider opacity-80 font-semibold">{{ t.pricingLabel }}</div>
        <div class="flex items-baseline gap-2 mt-1">
          <span class="text-3xl font-extrabold">${{ totalServiceFee.toFixed(2) }}</span>
          <span class="text-sm opacity-80">USD</span>
        </div>
        <div class="text-sm opacity-90 mt-1">
          {{ selectedStoreIds.length }} × ${{ perStoreFee.toFixed(2) }} {{ t.perStore }}
        </div>
        <div class="mt-3 pt-3 border-t border-white/20 text-xs opacity-85">
          {{ t.plusFee.replace('{pct}', servicePct) }}
        </div>
      </div>

      <div v-if="loading" class="text-center py-12 text-gray-500 text-sm">{{ t.loading }}</div>

      <div v-else-if="stores.length === 0" class="bg-white rounded-2xl border border-gray-200 p-6 text-center text-sm text-gray-500">
        {{ t.noStores }}
      </div>

      <div v-else class="space-y-2">
        <button
          v-for="store in stores"
          :key="store.id"
          @click="toggleStore(store.id)"
          :class="[
            'w-full text-left bg-white rounded-xl border-2 p-3 flex items-center gap-3 transition-all',
            selectedStoreIds.includes(store.id) ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-gray-200 hover:border-indigo-300'
          ]"
        >
          <div class="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
            <img v-if="store.logo_url" :src="store.logo_url" :alt="store.name" class="w-full h-full object-contain p-1">
            <svg v-else class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-semibold text-gray-900 truncate">{{ store.name }}</div>
            <div v-if="store.description" class="text-xs text-gray-500 truncate">{{ store.description }}</div>
          </div>
          <div
            :class="[
              'w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0',
              selectedStoreIds.includes(store.id) ? 'bg-indigo-600 text-white' : 'border-2 border-gray-300'
            ]"
          >
            <svg v-if="selectedStoreIds.includes(store.id)" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
          </div>
        </button>
      </div>
    </div>

    <div class="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 px-4 py-4 shadow-lg">
      <div class="max-w-3xl mx-auto">
        <NuxtLink
          v-if="selectedStoreIds.length > 0"
          to="/shop/in-person/details"
          class="w-full inline-flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors"
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
  subtitle:      { es: 'Visitaremos cada tienda que elijas.', en: "We'll visit every store you pick." },
  pricingLabel:  { es: 'Cuota de servicio en persona', en: 'In-person service fee' },
  perStore:      { es: 'por tienda', en: 'per store' },
  plusFee:       { es: '+ {pct}% sobre el valor de la compra (se calcula después de la visita)', en: '+ {pct}% on the purchase value (calculated after the trip)' },
  loading:       { es: 'Cargando tiendas…', en: 'Loading stores…' },
  noStores:      { es: 'No hay tiendas configuradas. Avísanos para agregar la tienda que necesitas.', en: "No stores configured yet. Let us know which store you need." },
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

const totalServiceFee = computed(() => selectedStoreIds.value.length * perStoreFee.value)

onMounted(async () => {
  // Customer might land here directly without a trip — bounce them back
  // to Step 1 rather than letting them assemble a half-state PR.
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
