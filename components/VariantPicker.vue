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
        </p>
      </div>
    </div>

    <!-- freshness -->
    <div class="mt-3 flex items-center gap-1.5 text-[11px] text-gray-500">
      <span class="inline-block w-1.5 h-1.5 rounded-full" :class="fresh ? 'bg-emerald-500' : 'bg-amber-400'"></span>
      <span>Disponibilidad {{ data.source === 'live' ? 'en vivo' : 'verificada' }}<template v-if="data.checked_at"> · {{ rel(data.checked_at) }}</template></span>
      <span class="ml-auto text-gray-400">{{ availableCount }} de {{ variants.length }} disponibles</span>
    </div>

    <!-- colors -->
    <div v-if="colors.length" class="mt-3">
      <p class="text-[12px] font-semibold text-gray-700 mb-1.5">Color<span v-if="selColor" class="font-normal text-gray-500"> · {{ selColor }}</span></p>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="c in colors" :key="c.name" type="button"
          @click="pickColor(c.name)" :disabled="busy"
          :class="[selColor === c.name ? 'border-primary-500 ring-2 ring-primary-200 text-primary-800 bg-primary-50' : c.available ? 'border-gray-200 text-gray-700 hover:border-primary-300' : 'border-gray-100 text-gray-300 line-through']"
          class="px-2.5 py-1 rounded-full border text-[12px] font-medium transition"
          :title="c.available ? c.name : c.name + ' — agotado'"
        >{{ c.name }}</button>
      </div>
    </div>

    <!-- sizes -->
    <div v-if="sizes.length" class="mt-3">
      <p class="text-[12px] font-semibold text-gray-700 mb-1.5">Talla<span v-if="selSize" class="font-normal text-gray-500"> · {{ selSize }}</span></p>
      <div class="grid gap-1.5" :class="sizes.length > 12 ? 'grid-cols-5' : 'grid-cols-4'">
        <button
          v-for="s in sizes" :key="s.name" type="button"
          @click="s.available && pickSize(s.name)" :disabled="busy || !s.available"
          :class="[selSize === s.name ? 'border-primary-500 ring-2 ring-primary-200 text-primary-800 bg-primary-50' : s.available ? 'border-gray-200 text-gray-800 hover:border-primary-300 hover:bg-primary-50' : 'border-gray-100 bg-gray-50 text-gray-300 line-through cursor-not-allowed']"
          class="relative px-1 py-1.5 rounded-lg border text-[12px] font-semibold text-center transition truncate"
          :title="s.available ? s.name : s.name + ' — agotado'"
        >
          {{ s.name }}
          <span v-if="s.available && s.low" class="absolute -top-1 -right-1 text-[9px] font-bold text-amber-700 bg-amber-100 rounded-full px-1 leading-4">¡pocas!</span>
        </button>
      </div>
    </div>

    <!-- single-axis / keyed variants fallback -->
    <div v-if="!colors.length && !sizes.length" class="mt-3 flex flex-wrap gap-1.5">
      <button v-for="v in variants" :key="v.key" type="button" @click="v.available && pickKey(v)" :disabled="busy || !v.available"
        :class="selKey === v.key ? 'border-primary-500 ring-2 ring-primary-200 bg-primary-50 text-primary-800' : v.available ? 'border-gray-200 text-gray-800 hover:border-primary-300' : 'border-gray-100 bg-gray-50 text-gray-300 line-through cursor-not-allowed'"
        class="px-2.5 py-1 rounded-full border text-[12px] font-medium transition">{{ v.key }}</button>
    </div>

    <p class="mt-2 text-[11px] text-gray-400"><span class="inline-block w-2.5 h-2.5 rounded border border-gray-200 bg-white align-middle mr-1"></span>disponible <span class="inline-block w-2.5 h-2.5 rounded border border-gray-100 bg-gray-50 align-middle ml-2 mr-1"></span>agotado</p>

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
import { computed, ref } from 'vue'

