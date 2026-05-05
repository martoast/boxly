<template>
  <!-- Editable hero campaign. The shopping manager controls every piece
       (image, title, subtitle, CTA, target URL) via the admin edit
       page; this component just renders whatever's active. Falls back
       to a clean image-only banner when no campaign is configured. -->

  <!-- Active campaign — split layout, copy + CTA on the left -->
  <section
    v-if="hero"
    class="relative w-full overflow-hidden bg-gradient-to-br from-primary-50 via-white to-amber-50"
  >
    <div class="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] items-center gap-8 max-w-7xl mx-auto px-6 lg:px-12 pt-16 pb-12 lg:py-24">
      <div class="text-center lg:text-left">
        <h1 class="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-gray-900 leading-[1.05] tracking-tight">
          {{ hero.title }}
        </h1>
        <p v-if="hero.subtitle" class="mt-5 text-lg sm:text-xl text-gray-600 max-w-xl mx-auto lg:mx-0">
          {{ hero.subtitle }}
        </p>
        <div class="mt-8">
          <NuxtLink
            :to="hero.cta_link || '/shop?view=all'"
            class="inline-flex items-center gap-2 px-6 py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-full transition-all duration-200 hover:scale-105 shadow-lg shadow-gray-900/10"
          >
            {{ hero.cta_label || 'Comprar' }}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </NuxtLink>
        </div>
      </div>

      <NuxtLink :to="hero.cta_link || '/shop?view=all'" class="block group">
        <div class="relative rounded-3xl overflow-hidden shadow-2xl shadow-primary-900/10 aspect-[4/3] lg:aspect-[5/4]">
          <img
            :src="hero.image_url || '/images/shop-hero.png'"
            :alt="hero.title"
            class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        </div>
      </NuxtLink>
    </div>
  </section>

  <!-- Fallback — clean image-only banner with a subtle "Ver todo" chip -->
  <section v-else class="relative w-full bg-gray-50">
    <NuxtLink
      to="/shop?view=all"
      class="block group relative aspect-[16/9] sm:aspect-[21/9] lg:aspect-[24/9] max-h-[640px] overflow-hidden"
    >
      <img
        src="/images/shop-hero.png"
        alt="Tienda Boxly"
        class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
      <div class="absolute left-4 bottom-4 sm:left-8 sm:bottom-8 inline-flex items-center gap-2 bg-white text-gray-900 rounded-full pl-4 pr-3 py-2 shadow-lg group-hover:gap-3 transition-all">
        <span class="text-sm font-semibold tracking-tight">Ver todo</span>
        <span class="inline-flex items-center justify-center h-7 w-7 rounded-full bg-gray-900 text-white">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
          </svg>
        </span>
      </div>
    </NuxtLink>
  </section>
</template>

<script setup>
const { $customFetch } = useNuxtApp()

// Server-side fetch — bakes the active campaign into the HTML on /shop
// so social-share previews of the storefront URL pick up whatever
// campaign is running.
const { data } = await useAsyncData('shop-hero', () =>
  $customFetch('/store/hero').catch(() => null),
)
const hero = computed(() => data.value?.data ?? null)
</script>
