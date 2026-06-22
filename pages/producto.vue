<template>
  <div class="min-h-[100dvh] bg-gray-50">
    <!-- Lively loading takeover while we pull the full product on the fly. -->
    <ProductLoader :show="loading" />

    <Transition name="pd-reveal">
    <div v-if="!loading" class="max-w-5xl mx-auto px-3 md:px-6 py-4 md:py-8">
      <button @click="goBack" class="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900 mb-4">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        Volver a resultados
      </button>

      <div class="grid md:grid-cols-2 gap-6 md:gap-10">
        <!-- Gallery -->
        <div>
          <div class="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div class="h-72 md:h-[26rem] flex items-center justify-center p-6 bg-gray-50">
              <img v-if="mainImage" :src="mainImage" :alt="data.title" referrerpolicy="no-referrer" class="max-w-full max-h-full object-contain" />
              <span v-else class="text-base font-bold text-gray-300 uppercase tracking-wide">{{ data.store || data.title }}</span>
            </div>
          </div>
          <div v-if="data.images.length > 1" class="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
            <button v-for="(img, i) in data.images" :key="i" @click="mainIdx = i" :class="['shrink-0 w-16 h-16 rounded-xl border bg-white grid place-items-center overflow-hidden transition', i === mainIdx ? 'border-primary-500 ring-1 ring-primary-200' : 'border-gray-200 hover:border-gray-300']">
              <img :src="img" referrerpolicy="no-referrer" class="w-full h-full object-contain" />
            </button>
          </div>
        </div>

        <!-- Info -->
        <div>
          <p v-if="data.store" class="text-[11px] uppercase tracking-wider text-primary-500 font-bold">{{ data.store }}</p>
          <h1 class="text-xl md:text-2xl font-bold text-gray-900 leading-snug mt-1">{{ data.title || 'Producto' }}</h1>

          <div class="flex items-baseline gap-2 mt-3">
            <span class="text-2xl font-extrabold" :class="displayOnSale ? 'text-red-600' : 'text-gray-900'">${{ displayPrice ?? '—' }}<span class="text-sm font-semibold text-gray-400"> USD</span></span>
            <span v-if="displayWas" class="text-sm font-medium text-gray-400 line-through">${{ displayWas }}</span>
            <span v-if="displayOnSale" class="px-1.5 py-0.5 rounded-md bg-red-500 text-white text-[10px] font-bold">OFERTA</span>
          </div>
          <p class="text-xs text-gray-500 mt-1">Solo el <span class="font-semibold">precio de tienda</span> — no es el total. Se suma la comisión de Boxly (10%) + envío e impuestos.</p>

          <!-- variant options -->
          <div v-for="opt in data.options" :key="opt.name" class="mt-5">
            <p class="text-[12px] font-semibold text-gray-700 mb-1.5">{{ opt.name }}<span v-if="selected[opt.name]" class="text-gray-400 font-normal"> · {{ selected[opt.name] }}</span></p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="val in opt.values"
                :key="val"
                @click="selected[opt.name] = val"
                :disabled="!valueAvailable(opt.name, val)"
                :class="['px-3 py-1.5 rounded-xl text-[13px] font-semibold border transition', selected[opt.name] === val ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400', !valueAvailable(opt.name, val) ? 'opacity-40 line-through cursor-not-allowed' : '']"
              >{{ val }}</button>
            </div>
          </div>

          <!-- No variants detected: keep it clean (this product has none). Offer
               an OPTIONAL note only if the user knows they need a specific
               size/variant we couldn't read from the store. -->
          <div v-if="!data.options.length" class="mt-5">
            <button v-if="!showManual" type="button" @click="showManual = true" class="inline-flex items-center gap-1 text-[13px] font-semibold text-primary-600 hover:text-primary-700">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              Agregar talla o variante específica
            </button>
            <div v-else>
              <label class="block text-[12px] font-semibold text-gray-700 mb-1.5">Talla / variante</label>
              <input v-model="manualSize" placeholder="p. ej. M, 9.5 US, negro" class="w-full md:w-60 border border-gray-200 rounded-xl px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-primary-500" />
              <p class="text-[11px] text-gray-400 mt-1">Boxly la confirma con la tienda al comprar.</p>
            </div>
          </div>

          <p v-if="data.has_variants && selectedUnavailable" class="mt-3 text-sm font-semibold text-red-600">Esa variante está agotada — elige otra.</p>
          <p v-else-if="!data.available" class="mt-3 text-sm font-semibold text-red-600">Agotado en la tienda ahora mismo.</p>

          <!-- qty + add -->
          <div class="flex items-center gap-3 mt-6">
            <div class="flex items-center gap-1.5 border border-gray-200 rounded-xl px-2 py-1.5">
              <button @click="qty = Math.max(1, qty - 1)" class="w-7 h-7 grid place-items-center rounded-md text-gray-600 hover:bg-gray-100">−</button>
              <span class="text-sm font-semibold w-6 text-center">{{ qty }}</span>
              <button @click="qty++" class="w-7 h-7 grid place-items-center rounded-md text-gray-600 hover:bg-gray-100">+</button>
            </div>
            <button
              @click="addToCart"
              :disabled="addDisabled"
              class="flex-1 py-3 rounded-2xl bg-primary-500 hover:bg-primary-600 active:scale-[.98] disabled:bg-gray-300 text-white text-[15px] font-bold shadow-sm shadow-primary-500/25 transition-all"
            >Agregar al pedido</button>
          </div>
          <a v-if="data.buy_url" :href="data.buy_url" target="_blank" rel="noopener noreferrer" class="mt-2 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl border border-gray-200 text-gray-600 text-[14px] font-semibold hover:bg-gray-50 transition">
            Ver en la tienda
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
          </a>

          <!-- Boxly value -->
          <div class="mt-5 rounded-2xl bg-primary-50/70 border border-primary-100 px-4 py-3">
            <p class="text-[13px] font-bold text-primary-900 mb-1.5">Boxly se encarga de todo</p>
            <ul class="space-y-1">
              <li v-for="b in benefits" :key="b" class="flex items-center gap-1.5 text-[12.5px] text-primary-800">
                <svg class="w-3.5 h-3.5 text-primary-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                {{ b }}
              </li>
            </ul>

            <!-- Pricing clarity: the shown price is NOT the final total -->
            <div class="mt-3 pt-3 border-t border-primary-100">
              <p class="text-[12.5px] font-bold text-primary-900">⚠️ Este NO es el precio final.</p>
              <p class="text-[12px] text-primary-800 mt-1 leading-snug">
                <span class="font-semibold">${{ displayPrice ?? '—' }} USD</span> es solo el precio de la tienda. Tu total es:
              </p>
              <ul class="mt-1.5 space-y-0.5 text-[12px] text-primary-800">
                <li>• Precio del producto</li>
                <li>• + Comisión de Boxly (10%)</li>
                <li>• + Envío a México e impuestos</li>
              </ul>
              <p class="text-[12px] text-primary-700 mt-1.5">Te enviamos la cotización con el total antes de que pagues — solo pagas si la apruebas.</p>
            </div>
          </div>

          <p v-if="data.description" class="text-sm text-gray-600 leading-relaxed mt-6 whitespace-pre-line">{{ data.description }}</p>
        </div>
      </div>
    </div>
    </Transition>

    <CartButton />
  </div>
