<template>
  <section class="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
    <div class="max-w-md w-full bg-white rounded-3xl shadow-lg p-8 text-center">

      <!-- Confirming the payment (the Stripe webhook can arrive a few seconds late) -->
      <template v-if="state === 'pending'">
        <div class="w-16 h-16 mx-auto mb-5 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin"></div>
        <h1 class="text-2xl font-extrabold text-gray-900">{{ t.confirming }}</h1>
        <p class="text-sm text-gray-600 mt-2">{{ t.confirmingHint }}</p>
      </template>

      <!-- Someone paid for that hour first: refunded -->
      <template v-else-if="state === 'taken'">
        <h1 class="text-2xl font-extrabold text-gray-900">{{ t.takenTitle }}</h1>
        <p class="text-sm text-gray-600 mt-2 leading-relaxed">{{ t.takenBody }}</p>
        <NuxtLink to="/in-person" class="mt-6 block w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl">{{ t.pickAnother }}</NuxtLink>
        <InPersonWhatsApp inline class="mt-3 w-full" :message="waMessage" />
      </template>

      <!-- Could not read the reservation -->
      <template v-else-if="state === 'error'">
        <h1 class="text-2xl font-extrabold text-gray-900">{{ t.errorTitle }}</h1>
        <p class="text-sm text-gray-600 mt-2">{{ t.errorBody }}</p>
        <InPersonWhatsApp inline class="mt-6 w-full" :message="waMessage" />
        <NuxtLink to="/in-person" class="mt-3 block w-full py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50">{{ t.backToPick }}</NuxtLink>
      </template>

      <!-- Reservation is not (or no longer) active: cancelled / expired -->
      <template v-else-if="state === 'inactive'">
        <h1 class="text-2xl font-extrabold text-gray-900">{{ t.inactiveTitle }}</h1>
        <p class="text-sm text-gray-600 mt-2">{{ t.inactiveBody }}</p>
        <NuxtLink to="/in-person" class="mt-6 block w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl">{{ t.pickAnother }}</NuxtLink>
        <InPersonWhatsApp inline class="mt-3 w-full" :message="waMessage" />
      </template>

      <!-- Confirmed -->
      <template v-else-if="r">
        <div class="w-20 h-20 mx-auto mb-5 rounded-full bg-primary-600 flex items-center justify-center text-white ring-4 ring-primary-200 shadow-lg">
          <svg class="w-10 h-10" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
        </div>
        <h1 class="text-2xl font-extrabold text-gray-900">{{ t.title }}</h1>

        <dl class="mt-5 text-left text-sm bg-gray-50 rounded-2xl p-4 space-y-2">
          <div class="flex justify-between gap-3"><dt class="text-gray-500">{{ t.date }}</dt><dd class="font-semibold text-gray-900 text-right">{{ longDate }}</dd></div>
          <div class="flex justify-between gap-3"><dt class="text-gray-500">{{ t.time }}</dt><dd class="font-semibold text-gray-900 text-right">{{ formatTime(r.start_time, language) }} – {{ formatTime(r.end_time, language) }} ({{ r.hours_reserved }} h) · {{ t.tz }}</dd></div>
          <div class="flex justify-between gap-3"><dt class="text-gray-500">{{ t.place }}</dt><dd class="font-semibold text-gray-900 text-right">{{ r.location || 'Las Américas Premium Outlets' }}</dd></div>
          <div class="flex justify-between gap-3"><dt class="text-gray-500">{{ t.number }}</dt><dd class="font-mono font-bold text-gray-900">{{ r.reservation_number }}</dd></div>
          <div class="flex justify-between gap-3"><dt class="text-gray-500">{{ t.paid }}</dt><dd class="font-semibold text-gray-900">${{ Number(r.amount_usd) }} USD</dd></div>
        </dl>

        <div class="mt-5 text-left">
          <h2 class="text-sm font-bold text-gray-900">{{ t.nextTitle }}</h2>
          <p class="text-sm text-gray-600 mt-1 leading-relaxed">{{ t.nextBody }}</p>
        </div>

        <InPersonWhatsApp inline class="mt-6 w-full" :label="t.talk" :message="waMessage" />
        <NuxtLink :to="`/app/in-person/${r.reservation_number}`" class="mt-3 block w-full py-3 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors">{{ t.viewDetail }}</NuxtLink>
        <NuxtLink to="/app" class="mt-3 block w-full py-3 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors">{{ t.goHome }}</NuxtLink>
      </template>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { formatTime, parseDate } from '~/utils/inPersonSlots'

