<!-- components/admin/AdminOrderModalConsolidate.vue -->
<template>
  <TransitionRoot as="template" :show="show">
    <Dialog as="div" class="relative z-50" @close="$emit('close')">
      <TransitionChild
        as="template"
        enter="ease-out duration-300"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-200"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />
      </TransitionChild>

      <div class="fixed inset-0 z-10 overflow-y-auto">
        <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <TransitionChild
            as="template"
            enter="ease-out duration-300"
            enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enter-to="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leave-from="opacity-100 translate-y-0 sm:scale-100"
            leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <DialogPanel class="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
              <!-- Header -->
              <div class="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <DialogTitle class="text-lg font-semibold text-gray-900">
                      {{ t.title }}
                    </DialogTitle>
                    <p class="text-sm text-gray-500">{{ order?.order_number }}</p>
                  </div>
                </div>
              </div>

              <!-- Body -->
              <div class="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
                <!-- Info Banner -->
                <div
                  class="rounded-xl p-4 border"
                  :class="form.payment_method === 'stripe'
                    ? 'bg-indigo-50 border-indigo-200'
                    : 'bg-purple-50 border-purple-200'"
                >
                  <div class="flex items-start gap-3">
                    <svg
                      class="w-5 h-5 flex-shrink-0 mt-0.5"
                      :class="form.payment_method === 'stripe' ? 'text-indigo-500' : 'text-purple-500'"
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p
                        class="text-sm font-medium"
                        :class="form.payment_method === 'stripe' ? 'text-indigo-800' : 'text-purple-800'"
                      >
                        {{ t.infoTitle }}
                      </p>
                      <p
                        class="text-sm mt-1"
                        :class="form.payment_method === 'stripe' ? 'text-indigo-600' : 'text-purple-600'"
                      >
                        {{ form.payment_method === 'stripe' ? t.infoDescStripe : t.infoDescManual }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Box Selection Section -->
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <label class="block text-sm font-medium text-gray-700">{{ t.boxes }}</label>
                    <button
                      @click="addBox"
                      type="button"
                      class="text-xs text-primary-600 hover:text-primary-800 font-medium flex items-center gap-1"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                      </svg>
                      {{ t.addBox }}
                    </button>
                  </div>

                  <!-- Loading Products -->
                  <div v-if="loadingProducts" class="py-4 text-center">
                    <svg class="animate-spin h-6 w-6 text-primary-500 mx-auto" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <p class="text-sm text-gray-500 mt-2">{{ t.loadingProducts }}</p>
                  </div>

                  <!-- No Shipping Products Available -->
                  <div v-else-if="shippingProducts.length === 0" class="py-4 text-center border-2 border-dashed border-gray-200 rounded-xl">
                    <svg class="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                    </svg>
                    <p class="text-sm text-gray-500">{{ t.noShippingProducts }}</p>
                  </div>

                  <!-- Box Entries -->
                  <div v-else class="space-y-3">
                    <div
                      v-for="(box, index) in form.boxes"
                      :key="index"
                      class="flex items-start gap-2 p-3 bg-gray-50 rounded-lg"
                    >
                      <div class="flex-1">
                        <select
                          v-model="box.stripe_price_id"
                          class="w-full border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm"
                        >
                          <option value="" disabled>{{ t.selectBoxSize }}</option>
                          <option v-for="prod in shippingProducts" :key="prod.id" :value="prod.price_id">
                            {{ prod.name }} - ${{ prod.price }} {{ prod.currency }}
                          </option>
                        </select>
                      </div>
                      <div class="w-20">
                        <input
                          v-model.number="box.quantity"
                          type="number"
                          min="1"
                          max="10"
                          class="w-full border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm text-center"
                          placeholder="Qty"
                        >
                      </div>
                      <button
                        v-if="form.boxes.length > 1"
                        @click="removeBox(index)"
                        type="button"
                        class="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    </div>
                  </div>

                  <!-- Price Summary (100% Payment) -->
                  <div v-if="totalBoxPrice > 0" class="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600">{{ t.totalBoxPrice }}:</span>
                      <span class="font-semibold text-gray-900">${{ totalBoxPrice.toFixed(2) }} MXN</span>
                    </div>
                    <div class="flex justify-between text-sm mt-1">
                      <span class="text-purple-700 font-medium">{{ t.invoiceAmount }} (100%):</span>
                      <span class="font-bold text-purple-700">${{ totalBoxPrice.toFixed(2) }} MXN</span>
                    </div>
                  </div>
                </div>

                <!-- Planned Ship Date (schedules the order onto the Operations Board) -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">{{ t.shipDate }}</label>
                  <input
                    v-model="form.planned_ship_date"
                    type="date"
                    :min="todayStr"
                    class="w-full border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm"
                  >
                  <p class="text-xs text-gray-500 mt-1">{{ t.shipDateHelp }}</p>
                </div>

                <!-- Payment Method Selection -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-3">{{ t.paymentMethod }}</label>
                  <div class="grid grid-cols-2 gap-3">
                    <!-- Stripe Option -->
                    <button
                      type="button"
                      @click="form.payment_method = 'stripe'"
                      class="relative p-4 rounded-xl border-2 transition-all text-left"
                      :class="form.payment_method === 'stripe'
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'"
                    >
                      <div class="flex items-center gap-3">
                        <div
                          class="w-10 h-10 rounded-lg flex items-center justify-center"
                          :class="form.payment_method === 'stripe' ? 'bg-indigo-100' : 'bg-gray-100'"
                        >
                          <svg class="w-5 h-5" :class="form.payment_method === 'stripe' ? 'text-indigo-600' : 'text-gray-500'" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
                          </svg>
                        </div>
                        <div>
                          <p class="text-sm font-semibold" :class="form.payment_method === 'stripe' ? 'text-indigo-900' : 'text-gray-900'">
                            {{ t.stripePayment }}
                          </p>
                          <p class="text-xs" :class="form.payment_method === 'stripe' ? 'text-indigo-600' : 'text-gray-500'">
                            {{ t.stripeDesc }}
                          </p>
                        </div>
                      </div>
                      <div
                        v-if="form.payment_method === 'stripe'"
                        class="absolute top-2 right-2 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center"
                      >
                        <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                        </svg>
                      </div>
                    </button>

                    <!-- Manual Transfer Option (NU Bank - Purple) -->
                    <button
                      type="button"
                      @click="form.payment_method = 'manual_transfer'"
                      class="relative p-4 rounded-xl border-2 transition-all text-left"
                      :class="form.payment_method === 'manual_transfer'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'"
                    >
                      <div class="flex items-center gap-3">
                        <div
                          class="w-10 h-10 rounded-lg flex items-center justify-center"
                          :class="form.payment_method === 'manual_transfer' ? 'bg-purple-100' : 'bg-gray-100'"
                        >
                          <svg class="w-5 h-5" :class="form.payment_method === 'manual_transfer' ? 'text-purple-600' : 'text-gray-500'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                          </svg>
                        </div>
                        <div>
                          <p class="text-sm font-semibold" :class="form.payment_method === 'manual_transfer' ? 'text-purple-900' : 'text-gray-900'">
                            {{ t.manualTransfer }}
                          </p>
                          <p class="text-xs" :class="form.payment_method === 'manual_transfer' ? 'text-purple-600' : 'text-gray-500'">
                            {{ t.manualDesc }}
                          </p>
                        </div>
                      </div>
                      <div
                        v-if="form.payment_method === 'manual_transfer'"
                        class="absolute top-2 right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center"
                      >
                        <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                        </svg>
                      </div>
                    </button>
                  </div>
                </div>

                <!-- Bank Details (shown when manual transfer is selected) -->
                <div v-if="form.payment_method === 'manual_transfer'" class="bg-purple-50 rounded-xl p-4 border border-purple-200">
                  <div class="flex items-center gap-2 mb-3">
                    <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                    </svg>
                    <p class="text-sm font-semibold text-purple-800">{{ t.bankDetailsTitle }}</p>
                  </div>
                  <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                      <span class="text-purple-700">{{ t.beneficiary }}:</span>
                      <span class="font-medium text-purple-900">Erick Martos Ayala</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-purple-700">{{ t.bank }}:</span>
                      <span class="font-medium text-purple-900">HSBC México</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-purple-700">{{ t.accountNumber }}:</span>
                      <span class="font-mono font-medium text-purple-900">6602161461</span>
                    </div>
                  </div>
                  <p class="font-medium text-purple-600 mt-3">CLABE: 021028066021614616</p>
                </div>

                <!-- Customer Info -->
                <div class="bg-gray-50 rounded-xl p-4">
                  <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    {{ t.customerWillBeNotified }}
                  </p>
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span class="text-sm font-bold text-gray-600">{{ order?.user?.name?.charAt(0) || '?' }}</span>
                    </div>
                    <div>
                      <p class="font-medium text-gray-900">{{ order?.user?.name }}</p>
                      <p class="text-sm text-gray-500">{{ order?.user?.email }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Footer -->
              <div class="bg-gray-50 px-6 py-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-gray-200">
                <button
                  type="button"
                  @click="$emit('close')"
                  :disabled="processing"
                  class="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-50"
                >
                  {{ t.cancel }}
                </button>
                <button
                  type="button"
                  @click="handleConfirm"
                  :disabled="processing || !isValid"
                  class="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  :class="form.payment_method === 'stripe'
                    ? 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
                    : 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500'"
                >
                  <svg v-if="processing" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {{ processing ? t.processing : (form.payment_method === 'stripe' ? t.confirmStripe : t.confirmManual) }}
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  order: { type: Object, default: null },
  // Optional prefilled ship date (e.g. when opened by dropping a card on a day)
  defaultShipDate: { type: String, default: '' },
})

