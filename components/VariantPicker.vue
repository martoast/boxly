<template>
  <div class="rounded-2xl border border-gray-200 bg-white p-4 max-w-md shadow-sm">
    <!-- product header -->
    <div class="flex gap-3">
      <div class="shrink-0 w-20 h-20 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden grid place-items-center">
        <img v-if="product.image" :src="product.image" :alt="product.title" class="w-full h-full object-contain" loading="lazy" referrerpolicy="no-referrer" />
        <svg v-else class="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
      </div>
      <div class="min-w-0 flex-1">
        <p v-if="product.store" class="text-[11px] font-semibold uppercase tracking-wide text-gray-400 truncate">{{ product.store }}</p>
        <p class="text-[14px] font-bold text-gray-900 leading-snug line-clamp-2">{{ product.title || 'Producto' }}</p>
        <p class="mt-1 text-[15px] font-extrabold text-gray-900 tabular-nums">
          <span v-if="shownPrice != null">${{ shownPrice }} <span class="text-[11px] font-medium text-gray-400">USD</span></span>
          <span v-if="shownWas != null && shownWas > (shownPrice ?? 0)" class="ml-1.5 text-[12px] font-medium text-gray-400 line-through">${{ shownWas }}</span>
          <span v-if="priceRange" class="text-[12px] font-medium text-gray-500">{{ priceRange }}</span>
        </p>
      </div>
    </div>

    <!-- freshness -->
    <div class="mt-3 flex items-center gap-1.5 text-[11px] text-gray-500">
      <span class="inline-block w-1.5 h-1.5 rounded-full" :class="fresh ? 'bg-emerald-500' : 'bg-amber-400'"></span>
      <span>Disponibilidad {{ data.source === 'live' ? 'en vivo' : 'verificada' }}<template v-if="data.checked_at"> · {{ rel(data.checked_at) }}</template></span>
      <span class="ml-auto text-gray-400">{{ availableCount }} de {{ variants.length }} disponibles</span>
    </div>

    <!-- one row per axis, in the store's order -->
    <div v-for="ax in axes" :key="ax.name" class="mt-3">
      <p class="text-[12px] font-semibold text-gray-700 mb-1.5">{{ axisLabel(ax) }}<span v-if="sel[ax.name]" class="font-normal text-gray-500"> · {{ sel[ax.name] }}</span></p>
      <!-- grid for sizes / lengths / widths (dense, scannable); chips for colours, scents, capacities, packs -->
      <div v-if="isGrid(ax)" class="grid gap-1.5" :class="ax.values.length > 12 ? 'grid-cols-5' : 'grid-cols-4'">
        <button
          v-for="val in ax.values" :key="val" type="button"
          @click="canPick(ax, val) && pick(ax.name, val)" :disabled="busy || !canPick(ax, val)"
          :class="[sel[ax.name] === val ? 'border-primary-500 ring-2 ring-primary-200 text-primary-800 bg-primary-50' : canPick(ax, val) ? 'border-gray-200 text-gray-800 hover:border-primary-300 hover:bg-primary-50' : 'border-gray-100 bg-gray-50 text-gray-300 line-through cursor-not-allowed']"
          class="relative px-1 py-1.5 rounded-lg border text-[12px] font-semibold text-center transition truncate"
          :title="canPick(ax, val) ? val : val + ' — agotado'"
        >
          {{ val }}
          <span v-if="canPick(ax, val) && isLow(ax, val)" class="absolute -top-1 -right-1 text-[9px] font-bold text-amber-700 bg-amber-100 rounded-full px-1 leading-4">¡pocas!</span>
        </button>
      </div>
      <div v-else class="flex flex-wrap gap-1.5">
        <button
          v-for="val in ax.values" :key="val" type="button"
          @click="canPick(ax, val) && pick(ax.name, val)" :disabled="busy || !canPick(ax, val)"
          :class="[sel[ax.name] === val ? 'border-primary-500 ring-2 ring-primary-200 text-primary-800 bg-primary-50' : canPick(ax, val) ? 'border-gray-200 text-gray-700 hover:border-primary-300' : 'border-gray-100 text-gray-300 line-through']"
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[12px] font-medium transition"
          :title="canPick(ax, val) ? val : val + ' — agotado'"
        >
          <span v-if="ax.kind === 'color'" class="inline-block w-3 h-3 rounded-full border border-black/10" :style="{ background: swatch(val) }"></span>
          {{ val }}
        </button>
      </div>
    </div>

    <p v-if="axes.length" class="mt-2 text-[11px] text-gray-400"><span class="inline-block w-2.5 h-2.5 rounded border border-gray-200 bg-white align-middle mr-1"></span>disponible <span class="inline-block w-2.5 h-2.5 rounded border border-gray-100 bg-gray-50 align-middle ml-2 mr-1"></span>agotado</p>
    <p v-else class="mt-3 text-[12px] text-gray-600">Talla única · {{ variants[0]?.available ? 'disponible' : 'agotado' }}</p>

    <!-- CTA -->
    <div class="mt-3 flex items-center gap-2">
      <button type="button" @click="confirm" :disabled="busy || !complete"
        class="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary-600 text-white text-[13px] font-bold py-2.5 disabled:opacity-40 hover:bg-primary-700 transition">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M12 4v16m8-8H4"/></svg>
        {{ ctaLabel }}
      </button>
      <a v-if="product.url" :href="product.url" target="_blank" rel="noopener" class="shrink-0 text-[12px] font-medium text-gray-500 hover:text-primary-700 underline-offset-2 hover:underline">Ver en la tienda</a>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive } from 'vue'

