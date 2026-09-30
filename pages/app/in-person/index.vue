<template>
  <section class="min-h-screen bg-gray-50">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <div class="flex items-center justify-between gap-3 mb-5">
        <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900">{{ t.title }}</h1>
        <NuxtLink to="/in-person" class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl">{{ t.book }}</NuxtLink>
      </div>

      <div v-if="loading" class="flex justify-center py-16">
        <div class="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
      <p v-else-if="error" class="text-center text-sm text-red-600 py-12">{{ t.loadError }}</p>
      <div v-else-if="!reservations.length" class="bg-white rounded-2xl border border-gray-100 p-8 text-center">
        <p class="text-gray-600">{{ t.empty }}</p>
        <NuxtLink to="/in-person" class="mt-4 inline-block px-5 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl">{{ t.book }}</NuxtLink>
      </div>

      <div v-else class="space-y-3">
        <NuxtLink v-for="r in reservations" :key="r.reservation_number" :to="`/app/in-person/${r.reservation_number}`"
          class="block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md p-4 transition-shadow">
          <div class="flex items-start justify-between gap-3">
            <span class="font-mono font-bold text-gray-900">{{ r.reservation_number }}</span>
            <span class="px-2.5 py-1 rounded-full text-xs font-semibold" :class="statusTone(r.status)">{{ statusLabel(r.status, language) }}</span>
          </div>
          <p class="mt-2 text-sm font-semibold text-gray-900">{{ longDate(r.date) }} · {{ hoursRange(r.start_time, r.hours_reserved) }}</p>
          <p class="text-xs text-gray-500">{{ t.tz }}</p>
          <p v-if="pendingTotal(r) !== null" class="mt-2 text-sm font-bold text-amber-700">{{ t.toPay }}: {{ money(pendingTotal(r)) }} USD</p>
          <p v-else-if="r.final" class="mt-2 text-sm font-semibold text-green-700">{{ t.total }}: {{ money(r.final.total_usd) }} USD</p>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { parseDate, hoursRange } from '~/utils/inPersonSlots'
import { money, statusLabel, statusTone, pendingTotal } from '~/utils/inPersonReservation'

definePageMeta({ layout: 'app', middleware: ['auth', 'customer', 'complete-profile'] })
useHead({ title: 'Mis compras presenciales — Boxly' })

const { $customFetch } = useNuxtApp()
const { t: createTranslations, language } = useLanguage()

const t = createTranslations({
  title: { es: 'Mis compras presenciales', en: 'My in-person shopping' },
  book: { es: 'Reservar horario', en: 'Book a time' },
  empty: { es: 'Aún no tienes compras presenciales.', en: 'You have no in-person shopping yet.' },
  loadError: { es: 'No se pudieron cargar tus reservas.', en: 'Could not load your reservations.' },
  tz: { es: 'hora de California', en: 'California time' },
  toPay: { es: 'Pago pendiente', en: 'Payment pending' },
  total: { es: 'Total final', en: 'Final total' },
})

const reservations = ref([])
const loading = ref(true)
const error = ref(false)
const longDate = (d) => parseDate(d).toLocaleDateString(language.value === 'es' ? 'es-MX' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

onMounted(async () => {
  try {
    const res = await $customFetch('/in-person/reservations')
    reservations.value = res?.data ?? []
  } catch (e) {
    console.error(e); error.value = true
  } finally {
    loading.value = false
  }
})
</script>
