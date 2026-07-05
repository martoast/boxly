<!-- components/admin/AdminOrderModalMarkPaid.vue -->
<template>
  <TransitionRoot :show="show" as="template">
    <Dialog class="relative z-50" @close="$emit('close')">
      <div class="fixed inset-0 bg-black/30 backdrop-blur-sm" />
      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <DialogPanel class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div class="flex items-center gap-3 mb-4">
              <div class="p-2 bg-green-100 rounded-full">
                <svg class="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <DialogTitle class="text-lg font-semibold">{{ t.title }}</DialogTitle>
            </div>

            <p class="text-sm text-gray-600 mb-4">
              {{ t.confirmText }} <strong>{{ order?.order_number }}</strong>
            </p>

            <!-- Context Info -->
            <div class="bg-gray-50 rounded-lg p-4 mb-6">
              <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{{ t.paymentInfo }}</p>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-600">{{ t.orderType }}:</span>
                  <span class="font-medium">{{ isCrossing ? t.crossingOnly : t.shipping }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">{{ t.paymentType }}:</span>
                  <span class="font-medium">{{ paymentTypeLabel }}</span>
                </div>

                <!-- Amount to be marked as paid -->
                <div v-if="paymentAmount" class="flex justify-between pt-2 border-t border-gray-200">
                  <span class="text-gray-900 font-semibold">{{ t.amount }}:</span>
                  <span class="font-bold text-green-600">${{ formatAmount(paymentAmount) }}</span>
                </div>
              </div>
            </div>

            <!-- Where was it paid? -->
            <div class="mb-6">
              <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{{ t.paidLocationLabel }}</label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="loc in paidLocations"
                  :key="loc"
                  type="button"
                  @click="paidLocation = loc"
                  :class="[
                    'px-3 py-2 rounded-lg text-sm font-medium border transition-colors',
                    paidLocation === loc
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  ]"
                >
                  {{ loc }}
                </button>
              </div>
            </div>

            <!-- Warning -->
            <div class="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-6">
              <div class="flex items-start gap-2">
                <svg class="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                <p class="text-xs text-orange-800">{{ t.warning }}</p>
              </div>
            </div>

            <div class="flex gap-3 justify-end">
              <button
                @click="$emit('close')"
                class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {{ t.cancel }}
              </button>
              <button
                @click="confirm"
                :disabled="processing || !paidLocation"
                class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                <svg v-if="processing" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                {{ t.confirmBtn }}
              </button>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionRoot } from '@headlessui/vue'

const props = defineProps(['show', 'order'])
const emit = defineEmits(['close', 'success'])
const { $customFetch, $toast } = useNuxtApp()
const { t: createTranslations } = useLanguage()

const processing = ref(false)

// Where the payment was received. Required before confirming.
const paidLocations = ['NU', 'HSBC', 'Stripe']
const paidLocation = ref('')

const isCrossing = computed(() => props.order?.order_type === 'crossing')

// All orders now use 100% full payment
const paymentTypeLabel = computed(() => t.value.fullPayment)

// Calculate the payment amount from boxes or box_price
const paymentAmount = computed(() => {
  if (!props.order) return null

  // Sum boxes if available
  if (props.order.boxes && props.order.boxes.length > 0) {
    return props.order.boxes.reduce((sum, box) => sum + parseFloat(box.box_price || 0), 0)
  }

  // Fallback to box_price
  return props.order.box_price
})

const formatAmount = (amount) => {
  if (!amount) return '0.00'
  const num = parseFloat(amount)
  return isNaN(num) ? '0.00' : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const translations = {
  title: { es: 'Confirmar Pago', en: 'Confirm Payment' },
  confirmText: { es: '¿Marcar manualmente esta orden como PAGADA?', en: 'Manually mark this order as PAID?' },
  paymentInfo: { es: 'Informacion del Pago', en: 'Payment Information' },
  orderType: { es: 'Tipo de Orden', en: 'Order Type' },
  crossingOnly: { es: 'Solo Cruce', en: 'Crossing Only' },
  shipping: { es: 'Envio', en: 'Shipping' },
  paymentType: { es: 'Tipo de Pago', en: 'Payment Type' },
  fullPayment: { es: 'Pago Completo (100%)', en: 'Full Payment (100%)' },
  amount: { es: 'Monto a Cobrar', en: 'Amount Due' },
  paidLocationLabel: { es: '¿Dónde se pagó?', en: 'Where was it paid?' },
  warning: { es: 'Se le enviara un correo al usuario confirmando su pago', en: 'The user will receive an email notifying them that the payment was received.' },
  cancel: { es: 'Cancelar', en: 'Cancel' },
  confirmBtn: { es: 'Confirmar Pagado', en: 'Confirm Paid' },
  success: { es: 'Orden marcada como pagada', en: 'Order marked as paid' },
  error: { es: 'Error al actualizar', en: 'Error updating' },
}

const t = createTranslations(translations)

const confirm = async () => {
  processing.value = true
  try {
    await $customFetch(`/admin/orders/${props.order.id}/mark-consolidation-paid`, {
      method: 'POST',
      body: { paid_location: paidLocation.value }
    })
    $toast.success(t.value.success)
    emit('success')
  } catch (err) {
    $toast.error(err.data?.message || t.value.error)
  } finally {
    processing.value = false
  }
}
</script>
