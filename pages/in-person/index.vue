<template>
  <!-- Reserve a personal-shopping hour at Las Américas: day -> hour -> how many hours -> pay on Stripe.
       Nothing is held until the payment is confirmed (first payment wins), see the API plan. -->
  <section class="min-h-screen bg-gray-50 pb-28 sm:pb-16">
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-3xl mx-auto px-4 py-5 flex items-start gap-3">
        <NuxtLink :to="backTo" class="p-2 -ml-2 hover:bg-gray-100 rounded-lg" :aria-label="t.back">
          <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        </NuxtLink>
        <div class="flex-1 min-w-0">
          <h1 class="text-xl font-bold text-gray-900">{{ t.title }}</h1>
          <p class="text-sm text-gray-500 mt-0.5">{{ t.subtitle }}</p>
        </div>
        <TutorialVideoButton loom-id="01640d8214164acd9f21f37c8fdd3cd6" />
      </div>
    </div>

    <div class="max-w-3xl mx-auto px-4 py-6 space-y-5">
      <div v-if="showCancelledBanner(route.query.cancelled)" class="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-900">{{ t.cancelled }}</div>
      <div v-if="error" class="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">{{ error }}</div>

      <div v-if="loading" class="text-center py-12 text-gray-500 text-sm">{{ t.loading }}</div>

      <!-- No availability: never a dead end -->
      <div v-else-if="days.length === 0" class="bg-white rounded-2xl border border-gray-200 p-8 text-center">
        <p class="text-gray-900 font-semibold">{{ t.noneTitle }}</p>
        <p class="text-sm text-gray-500 mt-1 mb-4">{{ t.noneDesc }}</p>
        <InPersonWhatsApp inline />
      </div>

      <template v-else>
        <!-- 1) day -->
        <div>
          <h2 class="text-sm font-bold text-gray-700 mb-2">{{ t.step1 }}</h2>
          <div class="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
            <button v-for="d in days" :key="d.date" @click="pickDate(d.date)"
              :class="['shrink-0 w-16 py-2.5 rounded-xl border-2 text-center transition', date === d.date ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200 bg-white text-gray-700 hover:border-primary-300']">
              <span class="block text-[11px] uppercase font-semibold">{{ fmt(d.date, { weekday: 'short' }) }}</span>
              <span class="block text-xl font-bold leading-tight">{{ fmt(d.date, { day: 'numeric' }) }}</span>
              <span class="block text-[11px]">{{ fmt(d.date, { month: 'short' }) }}</span>
            </button>
          </div>
        </div>

        <!-- 2) hour + how many hours -->
        <div v-if="day">
          <h2 class="text-sm font-bold text-gray-700 mb-2">{{ t.step2 }} <span class="font-normal text-gray-400">· {{ t.tz }}</span></h2>
          <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
            <button v-for="s in day.slots" :key="s.id" @click="pickSlot(s)"
              :class="['py-3 rounded-xl border-2 text-sm font-semibold transition', start === s.start_time.substring(0, 5) ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-primary-300']">
              {{ formatTime(s.start_time, language) }}
            </button>
          </div>

          <div v-if="slot" class="mt-4 bg-white rounded-2xl border border-gray-200 p-4">
            <p class="text-sm font-bold text-gray-700 mb-2">{{ t.howMany }}</p>
            <div class="flex items-center gap-4">
              <button @click="hours--" :disabled="hours <= 1" class="w-11 h-11 rounded-full border border-gray-300 text-xl font-bold text-gray-700 disabled:opacity-30" :aria-label="t.less">−</button>
              <span class="text-2xl font-extrabold text-gray-900 w-10 text-center">{{ hours }}</span>
              <button @click="hours++" :disabled="hours >= maxHours" class="w-11 h-11 rounded-full border border-gray-300 text-xl font-bold text-gray-700 disabled:opacity-30" :aria-label="t.more">+</button>
              <span class="text-xs text-gray-400">{{ t.max(maxHours) }}</span>
            </div>
          </div>
        </div>

        <!-- 3) summary -->
        <div v-if="slot" class="bg-white rounded-2xl border-2 border-primary-200 p-5 space-y-4">
          <p class="text-sm text-gray-800 leading-relaxed">{{ t.summary(longDate, formatTime(start, language), formatTime(endTime(start, hours), language), hours, rate) }}</p>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ t.notes }}</label>
            <textarea v-model="notes" rows="3" maxlength="1000" class="w-full rounded-xl border-gray-300 text-sm"></textarea>
          </div>
          <button @click="submit" :disabled="submitting" class="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl disabled:opacity-60 transition-colors">
            {{ submitting ? t.redirecting : t.reserve(rate) }}
          </button>
        </div>

        <InPersonWhatsApp />
      </template>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { hourOptions, endTime, formatTime, parseDate, readLimits } from '~/utils/inPersonSlots'
import { showCancelledBanner } from '~/utils/inPersonSuccess'

definePageMeta({
  layout: 'app',
  middleware: ['auth', 'customer', 'complete-profile'],
})

const { $customFetch } = useNuxtApp()
const { t: createTranslations, language } = useLanguage()
const route = useRoute()
const { date, start, hours, notes, reset } = useInPersonRequest()

