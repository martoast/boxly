<template>
  <!-- THE PICKER IS A CARD IN THE CHAT (Alex, 2026-09-29: "instead of making the variant picker a pop-up modal, make it
       directly in the chat itself … so it stays there, even if the client refreshes"). One card per product: it reads
       the store once, then stays with what it read — chips and "Agregar al carrito" exactly as the modal had them. -->
  <!-- ON DESKTOP A PRODUCT PAGE (Alex 2026-10-05: "on desktop you have a lot more space … make it like a full product
       details thing, the way they're used to it in the store"): a big photo with its gallery on the left, the details and
       options on the right. The phone keeps the compact card. -->
  <div class="rounded-2xl border border-gray-200 bg-white shadow-sm max-w-md md:max-w-none md:w-full overflow-hidden md:overflow-visible md:flex">
    <div class="hidden md:block md:w-[44%] shrink-0 bg-gray-50 border-r border-gray-100 p-3 md:rounded-l-2xl">
     <div class="md:sticky md:top-3 flex flex-col gap-2">
      <div class="aspect-square rounded-xl bg-white overflow-hidden grid place-items-center">
        <img v-if="image" :src="image" :alt="product.title || ''" referrerpolicy="no-referrer" class="w-full h-full object-contain" @error="broken = image" />
        <span v-else class="text-sm font-bold text-gray-300 uppercase">{{ product.store_name || '' }}</span>
      </div>
      <div v-if="gallery.length > 1" class="grid grid-cols-5 gap-1.5">
        <button v-for="u in gallery" :key="u" type="button" @click="leadImage = u"
          :class="[image === u ? 'ring-2 ring-primary-400 border-primary-400' : 'border-gray-200 hover:border-gray-300', 'aspect-square rounded-lg border bg-white overflow-hidden']">
          <img :src="u" alt="" referrerpolicy="no-referrer" loading="lazy" class="w-full h-full object-cover" />
        </button>
      </div>
     </div>
    </div>
    <div class="min-w-0 flex-1">
    <div class="flex gap-3 p-3 md:pt-4">
      <div class="shrink-0 w-20 h-20 rounded-xl bg-gray-50 overflow-hidden grid place-items-center md:hidden">
        <img v-if="image" :src="image" :alt="product.title || ''" referrerpolicy="no-referrer" class="w-full h-full object-cover" @error="broken = image" />
        <span v-else class="text-[10px] font-bold text-gray-300 uppercase text-center px-1">{{ product.store_name || '' }}</span>
      </div>
      <div class="min-w-0 flex-1">
        <p v-if="product.store_name" class="text-[10.5px] uppercase tracking-wider text-primary-500 font-bold">{{ product.store_name }}</p>
        <p class="text-[14px] md:text-[18px] font-bold text-gray-900 leading-snug line-clamp-2 md:line-clamp-3">{{ product.title || 'Producto' }}</p>
        <p v-if="price != null" class="mt-0.5 text-[15px] md:text-[20px] font-extrabold" :class="onSale ? 'text-red-600' : 'text-gray-900'">
          <span v-if="pickedPrice?.from" class="text-[11px] font-semibold text-gray-400 mr-0.5">desde</span>${{ usd(price) }}
          <span class="text-[11px] font-semibold text-gray-400">USD</span>
          <span v-if="onSale" class="ml-1 text-[12px] font-medium text-gray-400 line-through">${{ usd(was) }}</span>
        </p>
        <!-- A style-family link (Victoria's Secret) can open another style than the tile the shopper tapped. -->
        <p v-if="familyServed" class="mt-0.5 text-[11px] font-semibold text-amber-700 leading-snug">La tienda abrió: {{ familyServed }} — las opciones de abajo son de ese producto.</p>
        <p v-if="seller" class="mt-0.5 text-[11px]" :class="marketplace ? 'text-amber-700 font-semibold' : 'text-gray-400'">Vendido por {{ seller.name }}</p>
      </div>
    </div>

    <!-- Reading: the product is already on screen, so the wait says what we are doing, not just a spinner. -->
    <div v-if="loading" class="mx-3 mb-3 rounded-2xl border border-gray-100 bg-gray-50/70 px-4 py-3">
      <div class="flex items-center gap-2.5">
        <span class="relative flex h-2.5 w-2.5 shrink-0">
          <span class="absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75 animate-ping"></span>
          <span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary-500"></span>
        </span>
        <p class="text-[13px] font-semibold text-gray-700">Leyendo opciones en vivo…</p>
      </div>
      <p class="text-[11.5px] text-gray-500 mt-1 ml-[1.35rem] leading-snug">Colores, tallas y disponibilidad de {{ product.store_name || 'la tienda' }}, ahora mismo.</p>
    </div>

    <!-- The first read failed: say so and offer a retry — never "this product has no options". -->
    <div v-else-if="failed" class="mx-3 mb-3 flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3.5 py-2.5">
      <span class="text-[12.5px] text-amber-800 leading-snug">No pudimos leer las opciones de {{ product.store_name || 'la tienda' }} en este momento.</span>
      <button type="button" :disabled="busy" @click="$emit('refresh')" class="ml-auto shrink-0 text-[12.5px] font-bold text-amber-900 underline underline-offset-2 disabled:opacity-50">Reintentar</button>
    </div>

    <div v-else class="px-3 pb-3">
      <!-- COLOURWAYS: each colour is its own product page; picking one re-reads that page into this same card. -->
      <div v-if="colorways.length > 1" class="mb-3">
        <p class="text-[12px] font-semibold text-gray-700 mb-1.5">Color<span v-if="activeColorway" class="font-normal text-gray-500"> · {{ activeColorway.name }}</span></p>
        <div class="flex gap-2 overflow-x-auto pb-1 -mx-0.5 px-0.5">
          <button v-for="c in colorways" :key="c.url" type="button" :title="c.name" :disabled="busy" @click="c.url !== activeColorway?.url && $emit('colorway', c)"
            :class="[activeColorway?.url === c.url ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-200 hover:border-gray-300', 'shrink-0 w-[4.25rem] md:w-20 rounded-xl border overflow-hidden bg-white text-left disabled:opacity-50 transition']">
            <span class="block aspect-square bg-gray-50"><img v-if="c.image" :src="c.image" :alt="c.name" referrerpolicy="no-referrer" loading="lazy" class="w-full h-full object-cover" /></span>
            <span class="block px-1 py-1 text-[10px] font-medium text-gray-600 truncate">{{ c.name }}</span>
          </button>
        </div>
      </div>
      <div v-if="busy" class="mb-2 flex items-center gap-2 text-[12px] text-gray-500">
        <svg class="w-3.5 h-3.5 animate-spin text-primary-500" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"/><path class="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"/></svg>
        Leyendo opciones en vivo…
      </div>
      <!-- Boxly only buys what the store sells itself; a third-party marketplace seller cannot be added (Alex). -->
      <div v-if="marketplace" class="rounded-2xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[12.5px] text-amber-800 leading-snug">
        Este artículo lo vende <b>{{ seller.name }}</b>, un vendedor externo en {{ product.store_name || 'la tienda' }}. Boxly solo compra lo que vende la tienda directamente — pídeme uno parecido vendido por {{ product.store_name || 'la tienda' }}.
      </div>
      <LazyVariantPicker v-else-if="hasChoices" :key="readKey" :data="pickerData" :busy="busy" @pick="onVariantPick" @show-image="(u) => (leadImage = u)" @price="onPrice" />
      <button v-else type="button" :disabled="busy" @click="assisted()"
        class="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary-500 hover:bg-primary-600 active:scale-[.98] transition text-white font-bold py-3 text-[14px] disabled:opacity-50">
        {{ missingSize ? 'Elegir talla' : 'Agregar al carrito' }}
      </button>
      <p class="mt-2 flex flex-wrap items-center gap-x-2 text-[11px] text-gray-400">
        <span v-if="readAt">Leído {{ ago }}</span>
        <span v-if="output.refresh_failed" class="text-amber-700">· no se pudo actualizar</span>
        <button type="button" :disabled="busy" @click="$emit('refresh')" class="font-semibold text-primary-600 hover:text-primary-700 disabled:opacity-50">Actualizar disponibilidad</button>
      </p>
    </div>
    </div>
  </div>
</template>

<script setup>
// "$14.5" read as fourteen dollars five (live VS 2026-10-01): cents always show two digits; whole dollars stay whole.
const usd = (n) => { const v = Number(n); return Number.isFinite(v) ? (Number.isInteger(v) ? String(v) : v.toFixed(2)) : n }
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

// `part`: a tool-product_picker part — reading (input-available, the product only), ready (output-available:
// { product, read, read_at, read_url }) or failed (output-error). The chat does the reads; this card only shows them.
// Its pick emits the same payload the product modal did, so the chat's add-to-cart path is unchanged.
const props = defineProps({
  part: { type: Object, required: true },
  busy: { type: Boolean, default: false },
})
const emit = defineEmits(['assisted', 'refresh', 'colorway'])

const output = computed(() => (props.part?.state === 'output-available' && props.part.output) || {})
const product = computed(() => output.value.product || props.part?.input?.product || {})
const read = computed(() => output.value.read || null)
const loading = computed(() => !read.value && props.part?.state !== 'output-error')
const failed = computed(() => !read.value && props.part?.state === 'output-error')
const readAt = computed(() => output.value.read_at || null)
// A new read (refresh / colourway) remounts the picker so its selection starts clean on the new options.
const readKey = computed(() => `${output.value.read_url || ''}|${readAt.value || ''}`)

const colorways = computed(() => (Array.isArray(read.value?.colorways) ? read.value.colorways : []))
const activeColorway = computed(() => colorways.value.find((c) => c.url === output.value.read_url) || colorways.value.find((c) => c.current) || null)
// The picker reads the product's title for its sentence; the card's own title is the one the shopper tapped.
const pickerData = computed(() => ({ ...read.value, product: { ...(read.value?.product || {}), title: product.value.title || read.value?.product?.title || '', url: output.value.read_url || product.value.url } }))
// A STYLE-FAMILY LINK (reader: product.family = {served, styles}, 2026-09-30): the same Victoria's Secret URL can open
// another style than the tile tapped. Say so only when the tapped title names a DIFFERENT style of that family.
const familyMismatch = computed(() => {
  const f = read.value?.product?.family
  if (!f?.served || !Array.isArray(f.styles)) return null
  const n = (x) => String(x || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
  const styleOf = (t) => f.styles.filter((st) => n(st) && t.startsWith(n(st))).sort((a, b) => b.length - a.length)[0] || null
  const tapped = styleOf(n(product.value.title)), served = styleOf(n(f.served))
  if (!tapped || !served || tapped === served) return null
  const pinned = f.urls && typeof f.urls[tapped] === 'string' ? f.urls[tapped] : null
  return { served: f.served, tapped, pinned }
})
const familyServed = computed(() => familyMismatch.value?.served || read.value?.style_mismatch?.served_title || null)
// …and when the store's own pinned link for the tapped style is known (?choice=…&genericId=…), read THAT style into
// this card instead — once per card, so a store that still serves another style can never loop.
let repinned = false
watch(familyMismatch, (m) => {
  if (!m?.pinned || repinned || props.busy || output.value.read_url === m.pinned) return
  repinned = true
  emit('colorway', { name: m.tapped, url: m.pinned })
}, { immediate: true })
// Who sells it (the reader's product.seller): a marketplace seller (is_store false) is shown and never added.
const seller = computed(() => (read.value?.product?.seller?.name ? read.value.product.seller : null))
const marketplace = computed(() => seller.value?.is_store === false)
const hasChoices = computed(() => colorways.value.length > 1 || (read.value?.axes || []).some((a) => (a?.values?.length || 0) > 1)
  // Older reads carry no axes list; the picker derives them from the variants.
  || (!(read.value?.axes || []).length && (read.value?.variants || []).length > 1))

const leadImage = ref(null)
const broken = ref(null)
const pickedPrice = ref(null)
// PRICE ON PICK (2026-10-05): an option the page left unpriced (Ulta sizes) is asked of the store once, by its sku; until the
// answer comes — or when the store gives none — the price stays unknown, never another option's.
function onPrice(p) {
  pickedPrice.value = p && (typeof p.price === 'number' || p.unknown) ? p : null
  if (!p?.unknown || !p.sku) return
  const sku = p.sku
  $fetch('/api/variant-price', { method: 'POST', body: { url: pickerData.value.product.url, sku } })
    .then((r) => { if (pickedPrice.value?.sku === sku && typeof r?.price === 'number') pickedPrice.value = { price: r.price, sku } })
    .catch(() => {})
}
watch(readKey, () => { leadImage.value = null; pickedPrice.value = null })
// The desktop gallery: the page's own photos (up to 5), the one on screen first.
const gallery = computed(() => {
  const own = (read.value?.product?.images || []).filter((u) => typeof u === 'string' && u && u !== broken.value)
  const list = image.value && !own.includes(image.value) ? [image.value, ...own] : own // a stable order: a tap never reshuffles it
  return [...new Set(list)].slice(0, 5)
})
const image = computed(() => [leadImage.value, product.value.image, read.value?.product?.image, read.value?.product?.images?.[0]].find((u) => typeof u === 'string' && u && u !== broken.value) || null)
// A selection the page never priced (another size than the one its pack prices were stated for) shows no price, not a guess.
const price = computed(() => (pickedPrice.value?.unknown ? null : pickedPrice.value?.price ?? read.value?.product?.price ?? product.value.price ?? null))
const was = computed(() => product.value.was ?? read.value?.product?.list_price ?? null)
const onSale = computed(() => !!(was.value && price.value && was.value > price.value))

// "leído hace X", kept current while the card is on screen.
const now = ref(Date.now())
let tick = null
onMounted(() => { tick = setInterval(() => { now.value = Date.now() }, 60_000) })
onBeforeUnmount(() => clearInterval(tick))
const ago = computed(() => {
  const m = Math.round((now.value - new Date(readAt.value).getTime()) / 60000)
  if (!Number.isFinite(m) || m < 1) return 'hace un momento'
  return m < 60 ? `hace ${m} min` : m < 48 * 60 ? `hace ${Math.round(m / 60)} h` : `hace ${Math.round(m / 1440)} días`
})

// A SIZED PRODUCT MUST NOT LEAVE WITHOUT A SIZE (same guard as the product modal): when the reader found no size
// on something obviously sized, the button hands the shopper to the assistant to settle it.
const missingSize = computed(() => sizeMissing(product.value.title, (read.value?.axes || []).map((a) => a?.name).filter(Boolean)))
function askForSize(chosenText) {
  const what = product.value.title ? `los ${product.value.title}` : 'ese producto'
  const base = chosenText ? chosenText.replace(/\s*—\s*agr[eé]galos a mi caja\s*$/i, '') : `Quiero ${what}`
  return `${base} — ¿qué tallas tienen disponibles? Dime las opciones y te digo cuál quiero.`
}
// THE CART OPENS THE PAGE OF WHAT WAS PICKED (live VS 2026-10-01: a family page holds 9 styles; the card's link is the
// family's, so "Black" could reach the cart as another style's Black). The picked colour's own row link (the reader pins
// each colour to its style), else the page the card read (its pinned style), else the colourway, else the card's link.
function pickedUrl(variants = {}) {
  const colour = variants.color
  if (!colour) return null
  const rows = Array.isArray(read.value?.variants) ? read.value.variants : []
  const row = rows.find((v) => typeof v?.url === 'string' && v.url && (v.color === colour || Object.values(v.options || {}).includes(colour)))
  return row?.url || null
}
function assisted(pick) {
  if (missingSize.value) pick = { text: askForSize(pick?.text), variants: pick?.variants || {}, size_owed: true }
  const p = product.value
  emit('assisted', {
    title: p.title, url: pickedUrl(pick?.variants) || output.value.read_url || activeColorway.value?.url || p.url, card_url: p.url || null, image: image.value, store: p.store_name, store_id: p.store_id,
    price: price.value, was: was.value, onSale: onSale.value,
    ...(pick ? { pick } : {}),
  })
}
// The colourway the shopper is on is part of the choice (the picker only knows this page's own axes).
function onVariantPick(text, variants = {}) {
  // The store's OWN name for this page's colour first (reader own_color, a page with no colour choice — live Gymshark
  // 2026-10-03: the link's "black" vs the store's "Black/Asphalt Grey" failed the whole store's checkout), else the colourway's
  const c = read.value?.own_color || activeColorway.value?.name
  const withColour = c && !new RegExp(`color\\s+${c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i').test(text)
    ? text.replace(/ — agrégalos a mi caja$/, `, color ${c} — agrégalos a mi caja`)
    : text
  const picked = { ...variants }
  if (c && !picked.color) picked.color = c
  assisted({ text: withColour, variants: picked })
}
</script>
