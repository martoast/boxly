<template>
  <Teleport to="body">
    <Transition name="pm">
      <div v-if="product" class="fixed inset-0 z-[100] flex items-end md:items-center justify-center" role="dialog" aria-modal="true">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="$emit('close')"></div>

        <div class="pm-card relative w-full md:max-w-md bg-white rounded-t-3xl md:rounded-3xl shadow-2xl max-h-[92dvh] overflow-y-auto overscroll-contain">
          <!-- drag handle (mobile) + close -->
          <div class="md:hidden sticky top-0 z-10 flex justify-center pt-2.5 pb-1 bg-white/80 backdrop-blur">
            <span class="h-1.5 w-10 rounded-full bg-gray-300"></span>
          </div>
          <button @click="$emit('close')" class="absolute top-3 right-3 z-20 w-8 h-8 grid place-items-center rounded-full bg-white/90 shadow text-gray-500 hover:text-gray-800 active:scale-90 transition" aria-label="Cerrar">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>

          <!-- image -->
          <div class="bg-gray-50 flex items-center justify-center p-6 h-72">
            <img v-if="product.image" :src="product.image" :alt="product.title" referrerpolicy="no-referrer" class="max-h-full max-w-full object-contain" />
            <span v-else class="text-base font-bold text-gray-400 uppercase tracking-wide text-center px-6">{{ product.store || product.title }}</span>
          </div>

          <div class="p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <p v-if="product.store" class="text-[11px] uppercase tracking-wider text-primary-500 font-bold">{{ product.store }}</p>
            <h2 class="text-lg font-bold text-gray-900 leading-snug mt-1">{{ product.title }}</h2>

            <div v-if="product.rating" class="flex items-center gap-1 mt-1.5 text-[13px] text-gray-500">
              <svg class="w-4 h-4 text-amber-400" viewBox="0 0 20 20" fill="currentColor"><path d="M10 15l-5.878 3.09 1.123-6.545L.49 6.91l6.572-.955L10 0l2.938 5.955 6.572.955-4.755 4.635 1.123 6.545z"/></svg>
              <span class="font-semibold text-gray-700">{{ product.rating }}</span>
              <span v-if="product.reviews">· {{ formatReviews(product.reviews) }} reseñas</span>
            </div>

            <div class="flex items-baseline gap-2 mt-3">
              <span class="text-2xl font-extrabold" :class="product.onSale ? 'text-red-600' : 'text-gray-900'">${{ product.price }}<span class="text-sm font-semibold text-gray-400"> USD</span></span>
              <span v-if="product.was" class="text-sm font-medium text-gray-400 line-through">${{ product.was }}</span>
              <span v-if="product.onSale" class="px-1.5 py-0.5 rounded-md bg-red-500 text-white text-[10px] font-bold">OFERTA</span>
            </div>
            <p class="text-xs text-gray-400 mt-1">Precio de tienda · Boxly suma su comisión y el envío (se cotiza después).</p>

            <p v-if="product.snippet" class="text-sm text-gray-600 leading-relaxed mt-4">{{ product.snippet }}</p>

            <!-- CTAs -->
            <button @click="$emit('pick', product)" class="mt-5 w-full py-3 rounded-2xl bg-primary-500 hover:bg-primary-600 active:scale-[.98] text-white text-[15px] font-bold shadow-sm shadow-primary-500/25 transition-all">
              Pedir este producto
            </button>
            <a :href="product.url" target="_blank" rel="noopener noreferrer" class="mt-2 w-full flex items-center justify-center gap-1.5 py-3 rounded-2xl border border-gray-200 text-gray-700 text-[15px] font-semibold hover:bg-gray-50 active:scale-[.98] transition-all">
              Ver en línea
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
            </a>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
defineProps({ product: { type: Object, default: null } })
defineEmits(['close', 'pick'])

function formatReviews(n) {
  const v = Number(n) || 0
  return v >= 1000 ? (v / 1000).toFixed(1).replace('.0', '') + 'k' : String(v)
}
</script>

<style scoped>
.pm-enter-from, .pm-leave-to { opacity: 0; }
.pm-enter-active, .pm-leave-active { transition: opacity .25s ease; }
.pm-enter-from .pm-card, .pm-leave-to .pm-card { transform: translateY(24px); }
.pm-enter-active .pm-card, .pm-leave-active .pm-card { transition: transform .28s cubic-bezier(.2,.8,.2,1); }
@media (prefers-reduced-motion: reduce) {
  .pm-enter-active, .pm-leave-active, .pm-enter-active .pm-card, .pm-leave-active .pm-card { transition: none; }
}
</style>
