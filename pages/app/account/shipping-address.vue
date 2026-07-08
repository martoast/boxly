<!-- pages/app/account/shipping-address.vue -->
<template>
  <section class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20">
    <!-- Loading State -->
    <div v-if="isInitialLoading" class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <svg class="inline-block w-16 h-16 text-primary-500 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="mt-4 text-gray-600">{{ t.loadingAddress }}</p>
      </div>
    </div>

    <!-- Content (shown when data is loaded) -->
    <div v-else>
      <!-- Header -->
      <div class="bg-white/90 backdrop-blur-sm shadow-sm border-b border-gray-100">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div class="flex items-center gap-4">
            <NuxtLink
              to="/app/account"
              class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
              </svg>
            </NuxtLink>
            <div>
              <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900">{{ t.shippingAddress }}</h1>
              <p class="mt-1 text-sm text-gray-600">{{ t.addressDescription }}</p>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Main Content -->
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Success Message -->
        <Transition
          enter-active-class="transform ease-out duration-300 transition"
          enter-from-class="translate-y-2 opacity-0"
          enter-to-class="translate-y-0 opacity-100"
          leave-active-class="transition ease-in duration-200"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div v-if="showSuccess" class="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-green-800">{{ t.addressUpdated }}</p>
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
          <div v-if="errorMessage || Object.keys(errors).length > 0" class="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="w-5 h-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                </svg>
              </div>
              <div class="ml-3 flex-1">
                <p class="text-sm font-medium text-red-800">
                  {{ errorMessage || t.validationError }}
                </p>
                <ul v-if="Object.keys(errors).length > 0" class="mt-2 text-sm text-red-700 space-y-1">
                  <li v-for="(messages, field) in errors" :key="field">
                    {{ messages[0] }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </Transition>

        <!-- Autocomplete Section (always available as a helper) -->
        <div class="mb-6">
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-100">
              <h2 class="text-lg font-bold text-gray-900">{{ t.quickAddressSearch }}</h2>
              <p class="text-sm text-gray-600 mt-1">{{ hasExistingAddress ? t.changeAddressDescription : t.searchAddressDescription }}</p>
            </div>
            <div class="p-6">
              <CustomPlacesAutoComplete 
                @updateAddress="handleAutocompleteSelect"
                :placeholder="t.searchPlaceholder"
              />
            </div>
          </div>
        </div>
  
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Shipping Address Form -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-100">
              <h2 class="text-lg font-bold text-gray-900">{{ t.addressDetails }}</h2>
              <p class="text-sm text-gray-600 mt-1">{{ t.completeAddressNote }}</p>
            </div>
            <div class="p-6 space-y-4">
              <!-- Success Message for Autocomplete -->
              <Transition
                enter-active-class="transform ease-out duration-300 transition"
                enter-from-class="translate-y-2 opacity-0"
                enter-to-class="translate-y-0 opacity-100"
                leave-active-class="transition ease-in duration-200"
                leave-from-class="opacity-100"
                leave-to-class="opacity-0"
              >
                <div v-if="showAutocompleteSuccess" class="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div class="flex">
                    <div class="flex-shrink-0">
                      <svg class="h-4 w-4 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                      </svg>
                    </div>
                    <div class="ml-3">
                      <p class="text-sm font-medium text-blue-800">{{ t.addressFound }}</p>
                    </div>
                  </div>
                </div>
              </Transition>
              <!-- Google Maps link — most accurate -->
              <div>
                <label for="gmaps_link" class="block text-sm font-medium text-gray-700 mb-1">Link de Google Maps</label>
                <input
                  v-model="form.google_maps_link"
                  type="url"
                  id="gmaps_link"
                  placeholder="https://maps.app.goo.gl/..."
                  class="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
                <p class="text-xs text-gray-500 mt-1">Pega el link de tu ubicación en Google Maps — es lo más preciso para entregarte.</p>
              </div>
              <!-- Street -->
              <div>
                <label for="street" class="block text-sm font-medium text-gray-700 mb-1">
                  {{ t.street }} *
                </label>
                <input
                  v-model="form.street"
                  type="text"
                  id="street"
                  required
                  :placeholder="t.streetPlaceholder"
                  :class="[
                    'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all',
                    errors.street ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                  ]"
                  @input="clearFieldError('street')"
                >
                <p v-if="errors.street" class="mt-1 text-sm text-red-600">{{ errors.street[0] }}</p>
              </div>
  
              <!-- Numbers -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label for="exterior_number" class="block text-sm font-medium text-gray-700 mb-1">
                    {{ t.exteriorNumber }} *
                  </label>
                  <input
                    v-model="form.exterior_number"
                    type="text"
                    id="exterior_number"
                    required
                    :placeholder="t.exteriorNumberPlaceholder"
                    :class="[
                      'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all',
                      errors.exterior_number ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                    ]"
                    @input="clearFieldError('exterior_number')"
                  >
                  <p v-if="errors.exterior_number" class="mt-1 text-sm text-red-600">{{ errors.exterior_number[0] }}</p>
                </div>
  
                <div>
                  <label for="interior_number" class="block text-sm font-medium text-gray-700 mb-1">
                    {{ t.interiorNumber }}
                    <span class="text-gray-400 font-normal">({{ t.optional }})</span>
                  </label>
                  <input
                    v-model="form.interior_number"
                    type="text"
                    id="interior_number"
                    :placeholder="t.interiorNumberPlaceholder"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-500"
                  >
                </div>
              </div>
  
              <!-- Colonia -->
              <div>
                <label for="colonia" class="block text-sm font-medium text-gray-700 mb-1">
                  {{ t.colonia }} *
                </label>
                <input
                  v-model="form.colonia"
                  type="text"
                  id="colonia"
                  required
                  :placeholder="t.coloniaPlaceholder"
                  :class="[
                    'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all',
                    errors.colonia ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                  ]"
                  @input="clearFieldError('colonia')"
                >
                <p v-if="errors.colonia" class="mt-1 text-sm text-red-600">{{ errors.colonia[0] }}</p>
              </div>
  
              <!-- City and State -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label for="municipio" class="block text-sm font-medium text-gray-700 mb-1">
                    {{ t.city }} *
                  </label>
                  <input
                    v-model="form.municipio"
                    type="text"
                    id="municipio"
                    required
                    :placeholder="t.cityPlaceholder"
                    :class="[
                      'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all',
                      errors.municipio ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                    ]"
                    @input="clearFieldError('municipio')"
                  >
                  <p v-if="errors.municipio" class="mt-1 text-sm text-red-600">{{ errors.municipio[0] }}</p>
                </div>
  
                <div>
                  <label for="estado" class="block text-sm font-medium text-gray-700 mb-1">
                    {{ t.state }} *
                  </label>
                  <select
                    v-model="form.estado"
                    id="estado"
                    required
                    :class="[
                      'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all',
                      errors.estado ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                    ]"
                    @change="clearFieldError('estado')"
                  >
                    <option value="">{{ t.selectState }}</option>
                    <option v-for="state in mexicanStates" :key="state" :value="state">
                      {{ state }}
                    </option>
                  </select>
                  <p v-if="errors.estado" class="mt-1 text-sm text-red-600">{{ errors.estado[0] }}</p>
                </div>
              </div>
  
              <!-- Postal Code -->
              <div>
                <label for="postal_code" class="block text-sm font-medium text-gray-700 mb-1">
                  {{ t.postalCode }} *
                </label>
                <input
                  v-model="form.postal_code"
                  type="text"
                  id="postal_code"
                  required
                  maxlength="5"
                  placeholder="12345"
                  :class="[
                    'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all',
                    errors.postal_code ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                  ]"
                  @input="clearFieldError('postal_code')"
                >
                <p v-if="errors.postal_code" class="mt-1 text-sm text-red-600">{{ errors.postal_code[0] }}</p>
              </div>

              <!-- Reference -->
              <div>
                <label for="reference" class="block text-sm font-medium text-gray-700 mb-1">
                  {{ t.reference }}
                  <span class="text-gray-400 font-normal">({{ t.optional }})</span>
                </label>
                <textarea
                  v-model="form.reference"
                  id="reference"
                  rows="3"
                  :placeholder="t.referencePlaceholder"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-500 resize-none"
                ></textarea>
              </div>
            </div>
          </div>
  
          <!-- Tips -->
          <div class="bg-blue-50 rounded-2xl p-6 border border-blue-200/50">
            <div class="flex gap-3">
              <div class="flex-shrink-0">
                <svg class="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div class="flex-1">
                <h3 class="font-semibold text-gray-900 mb-2">{{ t.tipsTitle }}</h3>
                <ul class="text-sm text-gray-700 space-y-1">
                  <li>• {{ t.tip1 }}</li>
                  <li>• {{ t.tip2 }}</li>
                  <li>• {{ t.tip3 }}</li>
                </ul>
              </div>
            </div>
          </div>
  
          <!-- Action Buttons -->
          <div class="flex items-center justify-between">
            <NuxtLink
              to="/app/account"
              class="px-6 py-2.5 text-gray-700 font-medium hover:text-gray-900 transition-colors"
            >
              {{ t.cancel }}
            </NuxtLink>
            
            <button
              type="submit"
              :disabled="isSubmitting"
              class="px-6 py-2.5 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <span v-if="!isSubmitting">{{ t.saveAddress }}</span>
              <span v-else class="flex items-center gap-2">
                <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ t.saving }}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>
  
