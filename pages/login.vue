<template>
  <section class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 via-white to-primary-50/20">
    <div class="max-w-md w-full space-y-8">
      <!-- Logo and Header -->
      <div class="text-center animate-fadeIn">
        <NuxtLink to="/" class="inline-block">
          <img 
          src="/logo.svg" 
          class="h-20 w-20 sm:h-24 sm:w-24 md:h-32 md:w-32 lg:h-40 lg:w-40 inline-flex items-center justify-center"
        />
        </NuxtLink>
        

        <h1 class="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">
          {{ t.loginTitle }}
        </h1>
        <p class="text-sm sm:text-base text-gray-600 max-w-sm mx-auto">
          {{ t.loginSubtitle }}
        </p>
      </div>

      <!-- Error Alert -->
      <Transition
        enter-active-class="transform ease-out duration-300 transition"
        enter-from-class="translate-y-2 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="errorMessage || Object.keys(errors).length > 0" class="bg-red-50 border-l-4 border-red-500 rounded-lg shadow-md animate-shake">
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

      <!-- Login Form -->
      <div class="bg-white/90 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-xl border border-gray-100 animate-fadeIn">
        <form @submit.prevent="handleLogin" class="space-y-5">
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
                  'w-full pl-10 pr-3 py-3 rounded-lg border text-base focus:outline-none focus:ring-2 transition-all duration-200',
                  errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-primary-500 focus:ring-primary-500'
                ]"
                required
                @input="clearFieldError('email')"
                @blur="validateEmail"
              >
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              </div>
              <!-- Valid email indicator -->
              <Transition
                enter-active-class="transition ease-out duration-200"
                enter-from-class="opacity-0 scale-50"
                enter-to-class="opacity-100 scale-100"
                leave-active-class="transition ease-in duration-150"
                leave-from-class="opacity-100 scale-100"
                leave-to-class="opacity-0 scale-50"
              >
                <div v-if="emailValid" class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                </div>
              </Transition>
            </div>
            <p v-if="errors.email" class="mt-1 text-sm text-red-600">{{ errors.email[0] }}</p>
          </div>

          <!-- Password Field -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label for="password" class="block text-sm font-semibold text-gray-900">
                {{ t.passwordLabel }}
              </label>
              <NuxtLink to="/forgot-password" class="text-sm text-primary-500 hover:text-primary-600 hover:underline transition-colors">
                {{ t.forgotPassword }}
              </NuxtLink>
            </div>
            <div class="relative">
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                id="password"
                autocomplete="current-password"
                :placeholder="t.passwordPlaceholder"
                :class="[
                  'w-full pl-10 pr-12 py-3 rounded-lg border text-base focus:outline-none focus:ring-2 transition-all duration-200',
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
                <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
                  <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                </svg>
              </button>
            </div>
            <p v-if="errors.password" class="mt-1 text-sm text-red-600">{{ errors.password[0] }}</p>
          </div>

          <!-- Remember Me -->
          <div class="flex items-center">
            <input
              v-model="form.remember"
              id="remember"
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500 transition-all"
            >
            <label for="remember" class="ml-2 block text-sm text-gray-700 select-none cursor-pointer">
              {{ t.rememberMe }}
            </label>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="loading || !isFormValid"
            class="w-full px-6 py-3.5 rounded-xl inline-flex items-center justify-center gap-2 font-semibold text-base no-underline border-2 border-transparent cursor-pointer transition-all duration-300 bg-primary-500 text-white shadow-lg hover:bg-primary-600 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg"
          >
            <svg v-if="loading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span v-if="!loading">{{ t.loginButton }}</span>
            <span v-else>{{ t.loggingInButton }}</span>
          </button>
        </form>

        <!-- Divider -->
        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-200"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-4 bg-white text-gray-500">{{ t.orText }}</span>
          </div>
        </div>

        <!-- Google Login -->
        <div class="grid grid-cols-1 gap-3">
          <button
            type="button"
            class="w-full inline-flex justify-center items-center py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all"
            @click="handleSocialLogin('google')"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span class="ml-2">Google</span>
          </button>
        </div>

        <!-- Register Link -->
        <div class="text-center mt-6">
          <p class="text-sm sm:text-base text-gray-600">
            {{ t.dontHaveAccount }}
          </p>
          <NuxtLink :to="registerLink" class="mt-2 inline-flex items-center justify-center w-full px-6 py-3 border-2 border-primary-500 rounded-xl text-primary-500 font-semibold hover:bg-primary-50 transition-all duration-200">
            {{ t.registerLink }}
          </NuxtLink>
        </div>
      </div>

      <!-- Security Notice -->
      <div class="text-center animate-fadeIn" style="animation-delay: 0.3s">
        <div class="inline-flex items-center gap-2 text-xs sm:text-sm text-gray-500">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
          <span>{{ t.secureConnection }}</span>
        </div>
      </div>

      <!-- Back to Home -->
      <div class="text-center">
        <NuxtLink to="/" class="text-gray-500 hover:text-gray-700 text-sm inline-flex items-center gap-2 group transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 transition-transform group-hover:-translate-x-1">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
          {{ t.backToHome }}
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

