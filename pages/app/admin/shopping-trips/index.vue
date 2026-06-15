<template>
  <!-- Admin CRUD for in-person shopping trips. The customer-facing date
       picker on /in-person reads the open trips this page creates.
       Single-file with an inline modal for create/edit — admin tool,
       used by Alex/Erick only, doesn't justify a 3-file split. -->
  <section class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900">Visitas en persona</h1>
          <p class="text-sm text-gray-500 mt-1">Fechas que pueden agendar los clientes para Las Américas Outlets.</p>
        </div>
        <button @click="openCreate" class="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/20 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Crear visita
        </button>
      </div>

      <div class="flex items-center gap-2 mb-5 text-sm">
        <button v-for="opt in statusOptions" :key="opt.value"
          @click="status = opt.value"
          :class="['px-3 py-1.5 rounded-full border', status === opt.value ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-400']"
        >{{ opt.label }}</button>
        <label class="ml-auto flex items-center gap-2 text-xs text-gray-500">
          <input type="checkbox" v-model="upcomingOnly" class="rounded border-gray-300">
          Sólo próximas
        </label>
      </div>

      <div v-if="loading" class="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">Cargando…</div>
      <div v-else-if="trips.length === 0" class="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <p class="text-gray-700 font-semibold">Sin visitas</p>
        <p class="text-gray-400 text-sm mt-1">Crea una fecha para que los clientes puedan agendar.</p>
      </div>
      <div v-else class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr class="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th class="px-4 py-3">Fecha</th>
              <th class="px-4 py-3">Lugar</th>
              <th class="px-4 py-3">Horario</th>
              <th class="px-4 py-3 text-right">Reservas</th>
              <th class="px-4 py-3">Estado</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="trip in trips" :key="trip.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 font-medium text-gray-900">{{ formatDate(trip.trip_date) }}</td>
              <td class="px-4 py-3 text-gray-700">{{ trip.location }}</td>
              <td class="px-4 py-3 text-gray-500">
                {{ trip.start_time ? formatTime(trip.start_time) : '—' }}<template v-if="trip.end_time"> – {{ formatTime(trip.end_time) }}</template>
              </td>
              <td class="px-4 py-3 text-right">
                <NuxtLink
                  :to="`/app/admin/shopping-trips/${trip.id}`"
                  class="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  {{ trip.confirmed_bookings_count ?? 0 }}
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
                </NuxtLink>
              </td>
              <td class="px-4 py-3">
                <span :class="statusClass(trip.status)" class="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border">{{ statusLabel(trip.status) }}</span>
              </td>
              <td class="px-4 py-3 text-right whitespace-nowrap">
                <NuxtLink :to="`/app/admin/shopping-trips/${trip.id}`" class="text-indigo-600 font-medium hover:text-indigo-700 text-sm mr-3">Ver citas</NuxtLink>
                <button @click="openEdit(trip)" class="text-gray-600 font-medium hover:text-gray-900 text-sm mr-3">Editar</button>
                <button @click="confirmDelete(trip)" class="text-red-500 font-medium hover:text-red-600 text-sm">Eliminar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create / Edit Modal -->
    <TransitionRoot as="template" :show="modalOpen">
      <Dialog as="div" class="relative z-50" @close="closeModal">
        <TransitionChild as="template" enter="ease-out duration-200" enter-from="opacity-0" enter-to="opacity-100" leave="ease-in duration-150" leave-from="opacity-100" leave-to="opacity-0">
          <div class="fixed inset-0 bg-black/40" />
        </TransitionChild>
        <div class="fixed inset-0 overflow-y-auto">
          <div class="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
            <TransitionChild as="template" enter="ease-out duration-200" enter-from="opacity-0 translate-y-4 sm:scale-95" enter-to="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-150" leave-from="opacity-100" leave-to="opacity-0">
              <DialogPanel class="w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden">
                <div class="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                  <h3 class="text-lg font-semibold text-gray-900">{{ editingId ? 'Editar visita' : 'Crear visita' }}</h3>
                  <button @click="closeModal" class="p-1 rounded-full hover:bg-gray-200">
                    <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
                <form @submit.prevent="save" class="p-5 space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Lugar</label>
                    <input v-model="form.location" type="text" class="w-full rounded-xl border-gray-300 py-2.5 text-sm">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Fecha <span class="text-red-500">*</span></label>
                    <input v-model="form.trip_date" type="date" required class="w-full rounded-xl border-gray-300 py-2.5 text-sm">
                  </div>
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Hora inicio</label>
                      <input v-model="form.start_time" type="time" class="w-full rounded-xl border-gray-300 py-2.5 text-sm">
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Hora fin</label>
                      <input v-model="form.end_time" type="time" class="w-full rounded-xl border-gray-300 py-2.5 text-sm">
                    </div>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                    <select v-model="form.status" class="w-full rounded-xl border-gray-300 py-2.5 text-sm">
                      <option value="open">Abierta (los clientes pueden agendar)</option>
                      <option value="closed">Cerrada (oculta del calendario)</option>
                      <option value="completed">Completada</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Notas internas</label>
                    <textarea v-model="form.notes" rows="3" class="w-full rounded-xl border-gray-300 py-2.5 text-sm"></textarea>
                  </div>
                  <button type="submit" :disabled="saving" class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl disabled:opacity-60">
                    {{ saving ? 'Guardando…' : (editingId ? 'Guardar cambios' : 'Crear visita') }}
                  </button>
                </form>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>
  </section>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { Dialog, DialogPanel, TransitionChild, TransitionRoot } from '@headlessui/vue'

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin'],
})

