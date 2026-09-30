<template>
  <!-- One in-person reservation as an "event" for the team. Mounted by BOTH
       /app/shopping/in-person/[id] and /app/admin/in-person/[id]: `apiBase` picks the API namespace. -->
  <section class="min-h-screen bg-gray-50 pb-24">
    <div class="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-4">
      <NuxtLink :to="`${routeBase}/availability`" class="text-sm text-gray-500 hover:text-gray-800">← {{ t.back }}</NuxtLink>

      <div v-if="loading" class="flex justify-center py-16">
        <div class="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
      <p v-else-if="!r" class="text-center text-sm text-red-600 py-12">{{ t.loadError }}</p>

      <template v-else>
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div class="flex items-start justify-between gap-3">
            <h1 class="text-2xl font-extrabold font-mono text-gray-900">{{ r.reservation_number }}</h1>
            <span class="px-3 py-1 rounded-full text-xs font-semibold" :class="statusTone(r.status)">{{ statusLabel(r.status, language) }}</span>
          </div>

          <div class="mt-4 text-sm">
            <div class="text-base font-bold text-gray-900">{{ r.customer?.name }}</div>
            <div v-if="r.customer?.phone" class="text-gray-600">{{ r.customer.phone }}</div>
            <div class="text-gray-600 break-all">{{ r.customer?.email }}</div>
            <a v-if="waDigits" :href="`https://wa.me/${waDigits}`" target="_blank" rel="noopener"
              class="mt-2 inline-flex items-center px-3 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold">{{ t.whatsapp }}</a>
          </div>

          <dl class="mt-4 text-sm space-y-2">
            <div class="flex justify-between gap-3"><dt class="text-gray-500">{{ t.when }}</dt><dd class="font-semibold text-right">{{ longDate }} · {{ hoursRange(r.start_time, r.hours_reserved) }}</dd></div>
            <div class="flex justify-between gap-3"><dt class="text-gray-500">{{ t.place }}</dt><dd class="font-semibold text-right">{{ r.location || 'Las Américas Premium Outlets' }}</dd></div>
            <div class="flex justify-between gap-3"><dt class="text-gray-500">{{ t.hours }}</dt><dd class="font-semibold">{{ r.hours_reserved }} h</dd></div>
            <div class="flex justify-between gap-3"><dt class="text-gray-500">{{ t.paid }}</dt><dd class="font-semibold">{{ money(r.amount_usd) }} USD<span v-if="r.refunded_at"> · {{ t.refunded }}</span></dd></div>
          </dl>
          <div v-if="r.customer_notes" class="mt-4">
            <p class="text-xs text-gray-500">{{ t.notes }}</p>
            <p class="text-sm text-gray-800 whitespace-pre-line">{{ r.customer_notes }}</p>
          </div>
        </div>

        <div v-if="r.events?.length" class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 class="text-base font-bold text-gray-900 mb-4">{{ t.timeline }}</h2>
          <InPersonTimeline :events="r.events" />
        </div>

        <!-- Final billing -->
        <div v-if="r.final" class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-base font-bold text-gray-900">{{ t.finalTitle }}</h2>
            <span class="px-2.5 py-1 rounded-full text-xs font-semibold" :class="finalIsPaid(r.final) ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'">{{ finalStatusLabel(r.final.status, language) }}</span>
          </div>
          <InPersonBreakdown :b="breakdown" />
          <a v-if="r.final.invoice_url" :href="r.final.invoice_url" target="_blank" rel="noopener" class="block text-sm text-indigo-700 underline break-all">{{ t.invoiceLink }}</a>
          <p v-if="r.final.sent_at" class="text-xs text-gray-500">{{ t.sentAt }}: {{ formatPacific(r.final.sent_at, language) }}</p>
          <button v-if="r.final.status === 'pending' && !confirmingInvoice" @click="confirmingInvoice = true"
            class="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold">{{ t.generate }}</button>
          <div v-if="confirmingInvoice" class="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
            <p class="text-sm text-amber-900">{{ t.generateConfirm(money(r.final.total_usd)) }}</p>
            <div class="flex gap-2">
              <button @click="confirmingInvoice = false" class="flex-1 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700">{{ t.back2 }}</button>
              <button @click="generateInvoice" :disabled="busy" class="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-60">{{ t.generate }}</button>
            </div>
          </div>
        </div>

        <!-- Actions on a confirmed reservation -->
        <div v-if="r.status === 'confirmed'" class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <div v-if="!mode" class="flex gap-2">
            <button @click="mode = 'complete'" class="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">{{ t.complete }}</button>
            <button @click="mode = 'cancel'" class="flex-1 py-2.5 rounded-xl border border-red-300 text-red-700 font-semibold hover:bg-red-50">{{ t.cancelRes }}</button>
          </div>

          <form v-else-if="mode === 'cancel'" @submit.prevent="submitCancel" class="space-y-3">
            <p class="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">{{ t.cancelWarn }}</p>
            <p v-if="r.stripe_payment_intent_id" class="text-xs text-gray-600">{{ t.stripeId }}: <span class="font-mono break-all">{{ r.stripe_payment_intent_id }}</span></p>
            <label class="block text-sm font-medium text-gray-700">{{ t.reason }} <span class="text-red-500">*</span></label>
            <textarea v-model="form.reason" rows="3" required class="w-full rounded-xl border-gray-300 text-sm"></textarea>
            <div class="flex gap-2">
              <button type="button" @click="mode = null" class="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700">{{ t.back2 }}</button>
              <button type="submit" :disabled="busy || !form.reason.trim()" class="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-60">{{ t.cancelRes }}</button>
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
            <div v-if="form.hours !== '' && form.spent !== ''" class="p-3 rounded-xl bg-gray-50">
              <p class="text-xs text-gray-500 mb-2">{{ t.preview }}</p>
              <InPersonBreakdown :b="preview" />
            </div>
            <div class="flex gap-2">
              <button type="button" @click="mode = null" class="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700">{{ t.back2 }}</button>
              <button type="submit" :disabled="busy || form.hours === '' || form.spent === ''" class="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-60">{{ t.complete }}</button>
            </div>
          </form>
        </div>
      </template>
    </div>
  </section>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { parseDate, hoursRange, whatsappDigits } from '~/utils/inPersonSlots'
