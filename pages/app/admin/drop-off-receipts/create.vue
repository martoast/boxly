<template>
  <section class="min-h-screen bg-gray-50 py-6">
    <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center gap-3 mb-6">
        <NuxtLink :to="listPath" class="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        </NuxtLink>
        <div>
          <h1 class="text-2xl font-extrabold text-gray-900 leading-tight">Nuevo recibo de entrega</h1>
          <p class="text-sm text-gray-500 mt-0.5">Al crearlo se le envía por correo al cliente.</p>
        </div>
      </div>

      <AdminDropOffReceiptForm :submitting="submitting" :cancel-to="listPath" @submit="onSubmit" />

      <p v-if="step" class="text-sm text-gray-500 text-center mt-4">{{ step }}</p>
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
const step = ref('')

/**
 * One button, three calls: the receipt has to exist before photos can attach to
 * it (the storage path is keyed by receipt number), and the photos have to be
 * up before the email goes out, because the email embeds them.
 */
const onSubmit = async (form, files = []) => {
  submitting.value = true

  let id
  try {
    step.value = 'Creando el recibo...'
    const res = await $customFetch('/admin/drop-off-receipts', { method: 'POST', body: form })
    id = res.data.id
  } catch (e) {
    console.error(e)
    toast.error(e?.data?.message ?? 'Error al crear el recibo')
    submitting.value = false
    step.value = ''
    return
  }

  // From here the receipt exists. Every later failure lands on it rather than
  // reporting an error that would read as "nothing was created".
  if (files.length) {
    try {
      step.value = files.length === 1 ? 'Subiendo la foto...' : `Subiendo ${files.length} fotos...`
      const formData = new FormData()
      files.forEach((file) => formData.append('images[]', file))
      await $customFetch(`/admin/drop-off-receipts/${id}/images`, { method: 'POST', body: formData })
    } catch (e) {
      console.error(e)
      toast.error('Recibo creado, pero las fotos no se subieron. Agrégalas y envíalo desde aquí.')
      router.push(`${listPath}/${id}`)
      return
    }
  }

  try {
    step.value = 'Enviando el correo...'
    await $customFetch(`/admin/drop-off-receipts/${id}/send-email`, { method: 'POST' })
    toast.success('Recibo creado y enviado al cliente')
  } catch (e) {
    console.error(e)
    toast.error('Recibo creado, pero el correo no salió. Envíalo desde aquí.')
  }

  // submitting stays true — we're navigating away, and releasing the button
  // first would let a fast second click file a duplicate.
  router.push(`${listPath}/${id}`)
}
</script>
