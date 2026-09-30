<template>
  <!-- Hourly availability for the Las Américas in-person shopping visits. Customers on
       /in-person only see the hours opened here. Mounted by BOTH
       /app/shopping/availability and /app/admin/availability: `apiBase` picks the API
       namespace, the controller behind it is the same. All times are Pacific ("hora de
       California"), sent and shown as local strings. -->
  <section class="min-h-screen bg-gray-50 pb-24">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="mb-4">
        <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900">{{ t.title }}</h1>
        <p class="text-sm text-gray-500 mt-1">{{ t.subtitle }}</p>
      </div>

      <!-- Week picker -->
      <div class="flex items-center gap-2 mb-4">
        <button @click="goWeek(-1)" class="p-2 rounded-lg bg-white border border-gray-200 hover:border-indigo-400" :aria-label="t.prevWeek">
          <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <button @click="goWeek(1)" class="p-2 rounded-lg bg-white border border-gray-200 hover:border-indigo-400" :aria-label="t.nextWeek">
          <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        </button>
        <button @click="goToday" class="px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:border-indigo-400">{{ t.today }}</button>
        <div class="ml-1 text-sm sm:text-base font-semibold text-gray-900">{{ weekLabel }}</div>
        <div class="ml-auto hidden sm:block text-xs text-gray-500">{{ t.tz }}</div>
      </div>

      <div v-if="blocked.length" class="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
        <p class="font-semibold">{{ t.blockedTitle }}</p>
        <ul class="mt-1 list-disc pl-5">
          <li v-for="b in blocked" :key="b.date + b.start_time">{{ formatDate(b.date) }} {{ formatTime(b.start_time, language) }} · {{ b.reservation_number }}</li>
        </ul>
      </div>

      <div v-if="loading" class="text-center py-12 text-gray-500 text-sm">{{ t.loading }}</div>
      <template v-else>
        <div v-if="!hasAny" class="mb-4 p-4 rounded-xl bg-white border border-dashed border-gray-300 text-sm text-gray-600">{{ t.empty }}</div>

        <!-- Desktop: Mon-Sun columns x hours -->
        <div class="hidden md:block bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div class="grid" style="grid-template-columns: 4.5rem repeat(7, minmax(0, 1fr))">
            <div class="border-b border-gray-200"></div>
            <button v-for="d in dates" :key="d" @click="dayToggle(d)" :title="t.dayHint"
              :class="['py-2 text-center border-b border-l border-gray-200 hover:bg-indigo-50', d === todayDate ? 'text-indigo-700' : 'text-gray-700']">
              <div class="text-xs uppercase font-semibold">{{ weekday(d) }}</div>
              <div class="text-lg font-bold leading-tight">{{ dayNumber(d) }}</div>
            </button>
            <template v-for="h in HOURS" :key="h">
              <div class="pr-2 text-right text-xs text-gray-500 h-9 leading-9 border-b border-gray-100">{{ formatTime(hourLabel(h), language) }}</div>
              <button v-for="d in dates" :key="d + h" @click="cellClick(d, h)"
                :class="['h-9 border-b border-l border-gray-100 text-xs font-semibold truncate px-1', cellClass(d, h)]">{{ cellText(d, h) }}</button>
            </template>
          </div>
        </div>

        <!-- Phone: day tabs, hours as big toggle buttons -->
        <div class="md:hidden">
          <div class="flex gap-1.5 overflow-x-auto pb-2">
            <button v-for="d in dates" :key="d" @click="tabDate = d"
              :class="['flex-shrink-0 w-12 py-2 rounded-xl border text-center', activeDate === d ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200']">
              <div class="text-[10px] uppercase font-semibold">{{ weekday(d) }}</div>
              <div class="text-base font-bold leading-tight">{{ dayNumber(d) }}</div>
            </button>
          </div>
          <button @click="dayToggle(activeDate)" class="w-full mb-3 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-indigo-700">{{ t.dayHint }}</button>
          <div class="space-y-2">
            <button v-for="h in HOURS" :key="h" @click="cellClick(activeDate, h)"
              :class="['w-full h-12 rounded-xl border text-sm font-semibold flex items-center justify-between px-4', cellClass(activeDate, h, true)]">
              <span>{{ formatTime(hourLabel(h), language) }}</span><span>{{ cellText(activeDate, h) }}</span>
            </button>
          </div>
        </div>

        <!-- Legend -->
        <div class="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-gray-500">
          <span><i class="inline-block w-3 h-3 rounded bg-indigo-500 align-middle"></i> {{ t.open }}</span>
          <span><i class="inline-block w-3 h-3 rounded bg-green-500 align-middle"></i> {{ t.booked }}</span>
          <span><i class="inline-block w-3 h-3 rounded bg-white border-2 border-indigo-400 align-middle"></i> {{ t.pending }}</span>
        </div>

        <!-- Copy week -->
        <div class="mt-6 bg-white rounded-2xl border border-gray-200 p-4 flex flex-wrap items-center gap-2">
          <span class="text-sm font-semibold text-gray-800 mr-2">{{ t.copyTitle }}</span>
          <button v-for="n in [2, 4, 8]" :key="n" @click="copyWeek(n)" :disabled="copying || changed.size > 0 || !hasAny"
            class="px-3 py-1.5 rounded-full border border-gray-200 text-sm text-gray-700 hover:border-indigo-400 disabled:opacity-50">{{ t.copyNext(n) }}</button>
          <span v-if="changed.size" class="text-xs text-gray-500">{{ t.saveFirst }}</span>
        </div>
      </template>
    </div>

    <!-- Unsaved changes bar -->
    <div v-if="changed.size" class="sticky bottom-0 z-30 bg-white border-t border-gray-200 px-4 py-3 shadow-lg">
      <div class="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <span class="text-sm font-semibold text-gray-800">{{ t.unsaved(changed.size) }}</span>
        <div class="flex gap-2">
          <button @click="changed = new Set()" class="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700">{{ t.discard }}</button>
          <button @click="save" :disabled="saving" class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold disabled:opacity-60">{{ saving ? t.saving : t.save }}</button>
        </div>
      </div>
    </div>

    <!-- Reservation drawer (bottom sheet on phones, side drawer on desktop) -->
    <TransitionRoot as="template" :show="!!selected">
      <Dialog as="div" class="relative z-50" @close="closeDrawer">
        <TransitionChild as="template" enter="ease-out duration-200" enter-from="opacity-0" enter-to="opacity-100" leave="ease-in duration-150" leave-from="opacity-100" leave-to="opacity-0">
          <div class="fixed inset-0 bg-black/40" />
        </TransitionChild>
        <div class="fixed inset-0 overflow-y-auto">
          <div class="flex min-h-full items-end sm:justify-end">
            <DialogPanel v-if="selected" class="w-full sm:max-w-md sm:min-h-screen bg-white rounded-t-2xl sm:rounded-none shadow-xl max-h-[92vh] sm:max-h-none overflow-y-auto">
              <div class="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-900">{{ t.reservation }} {{ selected.reservation_number }}</h3>
                <button @click="closeDrawer" class="p-1 rounded-full hover:bg-gray-200" :aria-label="t.close">
                  <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <div class="p-5 space-y-4 text-sm">
                <div>
                  <div class="text-base font-bold text-gray-900">{{ selected.customer?.name }}</div>
                  <div v-if="selected.customer?.phone" class="text-gray-600">{{ selected.customer.phone }}</div>
                  <div class="text-gray-600 break-all">{{ selected.customer?.email }}</div>
                  <a v-if="waDigits" :href="`https://wa.me/${waDigits}`" target="_blank" rel="noopener"
                    class="mt-2 inline-flex items-center px-3 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold">{{ t.whatsapp }}</a>
                </div>
                <dl class="grid grid-cols-2 gap-3">
                  <div class="col-span-2"><dt class="text-xs text-gray-500">{{ t.when }}</dt><dd class="font-semibold">{{ formatDate(selectedDate) }} · {{ hoursRange(selected.start_time, selected.hours_reserved) }}</dd></div>
                  <div><dt class="text-xs text-gray-500">{{ t.paid }}</dt><dd class="font-semibold">${{ selected.amount_usd }} USD</dd></div>
                  <div><dt class="text-xs text-gray-500">{{ t.status }}</dt><dd class="font-semibold">{{ selected.status }}<span v-if="selected.refunded_at"> · {{ t.refunded }}</span></dd></div>
                </dl>
                <div v-if="selected.customer_notes">
                  <div class="text-xs text-gray-500">{{ t.notes }}</div>
                  <p class="whitespace-pre-line text-gray-800">{{ selected.customer_notes }}</p>
                </div>

                <div v-if="selected.status === 'confirmed'" class="space-y-2 pt-2 border-t border-gray-100">
                  <div v-if="!mode" class="flex gap-2">
                    <button @click="mode = 'complete'" class="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">{{ t.complete }}</button>
                    <button @click="mode = 'cancel'" class="flex-1 py-2.5 rounded-xl border border-red-300 text-red-700 font-semibold hover:bg-red-50">{{ t.cancelRes }}</button>
                  </div>

                  <form v-else-if="mode === 'cancel'" @submit.prevent="submitCancel" class="space-y-3">
                    <p class="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">{{ t.cancelWarn }}</p>
                    <p v-if="selected.stripe_payment_intent_id" class="text-xs text-gray-600">{{ t.stripeId }}: <span class="font-mono break-all">{{ selected.stripe_payment_intent_id }}</span></p>
                    <label class="block text-sm font-medium text-gray-700">{{ t.reason }} <span class="text-red-500">*</span></label>
                    <textarea v-model="form.reason" rows="3" required class="w-full rounded-xl border-gray-300 text-sm"></textarea>
                    <div class="flex gap-2">
                      <button type="button" @click="mode = null" class="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700">{{ t.back }}</button>
                      <button type="submit" :disabled="busy || !form.reason.trim()" class="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-60">{{ t.cancelConfirm }}</button>
                    </div>
                  </form>

                  <form v-else @submit.prevent="submitComplete" class="space-y-3">
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">{{ t.hoursWorked }}</label>
                        <input v-model="form.hours" type="number" min="0" step="0.25" required class="w-full rounded-xl border-gray-300 text-sm">
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">{{ t.amountSpent }}</label>
                        <input v-model="form.spent" type="number" min="0" step="0.01" required class="w-full rounded-xl border-gray-300 text-sm">
                      </div>
                    </div>
                    <div class="flex gap-2">
                      <button type="button" @click="mode = null" class="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700">{{ t.back }}</button>
                      <button type="submit" :disabled="busy || form.hours === '' || form.spent === ''" class="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-60">{{ t.complete }}</button>
                    </div>
                  </form>
                </div>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>
  </section>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { Dialog, DialogPanel, TransitionChild, TransitionRoot } from '@headlessui/vue'
import {
  HOURS, hourLabel, cellKey, cellStates, effectiveOpen, toggleCell, toggleDay, slotsPayload, hoursRange,
  mondayOf, weekDates, addDays, nextMondays, pacificNow, parseDate, formatTime, whatsappDigits,
} from '~/utils/inPersonSlots'

// '/admin' or '/shopping': same controller behind both, only the gate differs.
const props = defineProps({
  apiBase: { type: String, default: '/shopping' },
})

const { $customFetch, $toast } = useNuxtApp()
const { t: createTranslations, language } = useLanguage()

const t = createTranslations({
  title: { es: 'Visitas en persona', en: 'In-person visits' },
  subtitle: { es: 'Abre las horas en las que puedes ir de compras en Las Américas. Los clientes solo ven estas horas.', en: 'Open the hours you can go shopping at Las Américas. Customers only see these hours.' },
  tz: { es: 'Todas las horas son hora de California', en: 'All times are California time' },
  prevWeek: { es: 'Semana anterior', en: 'Previous week' },
  nextWeek: { es: 'Semana siguiente', en: 'Next week' },
  today: { es: 'Hoy', en: 'Today' },
  loading: { es: 'Cargando horarios…', en: 'Loading hours…' },
  empty: { es: 'Aún no hay horarios. Abre tus horas disponibles o copia la semana pasada.', en: 'No hours yet. Open your available hours or copy last week.' },
  dayHint: { es: 'Abrir/cerrar 10:00–18:00 este día', en: 'Open/close 10:00–18:00 this day' },
  open: { es: 'Disponible', en: 'Open' },
  booked: { es: 'Reservada', en: 'Booked' },
  pending: { es: 'Cambio sin guardar', en: 'Unsaved change' },
  copyTitle: { es: 'Copiar esta semana a las próximas…', en: 'Copy this week to the next…' },
  saveFirst: { es: 'Guarda tus cambios primero.', en: 'Save your changes first.' },
  discard: { es: 'Descartar', en: 'Discard' },
  save: { es: 'Guardar', en: 'Save' },
  saving: { es: 'Guardando…', en: 'Saving…' },
  saved: { es: 'Horarios guardados', en: 'Hours saved' },
  blockedTitle: { es: 'No se guardó: estas horas tienen una reserva. Cancela la reserva primero.', en: 'Not saved: these hours have a reservation. Cancel the reservation first.' },
  reservation: { es: 'Reserva', en: 'Reservation' },
  close: { es: 'Cerrar', en: 'Close' },
  whatsapp: { es: 'Escribir por WhatsApp', en: 'Message on WhatsApp' },
  when: { es: 'Cuándo (hora de California)', en: 'When (California time)' },
  paid: { es: 'Pagado', en: 'Paid' },
  status: { es: 'Estado', en: 'Status' },
  refunded: { es: 'reembolsada', en: 'refunded' },
  notes: { es: 'Notas del cliente', en: 'Customer notes' },
  complete: { es: 'Marcar completada', en: 'Mark completed' },
  cancelRes: { es: 'Cancelar reserva', en: 'Cancel reservation' },
  cancelWarn: { es: 'Se le enviará un correo al cliente. El reembolso se acuerda por WhatsApp y se hace manualmente en Stripe.', en: 'The customer will be emailed. Refunds are agreed over WhatsApp and done manually in Stripe.' },
  stripeId: { es: 'Pago en Stripe', en: 'Stripe payment' },
  reason: { es: 'Motivo de la cancelación', en: 'Cancellation reason' },
  back: { es: 'Volver', en: 'Back' },
  cancelConfirm: { es: 'Cancelar reserva', en: 'Cancel reservation' },
  hoursWorked: { es: 'Horas trabajadas', en: 'Hours worked' },
  amountSpent: { es: 'Total gastado (USD)', en: 'Total spent (USD)' },
  cancelled: { es: 'Reserva cancelada', en: 'Reservation cancelled' },
  completed: { es: 'Reserva completada', en: 'Reservation completed' },
  loadError: { es: 'No se pudo cargar', en: 'Could not load' },
  saveError: { es: 'Error al guardar', en: 'Could not save' },
  unsaved: { es: (n) => `${n} cambios sin guardar`, en: (n) => `${n} unsaved changes` },
  copyNext: { es: (n) => `${n} semanas`, en: (n) => `${n} weeks` },
})

const locale = computed(() => (language.value === 'es' ? 'es-MX' : 'en-US'))

const today = () => pacificNow().date
const todayDate = ref(today())
const weekStart = ref(mondayOf(today()))
const tabDate = ref(null)
const slots = ref([])
const loading = ref(true)
const saving = ref(false)
const copying = ref(false)
const busy = ref(false)
const changed = ref(new Set())
const blocked = ref([])
const selected = ref(null)
const selectedDate = ref('')
const mode = ref(null)
const form = reactive({ reason: '', hours: '', spent: '' })

const dates = computed(() => weekDates(weekStart.value))
const activeDate = computed(() => (tabDate.value && dates.value.includes(tabDate.value) ? tabDate.value : dates.value.includes(todayDate.value) ? todayDate.value : dates.value[0]))
const states = computed(() => cellStates(slots.value, dates.value))
const slotByKey = computed(() => Object.fromEntries(slots.value.map((s) => [cellKey(s.date, s.start_time), s])))
const hasAny = computed(() => slots.value.length > 0)
const waDigits = computed(() => whatsappDigits(selected.value?.customer?.phone))

const fmt = (d, opts) => parseDate(d).toLocaleDateString(locale.value, opts)
const weekday = (d) => fmt(d, { weekday: 'short' })
const dayNumber = (d) => parseDate(d).getDate()
const formatDate = (d) => fmt(d, { weekday: 'short', month: 'short', day: 'numeric' })
const weekLabel = computed(() => `${fmt(dates.value[0], { day: 'numeric', month: 'short' })} – ${fmt(dates.value[6], { day: 'numeric', month: 'short', year: 'numeric' })}`)

function cellClass(d, h, phone = false) {
  const k = cellKey(d, hourLabel(h))
  const s = states.value[k]
  if (s === 'booked') return 'bg-green-500 text-white border-green-500'
  if (s === 'past') return 'bg-gray-50 text-gray-300 cursor-not-allowed border-gray-100'
  const isOn = effectiveOpen(s, k, changed.value)
  if (changed.value.has(k)) return isOn ? 'bg-white text-indigo-700 border-2 border-indigo-400' : 'bg-white text-gray-400 border-2 border-dashed border-gray-300'
  if (isOn) return 'bg-indigo-500 text-white border-indigo-500'
  return phone ? 'bg-white text-gray-500 border-gray-200' : 'bg-white hover:bg-indigo-50'
}
function cellText(d, h) {
  const k = cellKey(d, hourLabel(h))
  const s = states.value[k]
  if (s === 'booked') return slotByKey.value[k]?.reservation?.customer?.name?.split(' ')[0] ?? ''
  if (s === 'past') return ''
  return effectiveOpen(s, k, changed.value) ? '✓' : ''
}

function cellClick(d, h) {
  const k = cellKey(d, hourLabel(h))
  if (states.value[k] === 'booked') return openDrawer(slotByKey.value[k])
  changed.value = toggleCell(changed.value, states.value, k)
}
function dayToggle(d) { changed.value = toggleDay(changed.value, states.value, d, [10, 17]) }

async function fetchSlots() {
  loading.value = true
  try {
    const res = await $customFetch(`${props.apiBase}/in-person/slots`, { query: { from: dates.value[0], to: dates.value[6] } })
    slots.value = res?.data?.slots ?? []
  } catch (e) {
    console.error(e); $toast.error(e?.data?.message ?? t.value.loadError)
  } finally {
    loading.value = false
  }
}

function goWeek(n) {
  if (changed.value.size && !confirm(t.value.unsaved(changed.value.size) + '. ' + t.value.discard + '?')) return
  changed.value = new Set(); blocked.value = []
  weekStart.value = addDays(weekStart.value, 7 * n)
  fetchSlots()
}
function goToday() {
  if (changed.value.size && !confirm(t.value.unsaved(changed.value.size) + '. ' + t.value.discard + '?')) return
  changed.value = new Set(); blocked.value = []
  weekStart.value = mondayOf(today()); tabDate.value = null
  fetchSlots()
}

async function save() {
  saving.value = true; blocked.value = []
  try {
    await $customFetch(`${props.apiBase}/in-person/slots`, { method: 'PUT', body: slotsPayload(changed.value, states.value) })
    $toast.success(t.value.saved)
    changed.value = new Set()
    await fetchSlots()
  } catch (e) {
    console.error(e)
    blocked.value = e?.data?.booked ?? []
    $toast.error(e?.data?.message ?? t.value.saveError)
  } finally {
    saving.value = false
  }
}

async function copyWeek(n) {
  copying.value = true
  try {
    const res = await $customFetch(`${props.apiBase}/in-person/slots/copy-week`, {
      method: 'POST', body: { from_week_start: weekStart.value, weeks: nextMondays(weekStart.value, n) },
    })
    const skipped = res?.data?.skipped ?? []
    const msg = language.value === 'es'
      ? `Copiadas ${res?.data?.copied ?? 0} horas${skipped.length ? `; semanas omitidas: ${skipped.map((s) => s.week_start).join(', ')}` : ''}`
      : `Copied ${res?.data?.copied ?? 0} hours${skipped.length ? `; skipped weeks: ${skipped.map((s) => s.week_start).join(', ')}` : ''}`
    $toast.success(msg)
  } catch (e) {
    console.error(e); $toast.error(e?.data?.message ?? t.value.saveError)
  } finally {
    copying.value = false
  }
}

function openDrawer(slot) {
  if (!slot?.reservation) return
  selected.value = slot.reservation
  selectedDate.value = slot.date
  mode.value = null
  Object.assign(form, { reason: '', hours: '', spent: '' })
}
function closeDrawer() { selected.value = null }

async function act(path, body, okMsg) {
  busy.value = true
  try {
    await $customFetch(`${props.apiBase}/in-person/reservations/${selected.value.id}/${path}`, { method: 'POST', body })
    $toast.success(okMsg)
    closeDrawer()
    await fetchSlots()
  } catch (e) {
    console.error(e); $toast.error(e?.data?.message ?? t.value.saveError)
  } finally {
    busy.value = false
  }
}
const submitCancel = () => act('cancel', { reason: form.reason.trim() }, t.value.cancelled)
const submitComplete = () => act('complete', { hours_worked: Number(form.hours), amount_spent_usd: Number(form.spent) }, t.value.completed)

onMounted(fetchSlots)
</script>
