<template>
  <form @submit.prevent="onSubmit" class="space-y-6">
    <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
      <div>
        <label class="block text-sm font-semibold text-gray-900 mb-1">Título <span class="text-red-500">*</span></label>
        <input v-model="form.title" required placeholder="Ej. Tenis Nike para correr" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        <p class="text-xs text-gray-400 mt-1">El texto corto que se muestra sobre la tarjeta.</p>
      </div>

      <div>
        <label class="block text-sm font-semibold text-gray-900 mb-1">Prompt <span class="text-red-500">*</span></label>
        <textarea v-model="form.prompt_text" required rows="2" placeholder="Lo que se escribe en el chat al tocar la tarjeta" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"></textarea>
        <p class="text-xs text-gray-400 mt-1">Esto es lo que se escribe en el chat cuando el cliente toca la tarjeta.</p>
      </div>

      <div>
        <label class="block text-sm font-semibold text-gray-900 mb-1">Imagen</label>
        <div class="flex items-center gap-4">
          <div class="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center text-gray-400 text-2xl shrink-0">
            <img v-if="form.image_url" :src="form.image_url" alt="" class="w-full h-full object-cover" />
            <span v-else>{{ form.emoji || '🖼️' }}</span>
          </div>
          <div class="flex-1 space-y-2">
            <input v-model="form.image_url" type="url" placeholder="URL pública de la imagen" class="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500" />
            <div v-if="promptId" class="flex items-center gap-2">
              <input ref="imageFileInput" type="file" accept="image/*" class="text-xs" @change="onImageFile" />
              <span v-if="uploadingImage" class="text-xs text-gray-500">Subiendo...</span>
            </div>
            <p v-else class="text-xs text-gray-400">Guarda primero para poder subir una imagen.</p>
          </div>
        </div>
      </div>

      <div>
        <label class="block text-sm font-semibold text-gray-900 mb-1">Búsqueda de imagen (fallback)</label>
        <input v-model="form.image_query" placeholder="Ej. Nike running shoes women" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        <p class="text-xs text-gray-400 mt-1">Si no subes una imagen, se busca una foto real de producto con este texto.</p>
      </div>

      <div>
        <label class="block text-sm font-semibold text-gray-900 mb-1">Emoji (último recurso)</label>
        <input v-model="form.emoji" maxlength="4" placeholder="👟" class="w-24 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-500" />
      </div>

      <div class="space-y-3 pt-2 border-t border-gray-100">
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" v-model="form.is_active" class="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
          <span class="font-semibold text-gray-900">Activa</span>
        </label>
        <div>
          <label class="block text-xs font-semibold text-gray-500 uppercase mb-1">Orden</label>
          <input v-model.number="form.sort_order" type="number" min="0" class="w-full border border-gray-200 rounded-xl px-3 py-1.5 text-sm" />
        </div>
      </div>
    </div>

    <div class="flex justify-end gap-3">
      <NuxtLink to="/app/admin/starter-prompts" class="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50">Cancelar</NuxtLink>
      <button type="submit" :disabled="saving" class="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 transition-colors">
        {{ saving ? 'Guardando...' : (promptId ? 'Guardar cambios' : 'Crear tarjeta') }}
      </button>
    </div>
  </form>
</template>

<script setup>
const props = defineProps({
  existingPrompt: { type: Object, default: null },
})
const emit = defineEmits(['submit', 'upload-image'])

const promptId = computed(() => props.existingPrompt?.id)

const form = ref({
  title: '',
  prompt_text: '',
  image_url: '',
  image_query: '',
  emoji: '',
  is_active: true,
  sort_order: 0,
})

watch(() => props.existingPrompt, (p) => {
  if (p) {
    form.value = {
      title: p.title ?? '',
      prompt_text: p.prompt_text ?? '',
      image_url: p.image_url ?? '',
      image_query: p.image_query ?? '',
      emoji: p.emoji ?? '',
      is_active: p.is_active ?? true,
      sort_order: p.sort_order ?? 0,
    }
  }
}, { immediate: true })

const saving = ref(false)
const uploadingImage = ref(false)
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
  uploadingImage.value = true
  try {
    const fd = new FormData()
    fd.append('image', file)
    await emit('upload-image', fd)
    if (imageFileInput.value) imageFileInput.value.value = ''
  } finally {
    uploadingImage.value = false
  }
}
</script>
