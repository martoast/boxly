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
            <!-- prev / next arrows -->
            <button
              v-if="gallery.length > 1 && imgIndex > 0"
              type="button" @click="scrollToImage(imgIndex - 1)" aria-label="Imagen anterior"
              class="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 grid place-items-center rounded-full bg-white/90 shadow-md ring-1 ring-black/5 text-gray-700 hover:bg-white hover:scale-105 active:scale-95 transition"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <button
              v-if="gallery.length > 1 && imgIndex < gallery.length - 1"
              type="button" @click="scrollToImage(imgIndex + 1)" aria-label="Imagen siguiente"
              class="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 grid place-items-center rounded-full bg-white/90 shadow-md ring-1 ring-black/5 text-gray-700 hover:bg-white hover:scale-105 active:scale-95 transition"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
            </button>

            <!-- image counter -->
            <div v-if="gallery.length > 1" class="absolute top-2.5 right-2.5 text-[11px] font-semibold text-white bg-black/45 rounded-full px-2 py-0.5 tabular-nums">{{ imgIndex + 1 }}/{{ gallery.length }}</div>

            <!-- dots (tap to jump) -->
            <div v-if="gallery.length > 1" class="absolute bottom-2.5 left-0 right-0 flex justify-center gap-1.5">
              <button v-for="(img, idx) in gallery" :key="idx" type="button" @click="scrollToImage(idx)" :aria-label="`Ir a la imagen ${idx + 1}`" class="h-1.5 rounded-full transition-all" :class="idx === imgIndex ? 'w-4 bg-gray-700' : 'w-1.5 bg-gray-300 hover:bg-gray-400'"></button>
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
              <span v-if="displayOnSale" class="px-1.5 py-0.5 rounded-md bg-red-500 text-white text-[10px] font-bold">OFERTA</span>
            </div>
            <p class="text-xs text-gray-400 mt-1">Precio de tienda. Si Boxly lo compra por ti (compra asistida), se suma 10% sobre el <span class="font-medium text-gray-500">total final de la compra al pagar</span> — producto + el envío que cobre la tienda a nuestra bodega en San Diego — no solo sobre este precio. Si tú lo compras y solo lo envías, no hay comisión. El total final se confirma en tu cotización.</p>

            <!-- THE BOXLY VALUE — value prop, not a shipping calculator. -->
            <div class="mt-3 rounded-2xl bg-primary-50/80 border border-primary-100 px-4 py-3 space-y-1.5">
              <p class="flex items-center gap-2 text-[13px] font-semibold text-primary-900">📦 Compra desde México con Boxly</p>
              <p class="flex items-center gap-2 text-[13px] font-semibold text-primary-900">🚚 Lo recibes en tu puerta</p>
            </div>

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

            <!-- ===== Two ways to get it ===== -->
            <div class="mt-6">
              <p class="text-[12px] font-bold text-gray-800 mb-2">¿Cómo lo quieres?</p>
              <div class="grid grid-cols-2 gap-3">
                <!-- Self-buy: open the original store -->
                <a
                  :href="bestLink" target="_blank" rel="noopener noreferrer"
                  @click="$emit('close')"
                  class="flex flex-col items-start gap-1 rounded-2xl border border-gray-200 hover:border-primary-300 hover:bg-gray-50 p-3.5 active:scale-[.98] transition"
                >
                  <span class="flex items-center gap-1.5 text-[14px] font-bold text-gray-900">
                    <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                    Yo lo compro
                  </span>
                  <span class="text-[11.5px] text-gray-500 leading-snug">Tú pagas en la tienda · sin comisión</span>
                  <span class="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-primary-600">
                    Ir a {{ product.store || 'la tienda' }}
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
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
                  <span class="text-[11.5px] text-primary-700/80 leading-snug">Lo compramos por ti · +10%</span>
                  <span class="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-primary-600">Crear solicitud</span>
                </button>
              </div>
              <!-- self-buy address instruction (honors the no-reveal rule: points to the panel) -->
              <p class="mt-3 text-[11.5px] text-gray-500 leading-relaxed">
                📦 Si lo compras tú, al pagar envíalo a tu <span class="font-semibold text-gray-700">dirección de bodega Boxly</span> y nosotros lo importamos a México.
                <NuxtLink to="/app/" @click="$emit('close')" class="text-primary-600 font-semibold whitespace-nowrap">Ver mi casillero →</NuxtLink>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
const props = defineProps({ product: { type: Object, default: null } })
const emit = defineEmits(['close', 'assisted'])
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
const loadingDetail = ref(false)
const broken = ref(new Set())

const gallery = computed(() => {
  const base = fetchedImages.value.length ? fetchedImages.value : (props.product?.image ? [props.product.image] : [])
  return base.filter((u) => !broken.value.has(u))
})
const description = computed(() => fetchedDesc.value || props.product?.snippet || null)
const bestLink = computed(() => fetchedLink.value || props.product?.url || '#')

const displayPrice = computed(() => fetchedPrice.value ?? props.product?.price ?? null)
const displayWas = computed(() => fetchedWas.value ?? props.product?.was ?? null)
const displayOnSale = computed(() => fetchedOnSale.value ?? props.product?.onSale ?? false)

const imgTrack = ref(null)
const imgIndex = ref(0)
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
  loadingDetail.value = false
  broken.value = new Set()
  imgIndex.value = 0
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
@media (prefers-reduced-motion: reduce) {
  .pm-enter-active, .pm-leave-active, .pm-enter-active .pm-card, .pm-leave-active .pm-card { transition: none; }
}
</style>
