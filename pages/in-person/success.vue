<template>
  <section class="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
    <div class="max-w-md w-full bg-white rounded-3xl shadow-lg p-8 text-center">

      <!-- Confirming the payment (the Stripe webhook can arrive a few seconds late) -->
      <div v-if="view.kind === 'polling' || view.kind === 'login'" class="w-16 h-16 mx-auto mb-5 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin"></div>

      <!-- Confirmed / legacy payment: green check -->
      <div v-else-if="view.kind === 'confirmed' || view.kind === 'legacy'" class="w-20 h-20 mx-auto mb-5 rounded-full bg-primary-600 flex items-center justify-center text-white ring-4 ring-primary-200 shadow-lg">
        <svg class="w-10 h-10" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
      </div>

      <h1 class="text-2xl font-extrabold text-gray-900">{{ copy.title }}</h1>
      <p v-if="view.kind !== 'confirmed'" class="text-sm text-gray-600 mt-2 leading-relaxed">{{ copy.body }}</p>

      <div v-if="view.kind === 'legacy' && ref_" class="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-full">
        <span class="text-xs text-primary-700 uppercase tracking-wider font-semibold">{{ t.number }}</span>
        <span class="text-sm font-mono font-bold text-primary-900">{{ ref_ }}</span>
      </div>

      <template v-if="view.kind === 'confirmed' && r">
        <dl class="mt-5 text-left text-sm bg-gray-50 rounded-2xl p-4 space-y-2">
          <div class="flex justify-between gap-3"><dt class="text-gray-500">{{ t.date }}</dt><dd class="font-semibold text-gray-900 text-right">{{ longDate }}</dd></div>
          <div class="flex justify-between gap-3"><dt class="text-gray-500">{{ t.time }}</dt><dd class="font-semibold text-gray-900 text-right">{{ formatTime(r.start_time, language) }} – {{ formatTime(r.end_time, language) }} ({{ r.hours_reserved }} h) · {{ t.tz }}</dd></div>
          <div class="flex justify-between gap-3"><dt class="text-gray-500">{{ t.place }}</dt><dd class="font-semibold text-gray-900 text-right">San Diego, California</dd></div>
          <div class="flex justify-between gap-3"><dt class="text-gray-500">{{ t.number }}</dt><dd class="font-mono font-bold text-gray-900">{{ r.reservation_number }}</dd></div>
          <div class="flex justify-between gap-3"><dt class="text-gray-500">{{ t.paid }}</dt><dd class="font-semibold text-gray-900">${{ Number(r.amount_usd) }} USD</dd></div>
        </dl>
        <div class="mt-5 text-left">
          <h2 class="text-sm font-bold text-gray-900">{{ t.nextTitle }}</h2>
          <p class="text-sm text-gray-600 mt-1 leading-relaxed">{{ copy.body }}</p>
        </div>
      </template>

      <template v-for="a in view.actions" :key="a">
        <InPersonWhatsApp v-if="a === 'whatsapp'" inline class="mt-4 w-full" :message="waMessage" />
        <NuxtLink v-else-if="a === 'pick'" to="/in-person" class="mt-4 block w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl">{{ t.pickAnother }}</NuxtLink>
        <NuxtLink v-else-if="a === 'requests'" to="/app/purchase-requests" class="mt-6 block w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl">{{ t.requests }}</NuxtLink>
        <NuxtLink v-else-if="a === 'detail' && r" :to="`/app/in-person/${r.reservation_number}`" class="mt-3 block w-full py-3 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors">{{ t.viewDetail }}</NuxtLink>
        <NuxtLink v-else-if="a === 'home'" to="/app" class="mt-3 block w-full py-3 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors">{{ t.goHome }}</NuxtLink>
      </template>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { formatTime, parseDate } from '~/utils/inPersonSlots'
import { successView, viewCopy, loginUrl } from '~/utils/inPersonSuccess'

// The auth middleware sends a signed-out payer to /login?redirect=<this full URL>, and the login page returns them here.
definePageMeta({
  layout: 'app',
  middleware: ['auth', 'customer', 'complete-profile'],
})

const { $customFetch } = useNuxtApp()
const { t: createTranslations, language } = useLanguage()
const route = useRoute()

const ref_ = computed(() => (typeof route.query.ref === 'string' ? route.query.ref : ''))
const r = ref(null)
const fetched = ref(false)
const errorStatus = ref(null)
const tries = ref(0)

const view = computed(() => successView({ ref: ref_.value, reservation: r.value, errorStatus: errorStatus.value, fetched: fetched.value, tries: tries.value }))
const copy = computed(() => viewCopy(view.value, language.value, r.value?.amount_usd))

const t = createTranslations({
  date: { es: 'Fecha', en: 'Date' },
  time: { es: 'Hora', en: 'Time' },
  tz: { es: 'hora de California', en: 'California time' },
  place: { es: 'Lugar', en: 'Place' },
  number: { es: 'Reserva', en: 'Reservation' },
  paid: { es: 'Pagado', en: 'Paid' },
  nextTitle: { es: 'Qué sigue', en: "What's next" },
  viewDetail: { es: 'Ver mi reserva', en: 'View my reservation' },
  goHome: { es: 'Ir al inicio', en: 'Go home' },
  requests: { es: 'Ver mis solicitudes de compra', en: 'View my purchase requests' },
  pickAnother: { es: 'Elegir otro horario', en: 'Pick another time' },
})

const longDate = computed(() => (r.value ? parseDate(r.value.date).toLocaleDateString(language.value === 'es' ? 'es-MX' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''))
const waMessage = computed(() => {
  const n = r.value?.reservation_number || ref_.value
  const base = language.value === 'es' ? 'Hola, tengo una duda sobre mi compra personal en San Diego' : 'Hi, I have a question about my personal shopping in San Diego'
  return n ? `${base} (${n})` : base
})

let timer = null

async function check() {
  try {
    const res = await $customFetch(`/in-person/reservations/${encodeURIComponent(ref_.value)}`)
    r.value = res?.data ?? null
    errorStatus.value = null
  } catch (e) {
    console.error(e)
    errorStatus.value = e?.statusCode ?? e?.status ?? e?.response?.status ?? 0
  }
  fetched.value = true
  if (view.value.poll) { tries.value++; timer = setTimeout(check, 2000) } // ~20 s of polling, then "delayed"
}

// Expired session: back through login, then return to this same URL.
watch(() => view.value.kind, (k) => { if (k === 'login') navigateTo(loginUrl(route.fullPath), { replace: true }) })

onMounted(() => { if (view.value.fetch) check() })
onBeforeUnmount(() => clearTimeout(timer))
</script>