const emit = defineEmits(['close', 'success'])

const { $customFetch, $toast } = useNuxtApp()
const { t: createTranslations } = useLanguage()

const processing = ref(false)
const loadingProducts = ref(false)
const products = ref([])

const form = ref({
  boxes: [{ stripe_price_id: '', quantity: 1 }],
  payment_method: 'stripe',
  planned_ship_date: '',
})

// Min selectable date = today (no scheduling in the past)
const todayStr = computed(() => {
  const d = new Date()
  const tz = d.getTimezoneOffset() * 60000
  return new Date(d - tz).toISOString().slice(0, 10)
})

const translations = {
  title: { es: 'Consolidar Orden', en: 'Consolidate Order' },
  infoTitle: { es: 'Paquetes Listos para Consolidar', en: 'Packages Ready to Consolidate' },
  infoDescStripe: { es: 'El cliente recibirá una factura de Stripe por el 100% del total para pagar antes del envío.', en: 'Customer will receive a Stripe invoice for 100% of the total to pay before shipping.' },
  infoDescManual: { es: 'El cliente recibirá los datos bancarios para transferir el 100% del total. Deberás marcar el pago manualmente.', en: 'Customer will receive bank details to transfer 100% of the total. You will need to manually mark as paid.' },
  boxes: { es: 'Cajas', en: 'Boxes' },
  addBox: { es: 'Agregar Caja', en: 'Add Box' },
  selectBoxSize: { es: 'Seleccionar tamaño...', en: 'Select box size...' },
  loadingProducts: { es: 'Cargando productos...', en: 'Loading products...' },
  noShippingProducts: { es: 'No hay productos de envío disponibles', en: 'No shipping products available' },
  totalBoxPrice: { es: 'Precio Total de Cajas', en: 'Total Box Price' },
  invoiceAmount: { es: 'Monto a Pagar', en: 'Amount Due' },
  shipDate: { es: 'Fecha de Envío', en: 'Ship Date' },
  shipDateHelp: { es: 'Día en que se enviará la caja. Aparecerá en el Tablero de Operaciones.', en: 'Day the box will ship. Appears on the Operations Board.' },
  paymentMethod: { es: 'Metodo de Pago', en: 'Payment Method' },
  stripePayment: { es: 'Pago con Stripe', en: 'Stripe Payment' },
  stripeDesc: { es: 'Factura electronica', en: 'Electronic invoice' },
  manualTransfer: { es: 'Transferencia', en: 'Bank Transfer' },
  manualDesc: { es: 'Deposito directo', en: 'Direct deposit' },
  bankDetailsTitle: { es: 'Datos Bancarios (se enviaran al cliente)', en: 'Bank Details (will be sent to customer)' },
  beneficiary: { es: 'Beneficiario', en: 'Beneficiary' },
  bank: { es: 'Banco', en: 'Bank' },
  accountNumber: { es: 'No. de Cuenta', en: 'Account Number' },
  bankDetailsNote: { es: 'El cliente recibirá estos datos por correo para realizar la transferencia.', en: 'Customer will receive these details by email to make the transfer.' },
  customerWillBeNotified: { es: 'Se notificará al cliente', en: 'Customer will be notified' },
  cancel: { es: 'Cancelar', en: 'Cancel' },
  confirmStripe: { es: 'Consolidar y Facturar', en: 'Consolidate & Invoice' },
  confirmManual: { es: 'Consolidar y Enviar Datos', en: 'Consolidate & Send Details' },
  processing: { es: 'Procesando...', en: 'Processing...' },
  successStripe: { es: 'Orden consolidada y factura enviada', en: 'Order consolidated and invoice sent' },
  successManual: { es: 'Orden consolidada y datos bancarios enviados', en: 'Order consolidated and bank details sent' },
  error: { es: 'Error al consolidar la orden', en: 'Error consolidating order' },
}

