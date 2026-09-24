<template>
  <div class="bg-white rounded-2xl border border-gray-200 p-5">
    <div class="flex items-center justify-between gap-3 mb-1">
      <h3 class="font-bold text-gray-900">{{ t.title }}</h3>
      <span v-if="inFlight" class="inline-flex items-center gap-1.5 text-xs font-medium text-primary-700 bg-primary-50 px-2.5 py-1 rounded-full">
        <span class="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse"></span>{{ t.working }}
      </span>
    </div>
    <p class="text-sm text-gray-500 mb-4">{{ inFlight ? t.introWorking : t.intro }}</p>

    <ul class="divide-y divide-gray-100">
      <li v-for="q in quotes" :key="q.store_id" class="py-3">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="font-semibold text-gray-900 truncate">{{ q.store_name || q.store_id }}</div>
            <div class="text-xs mt-0.5" :class="statusClass(q)">{{ label(q) }}</div>
          </div>
          <div v-if="billable(q)" class="text-right shrink-0">
            <div class="font-bold text-gray-900">{{ formatCents(q.total_cents, q.currency) }}</div>
            <div class="text-[11px] text-gray-400">{{ t.storeTotal }}</div>
          </div>
        </div>
        <dl v-if="billable(q)" class="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
          <template v-for="row in storeQuoteRows(q, lang)" :key="row.label">
            <dt>{{ row.label }}</dt><dd class="text-right tabular-nums">{{ row.value }}</dd>
          </template>
        </dl>
        <div v-if="team && (q.evidence?.length || q.error_code)" class="mt-2 text-[11px] text-gray-500 bg-gray-50 rounded-lg p-2 space-y-0.5">
          <div v-if="q.error_code" class="text-red-600">{{ q.error_code }} · {{ t.attempts }} {{ q.attempts }}</div>
          <div v-for="(line, i) in q.evidence || []" :key="i">“{{ line }}”</div>
          <div v-if="q.observed_at" class="text-gray-400">{{ t.observed }} {{ new Date(q.observed_at).toLocaleString() }}</div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatCents, quoteInFlight, storeQuoteLabel, storeQuoteRows } from '~/utils/storeQuotes'

const props = defineProps({
  quotes: { type: Array, required: true },
  // The shopping team's view adds the evidence and failure codes.
  team: { type: Boolean, default: false },
})

const { t: createTranslations, language } = useLanguage()
const lang = computed(() => (language?.value === 'en' ? 'en' : 'es'))
const t = createTranslations({
  title:        { es: 'Totales reales por tienda', en: 'Real totals per store' },
  intro:        { es: 'Cada total viene del checkout de la tienda, con envío e impuestos a nuestra bodega en San Diego.', en: "Each total comes from the store's own checkout, with shipping and tax to our San Diego warehouse." },
  introWorking: { es: 'Estamos llevando tu carrito al checkout de cada tienda para obtener el total exacto. Tarda unos minutos por tienda.', en: "We're taking your cart to each store's checkout for the exact total. It takes a few minutes per store." },
  working:      { es: 'Calculando', en: 'Working' },
  storeTotal:   { es: 'total de la tienda', en: 'store total' },
  attempts:     { es: 'intentos', en: 'attempts' },
  observed:     { es: 'Visto', en: 'Seen' },
})

const inFlight = computed(() => props.quotes.some(quoteInFlight))
const billable = (q) => (q.status === 'verified' || q.status === 'partial') && typeof q.total_cents === 'number'
const label = (q) => storeQuoteLabel(q, lang.value)
const statusClass = (q) => ({
  'text-primary-600': quoteInFlight(q),
  'text-green-600': q.status === 'verified',
  'text-amber-600': q.status === 'partial',
  'text-gray-500': q.status === 'failed',
})
</script>
