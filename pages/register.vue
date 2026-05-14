<template>
  <section class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20 px-4 py-6">
    <div class="max-w-sm mx-auto">
      <!-- Header with Progress -->
      <div class="text-center mb-8">
        <!-- Logo -->
        <NuxtLink to="/" class="inline-block">
          <img 
          src="/logo.svg" 
          class="h-20 w-20 sm:h-24 sm:w-24 md:h-32 md:w-32 lg:h-40 lg:w-40 inline-flex items-center justify-center"
        />
        </NuxtLink>
        
        <!-- Progress Bar -->
        <div class="mb-4">
          <div class="flex items-center justify-center gap-2 mb-2">
            <div v-for="step in totalSteps" :key="step" :class="[
              'w-2 h-2 rounded-full transition-all duration-300',
              step <= currentStep ? 'bg-primary-500' : 'bg-gray-200'
            ]"></div>
          </div>
          <p class="text-xs text-gray-500">{{ currentStep }}/{{ totalSteps }}</p>
        </div>
        
        <!-- Dynamic Title -->
        <h1 class="text-xl font-bold text-gray-900 mb-1">
          {{ currentStepTitle }}
        </h1>
        <p class="text-sm text-gray-600">
          {{ currentStepSubtitle }}
        </p>
      </div>

      <!-- Error Alert -->
      <Transition
        enter-active-class="transform ease-out duration-300"
        enter-from-class="translate-y-2 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="errorMessage || Object.keys(errors).length > 0" class="bg-red-50 border-l-4 border-red-500 rounded-lg p-3 mb-6 shadow-sm">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="w-4 h-4 text-red-400 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
              </svg>
            </div>
            <div class="ml-2 flex-1">
              <p class="text-xs font-medium text-red-800">
                {{ errorMessage || getFirstError() }}
              </p>
            </div>
            <button @click="clearErrors" class="ml-2 flex-shrink-0">
              <svg class="w-4 h-4 text-red-400 hover:text-red-600" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
              </svg>
            </button>
          </div>
        </div>
      </Transition>

      <!-- Form Container -->
      <div class="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <!-- Step Content -->
        <div class="p-6">
          <!-- Step 1: Basic Info -->
          <div v-if="currentStep === 1" class="space-y-4">
            <!-- Name Field -->
            <div>
              <label for="name" class="block text-sm font-semibold text-gray-900 mb-2">
                {{ t.nameLabel }}
              </label>
              <div class="relative">
                <input
                  ref="nameInput"
                  v-model="form.name"
                  type="text"
                  id="name"
                  autocomplete="name"
                  :placeholder="t.namePlaceholder"
                  :class="[
                    'w-full pl-10 pr-3 py-3 rounded-xl border text-base focus:outline-none focus:ring-2 transition-all duration-200',
                    errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-primary-500 focus:ring-primary-500'
                  ]"
                  required
                  @input="clearFieldError('name')"
                >
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                </div>
              </div>
            </div>

            <!-- Email Field -->
            <div>
              <label for="email" class="block text-sm font-semibold text-gray-900 mb-2">
                {{ t.emailLabel }}
              </label>
              <div class="relative">
                <input
                  v-model="form.email"
                  type="email"
                  id="email"
                  autocomplete="email"
                  :placeholder="t.emailPlaceholder"
                  :class="[
                    'w-full pl-10 pr-3 py-3 rounded-xl border text-base focus:outline-none focus:ring-2 transition-all duration-200',
                    errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-primary-500 focus:ring-primary-500'
                  ]"
                  required
                  @input="clearFieldError('email')"
                >
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                </div>
              </div>
            </div>

            <!-- Phone Field with Validation Component -->
            <PhoneValidationInput
              ref="phoneInputRef"
              v-model="form.phone"
              :label="t.phoneLabel"
              :placeholder="t.phonePlaceholder"
              :help-text="t.phoneHelp"
              input-id="register-phone"
              :required="true"
              @validation-change="handlePhoneValidation"
            />
          </div>

          <!-- Step 2: Password & Terms -->
          <div v-if="currentStep === 2" class="space-y-4">
            <!-- Password Field -->
            <div>
              <label for="password" class="block text-sm font-semibold text-gray-900 mb-2">
                {{ t.passwordLabel }}
              </label>
              <div class="relative">
                <input
                  ref="passwordInput"
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  id="password"
                  autocomplete="new-password"
                  :placeholder="t.passwordPlaceholder"
                  :class="[
                    'w-full pl-10 pr-12 py-3 rounded-xl border text-base focus:outline-none focus:ring-2 transition-all duration-200',
                    errors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-primary-500 focus:ring-primary-500'
                  ]"
                  required
                  @input="clearFieldError('password')"
                >
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                </div>
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
                >
                  <svg v-if="!showPassword" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                  </svg>
                  <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                  </svg>
                </button>
              </div>
              
              <!-- Password strength indicator -->
              <div v-if="form.password" class="mt-2">
                <div class="flex items-center gap-1">
                  <div v-for="i in 4" :key="i" :class="[
                    'h-1 flex-1 rounded-full transition-all duration-300',
                    i <= passwordStrength ? passwordStrengthColor : 'bg-gray-200'
                  ]"></div>
                </div>
                <p class="text-xs mt-1" :class="passwordStrengthTextColor">
                  {{ passwordStrengthText }}
                </p>
              </div>
            </div>

            <!-- Password Confirmation Field -->
            <div>
              <label for="password_confirmation" class="block text-sm font-semibold text-gray-900 mb-2">
                {{ t.passwordConfirmLabel }}
              </label>
              <div class="relative">
                <input
                  v-model="form.password_confirmation"
                  :type="showPasswordConfirm ? 'text' : 'password'"
                  id="password_confirmation"
                  autocomplete="new-password"
                  :placeholder="t.passwordConfirmPlaceholder"
                  :class="[
                    'w-full pl-10 pr-12 py-3 rounded-xl border text-base focus:outline-none focus:ring-2 transition-all duration-200',
                    errors.password_confirmation || (form.password_confirmation && form.password !== form.password_confirmation) 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-200 focus:border-primary-500 focus:ring-primary-500'
                  ]"
                  required
                  @input="clearFieldError('password_confirmation')"
                >
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                  </svg>
                </div>
                <button
                  type="button"
                  @click="showPasswordConfirm = !showPasswordConfirm"
                  class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
                >
                  <svg v-if="!showPasswordConfirm" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                  </svg>
                  <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                  </svg>
                </button>
              </div>
              <p v-if="form.password_confirmation && form.password !== form.password_confirmation" class="mt-1 text-xs text-red-600">
                {{ t.passwordMismatch }}
              </p>
            </div>

            <!-- Terms of Service Checkbox - Card Style -->
            <div class="pt-2">
              <label
                :class="[
                  'flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200',
                  errors.agree_to_terms
                    ? 'border-red-300 bg-red-50/50'
                    : form.agree_to_terms
                      ? 'border-primary-500 bg-primary-50/50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                ]"
              >
                <!-- Custom Checkbox -->
                <div
                  :class="[
                    'w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200',
                    errors.agree_to_terms
                      ? 'bg-white border-red-300'
                      : form.agree_to_terms
                        ? 'bg-primary-500 border-primary-500'
                        : 'bg-white border-gray-300'
                  ]"
                >
                  <svg
                    v-if="form.agree_to_terms"
                    class="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <input
                  v-model="form.agree_to_terms"
                  type="checkbox"
                  id="agree_to_terms"
                  class="sr-only"
                  @change="clearFieldError('agree_to_terms')"
                >
                <!-- Icon & Text -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <svg class="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span class="text-sm font-semibold text-gray-900">
                      {{ t.agreeToTermsPrefix }}
                      <NuxtLink
                        to="/terms-of-service"
                        target="_blank"
                        class="text-primary-500 hover:text-primary-600 underline transition-colors"
                        @click.stop
                      >
                        {{ t.termsOfService }}
                      </NuxtLink>
                      <span class="text-red-500 ml-1">*</span>
                    </span>
                  </div>
                </div>
              </label>
              <p v-if="errors.agree_to_terms" class="mt-2 text-xs text-red-600">
                {{ errors.agree_to_terms[0] }}
              </p>
            </div>
          </div>
        </div>

        <!-- Navigation Buttons -->
        <div class="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <div class="flex gap-3">
            <!-- Back Button -->
            <button
              v-if="currentStep > 1"
              @click="goToPreviousStep"
              type="button"
              class="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all duration-200"
            >
              {{ t.backButton }}
            </button>
            
            <!-- Next/Submit Button -->
            <button
              @click="handleNext"
              :disabled="!canProceed || loading"
              :class="[
                'flex-1 px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2',
                canProceed && !loading
                  ? 'bg-primary-500 text-white hover:bg-primary-600 shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              ]"
            >
              <svg v-if="loading" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span v-if="!loading">
                {{ isLastStep ? t.createAccountButton : t.nextButton }}
              </span>
              <span v-else>
                {{ t.creatingAccountButton }}
              </span>
            </button>
          </div>
        </div>
      </div>

      <!-- Social Login Section -->
      <div v-if="currentStep === 1" class="mt-6">
        <!-- Divider -->
        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-200"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-3 bg-gray-50 text-gray-500">{{ t.orText }}</span>
          </div>
        </div>

        <!-- Google Sign Up Button -->
        <button
          @click="handleGoogleSignUp"
          class="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
        >
          <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {{ t.continueWithGoogle }}
        </button>
      </div>

      <!-- Login Link -->
      <div class="mt-6 text-center">
        <p class="text-sm text-gray-600">
          {{ t.alreadyHaveAccount }}
          <NuxtLink :to="loginLink" class="text-primary-500 font-semibold hover:text-primary-600 transition-colors">
            {{ t.loginLink }}
          </NuxtLink>
        </p>
      </div>

      <!-- Back to Home -->
      <div class="mt-4 text-center">
        <NuxtLink to="/" class="text-gray-500 hover:text-gray-700 text-sm inline-flex items-center gap-1 group transition-colors">
          <svg class="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
          {{ t.backToHome }}
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'

