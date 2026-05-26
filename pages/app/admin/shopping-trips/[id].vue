<template>
  <section class="min-h-screen bg-gray-50">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

      <NuxtLink to="/app/admin/shopping-trips" class="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-5">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
        Visitas en persona
      </NuxtLink>

      <div v-if="loading" class="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">Cargando…</div>

      <template v-else-if="trip">
        <!-- Trip header -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 mb-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div class="text-xs uppercase tracking-wider text-indigo-600 font-bold mb-1">Visita programada</div>
              <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900">{{ formatDate(trip.trip_date) }}</h1>
              <div class="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                <span class="flex items-center gap-1">
                  <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  {{ trip.location }}
                </span>
                <span v-if="trip.start_time" class="flex items-center gap-1">
                  <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  {{ formatTime(trip.start_time) }}{{ trip.end_time ? ' – ' + formatTime(trip.end_time) : '' }}
                </span>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <span :class="statusClass(trip.status)" class="inline-flex px-3 py-1 rounded-full text-sm font-semibold border">{{ statusLabel(trip.status) }}</span>
              <div class="text-center bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2">
                <div class="text-2xl font-extrabold text-indigo-700">{{ bookings.length }}</div>
                <div class="text-[10px] uppercase tracking-wider text-indigo-500 font-semibold">{{ bookings.length === 1 ? 'reserva' : 'reservas' }}</div>
              </div>
            </div>
          </div>
          <div v-if="trip.notes" class="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600 italic">"{{ trip.notes }}"</div>
        </div>

        <!-- Empty state -->
        <div v-if="bookings.length === 0" class="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div class="w-14 h-14 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
            <svg class="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          </div>
          <p class="text-gray-700 font-semibold">Sin reservas confirmadas</p>
          <p class="text-gray-400 text-sm mt-1">Nadie ha reservado esta visita todavía.</p>
        </div>

        <!-- Booking cards -->
        <div v-else class="space-y-4">
          <div class="text-xs uppercase tracking-wider text-gray-500 font-semibold px-1 mb-2">
            Reservas confirmadas ({{ bookings.length }})
          </div>

          <div v-for="booking in bookings" :key="booking.id" class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            <!-- Card header: customer info + WhatsApp -->
            <div class="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/60">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {{ initials(booking.user?.name) }}
                </div>
                <div class="min-w-0">
                  <div class="font-bold text-gray-900 truncate">{{ booking.user?.name ?? '—' }}</div>
                  <div class="text-xs text-gray-500 truncate">{{ booking.user?.email }}</div>
                  <div v-if="booking.user?.phone" class="text-xs text-gray-500">{{ booking.user?.phone }}</div>
                </div>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                <span class="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-green-50 text-green-700 border-green-100">
                  Confirmada
                </span>
                <a
                  :href="whatsappLink(booking)"
                  target="_blank"
                  rel="noopener"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </a>
              </div>
            </div>

            <!-- Stores + categories -->
            <div class="px-5 py-4">
              <div class="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-2">
                Tiendas ({{ booking.store_breakdown?.length ?? 0 }})
              </div>
              <div v-if="booking.store_breakdown?.length" class="flex flex-wrap gap-2">
                <div
                  v-for="row in booking.store_breakdown"
                  :key="row.store_id"
                  class="border border-gray-200 rounded-xl px-3 py-2"
                >
                  <div class="font-semibold text-gray-900 text-sm">{{ row.store_name }}</div>
                  <div class="flex flex-wrap gap-1 mt-1">
                    <span
                      v-if="row.category_names.length === 0"
                      class="text-xs text-gray-400 italic"
                    >Cualquier producto</span>
                    <span
                      v-for="cat in row.category_names"
                      :key="cat"
                      class="inline-flex px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded text-[11px] font-medium"
                    >{{ cat }}</span>
                  </div>
                </div>
              </div>
              <div v-else class="text-sm text-gray-400 italic">Sin tiendas</div>

              <div class="mt-3 text-[10px] text-gray-400 font-mono">{{ booking.booking_number }}</div>
            </div>
          </div>
        </div>
      </template>

      <div v-else class="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <p class="text-gray-700 font-semibold">Visita no encontrada</p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin'],
})

const { $customFetch, $toast } = useNuxtApp()
const route = useRoute()

const trip     = ref(null)
const loading  = ref(true)

const bookings = computed(() => trip.value?.bookings ?? [])

const initials = (name) => {
  if (!name) return '?'
  return name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

const whatsappLink = (booking) => {
  const name = booking.user?.name ?? 'cliente'
  const stores = (booking.store_breakdown ?? []).map(r => r.store_name).join(', ')
  const msg = `Hola ${name}! Soy del equipo de Boxly. Vi tu reserva (${booking.booking_number}) para visitar ${stores}. ¿Cuándo tienes un momento para coordinar los detalles?`
  return `https://wa.me/${(booking.user?.phone ?? '').replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`
}

function formatDate(d) {
  if (!d) return '—'
  const datePart = String(d).substring(0, 10)
  const dt = new Date(datePart + 'T12:00')
  if (isNaN(dt.getTime())) return d
  return dt.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

function formatTime(t) {
  if (!t) return ''
  const [h, m] = t.split(':')
  const d = new Date(); d.setHours(+h, +m, 0)
  return d.toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function statusLabel(s) {
  return ({ open: 'Abierta', closed: 'Cerrada', completed: 'Completada' })[s] ?? s
}
function statusClass(s) {
  return ({
    open:      'bg-green-50 text-green-700 border-green-100',
    closed:    'bg-gray-50 text-gray-500 border-gray-100',
    completed: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  })[s] ?? 'bg-gray-50 text-gray-500 border-gray-100'
}

onMounted(async () => {
  try {
    const res = await $customFetch(`/admin/shopping-trips/${route.params.id}`)
    trip.value = res?.data ?? null
  } catch (e) {
    console.error(e)
    $toast.error('No se pudo cargar la visita')
  } finally {
    loading.value = false
  }
})
</script>
