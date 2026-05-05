<template>
  <section class="bg-gradient-to-br from-primary-50 via-white to-amber-50 py-16 lg:py-24">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center max-w-2xl mx-auto mb-12">
        <p class="text-xs font-bold text-primary-600 uppercase tracking-widest mb-2">Por qué Boxly</p>
        <h2 class="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Compra como si vivieras en EUA</h2>
      </div>

      <div class="grid sm:grid-cols-3 gap-6 sm:gap-8">
        <div
          v-for="prop in props"
          :key="prop.title"
          class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 text-center sm:text-left transition-all hover:shadow-lg hover:-translate-y-1"
        >
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 mb-4">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" :d="prop.icon" />
            </svg>
          </div>
          <h3 class="font-bold text-gray-900 text-lg mb-2">{{ prop.title }}</h3>
          <p class="text-gray-600 text-sm leading-relaxed">{{ prop.body }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const props = [
  {
    title: 'Precios reales en USD',
    body: 'Mostramos el precio que cobra la tienda original. Sin sobreprecios escondidos.',
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    title: 'Curado a mano',
    body: 'Cada producto fue elegido y verificado por nuestro equipo. No hay sorpresas.',
    icon: 'M5 13l4 4L19 7',
  },
  {
    title: 'Un solo envío a México',
    body: 'Compras de varias tiendas, las consolidamos en San Diego, y llegan juntas a tu puerta.',
    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  },
]
</script>