// Define page meta
definePageMeta({
  layout: 'default',
  middleware: 'loggedin'
})

// Nuxt imports
const { $customFetch, $fbq } = useNuxtApp()
const route = useRoute()
const runtimeConfig = useRuntimeConfig()

// Use the language composable
const { t: createTranslations, language } = useLanguage()

// Multi-step state
const currentStep = ref(1)
const totalSteps = ref(2)

// Affiliate ref composable - getAffiliateCode reads from cookie
const { getAffiliateCode } = useAffiliateRef()

// Form state
const form = ref({
  name: '',
  email: '',
  phone: '',
  password: '',
  password_confirmation: '',
  registration_source: '',
  agree_to_terms: false
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
const showPassword = ref(false)
const showPasswordConfirm = ref(false)
const errorMessage = ref('')
const errors = ref({})

// Get redirect parameter from route
const redirectTo = route.query.redirect

// Computed property for login link with redirect parameter
const loginLink = computed(() => {
  if (redirectTo && typeof redirectTo === 'string') {
    return `/login?redirect=${encodeURIComponent(redirectTo)}`
  }
  return '/login'
})

// Define translations
const translations = {
  // Step titles
  stepOneTitle: {
    es: 'Crear cuenta',
    en: 'Create account'
  },
  stepOneSubtitle: {
    es: 'Solo necesitamos algunos detalles',
    en: 'We just need a few details'
  },
  stepTwoTitle: {
    es: 'Crear contraseña',
    en: 'Create password'
  },
  stepTwoSubtitle: {
    es: 'Mantén tu cuenta segura',
    en: 'Keep your account secure'
  },
  
  // Form fields
  nameLabel: {
    es: 'Nombre completo',
    en: 'Full name'
  },
  namePlaceholder: {
    es: 'Juan Pérez',
    en: 'John Doe'
  },
  emailLabel: {
    es: 'Correo electrónico',
    en: 'Email address'
  },
  emailPlaceholder: {
    es: 'tu@email.com',
    en: 'your@email.com'
  },
  phoneLabel: {
    es: 'Teléfono',
    en: 'Phone number'
  },
  phonePlaceholder: {
    es: '+52 664 123 4567',
    en: '+1 619 888 5248'
  },
  phoneHelp: {
    es: 'Incluye el código de país con +. Ejemplos: +52 para México, +1 para USA',
    en: 'Include country code with +. Examples: +1 for USA, +52 for Mexico'
  },
  passwordLabel: {
    es: 'Contraseña',
    en: 'Password'
  },
  passwordPlaceholder: {
    es: 'Mínimo 8 caracteres',
    en: 'Minimum 8 characters'
  },
  passwordConfirmLabel: {
    es: 'Confirmar contraseña',
    en: 'Confirm password'
  },
  passwordConfirmPlaceholder: {
    es: 'Repite tu contraseña',
    en: 'Repeat your password'
  },
  
  // Terms of Service
  agreeToTermsPrefix: {
    es: 'Acepto los',
    en: 'I agree to the'
  },
  termsOfService: {
    es: 'Términos de Servicio',
    en: 'Terms of Service'
  },
  
  // Buttons
  nextButton: {
    es: 'Continuar',
    en: 'Continue'
  },
  backButton: {
    es: 'Atrás',
    en: 'Back'
  },
  createAccountButton: {
    es: 'Crear cuenta',
    en: 'Create account'
  },
  creatingAccountButton: {
    es: 'Creando...',
    en: 'Creating...'
  },
  
  // Social and links
  orText: {
    es: 'o',
    en: 'or'
  },
  continueWithGoogle: {
    es: 'Continuar con Google',
    en: 'Continue with Google'
  },
  alreadyHaveAccount: {
    es: '¿Ya tienes cuenta?',
    en: 'Already have an account?'
  },
  loginLink: {
    es: 'Inicia sesión',
    en: 'Sign in'
  },
  backToHome: {
    es: 'Volver al inicio',
    en: 'Back to home'
  },
  
  // Password strength
  weakPassword: {
    es: 'Débil',
    en: 'Weak'
  },
  fairPassword: {
    es: 'Regular',
    en: 'Fair'
  },
  goodPassword: {
    es: 'Buena',
    en: 'Good'
  },
  strongPassword: {
    es: 'Fuerte',
    en: 'Strong'
  },
  
  // Errors
  passwordMismatch: {
    es: 'Las contraseñas no coinciden',
    en: 'Passwords do not match'
  },
  generalError: {
    es: 'Ocurrió un error. Intenta de nuevo.',
    en: 'An error occurred. Please try again.'
  },
  noAccountError: {
    es: 'No existe una cuenta con este email.',
    en: 'No account exists with this email.'
  },
  termsRequired: {
    es: 'Debes aceptar los términos de servicio',
    en: 'You must accept the terms of service'
  }
}

// Get reactive translations
const t = createTranslations(translations)

// Computed properties for step management
const currentStepTitle = computed(() => {
  switch (currentStep.value) {
    case 1: return t.value.stepOneTitle
    case 2: return t.value.stepTwoTitle
    default: return ''
  }
})

const currentStepSubtitle = computed(() => {
  switch (currentStep.value) {
    case 1: return t.value.stepOneSubtitle
    case 2: return t.value.stepTwoSubtitle
    default: return ''
  }
})

const isLastStep = computed(() => currentStep.value === totalSteps.value)

// Handle phone validation changes from component
const handlePhoneValidation = (validation) => {
  phoneValidation.value = validation
  form.value.phone = validation.e164Phone
}

// Step validation
const canProceed = computed(() => {
  switch (currentStep.value) {
    case 1:
      return form.value.name.trim() !== '' && 
             form.value.email.trim() !== '' && 
             phoneValidation.value.isValid
    case 2:
      return form.value.password !== '' &&
             form.value.password_confirmation !== '' &&
             form.value.password === form.value.password_confirmation &&
             passwordStrength.value >= 2 &&
             form.value.agree_to_terms === true
    default:
      return false
  }
})

// Password strength calculation
const passwordStrength = computed(() => {
  const password = form.value.password
  if (!password) return 0
  
  let strength = 0
  if (password.length >= 8) strength++
  if (password.length >= 12) strength++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
  if (/[0-9]/.test(password) && /[^a-zA-Z0-9]/.test(password)) strength++
  
  return strength
})

const passwordStrengthColor = computed(() => {
  const colors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500']
  return colors[passwordStrength.value]
})

const passwordStrengthTextColor = computed(() => {
  const colors = ['', 'text-red-600', 'text-orange-600', 'text-yellow-600', 'text-green-600']
  return colors[passwordStrength.value]
})

const passwordStrengthText = computed(() => {
  const texts = ['', t.value.weakPassword, t.value.fairPassword, t.value.goodPassword, t.value.strongPassword]
  return texts[passwordStrength.value]
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

const getFirstError = () => {
  const firstField = Object.keys(errors.value)[0]
  return firstField ? errors.value[firstField][0] : ''
}

const goToPreviousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
    clearErrors()
  }
}

const goToNextStep = async () => {
  // Final phone validation before moving to step 2
  if (currentStep.value === 1) {
    if (phoneInputRef.value && !phoneInputRef.value.validate()) {
      return
    }
  }
  
  if (currentStep.value < totalSteps.value) {
    currentStep.value++
    clearErrors()
    
    // Focus on first input of next step
    await nextTick()
    if (currentStep.value === 2) {
      const passwordInput = document.querySelector('#password')
      if (passwordInput) passwordInput.focus()
    }
  }
}

const handleNext = async () => {
  if (!canProceed.value) return
  
  if (isLastStep.value) {
    await handleRegister()
  } else {
    await goToNextStep()
  }
}

const handleRegister = async () => {
  // Final phone validation before submit
  if (phoneInputRef.value && !phoneInputRef.value.validate()) {
    return
  }

  if (!phoneValidation.value.isValid) {
    return
  }

  // Validate terms checkbox
  if (!form.value.agree_to_terms) {
    errors.value.agree_to_terms = [t.value.termsRequired]
    return
  }

  loading.value = true
  clearErrors()

  try {
    // Get affiliate code from cookie
    const affiliateCode = getAffiliateCode()
    console.log('[Register] Affiliate code from cookie:', affiliateCode)

    // Build registration payload
    const payload = {
      name: form.value.name,
      email: form.value.email,
      phone: phoneValidation.value.e164Phone,
      password: form.value.password,
      password_confirmation: form.value.password_confirmation,
      registration_source: form.value.registration_source || undefined,
      referred_by: affiliateCode || undefined
    }

    console.log('[Register] Sending registration payload:', payload)

    await $customFetch('/auth/register', {
      method: 'POST',
      body: payload
    })

    if ($fbq) {
      $fbq('track', 'CompleteRegistration')
    }
    
    // Success - redirect
    if (redirectTo && typeof redirectTo === 'string') {
      if (redirectTo.startsWith('/')) {
        await navigateTo(redirectTo)
      } else {
        await navigateTo('/app/')
      }
    } else {
      await navigateTo('/app/')
    }
  } catch (error) {
    console.error('Registration error:', error)
    
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
  } finally {
    loading.value = false
  }
}

const handleGoogleSignUp = () => { 
  const state = btoa(JSON.stringify({
    tracking: form.value.registration_source || null,
    redirect: redirectTo || null
  }))
  
  window.location.href = `${runtimeConfig.public.apiUrl}/auth/google/redirect?state=${encodeURIComponent(state)}`
}

// Get registration source from URL parameters
const getRegistrationSource = () => {
  const params = route.query
  
  const trackingData = {
    utm_source: params.utm_source || null,
    utm_medium: params.utm_medium || null,
    utm_campaign: params.utm_campaign || null,
    utm_content: params.utm_content || null,
    utm_term: params.utm_term || null,
    fbclid: params.fbclid || null,
    gclid: params.gclid || null,
    landing_page: params.source || null,
    referrer: document.referrer || null,
    timestamp: new Date().toISOString()
  }
  
  const hasTrackingData = Object.values(trackingData).some(value => value !== null)
  if (hasTrackingData) {
    form.value.registration_source = JSON.stringify(trackingData)
  }
}

// Lifecycle
onMounted(() => {
  if (route.query.error === 'no_account') {
    errorMessage.value = t.value.noAccountError
  }

  getRegistrationSource()

  // Focus on name input
  nextTick(() => {
    const nameInput = document.querySelector('#name')
    if (nameInput) nameInput.focus()
  })
})
</script>

<style scoped>
/* Custom animations for smooth transitions */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}

.animate-fadeIn {
  animation: fadeIn 0.4s ease-out;
}

.animate-slideIn {
  animation: slideIn 0.3s ease-out;
}

/* Focus styles for better accessibility */
input:focus, button:focus {
  outline: none;
}

/* Smooth transitions for all interactive elements */
button, input, .transition-all {
  transition: all 0.2s ease;
}

/* Enhanced hover effects */
button:hover:not(:disabled) {
  transform: translateY(-1px);
}

button:active:not(:disabled) {
  transform: translateY(0);
}

/* Mobile-optimized touch targets */
@media (max-width: 640px) {
  button, input {
    min-height: 44px; /* iOS recommended touch target */
  }
}
</style>