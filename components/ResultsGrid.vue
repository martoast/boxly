<template>
  <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
    <div
      v-for="(p, i) in normalized"
      :key="i"
      role="button"
      tabindex="0"
      @click="$emit('open', p)"
      @keydown.enter="$emit('open', p)"
      class="group cursor-pointer bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-300 hover:-translate-y-1 transition-all duration-200 flex flex-col"
    >
      <div class="relative bg-gray-50">
        <div class="h-44 md:h-52 flex items-center justify-center p-3 overflow-hidden">
          <img
            v-if="p.image && !p.broken"
            :src="p.image"
            :alt="p.title"
            loading="lazy"
            referrerpolicy="no-referrer"
            class="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            @error="p.broken = true"
          />
          <span v-else class="text-[13px] font-bold text-gray-400 uppercase tracking-wide leading-tight line-clamp-3 text-center px-1">{{ p.store || p.title }}</span>
        </div>
        <span v-if="p.onSale && i === 0" class="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-red-500 text-white text-[10px] font-bold shadow-sm">🔥 MEJOR OFERTA</span>
        <span v-else-if="p.onSale" class="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-red-500 text-white text-[10px] font-bold shadow-sm">OFERTA</span>
      </div>

      <div class="p-3 pt-2.5 flex flex-col flex-1">
        <p v-if="p.store" class="text-[10px] uppercase tracking-wider text-primary-500 font-bold truncate">{{ p.store }}</p>
        <span class="text-[13px] font-semibold text-gray-900 leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-primary-600 transition-colors mt-0.5">{{ p.title }}</span>

        <div class="mt-auto pt-1.5">
          <p v-if="p.price" class="text-[15px] font-extrabold leading-none" :class="p.onSale ? 'text-red-600' : 'text-gray-900'">
            ${{ p.price }} <span class="text-[11px] font-semibold text-gray-400 align-middle">USD</span>
            <span v-if="p.was" class="ml-1 text-[11px] font-medium text-gray-300 line-through align-middle">${{ p.was }}</span>
          </p>
          <p class="flex items-center gap-1 text-[10px] text-gray-400 mt-1">
            <svg class="w-3 h-3 text-primary-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
            Compra asistida por Boxly
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({ products: { type: Array, default: () => [] } })
defineEmits(['open'])

const normalized = computed(() =>
  (props.products || []).map((p) => ({
    title: p.title || p.name || 'Producto',
    url: p.url || p.product_url || p.source_url || null,
    image: p.image || p.image_url || null,
    price: p.price ?? p.price_usd ?? null,
    was: p.was ?? null,
    onSale: p.on_sale ?? p.onSale ?? false,
    store: p.store || null,
    token: p.token || null,
    snippet: p.snippet || null,
    rating: p.rating ?? null,
    reviews: p.reviews ?? null,
    broken: false,
  }))
)
</script>
