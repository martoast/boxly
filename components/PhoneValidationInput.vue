<!-- components/PhoneValidationInput.vue -->
<template>
    <div>
      <label v-if="showLabel" :for="inputId" class="block text-sm font-semibold text-gray-900 mb-2">
        {{ label }} <span v-if="required" class="text-red-500">*</span>
      </label>
      <div class="relative">
        <input
          v-model="phoneInput"
          type="tel"
          :id="inputId"
          autocomplete="tel"
          :placeholder="placeholder"
          :disabled="disabled"
          :class="[
            'w-full pl-10 pr-10 py-3 rounded-lg border text-base focus:outline-none focus:ring-2 transition-all duration-200',
            validationState === 'invalid' ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 
            validationState === 'valid' ? 'border-green-300 focus:border-green-500 focus:ring-green-500' : 
            'border-gray-200 focus:border-primary-500 focus:ring-primary-500',
            disabled ? 'bg-gray-50 cursor-not-allowed' : ''
          ]"
          :required="required"
          @input="handleInput"
          @blur="handleBlur"
        >
        <!-- Phone Icon -->
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
          </svg>
        </div>
        <!-- Validation Icon -->
        <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <svg v-if="validationState === 'valid'" class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
          </svg>
          <svg v-else-if="validationState === 'invalid'" class="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
          </svg>
        </div>
      </div>
      <!-- Error Message -->
      <p v-if="validationState === 'invalid' && errorMessage" class="mt-1 text-sm text-red-600">
        {{ errorMessage }}
      </p>
      <!-- Success Message (Formatted Phone) -->
      <p v-else-if="validationState === 'valid' && formattedPhone" class="mt-1 text-sm text-green-600">
        {{ t.phoneFormatted }}: {{ formattedPhone }}
      </p>
      <!-- Help Text -->
      <p v-else class="mt-1 text-xs text-gray-500">
        {{ helpText }}
      </p>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, watch } from 'vue'
  
  // Props
  const props = defineProps({
    modelValue: {
      type: String,
      default: ''
    },
    label: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: ''
    },
    helpText: {
      type: String,
      default: ''
    },
    required: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    showLabel: {
      type: Boolean,
      default: true
    },
    inputId: {
      type: String,
      default: 'phone'
    },
    validateOnMount: {
      type: Boolean,
      default: false
    }
  })
  
  // Emits
  const emit = defineEmits(['update:modelValue', 'validation-change', 'formatted-phone'])
  
  // Nuxt imports
  const { $phone } = useNuxtApp()
  
  // Use the language composable
  const { t: createTranslations } = useLanguage()
  
  // Define translations
  const translations = {
    phoneFormatted: {
      es: 'Formato',
      en: 'Format'
    },
    phoneInvalid: {
      es: '❌ Debes incluir el código de país con +. Ejemplo: +52 664 123 4567 o +1 619 888 5248',
      en: '❌ You must include country code with +. Example: +1 619 888 5248 or +52 664 123 4567'
    }
  }
  
  // Get reactive translations
  const t = createTranslations(translations)
  
  // State
  const phoneInput = ref('')
  const validationState = ref('neutral') // 'neutral', 'valid', 'invalid'
  const errorMessage = ref('')
  const formattedPhone = ref('')
  const e164Phone = ref('')
  
  // Validation debounce timeout
  let validationTimeout = null
  
  // Watch for external modelValue changes
  watch(() => props.modelValue, (newValue) => {
    if (newValue !== phoneInput.value) {
      phoneInput.value = newValue || ''
      if (props.validateOnMount && newValue) {
        validatePhone()
      }
    }
  }, { immediate: true })
  
  // 🔥 Phone validation WITHOUT auto-country assumption
  const validatePhone = async () => {
    if (!phoneInput.value.trim()) {
      validationState.value = 'neutral'
      errorMessage.value = ''
      formattedPhone.value = ''
      e164Phone.value = ''
      emit('update:modelValue', '')
      emit('validation-change', { isValid: false, e164Phone: '', formattedPhone: '' })
      return false
    }

    try {
      let phoneToValidate = phoneInput.value.trim()

      // ✅ MUST start with + (has country code)
      if (!phoneToValidate.startsWith('+')) {
        validationState.value = 'invalid'
        errorMessage.value = t.value.phoneInvalid
        formattedPhone.value = ''
        e164Phone.value = ''
        emit('update:modelValue', phoneInput.value)
        emit('validation-change', { isValid: false, e164Phone: '', formattedPhone: '' })
        return false
      }

      // Validate the phone number with country code
      if (await $phone.isValid(phoneToValidate)) {
        const phoneNumber = await $phone.parse(phoneToValidate)
        const formatted = phoneNumber.formatInternational()
        const e164 = phoneNumber.format('E.164')
        
        formattedPhone.value = formatted
        e164Phone.value = e164
        validationState.value = 'valid'
        errorMessage.value = ''
        
        emit('update:modelValue', e164) // Emit E.164 format
        emit('formatted-phone', formatted) // Emit formatted version
        emit('validation-change', { isValid: true, e164Phone: e164, formattedPhone: formatted })
        return true
      } else {
        validationState.value = 'invalid'
        errorMessage.value = t.value.phoneInvalid
        formattedPhone.value = ''
        e164Phone.value = ''
        emit('update:modelValue', phoneInput.value)
        emit('validation-change', { isValid: false, e164Phone: '', formattedPhone: '' })
        return false
      }
    } catch (error) {
      validationState.value = 'invalid'
      errorMessage.value = t.value.phoneInvalid
      formattedPhone.value = ''
      e164Phone.value = ''
      emit('update:modelValue', phoneInput.value)
      emit('validation-change', { isValid: false, e164Phone: '', formattedPhone: '' })
      return false
    }
  }
  
  const handleInput = () => {
    // Clear validation state while typing
    if (validationState.value !== 'neutral') {
      validationState.value = 'neutral'
    }
    
    // Clear any pending validation
    if (validationTimeout) {
      clearTimeout(validationTimeout)
    }
    
    // Validate after a short delay (debounce effect)
    if (phoneInput.value.trim().length > 3) {
      validationTimeout = setTimeout(() => {
        validatePhone()
      }, 500)
    } else {
      // If too short, just emit the raw value
      emit('update:modelValue', phoneInput.value)
      emit('validation-change', { isValid: false, e164Phone: '', formattedPhone: '' })
    }
  }
  
  const handleBlur = () => {
    // Clear any pending validation
    if (validationTimeout) {
      clearTimeout(validationTimeout)
    }
    // Validate immediately on blur
    validatePhone()
  }
  
  // Public method to trigger validation (can be called by parent)
  const validate = () => {
    return validatePhone()
  }
  
  // Public method to reset validation state
  const reset = () => {
    phoneInput.value = ''
    validationState.value = 'neutral'
    errorMessage.value = ''
    formattedPhone.value = ''
    e164Phone.value = ''
    emit('update:modelValue', '')
    emit('validation-change', { isValid: false, e164Phone: '', formattedPhone: '' })
  }
  
  // Expose methods for parent components
  defineExpose({
    validate,
    reset,
    isValid: computed(() => validationState.value === 'valid'),
    e164Phone: computed(() => e164Phone.value),
    formattedPhone: computed(() => formattedPhone.value)
  })
  </script>