const t = createTranslations(translations)

// Filter products to only show shipping products
const shippingProducts = computed(() => {
  return products.value.filter(p => p.shipping === 'true' || p.shipping === true)
})

// Reset form when modal opens
watch(() => props.show, (newVal) => {
  if (newVal) {
    form.value = {
      boxes: [{ stripe_price_id: '', quantity: 1 }],
      payment_method: 'stripe',
      planned_ship_date: props.defaultShipDate || '',
    }
  }
})

// Calculate total box price
const totalBoxPrice = computed(() => {
  return form.value.boxes.reduce((total, box) => {
    const product = shippingProducts.value.find(p => p.price_id === box.stripe_price_id)
    if (product) {
      return total + (product.price * (box.quantity || 1))
    }
    return total
  }, 0)
})

const isValid = computed(() => {
  const hasValidBoxes = form.value.boxes.every(box => box.stripe_price_id && box.quantity >= 1)
  const hasAtLeastOneBox = form.value.boxes.length > 0
  const hasShipDate = !!form.value.planned_ship_date
  return hasValidBoxes && hasAtLeastOneBox && hasShipDate
})

const addBox = () => {
  form.value.boxes.push({ stripe_price_id: '', quantity: 1 })
}

const removeBox = (index) => {
  if (form.value.boxes.length > 1) {
    form.value.boxes.splice(index, 1)
  }
}

const fetchProducts = async () => {
  loadingProducts.value = true
  try {
    const res = await $customFetch('/products')
    products.value = res.data
  } catch (e) {
    console.error(e)
  } finally {
    loadingProducts.value = false
  }
}

const handleConfirm = async () => {
  if (!props.order || !isValid.value) return

  processing.value = true
  try {
    await $customFetch(`/admin/orders/${props.order.id}/consolidate`, {
      method: 'POST',
      body: {
        boxes: form.value.boxes,
        payment_method: form.value.payment_method,
        planned_ship_date: form.value.planned_ship_date
      }
    })

    const successMsg = form.value.payment_method === 'stripe'
      ? t.value.successStripe
      : t.value.successManual
    $toast.success(successMsg)
    emit('success')
  } catch (error) {
    console.error('Error:', error)
    $toast.error(error.data?.message || t.value.error)
  } finally {
    processing.value = false
  }
}

onMounted(() => {
  fetchProducts()
})
</script>
