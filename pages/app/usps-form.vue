<template>
  <section class="min-h-screen bg-gradient-to-b from-gray-50 to-white">
    <!-- Hero Header -->
    <div class="relative bg-gradient-to-br from-dark-500 via-dark-600 to-dark-700 overflow-hidden">
      <!-- Background decorations -->
      <div class="absolute inset-0 overflow-hidden">
        <div class="absolute -top-24 -right-24 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl"></div>
        <div class="absolute -bottom-24 -left-24 w-96 h-96 bg-primary-400/10 rounded-full blur-3xl"></div>
      </div>

      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 relative z-10">
        <NuxtLink
          to="/app"
          class="inline-flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white transition-colors mb-6"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          {{ t.backToDashboard }}
        </NuxtLink>

        <div class="flex items-center gap-3 mb-3">
          <div class="p-2.5 bg-white/10 rounded-xl">
            <svg class="w-6 h-6 text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <span class="px-3 py-1 bg-primary-500/20 text-primary-300 text-xs font-semibold rounded-full uppercase tracking-wider">{{ t.requiredTag }}</span>
        </div>

        <h1 class="text-3xl sm:text-4xl font-bold text-white mb-3">{{ t.title }}</h1>
        <p class="text-base sm:text-lg text-gray-300 max-w-2xl">{{ t.whatIsDescription }}</p>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      <!-- Steps Card -->
      <div class="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        <div class="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-primary-50/50 to-transparent">
          <h2 class="text-lg font-bold text-gray-900">{{ t.stepsTitle }}</h2>
        </div>
        <div class="p-6 space-y-6">
          <!-- Step 1: Download -->
          <div class="flex gap-4">
            <div class="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-xl flex items-center justify-center text-sm font-bold shadow-sm">1</div>
            <div class="pt-1">
              <p class="font-semibold text-gray-900">{{ t.step1Title }}</p>
              <p class="text-sm text-gray-600 mt-1">{{ t.step1Desc }}</p>
            </div>
          </div>

          <div class="ml-5 border-l-2 border-primary-100 h-2"></div>

          <!-- Step 2: Print -->
          <div class="flex gap-4">
            <div class="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-xl flex items-center justify-center text-sm font-bold shadow-sm">2</div>
            <div class="pt-1">
              <p class="font-semibold text-gray-900">{{ t.step2Title }}</p>
              <p class="text-sm text-gray-600 mt-1">{{ t.step2Desc }}</p>
            </div>
          </div>

          <div class="ml-5 border-l-2 border-primary-100 h-2"></div>

          <!-- Step 3: Sign -->
          <div class="flex gap-4">
            <div class="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-xl flex items-center justify-center text-sm font-bold shadow-sm">3</div>
            <div class="pt-1">
              <p class="font-semibold text-gray-900">{{ t.step3Title }}</p>
              <p class="text-sm text-gray-600 mt-1">{{ t.step3Desc }}</p>
            </div>
          </div>

          <div class="ml-5 border-l-2 border-primary-100 h-2"></div>

          <!-- Step 4: Photo -->
          <div class="flex gap-4">
            <div class="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-xl flex items-center justify-center text-sm font-bold shadow-sm">4</div>
            <div class="pt-1">
              <p class="font-semibold text-gray-900">{{ t.step4Title }}</p>
              <p class="text-sm text-gray-600 mt-1">{{ t.step4Desc }}</p>
            </div>
          </div>

          <div class="ml-5 border-l-2 border-primary-100 h-2"></div>

          <!-- Step 5: Send -->
          <div class="flex gap-4">
            <div class="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-xl flex items-center justify-center text-sm font-bold shadow-sm">5</div>
            <div class="pt-1">
              <p class="font-semibold text-gray-900">{{ t.step5Title }}</p>
              <p class="text-sm text-gray-600 mt-1">{{ t.step5Desc }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="space-y-3">
        <!-- Download Button -->
        <button
          @click="handleDownload"
          :disabled="isDownloading"
          class="w-full inline-flex items-center justify-center gap-2.5 px-6 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg v-if="!isDownloading" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <svg v-else class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ isDownloading ? t.downloading : t.downloadButton }}
        </button>

        <!-- WhatsApp Button -->
        <a
          href="https://wa.me/16195591910?text=Hola%2C%20les%20env%C3%ADo%20mi%20Forma%201583%20firmada%20y%20mi%20identificaci%C3%B3n."
          target="_blank"
          rel="noopener noreferrer"
          class="w-full inline-flex items-center justify-center gap-2.5 px-6 py-4 bg-accent-green text-white font-bold rounded-xl hover:bg-green-600 transition-all duration-300 shadow-md hover:shadow-lg"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm.029 18.88c-1.161 0-2.305-.292-3.318-.844l-3.677.964.98-3.686c-.592-1.02-.9-2.176-.898-3.358.002-3.808 3.105-6.912 6.913-6.912 3.809 0 6.913 3.104 6.913 6.913s-3.104 6.923-6.913 6.923z"/>
          </svg>
          {{ t.whatsappButton }}
        </a>
      </div>

      <!-- Info tip -->
      <div class="bg-primary-50 rounded-2xl p-5 border border-primary-200/50">
        <div class="flex gap-3">
          <svg class="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p class="text-sm text-primary-800">{{ t.infoTip }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'

definePageMeta({
  layout: 'app',
  middleware: ['auth']
})

const { t: createTranslations } = useLanguage()
const { downloadForm } = useForm1583()

const isDownloading = ref(false)

const handleDownload = async () => {
  isDownloading.value = true
  try {
    await downloadForm()
  } catch (error) {
    console.error('Error generating PDF:', error)
  } finally {
    isDownloading.value = false
  }
}

const translations = {
  backToDashboard: {
    es: 'Volver al inicio',
    en: 'Back to dashboard'
  },
  requiredTag: {
    es: 'Requerido',
    en: 'Required'
  },
  title: {
    es: 'Formulario USPS 1583',
    en: 'USPS Form 1583'
  },
  whatIsDescription: {
    es: 'El Servicio Postal de EE.UU. requiere este formulario para autorizar a Boxly a recibir paquetes y correo en tu nombre. Solo toma unos minutos.',
    en: 'The US Postal Service requires this form to authorize Boxly to receive packages and mail on your behalf. It only takes a few minutes.'
  },
  stepsTitle: {
    es: '¿Cómo completar el formulario?',
    en: 'How to complete the form?'
  },
  step1Title: {
    es: 'Descarga el formulario',
    en: 'Download the form'
  },
  step1Desc: {
    es: 'Haz clic en el botón de abajo. El PDF ya viene pre-llenado con tus datos y los de Boxly.',
    en: 'Click the button below. The PDF comes pre-filled with your info and Boxly\'s details.'
  },
  step2Title: {
    es: 'Imprime el formulario',
    en: 'Print the form'
  },
  step2Desc: {
    es: 'Imprime la primera página del documento.',
    en: 'Print the first page of the document.'
  },
  step3Title: {
    es: 'Firma en la Sección 13a',
    en: 'Sign in Section 13a'
  },
  step3Desc: {
    es: 'Firma con tu nombre en el campo "13a. Signature of Applicant" (parte inferior derecha).',
    en: 'Sign your name in the "13a. Signature of Applicant" field (bottom right of the form).'
  },
  step4Title: {
    es: 'Toma una foto',
    en: 'Take a photo'
  },
  step4Desc: {
    es: 'Toma una foto clara del formulario firmado y una foto de tu identificación oficial.',
    en: 'Take a clear photo of the signed form and a photo of your government ID.'
  },
  step5Title: {
    es: 'Envía por WhatsApp',
    en: 'Send via WhatsApp'
  },
  step5Desc: {
    es: 'Envíanos las fotos por WhatsApp. Nosotros completamos el proceso.',
    en: 'Send us the photos via WhatsApp. We\'ll take care of the rest.'
  },
  downloadButton: {
    es: 'Descargar Formulario 1583',
    en: 'Download Form 1583'
  },
  downloading: {
    es: 'Generando PDF...',
    en: 'Generating PDF...'
  },
  whatsappButton: {
    es: 'Enviar por WhatsApp',
    en: 'Send via WhatsApp'
  },
  infoTip: {
    es: 'Una vez que recibamos tu formulario firmado y tu identificación, activaremos tu cuenta en 1-2 días hábiles.',
    en: 'Once we receive your signed form and ID, we\'ll activate your account within 1-2 business days.'
  }
}

const t = createTranslations(translations)
</script>
