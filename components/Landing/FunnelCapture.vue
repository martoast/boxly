<!-- components/Landing/FunnelCapture.vue -->
<template>
  <div class="bg-white/90 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-xl border border-gray-100 animate-fadeIn">
    <!-- Header -->
    <div class="text-center mb-6">
      <h3 class="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
        {{ t.title }}
      </h3>
      <p class="text-sm sm:text-base text-gray-600">
        {{ t.subtitle }}
      </p>
    </div>

    <!-- Success Message -->
    <Transition
      enter-active-class="transform ease-out duration-300 transition"
      enter-from-class="translate-y-2 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="successMessage" class="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 shadow-md mb-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="w-5 h-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-green-800">
              {{ successMessage }}
            </p>
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
      <div v-if="errorMessage || Object.keys(errors).length > 0" class="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 shadow-md animate-shake mb-4">
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
              <li v-for="(messages, field) in errors" :key="field" class="flex items-start">
                <span class="inline-block w-2 h-2 bg-red-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                <span>{{ messages[0] }}</span>
              </li>
            </ul>
          </div>
          <button @click="clearErrors" class="ml-3 flex-shrink-0">
            <svg class="w-5 h-5 text-red-400 hover:text-red-600 transition-colors" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
      </div>
    </Transition>

    <form @submit.prevent="handleSubmit" class="space-y-5">
      <!-- Name Field -->
      <div>
        <label for="capture-name" class="block text-sm font-semibold text-gray-900 mb-2">
          {{ t.nameLabel }}
        </label>
        <div class="relative">
          <input
            v-model="form.name"
            type="text"
            id="capture-name"
            autocomplete="name"
            :placeholder="t.namePlaceholder"
            :class="[
              'w-full pl-10 pr-3 py-3 rounded-lg border text-base focus:outline-none focus:ring-2 transition-all duration-200',
              errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-primary-500 focus:ring-primary-500'
            ]"
            required
            :disabled="loading || submitted"
            @input="clearFieldError('name')"
          >
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
          </div>
        </div>
        <p v-if="errors.name" class="mt-1 text-sm text-red-600">{{ errors.name[0] }}</p>
      </div>

      <!-- Email Field -->
      <div>
        <label for="capture-email" class="block text-sm font-semibold text-gray-900 mb-2">
          {{ t.emailLabel }}
        </label>
        <div class="relative">
          <input
            v-model="form.email"
            type="email"
            id="capture-email"
            autocomplete="email"
            :placeholder="t.emailPlaceholder"
            :class="[
              'w-full pl-10 pr-3 py-3 rounded-lg border text-base focus:outline-none focus:ring-2 transition-all duration-200',
              errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-primary-500 focus:ring-primary-500'
            ]"
            required
            :disabled="loading || submitted"
            @input="clearFieldError('email')"
          >
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
          </div>
        </div>
        <p v-if="errors.email" class="mt-1 text-sm text-red-600">{{ errors.email[0] }}</p>
      </div>

      <!-- Phone Field with Validation Component -->
      <PhoneValidationInput
        ref="phoneInputRef"
        v-model="form.phone"
        :label="t.phoneLabel"
        :placeholder="t.phonePlaceholder"
        :help-text="t.phoneHelp"
        input-id="funnel-capture-phone"
        :required="true"
        :disabled="loading || submitted"
        @validation-change="handlePhoneValidation"
      />

      <!-- Submit Button -->
      <button
        type="submit"
        :disabled="loading || submitted || !isFormValid"
        class="w-full px-6 py-3.5 rounded-xl inline-flex items-center justify-center gap-2 font-semibold text-base no-underline border-2 border-transparent cursor-pointer transition-all duration-300 bg-primary-500 text-white shadow-lg hover:bg-primary-600 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg"
      >
        <svg v-if="loading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span v-if="!loading && !submitted">{{ t.submitButton }}</span>
        <span v-else-if="loading">{{ t.submittingButton }}</span>
        <span v-else>{{ t.submittedButton }}</span>
      </button>
    </form>

    <!-- Privacy Notice -->
    <p class="mt-4 text-xs text-center text-gray-500">
      {{ t.privacyNotice }}
    </p>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// Props
const props = defineProps({
  variant: {
    type: String,
    default: 'default',
  },
  showHeader: {
    type: Boolean,
    default: true
  },
  redirectAfterSubmit: {
    type: String,
    default: null
  }
})

// Emit events
const emit = defineEmits(['success', 'error'])

// Nuxt imports
const { $customFetch } = useNuxtApp()

// Use the language composable
const { t: createTranslations } = useLanguage()

// Form state
const form = ref({
  name: '',
  email: '',
  phone: '' // Will be E.164 format from component
})

// Phone validation state from component
const phoneInputRef = ref(null)
const phoneValidation = ref({
  isValid: false,
  e164Phone: '',
  formattedPhone: ''
})

