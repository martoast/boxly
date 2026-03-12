<!-- components/LandingNavbar.vue -->
<template>
  <nav class="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-[1000] shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Logo and Brand -->
        <div class="flex items-center">
          <NuxtLink to="/" class="flex items-center group">
            <!-- Logo -->
          <img src="/logo.svg" class="h-20 w-20 inline-flex items-center justify-center">
            
          </NuxtLink>
        </div>

        <!-- Desktop Navigation -->
        <div class="hidden md:flex items-center space-x-8">
          <!-- Main Navigation Links -->
          <NuxtLink 
            to="/"
            :class="[
              isActiveRoute('/')
                ? 'text-primary-600 font-semibold'
                : 'text-gray-700 hover:text-primary-600',
              'transition-colors duration-200'
            ]"
          >
            {{ t.home }}
          </NuxtLink>

          <NuxtLink 
            to="/stores"
            :class="[
              isActiveRoute('/stores')
                ? 'text-primary-600 font-semibold'
                : 'text-gray-700 hover:text-primary-600',
              'transition-colors duration-200 flex items-center gap-1'
            ]"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
            </svg>
            {{ t.stores }}
          </NuxtLink>

          <NuxtLink 
            to="/how-it-works"
            class="text-gray-700 hover:text-primary-600 transition-colors duration-200"
          >
            {{ t.howItWorks }}
          </NuxtLink>

         

          <!-- HIDDEN: Track my package page temporarily disabled
          <NuxtLink
            to="/track"
            class="text-gray-700 hover:text-primary-600 transition-colors duration-200"
          >
            {{ t.track }}
          </NuxtLink>
          -->

          <!-- Help Dropdown -->
          <div 
            class="relative"
            @mouseenter="showHelpDropdown = true"
            @mouseleave="showHelpDropdown = false"
          >
            <button
              class="flex items-center gap-1 text-gray-700 hover:text-primary-600 transition-colors duration-200"
              :class="{ 'text-primary-600 font-semibold': isHelpPage }"
            >
              {{ t.help }}
              <svg 
                class="w-4 h-4 transition-transform duration-200"
                :class="{ 'rotate-180': showHelpDropdown }"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            <!-- Help Dropdown Menu -->
            <Transition
              enter-active-class="transition ease-out duration-200"
              enter-from-class="transform opacity-0 scale-95"
              enter-to-class="transform opacity-100 scale-100"
              leave-active-class="transition ease-in duration-150"
              leave-from-class="transform opacity-100 scale-100"
              leave-to-class="transform opacity-0 scale-95"
            >
              <div 
                v-if="showHelpDropdown"
                class="absolute right-0 mt-2 w-64 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5"
              >
                <div class="py-2">
                  <NuxtLink
                    to="/help-center"
                    class="group flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors duration-200"
                    :class="{ 'bg-primary-50 text-primary-600': isActiveRoute('/help-center') }"
                  >
                    <div class="mr-3 p-2 bg-gray-100 rounded-lg group-hover:bg-primary-100">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div>
                      <p class="font-medium">{{ t.helpCenter }}</p>
                      <p class="text-xs text-gray-500">{{ t.helpCenterDesc }}</p>
                    </div>
                  </NuxtLink>
                  
                  <NuxtLink
                    to="/faq"
                    class="group flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors duration-200"
                    :class="{ 'bg-primary-50 text-primary-600': isActiveRoute('/faq') }"
                  >
                    <div class="mr-3 p-2 bg-gray-100 rounded-lg group-hover:bg-primary-100">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p class="font-medium">{{ t.faq }}</p>
                      <p class="text-xs text-gray-500">{{ t.faqDesc }}</p>
                    </div>
                  </NuxtLink>
                </div>
              </div>
            </Transition>
          </div>
        </div>

        <!-- Right Side Actions -->
        <div class="flex items-center gap-3">
          <!-- Language Toggle -->
          <LanguageToggle />
          
          <!-- Login Button -->
          <NuxtLink 
            to="/login" 
            class="hidden md:inline-flex px-4 py-2 rounded-full text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:border-primary-500 hover:text-primary-500 transition-all duration-200"
          >
            {{ t.loginButton }}
          </NuxtLink>
          
          <!-- CTA Button -->
          <NuxtLink
            to="/register"
            class="hidden md:inline-flex items-center gap-2 px-5 py-2 bg-primary-500 text-white rounded-full font-medium text-sm hover:bg-primary-600 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
          >
            {{ t.getStarted }}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </NuxtLink>

          <!-- Mobile Menu Button -->
          <button
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
          >
            <span class="sr-only">{{ t.openMenu }}</span>
            <svg 
              v-if="!mobileMenuOpen" 
              class="h-6 w-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <svg 
              v-else 
              class="h-6 w-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Menu -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div v-if="mobileMenuOpen" class="md:hidden bg-white border-t border-gray-200">
        <div class="px-2 pt-2 pb-3 space-y-1">
          <NuxtLink
            to="/"
            @click="mobileMenuOpen = false"
            class="block px-3 py-2 rounded-md text-base font-medium"
            :class="[
              isActiveRoute('/')
                ? 'bg-primary-50 text-primary-600'
                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
            ]"
          >
            {{ t.home }}
          </NuxtLink>

          <NuxtLink
            to="/stores"
            @click="mobileMenuOpen = false"
            class="flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium"
            :class="[
              isActiveRoute('/stores')
                ? 'bg-primary-50 text-primary-600'
                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
            ]"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
            </svg>
            {{ t.stores }}
          </NuxtLink>

          <NuxtLink
            to="/how-it-works"
            @click="mobileMenuOpen = false"
            class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
          >
            {{ t.howItWorks }}
          </NuxtLink>

          

          <!-- HIDDEN: Track my package page temporarily disabled
          <NuxtLink
            to="/track"
            @click="mobileMenuOpen = false"
            class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
          >
            {{ t.track }}
          </NuxtLink>
          -->

          <!-- Help Section -->
          <div class="border-t border-gray-100 pt-2 mt-2">
            <p class="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {{ t.help }}
            </p>
            <NuxtLink
              to="/help-center"
              @click="mobileMenuOpen = false"
              class="block px-3 py-2 rounded-md text-base font-medium"
              :class="[
                isActiveRoute('/help-center')
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              ]"
            >
              {{ t.helpCenter }}
            </NuxtLink>
            <NuxtLink
              to="/faq"
              @click="mobileMenuOpen = false"
              class="block px-3 py-2 rounded-md text-base font-medium"
              :class="[
                isActiveRoute('/faq')
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              ]"
            >
              {{ t.faq }}
            </NuxtLink>
          </div>
        </div>

        <!-- Mobile CTAs -->
        <div class="border-t border-gray-200 px-4 py-3 space-y-2">
          <NuxtLink
            to="/register"
            @click="mobileMenuOpen = false"
            class="block w-full text-center px-4 py-2 bg-primary-500 text-white rounded-full font-medium hover:bg-primary-600 transition-colors"
          >
            {{ t.getStarted }}
          </NuxtLink>
          <NuxtLink
            to="/login"
            @click="mobileMenuOpen = false"
            class="block w-full text-center px-4 py-2 border border-gray-300 text-gray-700 rounded-full font-medium hover:border-primary-500 hover:text-primary-500 transition-colors"
          >
            {{ t.loginButton }}
          </NuxtLink>
        </div>
      </div>
    </Transition>
  </nav>

  <!-- Spacer to prevent content from going under fixed navbar -->
  <div class="h-16"></div>
