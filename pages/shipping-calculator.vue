<template>
  <div>
      <div>
      <!-- Header -->
    <div class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <NuxtLink to="/" class="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowLeftIcon class="w-5 h-5 mr-2" />
          {{ t.backToHome }}
        </NuxtLink>
      </div>
    </div>
  </div>
  <div class="py-6">
      <BoxCalculator />
  </div>
  </div>
</template>

<script setup>

// SEO. This page had no metadata at all, so it inherited the global
// "Compra en cualquier tienda del mundo" snippet — Search Console has it at
// position 8.3 with 24 impressions and no clicks. It is the one page that
// answers the question our customers actually ask ("¿cuánto me cuesta traer
// esto a México?"), which is also the thing no competitor can answer, so it
// should be earning that query rather than sitting behind a generic blurb.
useHead({
  title: 'Calculadora de envío USA a México | Cuánto cuesta tu caja',
  meta: [
    { name: 'description', content: 'Calcula cuánto cuesta traer tus compras de Estados Unidos a México. Precio fijo por tamaño de caja, sin sorpresas en la aduana ni costos ocultos.' },
    { property: 'og:title', content: 'Calculadora de envío USA a México | Cuánto cuesta tu caja' },
    { property: 'og:description', content: 'Calcula cuánto cuesta traer tus compras de Estados Unidos a México. Precio fijo por tamaño de caja, sin sorpresas en la aduana ni costos ocultos.' },
  ],
  link: [{ rel: 'canonical', href: 'https://boxly.mx/shipping-calculator' }],
})


import { 
  ArrowLeftIcon
} from '@heroicons/vue/24/outline'

const { t: createTranslations, language } = useLanguage()

const translations = {
  backToHome: {
    es: 'Volver al inicio',
    en: 'Back to home'
  }
}

// Get reactive translations
const t = createTranslations(translations)

</script>