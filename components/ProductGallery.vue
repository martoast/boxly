<template>
  <div class="-mx-1">
    <!-- Store filter chips — only when results span more than one store -->
    <div v-if="stores.length > 1" class="flex gap-1.5 overflow-x-auto px-1 pb-2 mb-0.5 scrollbar-thin">
      <button
        @click="activeStore = null"
        :class="['shrink-0 px-3 py-1 rounded-full text-[12px] font-semibold border transition-all active:scale-95', activeStore === null ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300']"
      >Todas</button>
      <button
        v-for="s in stores"
        :key="s"
        @click="activeStore = s"
        :class="['shrink-0 px-3 py-1 rounded-full text-[12px] font-semibold border transition-all active:scale-95', activeStore === s ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300']"
      >{{ s }}</button>
    </div>

    <div
      class="grid grid-flow-col auto-cols-[10.5rem] md:auto-cols-[11.5rem] gap-3 overflow-x-auto pb-2 px-1 snap-x scrollbar-thin"
      :class="rows === 2 ? 'grid-rows-2' : 'grid-rows-1'"
    >
      <div
        v-for="(p, i) in visible"
        :key="i"
        class="group snap-start bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-300 hover:-translate-y-1 transition-all duration-200 flex flex-col"
      >
        <a :href="p.url" target="_blank" rel="noopener noreferrer" class="block relative">
          <div class="aspect-square overflow-hidden bg-gray-50">
            <img
              v-if="p.image && !p.broken"
              :src="p.image"
              :alt="p.title"
              loading="lazy"
              referrerpolicy="no-referrer"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              @error="p.broken = true"
            />
            <!-- Graceful fallback: brand wordmark on a soft gradient, not a sad icon -->
            <div v-else class="w-full h-full grid place-items-center bg-gradient-to-br from-gray-50 to-gray-100 px-3 text-center">
              <span class="text-[13px] font-bold text-gray-400 uppercase tracking-wide leading-tight line-clamp-3">{{ p.store || p.title }}</span>
            </div>
          </div>
          <!-- Deal badge -->
          <span v-if="p.onSale" class="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-red-500 text-white text-[10px] font-bold shadow-sm">OFERTA</span>
        </a>

        <div class="p-3 flex flex-col flex-1">
          <p v-if="p.store" class="text-[10px] uppercase tracking-wider text-primary-500 font-bold truncate">{{ p.store }}</p>
          <a :href="p.url" target="_blank" rel="noopener noreferrer" class="text-[13px] font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-primary-600 transition-colors mt-0.5">{{ p.title }}</a>

          <div class="mt-auto pt-2">
            <p v-if="p.price" class="text-[15px] font-extrabold leading-none" :class="p.onSale ? 'text-red-600' : 'text-gray-900'">
              ${{ p.price }} <span class="text-[11px] font-semibold text-gray-400 align-middle">USD</span>
              <span v-if="p.was" class="ml-1 text-[11px] font-medium text-gray-300 line-through align-middle">${{ p.was }}</span>
            </p>
            <p v-if="p.price" class="text-[10px] text-gray-400 mt-0.5">Precio de tienda</p>
            <p v-else-if="p.note" class="text-[11px] text-gray-400 line-clamp-2">{{ p.note }}</p>

            <div class="mt-2 flex gap-1.5">
              <a :href="p.url" target="_blank" rel="noopener noreferrer" class="flex-1 text-center text-[12px] font-semibold text-gray-600 border border-gray-200 rounded-lg py-1.5 hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all">Ver</a>
              <button @click="$emit('pick', p)" class="flex-1 text-[12px] font-bold text-white bg-primary-500 hover:bg-primary-600 rounded-lg py-1.5 active:scale-95 transition-all shadow-sm shadow-primary-500/20">Pedir</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({ products: { type: Array, default: () => [] } })
defineEmits(['pick'])

const activeStore = ref(null)

const normalized = computed(() =>
  (props.products || []).map((p) => ({
    title: p.title || p.name || 'Producto',
    url: p.url || p.product_url || p.source_url || '#',
    image: p.image || p.image_url || null,
    price: p.price ?? p.price_usd ?? null,
    was: p.was ?? null,
    onSale: p.on_sale ?? p.onSale ?? false,
    store: p.store || null,
    note: p.note || p.reason || null,
    broken: false,
  }))
)

// Distinct stores present (for the filter chips).
const stores = computed(() => [...new Set(normalized.value.map((p) => p.store).filter(Boolean))])

// Reset the filter if the selected store is no longer present (new results).
watch(stores, (list) => { if (activeStore.value && !list.includes(activeStore.value)) activeStore.value = null })

const visible = computed(() =>
  activeStore.value ? normalized.value.filter((p) => p.store === activeStore.value) : normalized.value
)

// Two rows only when there are enough products to roughly fill them — otherwise
// a single item in a 2-row grid leaves a big empty row (the blank-space bug).
const rows = computed(() => (visible.value.length >= 5 ? 2 : 1))
</script>

<style scoped>
.scrollbar-thin::-webkit-scrollbar { height: 6px; }
.scrollbar-thin::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 9999px; }
.scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
</style>
