<template>
  <main class="min-h-screen bg-gradient-to-b from-gray-50 to-white">
    <!-- Hero / intro -->
    <section class="relative w-full py-12 md:py-16 overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-br from-primary-50/40 via-transparent to-primary-50/30" />

      <div class="container mx-auto px-4 md:px-8 lg:px-12 relative z-10">
        <div class="text-center max-w-2xl mx-auto">
          <span class="text-primary-600 uppercase font-bold text-sm tracking-wider">
            {{ t.tag }}
          </span>
          <h1 class="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mt-2 mb-4">
            {{ t.title }}
          </h1>
          <p class="text-lg md:text-xl text-gray-600">
            {{ t.subtitle }}
          </p>
        </div>
      </div>
    </section>

    <!-- The assistant -->
    <section class="py-12 md:py-16 bg-white">
      <div class="container mx-auto px-4">
        <div class="max-w-xl mx-auto bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-12">
          <VoiceAssistant />
        </div>

        <!-- Quick reassurance -->
        <div class="max-w-xl mx-auto mt-6 text-center text-sm text-gray-500">
          <p>{{ t.privacy }}</p>
        </div>

        <!-- Fallback support routes -->
        <div class="max-w-xl mx-auto mt-10 text-center">
          <p class="text-sm text-gray-600 mb-3">{{ t.preferText }}</p>
          <div class="flex flex-wrap items-center justify-center gap-3">
            <a
              href="https://wa.me/16195591910"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-full transition-colors"
            >
              {{ t.whatsapp }}
            </a>
            <NuxtLink
              to="/help-center"
              class="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold rounded-full transition-colors"
            >
              {{ t.helpCenter }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <FooterSection />
  </main>
</template>

<script setup>
import FooterSection from '~/components/Landing/FooterSection.vue'
import VoiceAssistant from '~/components/Voice/VoiceAssistant.vue'

definePageMeta({ layout: 'default' })

const { t: createTranslations } = useLanguage()

const translations = {
  tag:        { es: 'ASISTENTE DE VOZ', en: 'VOICE ASSISTANT' },
  title:      { es: 'Habla con el asistente Boxly', en: 'Talk to the Boxly assistant' },
  subtitle:   {
    es: 'Pregúntale cómo funciona el servicio, las tarifas, las direcciones, lo que sea. Respuestas en tiempo real, por voz.',
    en: 'Ask how the service works, pricing, addresses, anything. Real-time answers, by voice.',
  },
  privacy:    {
    es: 'Tu micrófono se conecta directo con el modelo, sin grabar nada en nuestros servidores.',
    en: 'Your microphone connects directly to the model — nothing is recorded on our servers.',
  },
  preferText: { es: '¿Prefieres escribir?', en: 'Prefer to write?' },
  whatsapp:   { es: 'Escríbenos por WhatsApp', en: 'Message us on WhatsApp' },
  helpCenter: { es: 'Centro de ayuda', en: 'Help center' },
}

const t = createTranslations(translations)

useHead({
  title: 'Asistente Boxly · Habla con nosotros',
  // Preconnect + DNS-prefetch to api.openai.com so the WebRTC SDP POST
  // skips DNS + TCP + TLS handshake on the critical path (saves
  // ~100–300ms of time-to-first-audio).
  link: [
    { rel: 'preconnect', href: 'https://api.openai.com', crossorigin: 'anonymous' },
    { rel: 'dns-prefetch', href: 'https://api.openai.com' },
  ],
  meta: [
    {
      name: 'description',
      content:
        'Habla con el asistente de voz de Boxly y obtén respuestas en tiempo real sobre nuestro servicio de envíos USA → México.',
    },
  ],
})
</script>
