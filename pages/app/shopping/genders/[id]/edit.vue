<template>
  <section class="min-h-screen bg-gray-50 py-6">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <NuxtLink :to="listPath" class="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          </NuxtLink>
          <h1 class="text-2xl font-extrabold text-gray-900">Editar género</h1>
        </div>
        <button @click="onDelete" class="text-red-600 text-sm font-medium hover:text-red-700">Eliminar</button>
      </div>

      <div v-if="loading" class="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">Cargando...</div>
      <AdminGenderForm v-else :existing-gender="gender" @submit="onSubmit" @upload-image="onUploadImage" />
    </div>
  </section>
</template>

<script setup>
import AdminGenderForm from '~/components/admin/AdminGenderForm.vue'

definePageMeta({
  layout: 'shopping',
  middleware: ['auth', 'shopping'],
})

const { $customFetch } = useNuxtApp()
const toast = useToast()
const route = useRoute()
const router = useRouter()

const apiNs = computed(() => route.path.includes('/shopping/') ? '/shopping' : '/admin')
const listPath = computed(() => route.path.includes('/shopping/') ? '/app/shopping/genders' : '/app/admin/genders')

const gender = ref(null)
const loading = ref(true)

const fetchGender = async () => {
  try {
    const res = await $customFetch(`${apiNs.value}/genders/${route.params.id}`)
    gender.value = res.data
  } catch (e) {
    toast.error('No se pudo cargar el género.')
  } finally {
    loading.value = false
  }
}

const onSubmit = async (form) => {
  try {
    await $customFetch(`${apiNs.value}/genders/${route.params.id}`, { method: 'PUT', body: form })
    toast.success('Género actualizado')
    router.push(listPath.value)
  } catch (e) {
    console.error(e)
    toast.error(e?.data?.message ?? 'Error al actualizar')
  }
}

const onUploadImage = async (formData) => {
  try {
    const res = await $customFetch(`${apiNs.value}/genders/${route.params.id}/image`, {
      method: 'POST',
      body: formData,
    })
    gender.value = res.data
    toast.success('Imagen actualizada')
  } catch (e) {
    console.error(e)
    toast.error(e?.data?.message ?? 'Error al subir imagen')
  }
}

const onDelete = async () => {
  if (!confirm('¿Eliminar este género? Los productos pierden la asociación.')) return
  try {
    await $customFetch(`${apiNs.value}/genders/${route.params.id}`, { method: 'DELETE' })
    toast.success('Género eliminado')
    router.push(listPath.value)
  } catch (e) {
    console.error(e)
    toast.error(e?.data?.message ?? 'Error al eliminar')
  }
}

onMounted(fetchGender)
</script>