const backTo = computed(() => (typeof route.query.from === 'string' ? route.query.from : '/app/purchase-requests'))

const t = createTranslations({
  back: { es: 'Volver', en: 'Back' },
  title: { es: 'Reserva tu horario de compras', en: 'Reserve your shopping time' },
  subtitle: { es: 'Un shopper compra por ti en Las Américas Premium Outlets. Elige el día y la hora.', en: 'A personal shopper shops for you at Las Américas Premium Outlets. Pick the day and time.' },
  loading: { es: 'Cargando horarios…', en: 'Loading times…' },
  cancelled: { es: 'No se hizo ningún cobro y no se reservó nada. Cuando quieras, elige tu horario de nuevo.', en: 'You were not charged and nothing was reserved. Pick your time again whenever you like.' },
  noneTitle: { es: 'Por ahora no hay horarios publicados', en: 'No times are published right now' },
  noneDesc: { es: 'Escríbele a tu shopper por WhatsApp y te avisa en cuanto abra horarios.', en: 'Message your shopper on WhatsApp and she will let you know as soon as times open.' },
  step1: { es: '1. Elige el día', en: '1. Pick the day' },
  step2: { es: '2. Elige la hora', en: '2. Pick the time' },
  tz: { es: 'hora de California', en: 'California time' },
  howMany: { es: '¿Cuántas horas necesitas?', en: 'How many hours do you need?' },
  less: { es: 'Menos horas', en: 'Fewer hours' },
  more: { es: 'Más horas', en: 'More hours' },
  max: { es: (n) => `máx. ${n} h a partir de esta hora`, en: (n) => `max ${n} h from this time` },
  summary: {
    es: (d, a, b, n, p) => `Reservas el ${d} de ${a} a ${b} (${n} h). Hoy solo pagas${p ? ` $${p} USD` : ''} para apartar tu horario; las horas y el 10% de tus compras se cobran al terminar.`,
    en: (d, a, b, n, p) => `You reserve ${d} from ${a} to ${b} (${n} h). Today you only pay${p ? ` $${p} USD` : ''} to hold your time; the hours and 10% of your purchases are charged when we finish.`,
  },
  notes: { es: '¿Algo que quieras comprar o que debamos saber?', en: 'Anything you want to buy or that we should know?' },
  reserve: { es: (p) => (p ? `Reservar y pagar $${p}` : 'Reservar y pagar'), en: (p) => (p ? `Reserve and pay $${p}` : 'Reserve and pay') },
  redirecting: { es: 'Llevándote a pagar…', en: 'Taking you to pay…' },
  taken: { es: 'Ese horario ya fue reservado, elige otro', en: 'That time was just reserved, pick another' },
  failed: { es: 'No pudimos iniciar el pago. Intenta de nuevo.', en: 'We could not start the payment. Please try again.' },
})

const days = ref([])
const rate = ref(null) // hourly_rate_usd from the availability API
const capHours = ref(1) // max_hours from the availability API
const loading = ref(true)
const submitting = ref(false)
const error = ref('')

const day = computed(() => days.value.find((d) => d.date === date.value) ?? null)
const slot = computed(() => day.value?.slots.find((s) => s.start_time.substring(0, 5) === start.value) ?? null)
const maxHours = computed(() => hourOptions(slot.value?.max_consecutive_hours, capHours.value).length)
const longDate = computed(() => (date.value ? parseDate(date.value).toLocaleDateString(language.value === 'es' ? 'es-MX' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' }) : ''))

const fmt = (d, opts) => parseDate(d).toLocaleDateString(language.value === 'es' ? 'es-MX' : 'en-US', opts)

function pickDate(d) {
  date.value = d
  start.value = null
  hours.value = 1
}
function pickSlot(s) {
  start.value = s.start_time.substring(0, 5)
  hours.value = Math.min(hours.value, hourOptions(s.max_consecutive_hours, capHours.value).length)
}

async function load() {
  try {
    const res = await $customFetch('/in-person/availability')
    days.value = res?.data ?? []
    ;({ rate: rate.value, maxHours: capHours.value } = readLimits(res))
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
  // Drop a pick that is no longer offered.
  // ?date=YYYY-MM-DD (e.g. a link from the team) opens that day when it is offered.
  const wanted = typeof route.query.date === 'string' ? route.query.date : ''
  if (!date.value && wanted && days.value.some((d) => d.date === wanted)) pickDate(wanted)
  if (date.value && !day.value) pickDate(null)
  else if (start.value && !slot.value) start.value = null
}

async function submit() {
  submitting.value = true
  error.value = ''
  try {
    const res = await $customFetch('/in-person/reservations', {
      method: 'POST',
      body: { date: date.value, start_time: start.value, hours: hours.value, customer_notes: notes.value.trim() || undefined },
    })
    if (!res?.checkout_url) throw new Error('no checkout url')
    window.location.href = res.checkout_url
  } catch (e) {
    console.error(e)
    if (e?.statusCode === 422 || e?.status === 422) {
      error.value = t.value.taken
      await load()
    } else {
      error.value = e?.data?.message ?? t.value.failed
    }
    submitting.value = false
  }
}

onMounted(() => {
  reset()
  load()
})
</script>
