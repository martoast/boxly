<template>
  <section class="relative w-full overflow-hidden bg-gradient-to-br from-primary-50 via-white to-amber-50">
    <div class="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-8 max-w-7xl mx-auto px-6 lg:px-12 pt-24 pb-16 lg:py-32">
      <!-- Copy -->
      <div class="relative z-10 text-center lg:text-left">
        <div class="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full bg-primary-50 border border-primary-100 text-primary-700 text-xs font-semibold uppercase tracking-wider">
          <span class="h-2 w-2 rounded-full bg-primary-500 animate-pulse"></span>
          Tienda Boxly
        </div>
        <h1 class="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-gray-900 leading-[1.05] tracking-tight">
          Compra en EUA,<br>
          <span class="bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">recibe en México</span>
        </h1>
        <p class="mt-5 text-lg sm:text-xl text-gray-600 max-w-xl mx-auto lg:mx-0">
          Hand-picked from the brands you love.
        </p>
        <div class="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-3">
          <a
            href="#categories"
            class="inline-flex items-center gap-2 px-6 py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-full transition-all duration-200 hover:scale-105 shadow-lg shadow-gray-900/10"
          >
            Ver productos
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>
          </a>
          <a
            href="#brands"
            class="inline-flex items-center gap-2 px-6 py-3.5 bg-white hover:bg-gray-50 text-gray-900 font-semibold rounded-full transition-colors border border-gray-200"
          >
            Marcas favoritas
          </a>
        </div>
      </div>

      <!-- Image -->
      <div class="relative">
        <div class="relative rounded-3xl overflow-hidden shadow-2xl shadow-primary-900/10 aspect-[4/3] lg:aspect-[5/4]">
          <img
            src="/images/shop-hero.png"
            alt="Boxly Store — productos curados"
            class="absolute inset-0 w-full h-full object-cover"
          />
          <div class="absolute inset-0 bg-gradient-to-tr from-black/10 via-transparent to-transparent"></div>
        </div>
        <!-- Floating accent badge -->
        <div class="hidden lg:block absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl px-5 py-3 border border-gray-100">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-xl bg-primary-50 flex items-center justify-center">
              <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            </div>
            <div>
              <p class="text-xs text-gray-500 font-semibold uppercase tracking-wider">Curado a mano</p>
              <p class="text-sm font-bold text-gray-900">Productos verificados</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
