<template>
    <section class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20">
      <!-- Loading State -->
      <div v-if="loading" class="min-h-screen flex items-center justify-center">
        <div class="text-center">
          <svg class="inline-block w-16 h-16 text-primary-500 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p class="mt-4 text-gray-600">{{ t.loading }}</p>
        </div>
      </div>
  
      <!-- Content (shown when data is loaded) -->
      <div v-else>
        <!-- Header -->
        <div class="bg-white/90 backdrop-blur-sm shadow-sm border-b border-gray-100">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <!-- Mobile Layout -->
            <div class="lg:hidden space-y-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <NuxtLink 
                    :to="`/app/admin/customers/${$route.params.id}`"
                    class="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                  >
                    <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                    </svg>
                  </NuxtLink>
                  <h1 class="text-xl sm:text-2xl font-extrabold text-gray-900">{{ t.editCustomer }}</h1>
                </div>
              </div>
            </div>
  
            <!-- Desktop Layout -->
            <div class="hidden lg:flex lg:items-center lg:justify-between">
              <div class="flex items-center gap-4">
                <NuxtLink 
                  :to="`/app/admin/customers/${$route.params.id}`"
                  class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                  </svg>
                </NuxtLink>
                <div>
                  <h1 class="text-3xl font-extrabold text-gray-900">{{ t.editCustomer }}</h1>
                  <p class="text-sm text-gray-600 mt-1">{{ t.editCustomerDescription }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
  
        <!-- Main Content -->
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <!-- Error Alert -->
          <Transition
            enter-active-class="transform ease-out duration-300 transition"
            enter-from-class="translate-y-2 opacity-0"
            enter-to-class="translate-y-0 opacity-100"
            leave-active-class="transition ease-in duration-200"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
          >
            <div v-if="errorMessage" class="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="w-5 h-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                  </svg>
                </div>
                <div class="ml-3">
                  <p class="text-sm font-medium text-red-800">{{ errorMessage }}</p>
                </div>
              </div>
            </div>
          </Transition>
  
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <form @submit.prevent="handleSubmit">
              <!-- Basic Information Section -->
              <div class="px-6 py-6 border-b border-gray-100">
                <h2 class="text-lg font-semibold text-gray-900 mb-4">{{ t.basicInformation }}</h2>
                
                <div class="space-y-4">
                  <!-- Name -->
                  <div>
                    <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
                      {{ t.name }} <span class="text-red-500">*</span>
                    </label>
                    <input
                      id="name"
                      v-model="form.name"
                      type="text"
                      required
                      class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      :placeholder="t.namePlaceholder"
                      :class="{ 'border-red-300': errors.name }"
                    >
                    <p v-if="errors.name" class="mt-1 text-sm text-red-600">{{ errors.name }}</p>
                  </div>
  
                  <!-- Email (Read-only) -->
                  <div>
                    <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
                      {{ t.email }}
                    </label>
                    <input
                      id="email"
                      :value="customer?.email"
                      type="email"
                      disabled
                      class="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                    >
                    <p class="mt-1 text-xs text-gray-500">{{ t.emailCannotBeChanged }}</p>
                  </div>
  
                  <!-- Phone -->
                  <div>
                    <label for="phone" class="block text-sm font-medium text-gray-700 mb-2">
                      {{ t.phone }} <span class="text-red-500">*</span>
                    </label>
                    <input
                      id="phone"
                      v-model="form.phone"
                      type="tel"
                      required
                      class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      :placeholder="t.phonePlaceholder"
                      :class="{ 'border-red-300': errors.phone }"
                    >
                    <p v-if="errors.phone" class="mt-1 text-sm text-red-600">{{ errors.phone }}</p>
                  </div>
  
                  <!-- User Type -->
                  <div>
                    <label for="user_type" class="block text-sm font-medium text-gray-700 mb-2">
                      {{ t.userType }}
                    </label>
                    <select
                      id="user_type"
                      v-model="form.user_type"
                      class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    >
                      <option value="">{{ t.selectUserType }}</option>
                      <option value="expat">{{ t.expat }}</option>
                      <option value="business">{{ t.business }}</option>
                      <option value="shopper">{{ t.shopper }}</option>
                    </select>
                  </div>
  
                  <!-- Preferred Language -->
                  <div>
                    <label for="preferred_language" class="block text-sm font-medium text-gray-700 mb-2">
                      {{ t.preferredLanguage }}
                    </label>
                    <select
                      id="preferred_language"
                      v-model="form.preferred_language"
                      class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    >
                      <option value="es">{{ t.spanish }}</option>
                      <option value="en">{{ t.english }}</option>
                    </select>
                  </div>
                </div>
              </div>
  
              <!-- Address Section -->
              <div class="px-6 py-6 border-b border-gray-100">
                <div class="flex items-center justify-between mb-4">
                  <div class="flex items-center gap-3">
                    <h2 class="text-lg font-semibold text-gray-900">{{ t.addressInformation }}</h2>
                    <span class="text-sm text-gray-500">({{ t.optional }})</span>
                  </div>
                  <!-- Toggle Switch -->
                  <div class="flex items-center gap-2">
                    <span class="text-sm text-gray-500">{{ useFullAddress ? t.useFullAddress : t.useIndividualFields }}</span>
                    <button
                      type="button"
                      @click="useFullAddress = !useFullAddress"
                      :class="[
                        'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
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

                <!-- Full Address Mode -->
                <div v-if="useFullAddress" class="space-y-4">
                  <div>
                    <label for="full_address" class="block text-sm font-medium text-gray-700 mb-2">
                      {{ t.fullAddress }}
                    </label>
                    <textarea
                      id="full_address"
                      v-model="form.full_address"
                      rows="3"
                      class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      :placeholder="t.fullAddressPlaceholder"
                    ></textarea>
                  </div>
                </div>

                <!-- Individual Fields Mode -->
                <div v-else class="space-y-4">
                  <!-- Street -->
                  <div>
                    <label for="street" class="block text-sm font-medium text-gray-700 mb-2">
                      {{ t.street }}
                    </label>
                    <input
                      id="street"
                      v-model="form.street"
                      type="text"
                      class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      :placeholder="t.streetPlaceholder"
                    >
                  </div>
  
                  <!-- Exterior and Interior Number -->
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label for="exterior_number" class="block text-sm font-medium text-gray-700 mb-2">
                        {{ t.exteriorNumber }}
                      </label>
                      <input
                        id="exterior_number"
                        v-model="form.exterior_number"
                        type="text"
                        class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        :placeholder="t.exteriorNumberPlaceholder"
                      >
                    </div>
  
                    <div>
                      <label for="interior_number" class="block text-sm font-medium text-gray-700 mb-2">
                        {{ t.interiorNumber }}
                      </label>
                      <input
                        id="interior_number"
                        v-model="form.interior_number"
                        type="text"
                        class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        :placeholder="t.interiorNumberPlaceholder"
                      >
                    </div>
                  </div>
  
                  <!-- Colonia and Municipio -->
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label for="colonia" class="block text-sm font-medium text-gray-700 mb-2">
                        {{ t.colonia }}
                      </label>
                      <input
                        id="colonia"
                        v-model="form.colonia"
                        type="text"
                        class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        :placeholder="t.coloniaPlaceholder"
                      >
                    </div>
  
                    <div>
                      <label for="municipio" class="block text-sm font-medium text-gray-700 mb-2">
                        {{ t.municipio }}
                      </label>
                      <input
                        id="municipio"
                        v-model="form.municipio"
                        type="text"
                        class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        :placeholder="t.municipioPlaceholder"
                      >
                    </div>
                  </div>
  
                  <!-- Estado and Postal Code -->
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label for="estado" class="block text-sm font-medium text-gray-700 mb-2">
                        {{ t.estado }}
                      </label>
                      <select
                        id="estado"
                        v-model="form.estado"
                        class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      >
                        <option value="">{{ t.selectEstado }}</option>
                        <option v-for="estado in mexicanStates" :key="estado" :value="estado">
                          {{ estado }}
                        </option>
                      </select>
                    </div>
  
                    <div>
                      <label for="postal_code" class="block text-sm font-medium text-gray-700 mb-2">
                        {{ t.postalCode }}
                      </label>
                      <input
                        id="postal_code"
                        v-model="form.postal_code"
                        type="text"
                        class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        :placeholder="t.postalCodePlaceholder"
                      >
                    </div>
                  </div>
                </div>
              </div>
  
              <!-- Form 1583 Section -->
              <div class="px-6 py-6 border-b border-gray-100">
                <h2 class="text-lg font-semibold text-gray-900 mb-4">{{ t.form1583Section }}</h2>
                <div class="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p class="text-sm font-medium text-gray-900">{{ t.form1583Label }}</p>
                    <p class="text-xs text-gray-500 mt-0.5">
                      {{ form.form_1583_completed_at ? t.form1583CompletedOn + ' ' + formatDate(form.form_1583_completed_at) : t.form1583NotCompleted }}
                    </p>
                  </div>
                  <button
                    type="button"
                    @click="toggleForm1583"
                    :class="[
                      'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                      form.form_1583_completed_at ? 'bg-green-500' : 'bg-gray-200'
                    ]"
                  >
                    <span
                      :class="[
                        'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                        form.form_1583_completed_at ? 'translate-x-5' : 'translate-x-0'
                      ]"
                    />
                  </button>
                </div>
              </div>

              <!-- Actions -->
              <div class="px-6 py-4 bg-gray-50 flex items-center justify-end gap-3">
                <NuxtLink 
                  :to="`/app/admin/customers/${$route.params.id}`"
                  class="px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  {{ t.cancel }}
                </NuxtLink>
                <button
                  type="submit"
                  :disabled="submitting"
                  class="inline-flex items-center px-6 py-2.5 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <svg v-if="submitting" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ submitting ? t.saving : t.saveChanges }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  </template>
  
  <script setup>
  import { ref, reactive, onMounted } from 'vue'
  
  definePageMeta({
    layout: 'admin',
    middleware: ['auth', 'admin']
  })
  
  const { $customFetch, $toast } = useNuxtApp()
  const router = useRouter()
  const route = useRoute()
  const { t: createTranslations } = useLanguage()
  
  // State
  const loading = ref(true)
  const submitting = ref(false)
  const errorMessage = ref('')
  const errors = ref({})
  const customer = ref(null)
  const useFullAddress = ref(false)

  const form = reactive({
    name: '',
    phone: '',
    user_type: '',
    preferred_language: 'es',
    street: '',
    exterior_number: '',
    interior_number: '',
    colonia: '',
    municipio: '',
    estado: '',
    postal_code: '',
    full_address: '',
    form_1583_completed_at: null
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
    editCustomer: {
      es: 'Editar Cliente',
      en: 'Edit Customer'
    },
    editCustomerDescription: {
      es: 'Actualiza la información del cliente',
      en: 'Update customer information'
    },
    basicInformation: {
      es: 'Información Básica',
      en: 'Basic Information'
    },
    addressInformation: {
      es: 'Información de Dirección',
      en: 'Address Information'
    },
    optional: {
      es: 'Opcional',
      en: 'Optional'
    },
    name: {
      es: 'Nombre',
      en: 'Name'
    },
    namePlaceholder: {
      es: 'Nombre completo del cliente',
      en: 'Customer full name'
    },
    email: {
      es: 'Correo Electrónico',
      en: 'Email'
    },
    emailCannotBeChanged: {
      es: 'El correo electrónico no se puede cambiar',
      en: 'Email cannot be changed'
    },
    phone: {
      es: 'Teléfono',
      en: 'Phone'
    },
    phonePlaceholder: {
      es: '+52 55 1234 5678',
      en: '+52 55 1234 5678'
    },
    userType: {
      es: 'Tipo de Usuario',
      en: 'User Type'
    },
    selectUserType: {
      es: 'Seleccionar tipo',
      en: 'Select type'
    },
    expat: {
      es: 'Expat',
      en: 'Expat'
    },
    business: {
      es: 'Negocio',
      en: 'Business'
    },
    shopper: {
      es: 'Comprador en Línea',
      en: 'Online Shopper'
    },
    preferredLanguage: {
      es: 'Idioma Preferido',
      en: 'Preferred Language'
    },
    spanish: {
      es: 'Español',
      en: 'Spanish'
    },
    english: {
      es: 'Inglés',
      en: 'English'
    },
    street: {
      es: 'Calle',
      en: 'Street'
    },
    streetPlaceholder: {
      es: 'Nombre de la calle',
      en: 'Street name'
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
      es: 'Apt 4B',
      en: 'Apt 4B'
    },
    colonia: {
      es: 'Colonia',
      en: 'Neighborhood'
    },
    coloniaPlaceholder: {
      es: 'Nombre de la colonia',
      en: 'Neighborhood name'
    },
    municipio: {
      es: 'Municipio/Alcaldía',
      en: 'Municipality'
    },
    municipioPlaceholder: {
      es: 'Nombre del municipio',
      en: 'Municipality name'
    },
    estado: {
      es: 'Estado',
      en: 'State'
    },
    selectEstado: {
      es: 'Selecciona un estado',
      en: 'Select a state'
    },
    postalCode: {
      es: 'Código Postal',
      en: 'Postal Code'
    },
    postalCodePlaceholder: {
      es: '06600',
      en: '06600'
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
    customerUpdatedSuccess: {
      es: 'Cliente actualizado exitosamente',
      en: 'Customer updated successfully'
    },
    loading: {
      es: 'Cargando...',
      en: 'Loading...'
    },
    useFullAddress: {
      es: 'Dirección completa',
      en: 'Full address'
    },
    useIndividualFields: {
      es: 'Campos individuales',
      en: 'Individual fields'
    },
    fullAddress: {
      es: 'Dirección Completa',
      en: 'Full Address'
    },
    fullAddressPlaceholder: {
      es: 'Ej: Calle Principal 123, Col. Centro, Tijuana, BC 22000',
      en: 'E.g.: Main Street 123, Downtown, Tijuana, BC 22000'
    },
    form1583Section: {
      es: 'Formulario USPS 1583',
      en: 'USPS Form 1583'
    },
    form1583Label: {
      es: 'Formulario 1583 Completado',
      en: 'Form 1583 Completed'
    },
    form1583CompletedOn: {
      es: 'Completado el',
      en: 'Completed on'
    },
    form1583NotCompleted: {
      es: 'No completado aún',
      en: 'Not completed yet'
    }
  }
  
  const t = createTranslations(translations)
  
  // Methods
  const fetchCustomer = async () => {
    loading.value = true
    try {
      const response = await $customFetch(`/admin/customers/${route.params.id}`)
      customer.value = response.data.customer
      
      // Populate form
      form.name = customer.value.name || ''
      form.phone = customer.value.phone || ''
      form.user_type = customer.value.user_type || ''
      form.preferred_language = customer.value.preferred_language || 'es'
      form.street = customer.value.street || ''
      form.exterior_number = customer.value.exterior_number || ''
      form.interior_number = customer.value.interior_number || ''
      form.colonia = customer.value.colonia || ''
      form.municipio = customer.value.municipio || ''
      form.estado = customer.value.estado || ''
      form.postal_code = customer.value.postal_code || ''
      form.full_address = customer.value.full_address || ''
      form.form_1583_completed_at = customer.value.form_1583_completed_at || null

      // If full_address exists but no individual fields, default to full address mode
      if (customer.value.full_address && !customer.value.street) {
        useFullAddress.value = true
      }
    } catch (error) {
      console.error('Error fetching customer:', error)
      $toast.error('Error loading customer')
      router.push('/app/admin/customers')
    } finally {
      loading.value = false
    }
  }
  
  const handleSubmit = async () => {
    if (submitting.value) return

    // Reset errors
    errors.value = {}
    errorMessage.value = ''
    submitting.value = true

    // Build payload based on address mode
    const payload = {
      name: form.name,
      phone: form.phone,
      user_type: form.user_type,
      preferred_language: form.preferred_language,
      form_1583_completed_at: form.form_1583_completed_at
    }

    if (useFullAddress.value) {
      // Full address mode - send only full_address
      payload.full_address = form.full_address
    } else {
      // Individual fields mode
      payload.street = form.street
      payload.exterior_number = form.exterior_number
      payload.interior_number = form.interior_number
      payload.colonia = form.colonia
      payload.municipio = form.municipio
      payload.estado = form.estado
      payload.postal_code = form.postal_code
    }

    try {
      const response = await $customFetch(`/admin/customers/${route.params.id}`, {
        method: 'PUT',
        body: payload
      })
  
      $toast.success(t.value.customerUpdatedSuccess)
  
      // Redirect back to customer detail page
      router.push(`/app/admin/customers/${route.params.id}`)
    } catch (error) {
      console.error('Error updating customer:', error)
      
      // Handle validation errors
      if (error.data?.errors) {
        errors.value = error.data.errors
        
        // Show first error in toast
        const firstError = Object.values(error.data.errors)[0]
        if (Array.isArray(firstError)) {
          errorMessage.value = firstError[0]
        } else {
          errorMessage.value = firstError
        }
      } else {
        errorMessage.value = error.data?.message || 'Failed to update customer'
      }
      
      $toast.error(errorMessage.value)
    } finally {
      submitting.value = false
    }
  }
  
  const toggleForm1583 = () => {
    if (form.form_1583_completed_at) {
      form.form_1583_completed_at = null
    } else {
      form.form_1583_completed_at = new Date().toISOString()
    }
  }

  const formatDate = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('es-MX', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // Fetch customer on mount
  onMounted(() => {
    fetchCustomer()
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
  
  .animate-fadeIn {
    animation: fadeIn 0.6s ease-out forwards;
    opacity: 0;
  }
  </style>