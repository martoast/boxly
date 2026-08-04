<template>
  <div>
    <div class="flex items-center gap-3 mb-6">
      <NuxtLink :to="listPath" class="p-2 rounded-full hover:bg-gray-100 transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
      </NuxtLink>
      <div>
        <h1 class="text-2xl font-extrabold text-gray-900">New drop-off receipt</h1>
        <p class="text-sm text-gray-500 mt-0.5">Attach the photos here. You email it once it's created.</p>
      </div>
    </div>

    <AdminDropOffReceiptForm :submitting="submitting" @submit="onSubmit" />
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

const onSubmit = async (form, files = []) => {
  submitting.value = true

  let id
  try {
    const res = await $customFetch('/employee/drop-off-receipts', { method: 'POST', body: form })
    id = res.data.id
  } catch (e) {
    console.error(e)
    toast.error(e?.data?.message ?? 'Could not create the receipt')
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
      await $customFetch(`/employee/drop-off-receipts/${id}/images`, { method: 'POST', body: formData })
    } catch (e) {
      console.error(e)
      toast.error('Receipt created, but the photos failed to upload. Add them here.')
      router.push(`${listPath}/${id}`)
      return
    }
  }

  toast.success('Receipt created')
  // Deliberately leave submitting true — we're navigating away, and releasing
  // the button first would let a fast second click create a duplicate.
  router.push(`${listPath}/${id}`)
}
</script>
