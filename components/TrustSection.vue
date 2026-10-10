<template>
  <section id="trust" class="py-24 px-5 bg-white">
    <div class="max-w-6xl mx-auto px-5 fade-in-section">
      <div class="text-center mb-14 max-w-3xl mx-auto">
        <span class="text-primary-500 font-semibold mb-2.5 block uppercase tracking-wider">{{ t.trustTagline }}</span>
        <h2 class="text-4xl md:text-5xl lg:text-6xl mb-4 font-extrabold text-gray-900 leading-tight">{{ t.trustTitle }}</h2>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[30px]">
        <div v-for="(item, index) in trustItems" :key="index" class="flex items-start gap-5">
          <div class="flex-shrink-0 w-12 h-12 bg-primary-500 text-white rounded-xl flex items-center justify-center">
            <svg v-if="index === 0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-7 h-7">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-3zm-1.05 15.54L6.4 12.03l1.41-1.41L10.95 14.2l5.24-5.24 1.41 1.41L10.95 16.54z"/>
            </svg>
            <svg v-else-if="index === 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-7 h-7">
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zM12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
            </svg>
            <svg v-else-if="index === 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-7 h-7">
              <path d="M12 2L4 6v12h16V6l-8-4zm4 14h-3v-4h-2v4H8V9h8v7z"/>
            </svg>
            <svg v-else-if="index === 3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-7 h-7">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
            <svg v-else-if="index === 4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-7 h-7">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-7 h-7">
              <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
            </svg>
          </div>
          <div>
            <h3 class="text-[1.2rem] mb-[5px] font-bold">{{ item.title }}</h3>
            <p class="text-[0.95rem] mb-0">{{ item.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const { t: createTranslations, language } = useLanguage()

const translations = {
  trustTagline: {
    es: 'NUESTRA PROMESA',
    en: 'OUR PROMISE'
  },
  trustTitle: {
    es: '¿Por qué confiar en nosotros?',
    en: 'Why Trust Us?'
  }
}

const t = createTranslations(translations)

const trustItems = computed(() => {
  return language.value === 'es' ? [
    {
      title: 'Reclamos con evidencia',
      description: 'Revisamos cada caso con la evidencia de recepción, consolidación y transporte.'
    },
    {
      title: '12+ Años de Experiencia',
      description: 'Conocemos cada detalle del proceso y brindamos un servicio sin problemas durante más de una década.'
    },
    {
      title: 'Bodega en San Diego, CA',
      description: 'Nuestra ubicación estratégica nos permite recibir y procesar tus paquetes de forma eficiente.'
    },
    {
      title: '300+ Clientes Satisfechos',
      description: 'Cientos de clientes confían en nosotros para sus envíos gracias a nuestro seguimiento personalizado y gran servicio.'
    },
    {
      title: 'Seguimiento Personalizado',
      description: 'Estamos siempre al pendiente de todo el proceso de envío hasta que llega a su destino.'
    },
    {
      title: 'Sin Cargos Ocultos',
      description: 'Cotizaciones transparentes. El precio acordado es el precio final, sin sorpresas.'
    }
  ] : [
    {
      title: 'Evidence-based claims',
      description: 'We review every case with the receiving, consolidation and transport evidence.'
    },
    {
      title: '12+ Years of Experience',
      description: 'We know every detail of the process and have provided problem-free service for over a decade.'
    },
    {
      title: 'Warehouse in San Diego, CA',
      description: 'Our strategic location allows us to receive and process your packages efficiently.'
    },
    {
      title: '300+ Satisfied Clients',
      description: 'hundreds of clients trust us for their shipments thanks to our personalized tracking and great service.'
    },
    {
      title: 'Personalized Tracking',
      description: 'We are always monitoring the entire shipping process until it reaches its destination.'
    },
    {
      title: 'No Hidden Fees',
      description: 'Transparent quotes. The agreed price is the final price, no surprises.'
    }
  ]
})
</script>