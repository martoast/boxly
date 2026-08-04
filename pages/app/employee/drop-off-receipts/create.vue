<template>
  <div>
    <div class="flex items-center gap-3 mb-6">
      <NuxtLink :to="listPath" class="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
      </NuxtLink>
      <div>
        <h1 class="text-2xl font-extrabold text-gray-900 leading-tight">New drop-off receipt</h1>
        <p class="text-sm text-gray-500 mt-0.5">Creating it emails the customer their confirmation.</p>
      </div>
    </div>

    <AdminDropOffReceiptForm :submitting="submitting" :cancel-to="listPath" @submit="onSubmit" />

    <p v-if="step" class="text-sm text-gray-500 text-center mt-4">{{ step }}</p>
  </div>
</template>

<script setup>
import AdminDropOffReceiptForm from '~/components/admin/AdminDropOffReceiptForm.vue'

definePageMeta({
  layout: 'employee',
  middleware: ['auth', 'employee'],
})

const { $customFetch } = useNuxtApp()
const toast = useToast()
const router = useRouter()

const listPath = '/app/employee/drop-off-receipts'

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
    step.value = 'Creating the receipt...'
    const res = await $customFetch('/employee/drop-off-receipts', { method: 'POST', body: form })
    id = res.data.id
  } catch (e) {
    console.error(e)
    toast.error(e?.data?.message ?? 'Could not create the receipt')
    submitting.value = false
    step.value = ''
    return
  }

  // From here the receipt exists. Every later failure lands on it rather than
  // reporting an error that would read as "nothing was created".
  if (files.length) {
    try {
      step.value = files.length === 1 ? 'Uploading the photo...' : `Uploading ${files.length} photos...`
      const formData = new FormData()
      files.forEach((file) => formData.append('images[]', file))
      await $customFetch(`/employee/drop-off-receipts/${id}/images`, { method: 'POST', body: formData })
    } catch (e) {
      console.error(e)
      toast.error('Receipt created, but the photos failed. Add them and send it from here.')
      router.push(`${listPath}/${id}`)
      return
    }
  }

  try {
    step.value = 'Sending the email...'
    await $customFetch(`/employee/drop-off-receipts/${id}/send-email`, { method: 'POST' })
    toast.success('Receipt created and emailed to the customer')
  } catch (e) {
    console.error(e)
    toast.error('Receipt created, but the email failed. Send it from here.')
  }

  // submitting stays true — we're navigating away, and releasing the button
  // first would let a fast second click file a duplicate.
  router.push(`${listPath}/${id}`)
}
</script>
