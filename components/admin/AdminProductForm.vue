<template>
  <form @submit.prevent="submit" class="space-y-6">

    <!-- Basic info -->
    <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 class="font-bold text-gray-900 mb-4">Información básica</h2>
      <div class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nombre *</label>
          <input v-model="form.name" type="text" required class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Slug (URL) <span class="text-gray-300 font-normal">— opcional</span></label>
          <input v-model="form.slug" type="text" placeholder="se genera del nombre" class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tienda (marca)</label>
          <select v-model="form.store_id" class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option :value="null">— Sin tienda —</option>
            <option v-for="s in stores" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Categorías <span class="text-gray-300 font-normal">— puedes elegir varias</span></label>
          <div class="flex flex-wrap gap-2 p-3 rounded-xl border border-gray-200 max-h-44 overflow-y-auto">
            <label v-for="c in categories" :key="c.id" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-pointer text-sm transition-colors"
              :class="form.category_ids.includes(c.id) ? 'bg-primary-50 border-primary-300 text-primary-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'">
              <input type="checkbox" :value="c.id" v-model="form.category_ids" class="hidden" />
              <span v-if="form.category_ids.includes(c.id)" class="text-primary-600">✓</span>
              {{ c.name }}
            </label>
            <p v-if="categories.length === 0" class="text-xs text-gray-400">No hay categorías. Crea algunas en /categorías.</p>
          </div>
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Descripción</label>
          <textarea v-model="form.description" rows="5" class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary-500"></textarea>
        </div>
      </div>
    </div>

    <!-- Images -->
    <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 class="font-bold text-gray-900 mb-1">Imágenes</h2>
      <p class="text-xs text-gray-400 mb-4">Sube varias fotos. La primera será la principal.</p>

      <!-- Existing images (edit mode) -->
      <div v-if="(existingProduct?.images ?? []).length > 0" class="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
        <div
          v-for="(img, i) in existingProduct.images"
          :key="`existing-${i}`"
          class="relative aspect-square bg-gray-100 rounded-xl overflow-hidden group"
        >
          <img :src="img.url" alt="" class="w-full h-full object-cover" />
          <span class="absolute top-1 left-1 bg-white/90 text-[10px] font-bold text-gray-600 px-1.5 py-0.5 rounded">{{ i + 1 }}</span>
          <button
            type="button"
            @click="$emit('delete-image', i)"
            class="absolute top-1.5 right-1.5 h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-sm"
            title="Eliminar"
          >✕</button>
        </div>
      </div>

      <!-- New images to upload (preview before submit) -->
      <div v-if="newImagePreviews.length > 0" class="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
        <div
          v-for="(preview, i) in newImagePreviews"
          :key="`new-${i}`"
          class="relative aspect-square bg-gray-100 rounded-xl overflow-hidden group ring-2 ring-primary-200"
        >
          <img :src="preview" alt="" class="w-full h-full object-cover" />
          <span class="absolute top-1 left-1 bg-primary-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">Nueva</span>
          <button
            type="button"
            @click="removeNewImage(i)"
            class="absolute top-1.5 right-1.5 h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-sm"
            title="Quitar"
          >✕</button>
        </div>
      </div>

      <!-- Upload area -->
      <label class="block w-full cursor-pointer">
        <input ref="fileInput" type="file" accept="image/*" multiple class="hidden" @change="onFiles" />
        <div class="border-2 border-dashed border-gray-200 hover:border-primary-300 hover:bg-primary-50/40 transition-colors rounded-xl py-8 text-center">
          <svg class="h-10 w-10 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <p class="text-sm font-medium text-gray-700">{{ newImagePreviews.length > 0 ? 'Agregar más imágenes' : 'Subir imágenes' }}</p>
          <p class="text-xs text-gray-400 mt-0.5">JPG, PNG, WebP · max 10MB c/u</p>
        </div>
      </label>
    </div>

    <!-- Sourcing (admin-only) -->
    <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 class="font-bold text-gray-900 mb-1">Origen <span class="text-xs font-normal text-gray-400">(solo admin)</span></h2>
      <p class="text-xs text-gray-400 mb-3">Link a donde compramos este producto. Los clientes nunca lo ven.</p>
      <input v-model="form.source_url" type="url" placeholder="https://..." class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
    </div>

    <!-- Pricing & stock -->
    <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 class="font-bold text-gray-900 mb-1">Precio</h2>
      <p class="text-xs text-gray-400 mb-4">Costo y margen son visibles solo para admin. El cliente solo ve el precio final.</p>

      <div class="grid sm:grid-cols-3 gap-4">
        <!-- Cost (admin-only) -->
        <div>
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Costo MXN <span class="text-gray-300 font-normal">— solo admin</span>
          </label>
          <div class="relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
            <input v-model.number="costDisplay" type="number" min="0" step="0.01" placeholder="Lo que pagamos" class="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>

        <!-- Markup -->
        <div>
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Margen %</label>
          <div class="relative">
            <input v-model.number="form.markup_percent" type="number" min="0" step="0.01" class="w-full pl-4 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            <span class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">%</span>
          </div>
        </div>

        <!-- Final price (auto-calc, overridable) -->
        <div>
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Precio final MXN *
            <button v-if="canSuggestPrice && !priceMatchesSuggested" type="button" @click="useSuggestedPrice" class="ml-1 text-primary-600 font-semibold hover:underline">(usar sugerido)</button>
          </label>
          <div class="relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
            <input v-model.number="priceDisplay" type="number" min="0" step="0.01" required class="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <p v-if="canSuggestPrice" class="text-xs text-gray-400 mt-1">
            Sugerido: <strong>${{ suggestedPrice.toFixed(2) }}</strong>
            <span v-if="actualMargin !== null"> · margen actual: <strong :class="actualMargin >= 0 ? 'text-green-600' : 'text-red-600'">{{ actualMargin.toFixed(2) }}%</strong></span>
          </p>
        </div>
      </div>

      <div class="grid sm:grid-cols-3 gap-4 mt-4">
        <div>
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Stock *</label>
          <input v-model.number="form.stock" type="number" min="0" required class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Estado</label>
          <select v-model="form.status" class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="draft">Borrador</option>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
            <option value="sold_out">Agotado</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Disponible hasta</label>
          <input v-model="form.available_until" type="datetime-local" class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
      </div>

      <!-- Stock check status (read-only display) -->
      <div v-if="existingProduct?.stock_check_status" class="mt-4 flex items-center gap-2 text-xs">
        <span class="text-gray-400 uppercase tracking-wider font-semibold">Estado en fuente:</span>
        <span :class="stockCheckBadgeClass">
          <span :class="stockCheckDotClass" class="h-1.5 w-1.5 rounded-full"></span>
          {{ stockCheckLabel }}
        </span>
        <span v-if="existingProduct.last_stock_check_at" class="text-gray-400">
          (revisado {{ formatRelativeTime(existingProduct.last_stock_check_at) }})
        </span>
      </div>
    </div>

    <!-- Physical -->
    <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 class="font-bold text-gray-900 mb-1">Peso y dimensiones <span class="text-xs font-normal text-red-500">(requerido)</span></h2>
      <p class="text-xs text-gray-400 mb-3">Por unidad. Boxly los usa para estimar la caja del cliente.</p>
      <div class="grid sm:grid-cols-4 gap-4">
        <div>
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Peso (kg) *</label>
          <input v-model.number="form.weight_kg" type="number" min="0.01" max="50" step="0.01" required class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Largo (cm) *</label>
          <input v-model.number="form.length_cm" type="number" min="0.1" step="0.1" required class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Ancho (cm) *</label>
          <input v-model.number="form.width_cm" type="number" min="0.1" step="0.1" required class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Alto (cm) *</label>
          <input v-model.number="form.height_cm" type="number" min="0.1" step="0.1" required class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
      </div>
    </div>

    <!-- Variants -->
    <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 class="font-bold text-gray-900 mb-1">Variantes (talla × color)</h2>
      <p class="text-xs text-gray-400 mb-4">Define las tallas y colores. El sistema crea la matriz automáticamente. Si solo hay tallas o solo colores, déjalo así.</p>

      <div class="grid sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tallas (separadas por coma)</label>
          <input v-model="sizesInput" type="text" placeholder="S, M, L, XL" class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Colores (separados por coma)</label>
          <input v-model="colorsInput" type="text" placeholder="Black, Olive, Brown" class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
      </div>

      <p v-if="variantPreview.length > 0" class="text-xs text-gray-500 mb-2">
        Se crearán <strong>{{ variantPreview.length }}</strong> variantes:
      </p>

      <!-- Existing variants (in edit mode) — show stock check status per variant -->
      <div v-if="(existingProduct?.variants ?? []).length > 0" class="space-y-1.5 mb-3">
        <div
          v-for="v in existingProduct.variants"
          :key="v.id"
          class="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-sm"
        >
          <span class="font-medium text-gray-900">
            <span v-if="v.size">Talla: {{ v.size }}</span>
            <span v-if="v.size && v.color"> · </span>
            <span v-if="v.color">Color: {{ v.color }}</span>
          </span>
          <span :class="variantStatusBadge(v.stock_check_status)" class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border">
            <span :class="variantStatusDot(v.stock_check_status)" class="h-1.5 w-1.5 rounded-full"></span>
            {{ variantStatusLabel(v.stock_check_status) }}
          </span>
        </div>
      </div>

      <p v-if="hasInputs" class="text-xs text-amber-600">
        ⚠️ Al guardar, se reemplazarán todas las variantes existentes con esta lista.
      </p>
    </div>

    <!-- Actions -->
    <div class="flex justify-end gap-3">
      <NuxtLink :to="cancelTo" class="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50">Cancelar</NuxtLink>
      <button type="submit" :disabled="saving" class="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 transition-colors">
        {{ saving ? 'Guardando...' : (existingProduct ? 'Guardar cambios' : 'Crear producto') }}
      </button>
    </div>
  </form>
