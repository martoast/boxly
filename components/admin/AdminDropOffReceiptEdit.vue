<template>
  <section :class="isEmployee ? '' : 'min-h-screen bg-gray-50 py-6'">
    <div :class="isEmployee ? '' : 'max-w-2xl mx-auto px-4 sm:px-6 lg:px-8'">
      <div class="flex items-center gap-3 mb-6">
        <NuxtLink :to="detailPath" class="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        </NuxtLink>
        <div class="min-w-0">
          <h1 class="text-2xl font-extrabold text-gray-900 leading-tight">{{ t.title }}</h1>
          <p v-if="receipt" class="text-xs text-gray-400 font-mono tracking-wide">{{ receipt.receipt_number }}</p>
        </div>
      </div>

      <div v-if="loading" class="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">{{ t.loading }}</div>

      <div v-else-if="!receipt" class="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <p class="text-gray-700 font-semibold">{{ t.notFound }}</p>
      </div>

      <template v-else>
        <!-- Edits after sending don't reach the inbox the customer already has. -->
        <div v-if="receipt.email_sent_at" class="mb-4 rounded-2xl border border-amber-100 bg-amber-50 p-4">
          <p class="text-sm text-amber-800">{{ t.alreadySent }}</p>
        </div>

        <AdminDropOffReceiptForm
          :existing-receipt="receipt"
          :submitting="saving"
          :busy-photos="busyPhotos"
          :cancel-to="detailPath"
          @submit="onSave"
          @upload-images="onUploadImages"
          @remove-image="onRemoveImage"
        />
      </template>
    </div>
  </section>
</template>

<script setup>
import AdminDropOffReceiptForm from '~/components/admin/AdminDropOffReceiptForm.vue'

const { $customFetch } = useNuxtApp()
const route = useRoute()
const router = useRouter()
const toast = useToast()

const isEmployee = computed(() => route.path.includes('/employee/'))
const apiNs = computed(() => (isEmployee.value ? '/employee' : '/admin'))
const basePath = computed(() =>
  isEmployee.value ? '/app/employee/drop-off-receipts' : '/app/admin/drop-off-receipts'
)
const detailPath = computed(() => `${basePath.value}/${route.params.id}`)

const t = computed(() => (isEmployee.value
  ? {
      title: 'Edit receipt',
      loading: 'Loading...',
      notFound: 'Receipt not found.',
      alreadySent: 'This receipt was already emailed. Changes here won\'t reach the copy the customer has — resend it from the receipt page if they need the corrected one.',
      saved: 'Receipt updated',
    }
  : {
      title: 'Editar recibo',
      loading: 'Cargando...',
      notFound: 'Recibo no encontrado.',
      alreadySent: 'Este recibo ya se envió por correo. Los cambios aquí no llegan a la copia que tiene el cliente — reenvíalo desde la página del recibo si necesita la versión corregida.',
      saved: 'Recibo actualizado',
    }))

const receipt = ref(null)
const loading = ref(true)
const saving = ref(false)
const busyPhotos = ref(false)

const fetchReceipt = async () => {
  loading.value = true
  try {
    const res = await $customFetch(`${apiNs.value}/drop-off-receipts/${route.params.id}`)
    receipt.value = res.data ?? null
  } catch (e) {
    console.error(e)
    receipt.value = null
  } finally {
    loading.value = false
  }
}

const onSave = async (form) => {
  saving.value = true
  try {
    await $customFetch(`${apiNs.value}/drop-off-receipts/${route.params.id}`, {
      method: 'PUT',
      body: form,
    })
    toast.success(t.value.saved)
    router.push(detailPath.value)
  } catch (e) {
    toast.error(e?.data?.message || 'Error')
    saving.value = false
  }
}

const onUploadImages = async (files) => {
  busyPhotos.value = true
  try {
    const formData = new FormData()
    files.forEach((file) => formData.append('images[]', file))
    const res = await $customFetch(`${apiNs.value}/drop-off-receipts/${route.params.id}/images`, {
      method: 'POST',
      body: formData,
    })
    receipt.value = res.data ?? receipt.value
  } catch (e) {
    toast.error(e?.data?.message || 'Error')
  } finally {
    busyPhotos.value = false
  }
}

const onRemoveImage = async (image) => {
  busyPhotos.value = true
  try {
    const res = await $customFetch(`${apiNs.value}/drop-off-receipts/${route.params.id}/images`, {
      method: 'DELETE',
      body: { path: image.path },
    })
    receipt.value = res.data ?? receipt.value
  } catch (e) {
    toast.error(e?.data?.message || 'Error')
  } finally {
    busyPhotos.value = false
  }
}

onMounted(fetchReceipt)
</script>
