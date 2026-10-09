<template>
  <section class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900">{{ t.hello }}{{ firstName ? `, ${firstName}` : '' }}</h1>
          <p class="text-sm text-gray-500 mt-1 first-letter:uppercase">{{ todayLabel }}</p>
        </div>
        <NuxtLink to="/app/shopping/map" class="inline-flex items-center gap-2 px-3 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-colors">
          <MapIcon class="w-5 h-5" />{{ t.map }}
        </NuxtLink>
      </div>

      <!-- 1. What needs her now — every card opens the list it counts -->
      <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{{ t.needsNow }}</h2>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <NuxtLink
          v-for="c in needCards"
          :key="c.key"
          :to="c.to"
          class="group bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-primary-200 hover:shadow transition"
        >
          <div class="flex items-start justify-between gap-2">
            <p class="text-sm font-semibold text-gray-700">{{ c.label }}</p>
            <component :is="c.icon" class="w-5 h-5 shrink-0" :class="c.count ? c.tone : 'text-gray-300'" />
          </div>
          <p class="text-3xl font-extrabold tabular-nums mt-2 leading-none" :class="c.count ? 'text-gray-900' : 'text-gray-300'">{{ dash ? '—' : c.count }}</p>
          <p v-if="c.note" class="text-xs text-amber-700 mt-2">{{ c.note }}</p>
          <p v-else class="text-xs text-gray-400 mt-2">{{ c.hint }}</p>
        </NuxtLink>
      </div>

      <!-- 2. Her numbers: today / week / month / year -->
      <div class="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide">{{ t.numbers }}</h2>
        <div class="inline-flex rounded-xl bg-gray-100 p-1">
          <button
            v-for="k in kinds"
            :key="k"
            type="button"
            class="px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
            :class="kind === k ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
            @click="kind = k"
          >{{ t[`period_${k}`] }}</button>
        </div>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div v-for="m in metricTiles" :key="m.key" class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">{{ m.label }}</p>
          <p class="text-3xl font-extrabold text-gray-900 tabular-nums mt-1 leading-none">{{ dash ? '—' : m.count }}</p>
        </div>
      </div>
      <p v-if="data?.health?.quotes_sent_30d" class="text-sm text-gray-500 mt-3 mb-8">
        {{ t.last30 }}:
        <b class="text-gray-800">{{ quotesIn(data.health.avg_hours_to_quote) }}</b> ·
        <b class="text-gray-800">{{ data.health.quote_conversion }}%</b> {{ t.quotesPaid }}
      </p>
      <div v-else class="mb-8" />

      <!-- 3. Her schedule: the hours she opened for in-person shopping, next 14 days -->
      <div class="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide">{{ t.schedule }}</h2>
        <NuxtLink to="/app/shopping/availability" class="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700">
          <CalendarDaysIcon class="w-4 h-4" />{{ t.editAvailability }}
        </NuxtLink>
      </div>
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
        <p v-if="!dash && !openDays.length" class="p-6 text-sm text-gray-500 text-center">
          {{ t.noHours }}
          <NuxtLink to="/app/shopping/availability" class="text-primary-600 font-semibold">{{ t.openHours }}</NuxtLink>
        </p>
        <NuxtLink
          v-for="d in openDays"
          :key="d.date"
          :to="`/app/shopping/availability?date=${d.date}`"
          class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 py-3 hover:bg-gray-50"
        >
          <div class="sm:w-40 shrink-0">
            <p class="text-sm font-semibold text-gray-900 first-letter:uppercase">{{ dayLabel(d.date) }}</p>
            <p class="text-xs text-gray-500">{{ bookedOf(d.booked, d.booked + d.open) }}</p>
          </div>
          <div class="flex flex-wrap gap-1.5">
            <span
              v-for="h in d.hours"
              :key="h.time"
              class="px-2 py-1 rounded-lg text-xs font-medium tabular-nums border"
              :class="h.booked ? 'bg-primary-50 border-primary-200 text-primary-700' : 'border-gray-200 text-gray-500'"
            >{{ h.time }}<template v-if="h.booked"> · {{ h.customer || t.booked }}</template></span>
          </div>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ClipboardDocumentListIcon, ClockIcon, ShoppingCartIcon, TruckIcon, CalendarDaysIcon, DocumentTextIcon, ArrowUturnLeftIcon, MapIcon } from '@heroicons/vue/24/outline'
import { warehouseDay, periodOf, formatDay } from '~/utils/warehouseTime'

/**
 * The shopping manager's dashboard (Velonie): what needs her now, her numbers for today / week /
 * month / year, and her in-person schedule — the hours she opened and who booked them. Counts only.
 * Data: /shopping/dashboard (one request; the per-day counts are summed per period here).
 */
definePageMeta({ layout: 'shopping', middleware: ['auth', 'shopping'] })
useHead({ title: 'Mi panel — Boxly' })

const { $customFetch } = useNuxtApp()
const { t: createTranslations, language } = useLanguage()
const user = useState('user')

