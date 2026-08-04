<template>
  <section :class="isEmployee ? '' : 'min-h-screen bg-gray-50 py-6'">
    <div :class="isEmployee ? '' : 'max-w-3xl mx-auto px-4 sm:px-6 lg:px-8'">
      <div class="flex items-center gap-3 mb-6">
        <NuxtLink :to="basePath" class="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        </NuxtLink>
        <div>
          <h1 class="text-2xl font-extrabold text-gray-900">{{ t.title }}</h1>
          <p v-if="receipt" class="text-xs text-gray-400 font-mono mt-0.5">{{ receipt.receipt_number }}</p>
        </div>
      </div>

      <div v-if="loading" class="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">{{ t.loading }}</div>

      <div v-else-if="!receipt" class="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <p class="text-gray-700 font-semibold">{{ t.notFound }}</p>
      </div>

      <div v-else class="space-y-6">
        <AdminDropOffReceiptForm :existing-receipt="receipt" :submitting="saving" @submit="onSave" />

        <!-- Photos -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div class="flex items-center justify-between gap-3 mb-4">
            <h2 class="text-sm font-semibold text-gray-900">{{ t.photos }}</h2>
            <label class="text-sm font-medium text-primary-600 hover:text-primary-700 cursor-pointer">
              {{ uploading ? t.uploading : t.addPhotos }}
              <input type="file" accept="image/*" multiple class="hidden" :disabled="uploading" @change="onFiles" />
            </label>
          </div>

          <p v-if="images.length === 0" class="text-sm text-gray-400">{{ t.noPhotos }}</p>

          <div v-else class="grid grid-cols-3 sm:grid-cols-4 gap-3">
            <div v-for="img in images" :key="img.path" class="relative group aspect-square rounded-xl overflow-hidden bg-gray-100">
              <a :href="img.url" target="_blank" rel="noopener">
                <img :src="img.url" :alt="img.filename" class="w-full h-full object-cover" />
              </a>
              <button
                type="button"
                :disabled="deletingPath === img.path"
                class="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-red-600 transition-colors disabled:opacity-50"
                @click="onDeleteImage(img)"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        <!-- Send email -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div class="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 class="text-sm font-semibold text-gray-900">{{ t.emailTitle }}</h2>
              <p v-if="receipt.email_sent_at" class="text-xs text-green-600 mt-1 font-medium">
                {{ t.sentOn }} {{ formatDateTime(receipt.email_sent_at) }}
              </p>
              <p v-else class="text-xs text-gray-400 mt-1">{{ t.emailHint }}</p>
              <p class="text-xs text-gray-400 mt-0.5">{{ receipt.user?.email }}</p>
            </div>
            <button
              type="button"
              :disabled="sending"
              class="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 transition-colors"
              @click="onSendEmail"
            >
              {{ sending ? t.sending : (receipt.email_sent_at ? t.resend : t.send) }}
            </button>
          </div>
        </div>

        <!-- Delete -->
        <div class="flex justify-end">
          <button type="button" class="text-sm text-red-600 hover:text-red-700 font-medium" @click="onDelete">
            {{ t.delete }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import AdminDropOffReceiptForm from '~/components/admin/AdminDropOffReceiptForm.vue'

const { $customFetch } = useNuxtApp()
const route = useRoute()
const toast = useToast()

const isEmployee = computed(() => route.path.includes('/employee/'))
const apiNs = computed(() => (isEmployee.value ? '/employee' : '/admin'))
const basePath = computed(() =>
  isEmployee.value ? '/app/employee/drop-off-receipts' : '/app/admin/drop-off-receipts'
)

const t = computed(() => (isEmployee.value
  ? {
      title: 'Drop-off receipt',
      loading: 'Loading...',
      notFound: 'Receipt not found.',
      photos: 'Photos',
      addPhotos: '+ Add photos',
      uploading: 'Uploading...',
      noPhotos: 'No photos yet. Add a few so the customer can see what we received.',
      emailTitle: 'Send to customer',
      emailHint: 'Not emailed yet. Add the photos first, then send.',
      sentOn: 'Emailed on',
      send: 'Send email',
      resend: 'Resend email',
      sending: 'Sending...',
      delete: 'Delete receipt',
      confirmDelete: 'Delete this receipt? This cannot be undone.',
      saved: 'Receipt updated',
      deleted: 'Receipt deleted',
    }
  : {
      title: 'Recibo de entrega',
      loading: 'Cargando...',
      notFound: 'Recibo no encontrado.',
      photos: 'Fotos',
      addPhotos: '+ Agregar fotos',
      uploading: 'Subiendo...',
      noPhotos: 'Sin fotos todavía. Agrega algunas para que el cliente vea lo que recibimos.',
      emailTitle: 'Enviar al cliente',
      emailHint: 'Aún no se ha enviado. Agrega las fotos y luego envía.',
      sentOn: 'Enviado el',
      send: 'Enviar por correo',
      resend: 'Reenviar correo',
      sending: 'Enviando...',
      delete: 'Eliminar recibo',
      confirmDelete: '¿Eliminar este recibo? No se puede deshacer.',
      saved: 'Recibo actualizado',
      deleted: 'Recibo eliminado',
    }))

const receipt = ref(null)
const loading = ref(true)
const saving = ref(false)
const uploading = ref(false)
const sending = ref(false)
const deletingPath = ref(null)

const images = computed(() => receipt.value?.images ?? [])

const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : '')

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
    const res = await $customFetch(`${apiNs.value}/drop-off-receipts/${route.params.id}`, {
      method: 'PUT',
      body: form,
    })
    receipt.value = res.data ?? receipt.value
    toast.success(t.value.saved)
  } catch (e) {
    toast.error(e?.data?.message || 'Error')
  } finally {
    saving.value = false
  }
}

const onFiles = async (e) => {
  const files = Array.from(e.target.files ?? [])
  if (!files.length) return

  uploading.value = true
  try {
    const formData = new FormData()
    files.forEach((file) => formData.append('images[]', file))

    const res = await $customFetch(`${apiNs.value}/drop-off-receipts/${route.params.id}/images`, {
      method: 'POST',
      body: formData,
    })
    receipt.value = res.data ?? receipt.value
  } catch (err) {
    toast.error(err?.data?.message || 'Error')
  } finally {
    uploading.value = false
    e.target.value = ''
  }
}

const onDeleteImage = async (img) => {
  deletingPath.value = img.path
  try {
    const res = await $customFetch(`${apiNs.value}/drop-off-receipts/${route.params.id}/images`, {
      method: 'DELETE',
      body: { path: img.path },
    })
    receipt.value = res.data ?? receipt.value
  } catch (e) {
    toast.error(e?.data?.message || 'Error')
  } finally {
    deletingPath.value = null
  }
}

const onSendEmail = async () => {
  sending.value = true
  try {
    const res = await $customFetch(`${apiNs.value}/drop-off-receipts/${route.params.id}/send-email`, {
      method: 'POST',
    })
    receipt.value = res.data ?? receipt.value
    toast.success(res.message)
  } catch (e) {
    toast.error(e?.data?.message || 'Error')
  } finally {
    sending.value = false
  }
}

const onDelete = async () => {
  if (!confirm(t.value.confirmDelete)) return
  try {
    await $customFetch(`${apiNs.value}/drop-off-receipts/${route.params.id}`, { method: 'DELETE' })
    toast.success(t.value.deleted)
    await navigateTo(basePath.value)
  } catch (e) {
    toast.error(e?.data?.message || 'Error')
  }
}

onMounted(fetchReceipt)
</script>