</template>

<script setup>
import { ref, computed } from 'vue'

const route = useRoute()
const { t: createTranslations } = useLanguage()

// State
const showServicesDropdown = ref(false)
const showHelpDropdown = ref(false)
const mobileMenuOpen = ref(false)

// Check if current route matches
const isActiveRoute = (path) => {
  return route.path === path
}

// Check if we're on any service page
const isServicePage = computed(() => {
  return ['/expats', '/business', '/trendy'].includes(route.path)
})

// Check if we're on any help page
const isHelpPage = computed(() => {
  return ['/help-center', '/faq'].includes(route.path)
})

// Translations
const translations = {
  home: {
    es: 'Inicio',
    en: 'Home'
  },
  stores: {
    es: 'tiendas',
    en: 'Stores'
  },
  services: {
    es: '¿Para quién?',
    en: 'Who is it for?'
  },
  forExpats: {
    es: 'Para Expatriados',
    en: 'For Expats'
  },
  forExpatsDesc: {
    es: 'Vive en México, compra en el mundo',
    en: 'Live in Mexico, shop the world'
  },
  forBusiness: {
    es: 'Para Empresas',
    en: 'For Business'
  },
  forBusinessDesc: {
    es: 'Soluciones para negocios',
    en: 'Solutions for businesses'
  },
  forTrendy: {
    es: 'Para Online Shoppers',
    en: 'For Online Shoppers'
  },
  forTrendyDesc: {
    es: 'Compra recibe productos de tus tiendas favoritas en México',
    en: 'Shop get products delivered from your favorite stores to Mexico'
  },
  howItWorks: {
    es: 'Cómo Funciona',
    en: 'How It Works'
  },
  calculator: {
    es: 'Cotiza tu Envío',
    en: 'Shipping Calculator'
  },
  track: {
    es: 'Localiza tu paquete',
    en: 'Track your shipment'
  },
  help: {
    es: 'Ayuda',
    en: 'Help'
  },
  helpCenter: {
    es: 'Centro de Ayuda',
    en: 'Help Center'
  },
  helpCenterDesc: {
    es: 'Contáctanos por WhatsApp o email',
    en: 'Contact us via WhatsApp or email'
  },
  faq: {
    es: 'Preguntas Frecuentes',
    en: 'FAQ'
  },
  faqDesc: {
    es: 'Respuestas a preguntas comunes',
    en: 'Answers to common questions'
  },
  loginButton: {
    es: 'Iniciar Sesión',
    en: 'Login'
  },
  getStarted: {
    es: 'Registrarse',
    en: 'Get Started'
  },
  openMenu: {
    es: 'Abrir menú',
    en: 'Open menu'
  }
}

const t = createTranslations(translations)

// Close mobile menu when route changes
watch(() => route.path, () => {
  mobileMenuOpen.value = false
})
</script>