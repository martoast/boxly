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
      @wheel="onWheel"
      class="grid grid-flow-col items-stretch auto-cols-[15rem] md:auto-cols-[15.5rem] gap-3 overflow-x-auto pb-2 px-1 snap-x no-scrollbar scroll-smooth grid-rows-[auto]"
    >
      <!-- A "BOXLY Offer" card: the offer (we buy + import + deliver, landed total)
           is the hero; the product is the supporting detail. -->
      <div
        v-for="(p, i) in visible"
        :key="i"
        class="group snap-start text-left bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col"
        :class="isBest(i) ? 'border-amber-300 ring-1 ring-amber-200' : 'border-gray-200/80 hover:border-gray-300'"
      >
        <!-- Product (secondary): smaller image, tiny store badge -->
        <div class="relative bg-gray-50 cursor-pointer" @click="$emit('open', p)">
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
          <span v-if="isBest(i)" class="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-amber-400 text-amber-950 text-[10px] font-extrabold shadow">🏆 Mejor opción</span>
          <span v-else-if="p.onSale" class="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-red-500 text-white text-[10px] font-bold shadow-sm">OFERTA</span>
          <span v-if="p.store" class="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-white/90 text-gray-500 text-[9px] font-semibold shadow-sm max-w-[75%] truncate">{{ p.store }}</span>
        </div>

        <div class="p-3 flex flex-col flex-1">
          <span class="text-[13px] font-semibold text-gray-900 leading-snug line-clamp-2 min-h-[2.4rem]">{{ p.title }}</span>

          <!-- Product price (the real, known number). -->
          <p v-if="p.price" class="mt-1.5 text-[16px] font-extrabold text-gray-900 leading-none">
            ${{ p.price }} <span class="text-[10px] font-semibold text-gray-400">USD</span>
            <span v-if="p.was" class="ml-1 text-[10px] font-medium text-gray-300 line-through">${{ p.was }}</span>
          </p>
          <p v-if="p.price" class="text-[9px] text-gray-400 mt-0.5">precio del producto</p>

          <!-- THE BOXLY OFFER — consolidation value, NOT a fake per-item shipping
               total. Boxly buys it and adds it to ONE shared box to Mexico. -->
          <div class="mt-2 rounded-xl bg-primary-50/80 border border-primary-100 px-3 py-2.5">
            <p class="flex items-center gap-1 text-[11px] font-bold text-primary-800 leading-snug">📦 Cabe en una caja compartida Boxly</p>
            <p v-if="p.price" class="text-[10.5px] text-primary-700 mt-1 leading-snug">
              Tamaño <span class="font-semibold">{{ p.size.label }}</span> · suma solo <span class="font-semibold">~${{ p.size.low }}–{{ p.size.high }}</span> a tu envío consolidado
            </p>
            <p v-else class="text-[10.5px] text-primary-700 mt-1 leading-snug">Lo consolidamos con tus demás productos en una sola caja.</p>
            <p class="flex items-center gap-1 text-[10px] text-primary-600/80 mt-1.5">🚚 A tu puerta en México · ~{{ ARRIVAL }}</p>
          </div>

          <!-- Actions: build a SHIPMENT (not buy one product); details; keep talking. -->
          <div class="mt-auto pt-2.5 space-y-1.5">
            <button
              type="button"
              @click.stop="$emit('order', p)"
              class="w-full py-2 rounded-xl bg-primary-500 hover:bg-primary-600 active:scale-[.97] text-white text-[12.5px] font-bold shadow-sm shadow-primary-500/20 transition-all"
            >Agregar a mi envío</button>
            <div class="flex items-center justify-center gap-2.5 text-[11px] font-semibold text-gray-400">
              <button type="button" @click.stop="$emit('open', p)" class="hover:text-gray-700 transition">Ver detalles</button>
              <span class="text-gray-200">·</span>
              <button type="button" @click.stop="$emit('ask', p)" class="hover:text-primary-600 transition">Preguntar 💬</button>
            </div>
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
        class="hidden md:grid place-items-center w-9 h-9 rounded-full bg-white/95 shadow-md ring-1 ring-black/5 text-gray-600 hover:text-gray-900 hover:scale-105 active:scale-95 transition absolute left-1.5 top-1/2 -translate-y-1/2 z-10"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
      </button>
      <button
        v-show="canScroll && !atEnd"
        type="button"
        @click="scrollByPage(1)"
        aria-label="Siguiente"
        class="hidden md:grid place-items-center w-9 h-9 rounded-full bg-white/95 shadow-md ring-1 ring-black/5 text-gray-600 hover:text-gray-900 hover:scale-105 active:scale-95 transition absolute right-1.5 top-1/2 -translate-y-1/2 z-10"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
      </button>

      <!-- Faint nudging arrow: swipe-right cue (touch only) -->
      <div v-show="canScroll && !atEnd" class="md:hidden swipe-arrow pointer-events-none absolute right-1.5 top-1/2">
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
defineEmits(['open', 'order', 'ask'])

const activeStore = ref(null)

// CONSOLIDATION FRAMING — Boxly's value is buying multiple items and shipping them
// in ONE shared box, so we do NOT quote a precise per-product landed total (fake
// precision). Instead we estimate the item's SIZE and the small incremental cost
// it adds to a consolidated shipment. Rough size from the title; the real total is
// quoted on the whole box.
const ARRIVAL = '7–12 días'
const LARGE_RE = /jacket|coat|parka|boots?|comforter|blanket|duvet|luggage|suitcase|monitor|television|\btv\b|vacuum|stroller|chair|furniture|guitar|helmet|duffel|backpack|tent|sleeping bag/i
const SMALL_RE = /bottle|botella|tumbler|\bcup\b|\bmug\b|owala|stanley|hydro|perfume|cologne|fragrance|makeup|skincare|serum|lipstick|mascara|cosmetic|cards?|pok[eé]mon|wallet|watch|jewel|ring|necklace|earring|socks?|case|charger|earbuds|airpods|sunglasses|\bhat\b|\bcap\b|beanie|gloves|book|keychain/i
function sizeEstimate(p) {
  const t = (p.title || '')
  if (LARGE_RE.test(t)) return { label: 'Grande', low: 15, high: 30 }
  if (SMALL_RE.test(t)) return { label: 'Pequeño', low: 3, high: 8 }
  return { label: 'Mediano', low: 8, high: 15 }
}

// The AI already ranked the gallery best-first, so #1 IS the recommendation —
// badge it (only on the full, unfiltered list with enough options to compare).
function isBest(i) {
  return i === 0 && !activeStore.value && normalized.value.length >= 3
}

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
      size: sizeEstimate({ title }),
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

// Desktop: translate vertical wheel into horizontal scroll (a plain mouse wheel
// only emits deltaY, so the carousel would feel "stuck" otherwise). Let real
// horizontal intent (trackpad deltaX) through untouched.
function onWheel(e) {
  const el = track.value
  if (!el || sw.value - cw.value <= 4) return
  if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return // already horizontal
  const atLeft = el.scrollLeft <= 0
  const atRight = el.scrollLeft >= sw.value - cw.value - 1
  // Only hijack the wheel while there's room to scroll in that direction —
  // otherwise let the page scroll normally past the carousel.
  if ((e.deltaY < 0 && atLeft) || (e.deltaY > 0 && atRight)) return
  e.preventDefault()
  el.scrollLeft += e.deltaY
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
