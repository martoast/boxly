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
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Slug (URL)</label>
          <input v-model="form.slug" type="text" placeholder="auto desde nombre" class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">SKU</label>
            <input v-model="form.sku" type="text" class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Categoría</label>
            <input v-model="form.category" type="text" placeholder="Ej: Tenis, Belleza" class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Descripción</label>
          <textarea v-model="form.description" rows="5" class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary-500"></textarea>
        </div>
      </div>
    </div>

    <!-- Sourcing (admin-only) -->
    <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 class="font-bold text-gray-900 mb-1">Origen <span class="text-xs font-normal text-gray-400">(solo admin)</span></h2>
      <p class="text-xs text-gray-400 mb-3">Link a donde compramos este producto. Los clientes nunca lo ven.</p>
      <input v-model="form.source_url" type="url" placeholder="https://..." class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
    </div>

    <!-- Pricing & stock -->
    <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 class="font-bold text-gray-900 mb-4">Precio y stock</h2>
      <div class="grid sm:grid-cols-3 gap-4">
        <div>
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Precio MXN *</label>
          <div class="relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
            <input v-model.number="priceDisplay" type="number" min="0" step="0.01" required class="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>
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
      </div>
      <div class="mt-4">
        <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Disponible hasta (clearance)</label>
        <input v-model="form.available_until" type="datetime-local" class="rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        <p class="text-xs text-gray-400 mt-1">Opcional. Si se llena, el producto se oculta automáticamente al pasar la fecha.</p>
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

    <!-- Images -->
    <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 class="font-bold text-gray-900 mb-1">Imágenes</h2>
      <p class="text-xs text-gray-400 mb-3">{{ existingProduct ? 'Sube imágenes después de crear el producto desde la página de edición.' : 'Las imágenes se suben tras crear el producto.' }}</p>

      <div v-if="existingProduct">
        <!-- Existing images -->
        <div v-if="(existingProduct.images ?? []).length > 0" class="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
          <div
            v-for="(img, i) in existingProduct.images"
            :key="i"
            class="relative aspect-square bg-gray-100 rounded-xl overflow-hidden group"
          >
            <img :src="img.url" alt="" class="w-full h-full object-cover" />
            <button
              type="button"
              @click="$emit('delete-image', i)"
              class="absolute top-1.5 right-1.5 h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              title="Eliminar"
            >✕</button>
          </div>
        </div>

        <!-- Upload area -->
        <label class="block w-full cursor-pointer">
          <input type="file" accept="image/*" multiple class="hidden" @change="onFiles" />
          <div class="border-2 border-dashed border-gray-200 hover:border-primary-300 hover:bg-primary-50/50 transition-colors rounded-xl py-8 text-center">
            <svg class="h-10 w-10 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            <p class="text-sm font-medium text-gray-700">Subir imágenes</p>
            <p class="text-xs text-gray-400">Múltiples fotos · JPG, PNG, WebP · max 10MB c/u</p>
          </div>
        </label>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex justify-end gap-3">
      <NuxtLink to="/app/admin/products" class="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50">Cancelar</NuxtLink>
      <button type="submit" :disabled="saving" class="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 transition-colors">
        {{ saving ? 'Guardando...' : (existingProduct ? 'Guardar cambios' : 'Crear producto') }}
      </button>
    </div>
  </form>
</template>

<script setup>
const props = defineProps({
  existingProduct: { type: Object, default: null },
  saving: { type: Boolean, default: false },
})

const emit = defineEmits(['submit', 'upload-images', 'delete-image'])

const form = ref({
  name: props.existingProduct?.name ?? '',
  slug: props.existingProduct?.slug ?? '',
  description: props.existingProduct?.description ?? '',
  sku: props.existingProduct?.sku ?? '',
  source_url: props.existingProduct?.source_url ?? '',
  category: props.existingProduct?.category ?? '',
  price_cents: props.existingProduct?.price_cents ?? 0,
  stock: props.existingProduct?.stock ?? 0,
  status: props.existingProduct?.status ?? 'draft',
  available_until: formatDateTimeLocal(props.existingProduct?.available_until),
  weight_kg: props.existingProduct?.weight_kg ?? null,
  length_cm: props.existingProduct?.length_cm ?? null,
  width_cm: props.existingProduct?.width_cm ?? null,
  height_cm: props.existingProduct?.height_cm ?? null,
})

const priceDisplay = computed({
  get: () => (form.value.price_cents ?? 0) / 100,
  set: (val) => { form.value.price_cents = Math.round(Number(val || 0) * 100) },
})

function formatDateTimeLocal(d) {
  if (!d) return ''
  const date = new Date(d)
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const submit = () => {
  const payload = { ...form.value }
  if (!payload.slug) delete payload.slug
  if (!payload.available_until) payload.available_until = null
  emit('submit', payload)
}

const onFiles = (e) => {
  const files = Array.from(e.target.files ?? [])
  if (files.length === 0) return
  emit('upload-images', files)
  e.target.value = ''
}
</script>
