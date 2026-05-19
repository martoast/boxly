<template>
  <!-- Chooser between the two purchase-request flows. Mirrors /shop/request
       so customers get the same in-person vs online decision from the
       dashboard's "Create new request" entry point. -->
  <section class="min-h-screen bg-gray-50 pb-20">
    <div class="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div class="max-w-3xl mx-auto px-4 py-4">
        <div class="flex items-center gap-3">
          <NuxtLink to="/app/purchase-requests" class="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors" :aria-label="t.back">
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </NuxtLink>
          <div class="flex-1 min-w-0">
            <h1 class="text-lg sm:text-xl font-semibold text-gray-900">{{ t.heroHeadline }}</h1>
            <p class="text-sm text-gray-500">{{ t.heroSubheadline }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-3xl mx-auto px-4 py-6 space-y-3">
      <!-- Online option -->
      <NuxtLink
        to="/app/purchase-requests/create/online"
        class="block bg-white rounded-2xl border border-gray-200 shadow-sm hover:border-primary-300 hover:shadow-md transition-all p-5 group"
      >
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary-100 transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <h2 class="text-base font-semibold text-gray-900">{{ t.onlineTitle }}</h2>
            <p class="text-sm text-gray-500 mt-1">{{ t.onlineDesc }}</p>
            <ul class="text-xs text-gray-500 mt-2.5 space-y-1">
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
        class="block bg-white rounded-2xl border border-gray-200 shadow-sm hover:border-primary-300 hover:shadow-md transition-all p-5 group"
      >
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary-100 transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <h2 class="text-base font-semibold text-gray-900">{{ t.inPersonTitle }}</h2>
            <p class="text-sm text-gray-500 mt-1">{{ t.inPersonDesc }}</p>
            <ul class="text-xs text-gray-500 mt-2.5 space-y-1">
              <li class="flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-primary-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                {{ t.inPersonBullet1 }}
              </li>
              <li class="flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-primary-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                {{ t.inPersonBullet2 }}
              </li>
            </ul>
          </div>
          <svg class="w-5 h-5 text-gray-400 mt-2 group-hover:text-primary-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </div>
      </NuxtLink>
    </div>
  </section>
</template>

<script setup>
definePageMeta({
  layout: 'app',
  middleware: ['auth', 'customer', 'complete-profile'],
});

const { t: createTranslations } = useLanguage();

const t = createTranslations({
  back:            { es: 'Volver', en: 'Back' },
  heroHeadline:    { es: 'Nueva solicitud', en: 'New request' },
  heroSubheadline: { es: 'Elige el tipo de compra.', en: 'Pick the type of request.' },

  onlineTitle:   { es: 'Compra online en tienda de USA', en: 'Online shopping at a US store' },
  onlineDesc:    { es: 'Mándanos los links y compramos en línea por ti.', en: 'Send us the links and we buy them online for you.' },
  onlineBullet1: { es: 'Cualquier tienda de USA', en: 'Any US store' },
  onlineBullet2: { es: 'Te cotizamos antes de comprar', en: 'You get a quote before we buy' },

  inPersonTitle:    { es: 'Compra en persona en Las Américas', en: 'In-person shopping at Las Americas' },
  inPersonDesc:     { es: 'Reservas una visita al outlet — compramos en persona.', en: 'Book an outlet visit — we shop in person.' },
  inPersonBullet1:  { es: 'Reservas con $10 USD por tienda', en: 'Reserve with $10 USD per store' },
  inPersonBullet2:  { es: '+ 10% sobre la compra al final', en: '+ 10% on the purchase at the end' },
});
</script>
