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
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Color</label>
          <input v-model="form.color" type="text" placeholder='Ej: Steel Blue' class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          <p class="text-xs text-gray-400 mt-1">Cada producto en Boxly representa un solo color. Si quieres listar otra variante de color, créalo como producto separado.</p>
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
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Género <span class="text-gray-300 font-normal">— deja vacío para unisex</span></label>
          <select v-model="form.gender_id" class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option :value="null">— Unisex / Sin género —</option>
            <option v-for="g in genders" :key="g.id" :value="g.id">{{ g.name }}</option>
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
      <p class="text-xs text-gray-400 mb-4">
        Sube varias fotos. La primera será la principal. Todas pertenecen al color de este producto.
      </p>

      <!-- Existing images (edit mode) -->
      <div v-if="(existingProduct?.images ?? []).length > 0" class="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
        <div
          v-for="(img, i) in existingProduct.images"
          :key="`existing-${i}`"
          class="relative aspect-[1/1] bg-gray-100 rounded-xl overflow-hidden group"
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
          class="relative aspect-[1/1] bg-gray-100 rounded-xl overflow-hidden group ring-2 ring-primary-200"
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

    <!-- Pricing — source-store USD only. Tax / shipping / commission
         are NOT here; Velonie applies those per-PR at quote time. -->
    <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 class="font-bold text-gray-900 mb-1">Precio</h2>
      <p class="text-xs text-gray-400 mb-4">El precio original en USD que la tienda muestra. Esto es lo que ve el cliente en la página pública.</p>

      <div class="grid sm:grid-cols-3 gap-4">
        <div>
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Precio USD *</label>
          <div class="relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
            <input v-model.number="priceDisplay" type="number" min="0" step="0.01" required class="w-full pl-8 pr-12 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500" />
            <span class="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">USD</span>
          </div>
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Estado</label>
          <select v-model="form.status" class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="draft">Borrador</option>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Disponible hasta</label>
          <input v-model="form.available_until" type="datetime-local" class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
      </div>

      <!-- Featured: hand-pick which products show in the homepage rail. -->
      <div class="mt-5 pt-5 border-t border-gray-100">
        <label class="flex items-start gap-3 cursor-pointer select-none">
          <input v-model="form.is_featured" type="checkbox" class="mt-0.5 w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
          <span>
            <span class="block text-sm font-semibold text-gray-800">Destacar en la página principal</span>
            <span class="block text-xs text-gray-400 mt-0.5">Aparece en el carrusel "Lo más buscado en USA" del inicio. Solo se muestran productos activos.</span>
          </span>
        </label>
      </div>
    </div>

    <!-- Variants -->
    <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 class="font-bold text-gray-900 mb-1">Variantes</h2>
      <p class="text-xs text-gray-400 mb-4">Tallas y largos para este color. Si el producto no tiene tallas o largos, déjalo en blanco.</p>

      <div class="grid sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tallas (coma)</label>
          <input v-model="sizesInput" type="text" placeholder="S, M, L, XL" class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Largos (coma)</label>
          <input v-model="lengthsInput" type="text" placeholder='25", 28"' class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
      </div>

      <p v-if="variantPreview.length > 0" class="text-xs text-gray-500 mb-2">
        Se crearán <strong>{{ variantPreview.length }}</strong> variantes:
      </p>

      <!-- Existing variants (in edit mode) -->
      <div v-if="(existingProduct?.variants ?? []).length > 0" class="space-y-1.5 mb-3">
        <div
          v-for="v in existingProduct.variants"
          :key="v.id"
          class="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-sm"
        >
          <span class="font-medium text-gray-900">
            <span v-if="v.size">Talla: {{ v.size }}</span>
            <span v-if="v.size && v.length"> · </span>
            <span v-if="v.length">Largo: {{ v.length }}</span>
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
      <button
        type="submit"
        :disabled="saving"
        class="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-400 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 transition-colors"
      >
        <svg v-if="saving" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg>
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
  color: props.existingProduct?.color ?? '',
  slug: props.existingProduct?.slug ?? '',
  description: props.existingProduct?.description ?? '',
  source_url: props.existingProduct?.source_url ?? '',
  store_id: props.existingProduct?.store_id ?? null,
  gender_id: props.existingProduct?.gender_id ?? null,
  category_ids: (props.existingProduct?.categories ?? []).map(c => c.id),
  price_cents: props.existingProduct?.price_cents ?? 0,
  status: props.existingProduct?.status ?? 'draft',
  is_featured: props.existingProduct?.is_featured ?? false,
  available_until: formatDateTimeLocal(props.existingProduct?.available_until),
})

// Stores + categories + genders for the dropdowns / checkbox group
const stores = ref([])
const categories = ref([])
const genders = ref([])
onMounted(async () => {
  try {
    const [s, c, g] = await Promise.all([
      $customFetch(`${apiNs.value}/stores`, { query: { active_only: 1, per_page: 200 } }),
      $customFetch(`${apiNs.value}/categories`, { query: { active_only: 1, per_page: 200 } }),
      $customFetch(`${apiNs.value}/genders`, { query: { active_only: 1, per_page: 200 } }),
    ])
    stores.value = s.data?.data ?? []
    categories.value = c.data?.data ?? []
    genders.value = g.data?.data ?? []
  } catch (e) {
    console.error('Failed to load stores/categories/genders', e)
  }
})

// price_cents stores USD cents directly (source-store price). The
// dollar-display computed exposes it as $X.XX for the input.
const priceDisplay = computed({
  get: () => (form.value.price_cents ?? 0) / 100,
  set: (val) => { form.value.price_cents = Math.round(Number(val || 0) * 100) },
})

// Image state — new files + previews. Color now lives at the product
// level so per-image color tagging is gone.
const newImageFiles = ref([])
const newImagePreviews = ref([])
const fileInput = ref(null)

// Variants — pre-fill from existing product. Color is product-level
// (form.color) so the variant axes are size + length only.
const sizesInput   = ref(uniqueAxis(props.existingProduct?.variants ?? [], 'size').join(', '))
const lengthsInput = ref(uniqueAxis(props.existingProduct?.variants ?? [], 'length').join(', '))

const parsedSizes   = computed(() => sizesInput.value.split(',').map(s => s.trim()).filter(Boolean))
const parsedLengths = computed(() => lengthsInput.value.split(',').map(s => s.trim()).filter(Boolean))

const hasInputs = computed(() => parsedSizes.value.length > 0 || parsedLengths.value.length > 0)

// Cartesian product of size × length. Empty axis = single null placeholder
// so the loop still runs once (e.g. a product with sizes but no length).
const variantPreview = computed(() => {
  const sizes   = parsedSizes.value
  const lengths = parsedLengths.value
  if (sizes.length === 0 && lengths.length === 0) return []

  const sizeIter   = sizes.length   ? sizes   : [null]
  const lengthIter = lengths.length ? lengths : [null]

  const out = []
  let order = 0
  for (const s of sizeIter) {
    for (const l of lengthIter) {
      const row = { display_order: order++ }
      if (s !== null) row.size   = s
      if (l !== null) row.length = l
      out.push(row)
    }
  }
  return out
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
    fields:   payload,
    images:   newImageFiles.value,
    variants: variantPreview.value,
  })
}
</script>