</template>

<script setup>
// Auth-gated (guests are routed through login first, then back here) — so use the
// authenticated customer layout/navbar, not the public landing navbar.
definePageMeta({ layout: 'app', middleware: ['auth'] })

const { $customFetch } = useNuxtApp()
const route = useRoute()
const router = useRouter()
const cart = useCart()
const logEvent = useSearchLog()

const benefits = [
  'La compra por ti (sin tarjeta de USA)',
  'La importa a México',
  'Te la entrega en tu puerta',
]

const data = reactive({
  title: String(route.query.title || ''),
  buy_url: String(route.query.u || ''),
  store: String(route.query.store || ''),
  price: route.query.price ? Number(route.query.price) : null,
  was: route.query.was ? Number(route.query.was) : null,
  on_sale: route.query.sale === '1',
  images: route.query.img ? [String(route.query.img)] : [],
  description: '',
  options: [],
  variants: [],
  has_variants: false,
  available: true,
})
const loading = ref(true)
const mainIdx = ref(0)
const qty = ref(1)
const selected = reactive({})
const manualSize = ref('')
const showManual = ref(false)
// Effective product params — the URL query, or the guest hand-off stashed before
// login (resolved in onMounted). Used for the cache key + scrape.
const params = ref({ ...route.query })

const mainImage = computed(() => data.images[mainIdx.value] || data.images[0] || null)

