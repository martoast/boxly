<template>
  <!-- Editorial full-bleed hero. No body copy — let the image and the
       category nav below do the work. Single subtle chip in the corner
       so the section reads as intentional, not as decoration. -->
  <section class="relative w-full bg-gray-50">
    <NuxtLink
      to="/shop?view=all"
      class="block group relative aspect-[16/9] sm:aspect-[21/9] lg:aspect-[24/9] max-h-[640px] overflow-hidden"
    >
      <img
        src="/images/shop-hero.png"
        alt="Tienda Boxly"
        class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
      />
      <!-- Subtle vignette so the floating chip reads cleanly without dimming the image -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>

      <!-- Floating chip + arrow at bottom-left, Shopify-Dawn style -->
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
