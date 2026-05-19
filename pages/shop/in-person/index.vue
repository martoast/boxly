<template>
 <!-- Step 1 of the in-person flow: pick a trip date from admin-configured
 open trips. Cards are pre-selected when the customer returns from a
 later step. -->
 <section class="min-h-screen bg-gray-50 pb-20">
 <div class="bg-white border-b border-gray-200">
 <div class="max-w-3xl mx-auto px-4 py-5">
 <div class="flex items-start gap-3 mb-5">
 <NuxtLink to="/shop/request" class="p-2 -ml-2 hover:bg-gray-100 rounded-lg" :aria-label="t.back">
 <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
 </NuxtLink>
 <div class="flex-1 min-w-0">
 <h1 class="text-xl font-bold text-gray-900">{{ t.title }}</h1>
 <p class="text-sm text-gray-500 mt-0.5">{{ t.subtitle }}</p>
 </div>
 </div>
 <InPersonStepper :current="1" :steps="stepLabels" />
 </div>
 </div>

 <div class="max-w-3xl mx-auto px-4 py-6 space-y-3">
 <div v-if="loading" class="text-center py-12 text-gray-500 text-sm">{{ t.loading }}</div>

 <div v-else-if="trips.length === 0" class="bg-white rounded-2xl border border-gray-200 p-8 text-center">
 <div class="w-14 h-14 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
 <svg class="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
 </div>
 <p class="text-gray-900 font-semibold">{{ t.noneTitle }}</p>
 <p class="text-sm text-gray-500 mt-1">{{ t.noneDesc }}</p>
 </div>

 <button
 v-for="trip in trips"
 :key="trip.id"
 @click="pick(trip)"
 :class="[
 'w-full text-left bg-white rounded-2xl border-2 p-4 sm:p-5 transition-all',
 selectedTrip?.id === trip.id
 ? 'border-primary-600 ring-2 ring-primary-100'
 : 'border-gray-200 hover:border-primary-300'
 ]"
 >
 <div class="flex items-center justify-between gap-4">
 <div class="min-w-0">
 <div class="text-xs uppercase tracking-wider text-primary-600 font-semibold">
 {{ formatWeekday(trip.trip_date) }}
 </div>
 <div class="text-lg font-bold text-gray-900 mt-0.5">{{ formatDate(trip.trip_date) }}</div>
 <div v-if="trip.start_time || trip.end_time" class="text-sm text-gray-500 mt-1">
 {{ formatTime(trip.start_time) }}{{ trip.end_time ? ' – ' + formatTime(trip.end_time) : '' }}
 </div>
 <div class="text-xs text-gray-500 mt-1">{{ trip.location }}</div>
 <div v-if="trip.notes" class="text-xs text-gray-500 mt-2 italic">"{{ trip.notes }}"</div>
 </div>
 <div
 :class="[
 'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
 selectedTrip?.id === trip.id ? 'bg-primary-600 text-white' : 'border-2 border-gray-300'
 ]"
 >
 <svg v-if="selectedTrip?.id === trip.id" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
 </div>
 </div>
 </button>
 </div>

 <div v-if="selectedTrip" class="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 px-4 py-4 shadow-lg">
 <div class="max-w-3xl mx-auto">
 <NuxtLink
 to="/shop/in-person/stores"
 class="w-full inline-flex items-center justify-center gap-2 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors"
 >
 {{ t.continue }}
 <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
 </NuxtLink>
 </div>
 </div>
 </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'

definePageMeta({
 layout: 'shop',
 middleware: ['auth', 'customer', 'complete-profile'],
})

const { $customFetch } = useNuxtApp()
const { t: createTranslations, language } = useLanguage()
const { selectedTrip, setTrip } = useInPersonRequest()

const t = createTranslations({
 back: { es: 'Volver', en: 'Back' },
 title: { es: 'Elige la fecha de tu visita', en: 'Pick your visit date' },
 subtitle: { es: 'Compramos por ti en outlets y tiendas físicas — ideal para boutiques y compras múltiples.', en: 'We shop US outlets and stores for you — built for boutiques and multi-store runs.' },
 loading: { es: 'Cargando fechas…', en: 'Loading dates…' },
 noneTitle: { es: 'No hay fechas abiertas', en: 'No open dates right now' },
 noneDesc: { es: 'Estamos planeando la próxima visita. Vuelve a checar pronto.', en: "We're planning the next trip. Check back soon." },
 continue: { es: 'Continuar', en: 'Continue' },
})

const stepLabels = computed(() => [
 language.value === 'es' ? 'Fecha' : 'Date',
 language.value === 'es' ? 'Tiendas' : 'Stores',
 language.value === 'es' ? 'Detalles' : 'Details',
 language.value === 'es' ? 'Revisar' : 'Review',
])

const trips = ref([])
const loading = ref(true)

function pick(trip) {
 setTrip(trip)
}

function tripDate(date) {
 // Robust to both 'YYYY-MM-DD' and full ISO date-time strings.
 const datePart = String(date ?? '').substring(0, 10)
 const dt = new Date(datePart + 'T12:00')
 return isNaN(dt.getTime()) ? null : dt
}

function formatWeekday(date) {
 const dt = tripDate(date)
 return dt ? dt.toLocaleDateString(language.value === 'es' ? 'es-MX' : 'en-US', { weekday: 'long' }) : ''
}

function formatDate(date) {
 const dt = tripDate(date)
 return dt ? dt.toLocaleDateString(language.value === 'es' ? 'es-MX' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''
}

function formatTime(time) {
 if (!time) return ''
 // time is 'HH:MM:SS'
 const [h, m] = time.split(':')
 const d = new Date()
 d.setHours(+h, +m, 0)
 return d.toLocaleTimeString(language.value === 'es' ? 'es-MX' : 'en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

onMounted(async () => {
 try {
 const res = await $customFetch('/shopping-trips/availability')
 trips.value = res?.data ?? []
 } catch (e) {
 console.error(e)
 } finally {
 loading.value = false
 }
})
</script>
