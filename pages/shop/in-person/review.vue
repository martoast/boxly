<template>
  <!-- Step 4: final review + submit. POSTs FormData (so wishlist image
       File handles round-trip) to /purchase-requests/in-person and
       redirects to /shop/in-person/success?ref=PR-XX-XXXXX. -->
  <section class="min-h-screen bg-gray-50 pb-32">
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-3xl mx-auto px-4 py-5">
        <div class="flex items-start gap-3 mb-5">
          <NuxtLink to="/shop/in-person/details" class="p-2 -ml-2 hover:bg-gray-100 rounded-lg" :aria-label="t.back">
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          </NuxtLink>
          <div class="flex-1 min-w-0">
            <h1 class="text-xl font-bold text-gray-900">{{ t.title }}</h1>
            <p class="text-sm text-gray-500 mt-0.5">{{ t.subtitle }}</p>
          </div>
        </div>
        <InPersonStepper :current="4" :steps="stepLabels" />
      </div>
    </div>

    <div class="max-w-3xl mx-auto px-4 py-6 space-y-4">
      <!-- Trip -->
      <div class="bg-white rounded-2xl border border-gray-200 p-5">
        <div class="flex items-center justify-between gap-2 mb-3">
          <h3 class="text-sm font-semibold text-gray-900">{{ t.tripSection }}</h3>
          <NuxtLink to="/shop/in-person" class="text-xs text-boxly-blue font-medium hover:underline">{{ t.edit }}</NuxtLink>
        </div>
        <div class="text-base font-bold text-gray-900">{{ selectedTrip ? formatDate(selectedTrip.trip_date) : '—' }}</div>
        <div class="text-sm text-gray-500">{{ selectedTrip?.location }}</div>
      </div>

      <!-- Stores -->
      <div class="bg-white rounded-2xl border border-gray-200 p-5">
        <div class="flex items-center justify-between gap-2 mb-3">
          <h3 class="text-sm font-semibold text-gray-900">{{ t.storesSection }} <span class="text-gray-400">({{ selectedStoreIds.length }})</span></h3>
          <NuxtLink to="/shop/in-person/stores" class="text-xs text-boxly-blue font-medium hover:underline">{{ t.edit }}</NuxtLink>
        </div>
        <div v-if="storesLoading" class="text-sm text-gray-400">{{ t.loading }}</div>
        <div v-else class="flex flex-wrap gap-2">
          <span v-for="s in pickedStores" :key="s.id" class="px-3 py-1 bg-boxly-blue-50 text-boxly-blue-700 rounded-full text-xs font-medium">{{ s.name }}</span>
        </div>
      </div>

      <!-- Details -->
      <div class="bg-white rounded-2xl border border-gray-200 p-5">
        <div class="flex items-center justify-between gap-2 mb-3">
          <h3 class="text-sm font-semibold text-gray-900">{{ t.detailsSection }}</h3>
          <NuxtLink to="/shop/in-person/details" class="text-xs text-boxly-blue font-medium hover:underline">{{ t.edit }}</NuxtLink>
        </div>
        <dl class="text-sm space-y-2">
          <div class="flex justify-between">
            <dt class="text-gray-500">{{ t.budgetLabel }}</dt>
            <dd class="font-bold text-gray-900">${{ minimumBudgetUsd?.toFixed(2) }} USD</dd>
          </div>
          <div v-if="selectedCategoryIds.length > 0">
            <dt class="text-gray-500 mb-1">{{ t.categoriesLabel }}</dt>
            <dd class="flex flex-wrap gap-1.5">
              <span v-for="c in pickedCategories" :key="c.id" class="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">{{ c.name }}</span>
            </dd>
          </div>
          <div v-if="customerNotes" class="pt-2 border-t border-gray-100">
            <dt class="text-gray-500 mb-1">{{ t.notesLabel }}</dt>
            <dd class="text-gray-800 whitespace-pre-wrap text-sm">{{ customerNotes }}</dd>
          </div>
        </dl>
      </div>

      <!-- Wishlist -->
      <div v-if="wishlist.length > 0" class="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 class="text-sm font-semibold text-gray-900 mb-3">{{ t.wishlistSection }} <span class="text-gray-400">({{ wishlist.length }})</span></h3>
        <ul class="divide-y divide-gray-100">
          <li v-for="(item, i) in wishlist" :key="i" class="py-2 first:pt-0 last:pb-0">
            <div class="text-sm font-medium text-gray-900">{{ item.product_name }}</div>
            <div v-if="item.notes" class="text-xs text-gray-500 italic">"{{ item.notes }}"</div>
          </li>
        </ul>
      </div>

      <!-- Pricing -->
      <div class="relative rounded-2xl bg-gradient-to-br from-boxly-blue to-boxly-blue-500 text-white p-5 overflow-hidden">
        <div class="absolute top-0 left-0 right-0 h-1 bg-boxly-yellow"></div>
        <h3 class="text-sm font-semibold opacity-90 uppercase tracking-wider">{{ t.pricingSection }}</h3>
        <div class="mt-3 space-y-1.5 text-sm">
          <div class="flex justify-between"><span class="opacity-85">{{ selectedStoreIds.length }} × $10 {{ t.perStore }}</span><span class="font-bold text-boxly-yellow">${{ serviceFee.toFixed(2) }} USD</span></div>
          <div class="flex justify-between"><span class="opacity-85">{{ t.feePct }}</span><span class="opacity-85 italic">{{ t.afterTrip }}</span></div>
        </div>
        <div class="mt-3 pt-3 border-t border-white/20 text-xs opacity-85">
          {{ t.noPayNow }}
        </div>
      </div>
    </div>

    <div class="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 px-4 py-4 shadow-lg">
      <div class="max-w-3xl mx-auto">
        <button
          @click="submit"
          :disabled="submitting"
          class="w-full inline-flex items-center justify-center gap-2 py-4 bg-boxly-blue hover:bg-boxly-blue-700 text-white font-bold rounded-xl shadow-lg shadow-boxly-blue/30 hover:shadow-boxly-yellow/50 transition-all transition-colors disabled:opacity-60"
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
const {
  selectedTrip, selectedStoreIds, minimumBudgetUsd, customerNotes,
  selectedCategoryIds, wishlist,
} = useInPersonRequest()

