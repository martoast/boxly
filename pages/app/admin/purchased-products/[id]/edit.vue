<template>
  <section class="min-h-screen bg-gray-50 py-6">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <NuxtLink to="/app/admin/purchased-products" class="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          </NuxtLink>
          <h1 class="text-2xl font-extrabold text-gray-900">Editar registro</h1>
        </div>
        <button @click="onDelete" class="text-red-600 text-sm font-medium hover:text-red-700">Eliminar</button>
      </div>

      <div v-if="loading" class="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">Cargando...</div>
      <AdminPurchasedProductForm v-else :existing-record="record" cancel-to="/app/admin/purchased-products" @submit="onSubmit" />
    </div>
  </section>
</template>

<script setup>
import AdminPurchasedProductForm from '~/components/admin/AdminPurchasedProductForm.vue'

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin'],
})

const { $customFetch } = useNuxtApp()
const toast = useToast()
const route = useRoute()
const router = useRouter()

const record = ref(null)
const loading = ref(true)

const fetchRecord = async () => {
  try {
    const res = await $customFetch(`/shopping/purchased-products/${route.params.id}`)
    record.value = res.data
  } catch (e) {
    toast.error('No se pudo cargar el registro.')
  } finally {
    loading.value = false
  }
}

const onSubmit = async (form) => {
  try {
    await $customFetch(`/shopping/purchased-products/${route.params.id}`, { method: 'PUT', body: form })
    toast.success('Registro actualizado')
    router.push('/app/admin/purchased-products')
  } catch (e) {
    console.error(e)
    toast.error(e?.data?.message ?? 'Error al actualizar')
  }
}

const onDelete = async () => {
  if (!confirm('¿Eliminar este registro?')) return
  try {
    await $customFetch(`/shopping/purchased-products/${route.params.id}`, { method: 'DELETE' })
    toast.success('Registro eliminado')
    router.push('/app/admin/purchased-products')
  } catch (e) {
    console.error(e)
    toast.error(e?.data?.message ?? 'Error al eliminar')
  }
}

onMounted(fetchRecord)
</script>