</template>

<script setup>
const route = useRoute()
const apiNs = computed(() => route.path.includes('/shopping/') ? '/shopping' : '/admin')
const cancelTo = computed(() =>
  route.path.includes('/shopping/') ? '/app/shopping/products' : '/app/admin/products'
)

const { $customFetch } = useNuxtApp()

const props = defineProps({
  existingProduct: { type: Object, default: null },
  saving: { type: Boolean, default: false },
})

const emit = defineEmits(['submit', 'delete-image'])

const form = ref({
  name: props.existingProduct?.name ?? '',
  slug: props.existingProduct?.slug ?? '',
  description: props.existingProduct?.description ?? '',
  source_url: props.existingProduct?.source_url ?? '',
  store_id: props.existingProduct?.store_id ?? null,
  category_ids: (props.existingProduct?.categories ?? []).map(c => c.id),
  price_cents: props.existingProduct?.price_cents ?? 0,
  cost_cents: props.existingProduct?.cost_cents ?? null,
  markup_percent: Number(props.existingProduct?.markup_percent ?? 8),
  stock: props.existingProduct?.stock ?? 0,
  status: props.existingProduct?.status ?? 'draft',
  available_until: formatDateTimeLocal(props.existingProduct?.available_until),
  weight_kg: props.existingProduct?.weight_kg ?? null,
  length_cm: props.existingProduct?.length_cm ?? null,
  width_cm: props.existingProduct?.width_cm ?? null,
  height_cm: props.existingProduct?.height_cm ?? null,
})