const props = defineProps({
  data: { type: Object, required: true },   // { product, product_title, axes, variants[], checked_at, source }
  busy: { type: Boolean, default: false },
})
const emit = defineEmits(['pick'])

const product = computed(() => ({ title: props.data?.product?.title || props.data?.product_title || '', image: props.data?.product?.image || null, url: props.data?.product?.url || null, store: props.data?.product?.store || null, price: props.data?.product?.price ?? null, list_price: props.data?.product?.list_price ?? null }))
const variants = computed(() => (props.data?.variants || []).map((v) => ({ ...v, size: v.size ? String(v.size) : null, color: v.color ? String(v.color) : null })))
const availableCount = computed(() => variants.value.filter((v) => v.available).length)
const fresh = computed(() => { const t = props.data?.checked_at ? Date.now() - new Date(props.data.checked_at).getTime() : Infinity; return t < 15 * 60_000 })

const selColor = ref(null)
const selSize = ref(null)
const selKey = ref(null)

// Colours: available if ANY variant of that colour is available.
const colors = computed(() => {
  const m = new Map()
  for (const v of variants.value) { if (!v.color) continue; const cur = m.get(v.color) || { name: v.color, available: false }; cur.available = cur.available || !!v.available; m.set(v.color, cur) }
  return [...m.values()]
})
// Sizes: filtered by the selected colour when the product has colours.
const sizes = computed(() => {
  const m = new Map()
  for (const v of variants.value) {
    if (!v.size) continue
    if (colors.value.length && selColor.value && v.color !== selColor.value) continue
    const cur = m.get(v.size) || { name: v.size, available: false, low: false }
    cur.available = cur.available || !!v.available; cur.low = cur.low || !!v.low_stock; m.set(v.size, cur)
  }
  return [...m.values()]
})
const chosen = computed(() => {
  if (selKey.value) return variants.value.find((v) => v.key === selKey.value) || null
  return variants.value.find((v) => (!colors.value.length || v.color === selColor.value) && (!sizes.value.length || v.size === selSize.value)) || null
})
const shownPrice = computed(() => chosen.value?.price ?? product.value.price)
const shownWas = computed(() => chosen.value?.list_price ?? product.value.list_price)
const complete = computed(() => selKey.value ? true : (!colors.value.length || !!selColor.value) && (!sizes.value.length || !!selSize.value) && (chosen.value ? !!chosen.value.available : true))
const ctaLabel = computed(() => {
  const bits = [selSize.value ? 'talla ' + selSize.value : null, selColor.value ? selColor.value : null, selKey.value].filter(Boolean)
  return bits.length ? `Agregar ${bits.join(' · ')} a mi caja` : (sizes.value.length ? 'Elige tu talla' : colors.value.length ? 'Elige un color' : 'Elige una opción')
})

function pickColor(name) { selColor.value = selColor.value === name ? null : name; if (selSize.value && !sizes.value.find((s) => s.name === selSize.value && s.available)) selSize.value = null }
function pickSize(name) { selSize.value = selSize.value === name ? null : name }
function pickKey(v) { selKey.value = selKey.value === v.key ? null : v.key }
function confirm() {
  if (!complete.value) return
  const parts = []
  if (selSize.value) parts.push('talla ' + selSize.value)
  if (selColor.value) parts.push('color ' + selColor.value)
  if (selKey.value) parts.push(selKey.value)
  emit('pick', `Quiero ${product.value.title ? 'los ' + product.value.title + ' en ' : ''}${parts.join(', ')} — agrégalos a mi caja`)
}
function rel(iso) {
  const ms = Date.now() - new Date(iso).getTime()
  if (!Number.isFinite(ms) || ms < 0) return 'ahora'
  const m = Math.round(ms / 60000)
  return m < 1 ? 'hace un momento' : m < 60 ? `hace ${m} min` : `hace ${Math.round(m / 60)} h`
}
</script>
