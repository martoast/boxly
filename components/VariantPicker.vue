<template>
  <div class="rounded-2xl border border-gray-200 bg-white p-4 max-w-md shadow-sm">
    <!-- freshness. ONE statement, never two that disagree: the card used to say "Disponibilidad verificada ·
         hace un momento" and "disponibilidad por confirmar" side by side on the same read (Alex, 2026-09-11:
         "why does it say disponibilidad por confirmar when we already did the pull"). The per-size counts only
         appear when the store actually told us stock; when it did not, the read still happened and the line
         says so once. -->
    <div class="flex items-center gap-1.5 text-[11px] text-gray-500">
      <span class="inline-block w-1.5 h-1.5 rounded-full" :class="fresh ? 'bg-emerald-500' : 'bg-amber-400'"></span>
      <span>Disponibilidad {{ data.source === 'live' ? 'en vivo' : 'verificada' }}<template v-if="data.checked_at"> · {{ rel(data.checked_at) }}</template></span>
      <span v-if="!allUnknown && variants.length > 1" class="ml-auto text-gray-400 tabular-nums">{{ availableCount }} de {{ variants.length }}</span>
    </div>

    <!-- one row per axis, in the store's order -->
    <div v-for="ax in shownAxes" :key="ax.name" class="mt-3">
      <p class="text-[12px] font-semibold text-gray-700 mb-1.5">{{ axisLabel(ax) }}<span v-if="sel[ax.name]" class="font-normal text-gray-500"> · {{ sel[ax.name] }}</span></p>
      <!-- grid for sizes / lengths / widths (dense, scannable); chips for colours, scents, capacities, packs -->
      <div v-if="isGrid(ax)" class="grid gap-1.5" :class="ax.values.length > 12 ? 'grid-cols-5' : 'grid-cols-4'">
        <button
          v-for="val in ax.values" :key="val" type="button"
          @click="canPick(ax, val) && pick(ax.name, val)" :disabled="busy || !canPick(ax, val)"
          :class="[sel[ax.name] === val ? 'border-primary-500 ring-2 ring-primary-200 text-primary-800 bg-primary-50' : canPick(ax, val) ? (isUnknown(ax, val) ? 'border-dashed border-gray-300 text-gray-700 hover:border-primary-300' : 'border-gray-200 text-gray-800 hover:border-primary-300 hover:bg-primary-50') : 'border-gray-100 bg-gray-50 text-gray-300 line-through cursor-not-allowed']"
          class="relative px-1 py-1.5 rounded-lg border text-[12px] font-semibold text-center transition truncate"
          :title="canPick(ax, val) ? (isUnknown(ax, val) ? val + ' — disponibilidad por confirmar' : val) : val + ' — agotado'"
        >
          {{ val }}
          <span v-if="canPick(ax, val) && isLow(ax, val)" class="absolute -top-1 -right-1 text-[9px] font-bold text-amber-700 bg-amber-100 rounded-full px-1 leading-4">¡pocas!</span>
        </button>
      </div>
      <div v-else class="flex flex-wrap gap-1.5">
        <button
          v-for="val in ax.values" :key="val" type="button"
          @click="canPick(ax, val) && pick(ax.name, val)" :disabled="busy || !canPick(ax, val)"
          :class="[sel[ax.name] === val ? 'border-primary-500 ring-2 ring-primary-200 text-primary-800 bg-primary-50' : canPick(ax, val) ? (isUnknown(ax, val) ? 'border-dashed border-gray-300 text-gray-700 hover:border-primary-300' : 'border-gray-200 text-gray-700 hover:border-primary-300') : 'border-gray-100 text-gray-300 line-through']"
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[12px] font-medium transition"
          :title="canPick(ax, val) ? (isUnknown(ax, val) ? val + ' — disponibilidad por confirmar' : val) : val + ' — agotado'"
        >
          <!-- The STORE'S OWN swatch photo when the page had one (Alex, 2026-09-12: "it's not clear which of the
               colors is shown, and it doesn't pull any of the other images... I don't know what they look like").
               A guessed dot cannot describe "URBAN SAFARI" or "TANGLEWOOD"; the real thumbnail can. -->
          <img v-if="ax.swatches && ax.swatches[val]" :src="ax.swatches[val]" :alt="val" loading="lazy" referrerpolicy="no-referrer"
            class="w-7 h-7 -ml-1 rounded-full object-cover border border-black/10 bg-gray-50" />
          <span v-else-if="ax.kind === 'color'" class="inline-block w-3 h-3 rounded-full border border-black/10" :style="{ background: swatch(val) }"></span>
          {{ val }}
        </button>
      </div>
    </div>

    <!-- The legend earns its space only when a chip is actually struck through. And "Talla única · agotado" must
         never appear under a row of real sizes — it did, because the old condition fell through whenever stock
         was unknown (Alex's Samba screenshot: sizes 10 / 7.5 / 9.5 above the words "Talla única · agotado"). -->
    <p v-if="shownAxes.length && soldOutCount" class="mt-2 text-[11px] text-gray-400"><span class="inline-block w-2.5 h-2.5 rounded border border-gray-200 bg-white align-middle mr-1"></span>disponible <span class="inline-block w-2.5 h-2.5 rounded border border-gray-100 bg-gray-50 align-middle ml-2 mr-1"></span>agotado</p>
    <p v-else-if="!shownAxes.length" class="mt-3 text-[12px] text-gray-600">Talla única · {{ variants[0]?.available === false ? 'agotado' : variants[0]?.available === true ? 'disponible' : 'disponibilidad por confirmar' }}</p>

    <!-- CTA. No quantity control here (Alex, 2026-09-11): "let's just make it that they can tell the agent if
         they want a certain quantity, keep the modal clean and just be the variant selection". One choice, one
         button, room for a thumb. -->
    <div class="mt-4 flex items-center gap-3">
      <button type="button" @click="confirm" :disabled="busy || !complete"
        class="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary-600 text-white text-[14px] font-bold py-3 disabled:opacity-40 hover:bg-primary-700 transition">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M12 4v16m8-8H4"/></svg>
        {{ ctaLabel }}
      </button>
      <a v-if="product.url" :href="product.url" target="_blank" rel="noopener" class="shrink-0 text-[12px] font-medium text-gray-500 hover:text-primary-700 underline-offset-2 hover:underline">Ver en la tienda</a>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watchEffect } from 'vue'