// Stores + categories for the dropdown / checkbox group
const stores = ref([])
const categories = ref([])
onMounted(async () => {
  try {
    const [s, c] = await Promise.all([
      $customFetch(`${apiNs.value}/stores`, { query: { active_only: 1, per_page: 200 } }),
      $customFetch(`${apiNs.value}/categories`, { query: { active_only: 1, per_page: 200 } }),
    ])
    stores.value = s.data?.data ?? []
    categories.value = c.data?.data ?? []
  } catch (e) {
    console.error('Failed to load stores/categories', e)
  }
})

const priceDisplay = computed({
  get: () => (form.value.price_cents ?? 0) / 100,
  set: (val) => { form.value.price_cents = Math.round(Number(val || 0) * 100) },
})

const costDisplay = computed({
  get: () => form.value.cost_cents == null ? null : form.value.cost_cents / 100,
  set: (val) => {
    if (val === '' || val === null || val === undefined) {
      form.value.cost_cents = null
      return
    }
    form.value.cost_cents = Math.round(Number(val) * 100)
  },
})

// Auto-suggest final price based on cost + markup, but admin can override
const canSuggestPrice = computed(() => form.value.cost_cents != null && form.value.cost_cents > 0)

const suggestedPrice = computed(() => {
  if (! canSuggestPrice.value) return 0
  const markup = Number(form.value.markup_percent ?? 0) / 100
  return Math.round((form.value.cost_cents * (1 + markup))) / 100
})

const priceMatchesSuggested = computed(() => {
  if (! canSuggestPrice.value) return true
  return Math.abs(priceDisplay.value - suggestedPrice.value) < 0.01
})

const actualMargin = computed(() => {
  if (! canSuggestPrice.value) return null
  if (form.value.price_cents <= 0) return null
  return ((form.value.price_cents - form.value.cost_cents) / form.value.cost_cents) * 100
})

