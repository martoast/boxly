<template>
  <section class="min-h-screen bg-gray-50">
    <div class="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-4">
      <NuxtLink to="/app/in-person" class="text-sm text-gray-500 hover:text-gray-800">← {{ t.back }}</NuxtLink>

      <div v-if="loading" class="flex justify-center py-16">
        <div class="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
      <p v-else-if="!r" class="text-center text-sm text-red-600 py-12">{{ t.loadError }}</p>

      <template v-else>
        <!-- Status header -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs text-gray-500">{{ t.number }}</p>
              <h1 class="text-2xl font-extrabold font-mono text-gray-900">{{ r.reservation_number }}</h1>
            </div>
            <span class="px-3 py-1 rounded-full text-xs font-semibold" :class="statusTone(r.status)">{{ statusLabel(r.status, language) }}</span>
          </div>
          <dl class="mt-4 text-sm space-y-2">
            <div class="flex justify-between gap-3"><dt class="text-gray-500">{{ t.date }}</dt><dd class="font-semibold text-right">{{ longDate }}</dd></div>
            <div class="flex justify-between gap-3"><dt class="text-gray-500">{{ t.time }}</dt><dd class="font-semibold text-right">{{ hoursRange(r.start_time, r.hours_reserved) }} · {{ t.tz }}</dd></div>
            <div class="flex justify-between gap-3"><dt class="text-gray-500">{{ t.place }}</dt><dd class="font-semibold text-right">{{ r.location || 'Las Américas Premium Outlets' }}</dd></div>
            <div class="flex justify-between gap-3"><dt class="text-gray-500">{{ t.hours }}</dt><dd class="font-semibold">{{ r.hours_reserved }} h</dd></div>
          </dl>
          <div v-if="r.customer_notes" class="mt-4">
            <p class="text-xs text-gray-500">{{ t.notes }}</p>
            <p class="text-sm text-gray-800 whitespace-pre-line">{{ r.customer_notes }}</p>
          </div>
        </div>

        <!-- Timeline -->
        <div v-if="r.events?.length" class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 class="text-base font-bold text-gray-900 mb-4">{{ t.timeline }}</h2>
          <InPersonTimeline :events="r.events" />
        </div>

        <!-- Payments -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 class="text-base font-bold text-gray-900">{{ t.payments }}</h2>
          <div class="flex justify-between gap-3 text-sm">
            <span class="text-gray-600">{{ t.reserve }}</span>
            <span class="font-semibold">{{ money(r.amount_usd) }} USD · {{ r.paid_at ? t.paid : t.unpaid }}<template v-if="r.refunded"> · {{ t.refunded }}</template></span>
          </div>

          <template v-if="r.final">
            <div class="border-t border-gray-100 pt-4">
              <div class="flex items-center justify-between gap-3 mb-3">
                <h3 class="text-sm font-bold text-gray-900">{{ t.finalTitle }}</h3>
                <span class="px-2.5 py-1 rounded-full text-xs font-semibold" :class="finalIsPaid(r.final) ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'">{{ finalStatusLabel(r.final.status, language) }}</span>
              </div>
              <InPersonBreakdown :b="breakdown" />
              <a v-if="r.final.status === 'sent' && r.final.invoice_url" :href="r.final.invoice_url" target="_blank" rel="noopener"
                class="mt-4 block w-full py-3.5 text-center bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl">{{ t.pay }} {{ money(r.final.total_usd) }}</a>
            </div>
          </template>
          <p v-else-if="r.status === 'confirmed'" class="text-xs text-gray-500">{{ t.finalHint }}</p>
        </div>

        <InPersonWhatsApp inline class="w-full" :message="waMessage" />
      </template>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { parseDate, hoursRange } from '~/utils/inPersonSlots'
import { money, statusLabel, statusTone, finalStatusLabel, finalIsPaid } from '~/utils/inPersonReservation'

definePageMeta({ layout: 'app', middleware: ['auth', 'customer', 'complete-profile'] })
useHead({ title: 'Compra presencial — Boxly' })

const { $customFetch } = useNuxtApp()
const { t: createTranslations, language } = useLanguage()
const route = useRoute()

const t = createTranslations({
  back: { es: 'Mis compras presenciales', en: 'My in-person shopping' },
  loadError: { es: 'No se pudo cargar la reserva.', en: 'Could not load the reservation.' },
  number: { es: 'Reserva', en: 'Reservation' },
  date: { es: 'Fecha', en: 'Date' },
  time: { es: 'Hora', en: 'Time' },
  tz: { es: 'hora de California', en: 'California time' },
  place: { es: 'Lugar', en: 'Place' },
  hours: { es: 'Horas reservadas', en: 'Hours reserved' },
  notes: { es: 'Tus notas', en: 'Your notes' },
  timeline: { es: 'Historial', en: 'Timeline' },
  payments: { es: 'Pagos', en: 'Payments' },
  reserve: { es: 'Reserva (1ª hora)', en: 'Reservation (1st hour)' },
  paid: { es: 'Pagado', en: 'Paid' },
  unpaid: { es: 'Pendiente', en: 'Pending' },
  refunded: { es: 'Reembolsada', en: 'Refunded' },
  finalTitle: { es: 'Cobro final', en: 'Final charge' },
  pay: { es: 'Pagar', en: 'Pay' },
  finalHint: { es: 'Al terminar tu compra te enviaremos el cobro final: $30 por hora + 10% de lo gastado, menos tu reserva.', en: 'When we finish shopping we will send the final charge: $30 per hour + 10% of the amount spent, minus your reservation.' },
})

const r = ref(null)
const loading = ref(true)

const longDate = computed(() => parseDate(r.value.date).toLocaleDateString(language.value === 'es' ? 'es-MX' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))
const breakdown = computed(() => {
  const f = r.value.final
  return { hours: f.hours_worked, spent: f.amount_spent_usd, hoursFee: f.hours_fee_usd, commission: f.commission_usd, credit: f.credit_usd, total: f.total_usd }
})
const waMessage = computed(() => {
  const base = language.value === 'es' ? 'Hola, tengo una duda sobre mi compra personal en Las Américas' : 'Hi, I have a question about my personal shopping at Las Américas'
  return `${base} (${route.params.number})`
})

onMounted(async () => {
  try {
    const res = await $customFetch(`/in-person/reservations/${encodeURIComponent(route.params.number)}`)
    r.value = res?.data ?? null
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>
