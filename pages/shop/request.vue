<template>
  <!-- Chooser between the two assisted-purchase flows:
       1. Online: customer pastes US store URLs, Boxly buys online + ships.
       2. In-person: customer schedules a Boxly visit to Las Americas Outlets.
       Each option deep-links into its own flow. -->
  <section class="min-h-screen bg-gray-50 pb-20">
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        <div class="flex items-start gap-3">
          <NuxtLink
            to="/shop"
            class="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 mt-0.5"
            :aria-label="t.backToShop"
          >
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </NuxtLink>
          <div class="flex-1 min-w-0">
            <h1 class="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">{{ t.heroHeadline }}</h1>
            <p class="text-sm text-gray-500 mt-1">{{ t.heroSubheadline }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-3xl mx-auto px-4 py-8 space-y-4">
      <!-- Online option -->
      <NuxtLink
        to="/shop/request/online"
        class="block bg-white rounded-2xl border border-gray-200 shadow-sm hover:border-primary-300 hover:shadow-md transition-all p-6 group"
      >
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary-100 transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <h2 class="text-lg font-bold text-gray-900">{{ t.onlineTitle }}</h2>
            <p class="text-sm text-gray-500 mt-1">{{ t.onlineDesc }}</p>
            <ul class="text-xs text-gray-500 mt-3 space-y-1">
              <li class="flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-primary-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                {{ t.onlineBullet1 }}
              </li>
              <li class="flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-primary-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                {{ t.onlineBullet2 }}
              </li>
            </ul>
          </div>
          <svg class="w-5 h-5 text-gray-400 mt-2 group-hover:text-primary-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </div>
      </NuxtLink>

      <!-- In-person option -->
      <NuxtLink
        to="/shop/in-person"
        class="block bg-gradient-to-br from-primary-600 to-primary-500 rounded-2xl shadow-lg hover:shadow-xl transition-all p-6 group text-white"
      >
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 bg-white/15 backdrop-blur rounded-xl flex items-center justify-center flex-shrink-0">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1 flex-wrap">
              <h2 class="text-lg font-bold">{{ t.inPersonTitle }}</h2>
              <span class="inline-flex items-center px-2 py-0.5 rounded-full bg-white/20 backdrop-blur text-[10px] font-semibold uppercase tracking-wider">
                {{ t.newBadge }}
              </span>
            </div>
            <p class="text-sm text-white/85">{{ t.inPersonDesc }}</p>
            <ul class="text-xs text-white/85 mt-3 space-y-1">
              <li class="flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                {{ t.inPersonBullet1 }}
              </li>
              <li class="flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                {{ t.inPersonBullet2 }}
              </li>
              <li class="flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                {{ t.inPersonBullet3 }}
              </li>
            </ul>
          </div>
          <svg class="w-5 h-5 mt-2 group-hover:translate-x-1 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </div>
      </NuxtLink>
    </div>
  </section>
</template>

<script setup>
definePageMeta({
  layout: 'shop',
  middleware: ['auth', 'customer', 'complete-profile'],
});

const { t: createTranslations } = useLanguage();

const t = createTranslations({
  heroHeadline:    { es: '¿Cómo quieres comprar?', en: 'How do you want to shop?' },
  heroSubheadline: { es: 'Elige el tipo de solicitud que mejor te funcione.', en: 'Pick the request type that works best for you.' },
  backToShop:      { es: 'Volver a la tienda', en: 'Back to shop' },
  newBadge:        { es: 'Nuevo', en: 'New' },

  onlineTitle:   { es: 'Compra online en tienda de USA', en: 'Online shopping at a US store' },
  onlineDesc:    { es: 'Mándanos los links de los productos y nosotros los compramos en línea, los recibimos en nuestra bodega y te los enviamos a México.', en: "Send us the product links — we buy them online, receive at our warehouse, and forward to Mexico." },
  onlineBullet1: { es: 'Compra en cualquier tienda de USA', en: 'Shop any US store' },
  onlineBullet2: { es: 'Te cotizamos antes de comprar', en: 'You get a quote before we buy' },

  inPersonTitle:    { es: 'Compra en persona en Las Américas', en: 'In-person shopping at Las Americas' },
  inPersonDesc:     { es: 'Agendamos una visita al outlet de Las Américas y compramos en persona los productos que quieres en las tiendas que elijas.', en: 'We schedule a visit to Las Americas Outlets and shop in person at the stores you pick.' },
  inPersonBullet1:  { es: 'Sin pago al agendar — pagas al final', en: 'No upfront payment — pay at the end' },
  inPersonBullet2:  { es: '$10 USD por tienda + 8% sobre la compra', en: '$10 USD per store + 8% on the purchase' },
  inPersonBullet3:  { es: 'Comparte tu lista de deseos o déjanos elegir', en: 'Share a wishlist or let us pick' },
});
</script>
