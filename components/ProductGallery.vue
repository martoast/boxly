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

    <div class="relative group">
    <div
      ref="track"
      @scroll.passive="measure"
      class="grid grid-flow-col items-stretch auto-cols-[15rem] md:auto-cols-[15.5rem] gap-3 overflow-x-auto pb-2 px-1 snap-x no-scrollbar grid-rows-[auto]"
    >
      <!-- A "BOXLY Offer" card: the offer (we buy + import + deliver, landed total)
           is the hero; the product is the supporting detail. -->
      <!-- The whole card opens the product modal — one clear action. -->
      <div
        v-for="(p, i) in visible"
        :key="i"
        @click="$emit('open', p)"
        @keydown.enter="$emit('open', p)"
        role="button"
        tabindex="0"
        class="group snap-start text-left bg-white border border-gray-200/80 hover:border-gray-300 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col cursor-pointer"
      >
        <!-- Product image + badges -->
        <div class="relative bg-gray-50">
          <div class="h-32 flex items-center justify-center p-3 overflow-hidden">
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
          <span class="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-white/95 text-gray-700 text-[10px] font-bold shadow-sm ring-1 ring-black/5">🇺🇸 ➜ 🇲🇽 Disponible con Boxly</span>
          <span v-if="p.onSale" class="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-red-500 text-white text-[10px] font-bold shadow-sm">OFERTA</span>
        </div>

        <div class="p-3 flex flex-col flex-1">
          <!-- Store pill: make it obvious WHICH store this product is from (results
               can come from a different seller than the one searched). -->
          <span v-if="p.store" class="inline-flex items-center gap-1 self-start mb-1.5 max-w-full px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 text-[10.5px] font-bold ring-1 ring-primary-100">
            <svg class="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9l1-5h16l1 5M4 9v10a1 1 0 001 1h14a1 1 0 001-1V9M4 9h16M9 20v-6h6v6"/></svg>
            <span class="truncate">{{ p.store }}</span>
          </span>
          <span class="text-[13px] font-semibold text-gray-900 leading-snug line-clamp-2 min-h-[2.4rem]">{{ p.title }}</span>

          <!-- Product price (the real, known number). -->
          <p v-if="p.price" class="mt-1.5 text-[16px] font-extrabold text-gray-900 leading-none">
            ${{ p.price }} <span class="text-[10px] font-semibold text-gray-400">USD</span>
            <span v-if="p.was" class="ml-1 text-[10px] font-medium text-gray-300 line-through">${{ p.was }}</span>
          </p>
          <p v-if="p.price" class="text-[9.5px] text-gray-400 mt-0.5 leading-tight">Precio de tienda</p>

          <!-- Single affordance: the whole card opens the details modal. -->
          <div class="mt-auto pt-2.5">
            <span class="inline-flex items-center gap-1 text-[12.5px] font-bold text-primary-600 group-hover:gap-1.5 transition-all">
              Ver detalles
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
            </span>
          </div>
        </div>
      </div>
    </div>

      <!-- Edge fades: hint there's more to either side -->
      <div v-show="canScroll && !atEnd" class="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-gray-50 to-transparent"></div>
      <div v-show="canScroll && !atStart" class="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-gray-50 to-transparent"></div>

      <!-- Desktop arrow buttons: clickable scroll controls (hover devices only,
           since touch users just swipe). -->
      <button
        v-show="canScroll && !atStart"
        type="button"
        @click="scrollByPage(-1)"
        aria-label="Anterior"
        class="hidden md:grid place-items-center w-9 h-9 rounded-full bg-white shadow-md ring-1 ring-black/5 text-gray-600 hover:text-gray-900 hover:scale-105 active:scale-95 transition-all absolute left-1.5 top-16 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
      </button>
      <button
        v-show="canScroll && !atEnd"
        type="button"
        @click="scrollByPage(1)"
        aria-label="Siguiente"
        class="hidden md:grid place-items-center w-9 h-9 rounded-full bg-white shadow-md ring-1 ring-black/5 text-gray-600 hover:text-gray-900 hover:scale-105 active:scale-95 transition-all absolute right-1.5 top-16 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
      </button>

      <!-- Faint nudging arrow: swipe-right cue (touch only) — over the image area -->
      <div v-show="canScroll && !atEnd" class="md:hidden swipe-arrow pointer-events-none absolute right-1.5 top-16">
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
  (props.products || []).map((p) => {
    const title = p.title || p.name || 'Producto'
    return {
      title,
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
      token: p.token || null,
      broken: false,
    }
  })
)

// Distinct stores present (for the filter chips).
const stores = computed(() => [...new Set(normalized.value.map((p) => p.store).filter(Boolean))])

// Reset the filter if the selected store is no longer present (new results).
watch(stores, (list) => { if (activeStore.value && !list.includes(activeStore.value)) activeStore.value = null })

const visible = computed(() =>
  activeStore.value ? normalized.value.filter((p) => p.store === activeStore.value) : normalized.value
)

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

// Desktop: translate a vertical mouse wheel into horizontal scroll (a plain wheel
// only emits deltaY, so the carousel would feel "stuck"). Reads dimensions LIVE
// from the element (not cached measurements, which can be 0 right after the gallery
// renders in the chat — that was making the wheel do nothing). Trackpad horizontal
// intent (deltaX) is honored too.
function onWheel(e) {
  const el = track.value
  if (!el) return
  const max = el.scrollWidth - el.clientWidth
  if (max <= 4) return // nothing to scroll
  // Dominant axis: mouse wheel → deltaY; trackpad swipe → deltaX.
  const raw = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX
  if (!raw) return
  const atLeft = el.scrollLeft <= 0
  const atRight = el.scrollLeft >= max - 1
  // At an edge in the wheel's direction, let the page scroll normally.
  if ((raw < 0 && atLeft) || (raw > 0 && atRight)) return
  e.preventDefault()
  let amount = raw
  if (e.deltaMode === 1) amount *= 16 // delta in LINES → px
  else if (e.deltaMode === 2) amount *= el.clientWidth // delta in PAGES → px
  el.scrollLeft += amount
}

// Desktop arrow buttons: jump by roughly one viewport of cards.
function scrollByPage(dir) {
  const el = track.value
  if (!el) return
  el.scrollBy({ left: dir * Math.max(160, el.clientWidth * 0.8), behavior: 'smooth' })
}
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
  // Attach wheel explicitly as NON-passive so preventDefault() works and the
  // vertical wheel can drive horizontal scroll on desktop.
  if (track.value) track.value.addEventListener('wheel', onWheel, { passive: false })
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', measure)
  if (track.value) track.value.removeEventListener('wheel', onWheel)
})
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
