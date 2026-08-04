<template>
  <section class="min-h-screen bg-gray-50 py-6">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center gap-3 mb-6">
        <NuxtLink :to="listPath" class="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        </NuxtLink>
        <div>
          <h1 class="text-2xl font-extrabold text-gray-900">Nuevo recibo de entrega</h1>
          <p class="text-sm text-gray-500 mt-0.5">Adjunta las fotos aquí. Después de crearlo lo envías por correo.</p>
        </div>
      </div>

      <AdminDropOffReceiptForm :submitting="submitting" @submit="onSubmit" />
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

const submitting = ref(false)

const onSubmit = async (form, files = []) => {
  submitting.value = true

  let id
  try {
    const res = await $customFetch('/admin/drop-off-receipts', { method: 'POST', body: form })
    id = res.data.id
  } catch (e) {
    console.error(e)
    toast.error(e?.data?.message ?? 'Error al crear el recibo')
    submitting.value = false
    return
  }

  // Photos need a saved receipt to attach to, so they go up on a second call.
  // A failure here must not read as "nothing was created" — the receipt exists,
  // so land on it and let them retry the photos there.
  if (files.length) {
    try {
      const formData = new FormData()
      files.forEach((file) => formData.append('images[]', file))
      await $customFetch(`/admin/drop-off-receipts/${id}/images`, { method: 'POST', body: formData })
    } catch (e) {
      console.error(e)
      toast.error('Recibo creado, pero las fotos no se subieron. Agrégalas aquí.')
      router.push(`${listPath}/${id}`)
      return
    }
  }

  toast.success('Recibo creado')
  // Deliberately leave submitting true — we're navigating away, and releasing
  // the button first would let a fast second click create a duplicate.
  router.push(`${listPath}/${id}`)
}
</script>
