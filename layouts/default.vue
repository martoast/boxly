<!-- layouts/default.vue -->
<template>
  <div class="min-h-screen">
    <!-- Landing Pages Navbar (shown on non-auth and non-app pages) -->
    <LandingNavbar v-if="showLandingNavbar" />

    <!-- Top Right Controls (shown on auth pages and when no navbar) -->
    <div
      v-if="!showLandingNavbar"
      class="fixed top-4 right-4 sm:top-5 sm:right-5 z-[1001] flex items-center gap-3"
    >
      <!-- Login Button - Hidden on login/register pages -->
      <NuxtLink
        v-if="!isAuthPage"
        to="/login"
        class="px-4 py-1.5 rounded-full text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:border-primary-500 hover:text-primary-500 transition-all duration-200"
      >
        {{ t.loginButton }}
      </NuxtLink>

      <!-- Language Toggle -->
      <LanguageToggle />
    </div>

    <!-- Page Content -->
    <slot />

    <Toast />
  </div>
</template>
  
<script setup>
import { onMounted, computed } from 'vue'
import LandingNavbar from '~/components/LandingNavbar.vue'

const route = useRoute()
const { t: createTranslations, initializeLanguage } = useLanguage()
const { captureRefFromUrl, captureAndValidateRef } = useAffiliateRef()

// IMMEDIATELY capture ref from URL on setup (SSR-safe, runs before any navigation)
// This stores the cookie synchronously - no waiting for API validation
captureRefFromUrl()

// Check if we're on login or register page
const isAuthPage = computed(() => {
  return route.path === '/login' || route.path === '/register'
})

// Check if we're on an app page
const isAppPage = computed(() => {
  return route.path.startsWith('/app')
})

// Show landing navbar on landing pages (not auth or app pages)
const showLandingNavbar = computed(() => {
  return !isAuthPage.value && !isAppPage.value
})

const translations = {
  loginButton: {
    es: 'Iniciar Sesión',
    en: 'Login'
  }
}

const t = createTranslations(translations)

// SEO Meta
useSeoMeta({
  title: 'Boxly - Compra en cualquier tienda del mundo y recíbelo en México',
  ogTitle: 'Boxly - Compra en cualquier tienda del mundo y recíbelo en México',
  description: 'Compra en cualquier tienda del mundo y recíbelo en México. Te damos un domicilio en USA, consolidamos tus paquetes y enviamos a todo México al mejor precio.',
  ogDescription: 'Compra en cualquier tienda del mundo y recíbelo en México. Te damos un domicilio en USA, consolidamos tus paquetes y enviamos a todo México al mejor precio.',
  ogImage: '/logo.jpeg',
  twitterCard: 'summary_large_image',
})

// Initialize language and validate affiliate ref on client mount
onMounted(() => {
  initializeLanguage()
  // Validate the ref code in background (cookie already set in setup)
  captureAndValidateRef()
})
</script>