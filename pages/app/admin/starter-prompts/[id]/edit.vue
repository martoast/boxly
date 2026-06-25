<template>
  <section class="min-h-screen bg-gray-50 py-6">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <NuxtLink to="/app/admin/starter-prompts" class="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          </NuxtLink>
          <h1 class="text-2xl font-extrabold text-gray-900">Editar tarjeta</h1>
        </div>
        <button @click="onDelete" class="text-red-600 text-sm font-medium hover:text-red-700">Eliminar</button>
      </div>

      <div v-if="loading" class="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">Cargando...</div>
      <AdminStarterPromptForm v-else :existing-prompt="prompt" @submit="onSubmit" @upload-image="onUploadImage" />
    </div>
  </section>
</template>

<script setup>
import AdminStarterPromptForm from '~/components/admin/AdminStarterPromptForm.vue'

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin'],
})

const { $customFetch } = useNuxtApp()
const toast = useToast()
const route = useRoute()
const router = useRouter()

const prompt = ref(null)
const loading = ref(true)

const fetchPrompt = async () => {
  try {
    const res = await $customFetch(`/admin/starter-prompts/${route.params.id}`)
    prompt.value = res.data
  } catch (e) {
    toast.error('No se pudo cargar la tarjeta.')
  } finally {
    loading.value = false
  }
}

const onSubmit = async (form) => {
  try {
    await $customFetch(`/admin/starter-prompts/${route.params.id}`, { method: 'PUT', body: form })
    toast.success('Tarjeta actualizada')
    router.push('/app/admin/starter-prompts')
  } catch (e) {
    console.error(e)
    toast.error(e?.data?.message ?? 'Error al actualizar')
  }
}

const onUploadImage = async (formData) => {
  try {
    const res = await $customFetch(`/admin/starter-prompts/${route.params.id}/image`, {
      method: 'POST',
      body: formData,
    })
    prompt.value = res.data
    toast.success('Imagen actualizada')
  } catch (e) {
    console.error(e)
    toast.error(e?.data?.message ?? 'Error al subir imagen')
  }
}

const onDelete = async () => {
  if (!confirm('¿Eliminar esta tarjeta?')) return
  try {
    await $customFetch(`/admin/starter-prompts/${route.params.id}`, { method: 'DELETE' })
    toast.success('Tarjeta eliminada')
    router.push('/app/admin/starter-prompts')
  } catch (e) {
    console.error(e)
    toast.error(e?.data?.message ?? 'Error al eliminar')
  }
}

onMounted(fetchPrompt)
</script>
