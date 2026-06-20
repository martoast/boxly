<template>
  <Teleport to="body">
    <Transition name="pm">
      <div v-if="product" class="fixed inset-0 z-[1100] flex items-end md:items-center justify-center" role="dialog" aria-modal="true">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="$emit('close')" @touchmove.prevent></div>

        <div
          ref="card"
          class="pm-card relative w-full md:max-w-md bg-white rounded-t-3xl md:rounded-3xl shadow-2xl max-h-[92dvh] overflow-y-auto overscroll-contain"
          :style="dragY ? { transform: `translateY(${dragY}px)`, transition: 'none' } : null"
          @touchstart.passive="onTouchStart"
          @touchmove="onTouchMove"
          @touchend="onTouchEnd"
        >
          <!-- drag handle (mobile) + close -->
          <div class="md:hidden sticky top-0 z-10 flex justify-center pt-2.5 pb-1 bg-white/80 backdrop-blur">
            <span class="h-1.5 w-10 rounded-full bg-gray-300"></span>
          </div>
          <button @click="$emit('close')" class="absolute top-3 right-3 z-20 w-8 h-8 grid place-items-center rounded-full bg-white/90 shadow text-gray-500 hover:text-gray-800 active:scale-90 transition" aria-label="Cerrar">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>

          <!-- image carousel (swipe through fetched images) -->
          <div class="relative bg-gray-50">
            <div ref="imgTrack" @scroll.passive="onImgScroll" class="flex overflow-x-auto snap-x snap-mandatory no-scrollbar h-72">
              <div v-if="!gallery.length" class="shrink-0 w-full h-72 grid place-items-center">
                <span class="text-base font-bold text-gray-400 uppercase tracking-wide text-center px-6">{{ product.store || product.title }}</span>
              </div>
              <div v-for="(img, idx) in gallery" :key="idx" class="snap-center shrink-0 w-full h-72 flex items-center justify-center p-6">
                <img :src="img" :alt="product.title" referrerpolicy="no-referrer" class="max-h-full max-w-full object-contain" @error="onImgError(img)" />
              </div>
            </div>
            <!-- dots -->
            <div v-if="gallery.length > 1" class="absolute bottom-2.5 left-0 right-0 flex justify-center gap-1.5">
              <span v-for="(img, idx) in gallery" :key="idx" class="h-1.5 rounded-full transition-all" :class="idx === imgIndex ? 'w-4 bg-gray-700' : 'w-1.5 bg-gray-300'"></span>
            </div>
            <!-- loading more images -->
            <div v-if="loadingImages" class="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-white/85 rounded-full pl-1.5 pr-2.5 py-1 shadow-sm">
              <svg class="w-3.5 h-3.5 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
              <span class="text-[11px] text-gray-500 font-medium">Cargando fotos…</span>
            </div>
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

            <p v-if="description" class="text-sm text-gray-600 leading-relaxed mt-4 whitespace-pre-line">{{ description }}</p>

            <!-- Boxly value reinforcement -->
            <div class="mt-4 rounded-2xl bg-primary-50/70 border border-primary-100 px-4 py-3">
              <p class="text-[13px] font-bold text-primary-900 mb-1.5">Boxly se encarga de todo</p>
              <ul class="space-y-1">
                <li v-for="b in boxlyBenefits" :key="b" class="flex items-center gap-1.5 text-[12.5px] text-primary-800">
                  <svg class="w-3.5 h-3.5 text-primary-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                  {{ b }}
                </li>
              </ul>
            </div>

            <!-- CTAs -->
            <button @click="pick" class="mt-4 w-full py-3 rounded-2xl bg-primary-500 hover:bg-primary-600 active:scale-[.98] text-white text-[15px] font-bold shadow-sm shadow-primary-500/25 transition-all">
              Pedir con Boxly
            </button>
            <a :href="bestLink" target="_blank" rel="noopener noreferrer" class="mt-2 w-full flex items-center justify-center gap-1.5 py-3 rounded-2xl border border-gray-200 text-gray-700 text-[15px] font-semibold hover:bg-gray-50 active:scale-[.98] transition-all">
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
const props = defineProps({ product: { type: Object, default: null } })
const emit = defineEmits(['close', 'pick'])
const { $customFetch } = useNuxtApp()