// Generic N-axis variant picker. Input (from the catalog's product-page read):
//   axes:     [{ name: 'Waist', kind: 'size'|'color'|'length'|'width'|'capacity'|'scent'|'pack'|'material'|'other', values: [...] }]  (page order)
//   variants: [{ key, options: { Waist: '32', Length: '30', Color: 'Dark Wash' }, size?, color?, available, price, list_price, low_stock? }]
// Older reads without `options` still work: size/color become the axes. A product with no axes is a single SKU.
const props = defineProps({
  data: { type: Object, required: true },
  busy: { type: Boolean, default: false },
})
const emit = defineEmits(['pick', 'show-image', 'price'])

const product = computed(() => ({ title: props.data?.product?.title || props.data?.product_title || '', image: props.data?.product?.image || null, url: props.data?.product?.url || null, store: props.data?.product?.store || null, price: props.data?.product?.price ?? null, list_price: props.data?.product?.list_price ?? null }))

// Normalize every variant to { options: {axis: value} }.
const variants = computed(() => (props.data?.variants || []).map((v) => {
  const options = { ...(v.options && typeof v.options === 'object' ? v.options : {}) }
  if (!Object.keys(options).length) { if (v.color) options.Color = String(v.color); if (v.size) options.Size = String(v.size) }
  for (const k of Object.keys(options)) options[k] = String(options[k])
  return { ...v, options }
}))

