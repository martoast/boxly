<template>
  <!-- The "send us the link" wedge — full-width band right before the
       footer. Single strong action. This is the emotional unlock: any
       product, any US store, ship to Mexico. Higher visual weight than
       a normal CTA because it's the highest-intent flow in the platform. -->
  <section class="bg-gray-50 py-12 sm:py-16">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="bg-white border border-gray-200 rounded-3xl shadow-sm p-7 sm:p-10 text-center">
        <div class="w-12 h-12 mx-auto mb-5 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
        </div>
        <h2 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">
          {{ t.title }}
        </h2>
        <p class="text-sm sm:text-base text-gray-600 mt-3 max-w-xl mx-auto leading-relaxed">{{ t.subtitle }}</p>
        <div class="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <NuxtLink
            to="/app/purchase-requests/create/online"
            class="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-full shadow-md transition-colors"
          >
            {{ t.cta }}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
          </NuxtLink>
          <NuxtLink
            to="/how-it-works"
            class="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold rounded-full transition-colors"
          >
            {{ t.howCta }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const { t: createTranslations } = useLanguage()

const t = createTranslations({
  title:   { es: '¿No encuentras el producto que quieres?', en: 'Can\'t find the product you want?' },
  subtitle:{ es: 'Mándanos el link, foto o nombre y lo conseguimos desde cualquier tienda de USA. Sin catálogos limitados.', en: 'Send us the link, photo, or name and we\'ll source it from any US store. No catalog limits.' },
  cta:     { es: 'Crear solicitud', en: 'Create request' },
  howCta:  { es: 'Cómo funciona', en: 'How it works' },
})
</script>
