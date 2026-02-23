<template>
  <section class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20">
    <!-- Header -->
    <div class="bg-white/90 backdrop-blur-sm shadow-sm border-b border-gray-100">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex items-center gap-4">
          <NuxtLink
            to="/app"
            class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
          </NuxtLink>
          <div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900">{{ t.title }}</h1>
            <p class="mt-1 text-sm text-gray-600">{{ t.subtitle }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <!-- What is Form 1583 -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 class="text-lg font-bold text-gray-900 mb-3">{{ t.whatIsTitle }}</h2>
        <p class="text-sm text-gray-700 leading-relaxed">{{ t.whatIsDescription }}</p>
      </div>

      <!-- Incomplete Address Warning -->
      <div
        v-if="!hasCompleteAddress"
        class="bg-red-50 border border-red-200 rounded-2xl p-5"
      >
        <div class="flex gap-3">
          <div class="flex-shrink-0">
            <svg class="w-5 h-5 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
            </svg>
          </div>
          <div>
            <p class="text-sm font-semibold text-red-800">{{ t.addressWarning }}</p>
            <p class="text-sm text-red-700 mt-1">{{ t.addressWarningDesc }}</p>
            <NuxtLink
              to="/app/account/shipping-address"
              class="inline-flex items-center gap-1 mt-2 text-sm font-medium text-red-700 hover:text-red-800"
            >
              {{ t.goToAddress }}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Steps -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 class="text-lg font-bold text-gray-900 mb-5">{{ t.stepsTitle }}</h2>
        <div class="space-y-5">
          <!-- Step 1: Download -->
          <div class="flex gap-4">
            <div class="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-bold">1</div>
            <div>
              <p class="font-semibold text-gray-900">{{ t.step1Title }}</p>
              <p class="text-sm text-gray-600 mt-0.5">{{ t.step1Desc }}</p>
            </div>
          </div>

          <!-- Step 2: Print -->
          <div class="flex gap-4">
            <div class="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-bold">2</div>
            <div>
              <p class="font-semibold text-gray-900">{{ t.step2Title }}</p>
              <p class="text-sm text-gray-600 mt-0.5">{{ t.step2Desc }}</p>
            </div>
          </div>

          <!-- Step 3: Sign -->
          <div class="flex gap-4">
            <div class="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-bold">3</div>
            <div>
              <p class="font-semibold text-gray-900">{{ t.step3Title }}</p>
              <p class="text-sm text-gray-600 mt-0.5">{{ t.step3Desc }}</p>
            </div>
          </div>

          <!-- Step 4: Photo -->
          <div class="flex gap-4">
            <div class="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-bold">4</div>
            <div>
              <p class="font-semibold text-gray-900">{{ t.step4Title }}</p>
              <p class="text-sm text-gray-600 mt-0.5">{{ t.step4Desc }}</p>
            </div>
          </div>

          <!-- Step 5: Send -->
          <div class="flex gap-4">
            <div class="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-bold">5</div>
            <div>
              <p class="font-semibold text-gray-900">{{ t.step5Title }}</p>
              <p class="text-sm text-gray-600 mt-0.5">{{ t.step5Desc }}</p>
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
          class="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
          class="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-all duration-300"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm.029 18.88c-1.161 0-2.305-.292-3.318-.844l-3.677.964.98-3.686c-.592-1.02-.9-2.176-.898-3.358.002-3.808 3.105-6.912 6.913-6.912 3.809 0 6.913 3.104 6.913 6.913s-3.104 6.923-6.913 6.923z"/>
          </svg>
          {{ t.whatsappButton }}
        </a>
      </div>

      <!-- Info tip -->
      <div class="bg-blue-50 rounded-2xl p-5 border border-blue-200/50">
        <div class="flex gap-3">
          <svg class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p class="text-sm text-gray-700">{{ t.infoTip }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'

definePageMeta({
  layout: 'app',
  middleware: ['auth']
})

const user = useUser()
const { t: createTranslations } = useLanguage()
const { downloadForm } = useForm1583()

const isDownloading = ref(false)

const hasCompleteAddress = computed(() => {
  return (
    user.value?.street &&
    user.value?.municipio &&
    user.value?.estado &&
    user.value?.postal_code
  )
})

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
  title: {
    es: 'Formulario USPS 1583',
    en: 'USPS Form 1583'
  },
  subtitle: {
    es: 'Requerido por USPS para recibir correo a través de Boxly',
    en: 'Required by USPS to receive mail through Boxly'
  },
  whatIsTitle: {
    es: '¿Qué es el Formulario 1583?',
    en: 'What is Form 1583?'
  },
  whatIsDescription: {
    es: 'El Formulario PS 1583 es un documento requerido por el Servicio Postal de Estados Unidos (USPS) para cualquier persona que reciba correo a través de una agencia receptora de correo comercial (CMRA) como Boxly. Este formulario autoriza a Boxly a recibir paquetes y correo en tu nombre.',
    en: 'PS Form 1583 is a document required by the United States Postal Service (USPS) for anyone receiving mail through a Commercial Mail Receiving Agency (CMRA) like Boxly. This form authorizes Boxly to receive packages and mail on your behalf.'
  },
  addressWarning: {
    es: 'Dirección incompleta',
    en: 'Incomplete address'
  },
  addressWarningDesc: {
    es: 'Necesitas completar tu dirección de envío en México antes de descargar el formulario.',
    en: 'You need to complete your Mexican shipping address before downloading the form.'
  },
  goToAddress: {
    es: 'Ir a dirección de envío',
    en: 'Go to shipping address'
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