// Axes: the read's own list (page order) or derived from the variants' option keys.
const axes = computed(() => {
  const declared = Array.isArray(props.data?.axes) ? props.data.axes.filter((a) => a && typeof a === 'object' && a.name) : []
  const names = declared.length ? declared.map((a) => a.name) : [...new Set(variants.value.flatMap((v) => Object.keys(v.options)))]
  return names.map((name) => {
    const d = declared.find((a) => a.name === name) || {}
    const seen = []; for (const v of variants.value) { const val = v.options[name]; if (val != null && !seen.includes(val)) seen.push(val) }
    const values = Array.isArray(d.values) && d.values.length ? d.values.map(String) : seen
    return { name, kind: d.kind || guessKind(name), values }
  })
    // Drop reader noise: values with no letters/digits ("#:"), and axes left with nothing to choose.
    .map((a) => ({ ...a, values: a.values.filter((v) => /[\p{L}\p{N}]/u.test(v)) }))
    .filter((a) => a.values.length)
})
// A single-value axis (Width: "Standard") is information, not a choice: auto-select it and don't render a row.
const shownAxes = computed(() => axes.value.filter((a) => a.values.length > 1))
watchEffect(() => { if (variants.value.length) emit('price', priceForSelection()) })
watchEffect(() => { for (const a of axes.value) if (a.values.length === 1 && !sel[a.name]) sel[a.name] = a.values[0] })
function guessKind(name) {
  const n = String(name).toLowerCase()
  if (/color|colour|shade|wash|finish/.test(n)) return 'color'
  if (/length|inseam|largo/.test(n)) return 'length'
  if (/width|ancho/.test(n)) return 'width'
  if (/oz|capacity|capacidad|ml|size.*oz/.test(n)) return 'capacity'
  if (/scent|fragrance|flavor|flavour|aroma/.test(n)) return 'scent'
  if (/pack|count|cantidad|qty/.test(n)) return 'pack'
  if (/size|talla|waist|cintura/.test(n)) return 'size'
  return 'other'
}
const isGrid = (ax) => ['size', 'length', 'width'].includes(ax.kind)
const LABELS = { size: 'Talla', color: 'Color', length: 'Largo', width: 'Ancho', capacity: 'Capacidad', scent: 'Aroma', pack: 'Paquete', material: 'Material', other: null }
function axisLabel(ax) { const l = LABELS[ax.kind]; return l && /^(size|color|colour|length|width|capacity|scent|pack|material)$/i.test(ax.name) ? l : ax.name }

const sel = reactive({})
// Some stores (SFCC: New Balance, Gap/Old Navy) expose one row PER AXIS VALUE (a colour row, a size row), not a
// colour×size matrix. Then each axis validates on its own: the read says so (`axes_independent`), or we infer it
// when no row carries values for two or more axes.
const independent = computed(() => props.data?.axes_independent === true || props.data?.matrix === false
  || (axes.value.length > 1 && !variants.value.some((v) => Object.keys(v.options).length > 1)))
// Pre-select what the page had selected (e.g. the colourway from the URL) so the shopper only picks what's missing.
watchEffect(() => { const pre = props.data?.selected; if (pre && typeof pre === 'object') for (const [k, v] of Object.entries(pre)) if (v != null && !sel[k]) sel[k] = String(v) })
const availableCount = computed(() => variants.value.filter((v) => v.available === true).length)
const unknownCount = computed(() => variants.value.filter((v) => v.available == null).length)
// The source told us nothing about stock (a feed without the field, an unreadable page): every chip stays
// pickable and our buyer confirms at purchase — see normalizeAllUnavailable() in the catalog service.
const allUnknown = computed(() => variants.value.length > 0 && variants.value.every((v) => v.available == null))
// Only a chip the store actually called sold out earns the legend — unknown stock is not sold out.
const soldOutCount = computed(() => variants.value.filter((v) => v.available === false).length)
const fresh = computed(() => { const t = props.data?.checked_at ? Date.now() - new Date(props.data.checked_at).getTime() : Infinity; return t < 15 * 60_000 })