<script setup>
import { ref, onMounted, computed } from 'vue'

definePageMeta({
  layout: 'app',
  middleware: ['auth', 'customer']
})

// Nuxt imports
const { $customFetch } = useNuxtApp()
const router = useRouter()

// Use the language composable
const { t: createTranslations } = useLanguage()

// State
const form = ref({
  street: '',
  exterior_number: '',
  interior_number: '',
  colonia: '',
  municipio: '',
  estado: '',
  postal_code: '',
  reference: '',
  google_maps_link: ''
})

const isInitialLoading = ref(true)
const isSubmitting = ref(false)
const showSuccess = ref(false)
const showAutocompleteSuccess = ref(false)
const errorMessage = ref('')
const errors = ref({})
const hasExistingAddress = ref(false)

// Mexican states
const mexicanStates = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche',
  'Chiapas', 'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima',
  'Durango', 'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo',
  'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca',
  'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa',
  'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán',
  'Zacatecas'
]

// Translations
const translations = {
  shippingAddress: {
    es: 'Dirección de Envío',
    en: 'Shipping Address'
  },
  addressDescription: {
    es: 'Esta es la dirección donde recibirás tus paquetes en México',
    en: 'This is the address where you will receive your packages in Mexico'
  },
  quickAddressSearch: {
    es: 'Búsqueda Rápida de Dirección',
    en: 'Quick Address Search'
  },
  searchAddressDescription: {
    es: 'Busca tu dirección para autocompletar los campos automáticamente',
    en: 'Search for your address to automatically fill in the fields'
  },
  changeAddressDescription: {
    es: 'Busca una nueva dirección para actualizar tus datos',
    en: 'Search for a new address to update your information'
  },
  searchPlaceholder: {
    es: 'Buscar dirección, ciudad o código postal',
    en: 'Search address, city or zip code'
  },
  enterManually: {
    es: 'Ingresar dirección manualmente',
    en: 'Enter address manually'
  },
  useAddressSearch: {
    es: 'Usar búsqueda de dirección',
    en: 'Use address search'
  },
  addressDetails: {
    es: 'Detalles de la Dirección',
    en: 'Address Details'
  },
  completeAddressNote: {
    es: 'Asegúrate de proporcionar una dirección completa y precisa para evitar problemas de entrega',
    en: 'Make sure to provide a complete and accurate address to avoid delivery issues'
  },
  addressFound: {
    es: 'Dirección encontrada. Por favor revisa y completa los campos faltantes.',
    en: 'Address found. Please review and complete any missing fields.'
  },
  street: {
    es: 'Calle',
    en: 'Street'
  },
  streetPlaceholder: {
    es: 'Av. Revolución',
    en: 'Revolution Ave'
  },
  exteriorNumber: {
    es: 'Número Exterior',
    en: 'Exterior Number'
  },
  exteriorNumberPlaceholder: {
    es: '123',
    en: '123'
  },
  interiorNumber: {
    es: 'Número Interior',
    en: 'Interior Number'
  },
  interiorNumberPlaceholder: {
    es: 'Depto 4B',
    en: 'Apt 4B'
  },
  optional: {
    es: 'Opcional',
    en: 'Optional'
  },
  colonia: {
    es: 'Colonia',
    en: 'Neighborhood'
  },
  coloniaPlaceholder: {
    es: 'Centro',
    en: 'Downtown'
  },
  city: {
    es: 'Ciudad/Municipio',
    en: 'City'
  },
  cityPlaceholder: {
    es: 'Tijuana',
    en: 'Tijuana'
  },
  state: {
    es: 'Estado',
    en: 'State'
  },
  selectState: {
    es: 'Selecciona un estado',
    en: 'Select a state'
  },
  postalCode: {
    es: 'Código Postal',
    en: 'Postal Code'
  },
  reference: {
    es: 'Referencias',
    en: 'References'
  },
  referencePlaceholder: {
    es: 'Entre calle X y calle Y, casa color azul, etc.',
    en: 'Between X street and Y street, blue house, etc.'
  },
  tipsTitle: {
    es: 'Consejos para tu dirección',
    en: 'Address Tips'
  },
  tip1: {
    es: 'Verifica que el código postal corresponda a tu colonia',
    en: 'Verify that the postal code matches your neighborhood'
  },
  tip2: {
    es: 'Incluye referencias adicionales si tu dirección es difícil de encontrar',
    en: 'Include additional references if your address is hard to find'
  },
  tip3: {
    es: 'Asegúrate de que alguien pueda recibir el paquete en la dirección proporcionada',
    en: 'Make sure someone can receive the package at the provided address'
  },
  cancel: {
    es: 'Cancelar',
    en: 'Cancel'
  },
  saveAddress: {
    es: 'Guardar Dirección',
    en: 'Save Address'
  },
  saving: {
    es: 'Guardando...',
    en: 'Saving...'
  },
  addressUpdated: {
    es: '¡Tu dirección ha sido actualizada exitosamente!',
    en: 'Your address has been updated successfully!'
  },
  validationError: {
    es: 'Por favor corrige los siguientes errores:',
    en: 'Please correct the following errors:'
  },
  loadingAddress: {
    es: 'Cargando dirección...',
    en: 'Loading address...'
  }
}

