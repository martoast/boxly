<template>
  <!-- Banner variant: full-width card for catalog pages -->
  <NuxtLink
    v-if="variant === 'banner'"
    to="/app/purchase-requests"
    class="group block rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50 via-white to-amber-50 p-5 sm:p-6 transition-all hover:border-primary-300 hover:shadow-md"
  >
    <div class="flex items-center gap-4 sm:gap-5">
      <div class="hidden sm:flex w-12 h-12 rounded-full bg-white border border-primary-100 items-center justify-center text-primary-600 flex-shrink-0 shadow-sm">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <div class="flex-1 min-w-0">
        <h3 class="font-bold text-gray-900 text-base sm:text-lg leading-tight">{{ t.headline }}</h3>
        <p class="text-sm text-gray-600 mt-1 leading-snug">{{ t.subheadline }}</p>
      </div>
      <div class="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-gray-900 text-white text-sm font-semibold group-hover:bg-primary-600 transition-colors">
        <span class="hidden sm:inline">{{ t.cta }}</span>
        <span class="sm:hidden">{{ t.ctaShort }}</span>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  </NuxtLink>

  <!-- Inline variant: slimmer card for product detail page -->
  <NuxtLink
    v-else
    to="/app/purchase-requests"
    class="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-primary-300 hover:bg-primary-50/40"
  >
    <div class="w-10 h-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>
    <div class="flex-1 min-w-0">
      <p class="font-semibold text-gray-900 text-sm leading-tight">{{ t.inlineHeadline }}</p>
      <p class="text-xs text-gray-500 mt-0.5">{{ t.subheadline }}</p>
    </div>
    <svg class="w-5 h-5 text-gray-400 group-hover:text-primary-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
    </svg>
  </NuxtLink>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'banner',
    validator: (v) => ['banner', 'inline'].includes(v),
  },
})

const { t: createTranslations } = useLanguage()

const t = createTranslations({
  headline: {
    es: '¿No encuentras lo que buscas?',
    en: "Can't find what you're looking for?",
  },
  inlineHeadline: {
    es: '¿Buscas algo distinto? Te lo conseguimos.',
    en: 'Looking for something else? We can get it.',
  },
  subheadline: {
    es: 'Te lo conseguimos de cualquier tienda de USA.',
    en: "We'll grab it from any US store.",
  },
  cta: { es: 'Pídelo', en: 'Request it' },
  ctaShort: { es: 'Pídelo', en: 'Request' },
})
</script>
