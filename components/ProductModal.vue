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

          <!-- image bento (multiple images at a glance; tap any to open the slideshow) -->
          <div class="relative bg-gray-50">
            <!-- no images yet → store/title placeholder -->
            <div v-if="!gallery.length" class="w-full h-80 grid place-items-center">
              <span class="text-base font-bold text-gray-400 uppercase tracking-wide text-center px-6">{{ product.store || product.title }}</span>
            </div>
            <!-- bento grid: hero + up to two tiles -->
            <div v-else class="grid grid-cols-3 grid-rows-2 gap-1 h-80">
              <button
                v-for="(img, idx) in bentoImgs" :key="idx" type="button"
                @click="openLightbox(idx)"
                :class="['group relative overflow-hidden bg-white', bentoClass(idx)]"
                :aria-label="`Ver imagen ${idx + 1}`"
              >
                <img :src="img" :alt="product.title" referrerpolicy="no-referrer" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" @error="onImgError(img)" />
                <!-- "+N" overlay on the last tile when there are more images -->
                <span v-if="idx === bentoImgs.length - 1 && extraCount > 0" class="absolute inset-0 grid place-items-center bg-black/50 text-white">
                  <span class="text-lg font-extrabold">+{{ extraCount }}</span>
                </span>
                <!-- subtle expand hint on the hero -->
                <span v-else-if="idx === 0" class="absolute bottom-2 right-2 w-7 h-7 grid place-items-center rounded-full bg-white/85 shadow text-gray-700 opacity-0 group-hover:opacity-100 transition">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>
                </span>
              </button>
            </div>
            <!-- loading detail -->
            <div v-if="loadingDetail" class="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-white/85 rounded-full pl-1.5 pr-2.5 py-1 shadow-sm">
              <svg class="w-3.5 h-3.5 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
              <span class="text-[11px] text-gray-500 font-medium">Cargando detalles…</span>
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

            <div v-if="displayPrice != null" class="flex items-baseline gap-2 mt-3">
              <span class="text-2xl font-extrabold" :class="displayOnSale ? 'text-red-600' : 'text-gray-900'">${{ displayPrice }}<span class="text-sm font-semibold text-gray-400"> USD</span></span>
              <span v-if="displayWas" class="text-sm font-medium text-gray-400 line-through">${{ displayWas }}</span>
              <span v-if="displayDiscount" class="px-1.5 py-0.5 rounded-md bg-red-500 text-white text-[10px] font-extrabold">-{{ displayDiscount }}%</span>
              <span v-else-if="displayOnSale" class="px-1.5 py-0.5 rounded-md bg-red-500 text-white text-[10px] font-bold">OFERTA</span>
              <span v-if="!available" class="px-1.5 py-0.5 rounded-md bg-gray-700 text-white text-[10px] font-bold">AGOTADO</span>
            </div>

            <!-- ===== Two ways to get it ===== -->
            <div class="mt-6">
              <!-- Out of stock at the store (live check) — don't send the user to a dead page. -->
              <div v-if="!available" class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5">
                <p class="text-[13px] font-bold text-amber-900">Agotado en la tienda</p>
                <p class="text-[12px] text-amber-800/90 mt-0.5 leading-snug">Este producto no está disponible ahora mismo. Cierra y te ayudo a encontrar una opción similar.</p>
              </div>

              <template v-else>
              <p class="text-[12px] font-bold text-gray-800 mb-2">¿Cómo lo quieres?</p>
              <div class="grid grid-cols-2 gap-3">
                <!-- Self-buy: open the original store (gated until the real link resolves) -->
                <a
                  :href="linkPending ? undefined : bestLink"
                  :target="linkPending ? undefined : '_blank'"
                  rel="noopener noreferrer"
                  @click="linkPending ? $event.preventDefault() : $emit('close')"
                  :class="['flex flex-col items-start gap-1 rounded-2xl border border-gray-200 p-3.5 transition', linkPending ? 'opacity-60 cursor-wait' : 'hover:border-primary-300 hover:bg-gray-50 active:scale-[.98]']"
                >
                  <span class="flex items-center gap-1.5 text-[14px] font-bold text-gray-900">
                    <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                    Yo lo compro
                  </span>
                  <span class="text-[11.5px] text-gray-500 leading-snug">Tú lo compras en la tienda original</span>
                  <span class="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-primary-600">
                    <template v-if="linkPending">
                      <svg class="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
                      Cargando enlace…
                    </template>
                    <template v-else>
                      Ir a {{ product.store || 'la tienda' }}
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                    </template>
                  </span>
                </a>
                <!-- Assisted: Boxly buys it (Purchase Request) -->
                <button
                  type="button" @click="assisted"
                  class="flex flex-col items-start gap-1 rounded-2xl border-2 border-primary-500 bg-primary-50/60 hover:bg-primary-50 p-3.5 active:scale-[.98] transition text-left"
                >
                  <span class="flex items-center gap-1.5 text-[14px] font-bold text-primary-800">
                    <svg class="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                    Boxly lo compra
                  </span>
                  <span class="text-[11.5px] text-primary-700/80 leading-snug">Precio total al checkout + 10%</span>
                  <span class="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-primary-600">Crear solicitud</span>
                </button>
              </div>
              <!-- self-buy address instruction (honors the no-reveal rule: points to the panel) -->
              <p class="mt-3 text-[11.5px] text-gray-500 leading-relaxed">
                📦 Si lo compras tú, al pagar envíalo a tu <span class="font-semibold text-gray-700">dirección de bodega Boxly</span> y nosotros lo importamos a México.
                <NuxtLink to="/app/" @click="$emit('close')" class="text-primary-600 font-semibold whitespace-nowrap">Ver mi casillero →</NuxtLink>
              </p>
              </template>
            </div>
          </div>
        </div>

        <!-- ===== Fullscreen image slideshow (opens from the bento) ===== -->
        <Transition name="lb">
          <div v-if="lightboxOpen" class="fixed inset-0 z-[1200] bg-black/95 flex flex-col" @click.self="closeLightbox">
            <button @click="closeLightbox" class="absolute top-4 right-4 z-10 w-10 h-10 grid place-items-center rounded-full bg-white/15 hover:bg-white/25 text-white active:scale-90 transition" aria-label="Cerrar">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
            <div v-if="gallery.length > 1" class="absolute top-5 left-1/2 -translate-x-1/2 z-10 text-[12px] font-semibold text-white/90 bg-white/10 rounded-full px-2.5 py-0.5 tabular-nums">{{ imgIndex + 1 }}/{{ gallery.length }}</div>

            <div ref="imgTrack" @scroll.passive="onImgScroll" class="flex-1 flex overflow-x-auto snap-x snap-mandatory no-scrollbar">
              <div v-for="(img, idx) in gallery" :key="idx" class="snap-center shrink-0 w-full h-full flex items-center justify-center p-6">
                <img :src="img" :alt="product.title" referrerpolicy="no-referrer" class="max-h-full max-w-full object-contain" @error="onImgError(img)" />
              </div>
            </div>

            <button
              v-if="gallery.length > 1 && imgIndex > 0"
              type="button" @click="scrollToImage(imgIndex - 1)" aria-label="Imagen anterior"
              class="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 grid place-items-center rounded-full bg-white/15 hover:bg-white/25 text-white active:scale-90 transition"
            >
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <button
              v-if="gallery.length > 1 && imgIndex < gallery.length - 1"
              type="button" @click="scrollToImage(imgIndex + 1)" aria-label="Imagen siguiente"
              class="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 grid place-items-center rounded-full bg-white/15 hover:bg-white/25 text-white active:scale-90 transition"
            >
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
            </button>

            <div v-if="gallery.length > 1" class="shrink-0 flex justify-center gap-1.5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
              <button v-for="(img, idx) in gallery" :key="idx" type="button" @click="scrollToImage(idx)" :aria-label="`Ir a la imagen ${idx + 1}`" class="h-1.5 rounded-full transition-all" :class="idx === imgIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'"></button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
