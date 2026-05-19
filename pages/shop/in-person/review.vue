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

    <div class="max-w-3xl mx-auto px-4 py-5 space-y-4">
      <!-- Trip -->
      <div class="bg-white rounded-2xl border border-gray-200 p-4">
        <div class="flex items-center justify-between gap-2 mb-2">
          <h3 class="text-xs uppercase tracking-wider text-gray-500 font-semibold">{{ t.tripSection }}</h3>
          <NuxtLink to="/shop/in-person" class="text-xs text-primary-600 font-medium hover:underline">{{ t.edit }}</NuxtLink>
        </div>
        <div class="text-base font-bold text-gray-900">{{ selectedTrip ? formatDate(selectedTrip.trip_date) : '—' }}</div>
        <div class="text-sm text-gray-500">{{ selectedTrip?.location }}</div>
      </div>

      <!-- Stores + per-store categories -->
      <div class="bg-white rounded-2xl border border-gray-200 p-4">
        <div class="flex items-center justify-between gap-2 mb-2">
          <h3 class="text-xs uppercase tracking-wider text-gray-500 font-semibold">{{ t.storesSection }} ({{ selectedStoreIds.length }})</h3>
          <NuxtLink to="/shop/in-person/stores" class="text-xs text-primary-600 font-medium hover:underline">{{ t.edit }}</NuxtLink>
        </div>
        <div v-if="loading" class="text-sm text-gray-400">{{ t.loading }}</div>
        <div v-else class="space-y-2">
          <div
            v-for="store in pickedStores"
            :key="store.id"
            class="border border-gray-200 rounded-lg p-3"
          >
            <div class="font-semibold text-gray-900 text-sm">{{ store.name }}</div>
            <div class="mt-1 text-xs">
              <template v-if="categoryNamesFor(store.id).length">
                <span
                  v-for="(name, i) in categoryNamesFor(store.id)"
                  :key="i"
                  class="inline-block mr-1 mt-0.5 px-2 py-0.5 bg-primary-50 text-primary-700 rounded"
                >{{ name }}</span>
              </template>
              <span v-else class="text-gray-400 italic">{{ t.anyCategory }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Budget + notes -->
      <div class="bg-white rounded-2xl border border-gray-200 p-4">
        <div class="flex items-center justify-between gap-2 mb-2">
          <h3 class="text-xs uppercase tracking-wider text-gray-500 font-semibold">{{ t.detailsSection }}</h3>
          <NuxtLink to="/shop/in-person/details" class="text-xs text-primary-600 font-medium hover:underline">{{ t.edit }}</NuxtLink>
        </div>
        <dl class="text-sm space-y-2">
          <div class="flex justify-between">
            <dt class="text-gray-500">{{ t.budgetLabel }}</dt>
            <dd class="font-bold text-gray-900">${{ minimumBudgetUsd?.toFixed(2) }} USD</dd>
          </div>
          <div v-if="customerNotes" class="pt-2 border-t border-gray-100">
            <dt class="text-gray-500 mb-1">{{ t.notesLabel }}</dt>
            <dd class="text-gray-800 whitespace-pre-wrap text-sm">{{ customerNotes }}</dd>
          </div>
        </dl>
      </div>

      <!-- Wishlist -->
      <div v-if="wishlist.length > 0" class="bg-white rounded-2xl border border-gray-200 p-4">
        <h3 class="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">{{ t.wishlistSection }} ({{ wishlist.length }})</h3>
        <ul class="divide-y divide-gray-100">
          <li v-for="(item, i) in wishlist" :key="i" class="py-2 first:pt-0 last:pb-0">
            <div class="text-sm font-medium text-gray-900">{{ item.product_name }}</div>
            <div v-if="item.notes" class="text-xs text-gray-500 italic">"{{ item.notes }}"</div>
          </li>
        </ul>
      </div>

      <!-- Pricing -->
      <div class="bg-primary-600 text-white rounded-xl p-4">
        <h3 class="text-[10px] uppercase tracking-wider opacity-75 font-semibold">{{ t.pricingSection }}</h3>
        <div class="mt-2 space-y-1.5 text-sm">
          <div class="flex justify-between"><span class="opacity-85">{{ selectedStoreIds.length }} × $10 {{ t.perStore }}</span><span class="font-bold">${{ serviceFee.toFixed(2) }} USD</span></div>
          <div class="flex justify-between"><span class="opacity-85">{{ t.feePct }}</span><span class="opacity-75 italic">{{ t.afterTrip }}</span></div>
        </div>
        <div class="mt-2.5 pt-2.5 border-t border-white/15 text-[11px] opacity-80 leading-snug">
          {{ t.noPayNow }}
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
const {
  selectedTrip, selectedStoreIds, storeCategoryMap, minimumBudgetUsd,
  customerNotes, wishlist,
} = useInPersonRequest()

const t = createTranslations({
  back:            { es: 'Volver', en: 'Back' },
  title:           { es: 'Revisa y envía', en: 'Review and submit' },
  subtitle:        { es: 'Confirma que todo está bien antes de agendar.', en: 'Make sure everything looks right before scheduling.' },
  edit:            { es: 'Editar', en: 'Edit' },
  tripSection:     { es: 'Fecha y lugar', en: 'Date and place' },
  storesSection:   { es: 'Tiendas y categorías', en: 'Stores and categories' },
  detailsSection:  { es: 'Detalles', en: 'Details' },
  wishlistSection: { es: 'Tu lista de deseos', en: 'Your wishlist' },
  pricingSection:  { es: 'Tu cuenta', en: 'Your charges' },
  budgetLabel:     { es: 'Presupuesto', en: 'Budget' },
  notesLabel:      { es: 'Notas', en: 'Notes' },
  anyCategory:     { es: 'Cualquier categoría', en: 'Any category' },
  perStore:        { es: 'tiendas', en: 'stores' },
  feePct:          { es: '+ 10% sobre la compra', en: '+ 10% on the purchase' },
  afterTrip:       { es: 'Se calcula después', en: 'Calculated later' },
  noPayNow:        { es: 'Pagas $10 USD por tienda al reservar. La compra y el envío se cobran al final.', en: 'You pay $10 USD per store to book. Merchandise + shipping billed after the trip.' },
  loading:         { es: 'Cargando…', en: 'Loading…' },
  submit:          { es: 'Pagar y reservar visita', en: 'Pay and book visit' },
  submitting:      { es: 'Redirigiendo al pago…', en: 'Redirecting to payment…' },
  cancelledToast:  { es: 'Cancelaste el pago. Tu reserva no quedó confirmada — intenta de nuevo.', en: 'Payment cancelled. Your booking was not confirmed — try again.' },
  errorMsg:        { es: 'Algo falló. Intenta de nuevo.', en: 'Something went wrong. Try again.' },
})

const stepLabels = computed(() => [
  language.value === 'es' ? 'Fecha' : 'Date',
  language.value === 'es' ? 'Tiendas' : 'Stores',
  language.value === 'es' ? 'Detalles' : 'Details',
  language.value === 'es' ? 'Revisar' : 'Review',
])

const allStores = ref([])
const categoryNameById = ref(new Map())
const loading = ref(true)
const submitting = ref(false)

const pickedStores = computed(() => allStores.value.filter((s) => selectedStoreIds.value.includes(s.id)))
const serviceFee = computed(() => selectedStoreIds.value.length * 10)

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
    const fd = new FormData()
    fd.append('shopping_trip_id', String(selectedTrip.value.id))
    fd.append('minimum_budget_usd', String(minimumBudgetUsd.value))
    if (customerNotes.value) fd.append('customer_notes', customerNotes.value)

    selectedStoreIds.value.forEach((id, i) => fd.append(`store_ids[${i}]`, String(id)))

    // store_categories[<storeId>][] — Laravel parses nested form keys into
    // an associative array exactly matching the backend's validation shape.
    for (const [storeId, catIds] of Object.entries(storeCategoryMap.value)) {
      if (!selectedStoreIds.value.includes(Number(storeId))) continue
      catIds.forEach((cid, i) => fd.append(`store_categories[${storeId}][${i}]`, String(cid)))
    }

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

    // Backend returns the Stripe Checkout URL — hand the customer over to
    // Stripe. Webhook independently flips the PR to pending_review when the
    // deposit clears; Stripe's success_url already points at /success.
    const checkoutUrl = res?.checkout_url
    if (checkoutUrl) {
      window.location.href = checkoutUrl
      return
    }

    // Defensive: if for some reason we didn't get a checkout URL but the PR
    // was created, fall through to the local success screen with the ref.
    const prRef = res?.data?.request_number ?? null
    router.push(prRef ? `/shop/in-person/success?ref=${encodeURIComponent(prRef)}` : '/shop/in-person/success')
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
  if (!minimumBudgetUsd.value) return router.replace('/shop/in-person/details')

  // Returning from Stripe's cancel_url — surface a soft toast and strip
  // the query param so a refresh doesn't keep re-toasting.
  if (route.query.cancelled === '1') {
    $toast.info(t.value.cancelledToast)
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