const boxlyBenefits = [
  'La compra por ti (sin tarjeta de USA)',
  'La importa a México',
  'Te la entrega en tu puerta',
]

function formatReviews(n) {
  const v = Number(n) || 0
  return v >= 1000 ? (v / 1000).toFixed(1).replace('.0', '') + 'k' : String(v)
}

// --- Lazily fetched detail: more images, description, direct seller link ---
const fetchedImages = ref([])
const fetchedDesc = ref(null)
const fetchedLink = ref(null)
const loadingImages = ref(false)
const broken = ref(new Set())

const gallery = computed(() => {
  const base = fetchedImages.value.length ? fetchedImages.value : (props.product?.image ? [props.product.image] : [])
  return base.filter((u) => !broken.value.has(u))
})
const description = computed(() => fetchedDesc.value || props.product?.snippet || null)
const bestLink = computed(() => fetchedLink.value || props.product?.url || '#')

const imgTrack = ref(null)
const imgIndex = ref(0)
function onImgScroll() {
  const el = imgTrack.value
  if (el && el.clientWidth) imgIndex.value = Math.round(el.scrollLeft / el.clientWidth)
}
function onImgError(url) { broken.value = new Set([...broken.value, url]) }

async function loadDetails(token) {
  loadingImages.value = true
  try {
    const r = await $customFetch('/products/details', { method: 'POST', body: { token } })
    const d = r.data || {}
    if (Array.isArray(d.images) && d.images.length) fetchedImages.value = d.images
    if (d.description) fetchedDesc.value = d.description
    if (d.link) fetchedLink.value = d.link
  } catch { /* keep the single thumbnail */ } finally {
    loadingImages.value = false
  }
}

function pick() {
  // Prefer the resolved direct merchant link for the purchase request.
  emit('pick', { ...props.product, url: bestLink.value })
}

watch(() => props.product, (p) => {
  fetchedImages.value = []
  fetchedDesc.value = null
  fetchedLink.value = null
  loadingImages.value = false
  broken.value = new Set()
  imgIndex.value = 0
  if (imgTrack.value) imgTrack.value.scrollLeft = 0
  if (p?.token) loadDetails(p.token)
})

// --- Swipe down to close (only when the sheet is scrolled to the top) ---
const card = ref(null)
const dragY = ref(0)
let startY = 0
let dragging = false
function onTouchStart(e) {
  startY = e.touches[0].clientY
  dragging = false
}
function onTouchMove(e) {
  const dy = e.touches[0].clientY - startY
  if (!dragging && dy > 6 && (card.value?.scrollTop || 0) <= 0) dragging = true
  if (dragging) {
    e.preventDefault() // take over from content scroll
    dragY.value = Math.max(0, dy)
  }
}
function onTouchEnd() {
  if (dragging && dragY.value > 110) emit('close')
  dragY.value = 0
  dragging = false
}

// --- Lock background scroll while the modal is open ---
function setLock(on) {
  if (import.meta.server) return
  const el = document.documentElement
  if (on) { el.style.overflow = 'hidden'; document.body.style.overflow = 'hidden' }
  else { el.style.overflow = ''; document.body.style.overflow = '' }
}
watch(() => props.product, (p) => setLock(!!p), { immediate: true })
onBeforeUnmount(() => setLock(false))
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

.pm-enter-from, .pm-leave-to { opacity: 0; }
.pm-enter-active, .pm-leave-active { transition: opacity .25s ease; }
.pm-enter-from .pm-card, .pm-leave-to .pm-card { transform: translateY(24px); }
.pm-enter-active .pm-card, .pm-leave-active .pm-card { transition: transform .28s cubic-bezier(.2,.8,.2,1); }
@media (prefers-reduced-motion: reduce) {
  .pm-enter-active, .pm-leave-active, .pm-enter-active .pm-card, .pm-leave-active .pm-card { transition: none; }
}
</style>
