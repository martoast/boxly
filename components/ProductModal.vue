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

          <!-- Loading: fetch the high-res PDP images, the details AND the variants FIRST, then reveal it all at
               once — no flash of the low-res gallery thumbnail, and no button before the sizes exist. The gallery
               image is only the intro; the product page carries the real photography (Alex, 2026-09-11). Bounded
               by REVEAL_CAP_MS so a slow store can never hold the modal hostage. -->
          <div v-if="loadingProduct">
            <div class="h-80 bg-gray-100 animate-pulse"></div>
            <div class="p-5 space-y-3">
              <div class="h-3 w-20 bg-gray-100 rounded animate-pulse"></div>
              <div class="h-5 w-3/4 bg-gray-100 rounded animate-pulse"></div>
              <div class="h-7 w-28 bg-gray-100 rounded animate-pulse"></div>
              <div class="grid grid-cols-2 gap-3 pt-3">
                <div class="h-[4.5rem] bg-gray-100 rounded-2xl animate-pulse"></div>
                <div class="h-[4.5rem] bg-gray-100 rounded-2xl animate-pulse"></div>
              </div>
              <div class="flex items-center justify-center gap-2 pt-2 text-gray-400">
                <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
                <span class="text-xs font-medium">Cargando producto…</span>
              </div>
            </div>
          </div>

          <!-- image bento (multiple images at a glance; tap any to open the slideshow) -->
          <template v-else>
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
              <!-- ONE action: add to the Boxly cart. Boxly buys + imports everything the
                   customer adds (across stores) in a single consolidated purchase request.
                   No self-buy option — the whole point of the catalog is to build the cart. -->
              <!-- A product with real choices becomes a PRODUCT PAGE right here: sizes, colours and quantity, then
                   one add-to-cart. Only a product with nothing to choose (or an unreadable one) keeps the plain
                   button below — our reader must never block a purchase. -->
              <div v-if="loadingVariants" class="flex items-center justify-center gap-2 rounded-2xl border border-gray-100 bg-gray-50/60 py-4 text-[13px] text-gray-500">
                <svg class="w-4 h-4 animate-spin text-primary-500" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"/><path class="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"/></svg>
                Cargando tallas y colores…
              </div>
              <LazyVariantPicker v-else-if="hasChoices" :data="variantData" @pick="onVariantPick" />
              <button
                v-else
                type="button" @click="assisted()"
                class="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary-500 hover:bg-primary-600 active:scale-[.98] transition text-white font-bold py-3.5 text-[15px] shadow-sm shadow-primary-500/20"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 3h11m-8 3a1 1 0 11-2 0 1 1 0 012 0zm9 0a1 1 0 11-2 0 1 1 0 012 0z"/></svg>
                Elegir talla y cantidad
              </button>
              <p class="mt-2.5 text-[11.5px] text-gray-500 text-center leading-relaxed">
Primero eliges talla, color y cantidad — ahí lo agregas a tu carrito. Suma lo que quieras, de cualquier tienda 🛒, y Boxly lo compra e importa todo junto a México. 🇺🇸➜🇲🇽
              </p>
              </template>
            </div>
          </div>
          </template>
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
// THE MODAL IS THE PRODUCT PAGE (Alex, 2026-09-11): sizes/colours/quantity are chosen HERE, then added to the cart
// in one step — the same shape as any store's product page, instead of a round trip through chat.
const variantData = ref(null)
const loadingVariants = ref(false)
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
// "Real choices" = an axis the shopper must actually answer. A single-SKU product (or one whose axes all have one
// value) shows the plain add button instead of a picker with nothing to pick.
// Both fetches gate the reveal, but never past REVEAL_CAP_MS: after that we show whatever arrived (the picker
// fills in behind its own small loader) rather than leave the shopper staring at a skeleton.
const REVEAL_CAP_MS = 9000
const revealForced = ref(false)
const loadingProduct = computed(() => !revealForced.value && (loadingDetail.value || loadingVariants.value))
const hasChoices = computed(() => {
  const ax = variantData.value?.axes || []
  return ax.some((a) => (a?.values?.length || 0) > 1)
})

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

// Variants for this product, straight from the catalog service (mirror when fresh, a live read otherwise).
// Independent of loadDetails so slow images never hold up the picker, and vice versa.
async function loadVariants(p) {
  const url = p?.url || null
  if (!url) return
  loadingVariants.value = true
  try {
    const r = await $fetch('/api/product-variants', { method: 'POST', body: { url }, timeout: 58000 })
    variantData.value = (r?.variants?.length ? r : null)
  } catch { variantData.value = null } finally { loadingVariants.value = false }
}

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
// Purchase Request (assisted purchase, +15%). Pass the resolved merchant link.
function assisted(pick) {
  emit('assisted', {
    ...props.product,
    url: bestLink.value,
    price: displayPrice.value,
    was: displayWas.value,
    onSale: displayOnSale.value,
    ...(pick ? { pick } : {}),
  })
}
// The picker's own CTA is the add-to-cart for a product that HAS choices: it hands up the exact sentence
// (size, colour, quantity) so the chat adds it in one turn with everything already decided.
function onVariantPick(text) { assisted({ text }) }

let revealTimer = null
watch(() => props.product, (p) => {
  variantData.value = null
  loadingVariants.value = false
  revealForced.value = false
  if (revealTimer) clearTimeout(revealTimer)
  if (p) { revealTimer = setTimeout(() => { revealForced.value = true }, REVEAL_CAP_MS); loadVariants(p) }
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