const props = defineProps({ product: { type: Object, default: null } })
const emit = defineEmits(['close', 'assisted'])
const { $customFetch } = useNuxtApp()

function formatReviews(n) {
  const v = Number(n) || 0
  return v >= 1000 ? (v / 1000).toFixed(1).replace('.0', '') + 'k' : String(v)
}


// --- Lazily fetched product detail: extra images, description, and the REAL
//     merchant link (resolves a Google view link → the actual store) via
//     /products/page. No variant/size scraping — the customer picks options on
//     the store's own page (or Boxly handles it on an assisted purchase).
const fetchedImages = ref([])
const fetchedDesc = ref(null)
const fetchedLink = ref(null)
const fetchedPrice = ref(null)
const fetchedWas = ref(null)
const fetchedOnSale = ref(false)
const available = ref(true) // live stock from the store (Shopify .js); true = unknown/in-stock
const loadingDetail = ref(false)
const broken = ref(new Set())

const gallery = computed(() => {
  const base = fetchedImages.value.length ? fetchedImages.value : (props.product?.image ? [props.product.image] : [])
  return base.filter((u) => !broken.value.has(u))
})
// Bento: show up to 3 tiles (hero + 2); a "+N" overlay hints at the rest.
const bentoImgs = computed(() => gallery.value.slice(0, 3))
const extraCount = computed(() => Math.max(0, gallery.value.length - 3))
function bentoClass(idx) {
  const n = Math.min(gallery.value.length, 3)
  if (n === 1) return 'col-span-3 row-span-2'
  if (n === 2) return idx === 0 ? 'col-span-2 row-span-2' : 'col-span-1 row-span-2'
  return idx === 0 ? 'col-span-2 row-span-2' : 'col-span-1 row-span-1'
}
const bestLink = computed(() => fetchedLink.value || props.product?.url || '#')

