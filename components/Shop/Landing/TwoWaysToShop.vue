<template>
  <!-- Two ways to shop the Boxly Store, presented as a clean dual-path
       section. Both paths converge on the same managed purchase request:
       (1) buy from our curated catalog, or (2) send us any product link.
       Apple-clean — white cards, one accent color, no competing gradients.
       Replaces the old stacked RequestAnything + InPerson banners. -->
  <section class="bg-gray-50 py-12 sm:py-16 lg:py-20">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
        <p class="text-xs sm:text-sm font-semibold text-primary-600 uppercase tracking-wider mb-2">{{ t.eyebrow }}</p>
        <h2 class="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">{{ t.title }}</h2>
        <p class="text-sm sm:text-base text-gray-600 mt-3 leading-relaxed">{{ t.subtitle }}</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
        <!-- Path 1 — Browse curated catalog -->
        <div class="group bg-white rounded-3xl border border-gray-200/80 hover:border-primary-300 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] p-7 sm:p-8 flex flex-col">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"/></svg>
            </div>
            <span class="text-xs font-bold text-gray-400 uppercase tracking-wider">{{ t.path1Tag }}</span>
          </div>
          <h3 class="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">{{ t.path1Title }}</h3>
          <p class="text-[15px] text-gray-600 mt-2 leading-relaxed flex-1">{{ t.path1Desc }}</p>
          <NuxtLink
            to="/shop?view=all"
            class="mt-5 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-full text-sm transition-colors self-start"
          >
            {{ t.path1Cta }}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
          </NuxtLink>
        </div>

        <!-- Path 2 — Send any link -->
        <div class="group bg-white rounded-3xl border border-gray-200/80 hover:border-primary-300 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] p-7 sm:p-8 flex flex-col">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"/></svg>
            </div>
            <span class="text-xs font-bold text-gray-400 uppercase tracking-wider">{{ t.path2Tag }}</span>
          </div>
          <h3 class="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">{{ t.path2Title }}</h3>
          <p class="text-[15px] text-gray-600 mt-2 leading-relaxed flex-1">{{ t.path2Desc }}</p>
          <NuxtLink
            to="/app/purchase-requests/create/online"
            class="mt-5 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-full text-sm transition-colors self-start"
          >
            {{ t.path2Cta }}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
          </NuxtLink>
        </div>
      </div>

      <!-- Unifying message: both paths become the same managed flow -->
      <div class="mt-6 flex items-center justify-center gap-2.5 text-center">
        <svg class="w-5 h-5 text-primary-500 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <p class="text-sm text-gray-600">{{ t.footnote }}</p>
      </div>
    </div>
  </section>
</template>

<script setup>
const { t: createTranslations } = useLanguage()

const t = createTranslations({
  eyebrow:   { es: 'Boxly Store', en: 'Boxly Store' },
  title:     { es: 'Dos formas de comprar', en: 'Two ways to shop' },
  subtitle:  { es: 'Compra de nuestra selección curada o mándanos el link de lo que quieras. De cualquier forma, nosotros lo compramos por ti.', en: 'Shop our curated picks or send us a link to anything. Either way, we buy it for you.' },

  path1Tag:   { es: 'Opción 1', en: 'Option 1' },
  path1Title: { es: 'Explora nuestra selección', en: 'Browse our picks' },
  path1Desc:  { es: 'Nuestro equipo publica los productos más buscados y las mejores ofertas de USA. Elige, paga y nosotros nos encargamos del resto.', en: 'Our team curates the most-wanted products and best US deals. Pick, pay, and we handle the rest.' },
  path1Cta:   { es: 'Ver la tienda', en: 'Browse the store' },

  path2Tag:   { es: 'Opción 2', en: 'Option 2' },
  path2Title: { es: '¿No lo encuentras? Mándanos el link', en: "Can't find it? Send us the link" },
  path2Desc:  { es: 'Si lo viste en cualquier tienda de USA, mándanos el link, foto o nombre y lo conseguimos por ti. Sin límites de catálogo.', en: 'Saw it in any US store? Send us the link, photo, or name and we get it for you. No catalog limits.' },
  path2Cta:   { es: 'Crear solicitud', en: 'Create request' },

  footnote:   { es: 'Las dos opciones se vuelven una solicitud que recibimos en San Diego y enviamos a tu casa en México.', en: 'Both options become one request we receive in San Diego and ship to your home in Mexico.' },
})
</script>
