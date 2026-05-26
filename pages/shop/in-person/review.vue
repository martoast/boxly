<template>
  <!-- Step 3: Review selections + pay the $10/store deposit. -->
  <section class="min-h-screen bg-gray-50 pb-32">
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-3xl mx-auto px-4 py-5">
        <div class="flex items-start gap-3 mb-5">
          <NuxtLink to="/shop/in-person/stores" class="p-2 -ml-2 hover:bg-gray-100 rounded-lg" :aria-label="t.back">
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          </NuxtLink>
          <div class="flex-1 min-w-0">
            <h1 class="text-xl font-bold text-gray-900">{{ t.title }}</h1>
            <p class="text-sm text-gray-500 mt-0.5">{{ t.subtitle }}</p>
          </div>
        </div>
        <InPersonStepper :current="3" :steps="stepLabels" />
      </div>
    </div>

    <div class="max-w-3xl mx-auto px-4 py-5 space-y-4">

      <!-- Trip date -->
      <div class="bg-white rounded-2xl border border-gray-200 p-4">
        <div class="flex items-center justify-between gap-2 mb-2">
          <h3 class="text-xs uppercase tracking-wider text-gray-500 font-semibold">{{ t.tripSection }}</h3>
          <NuxtLink to="/shop/in-person" class="text-xs text-primary-600 font-medium hover:underline">{{ t.edit }}</NuxtLink>
        </div>
        <div class="text-base font-bold text-gray-900">{{ selectedTrip ? formatDate(selectedTrip.trip_date) : '—' }}</div>
        <div class="text-sm text-gray-500">{{ selectedTrip?.location }}</div>
      </div>

      <!-- Stores + categories -->
      <div class="bg-white rounded-2xl border border-gray-200 p-4">
        <div class="flex items-center justify-between gap-2 mb-2">
          <h3 class="text-xs uppercase tracking-wider text-gray-500 font-semibold">{{ t.storesSection }} ({{ selectedStoreIds.length }})</h3>
          <NuxtLink to="/shop/in-person/stores" class="text-xs text-primary-600 font-medium hover:underline">{{ t.edit }}</NuxtLink>
        </div>
        <div v-if="loading" class="text-sm text-gray-400">{{ t.loading }}</div>
        <div v-else class="space-y-2">
          <div v-for="store in pickedStores" :key="store.id" class="border border-gray-200 rounded-lg p-3">
            <div class="font-semibold text-gray-900 text-sm">{{ store.name }}</div>
            <div class="mt-1 text-xs flex flex-wrap gap-1">
              <template v-if="categoryNamesFor(store.id).length">
                <span v-for="(name, i) in categoryNamesFor(store.id)" :key="i" class="inline-block px-2 py-0.5 bg-primary-50 text-primary-700 rounded">{{ name }}</span>
              </template>
              <span v-else class="text-gray-400 italic">{{ t.anyCategory }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Pricing -->
      <div class="bg-primary-600 text-white rounded-xl p-4">
        <h3 class="text-[10px] uppercase tracking-wider opacity-75 font-semibold">{{ t.pricingSection }}</h3>
        <div class="mt-2 space-y-1.5 text-sm">
          <div class="flex justify-between">
            <span class="opacity-85">{{ selectedStoreIds.length }} {{ selectedStoreIds.length === 1 ? t.storeOne : t.storeMany }} × $10</span>
            <span class="font-bold">${{ serviceFee.toFixed(2) }} USD</span>
          </div>
        </div>
        <div class="mt-2.5 pt-2.5 border-t border-white/15 text-[11px] opacity-80 leading-snug">
          {{ t.noPayMore }}
        </div>
      </div>
    </div>

    <div class="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 px-4 py-3.5 shadow-[0_-4px_12px_rgba(0,0,0,0.04)]">
      <div class="max-w-3xl mx-auto">
        <button
          @click="submit"
          :disabled="submitting"
          class="w-full inline-flex items-center justify-center gap-2 py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-60"
        >
          <span v-if="submitting" class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          {{ submitting ? t.submitting : t.submit }}
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

const { $customFetch, $toast } = useNuxtApp()
const { t: createTranslations, language } = useLanguage()
const router = useRouter()
const { selectedTrip, selectedStoreIds, storeCategoryMap } = useInPersonRequest()

const t = createTranslations({
  back:         { es: 'Volver', en: 'Back' },
  title:        { es: 'Revisa y paga', en: 'Review and pay' },
  subtitle:     { es: 'Confirma que todo está bien antes de reservar.', en: 'Make sure everything looks right before booking.' },
  edit:         { es: 'Editar', en: 'Edit' },
  tripSection:  { es: 'Fecha y lugar', en: 'Date and place' },
  storesSection:{ es: 'Tiendas', en: 'Stores' },
  pricingSection:{ es: 'Tu reserva', en: 'Your booking' },
  anyCategory:  { es: 'Cualquier producto', en: 'Any product' },
  storeOne:     { es: 'tienda', en: 'store' },
  storeMany:    { es: 'tiendas', en: 'stores' },
  noPayMore:    { es: 'Solo pagas la reserva hoy. Nuestro equipo te contactará por WhatsApp para coordinar los detalles.', en: "You only pay the booking fee today. Our team will contact you on WhatsApp to coordinate the details." },
  loading:      { es: 'Cargando…', en: 'Loading…' },
  submit:       { es: 'Pagar y reservar', en: 'Pay and book' },
  submitting:   { es: 'Redirigiendo al pago…', en: 'Redirecting to payment…' },
  cancelled:    { es: 'Cancelaste el pago. Tu reserva no quedó confirmada — intenta de nuevo.', en: 'Payment cancelled. Your booking was not confirmed — try again.' },
  errorMsg:     { es: 'Algo falló. Intenta de nuevo.', en: 'Something went wrong. Try again.' },
})

const stepLabels = computed(() => [
  language.value === 'es' ? 'Fecha' : 'Date',
  language.value === 'es' ? 'Tiendas' : 'Stores',
  language.value === 'es' ? 'Pagar' : 'Pay',
])

const allStores          = ref([])
const categoryNameById   = ref(new Map())
const loading            = ref(true)
const submitting         = ref(false)

const pickedStores  = computed(() => allStores.value.filter((s) => selectedStoreIds.value.includes(s.id)))
const serviceFee    = computed(() => selectedStoreIds.value.length * 10)

function categoryNamesFor(storeId) {
  return (storeCategoryMap.value[storeId] ?? [])
    .map((id) => categoryNameById.value.get(id))
    .filter(Boolean)
}

function formatDate(date) {
  const datePart = String(date ?? '').substring(0, 10)
  const dt = new Date(datePart + 'T12:00')
  if (isNaN(dt.getTime())) return ''
  return dt.toLocaleDateString(language.value === 'es' ? 'es-MX' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

async function submit() {
  submitting.value = true
  try {
    const body = {
      shopping_trip_id: selectedTrip.value.id,
      store_ids: selectedStoreIds.value,
      store_categories: storeCategoryMap.value,
    }

    const res = await $customFetch('/shopping-trips/book', { method: 'POST', body })

    if (res?.checkout_url) {
      window.location.href = res.checkout_url
      return
    }

    // Fallback if no checkout URL returned
    router.push('/shop/in-person/success')
  } catch (e) {
    console.error(e)
    $toast.error(t.value.errorMsg)
    submitting.value = false
  }
}

const route = useRoute()

onMounted(async () => {
  if (!selectedTrip.value) return router.replace('/shop/in-person')
  if (selectedStoreIds.value.length === 0) return router.replace('/shop/in-person/stores')

  if (route.query.cancelled === '1') {
    $toast.info(t.value.cancelled)
    router.replace('/shop/in-person/review')
  }

  try {
    const [storesRes, catsRes] = await Promise.all([
      $customFetch('/shopping-trips/in-person-stores'),
      $customFetch('/store/categories'),
    ])
    allStores.value = storesRes?.data?.stores ?? []
    const cats = catsRes?.data ?? catsRes ?? []
    categoryNameById.value = new Map(cats.map((c) => [c.id, c.name]))
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>
