<template>
  <section class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20">
    <!-- Header -->
    <div class="bg-white/90 backdrop-blur-sm shadow-sm border-b border-gray-100">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <NuxtLink 
              :to="`/app/orders/${orderId}`" 
              class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
              </svg>
            </NuxtLink>
            <div>
              <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900">{{ t.editOrder }}</h1>
              <p class="text-sm text-gray-600 mt-1">{{ order?.order_number }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-16">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-primary-50 rounded-2xl">
          <svg class="animate-spin h-8 w-8 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>

      <!-- Status Warning Alert -->
      <Transition
        enter-active-class="transform ease-out duration-300 transition"
        enter-from-class="translate-y-2 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="order && !canEdit" class="mb-6 bg-amber-50 border-l-4 border-amber-500 rounded-lg p-4 shadow-sm">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="w-5 h-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
              </svg>
            </div>
            <div class="ml-3 flex-1">
              <h3 class="text-sm font-medium text-amber-800">{{ t.cannotEditTitle }}</h3>
              <p class="text-sm text-amber-700 mt-1">{{ t.cannotEditMessage }}</p>
              <p class="text-xs text-amber-600 mt-2">{{ t.currentStatus }}: <span class="font-medium">{{ getStatusLabel(order.status) }}</span></p>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Error Alert -->
      <Transition
        enter-active-class="transform ease-out duration-300 transition"
        enter-from-class="translate-y-2 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="errorMessage" class="mb-6 bg-red-50 border-l-4 border-red-500 rounded-lg p-4 shadow-sm animate-shake">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="w-5 h-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
              </svg>
            </div>
            <div class="ml-3 flex-1">
              <p class="text-sm font-medium text-red-800">{{ errorMessage }}</p>
            </div>
            <button @click="errorMessage = ''" class="ml-3 flex-shrink-0">
              <svg class="w-5 h-5 text-red-400 hover:text-red-600 transition-colors" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
              </svg>
            </button>
          </div>
        </div>
      </Transition>

      <!-- Edit Form -->
      <form v-if="order" @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Order Info Banner -->
        

        <!-- Delivery Address Section -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 animate-fadeIn" :class="{ 'opacity-60': !canEdit }" style="animation-delay: 0.1s">
          <!-- Header with Toggle -->
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold text-gray-900">{{ t.deliveryAddressTitle }}</h2>
            <!-- Toggle Switch -->
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-500">{{ useFullAddress ? t.useFullAddress : t.useIndividualFields }}</span>
              <button
                type="button"
                @click="useFullAddress = !useFullAddress"
                :disabled="!canEdit"
                :class="[
                  'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
                  useFullAddress ? 'bg-primary-500' : 'bg-gray-200'
                ]"
              >
                <span
                  :class="[
                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                    useFullAddress ? 'translate-x-5' : 'translate-x-0'
                  ]"
                />
              </button>
            </div>
          </div>

          <!-- Google Maps link — most accurate -->
          <div class="mb-4">
            <label for="gmaps_link" class="block text-sm font-semibold text-gray-900 mb-1">Link de Google Maps</label>
            <p class="text-xs text-gray-500 mb-2">Pega el link de tu ubicación en Google Maps — es lo más preciso.</p>
            <input
              id="gmaps_link"
              type="url"
              v-model="form.delivery_address.google_maps_link"
              placeholder="https://maps.app.goo.gl/..."
              class="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>

          <!-- Full Address Mode -->
          <div v-if="useFullAddress" class="space-y-4">
            <div>
              <label for="full_address" class="block text-sm font-semibold text-gray-900 mb-2">
                {{ t.fullAddressLabel }} <span class="text-red-500">*</span>
              </label>
              <textarea
                v-model="form.delivery_address.full_address"
                id="full_address"
                rows="3"
                :placeholder="t.fullAddressPlaceholder"
                :disabled="!canEdit"
                class="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                required
              ></textarea>
            </div>
          </div>

          <!-- Individual Fields Mode -->
          <div v-else class="space-y-4">
            <!-- Street -->
            <div>
              <label for="street" class="block text-sm font-semibold text-gray-900 mb-2">
                {{ t.streetLabel }} <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.delivery_address.street"
                type="text"
                id="street"
                :placeholder="t.streetPlaceholder"
                :disabled="!canEdit"
                class="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                required
              >
            </div>

            <!-- Numbers -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="exterior_number" class="block text-sm font-semibold text-gray-900 mb-2">
                  {{ t.exteriorNumberLabel }} <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="form.delivery_address.exterior_number"
                  type="text"
                  id="exterior_number"
                  :placeholder="t.exteriorNumberPlaceholder"
                  :disabled="!canEdit"
                  class="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                >
              </div>
              <div>
                <label for="interior_number" class="block text-sm font-semibold text-gray-900 mb-2">
                  {{ t.interiorNumberLabel }}
                </label>
                <input
                  v-model="form.delivery_address.interior_number"
                  type="text"
                  id="interior_number"
                  :placeholder="t.interiorNumberPlaceholder"
                  :disabled="!canEdit"
                  class="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
              </div>
            </div>

            <!-- Colonia and Municipio -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label for="colonia" class="block text-sm font-semibold text-gray-900 mb-2">
                  {{ t.coloniaLabel }} <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="form.delivery_address.colonia"
                  type="text"
                  id="colonia"
                  :placeholder="t.coloniaPlaceholder"
                  :disabled="!canEdit"
                  class="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                >
              </div>
              <div>
                <label for="municipio" class="block text-sm font-semibold text-gray-900 mb-2">
                  {{ t.municipioLabel }} <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="form.delivery_address.municipio"
                  type="text"
                  id="municipio"
                  :placeholder="t.municipioPlaceholder"
                  :disabled="!canEdit"
                  class="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                >
              </div>
            </div>

            <!-- Estado and Postal Code -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label for="estado" class="block text-sm font-semibold text-gray-900 mb-2">
                  {{ t.estadoLabel }} <span class="text-red-500">*</span>
                </label>
                <select
                  v-model="form.delivery_address.estado"
                  id="estado"
                  :disabled="!canEdit"
                  class="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                >
                  <option value="">{{ t.selectEstado }}</option>
                  <option v-for="estado in mexicanStates" :key="estado" :value="estado">
                    {{ estado }}
                  </option>
                </select>
              </div>
              <div>
                <label for="postal_code" class="block text-sm font-semibold text-gray-900 mb-2">
                  {{ t.postalCodeLabel }} <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="form.delivery_address.postal_code"
                  type="text"
                  id="postal_code"
                  :placeholder="t.postalCodePlaceholder"
                  :disabled="!canEdit"
                  maxlength="5"
                  pattern="[0-9]{5}"
                  class="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                >
              </div>
            </div>

            <!-- Referencias -->
            <div>
              <label for="referencias" class="block text-sm font-semibold text-gray-900 mb-2">
                {{ t.referenciasLabel }}
              </label>
              <textarea
                v-model="form.delivery_address.referencias"
                id="referencias"
                rows="3"
                :placeholder="t.referenciasPlaceholder"
                :disabled="!canEdit"
                class="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              ></textarea>
            </div>

            <!-- Rural Checkbox -->
            <div class="bg-yellow-50 rounded-xl p-4 border border-yellow-200" :class="{ 'opacity-60': !canEdit }">
              <label class="flex items-start gap-3 cursor-pointer">
                <input
                  v-model="form.is_rural"
                  type="checkbox"
                  :disabled="!canEdit"
                  class="mt-1 h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500 disabled:cursor-not-allowed"
                >
                <div class="flex-1">
                  <span class="text-sm font-semibold text-gray-900">{{ t.ruralAreaLabel }}</span>
                  <p class="text-sm text-gray-600 mt-1">{{ t.ruralAreaDescription }}</p>
                  <p v-if="form.is_rural" class="text-sm font-medium text-yellow-700 mt-1">
                    {{ t.ruralChargeWarning }}
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row gap-3 sm:justify-between">
          <NuxtLink
            :to="`/app/orders/${orderId}`"
            class="order-2 sm:order-1 px-6 py-3 bg-white text-gray-700 font-semibold rounded-xl border border-gray-300 hover:bg-gray-50 transition-all duration-300 text-center"
          >
            {{ t.cancel }}
          </NuxtLink>
          
          <button
            type="submit"
            :disabled="saving || !hasChanges || !canEdit"
            class="order-1 sm:order-2 px-6 py-3 bg-primary-500 text-white font-semibold rounded-xl shadow-lg hover:bg-primary-600 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            <svg v-if="saving" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span v-if="!saving">{{ t.saveChanges }}</span>
            <span v-else>{{ t.saving }}</span>
          </button>
        </div>
      </form>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// Define page meta