const selectedVariant = computed(() => {
  if (!data.variants.length) return null
  return data.variants.find((v) => data.options.every((o) => v.options[o.name] === selected[o.name])) || null
})
const selectedUnavailable = computed(() => data.has_variants && selectedVariant.value && !selectedVariant.value.available)
const displayPrice = computed(() => selectedVariant.value?.price ?? data.price)
const displayWas = computed(() => selectedVariant.value?.was ?? data.was)
const displayOnSale = computed(() => selectedVariant.value?.on_sale ?? data.on_sale)
const addDisabled = computed(() => {
  if (loading.value) return true
  if (data.has_variants) return !selectedVariant.value || !selectedVariant.value.available
  if (!data.available) return true // store reported out of stock
  // Option lists without a live price/stock matrix (Amazon, Magento, etc.):
  // just require every option to be chosen.
  return data.options.some((o) => !selected[o.name])
})

// Grey out an option value only when we have a live matrix that says it's gone.
function valueAvailable(name, val) {
  if (!data.has_variants) return true
  return data.variants.some((v) => v.available && v.options[name] === val &&
    data.options.every((o) => o.name === name || v.options[o.name] === selected[o.name]))
}

function initSelected() {
  if (data.variants.length) {
    const first = data.variants.find((v) => v.available) || data.variants[0]
    for (const opt of data.options) selected[opt.name] = first.options[opt.name]
  } else {
    // No matrix — default each option to its first value (changeable).
    for (const opt of data.options) if (opt.values?.length) selected[opt.name] = opt.values[0]
  }
}

// Cache the scraped product in sessionStorage, keyed by its identity (URL +
// token), so a refresh / back / re-clicking the same product hydrates instantly
// without re-scraping (saves the full fetch + API credits). Only selecting a
// DIFFERENT product produces a new key → a fresh scrape.
const CACHE_FIELDS = ['title', 'buy_url', 'store', 'price', 'was', 'on_sale', 'available', 'images', 'description', 'options', 'variants', 'has_variants']
function productKey() {
  const u = params.value.u ? String(params.value.u) : ''
  const t = params.value.t ? String(params.value.t) : ''
  if (!u && !t) return null
  return 'boxly_product:' + u + '|' + t
}
function readProductCache() {
  const k = productKey()
  if (!k) return null
  try { const raw = sessionStorage.getItem(k); return raw ? JSON.parse(raw) : null } catch { return null }
}
function writeProductCache() {
  const k = productKey()
  if (!k) return
  try {
    const payload = {}
    for (const f of CACHE_FIELDS) payload[f] = data[f]
    sessionStorage.setItem(k, JSON.stringify(payload))
  } catch { /* quota/serialization — skip caching */ }
}