const useSuggestedPrice = () => {
  if (! canSuggestPrice.value) return
  form.value.price_cents = Math.round(form.value.cost_cents * (1 + Number(form.value.markup_percent) / 100))
}

// Auto-fill price when cost is set for the first time (no override yet)
watch(() => [form.value.cost_cents, form.value.markup_percent], () => {
  if (! canSuggestPrice.value) return
  // Only auto-fill if the price is currently empty/zero
  if (! form.value.price_cents || form.value.price_cents === 0) {
    useSuggestedPrice()
  }
})

// Stock check display helpers
const stockCheckLabel = computed(() => ({
  in_stock: 'En stock',
  out_of_stock: 'Agotado en fuente',
  unknown: 'Sin verificar',
}[props.existingProduct?.stock_check_status] ?? '—'))

const stockCheckBadgeClass = computed(() => ({
  in_stock:     'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100 font-semibold',
  out_of_stock: 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-100 font-semibold',
  unknown:      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gray-50 text-gray-600 border border-gray-100 font-semibold',
}[props.existingProduct?.stock_check_status] ?? ''))

const stockCheckDotClass = computed(() => ({
  in_stock: 'bg-green-500',
  out_of_stock: 'bg-red-500',
  unknown: 'bg-gray-400',
}[props.existingProduct?.stock_check_status] ?? 'bg-gray-400'))

const formatRelativeTime = (iso) => {
  if (!iso) return ''
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 60) return `hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  return `hace ${days}d`
}

// Image state — both new files and previews
const newImageFiles = ref([])
const newImagePreviews = ref([])
const fileInput = ref(null)

// Variants — pre-fill from existing product so admin sees current matrix
const sizesInput  = ref(uniqueAxis(props.existingProduct?.variants ?? [], 'size').join(', '))
const colorsInput = ref(uniqueAxis(props.existingProduct?.variants ?? [], 'color').join(', '))

const parsedSizes  = computed(() => sizesInput.value.split(',').map(s => s.trim()).filter(Boolean))
const parsedColors = computed(() => colorsInput.value.split(',').map(s => s.trim()).filter(Boolean))

const hasInputs = computed(() => parsedSizes.value.length > 0 || parsedColors.value.length > 0)

const variantPreview = computed(() => {
  const sizes = parsedSizes.value
  const colors = parsedColors.value
  if (sizes.length === 0 && colors.length === 0) return []
  if (sizes.length > 0 && colors.length > 0) {
    const out = []
    let order = 0
    for (const c of colors) for (const s of sizes) out.push({ size: s, color: c, display_order: order++ })
    return out
  }
  if (sizes.length > 0) return sizes.map((s, i) => ({ size: s, display_order: i }))
  return colors.map((c, i) => ({ color: c, display_order: i }))
})

function uniqueAxis(variants, axis) {
  const seen = new Set()
  const out = []
  for (const v of variants) {
    if (!v[axis] || seen.has(v[axis])) continue
    seen.add(v[axis])
    out.push(v[axis])
  }
  return out
}

const variantStatusLabel = (s) => ({
  in_stock: 'En stock',
  out_of_stock: 'Agotado',
  unknown: 'Sin verificar',
}[s] ?? '—')

const variantStatusBadge = (s) => ({
  in_stock:     'bg-green-50 text-green-700 border-green-100',
  out_of_stock: 'bg-red-50 text-red-700 border-red-100',
  unknown:      'bg-gray-50 text-gray-600 border-gray-100',
}[s] ?? 'bg-gray-50 text-gray-600 border-gray-100')

const variantStatusDot = (s) => ({
  in_stock: 'bg-green-500',
  out_of_stock: 'bg-red-500',
  unknown: 'bg-gray-400',
}[s] ?? 'bg-gray-400')

function formatDateTimeLocal(d) {
  if (!d) return ''
  const date = new Date(d)
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const onFiles = (e) => {
  const files = Array.from(e.target.files ?? [])
  files.forEach(f => {
    newImageFiles.value.push(f)
    const reader = new FileReader()
    reader.onload = (ev) => newImagePreviews.value.push(ev.target.result)
    reader.readAsDataURL(f)
  })
  if (fileInput.value) fileInput.value.value = ''
}

const removeNewImage = (i) => {
  newImageFiles.value.splice(i, 1)
  newImagePreviews.value.splice(i, 1)
}

const submit = () => {
  const payload = { ...form.value }
  if (!payload.slug) delete payload.slug
  if (!payload.available_until) payload.available_until = null
  emit('submit', {
    fields: payload,
    images: newImageFiles.value,
    variants: variantPreview.value,
  })
}
</script>