const t = createTranslations({
  back:             { es: 'Volver', en: 'Back' },
  title:            { es: 'Revisa y envía', en: 'Review and submit' },
  subtitle:         { es: 'Confirma que todo está bien antes de agendar.', en: 'Make sure everything looks right before scheduling.' },
  edit:             { es: 'Editar', en: 'Edit' },
  tripSection:      { es: 'Fecha y lugar', en: 'Date and place' },
  storesSection:    { es: 'Tiendas a visitar', en: 'Stores to visit' },
  detailsSection:   { es: 'Detalles', en: 'Details' },
  wishlistSection:  { es: 'Tu lista de deseos', en: 'Your wishlist' },
  pricingSection:   { es: 'Tu cuenta', en: 'Your charges' },
  budgetLabel:      { es: 'Presupuesto', en: 'Budget' },
  categoriesLabel:  { es: 'Categorías', en: 'Categories' },
  notesLabel:       { es: 'Notas', en: 'Notes' },
  perStore:         { es: 'tiendas', en: 'stores' },
  feePct:           { es: '+ 8% sobre la compra', en: '+ 8% on the purchase' },
  afterTrip:        { es: 'Se calcula después', en: 'Calculated later' },
  noPayNow:         { es: 'No te cobramos nada al agendar. Después de la visita te enviamos la cuenta final.', en: "Nothing's charged when you schedule. After the trip we send you the final bill." },
  loading:          { es: 'Cargando…', en: 'Loading…' },
  submit:           { es: 'Agendar visita', en: 'Schedule visit' },
  submitting:       { es: 'Agendando…', en: 'Scheduling…' },
  errorMsg:         { es: 'Algo falló. Intenta de nuevo.', en: 'Something went wrong. Try again.' },
})

const stepLabels = computed(() => [
  language.value === 'es' ? 'Fecha' : 'Date',
  language.value === 'es' ? 'Tiendas' : 'Stores',
  language.value === 'es' ? 'Detalles' : 'Details',
  language.value === 'es' ? 'Revisar' : 'Review',
])

const allStores = ref([])
const allCategories = ref([])
const storesLoading = ref(true)
const submitting = ref(false)

const pickedStores = computed(() => allStores.value.filter((s) => selectedStoreIds.value.includes(s.id)))
const pickedCategories = computed(() => allCategories.value.filter((c) => selectedCategoryIds.value.includes(c.id)))
const serviceFee = computed(() => selectedStoreIds.value.length * 10)

function formatDate(date) {
  const datePart = String(date ?? '').substring(0, 10)
  const dt = new Date(datePart + 'T12:00')
  if (isNaN(dt.getTime())) return ''
  return dt.toLocaleDateString(language.value === 'es' ? 'es-MX' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

async function submit() {
  submitting.value = true
  try {
    const fd = new FormData()
    fd.append('shopping_trip_id', String(selectedTrip.value.id))
    fd.append('minimum_budget_usd', String(minimumBudgetUsd.value))
    if (customerNotes.value) fd.append('customer_notes', customerNotes.value)

    selectedStoreIds.value.forEach((id, i) => fd.append(`store_ids[${i}]`, String(id)))
    selectedCategoryIds.value.forEach((id, i) => fd.append(`category_ids[${i}]`, String(id)))

    wishlist.value.forEach((w, i) => {
      fd.append(`wishlist[${i}][product_name]`, w.product_name)
      if (w.product_url) fd.append(`wishlist[${i}][product_url]`, w.product_url)
      if (w.product_image_url) fd.append(`wishlist[${i}][product_image_url]`, w.product_image_url)
      if (w.notes) fd.append(`wishlist[${i}][notes]`, w.notes)
      if (w.quantity) fd.append(`wishlist[${i}][quantity]`, String(w.quantity))
      if (w.options && Object.keys(w.options).length > 0) fd.append(`wishlist[${i}][options]`, JSON.stringify(w.options))
      if (w.image) fd.append(`wishlist[${i}][image]`, w.image)
    })

    const res = await $customFetch('/purchase-requests/in-person', { method: 'POST', body: fd })
    const ref = res?.data?.request_number ?? null
    router.push(ref ? `/shop/in-person/success?ref=${encodeURIComponent(ref)}` : '/shop/in-person/success')
  } catch (e) {
    console.error(e)
    $toast.error(t.value.errorMsg)
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  if (!selectedTrip.value) return router.replace('/shop/in-person')
  if (selectedStoreIds.value.length === 0) return router.replace('/shop/in-person/stores')
  if (!minimumBudgetUsd.value) return router.replace('/shop/in-person/details')

  try {
    const [storesRes, catsRes] = await Promise.all([
      $customFetch('/shopping-trips/in-person-stores'),
      $customFetch('/categories'),
    ])
    allStores.value = storesRes?.data?.stores ?? []
    allCategories.value = catsRes?.data ?? catsRes ?? []
  } catch (e) {
    console.error(e)
  } finally {
    storesLoading.value = false
  }
})
</script>