const { $customFetch, $toast } = useNuxtApp()

const trips = ref([])
const loading = ref(true)
const status = ref('')
const upcomingOnly = ref(true)

const modalOpen = ref(false)
const editingId = ref(null)
const saving = ref(false)
const blankForm = () => ({
  location: 'Las Americas Premium Outlets',
  trip_date: '',
  start_time: '',
  end_time: '',
  status: 'open',
  notes: '',
})
const form = reactive(blankForm())

const statusOptions = [
  { value: '',          label: 'Todas' },
  { value: 'open',      label: 'Abiertas' },
  { value: 'closed',    label: 'Cerradas' },
  { value: 'completed', label: 'Completadas' },
]

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

function formatDate(d) {
  if (!d) return '—'
  // Accept both 'YYYY-MM-DD' and full ISO ('2026-05-25T00:00:00Z') —
  // the latter is what Laravel's default `date` cast emits.
  const datePart = String(d).substring(0, 10)
  const dt = new Date(datePart + 'T12:00')
  if (isNaN(dt.getTime())) return d
  return dt.toLocaleDateString('es-MX', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
}
function formatTime(t) {
  const [h, m] = t.split(':')
  const d = new Date(); d.setHours(+h, +m, 0)
  return d.toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit', hour12: true })
}

async function fetchTrips() {
  loading.value = true
  try {
    const res = await $customFetch('/admin/shopping-trips', {
      query: { status: status.value || undefined, upcoming_only: upcomingOnly.value ? 1 : undefined, per_page: 100 },
    })
    trips.value = res?.data?.data ?? []
  } catch (e) {
    console.error(e); $toast.error('No se pudo cargar')
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  Object.assign(form, blankForm())
  modalOpen.value = true
}

function openEdit(trip) {
  editingId.value = trip.id
  Object.assign(form, {
    location: trip.location,
    trip_date: trip.trip_date?.substring(0, 10) ?? '',
    start_time: trip.start_time?.substring(0, 5) ?? '',
    end_time: trip.end_time?.substring(0, 5) ?? '',
    status: trip.status,
    notes: trip.notes ?? '',
  })
  modalOpen.value = true
}

function closeModal() { modalOpen.value = false }

async function save() {
  saving.value = true
  try {
    const payload = {
      location: form.location || undefined,
      trip_date: form.trip_date,
      start_time: form.start_time || null,
      end_time: form.end_time || null,
      status: form.status,
      notes: form.notes || null,
    }
    if (editingId.value) {
      await $customFetch(`/admin/shopping-trips/${editingId.value}`, { method: 'PUT', body: payload })
      $toast.success('Visita actualizada')
    } else {
      await $customFetch('/admin/shopping-trips', { method: 'POST', body: payload })
      $toast.success('Visita creada')
    }
    closeModal()
    await fetchTrips()
  } catch (e) {
    console.error(e); $toast.error(e?.data?.message ?? 'Error al guardar')
  } finally {
    saving.value = false
  }
}

async function confirmDelete(trip) {
  if (!confirm(`¿Eliminar la visita del ${formatDate(trip.trip_date)}? Las solicitudes ya agendadas quedarán sin fecha.`)) return
  try {
    await $customFetch(`/admin/shopping-trips/${trip.id}`, { method: 'DELETE' })
    $toast.success('Visita eliminada')
    await fetchTrips()
  } catch (e) {
    console.error(e); $toast.error('No se pudo eliminar')
  }
}

watch([status, upcomingOnly], fetchTrips)
onMounted(fetchTrips)
</script>
