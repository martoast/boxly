<template>
  <form @submit.prevent="onSubmit" class="space-y-6">
    <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
      <div>
        <label class="block text-sm font-semibold text-gray-900 mb-1">Nombre <span class="text-red-500">*</span></label>
        <input v-model="form.name" required class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
      </div>

      <div>
        <label class="block text-sm font-semibold text-gray-900 mb-1">Slug</label>
        <input v-model="form.slug" :placeholder="autoSlugHint" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono" />
        <p class="text-xs text-gray-400 mt-1">Si lo dejas vacío, se generará automáticamente del nombre.</p>
      </div>

      <div>
        <label class="block text-sm font-semibold text-gray-900 mb-1">Imagen / banner</label>
        <div class="flex items-center gap-4">
          <div class="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center text-gray-400 text-xs shrink-0">
            <img v-if="form.image_url" :src="form.image_url" alt="" class="w-full h-full object-cover" />
            <span v-else>Sin imagen</span>
          </div>
          <div class="flex-1 space-y-2">
            <input v-model="form.image_url" type="url" placeholder="URL pública de la imagen" class="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500" />
            <div v-if="categoryId" class="flex items-center gap-2">
              <input ref="imageFileInput" type="file" accept="image/*" class="text-xs" @change="onImageFile" />
              <span v-if="uploading" class="text-xs text-gray-500">Subiendo...</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <label class="block text-sm font-semibold text-gray-900 mb-1">Descripción</label>
        <textarea v-model="form.description" rows="3" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"></textarea>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" v-model="form.is_active" class="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
          <span class="font-semibold text-gray-900">Activa</span>
        </label>
        <div>
          <label class="block text-xs font-semibold text-gray-500 uppercase mb-1">Sort order</label>
          <input v-model.number="form.sort_order" type="number" min="0" class="w-full border border-gray-200 rounded-xl px-3 py-1.5 text-sm" />
        </div>
      </div>
    </div>

    <div class="flex justify-end gap-3">
      <NuxtLink :to="cancelTo" class="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50">Cancelar</NuxtLink>
      <button type="submit" :disabled="saving" class="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 transition-colors">
        {{ saving ? 'Guardando...' : (categoryId ? 'Guardar cambios' : 'Crear categoría') }}
      </button>
    </div>
  </form>
</template>

<script setup>
const props = defineProps({
  existingCategory: { type: Object, default: null },
})
const emit = defineEmits(['submit', 'upload-image'])

const route = useRoute()
const cancelTo = computed(() =>
  route.path.includes('/shopping/') ? '/app/shopping/categories' : '/app/admin/categories'
)

const categoryId = computed(() => props.existingCategory?.id)

const form = ref({
  name: '',
  slug: '',
  image_url: '',
  description: '',
  is_active: true,
  sort_order: 0,
})

watch(() => props.existingCategory, (c) => {
  if (c) {
    form.value = {
      name: c.name ?? '',
      slug: c.slug ?? '',
      image_url: c.image_url ?? '',
      description: c.description ?? '',
      is_active: c.is_active ?? true,
      sort_order: c.sort_order ?? 0,
    }
  }
}, { immediate: true })

const autoSlugHint = computed(() =>
  form.value.name ? form.value.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : 'auto-generado'
)

const saving = ref(false)
const uploading = ref(false)
const imageFileInput = ref(null)

const onSubmit = async () => {
  saving.value = true
  try {
    await emit('submit', form.value)
  } finally {
    saving.value = false
  }
}

const onImageFile = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  uploading.value = true
  try {
    const fd = new FormData()
    fd.append('image', file)
    await emit('upload-image', fd)
    if (imageFileInput.value) imageFileInput.value.value = ''
  } finally {
    uploading.value = false
  }
}
</script>
