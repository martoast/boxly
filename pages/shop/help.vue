<template>
  <section class="min-h-screen bg-gradient-to-b from-gray-50 to-white">
    <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">

      <!-- Header -->
      <div class="text-center mb-8">
        <span class="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-bold uppercase tracking-widest rounded-full mb-3">
          {{ t.eyebrow }}
        </span>
        <h1 class="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">{{ t.title }}</h1>
        <p class="text-gray-500 mt-2 text-sm sm:text-base max-w-md mx-auto">{{ t.subtitle }}</p>
      </div>

      <!-- WhatsApp card -->
      <div class="bg-gradient-to-br from-green-50 to-green-100/40 rounded-2xl border border-green-200/60 p-6 sm:p-8 shadow-sm">
        <div class="flex items-center gap-3 mb-4">
          <div class="p-3 bg-green-100 rounded-xl">
            <svg class="w-7 h-7 text-green-600" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm.029 18.88c-1.161 0-2.305-.292-3.318-.844l-3.677.964.98-3.686c-.592-1.02-.9-2.176-.898-3.358.002-3.808 3.105-6.912 6.913-6.912 3.809 0 6.913 3.104 6.913 6.913s-3.104 6.923-6.913 6.923z"/>
            </svg>
          </div>
          <div>
            <h2 class="font-bold text-xl text-gray-900 leading-tight">WhatsApp</h2>
            <p class="text-xs font-semibold text-green-700 uppercase tracking-wider">{{ t.fastestReply }}</p>
          </div>
        </div>

        <p class="text-gray-700 text-sm sm:text-base mb-5 leading-relaxed">{{ t.cardCopy }}</p>

        <a
          :href="t.whatsappLink"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-full shadow-md hover:shadow-lg transition-all"
        >
          {{ t.openWhatsapp }}
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
          </svg>
        </a>

        <a :href="`tel:${phoneE164}`" class="block text-sm text-gray-500 hover:text-gray-900 mt-3 font-medium">
          {{ phoneDisplay }}
        </a>
      </div>

      <!-- What we help with -->
      <div class="mt-8">
        <h3 class="text-xs font-bold text-gray-900 uppercase tracking-widest mb-3">{{ t.helpWithTitle }}</h3>
        <ul class="space-y-2.5">
          <li v-for="item in helpItems" :key="item" class="flex items-start gap-2.5 text-sm text-gray-700">
            <svg class="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
            <span>{{ item }}</span>
          </li>
        </ul>
      </div>

      <!-- Hours -->
      <div class="mt-8 rounded-xl border border-gray-200 bg-white p-4 flex items-center gap-3">
        <div class="p-2 bg-primary-50 rounded-lg text-primary-600">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <div class="flex-1 text-sm">
          <p class="font-semibold text-gray-900">{{ t.hoursTitle }}</p>
          <p class="text-gray-600">{{ t.hoursWeekdays }}</p>
          <p class="text-gray-600">{{ t.hoursWeekend }}</p>
        </div>
      </div>

      <!-- Back to shop -->
      <div class="text-center mt-10">
        <NuxtLink to="/shop" class="text-sm font-semibold text-gray-500 hover:text-gray-900">
          ← {{ t.backToShop }}
        </NuxtLink>
      </div>

    </div>
  </section>
</template>

<script setup>
definePageMeta({
  layout: 'shop',
})

const { t: createTranslations, language } = useLanguage()

const phoneE164 = '+16194937969'
const phoneDisplay = '+1 (619) 493-7969'

const t = createTranslations({
  eyebrow:       { es: 'Personal Shopping', en: 'Personal Shopping' },
  title:         { es: '¿Necesitas ayuda con tu compra?', en: 'Need help with your shopping?' },
  subtitle:      { es: 'Escríbenos por WhatsApp y un personal shopper te responde al momento.', en: 'Send us a WhatsApp and a personal shopper will reply right away.' },
  fastestReply:  { es: 'Respuesta más rápida', en: 'Fastest reply' },
  cardCopy: {
    es: 'Te ayudamos a encontrar el producto, comparar tallas, confirmar precios o cotizar tu pedido en cualquier tienda de Estados Unidos.',
    en: 'We help you find products, compare sizes, confirm prices, or quote orders from any US store.',
  },
  openWhatsapp:  { es: 'Abrir WhatsApp', en: 'Open WhatsApp' },
  helpWithTitle: { es: 'En qué te podemos ayudar', en: 'How we can help' },
  hoursTitle:    { es: 'Horario de atención', en: 'Support hours' },
  hoursWeekdays: { es: 'Lunes a viernes · 9:00 a.m. – 7:00 p.m. (PT)', en: 'Monday to Friday · 9:00 AM – 7:00 PM (PT)' },
  hoursWeekend:  { es: 'Sábados · 10:00 a.m. – 4:00 p.m. (PT)', en: 'Saturday · 10:00 AM – 4:00 PM (PT)' },
  backToShop:    { es: 'Volver a la tienda', en: 'Back to shop' },
  whatsappLink: {
    es: 'https://wa.me/16194937969?text=%C2%A1Hola%21+Necesito+ayuda+con+mi+compra+en+Boxly.',
    en: 'https://wa.me/16194937969?text=Hi%21+I+need+help+with+my+Boxly+shopping.',
  },
})

const helpItems = computed(() => language.value === 'en'
  ? [
      'Find a specific product from any US store',
      'Confirm sizes, colors, or availability before buying',
      'Quote total cost with shipping and taxes to Mexico',
      'Guidance for your first Boxly order',
    ]
  : [
      'Encontrar un producto específico de cualquier tienda de USA',
      'Confirmar tallas, colores o disponibilidad antes de comprar',
      'Cotizar el costo total con envío e impuestos a México',
      'Asesoría para tu primer pedido en Boxly',
    ]
)

useHead(() => ({
  title: 'Ayuda · Personal Shopping — Tienda Boxly',
  meta: [
    {
      name: 'description',
      content: 'Habla con un personal shopper de Boxly por WhatsApp. Te ayudamos a encontrar productos, confirmar tallas y cotizar tu pedido desde cualquier tienda de Estados Unidos.',
    },
  ],
}))
</script>
