<!-- pages/sitemap.vue -->
<template>
    <main class="overflow-hidden">
      <!-- Hero Section -->
      <section class="bg-gradient-to-br from-gray-50 to-gray-100/30 py-12">
        <div class="container mx-auto px-4 text-center">
          <h1 class="text-3xl md:text-4xl font-bold text-dark-500 mb-4">
            {{ t.title }}
          </h1>
          <p class="text-lg text-gray-600 max-w-2xl mx-auto">
            {{ t.subtitle }}
          </p>
        </div>
      </section>
  
      <!-- Sitemap Content -->
      <section class="py-16 bg-white">
        <div class="container mx-auto px-4 max-w-7xl">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            <!-- Main Pages -->
            <div class="space-y-4">
              <div class="flex items-center gap-2 mb-4">
                <div class="p-2 bg-primary-100 rounded-lg">
                  <HomeIcon class="w-5 h-5 text-primary-600" />
                </div>
                <h2 class="text-xl font-bold text-gray-900">{{ t.mainPages }}</h2>
              </div>
              <ul class="space-y-2 ml-9">
                <li>
                  <NuxtLink to="/" class="text-gray-600 hover:text-primary-600 transition-colors flex items-center gap-2">
                    <ChevronRightIcon class="w-4 h-4" />
                    {{ t.home }}
                  </NuxtLink>
                </li>
                <li>
                  <NuxtLink to="/how-it-works" class="text-gray-600 hover:text-primary-600 transition-colors flex items-center gap-2">
                    <ChevronRightIcon class="w-4 h-4" />
                    {{ t.howItWorks }}
                  </NuxtLink>
                </li>
                <li>
                  <NuxtLink to="/precios" class="text-gray-600 hover:text-primary-600 transition-colors flex items-center gap-2">
                    <ChevronRightIcon class="w-4 h-4" />
                    {{ t.pricing }}
                  </NuxtLink>
                </li>
                <li>
                  <NuxtLink to="/shipping-calculator" class="text-gray-600 hover:text-primary-600 transition-colors flex items-center gap-2">
                    <ChevronRightIcon class="w-4 h-4" />
                    {{ t.shippingCalculator }}
                  </NuxtLink>
                </li>
                <li>
                  <NuxtLink to="/track" class="text-gray-600 hover:text-primary-600 transition-colors flex items-center gap-2">
                    <ChevronRightIcon class="w-4 h-4" />
                    {{ t.trackPackage }}
                  </NuxtLink>
                </li>
              </ul>
            </div>
  
           
  
            <!-- Help & Support -->
            <div class="space-y-4">
              <div class="flex items-center gap-2 mb-4">
                <div class="p-2 bg-primary-100 rounded-lg">
                  <QuestionMarkCircleIcon class="w-5 h-5 text-primary-600" />
                </div>
                <h2 class="text-xl font-bold text-gray-900">{{ t.helpSupport }}</h2>
              </div>
              <ul class="space-y-2 ml-9">
                <li>
                  <NuxtLink to="/help-center" class="text-gray-600 hover:text-primary-600 transition-colors flex items-center gap-2">
                    <ChevronRightIcon class="w-4 h-4" />
                    {{ t.helpCenter }}
                  </NuxtLink>
                </li>
                <li>
                  <NuxtLink to="/faq" class="text-gray-600 hover:text-primary-600 transition-colors flex items-center gap-2">
                    <ChevronRightIcon class="w-4 h-4" />
                    {{ t.faq }}
                  </NuxtLink>
                </li>
              </ul>
            </div>
  
            <!-- Account -->
            <div class="space-y-4">
              <div class="flex items-center gap-2 mb-4">
                <div class="p-2 bg-primary-100 rounded-lg">
                  <UserCircleIcon class="w-5 h-5 text-primary-600" />
                </div>
                <h2 class="text-xl font-bold text-gray-900">{{ t.account }}</h2>
              </div>
              <ul class="space-y-2 ml-9">
                <li>
                  <NuxtLink to="/login" class="text-gray-600 hover:text-primary-600 transition-colors flex items-center gap-2">
                    <ChevronRightIcon class="w-4 h-4" />
                    {{ t.login }}
                  </NuxtLink>
                </li>
                <li>
                  <NuxtLink to="/register" class="text-gray-600 hover:text-primary-600 transition-colors flex items-center gap-2">
                    <ChevronRightIcon class="w-4 h-4" />
                    {{ t.register }}
                  </NuxtLink>
                </li>
                <li>
                  <NuxtLink to="/forgot-password" class="text-gray-600 hover:text-primary-600 transition-colors flex items-center gap-2">
                    <ChevronRightIcon class="w-4 h-4" />
                    {{ t.forgotPassword }}
                  </NuxtLink>
                </li>
                <li>
                  <NuxtLink to="/reset-password" class="text-gray-600 hover:text-primary-600 transition-colors flex items-center gap-2">
                    <ChevronRightIcon class="w-4 h-4" />
                    {{ t.resetPassword }}
                  </NuxtLink>
                </li>
              </ul>
            </div>
  
            <!-- Legal -->
            <div class="space-y-4">
              <div class="flex items-center gap-2 mb-4">
                <div class="p-2 bg-primary-100 rounded-lg">
                  <DocumentTextIcon class="w-5 h-5 text-primary-600" />
                </div>
                <h2 class="text-xl font-bold text-gray-900">{{ t.legal }}</h2>
              </div>
              <ul class="space-y-2 ml-9">
                <li>
                  <NuxtLink to="/terms-of-service" class="text-gray-600 hover:text-primary-600 transition-colors flex items-center gap-2">
                    <ChevronRightIcon class="w-4 h-4" />
                    {{ t.termsOfService }}
                  </NuxtLink>
                </li>
                <li>
                  <NuxtLink to="/privacy-policy" class="text-gray-600 hover:text-primary-600 transition-colors flex items-center gap-2">
                    <ChevronRightIcon class="w-4 h-4" />
                    {{ t.privacyPolicy }}
                  </NuxtLink>
                </li>
              </ul>
            </div>
  
            <!-- Application -->
            <div class="space-y-4">
              <div class="flex items-center gap-2 mb-4">
                <div class="p-2 bg-primary-100 rounded-lg">
                  <ComputerDesktopIcon class="w-5 h-5 text-primary-600" />
                </div>
                <h2 class="text-xl font-bold text-gray-900">{{ t.application }}</h2>
              </div>
              <ul class="space-y-2 ml-9">
                <li>
                  <NuxtLink to="/app" class="text-gray-600 hover:text-primary-600 transition-colors flex items-center gap-2">
                    <ChevronRightIcon class="w-4 h-4" />
                    {{ t.dashboard }}
                  </NuxtLink>
                </li>
              </ul>
            </div>
  
          </div>
  
          <!-- Additional Info -->
          <div class="mt-16 pt-8 border-t border-gray-200">
            <div class="bg-gray-50 rounded-xl p-8 text-center">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">
                {{ t.needHelp }}
              </h3>
              <p class="text-gray-600 mb-6">
                {{ t.contactUs }}
              </p>
              <div class="flex flex-wrap gap-4 justify-center">
                <a
                  href="https://wa.me/16195591910"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-full transition-all duration-300 hover:scale-105"
                >
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm.029 18.88c-1.161 0-2.305-.292-3.318-.844l-3.677.964.98-3.686c-.592-1.02-.9-2.176-.898-3.358.002-3.808 3.105-6.912 6.913-6.912 3.809 0 6.913 3.104 6.913 6.913s-3.104 6.923-6.913 6.923z"/>
                  </svg>
                  WhatsApp
                </a>
                <a
                  href="mailto:contact@boxly.mx"
                  class="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-full transition-all duration-300 hover:scale-105"
                >
                  <EnvelopeIcon class="w-5 h-5" />
                  {{ t.email }}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
  
      <!-- Footer -->
      <FooterSection />
    </main>
  </template>
  
  <script setup>
  import FooterSection from "~/components/Landing/FooterSection.vue"
  import {
    HomeIcon,
    BriefcaseIcon,
    QuestionMarkCircleIcon,
    UserCircleIcon,
    DocumentTextIcon,
    ComputerDesktopIcon,
    ChevronRightIcon,
    EnvelopeIcon
  } from '@heroicons/vue/24/outline'
  
  const { t: createTranslations, language } = useLanguage()
  
  // Translations
  const translations = {
    title: {
      es: 'Mapa del Sitio',
      en: 'Sitemap'
    },
    subtitle: {
      es: 'Encuentra rápidamente la página que buscas',
      en: 'Quickly find the page you\'re looking for'
    },
    mainPages: {
      es: 'Páginas Principales',
      en: 'Main Pages'
    },
    home: {
      es: 'Inicio',
      en: 'Home'
    },
    howItWorks: {
      es: 'Cómo Funciona',
      en: 'How It Works'
    },
    pricing: {
      es: 'Precios',
      en: 'Pricing'
    },
    shippingCalculator: {
      es: 'Calculadora de Envío',
      en: 'Shipping Calculator'
    },
    trackPackage: {
      es: 'Rastrear Paquete',
      en: 'Track Package'
    },
    services: {
      es: 'Servicios',
      en: 'Services'
    },
    forExpats: {
      es: 'Para Expatriados',
      en: 'For Expats'
    },
    forBusiness: {
      es: 'Para Empresas',
      en: 'For Business'
    },
    forShoppers: {
      es: 'Para Compradores en Línea',
      en: 'For Online Shoppers'
    },
    helpSupport: {
      es: 'Ayuda y Soporte',
      en: 'Help & Support'
    },
    helpCenter: {
      es: 'Centro de Ayuda',
      en: 'Help Center'
    },
    faq: {
      es: 'Preguntas Frecuentes',
      en: 'Frequently Asked Questions'
    },
    account: {
      es: 'Cuenta',
      en: 'Account'
    },
    login: {
      es: 'Iniciar Sesión',
      en: 'Login'
    },
    register: {
      es: 'Registrarse',
      en: 'Register'
    },
    forgotPassword: {
      es: 'Olvidé mi Contraseña',
      en: 'Forgot Password'
    },
    resetPassword: {
      es: 'Restablecer Contraseña',
      en: 'Reset Password'
    },
    legal: {
      es: 'Legal',
      en: 'Legal'
    },
    termsOfService: {
      es: 'Términos de Servicio',
      en: 'Terms of Service'
    },
    privacyPolicy: {
      es: 'Política de Privacidad',
      en: 'Privacy Policy'
    },
    application: {
      es: 'Aplicación',
      en: 'Application'
    },
    dashboard: {
      es: 'Panel de Control',
      en: 'Dashboard'
    },
    needHelp: {
      es: '¿Necesitas ayuda?',
      en: 'Need help?'
    },
    contactUs: {
      es: 'Nuestro equipo está aquí para ayudarte. Contáctanos a través de WhatsApp o correo electrónico.',
      en: 'Our team is here to help. Contact us via WhatsApp or email.'
    },
    email: {
      es: 'Correo Electrónico',
      en: 'Email'
    }
  }
  
  const t = createTranslations(translations)
  
  // Page meta
  useHead({
    title: 'Mapa del Sitio - Boxly',
    meta: [
      {
        name: 'description',
        content: 'Navega fácilmente por todas las páginas de Boxly. Encuentra información sobre servicios, ayuda, y más.'
      }
    ]
  })
  </script>
  
  <style scoped>
  /* Custom styles if needed */
  </style>