onMounted(async () => {
  // Resolve params: the URL, or the guest hand-off stashed before login (so the
  // long token isn't carried through the login redirect URL).
  let pp = { ...route.query }
  if (pp.pending) {
    try { const raw = sessionStorage.getItem('boxly_pending_product'); if (raw) pp = JSON.parse(raw) } catch { /* ignore */ }
    try { sessionStorage.removeItem('boxly_pending_product') } catch { /* ignore */ }
    if (pp.u || pp.t) router.replace({ path: '/producto', query: pp }) // reflect real params for refresh/cache
  }
  params.value = pp

  // No product → nothing to show; go back to search.
  if (!pp.u && !pp.t) { navigateTo('/buscar'); return }

  // Hydrate the instant fields (needed when arriving via the pending hand-off,
  // where setup had no query params yet).
  if (!data.title) data.title = String(pp.title || '')
  if (!data.buy_url) data.buy_url = String(pp.u || '')
  if (!data.store) data.store = String(pp.store || '')
  if (data.price == null && pp.price) data.price = Number(pp.price)
  if (data.was == null && pp.was) data.was = Number(pp.was)
  if (!data.on_sale && pp.sale === '1') data.on_sale = true
  if (!data.images.length && pp.img) data.images = [String(pp.img)]

  // Log the product view.
  logEvent({
    type: 'product_view',
    store: pp.store ? String(pp.store) : (data.store || undefined),
    title: pp.title ? String(pp.title) : (data.title || undefined),
    url: pp.u ? String(pp.u) : undefined,
  })

  // Cache hit (refresh / back / same product) → hydrate instantly, no re-scrape.
  const cached = readProductCache()
  if (cached) {
    for (const f of CACHE_FIELDS) if (cached[f] !== undefined) data[f] = cached[f]
    mainIdx.value = 0
    initSelected()
    loading.value = false
    return
  }

  const startedAt = Date.now()
  const MIN_MS = 1500 // let the loading animation breathe so it reads as "working"
  try {
    const r = await $customFetch('/products/page', {
      method: 'POST',
      body: { url: pp.u || undefined, token: pp.t || undefined },
      timeout: 30000, // never hang on a slow store; fall back to the card data
    })
    const d = r?.data || r || {}
    if (d.title) data.title = d.title
    if (d.price != null) data.price = d.price
    if (d.was != null) data.was = d.was
    if (d.on_sale != null) data.on_sale = d.on_sale
    if (d.available != null) data.available = d.available
    if (d.store) data.store = d.store
    if (d.buy_url) data.buy_url = d.buy_url
    if (Array.isArray(d.images) && d.images.length) { data.images = d.images; mainIdx.value = 0 }
    if (d.description) data.description = d.description
    data.options = d.options || []
    data.variants = d.variants || []
    data.has_variants = !!d.has_variants
    initSelected()
    writeProductCache() // only cache a successfully-scraped product
  } catch { /* keep the fields passed via query */ } finally {
    const elapsed = Date.now() - startedAt
    if (elapsed < MIN_MS) await new Promise((res) => setTimeout(res, MIN_MS - elapsed))
    loading.value = false
  }
})

function addToCart() {
  if (addDisabled.value) return
  const label = data.options.length
    ? data.options.map((o) => `${o.name}: ${selected[o.name]}`).join(', ')
    : (manualSize.value ? `Talla/variante: ${manualSize.value}` : '')
  cart.add({
    title: data.title,
    url: data.buy_url || String(route.query.u || ''),
    image: data.images[0] || String(route.query.img || ''),
    price: Number(displayPrice.value) || 0,
    was: displayWas.value || null,
    on_sale: !!displayOnSale.value,
    store: data.store || '',
    variant: label,
    variant_id: selectedVariant.value?.id || null,
    quantity: qty.value,
  })
  cart.openCart()
}

function goBack() {
  if (window.history.length > 1) router.back()
  else navigateTo('/buscar')
}

useHead({ title: () => (data.title ? `${data.title} — Boxly` : 'Producto — Boxly') })
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

/* Reveal the product once everything is fetched. */
.pd-reveal-enter-from { opacity: 0; transform: translateY(10px); }
.pd-reveal-enter-active { transition: opacity .4s ease, transform .4s cubic-bezier(.2,.8,.2,1); }
@media (prefers-reduced-motion: reduce) { .pd-reveal-enter-active { transition: opacity .2s ease; } .pd-reveal-enter-from { transform: none; } }
</style>