import { money, computeFinal, statusLabel, statusTone, finalStatusLabel, finalIsPaid, formatPacific } from '~/utils/inPersonReservation'

// '/admin' or '/shopping': same controller behind both, only the gate differs.
const props = defineProps({
  apiBase: { type: String, default: '/shopping' },
  id: { type: [String, Number], required: true },
})

const { $customFetch, $toast } = useNuxtApp()
const { t: createTranslations, language } = useLanguage()

const t = createTranslations({
  back: { es: 'Visitas en persona', en: 'In-person visits' },
  back2: { es: 'Volver', en: 'Back' },
  loadError: { es: 'No se pudo cargar la reserva', en: 'Could not load the reservation' },
  whatsapp: { es: 'Escribir por WhatsApp', en: 'Message on WhatsApp' },
  when: { es: 'Cuándo (hora de California)', en: 'When (California time)' },
  place: { es: 'Lugar', en: 'Place' },
  hours: { es: 'Horas reservadas', en: 'Hours reserved' },
  paid: { es: 'Reserva pagada', en: 'Reservation paid' },
  refunded: { es: 'reembolsada', en: 'refunded' },
  notes: { es: 'Notas del cliente', en: 'Customer notes' },
  timeline: { es: 'Historial', en: 'Timeline' },
  finalTitle: { es: 'Cobro final', en: 'Final billing' },
  invoiceLink: { es: 'Ver factura en Stripe', en: 'View invoice in Stripe' },
  sentAt: { es: 'Enviado', en: 'Sent' },
  generate: { es: 'Generar cobro final', en: 'Generate final invoice' },
  generateConfirm: { es: (total) => `Se enviará al cliente un cobro por ${total} USD. ¿Confirmas?`, en: (total) => `The customer will be sent an invoice for ${total} USD. Confirm?` },
  complete: { es: 'Marcar completada', en: 'Mark completed' },
  cancelRes: { es: 'Cancelar reserva', en: 'Cancel reservation' },
  cancelWarn: { es: 'Se le enviará un correo al cliente. El reembolso se acuerda por WhatsApp y se hace manualmente en Stripe.', en: 'The customer will be emailed. Refunds are agreed over WhatsApp and done manually in Stripe.' },
  stripeId: { es: 'Pago en Stripe', en: 'Stripe payment' },
  reason: { es: 'Motivo de la cancelación', en: 'Cancellation reason' },
  hoursWorked: { es: 'Horas trabajadas', en: 'Hours worked' },
  amountSpent: { es: 'Total gastado (USD)', en: 'Total spent (USD)' },
  preview: { es: 'Cobro final resultante', en: 'Resulting final charge' },
  cancelled: { es: 'Reserva cancelada', en: 'Reservation cancelled' },
  completed: { es: 'Reserva completada', en: 'Reservation completed' },
  invoiceSent: { es: 'Cobro final generado', en: 'Final invoice generated' },
  actionError: { es: 'No se pudo completar la acción', en: 'Could not complete the action' },
})

const routeBase = computed(() => `/app${props.apiBase}`)
const r = ref(null)
const loading = ref(true)
const busy = ref(false)
const mode = ref(null)
const confirmingInvoice = ref(false)
const form = reactive({ reason: '', hours: '', spent: '' })

const waDigits = computed(() => whatsappDigits(r.value?.customer?.phone))
const longDate = computed(() => parseDate(r.value.date).toLocaleDateString(language.value === 'es' ? 'es-MX' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }))
const preview = computed(() => computeFinal(form.hours, form.spent))
const breakdown = computed(() => {
  const f = r.value.final
  return { hours: f.hours_worked, spent: f.amount_spent_usd, hoursFee: f.hours_fee_usd, commission: f.commission_usd, credit: f.credit_usd, total: f.total_usd }
})

async function load() {
  try {
    const res = await $customFetch(`${props.apiBase}/in-person/reservations/${props.id}`)
    r.value = res?.data ?? null
  } catch (e) {
    console.error(e); $toast.error(e?.data?.message ?? t.value.loadError)
  } finally {
    loading.value = false
  }
}

// One place for every action: call, toast, refresh, show the API's 422 message.
async function act(path, body, okMsg) {
  busy.value = true
  try {
    await $customFetch(`${props.apiBase}/in-person/reservations/${props.id}/${path}`, { method: 'POST', body })
    $toast.success(okMsg)
    mode.value = null; confirmingInvoice.value = false
    Object.assign(form, { reason: '', hours: '', spent: '' })
    await load()
  } catch (e) {
    console.error(e); $toast.error(e?.data?.message ?? t.value.actionError)
  } finally {
    busy.value = false
  }
}
const submitCancel = () => act('cancel', { reason: form.reason.trim() }, t.value.cancelled)
const submitComplete = () => act('complete', { hours_worked: Number(form.hours), amount_spent_usd: Number(form.spent) }, t.value.completed)
const generateInvoice = () => act('final-invoice', undefined, t.value.invoiceSent)

onMounted(load)
</script>
