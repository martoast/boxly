<template>
  <section class="min-h-screen bg-gray-50 py-6">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center gap-3 mb-6">
        <NuxtLink :to="listPath" class="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        </NuxtLink>
        <div>
          <h1 class="text-2xl font-extrabold text-gray-900">Nuevo recibo de entrega</h1>
          <p class="text-sm text-gray-500 mt-0.5">Después de crearlo podrás agregar fotos y enviarlo por correo.</p>
        </div>
      </div>

      <AdminDropOffReceiptForm @submit="onSubmit" />
    </div>
  </section>
</template>

<script setup>
import AdminDropOffReceiptForm from '~/components/admin/AdminDropOffReceiptForm.vue'

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin'],
})

const { $customFetch } = useNuxtApp()
const toast = useToast()
const router = useRouter()

const listPath = '/app/admin/drop-off-receipts'

const onSubmit = async (form) => {
  try {
    const res = await $customFetch('/admin/drop-off-receipts', { method: 'POST', body: form })
    toast.success('Recibo creado')
    // Straight to the detail page — photos need an existing receipt to attach to.
    router.push(`${listPath}/${res.data.id}`)
  } catch (e) {
    console.error(e)
    toast.error(e?.data?.message ?? 'Error al crear el recibo')
  }
}
</script>