definePageMeta({
  layout: 'app',
  middleware: ['auth', 'customer', 'complete-profile'],
})

const { $customFetch } = useNuxtApp()
const { t: createTranslations, language } = useLanguage()
const route = useRoute()

const ref_ = computed(() => (typeof route.query.ref === 'string' ? route.query.ref : ''))
const r = ref(null)
const state = ref('pending') // pending | confirmed | taken | inactive | error

const t = createTranslations({
  confirming: { es: 'Confirmando tu pago…', en: 'Confirming your payment…' },
  confirmingHint: { es: 'Esto toma unos segundos. No cierres esta página.', en: 'This takes a few seconds. Please keep this page open.' },
  title: { es: '¡Reservaste tu horario!', en: 'Your time is reserved!' },
  date: { es: 'Fecha', en: 'Date' },
  time: { es: 'Hora', en: 'Time' },
  tz: { es: 'hora de California', en: 'California time' },
  place: { es: 'Lugar', en: 'Place' },
  number: { es: 'Reserva', en: 'Reservation' },
  paid: { es: 'Pagado', en: 'Paid' },
  nextTitle: { es: 'Qué sigue', en: "What's next" },
  nextBody: {
    es: 'Tu shopper te contactará por WhatsApp para coordinar lo que buscas. El servicio cuesta $30 USD por hora + 10% del total de tus compras. Tu primera hora ya está pagada; el resto se cobra al terminar.',
    en: 'Your shopper will contact you on WhatsApp to coordinate what you are looking for. The service costs $30 USD per hour + 10% of the total spent. Your first hour is already paid; the rest is charged when we finish.',
  },
  talk: { es: 'Hablar con mi shopper', en: 'Talk to my shopper' },
  viewDetail: { es: 'Ver mi reserva', en: 'View my reservation' },
  goHome: { es: 'Ir al inicio', en: 'Go home' },
  takenTitle: { es: 'Alguien reservó ese horario justo antes', en: 'Someone reserved that time just before you' },
  takenBody: { es: 'Tu pago de $30 será reembolsado. Elige otro horario y con gusto te ayudamos por WhatsApp.', en: 'Your $30 payment will be refunded. Pick another time, and we are happy to help on WhatsApp.' },
  pickAnother: { es: 'Elegir otro horario', en: 'Pick another time' },
  errorTitle: { es: 'No pudimos confirmar tu reserva', en: 'We could not confirm your reservation' },
  errorBody: { es: 'Si ya pagaste, escríbenos por WhatsApp y lo revisamos de inmediato.', en: 'If you already paid, message us on WhatsApp and we will check right away.' },
  backToPick: { es: 'Volver a elegir horario', en: 'Back to picking a time' },
  inactiveTitle: { es: 'Esta reserva ya no está activa', en: 'This reservation is no longer active' },
  inactiveBody: { es: 'Puedes elegir un nuevo horario cuando quieras.', en: 'You can pick a new time whenever you like.' },
})

const longDate = computed(() => (r.value ? parseDate(r.value.date).toLocaleDateString(language.value === 'es' ? 'es-MX' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''))
const waMessage = computed(() => {
  const n = r.value?.reservation_number || ref_.value
  const base = language.value === 'es' ? 'Hola, tengo una duda sobre mi compra personal en Las Américas' : 'Hi, I have a question about my personal shopping at Las Américas'
  return n ? `${base} (${n})` : base
})

let timer = null
let tries = 0

async function check() {
  try {
    const res = await $customFetch(`/in-person/reservations/${encodeURIComponent(ref_.value)}`)
    r.value = res?.data ?? null
    const s = r.value?.status
    if (s === 'confirmed' || s === 'completed') state.value = 'confirmed'
    else if (s === 'slot_taken') state.value = 'taken'
    else if (s === 'cancelled' || s === 'expired') state.value = 'inactive'
    else if (s === 'pending_payment' && ++tries < 10) timer = setTimeout(check, 2000) // ~20 s
    else state.value = 'error'
  } catch (e) {
    console.error(e)
    state.value = 'error'
  }
}

onMounted(() => {
  if (!ref_.value) return (state.value = 'error')
  check()
})
onBeforeUnmount(() => clearTimeout(timer))
</script>