// Get reactive translations
const t = createTranslations(translations)

// Methods
const fetchAddress = async () => {
  try {
    const response = await $customFetch('/profile')
    const data = response.data
    
    // Check if user has existing address
    if (data.address && (data.address.street || data.address.municipio)) {
      hasExistingAddress.value = true
      
      // Populate form with existing address data
      form.value = {
        street: data.address.street || '',
        exterior_number: data.address.exterior_number || '',
        interior_number: data.address.interior_number || '',
        colonia: data.address.colonia || '',
        municipio: data.address.municipio || '',
        estado: data.address.estado || '',
        postal_code: data.address.postal_code || '',
        reference: data.address.reference || '',
        google_maps_link: data.address.google_maps_link || ''
      }
    }
  } catch (error) {
    console.error('Error fetching address:', error)
    errorMessage.value = 'Failed to load address data. Please try again.'
  } finally {
    isInitialLoading.value = false
  }
}

const clearFieldError = (field) => {
  if (errors.value[field]) {
    delete errors.value[field]
  }
}

const clearErrors = () => {
  errorMessage.value = ''
  errors.value = {}
}

const validateForm = () => {
  const requiredFields = ['street', 'exterior_number', 'colonia', 'municipio', 'estado', 'postal_code']
  let isValid = true
  
  requiredFields.forEach(field => {
    if (!form.value[field]) {
      errors.value[field] = ['This field is required']
      isValid = false
    }
  })
  
  // Validate postal code format
  if (form.value.postal_code && !/^\d{5}$/.test(form.value.postal_code)) {
    errors.value.postal_code = ['Postal code must be 5 digits']
    isValid = false
  }
  
  return isValid
}

