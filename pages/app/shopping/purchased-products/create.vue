<template>
  <section class="min-h-screen bg-gray-50 py-6">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center gap-3 mb-6">
        <NuxtLink to="/app/shopping/purchased-products" class="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        </NuxtLink>
        <h1 class="text-2xl font-extrabold text-gray-900">Nuevo registro</h1>
      </div>

      <AdminPurchasedProductForm @submit="onSubmit" />
    </div>
  </section>
</template>

<script setup>
import AdminPurchasedProductForm from '~/components/admin/AdminPurchasedProductForm.vue'

definePageMeta({
  layout: 'shopping',
  middleware: ['auth', 'shopping'],
})

const { $customFetch } = useNuxtApp()
const toast = useToast()
const router = useRouter()

const onSubmit = async (form) => {
  try {
    await $customFetch('/shopping/purchased-products', { method: 'POST', body: form })
    toast.success('Registro creado')
    router.push('/app/shopping/purchased-products')
  } catch (e) {
    console.error(e)
    toast.error(e?.data?.message ?? 'Error al crear registro')
  }
}
</script>
