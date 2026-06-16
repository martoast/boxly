<template>
  <div class="-mx-1">
    <div class="flex gap-3 overflow-x-auto pb-2 px-1 snap-x snap-mandatory scrollbar-thin">
      <div
        v-for="(p, i) in normalized"
        :key="i"
        class="snap-start shrink-0 w-44 md:w-48 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col"
      >
        <a :href="p.url" target="_blank" rel="noopener noreferrer" class="block">
          <div class="aspect-square bg-gray-100 overflow-hidden">
            <img v-if="p.image && !p.broken" :src="p.image" :alt="p.title" loading="lazy" class="w-full h-full object-cover" @error="p.broken = true" />
            <div v-else class="w-full h-full grid place-items-center text-gray-300">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M4 8h16M4 6h16a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z"/></svg>
            </div>
          </div>
        </a>
        <div class="p-2.5 flex flex-col flex-1">
          <p v-if="p.store" class="text-[10px] uppercase tracking-wide text-gray-400 font-semibold truncate">{{ p.store }}</p>
          <a :href="p.url" target="_blank" rel="noopener noreferrer" class="text-[13px] font-semibold text-gray-900 leading-snug line-clamp-2 hover:text-primary-600 mt-0.5">{{ p.title }}</a>
          <p v-if="p.price" class="text-sm font-bold text-gray-900 mt-1">${{ p.price }}<span class="text-[11px] font-medium text-gray-400"> USD · ${{ Math.round(p.price * 18) }} MXN</span></p>
          <p v-else-if="p.note" class="text-[11px] text-gray-400 mt-1 line-clamp-2">{{ p.note }}</p>
          <div class="mt-2 flex gap-1.5">
            <a :href="p.url" target="_blank" rel="noopener noreferrer" class="flex-1 text-center text-[12px] font-semibold text-gray-700 border border-gray-200 rounded-lg py-1.5 hover:bg-gray-50 active:scale-95 transition-all">Ver</a>
            <button @click="$emit('pick', p)" class="flex-1 text-[12px] font-bold text-white bg-primary-500 hover:bg-primary-600 rounded-lg py-1.5 active:scale-95 transition-all">Pedir</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({ products: { type: Array, default: () => [] } })
defineEmits(['pick'])

const normalized = computed(() =>
  (props.products || []).map((p) => ({
    title: p.title || p.name || 'Producto',
    url: p.url || p.product_url || p.source_url || '#',
    image: p.image || p.image_url || null,
    price: p.price ?? p.price_usd ?? null,
    store: p.store || null,
    note: p.note || p.reason || null,
    broken: false,
  }))
)
</script>

<style scoped>
.scrollbar-thin::-webkit-scrollbar { height: 6px; }
.scrollbar-thin::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 9999px; }
.scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
</style>