// Generic N-axis variant picker. Input (from the catalog's product-page read):
//   axes:     [{ name: 'Waist', kind: 'size'|'color'|'length'|'width'|'capacity'|'scent'|'pack'|'material'|'other', values: [...] }]  (page order)
//   variants: [{ key, options: { Waist: '32', Length: '30', Color: 'Dark Wash' }, size?, color?, available, price, list_price, low_stock? }]
// Older reads without `options` still work: size/color become the axes. A product with no axes is a single SKU.
const props = defineProps({
  data: { type: Object, required: true },
  busy: { type: Boolean, default: false },
})
const emit = defineEmits(['pick'])

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
  }).filter((a) => a.values.length)
})
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
const availableCount = computed(() => variants.value.filter((v) => v.available).length)
const fresh = computed(() => { const t = props.data?.checked_at ? Date.now() - new Date(props.data.checked_at).getTime() : Infinity; return t < 15 * 60_000 })

// A value is pickable when some AVAILABLE variant matches it together with everything already selected on OTHER axes.
function matches(v, axisName, val) { return v.options[axisName] === val && axes.value.every((a) => a.name === axisName || !sel[a.name] || v.options[a.name] === sel[a.name]) }
function canPick(ax, val) { return variants.value.some((v) => v.available && matches(v, ax.name, val)) }
function isLow(ax, val) { return variants.value.some((v) => v.available && v.low_stock && matches(v, ax.name, val)) }
function pick(axisName, val) {
  sel[axisName] = sel[axisName] === val ? null : val
  // Clear later selections that are no longer compatible.
  for (const a of axes.value) if (a.name !== axisName && sel[a.name] && !canPick(a, sel[a.name])) sel[a.name] = null
}
const chosen = computed(() => axes.value.length ? (variants.value.find((v) => axes.value.every((a) => sel[a.name] && v.options[a.name] === sel[a.name])) || null) : (variants.value[0] || null))
const complete = computed(() => axes.value.length ? !!(chosen.value && chosen.value.available) : !!(chosen.value && chosen.value.available))
const shownPrice = computed(() => chosen.value?.price ?? product.value.price)
const shownWas = computed(() => chosen.value?.list_price ?? product.value.list_price)
const priceRange = computed(() => {
  if (chosen.value) return ''
  const ps = variants.value.map((v) => v.price).filter((p) => p != null)
  if (ps.length < 2) return ''
  const lo = Math.min(...ps), hi = Math.max(...ps)
  return lo !== hi && product.value.price == null ? `$${lo} – $${hi}` : ''
})
const ctaLabel = computed(() => {
  if (!axes.value.length) return complete.value ? 'Agregar a mi caja' : 'Agotado'
  const missing = axes.value.find((a) => !sel[a.name])
  if (missing) return `Elige ${axisLabel(missing).toLowerCase()}`
  return complete.value ? `Agregar ${axes.value.map((a) => sel[a.name]).join(' · ')} a mi caja` : 'Combinación agotada'
})
function confirm() {
  if (!complete.value) return
  const parts = axes.value.map((a) => `${axisLabel(a).toLowerCase()} ${sel[a.name]}`)
  emit('pick', `Quiero ${product.value.title ? 'los ' + product.value.title : 'ese producto'}${parts.length ? ' en ' + parts.join(', ') : ''} — agrégalos a mi caja`)
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
