<template>
    <section class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20">
      <!-- Header -->
      <div class="bg-white/90 backdrop-blur-sm shadow-sm border-b border-gray-100">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900">{{ t.myAccount }}</h1>
              <p class="mt-1 text-sm text-gray-600">{{ t.adminAccountInfo }}</p>
            </div>
            <NuxtLink
              to="/app/admin/account/edit"
              class="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-all"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
              {{ t.editProfile }}
            </NuxtLink>
          </div>
        </div>
      </div>
  
      <!-- Main Content -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Left Column - Profile Info -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Basic Information -->
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 class="text-lg font-bold text-gray-900">{{ t.basicInformation }}</h2>
                <NuxtLink
                  to="/app/admin/account/edit"
                  class="text-sm text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1"
                >
                  {{ t.edit }}
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </NuxtLink>
              </div>
              <div class="p-6 space-y-4">
                <!-- Name -->
                <div>
                  <label class="block text-sm font-medium text-gray-500 mb-1">{{ t.fullName }}</label>
                  <p class="text-base text-gray-900">{{ profileData?.name || '-' }}</p>
                </div>
                
                <!-- Email -->
                <div>
                  <label class="block text-sm font-medium text-gray-500 mb-1">{{ t.email }}</label>
                  <div class="flex items-center gap-2">
                    <p class="text-base text-gray-900">{{ profileData?.email || '-' }}</p>
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                      {{ t.adminRole }}
                    </span>
                  </div>
                </div>
                
                <!-- Phone -->
                <div>
                  <label class="block text-sm font-medium text-gray-500 mb-1">{{ t.phone }}</label>
                  <p class="text-base text-gray-900">{{ profileData?.phone || t.notProvided }}</p>
                </div>
                
                <!-- Language -->
                <div>
                  <label class="block text-sm font-medium text-gray-500 mb-1">{{ t.preferredLanguage }}</label>
                  <p class="text-base text-gray-900">
                    {{ currentLanguageDisplay }}
                  </p>
                </div>
  
                <!-- Member Since -->
                <div>
                  <label class="block text-sm font-medium text-gray-500 mb-1">{{ t.memberSince }}</label>
                  <p class="text-base text-gray-900">{{ formatDate(profileData?.created_at) }}</p>
                </div>
              </div>
            </div>
  
           
          </div>
  
          <!-- Right Column - Quick Actions -->
          <div class="space-y-6">
            <!-- Quick Actions -->
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div class="px-6 py-4 border-b border-gray-100">
                <h3 class="font-semibold text-gray-900">{{ t.quickActions }}</h3>
              </div>
              <div class="p-6 space-y-3">
                <NuxtLink
                  to="/app/admin"
                  class="w-full flex items-center gap-3 px-4 py-3 text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                  </svg>
                  {{ t.goToDashboard }}
                </NuxtLink>
                
                <NuxtLink
                  to="/app/admin/orders"
                  class="w-full flex items-center gap-3 px-4 py-3 text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                  </svg>
                  {{ t.manageOrders }}
                </NuxtLink>
                
                <NuxtLink
                  to="/app/admin/packages"
                  class="w-full flex items-center gap-3 px-4 py-3 text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                  </svg>
                  {{ t.viewPackages }}
                </NuxtLink>
                
                <button
                  @click="handleLogout"
                  class="w-full flex items-center gap-3 px-4 py-3 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                  </svg>
                  {{ t.logout }}
                </button>
              </div>
            </div>
  
            <!-- Support -->
            <div class="bg-gradient-to-r from-primary-50 to-primary-100/50 rounded-2xl p-6 border border-primary-200/50">
              <div class="flex items-center gap-3 mb-3">
                <div class="p-2 bg-primary-100 rounded-lg">
                  <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <h3 class="font-semibold text-gray-900">{{ t.needHelp }}</h3>
              </div>
              <p class="text-sm text-gray-700 mb-4">{{ t.supportText }}</p>
              
              <!-- Contact Options -->
              <div class="space-y-3">
                <!-- WhatsApp -->
                <a
                  href="https://wa.me/16195591910"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
                >
                  <div class="p-2 bg-green-100 rounded-lg flex-shrink-0">
                    <svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm.029 18.88c-1.161 0-2.305-.292-3.318-.844l-3.677.964.98-3.686c-.592-1.02-.9-2.176-.898-3.358.002-3.808 3.105-6.912 6.913-6.912 3.809 0 6.913 3.104 6.913 6.913s-3.104 6.923-6.913 6.923z"/>
                    </svg>
                  </div>
                  <div class="flex-1">
                    <p class="text-sm font-medium text-gray-900">{{ t.whatsapp }}</p>
                    <p class="text-xs text-gray-500">+1 (619) 559-1910</p>
                  </div>
                  <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                  </svg>
                </a>
                
                <!-- Email -->
                <a
                  href="mailto:contact@boxly.mx"
                  class="flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
                >
                  <div class="p-2 bg-primary-100 rounded-lg flex-shrink-0">
                    <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                  </div>
                  <div class="flex-1">
                    <p class="text-sm font-medium text-gray-900">{{ t.email }}</p>
                    <p class="text-xs text-gray-500">contact@boxly.mx</p>
                  </div>
                  <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </template>
  
  <script setup>
  import { ref, onMounted, computed } from 'vue'
  
  definePageMeta({
    layout: 'admin',
    middleware: ['auth', 'admin']
  })
  
  // Nuxt imports
  const { $customFetch } = useNuxtApp()
  const user = useUser().value
  
  // Use the language composable
  const { t: createTranslations, language } = useLanguage()
  
  // State
  const profileData = ref(null)
  const loading = ref(true)
  
  // Computed property for current language display
  const currentLanguageDisplay = computed(() => {
    return language.value === 'es' ? 'Español' : 'English'
  })
  
  // Translations
  const translations = {
    myAccount: {
      es: 'Mi Cuenta',
      en: 'My Account'
    },
    adminAccountInfo: {
      es: 'Panel de administrador y configuración de cuenta',
      en: 'Admin panel and account settings'
    },
    editProfile: {
      es: 'Editar Perfil',
      en: 'Edit Profile'
    },
    basicInformation: {
      es: 'Información Básica',
      en: 'Basic Information'
    },
    fullName: {
      es: 'Nombre Completo',
      en: 'Full Name'
    },
    email: {
      es: 'Correo Electrónico',
      en: 'Email'
    },
    phone: {
      es: 'Teléfono',
      en: 'Phone'
    },
    preferredLanguage: {
      es: 'Idioma Preferido',
      en: 'Preferred Language'
    },
    memberSince: {
      es: 'Miembro Desde',
      en: 'Member Since'
    },
    adminRole: {
      es: 'Administrador',
      en: 'Administrator'
    },
    quickActions: {
      es: 'Acciones Rápidas',
      en: 'Quick Actions'
    },
    goToDashboard: {
      es: 'Ir al Dashboard',
      en: 'Go to Dashboard'
    },
    manageOrders: {
      es: 'Administrar Órdenes',
      en: 'Manage Orders'
    },
    viewPackages: {
      es: 'Ver Paquetes',
      en: 'View Packages'
    },
    logout: {
      es: 'Cerrar Sesión',
      en: 'Logout'
    },
    adminSupport: {
      es: 'Soporte Técnico',
      en: 'Technical Support'
    },
    adminSupportText: {
      es: 'Contacta al equipo técnico para soporte del sistema',
      en: 'Contact technical team for system support'
    },
    contactSupport: {
      es: 'Contactar Soporte',
      en: 'Contact Support'
    },
    notProvided: {
      es: 'No proporcionado',
      en: 'Not provided'
    },
    edit: {
      es: 'Editar',
      en: 'Edit'
    },
    whatsapp: {
      es: 'WhatsApp',
      en: 'WhatsApp'
    },
    email: {
      es: 'Correo Electrónico',
      en: 'Email'
    },
    needHelp: {
      es: '¿Necesitas Ayuda?',
      en: 'Need Help?'
    },
    supportText: {
      es: 'Nuestro equipo está aquí para ayudarte',
      en: 'Our team is here to help you'
    },
  }
  
  // Get reactive translations
  const t = createTranslations(translations)
  
  // Methods
  const fetchProfile = async () => {
    loading.value = true
    try {
      const response = await $customFetch('/profile')
      profileData.value = response.data
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      loading.value = false
    }
  }
  
  const formatDate = (date) => {
    if (!date) return '-'
    const locale = language.value === 'es' ? 'es-MX' : 'en-US'
    return new Date(date).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }
  
  const handleLogout = async () => {
    try {
      await $customFetch('/auth/logout', {
        method: 'POST'
      })
      
      useState('user', () => null)
      const csrfCookie = useCookie('XSRF-TOKEN')
      csrfCookie.value = null
      
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout error:', error)
    }
  }
  
  // Fetch data on mount
  onMounted(() => {
    fetchProfile()
  })
  </script>