const handleSubmit = async () => {
  isSubmitting.value = true
  clearErrors()
  showSuccess.value = false
  showAutocompleteSuccess.value = false

  if (!validateForm()) {
    isSubmitting.value = false
    return
  }

  try {
    // Send address data wrapped in an address object
    await $customFetch('/profile', {
      method: 'PUT',
      body: form.value
    })

    // Show success message before navigating
    showSuccess.value = true
    
    setTimeout(() => {
      navigateTo('/app/account')
    }, 1500)

  } catch (error) {
    console.error('Update error:', error)
    
    if (error.data) {
      if (error.data.errors) {
        errors.value = error.data.errors
      }
      if (error.data.message) {
        errorMessage.value = error.data.message
      }
    } else {
      errorMessage.value = 'An error occurred. Please try again.'
    }
  } finally {
    isSubmitting.value = false
  }
}

// Handle autocomplete selection
const handleAutocompleteSelect = (addressData) => {
  console.log('Autocomplete data received:', addressData)
  
  // Parse the address from Mapbox
  const { address, latitude, longitude } = addressData
  
  // Clear form first
  form.value = {
    street: '',
    exterior_number: '',
    interior_number: '',
    colonia: '',
    municipio: '',
    estado: '',
    postal_code: '',
    reference: ''
  }
  
  // Parse address format: "Avenida Jalisco 3415, 22046 Tijuana, Baja California, México"
  const parts = address.split(',').map(part => part.trim())
  
  if (parts.length >= 2) {
    // First part: "Avenida Jalisco 3415"
    const streetAndNumber = parts[0]
    // Try to extract street and number - number is usually at the end
    const streetMatch = streetAndNumber.match(/^(.+?)\s+(\d+)$/)
    
    if (streetMatch) {
      form.value.street = streetMatch[1].trim() // "Avenida Jalisco"
      form.value.exterior_number = streetMatch[2] // "3415"
    } else {
      // If no number found, put entire thing in street
      form.value.street = streetAndNumber
    }
    
    // Second part: "22046 Tijuana" - contains postal code and city
    if (parts[1]) {
      const cityPart = parts[1]
      // Extract postal code (5 digits at the beginning)
      const postalMatch = cityPart.match(/^(\d{5})\s+(.+)/)
      
      if (postalMatch) {
        form.value.postal_code = postalMatch[1] // "22046"
        form.value.municipio = postalMatch[2] // "Tijuana"
      } else {
        // If no postal code pattern, assume it's just the city
        form.value.municipio = cityPart
      }
    }
    
    // Third part: "Baja California" - state
    if (parts[2]) {
      const stateName = parts[2].trim()
      // Find matching state in our list
      const matchedState = mexicanStates.find(state => 
        state.toLowerCase() === stateName.toLowerCase() ||
        stateName.toLowerCase().includes(state.toLowerCase()) ||
        state.toLowerCase().includes(stateName.toLowerCase())
      )
      if (matchedState) {
        form.value.estado = matchedState
      } else {
        // If exact match not found, try to set as is
        form.value.estado = stateName
      }
    }
    
    // Fourth part: "México" - country (we can ignore this)
    
    // Try to extract colonia from the address if possible
    // Sometimes it might be included in the street part or city part
    // For now, leave it empty for user to fill
  }
  
  // Show autocomplete success message
  showAutocompleteSuccess.value = true
  setTimeout(() => {
    showAutocompleteSuccess.value = false
  }, 3000)
}

// Fetch address on mount
onMounted(() => {
  fetchAddress()
})
</script>