// UI state
const loading = ref(false)
const submitted = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const errors = ref({})

// Define translations
const translations = {
  title: {
    es: '¡Únete y Ahorra!',
    en: 'Join & Save!'
  },
  subtitle: {
    es: 'Recibe cupones exclusivos y descuentos especiales en tus envíos',
    en: 'Get exclusive coupons and special discounts on your shipments'
  },
  nameLabel: {
    es: 'Nombre Completo',
    en: 'Full Name'
  },
  namePlaceholder: {
    es: 'Juan Pérez',
    en: 'John Doe'
  },
  emailLabel: {
    es: 'Correo Electrónico',
    en: 'Email Address'
  },
  emailPlaceholder: {
    es: 'tu@email.com',
    en: 'your@email.com'
  },
  phoneLabel: {
    es: 'Número de Teléfono',
    en: 'Phone Number'
  },
  phonePlaceholder: {
    es: '+52 664 123 4567 o +1 619 888 5248',
    en: '+1 619 888 5248 or +52 664 123 4567'
  },
  phoneHelp: {
    es: '⚠️ Incluye el código de país con +. Ejemplos: +52 para México, +1 para USA',
    en: '⚠️ Include country code with +. Examples: +1 for USA, +52 for Mexico'
  },
  submitButton: {
    es: 'Enviar',
    en: 'Submit'
  },
  submittingButton: {
    es: 'Enviando...',
    en: 'Sending...'
  },
  submittedButton: {
    es: '¡Listo!',
    en: 'Done!'
  },
  successMessage: {
    es: '¡Bienvenido! Pronto recibirás tu primer cupón de descuento por email.',
    en: 'Welcome! You\'ll receive your first discount coupon by email soon.'
  },
  generalError: {
    es: 'Ocurrió un error. Por favor, intenta de nuevo.',
    en: 'An error occurred. Please try again.'
  },
  validationError: {
    es: 'Por favor corrige los siguientes errores:',
    en: 'Please correct the following errors:'
  },
  privacyNotice: {
    es: 'Al unirte, aceptas recibir ofertas exclusivas y promociones por email.',
    en: 'By joining, you agree to receive exclusive offers and promotions by email.'
  }
}

// Get reactive translations
const t = createTranslations(translations)

// Handle phone validation changes from component
const handlePhoneValidation = (validation) => {
  phoneValidation.value = validation
  // Update form.phone with E.164 format
  form.value.phone = validation.e164Phone
}

// Form validation
const isFormValid = computed(() => {
  return form.value.name.trim() &&
    form.value.email.trim() &&
    phoneValidation.value.isValid
})

// Methods
const clearErrors = () => {
  errorMessage.value = ''
  errors.value = {}
}

const clearFieldError = (field) => {
  if (errors.value[field]) {
    delete errors.value[field]
  }
}

const resetForm = () => {
  form.value = {
    name: '',
    email: '',
    phone: ''
  }
  
  // Reset phone validation component
  if (phoneInputRef.value) {
    phoneInputRef.value.reset()
  }
  
  phoneValidation.value = {
    isValid: false,
    e164Phone: '',
    formattedPhone: ''
  }
  
  clearErrors()
}

const handleSubmit = async () => {
  // Trigger validation on the phone component
  if (phoneInputRef.value && !(await phoneInputRef.value.validate())) {
    return
  }

  if (!phoneValidation.value.isValid) {
    return
  }

  loading.value = true
  clearErrors()
  successMessage.value = ''

  try {
    const response = await $customFetch('/funnel-capture', {
      method: 'POST',
      body: {
        name: form.value.name.trim(),
        email: form.value.email.trim(),
        phone: phoneValidation.value.e164Phone // Use E.164 format from component
      }
    })

    submitted.value = true
    successMessage.value = t.value.successMessage
    
    emit('success', {
      name: form.value.name,
      email: form.value.email,
      phone: phoneValidation.value.e164Phone
    })

    setTimeout(() => {
      resetForm()
      submitted.value = false
      
      if (props.redirectAfterSubmit) {
        navigateTo(props.redirectAfterSubmit)
      }
    }, 3000)

  } catch (error) {
    console.error('Funnel capture error:', error)
    
    if (error.data) {
      if (error.data.errors) {
        errors.value = error.data.errors
      }
      if (error.data.message) {
        errorMessage.value = error.data.message
      }
    } else {
      errorMessage.value = t.value.generalError
    }
    
    emit('error', error)
  } finally {
    loading.value = false
  }
}

// Expose methods for parent components
defineExpose({
  resetForm,
  submitForm: handleSubmit
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
  animation: fadeIn 0.6s ease-out;
}

.animate-shake {
  animation: shake 0.5s ease-in-out;
}
</style>