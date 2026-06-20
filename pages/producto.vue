<template>
  <div class="min-h-[100dvh] bg-gray-50">
    <div class="max-w-5xl mx-auto px-3 md:px-6 py-4 md:py-8">
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
          <p class="text-xs text-gray-400 mt-1">Precio de tienda · Boxly suma su comisión y el envío (se cotiza después).</p>

          <!-- loading availability -->
          <div v-if="loading" class="mt-5 flex items-center gap-2 text-sm text-gray-400">
            <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
            Revisando disponibilidad y tallas…
          </div>

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

          <!-- manual size when no live variants -->
          <div v-if="!loading && !data.has_variants" class="mt-5">
            <label class="block text-[12px] font-semibold text-gray-700 mb-1.5">Talla / variante (opcional)</label>
            <input v-model="manualSize" placeholder="p. ej. M, 9.5 US, negro" class="w-full md:w-60 border border-gray-200 rounded-xl px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-primary-500" />
            <p class="text-[11px] text-gray-400 mt-1">No pudimos leer las tallas en vivo de esta tienda — dinos cuál quieres y Boxly la confirma al comprar.</p>
          </div>

          <p v-if="data.has_variants && selectedUnavailable" class="mt-3 text-sm font-semibold text-red-600">Esa variante está agotada — elige otra.</p>

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
          </div>

          <p v-if="data.description" class="text-sm text-gray-600 leading-relaxed mt-6 whitespace-pre-line">{{ data.description }}</p>
        </div>
      </div>
    </div>

    <CartButton />
  </div>
</template>

<script setup>
definePageMeta({ layout: 'default' })

const { $customFetch } = useNuxtApp()
const route = useRoute()
const router = useRouter()
const cart = useCart()

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
})
const loading = ref(true)
const mainIdx = ref(0)
const qty = ref(1)
const selected = reactive({})
const manualSize = ref('')

const mainImage = computed(() => data.images[mainIdx.value] || data.images[0] || null)

const selectedVariant = computed(() => {
  if (!data.variants.length) return null
  return data.variants.find((v) => data.options.every((o) => v.options[o.name] === selected[o.name])) || null
})
const selectedUnavailable = computed(() => data.has_variants && selectedVariant.value && !selectedVariant.value.available)
const displayPrice = computed(() => selectedVariant.value?.price ?? data.price)
const displayWas = computed(() => selectedVariant.value?.was ?? data.was)
const displayOnSale = computed(() => selectedVariant.value?.on_sale ?? data.on_sale)
const addDisabled = computed(() => loading.value || (data.has_variants && (!selectedVariant.value || !selectedVariant.value.available)))

// Is there an available variant carrying this option value (given other picks)?
function valueAvailable(name, val) {
  return data.variants.some((v) => v.available && v.options[name] === val &&
    data.options.every((o) => o.name === name || v.options[o.name] === selected[o.name]))
}

function initSelected() {
  if (!data.variants.length) return
  const first = data.variants.find((v) => v.available) || data.variants[0]
  for (const opt of data.options) selected[opt.name] = first.options[opt.name]
}

onMounted(async () => {
  try {
    const r = await $customFetch('/products/page', {
      method: 'POST',
      body: { url: route.query.u || undefined, token: route.query.t || undefined },
    })
    const d = r?.data || r || {}
    if (d.title) data.title = d.title
    if (d.price != null) data.price = d.price
    if (d.was != null) data.was = d.was
    if (d.on_sale != null) data.on_sale = d.on_sale
    if (d.store) data.store = d.store
    if (d.buy_url) data.buy_url = d.buy_url
    if (Array.isArray(d.images) && d.images.length) { data.images = d.images; mainIdx.value = 0 }
    if (d.description) data.description = d.description
    data.options = d.options || []
    data.variants = d.variants || []
    data.has_variants = !!d.has_variants
    initSelected()
  } catch { /* keep the fields passed via query */ } finally {
    loading.value = false
  }
})

function addToCart() {
  if (addDisabled.value) return
  const label = data.has_variants
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
  else navigateTo('/assistant')
}

useHead({ title: () => (data.title ? `${data.title} — Boxly` : 'Producto — Boxly') })
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