// A value is pickable when some AVAILABLE variant matches it together with everything already selected on OTHER axes.
function matches(v, axisName, val) {
  if (v.options[axisName] !== val) return false
  if (independent.value) return true
  return axes.value.every((a) => a.name === axisName || !sel[a.name] || v.options[a.name] === sel[a.name])
}
function canPick(ax, val) { return variants.value.some((v) => v.available !== false && matches(v, ax.name, val)) }
function isUnknown(ax, val) { return !variants.value.some((v) => v.available === true && matches(v, ax.name, val)) && variants.value.some((v) => v.available == null && matches(v, ax.name, val)) }
function isLow(ax, val) { return variants.value.some((v) => v.available === true && v.low_stock && matches(v, ax.name, val)) }
function pick(axisName, val) {
  sel[axisName] = sel[axisName] === val ? null : val
  // Clear later selections that are no longer compatible.
  for (const a of axes.value) if (a.name !== axisName && sel[a.name] && !canPick(a, sel[a.name])) sel[a.name] = null
  // Picking a colour should CHANGE THE PHOTO — that is the whole point of picking it. The variant rows carry a
  // per-colour image now, so tell the modal which one to lead with.
  const ax = axes.value.find((a) => a.name === axisName)
  if (ax && ax.kind === 'color' && sel[axisName]) {
    const img = ax.swatches?.[val] || variants.value.find((v) => (v.color || v.options?.[axisName]) === val)?.image
    if (img) emit('show-image', img)
  }
  emit('price', priceForSelection())
}
// THE PRICE MUST FOLLOW THE CHOICE (Alex's Owala, 2026-09-12): the header showed $23.99 — the cheapest colour on
// the page — while the pre-selected "Water in the Desert" actually starts at $27.99. A shopper reads the big
// number, picks a colour, and is quoted something else. With a full selection this is that variant's price; with
// a partial one it is the cheapest still reachable, which is the honest "from".
function priceForSelection() {
  const matching = variants.value.filter((v) => axes.value.every((a) => !sel[a.name] || (v.options?.[a.name] ?? v[a.kind]) === sel[a.name]))
  const prices = (matching.length ? matching : variants.value).map((v) => v.price).filter((p) => typeof p === 'number')
  if (!prices.length) return null
  const lo = Math.min(...prices), hi = Math.max(...prices)
  return { price: lo, from: lo !== hi }
}
// Matrix reads: the one row matching every axis. Independent reads: the row of the LAST axis (where price/stock live).
const chosen = computed(() => {
  if (!axes.value.length) return variants.value[0] || null
  if (independent.value) { const last = axes.value[axes.value.length - 1]; return sel[last.name] ? (variants.value.find((v) => v.options[last.name] === sel[last.name]) || null) : null }
  return variants.value.find((v) => axes.value.every((a) => sel[a.name] && v.options[a.name] === sel[a.name])) || null
})
const complete = computed(() => {
  if (!axes.value.length) return !!(chosen.value && chosen.value.available !== false)
  if (independent.value) return axes.value.every((a) => sel[a.name] && variants.value.some((v) => v.available !== false && v.options[a.name] === sel[a.name]))
  return !!(chosen.value && chosen.value.available !== false)
})
// Price and photo live in the modal's header now, so the card no longer computes them.
const ctaLabel = computed(() => {
  if (!axes.value.length) return complete.value ? 'Agregar al carrito' : 'Agotado'
  const missing = axes.value.find((a) => !sel[a.name])
  if (missing) return `Elige ${axisLabel(missing).toLowerCase()}`
  return complete.value ? 'Agregar al carrito' : 'Combinación agotada'
})
function confirm() {
  if (!complete.value) return
  const parts = axes.value.map((a) => `${axisLabel(a).toLowerCase()} ${sel[a.name]}`)
  const what = product.value.title ? `los ${product.value.title}` : 'ese producto'
  // Quantity is not asked for here any more — the shopper tells the assistant if they want more than one.
  emit('pick', `Quiero ${what}${parts.length ? ' en ' + parts.join(', ') : ''} — agrégalos a mi caja`)
}
const SWATCH = { black: '#111', negro: '#111', white: '#fff', blanco: '#fff', red: '#dc2626', rojo: '#dc2626', blue: '#2563eb', azul: '#2563eb', navy: '#1e3a8a', green: '#16a34a', verde: '#16a34a', pink: '#ec4899', rosa: '#ec4899', grey: '#9ca3af', gray: '#9ca3af', gris: '#9ca3af', beige: '#d6c7a1', brown: '#92400e', café: '#92400e', yellow: '#eab308', orange: '#f97316', purple: '#7c3aed', tan: '#d2b48c', cream: '#f5f0e1', ivory: '#fffff0', olive: '#6b8e23', burgundy: '#800020', teal: '#0d9488' }
function swatch(val) { const w = String(val).toLowerCase().split(/[^a-záéíóú]+/).find((t) => SWATCH[t]); return w ? SWATCH[w] : 'linear-gradient(135deg,#e5e7eb,#9ca3af)' }
function rel(iso) {
  const ms = Date.now() - new Date(iso).getTime()
  if (!Number.isFinite(ms) || ms < 0) return 'ahora'
  const m = Math.round(ms / 60000)
  return m < 1 ? 'hace un momento' : m < 60 ? `hace ${m} min` : `hace ${Math.round(m / 60)} h`
}
</script>