definePageMeta({
  layout: 'app',
  middleware: ['auth', 'customer', 'complete-profile']
})

// Nuxt imports
const { $customFetch, $toast } = useNuxtApp()
const route = useRoute()
const router = useRouter()

// Use the language composable
const { t: createTranslations } = useLanguage()

// State
const orderId = route.params.id
const order = ref(null)
const loading = ref(true)
const saving = ref(false)
const errorMessage = ref('')
const originalData = ref(null)
const useFullAddress = ref(false)

// Form data
const form = ref({
  delivery_address: {
    street: '',
    exterior_number: '',
    interior_number: '',
    colonia: '',
    municipio: '',
    estado: '',
    postal_code: '',
    referencias: '',
    full_address: '',
    google_maps_link: ''
  },
  is_rural: false
})

// Mexican states
const mexicanStates = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas',
  'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima', 'Durango', 'Guanajuato',
  'Guerrero', 'Hidalgo', 'Jalisco', 'México', 'Michoacán', 'Morelos', 'Nayarit',
  'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí',
  'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'
]

// Translations
const translations = {
  editOrder: {
    es: 'Editar Orden',
    en: 'Edit Order'
  },
  editingOrder: {
    es: 'Editando Orden',
    en: 'Editing Order'
  },
  orderNumber: {
    es: 'Número de orden',
    en: 'Order number'
  },
  deliveryAddressTitle: {
    es: 'Dirección de Entrega',
    en: 'Delivery Address'
  },
  streetLabel: {
    es: 'Calle',
    en: 'Street'
  },
  streetPlaceholder: {
    es: 'Nombre de la calle',
    en: 'Street name'
  },
  exteriorNumberLabel: {
    es: 'Número Exterior',
    en: 'Exterior Number'
  },
  exteriorNumberPlaceholder: {
    es: '123',
    en: '123'
  },
  interiorNumberLabel: {
    es: 'Número Interior',
    en: 'Interior Number'
  },
  interiorNumberPlaceholder: {
    es: 'Opcional',
    en: 'Optional'
  },
  coloniaLabel: {
    es: 'Colonia',
    en: 'Neighborhood'
  },
  coloniaPlaceholder: {
    es: 'Nombre de la colonia',
    en: 'Neighborhood name'
  },
  municipioLabel: {
    es: 'Municipio/Delegación',
    en: 'Municipality'
  },
  municipioPlaceholder: {
    es: 'Municipio o delegación',
    en: 'Municipality'
  },
  estadoLabel: {
    es: 'Estado',
    en: 'State'
  },
  selectEstado: {
    es: 'Selecciona un estado',
    en: 'Select a state'
  },
  postalCodeLabel: {
    es: 'Código Postal',
    en: 'Postal Code'
  },
  postalCodePlaceholder: {
    es: '12345',
    en: '12345'
  },
  referenciasLabel: {
    es: 'Referencias',
    en: 'References'
  },
  referenciasPlaceholder: {
    es: 'Entre calles, puntos de referencia, color de la casa, etc.',
    en: 'Between streets, landmarks, house color, etc.'
  },
  ruralAreaLabel: {
    es: 'Zona Rural',
    en: 'Rural Area'
  },
  ruralAreaDescription: {
    es: 'Marca esta casilla si tu dirección está en una zona rural.',
    en: 'Check this box if your address is in a rural area.'
  },
  ruralChargeWarning: {
    es: 'Nota: Los cambios a zona rural pueden requerir pago adicional.',
    en: 'Note: Changes to rural area may require additional payment.'
  },
  cancel: {
    es: 'Cancelar',
    en: 'Cancel'
  },
  saveChanges: {
    es: 'Guardar Cambios',
    en: 'Save Changes'
  },
  saving: {
    es: 'Guardando...',
    en: 'Saving...'
  },
  orderUpdatedSuccess: {
    es: 'Orden actualizada exitosamente',
    en: 'Order updated successfully'
  },
  generalError: {
    es: 'Ocurrió un error. Por favor, intenta de nuevo.',
    en: 'An error occurred. Please try again.'
  },
  orderNotEditable: {
    es: 'Esta orden ya no se puede editar',
    en: 'This order can no longer be edited'
  },
  cannotEditTitle: {
    es: 'Edición no disponible',
    en: 'Editing not available'
  },
  cannotEditMessage: {
    es: 'Esta orden ya no se puede editar porque ha progresado más allá de la etapa de recolección. Los cambios de dirección solo están permitidos mientras la orden está en estado "Agregando Artículos".',
    en: 'This order can no longer be edited because it has progressed beyond the collecting stage. Address changes are only allowed while the order is in "Adding Items" status.'
  },
  currentStatus: {
    es: 'Estado actual',
    en: 'Current status'
  },
  collecting: {
    es: 'Agregando Artículos',
    en: 'Adding Items'
  },
  awaitingPackages: {
    es: 'Esperando Paquetes',
    en: 'Awaiting Packages'
  },
  packagesComplete: {
    es: 'Paquetes Completos',
    en: 'Packages Complete'
  },
  shipped: {
    es: 'Enviado',
    en: 'Shipped'
  },
  delivered: {
    es: 'Entregado',
    en: 'Delivered'
  },
  // Full address mode
  useFullAddress: {
    es: 'Dirección completa',
    en: 'Full address'
  },
  useIndividualFields: {
    es: 'Campos individuales',
    en: 'Individual fields'
  },
  fullAddressLabel: {
    es: 'Dirección Completa',
    en: 'Full Address'
  },
  fullAddressPlaceholder: {
    es: 'Ej: Calle Principal 123, Col. Centro, Tijuana, BC 22000',
    en: 'E.g.: Main Street 123, Downtown, Tijuana, BC 22000'
  },
  fullAddressDescription: {
    es: 'Ingresa tu dirección completa en un solo campo',
    en: 'Enter your complete address in a single field'
  }
}

