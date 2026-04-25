<template>
  <section class="min-h-screen bg-gray-50">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

      <div class="flex items-center gap-3 mb-6">
        <NuxtLink to="/app/admin/products" class="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </NuxtLink>
        <h1 class="text-2xl font-extrabold text-gray-900">Crear producto</h1>
      </div>

      <AdminProductForm
        :saving="saving"
        @submit="onSubmit"
      />
    </div>
  </section>
</template>

<script setup>
import AdminProductForm from '~/components/admin/AdminProductForm.vue'

definePageMeta({
  middleware: ['auth', 'admin'],
})

const { $customFetch } = useNuxtApp()
const router = useRouter()
const toast = useToast()

const saving = ref(false)

const onSubmit = async (payload) => {
  saving.value = true
  try {
    const res = await $customFetch('/admin/products', {
      method: 'POST',
      body: payload,
    })
    toast.success('Producto creado. Sube imágenes desde la página de edición.')
    router.push(`/app/admin/products/${res.data.id}/edit`)
  } catch (err) {
    console.error(err)
    toast.error(err?.data?.message ?? 'No se pudo crear el producto.')
  } finally {
    saving.value = false
  }
}
</script>
