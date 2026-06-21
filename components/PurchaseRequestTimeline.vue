<!-- components/PurchaseRequestTimeline.vue
     Customer-facing progress for an assisted (online) purchase request, so the
     shopper understands exactly how Boxly proceeds after they submit. -->
<template>
  <div class="bg-white rounded-2xl border border-gray-200 overflow-hidden">
    <div class="px-4 sm:px-6 py-4 border-b border-gray-200">
      <h2 class="text-lg font-semibold text-gray-900">{{ t.title }}</h2>
    </div>

    <div class="p-4 sm:p-6">
      <!-- Cancelled / rejected note -->
      <div v-if="ended" class="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm font-semibold text-red-700">
        {{ request.status === 'rejected' ? t.rejected : t.cancelled }}
      </div>

      <div class="relative">
        <div class="absolute left-4 top-1 bottom-1 w-0.5 bg-gray-200" aria-hidden="true"></div>

        <div class="space-y-6 relative">
          <div v-for="(step, i) in steps" :key="step.key" class="flex items-start gap-4">
            <div class="relative flex-shrink-0">
              <div :class="['w-8 h-8 rounded-full flex items-center justify-center', dotBg(i)]">
                <svg v-if="state(i) === 'done'" class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="i === steps.length - 1 ? 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' : 'M5 13l4 4L19 7'"/>
                </svg>
                <div v-else-if="state(i) === 'active'" class="w-3 h-3 rounded-full bg-amber-400 animate-pulse"></div>
                <div v-else class="w-3 h-3 rounded-full bg-white"></div>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <p :class="['text-sm font-medium', state(i) === 'pending' ? 'text-gray-500' : 'text-gray-900']">{{ step.label }}</p>
              <p v-if="i === 0 && request.created_at" class="text-xs text-gray-600 mt-0.5">{{ formatDate(request.created_at) }}</p>
              <p v-else-if="state(i) === 'active'" class="text-xs text-amber-600 mt-0.5">{{ step.active }}</p>
              <p v-else-if="state(i) === 'done'" class="text-xs text-gray-600 mt-0.5">{{ step.done }}</p>
              <p v-else class="text-xs text-gray-400 mt-0.5">{{ t.pending }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ request: { type: Object, required: true } })

const user = useUser().value
const { t: createTranslations } = useLanguage()

// The active step index per PR status (steps before it = done, after = pending).
const STATUS_STEP = {
  pending_review: 1,   // reviewing availability
  quoted: 3,           // quote sent → awaiting approval
  awaiting_deposit: 3, // awaiting approval/payment
  paid: 4,             // approved → purchasing
  purchased: 5,        // bought → in transit
}
const ended = computed(() => ['rejected', 'cancelled'].includes(props.request.status))
const currentIndex = computed(() => ended.value ? -1 : (STATUS_STEP[props.request.status] ?? 1))

function state(i) {
  if (i < currentIndex.value) return 'done'
  if (i === currentIndex.value) return 'active'
  return i === 0 ? 'done' : 'pending' // step 0 (received) is always done
}
function dotBg(i) {
  const s = state(i)
  if (s === 'pending') return 'bg-gray-200'
  if (i === steps.value.length - 1) return 'bg-green-600' // delivered = green
  return 'bg-primary-600'
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString(user?.preferred_language === 'es' ? 'es-MX' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const translations = {
  title: { es: 'Progreso de tu solicitud', en: 'Your request progress' },
  pending: { es: 'Pendiente', en: 'Pending' },
  rejected: { es: 'Esta solicitud fue rechazada.', en: 'This request was rejected.' },
  cancelled: { es: 'Esta solicitud fue cancelada.', en: 'This request was cancelled.' },

  s0: { es: 'Solicitud recibida', en: 'Request received' },
  s0d: { es: 'Recibimos tu solicitud', en: 'We received your request' },
  s1: { es: 'Revisando disponibilidad', en: 'Checking availability' },
  s1a: { es: 'Confirmamos precio y existencia en la tienda', en: 'Confirming price and stock at the store' },
  s1d: { es: 'Disponibilidad confirmada', en: 'Availability confirmed' },
  s2: { es: 'Cotización lista', en: 'Quote ready' },
  s2a: { es: 'Preparando tu cotización (producto + comisión + envío)', en: 'Preparing your quote (product + fee + shipping)' },
  s2d: { es: 'Te enviamos la cotización', en: 'We sent you the quote' },
  s3: { es: 'Esperando tu aprobación', en: 'Awaiting your approval' },
  s3a: { es: 'Aprueba y paga la cotización para que compremos', en: 'Approve and pay the quote so we can buy' },
  s3d: { es: 'Cotización aprobada', en: 'Quote approved' },
  s4: { es: 'Compra realizada', en: 'Purchase made' },
  s4a: { es: 'Boxly está comprando tus productos en EE.UU.', en: 'Boxly is buying your products in the U.S.' },
  s4d: { es: 'Compramos tus productos', en: 'We bought your products' },
  s5: { es: 'En tránsito a México', en: 'In transit to Mexico' },
  s5a: { es: 'En camino — importando y enviando a tu puerta', en: 'On the way — importing and shipping to your door' },
  s5d: { es: 'En camino a México', en: 'On the way to Mexico' },
  s6: { es: 'Entregado', en: 'Delivered' },
}
const t = createTranslations(translations)

const steps = computed(() => [
  { key: 'received',  label: t.value.s0, active: t.value.s0d, done: t.value.s0d },
  { key: 'review',    label: t.value.s1, active: t.value.s1a, done: t.value.s1d },
  { key: 'quote',     label: t.value.s2, active: t.value.s2a, done: t.value.s2d },
  { key: 'approval',  label: t.value.s3, active: t.value.s3a, done: t.value.s3d },
  { key: 'purchased', label: t.value.s4, active: t.value.s4a, done: t.value.s4d },
  { key: 'transit',   label: t.value.s5, active: t.value.s5a, done: t.value.s5d },
  { key: 'delivered', label: t.value.s6, active: '', done: '' },
])
</script>

<style scoped>
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
.animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
</style>
