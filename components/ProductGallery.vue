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

    <div class="relative">
    <div
      ref="track"
      @scroll.passive="measure"
      class="grid grid-flow-col items-start auto-cols-[10.5rem] md:auto-cols-[11.5rem] gap-3 overflow-x-auto pb-2 px-1 snap-x no-scrollbar scroll-smooth"
      :class="rows === 2 ? 'grid-rows-[auto_auto]' : 'grid-rows-[auto]'"
    >
      <button
        v-for="(p, i) in visible"
        :key="i"
        type="button"
        @click="$emit('open', p)"
        class="group snap-start text-left bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-300 hover:-translate-y-1 active:scale-[.98] transition-all duration-200 flex flex-col"
      >
        <!-- Fixed-pixel image height (NOT aspect-ratio): iOS Safari won't resolve
             max-height:100% against an aspect-ratio box, which let images blow
             up. A fixed height keeps every image area identical. -->
        <div class="relative bg-gray-50">
          <div class="h-40 flex items-center justify-center p-3 overflow-hidden">
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
          <span v-if="p.onSale" class="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-red-500 text-white text-[10px] font-bold shadow-sm">OFERTA</span>
        </div>

        <!-- Deterministic-height info block (title reserves 2 lines). -->
        <div class="p-3 pt-2.5 flex flex-col">
          <p v-if="p.store" class="text-[10px] uppercase tracking-wider text-primary-500 font-bold truncate">{{ p.store }}</p>
          <span class="text-[13px] font-semibold text-gray-900 leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-primary-600 transition-colors mt-0.5">{{ p.title }}</span>

          <p v-if="p.price" class="text-[15px] font-extrabold leading-none mt-1.5" :class="p.onSale ? 'text-red-600' : 'text-gray-900'">
            ${{ p.price }} <span class="text-[11px] font-semibold text-gray-400 align-middle">USD</span>
            <span v-if="p.was" class="ml-1 text-[11px] font-medium text-gray-300 line-through align-middle">${{ p.was }}</span>
          </p>
          <p v-if="p.price" class="text-[10px] text-gray-400 mt-0.5">Precio de tienda</p>
          <p v-else-if="p.note" class="text-[11px] text-gray-400 line-clamp-2 mt-1">{{ p.note }}</p>
        </div>
      </button>
    </div>

      <!-- Edge fades: hint there's more to either side -->
      <div v-show="canScroll && !atEnd" class="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-gray-50 to-transparent"></div>
      <div v-show="canScroll && !atStart" class="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-gray-50 to-transparent"></div>

      <!-- Faint nudging arrow: swipe-right cue -->
      <div v-show="canScroll && !atEnd" class="swipe-arrow pointer-events-none absolute right-1.5 top-1/2">
        <span class="grid place-items-center w-7 h-7 rounded-full bg-white/80 shadow-md ring-1 ring-black/5">
          <svg class="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
        </span>
      </div>
    </div>

    <!-- Swipe affordance: progress bar + hint (only when scrollable) -->
    <div v-if="canScroll" class="flex items-center gap-2 px-1 mt-1.5">
      <div class="relative h-1 flex-1 rounded-full bg-gray-200 overflow-hidden">
        <div class="absolute top-0 h-full rounded-full bg-primary-400" :style="{ width: thumbWidth + '%', left: thumbLeft + '%' }"></div>
      </div>
      <Transition name="hint">
        <span v-if="atStart" class="shrink-0 text-[11px] font-semibold text-gray-400 whitespace-nowrap">Desliza →</span>
      </Transition>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({ products: { type: Array, default: () => [] } })
defineEmits(['open'])

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
    snippet: p.snippet || null,
    rating: p.rating ?? null,
    reviews: p.reviews ?? null,
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

// --- Swipe affordance: track scroll position to drive the progress bar,
// edge fades, and "Desliza →" hint (native scrollbar is hidden on mobile). ---
const track = ref(null)
const sl = ref(0)
const sw = ref(0)
const cw = ref(0)
function measure() {
  const el = track.value
  if (!el) return
  sl.value = el.scrollLeft
  sw.value = el.scrollWidth
  cw.value = el.clientWidth
}
const canScroll = computed(() => sw.value - cw.value > 4)
const atStart = computed(() => sl.value <= 2)
const atEnd = computed(() => sl.value >= sw.value - cw.value - 2)
const thumbWidth = computed(() => (sw.value ? Math.max(14, Math.min(100, (cw.value / sw.value) * 100)) : 100))
const thumbLeft = computed(() => {
  const max = sw.value - cw.value
  return max > 0 ? (sl.value / max) * (100 - thumbWidth.value) : 0
})

onMounted(() => {
  nextTick(measure)
  window.addEventListener('resize', measure)
})
onBeforeUnmount(() => window.removeEventListener('resize', measure))
// Re-measure when the product set changes (new search / store filter).
watch(visible, () => nextTick(measure))
</script>

<style scoped>
.scrollbar-thin::-webkit-scrollbar { height: 6px; }
.scrollbar-thin::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 9999px; }
.scrollbar-thin::-webkit-scrollbar-track { background: transparent; }

/* Hide the native scrollbar on the carousel — we show our own progress bar. */
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

.hint-enter-from, .hint-leave-to { opacity: 0; }
.hint-enter-active, .hint-leave-active { transition: opacity .2s ease; }

/* Faint, gently nudging swipe-right arrow (transform also vertically centers). */
.swipe-arrow { animation: swipe-arrow 1.5s ease-in-out infinite; }
@keyframes swipe-arrow {
  0%, 100% { transform: translate(0, -50%); opacity: .45; }
  50%      { transform: translate(6px, -50%); opacity: .9; }
}
@media (prefers-reduced-motion: reduce) {
  .swipe-arrow { animation: none; transform: translateY(-50%); opacity: .55; }
}
</style>