const t = createTranslations({
  hello: { es: 'Hola', en: 'Hi' },
  map: { es: 'Mapa de clientes', en: 'Customer map' },
  needsNow: { es: 'Lo que necesita tu atención', en: 'Needs your attention' },
  numbers: { es: 'Tus números', en: 'Your numbers' },
  schedule: { es: 'Tu horario de compras en persona', en: 'Your in-person schedule' },
  editAvailability: { es: 'Editar mi disponibilidad', en: 'Edit my availability' },
  noHours: { es: 'No tienes horas abiertas en las próximas 2 semanas.', en: 'No open hours in the next 2 weeks.' },
  openHours: { es: 'Abrir horas', en: 'Open hours' },
  booked: { es: 'reservada', en: 'booked' },
  period_day: { es: 'Hoy', en: 'Today' },
  period_week: { es: 'Semana', en: 'Week' },
  period_month: { es: 'Mes', en: 'Month' },
  period_year: { es: 'Año', en: 'Year' },
  last30: { es: 'Últimos 30 días', en: 'Last 30 days' },
  quotesPaid: { es: 'de las cotizaciones se pagaron', en: 'of quotes got paid' },
})
// sentences with numbers in them (the translation helper only does fixed strings)
const es = computed(() => language.value !== 'en')
const L = computed(() => (es.value ? 'es-MX' : 'en-US'))
const quotesIn = (h) => (es.value ? `cotizas en ${h} h en promedio` : `you quote in ${h} h on average`)
const bookedOf = (b, total) => (es.value ? `${b} de ${total} reservadas` : `${b} of ${total} booked`)

const firstName = computed(() => (user.value?.name || '').split(' ')[0])
const today = warehouseDay()
const todayLabel = computed(() => formatDay(today, L.value, { weekday: 'long', day: 'numeric', month: 'long' }))
const dayLabel = (d) => (d === today ? (es.value ? 'Hoy' : 'Today') : formatDay(d, L.value, { weekday: 'short', day: 'numeric', month: 'short' }))

const data = ref(null)
const dash = computed(() => !data.value)
const kinds = ['day', 'week', 'month', 'year']
const kind = ref('day')

const fetchDashboard = async () => {
  const since = [periodOf('week', today).since, periodOf('year', today).since].sort((a, b) => a - b)[0]
  try {
    data.value = (await $customFetch('/shopping/dashboard', { query: { since: since.toISOString(), until: periodOf('day', today).until.toISOString() } })).data
  } catch (e) {
    console.error('shopping dashboard', e)
  }
}
onMounted(fetchDashboard)

const n = computed(() => data.value?.needs_now || {})
const needCards = computed(() => {
  const S = es.value
  return [
    { key: 'quote', label: S ? 'Por cotizar' : 'To quote', count: n.value.to_quote, icon: ClipboardDocumentListIcon, tone: 'text-primary-500',
      hint: S ? 'Solicitudes nuevas' : 'New requests', to: '/app/shopping/purchase-requests?status=pending_review' },
    { key: 'pay', label: S ? 'Esperando pago' : 'Waiting for payment', count: n.value.awaiting_payment, icon: ClockIcon, tone: 'text-amber-500',
      note: n.value.awaiting_payment_stale ? (S ? `${n.value.awaiting_payment_stale} sin pagar hace +3 días — dales seguimiento` : `${n.value.awaiting_payment_stale} unpaid 3+ days — follow up`) : '',
      hint: S ? 'Cotizaciones enviadas' : 'Quotes sent', to: '/app/shopping/purchase-requests?status=quoted' },
    { key: 'buy', label: S ? 'Por comprar' : 'To buy', count: n.value.to_buy, icon: ShoppingCartIcon, tone: 'text-emerald-500',
      hint: S ? 'Ya pagaron — cómpralo' : 'Paid — buy it', to: '/app/shopping/purchase-requests?status=paid' },
    { key: 'deliver', label: S ? 'Compras sin entregar' : 'Not delivered yet', count: n.value.not_delivered, icon: TruckIcon, tone: 'text-sky-500',
      hint: S ? 'Productos comprados pendientes' : 'Purchased, pending', to: '/app/shopping/purchased-products' },
    { key: 'visits', label: S ? 'Visitas próximas' : 'Upcoming visits', count: n.value.reservations_upcoming, icon: CalendarDaysIcon, tone: 'text-primary-500',
      hint: S ? 'Compras en persona confirmadas' : 'Confirmed in-person', to: '/app/shopping/availability' },
    { key: 'invoice', label: S ? 'Facturas finales' : 'Final invoices', count: n.value.final_invoices_to_send, icon: DocumentTextIcon, tone: 'text-amber-500',
      hint: S ? 'Visitas terminadas sin factura' : 'Done visits, no invoice', to: '/app/shopping/availability' },
    { key: 'refund', label: S ? 'Reembolsos' : 'Refunds', count: n.value.refunds_pending, icon: ArrowUturnLeftIcon, tone: 'text-red-500',
      hint: S ? 'Pendientes de reembolsar' : 'Owed', to: '/app/shopping/availability' },
  ]
})

const metricTiles = computed(() => {
  const p = periodOf(kind.value, today)
  const rows = (data.value?.per_day || []).filter((r) => r.day >= p.from && r.day <= p.to)
  const sum = (k) => rows.reduce((a, r) => a + (r[k] || 0), 0)
  const S = es.value
  return [
    { key: 'received', label: S ? 'Recibidas' : 'Received', count: sum('received') },
    { key: 'quoted', label: S ? 'Cotizadas' : 'Quoted', count: sum('quoted') },
    { key: 'paid', label: S ? 'Pagadas' : 'Paid', count: sum('paid') },
    { key: 'purchased', label: S ? 'Compradas' : 'Purchased', count: sum('purchased') },
    { key: 'reservations', label: S ? 'Visitas reservadas' : 'Visits booked', count: sum('reservations') },
  ]
})

const openDays = computed(() => (data.value?.schedule || []).filter((d) => d.hours.length))
</script>
