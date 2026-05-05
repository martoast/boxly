<template>
  <!-- Full-width banner CTA that links to the /shop/brands index page.
       Image-led; the actual brand grid lives on its own page so the
       storefront landing stays short and punchy. -->
  <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
    <NuxtLink
      to="/shop/brands"
      class="group relative block aspect-[21/9] sm:aspect-[24/9] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow"
    >
      <img
        src="/images/shop-categories-cta.png"
        alt="Compra de tus marcas favoritas"
        class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
      />

      <!-- Soft gradient just on the right side so the overlay reads cleanly -->
      <div class="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/30"></div>

      <!-- Right-aligned content card. Mobile: bottom-stacked. -->
      <div class="absolute inset-0 flex items-end sm:items-center justify-start sm:justify-end p-5 sm:p-10 lg:p-14">
        <div class="text-white text-left sm:text-right max-w-md">
          <h2 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight drop-shadow-lg">
            Compra de tus marcas favoritas
          </h2>
          <p class="mt-1.5 text-sm sm:text-base text-white/90 drop-shadow">
            Lululemon, Alo, Stanley y más.
          </p>
          <span class="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-white text-gray-900 font-semibold rounded-full text-sm shadow-lg group-hover:gap-3 transition-all">
            Ver marcas
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </span>
        </div>
      </div>
    </NuxtLink>
  </section>
</template>
