<template>
  <section :class="isEmployee ? '' : 'min-h-screen bg-gray-50 py-6'">
    <div :class="isEmployee ? '' : 'max-w-2xl mx-auto px-4 sm:px-6 lg:px-8'">
      <div class="flex items-center gap-3 mb-6">
        <NuxtLink :to="basePath" class="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
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

      <div v-else class="space-y-4">
        <!-- Did the customer actually get it? The one question this page has to
             answer at a glance, so it sits above the receipt itself. -->
        <div
          class="rounded-2xl border p-4 flex items-start justify-between gap-4"
          :class="receipt.email_sent_at ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'"
        >
          <div class="flex items-start gap-3 min-w-0">
            <svg v-if="receipt.email_sent_at" class="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            <svg v-else class="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
            <div class="min-w-0">
              <p class="text-sm font-semibold" :class="receipt.email_sent_at ? 'text-green-800' : 'text-amber-800'">
                {{ receipt.email_sent_at ? t.sentTo : t.notSentTitle }}
                <span v-if="receipt.email_sent_at" class="font-normal">{{ receipt.user?.email }}</span>
              </p>
              <p class="text-xs mt-0.5" :class="receipt.email_sent_at ? 'text-green-700' : 'text-amber-700'">
                {{ receipt.email_sent_at ? formatDateTime(receipt.email_sent_at) : t.notSentHint }}
              </p>
            </div>
          </div>
          <button
            type="button"
            :disabled="sending"
            class="shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
            :class="receipt.email_sent_at
              ? 'border border-green-200 text-green-800 hover:bg-green-100'
              : 'bg-primary-500 hover:bg-primary-600 text-white'"
            @click="onSendEmail"
          >
            {{ sending ? t.sending : (receipt.email_sent_at ? t.resend : t.send) }}
          </button>
        </div>

        <!-- The receipt itself, as a document -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
          <div class="p-5">
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{{ t.customer }}</p>
            <p class="text-base font-semibold text-gray-900">{{ receipt.user?.name ?? '—' }}</p>
            <p class="text-sm text-gray-500">{{ receipt.user?.email }}</p>
          </div>

          <div class="p-5">
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{{ t.date }}</p>
            <p class="text-base text-gray-900">{{ formatLongDate(receipt.dropped_off_at) }}</p>
          </div>

          <div class="p-5">
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{{ t.contents }}</p>
            <p class="text-base text-gray-900 whitespace-pre-line leading-relaxed">{{ receipt.description }}</p>
          </div>

          <div class="p-5">
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              {{ t.photos }}<span v-if="images.length" class="text-gray-300"> · {{ images.length }}</span>
            </p>
            <p v-if="!images.length" class="text-sm text-gray-400">{{ t.noPhotos }}</p>
            <div v-else class="grid grid-cols-3 sm:grid-cols-4 gap-3">
              <a
                v-for="img in images"
                :key="img.path"
                :href="img.url"
                target="_blank"
                rel="noopener"
                class="aspect-square rounded-xl overflow-hidden bg-gray-100 block hover:opacity-90 transition-opacity"
              >
                <img :src="img.url" :alt="img.filename" class="w-full h-full object-cover" />
              </a>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between gap-4 px-1">
          <p class="text-xs text-gray-400">
            {{ t.createdBy }} {{ receipt.creator?.name ?? '—' }} · {{ formatLongDate(receipt.created_at) }}
          </p>
          <div class="flex items-center gap-4 shrink-0">
            <NuxtLink :to="`${basePath}/${receipt.id}/edit`" class="text-sm font-semibold text-primary-600 hover:text-primary-700">
              {{ t.edit }}
            </NuxtLink>
            <button type="button" class="text-sm font-medium text-red-600 hover:text-red-700" @click="onDelete">
              {{ t.delete }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
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
      sentTo: 'Emailed to',
      notSentTitle: 'Not emailed yet',
      notSentHint: 'The customer has no confirmation for this drop-off.',
      send: 'Send',
      resend: 'Resend',
      sending: 'Sending...',
      customer: 'Customer',
      date: 'Drop-off date',
      contents: 'What they dropped off',
      photos: 'Photos',
      noPhotos: 'No photos.',
      createdBy: 'Created by',
      edit: 'Edit',
      delete: 'Delete',
      confirmDelete: 'Delete this receipt? This cannot be undone.',
      deleted: 'Receipt deleted',
      locale: 'en-US',
    }
  : {
      title: 'Recibo de entrega',
      loading: 'Cargando...',
      notFound: 'Recibo no encontrado.',
      sentTo: 'Enviado a',
      notSentTitle: 'Aún no se ha enviado',
      notSentHint: 'El cliente no tiene comprobante de esta entrega.',
      send: 'Enviar',
      resend: 'Reenviar',
      sending: 'Enviando...',
      customer: 'Cliente',
      date: 'Fecha de entrega',
      contents: 'Qué entregaron',
      photos: 'Fotos',
      noPhotos: 'Sin fotos.',
      createdBy: 'Creado por',
      edit: 'Editar',
      delete: 'Eliminar',
      confirmDelete: '¿Eliminar este recibo? No se puede deshacer.',
      deleted: 'Recibo eliminado',
      locale: 'es-MX',
    }))

const receipt = ref(null)
const loading = ref(true)
const sending = ref(false)

const images = computed(() => receipt.value?.images ?? [])

// dropped_off_at is a DATE the API serialises as midnight UTC. Handing that to
// new Date() and formatting it locally rolls it back a day west of Greenwich —
// so build the date from its own Y-M-D parts instead.
const formatLongDate = (value) => {
  if (!value) return '—'
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(t.value.locale, {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

// email_sent_at is a real timestamp — local conversion is correct here.
const formatDateTime = (value) => (value
  ? new Date(value).toLocaleString(t.value.locale, {
      day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit',
    })
  : '')

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