// Define page meta to use default layout
definePageMeta({
  layout: 'default',
  middleware: 'loggedin'
})

// Nuxt imports
const { $customFetch, $retriveUser } = useNuxtApp()
const runtimeConfig = useRuntimeConfig();

// Use the language composable
const { t: createTranslations } = useLanguage()

// Form state
const form = ref({
  email: '',
  password: '',
  remember: false
})

// UI state
const loading = ref(false)
const showPassword = ref(false)
const errorMessage = ref('')
const errors = ref({})
const emailValid = ref(false)

// Define translations
const translations = {
  loginTitle: {
    es: 'Bienvenido',
    en: 'Welcome'
  },
  loginSubtitle: {
    es: 'Accede a tu cuenta para gestionar tus envíos',
    en: 'Access your account to manage your shipments'
  },
  emailLabel: {
    es: 'Correo Electrónico',
    en: 'Email Address'
  },
  emailPlaceholder: {
    es: 'tu@email.com',
    en: 'your@email.com'
  },
  passwordLabel: {
    es: 'Contraseña',
    en: 'Password'
  },
  passwordPlaceholder: {
    es: 'Ingresa tu contraseña',
    en: 'Enter your password'
  },
  rememberMe: {
    es: 'Mantener sesión iniciada',
    en: 'Keep me signed in'
  },
  forgotPassword: {
    es: '¿Olvidaste tu contraseña?',
    en: 'Forgot password?'
  },
  loginButton: {
    es: 'Iniciar Sesión',
    en: 'Sign In'
  },
  loggingInButton: {
    es: 'Iniciando sesión...',
    en: 'Signing in...'
  },
  orText: {
    es: 'o continúa con',
    en: 'or continue with'
  },
  dontHaveAccount: {
    es: '¿No tienes una cuenta?',
    en: "Don't have an account?"
  },
  registerLink: {
    es: 'Crear Cuenta Gratis',
    en: 'Create Free Account'
  },
  backToHome: {
    es: 'Volver al Inicio',
    en: 'Back to Home'
  },
  invalidCredentials: {
    es: 'Credenciales incorrectas. Por favor, verifica tu email y contraseña.',
    en: 'Invalid credentials. Please check your email and password.'
  },
  generalError: {
    es: 'Ocurrió un error. Por favor, intenta de nuevo.',
    en: 'An error occurred. Please try again.'
  },
  validationError: {
    es: 'Por favor corrige los siguientes errores:',
    en: 'Please correct the following errors:'
  },
  secureConnection: {
    es: 'Conexión segura con encriptación SSL',
    en: 'Secure connection with SSL encryption'
  }
}

// Get reactive translations
const t = createTranslations(translations)

// Form validation
const isFormValid = computed(() => {
  return form.value.email && 
         form.value.password && 
         emailValid.value
})

const registerLink = computed(() => {
  const route = useRoute()
  const redirectTo = route.query.redirect
  
  if (redirectTo) {
    return `/register?redirect=${redirectTo}`
  }
  return '/register'
})


// Methods
const validateEmail = () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  emailValid.value = emailRegex.test(form.value.email)
}

const clearErrors = () => {
  errorMessage.value = ''
  errors.value = {}
}

const clearFieldError = (field) => {
  if (errors.value[field]) {
    delete errors.value[field]
  }
}

const handleLogin = async () => {
  loading.value = true
  clearErrors()

  try {
    await $customFetch('/auth/login', {
      method: 'POST',
      body: {
        email: form.value.email,
        password: form.value.password,
        remember: form.value.remember
      }
    })

    // Check for redirect query parameter
    const route = useRoute()
    const redirectTo = route.query.redirect

    if (redirectTo && typeof redirectTo === 'string' && redirectTo.startsWith('/')) {
      await navigateTo(redirectTo)
    } else {
      // Fetch user to determine role-based redirect
      const user = await $retriveUser()
      if (user?.role === 'admin') {
        await navigateTo('/app/admin/dashboard')
      } else if (user?.role === 'employee') {
        if (user.team === 'shopping') {
          await navigateTo('/app/shopping/purchase-requests')
        } else {
          await navigateTo('/app/employee/packages')
        }
      } else {
        await navigateTo('/app/')
      }
    }

  } catch (error) {
    console.error('Login error:', error)
    
    if (error.data) {
      if (error.data.errors) {
        errors.value = error.data.errors
        if (error.data.errors.email) {
          errorMessage.value = t.value.invalidCredentials
        }
      } else if (error.data.message) {
        errorMessage.value = error.data.message
      }
    } else {
      errorMessage.value = t.value.generalError
    }
  } finally {
    loading.value = false
  }
}

const handleSocialLogin = async (provider) => {
  window.location.href = `${runtimeConfig.public.apiUrl}/auth/google/redirect`
}

// Watch email changes for validation
watch(() => form.value.email, () => {
  if (emailValid.value) {
    validateEmail()
  }
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

@keyframes bounce-subtle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.animate-fadeIn {
  animation: fadeIn 0.6s ease-out;
}

.animate-shake {
  animation: shake 0.5s ease-in-out;
}

.animate-bounce-subtle {
  animation: bounce-subtle 2s ease-in-out infinite;
}
</style>