// Search-result products carry a GOOGLE SHOPPING link as their url; the real
// merchant link only arrives after the detail fetch resolves it. Don't let the
// "Yo lo compro" button fire until we have a real store link (otherwise an early
// click opens a Google page / the wrong product).
function isGoogleLink(u) { return typeof u === 'string' && (u.includes('google.com') || u.includes('gstatic.com')) }
const linkPending = computed(() => loadingDetail.value && isGoogleLink(bestLink.value))

const displayPrice = computed(() => fetchedPrice.value ?? props.product?.price ?? null)
const displayWas = computed(() => fetchedWas.value ?? props.product?.was ?? null)
const displayOnSale = computed(() => fetchedOnSale.value ?? props.product?.onSale ?? false)
const displayDiscount = computed(() => {
  const w = displayWas.value, p = displayPrice.value
  return displayOnSale.value && w && p && w > p ? Math.round(((w - p) / w) * 100) : null
})

const imgTrack = ref(null)
const imgIndex = ref(0)
const lightboxOpen = ref(false)
function onImgScroll() {
  const el = imgTrack.value
  if (el && el.clientWidth) imgIndex.value = Math.round(el.scrollLeft / el.clientWidth)
}
function onImgError(url) { broken.value = new Set([...broken.value, url]) }
function scrollToImage(idx) {
  const el = imgTrack.value
  if (!el) return
  const i = Math.max(0, Math.min(idx, gallery.value.length - 1))
  el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
  imgIndex.value = i // optimistic; onImgScroll will confirm
}
async function openLightbox(idx) {
  lightboxOpen.value = true
  imgIndex.value = idx
  await nextTick()
  const el = imgTrack.value // the track only exists once the lightbox renders
  if (el) el.scrollLeft = idx * el.clientWidth
}
function closeLightbox() { lightboxOpen.value = false }

async function loadDetails(p) {
  loadingDetail.value = true
  try {
    // Bound the wait: some stores (Cloudflare-protected SPAs like Sephora / Victoria's
    // Secret) can't be scraped and the backend cascade takes a while before giving up.
    // Cap it so the spinner never hangs — we degrade to the search-card image/price.
    const r = await $customFetch('/products/page', { method: 'POST', timeout: 15000, body: { url: p?.url || null, token: p?.token || null, store: p?.store || null, title: p?.title || null } })
    const d = r.data || {}
    if (Array.isArray(d.images) && d.images.length) fetchedImages.value = d.images
    if (d.description) fetchedDesc.value = d.description
    if (d.buy_url) fetchedLink.value = d.buy_url
    if (d.price != null) fetchedPrice.value = d.price
    if (d.was != null) fetchedWas.value = d.was
    if (typeof d.on_sale === 'boolean') fetchedOnSale.value = d.on_sale
    if (typeof d.available === 'boolean') available.value = d.available
  } catch { /* keep the single thumbnail */ } finally {
    loadingDetail.value = false
  }
}

// "Boxly lo compra" — hand the product to the chat so the assistant creates a
// Purchase Request (assisted purchase, +10%). Pass the resolved merchant link.
function assisted() {
  emit('assisted', {
    ...props.product,
    url: bestLink.value,
    price: displayPrice.value,
    was: displayWas.value,
    onSale: displayOnSale.value,
  })
}

watch(() => props.product, (p) => {
  fetchedImages.value = []
  fetchedDesc.value = null
  fetchedLink.value = null
  fetchedPrice.value = null
  fetchedWas.value = null
  fetchedOnSale.value = false
  available.value = true
  loadingDetail.value = false
  broken.value = new Set()
  imgIndex.value = 0
  lightboxOpen.value = false
  if (imgTrack.value) imgTrack.value.scrollLeft = 0
  if (p?.url || p?.token) loadDetails(p)
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

.lb-enter-from, .lb-leave-to { opacity: 0; }
.lb-enter-active, .lb-leave-active { transition: opacity .2s ease; }
@media (prefers-reduced-motion: reduce) {
  .pm-enter-active, .pm-leave-active, .pm-enter-active .pm-card, .pm-leave-active .pm-card { transition: none; }
}
</style>