// Get reactive translations
const t = createTranslations(translations)

// Computed
const canEdit = computed(() => {
  if (!order.value) return false
  return ['collecting', 'awaiting_packages', 'packages_complete'].includes(order.value.status)
})


const hasChanges = computed(() => {
  return JSON.stringify(form.value) !== JSON.stringify(originalData.value)
})

const getStatusLabel = (status) => {
  const statusLabels = {
    'collecting': t.value.collecting || 'Adding Items',
    'awaiting_packages': t.value.awaitingPackages || 'Awaiting Packages',
    'packages_complete': t.value.packagesComplete || 'Packages Complete',
    'shipped': t.value.shipped || 'Shipped',
    'delivered': t.value.delivered || 'Delivered'
  }
  return statusLabels[status] || status
}
// Methods
const fetchOrder = async () => {
  loading.value = true
  try {
    const response = await $customFetch(`/orders/${orderId}`)
    order.value = response.data
    
    // Check if order can be edited
    const editableStatuses = ['collecting', 'awaiting_packages', 'packages_complete']
    if (!editableStatuses.includes(order.value.status)) {
      $toast.error(t.value.orderNotEditable)
      await router.push(`/app/orders/${orderId}`)
      return
    }
    
    // Populate form...
    const addr = order.value.delivery_address || {}
    form.value = {
      delivery_address: {
        street: addr.street || '',
        exterior_number: addr.exterior_number || '',
        interior_number: addr.interior_number || '',
        colonia: addr.colonia || '',
        municipio: addr.municipio || '',
        estado: addr.estado || '',
        postal_code: addr.postal_code || '',
        referencias: addr.referencias || '',
        full_address: addr.full_address || '',
        google_maps_link: addr.google_maps_link || ''
      },
      is_rural: order.value.is_rural
    }

    // Auto-detect address mode
    if (addr.full_address && !addr.street) {
      useFullAddress.value = true
    }

    originalData.value = JSON.parse(JSON.stringify(form.value))
    
  } catch (error) {
    console.error('Error fetching order:', error)
    $toast.error(t.value.generalError)
    await router.push('/app/orders')
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  if (!hasChanges.value) return

  saving.value = true
  errorMessage.value = ''

  try {
    // Build payload based on address mode
    const payload = {
      is_rural: form.value.is_rural
    }

    if (useFullAddress.value) {
      // Full address mode
      payload.delivery_address = {
        full_address: form.value.delivery_address.full_address
      }
    } else {
      // Individual fields mode
      payload.delivery_address = {
        street: form.value.delivery_address.street,
        exterior_number: form.value.delivery_address.exterior_number,
        interior_number: form.value.delivery_address.interior_number,
        colonia: form.value.delivery_address.colonia,
        municipio: form.value.delivery_address.municipio,
        estado: form.value.delivery_address.estado,
        postal_code: form.value.delivery_address.postal_code,
        referencias: form.value.delivery_address.referencias
      }
    }
    // Google Maps link — most accurate; applies in either mode
    const gmaps = (form.value.delivery_address.google_maps_link || '').trim()
    if (gmaps) payload.delivery_address.google_maps_link = gmaps

    const response = await $customFetch(`/orders/${orderId}`, {
      method: 'PUT',
      body: payload
    })

    if (response.success) {
      $toast.success(t.value.orderUpdatedSuccess)
      await router.push(`/app/orders/${orderId}`)
    }
  } catch (error) {
    console.error('Error updating order:', error)
    errorMessage.value = error.data?.message || t.value.generalError
    $toast.error(errorMessage.value)
  } finally {
    saving.value = false
  }
}

// Lifecycle
onMounted(() => {
  fetchOrder()
})
</script>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
  20%, 40%, 60%, 80% { transform: translateX(2px); }
}

.animate-fadeIn {
  animation: fadeIn 0.6s ease-out forwards;
  opacity: 0;
}

.animate-shake {
  animation: shake 0.5s ease-in-out;
}
</style>