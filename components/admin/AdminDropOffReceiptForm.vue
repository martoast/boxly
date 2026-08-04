<template>
  <form @submit.prevent="onSubmit" class="space-y-6">
    <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
      <div>
        <label class="block text-sm font-semibold text-gray-900 mb-1">{{ t.customer }} <span class="text-red-500">*</span></label>
        <AdminCustomerSearch
          v-model="customerName"
          :endpoint="`${apiNs}/customers`"
          :placeholder="t.customerPlaceholder"
          @select="onSelectCustomer"
        />
        <p v-if="form.user_id" class="text-xs text-green-600 mt-1 font-medium">{{ selectedLabel }}</p>
        <p v-else class="text-xs text-gray-400 mt-1">{{ t.customerHint }}</p>
      </div>

      <div>
        <label class="block text-sm font-semibold text-gray-900 mb-1">{{ t.date }} <span class="text-red-500">*</span></label>
        <input
          v-model="form.dropped_off_at"
          type="date"
          required
          class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <p class="text-xs text-gray-400 mt-1">{{ t.dateHint }}</p>
      </div>

      <div>
        <label class="block text-sm font-semibold text-gray-900 mb-1">{{ t.contents }} <span class="text-red-500">*</span></label>
        <textarea
          v-model="form.description"
          rows="5"
          required
          :placeholder="t.contentsPlaceholder"
          class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        ></textarea>
        <p class="text-xs text-gray-400 mt-1">{{ t.contentsHint }}</p>
      </div>

      <!-- One photo section for both modes. Creating stages files locally (no
           receipt to attach them to yet); editing uploads and removes straight
           away. Identical to look at either way. -->
      <div>
        <label class="block text-sm font-semibold text-gray-900 mb-1">{{ t.photos }}</label>

        <div v-if="thumbnails.length" class="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
          <div v-for="thumb in thumbnails" :key="thumb.key" class="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
            <img :src="thumb.url" alt="" class="w-full h-full object-cover" />
            <button
              type="button"
              :disabled="busyPhotos"
              class="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-red-600 transition-colors disabled:opacity-50"
              @click="removeThumbnail(thumb)"
            >
              ×
            </button>
          </div>
        </div>

        <label
          class="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
          :class="busyPhotos && 'opacity-50 pointer-events-none'"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.66-.9l.82-1.2A2 2 0 0110.07 4h3.86a2 2 0 011.66.9l.82 1.2a2 2 0 001.66.9H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          {{ busyPhotos ? t.uploading : (thumbnails.length ? t.addMorePhotos : t.addPhotos) }}
          <input type="file" accept="image/*" multiple class="hidden" @change="onPickFiles" />
        </label>
        <p class="text-xs text-gray-400 mt-1">{{ t.photosHint }}</p>
      </div>
    </div>

    <div class="flex justify-end gap-3">
      <NuxtLink :to="cancelTo" class="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50">{{ t.cancel }}</NuxtLink>
      <button
        type="submit"
        :disabled="submitting || !form.user_id"
        class="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 transition-colors"
      >
        {{ submitting ? t.saving : (existingReceipt ? t.saveChanges : t.create) }}
      </button>
    </div>
  </form>
</template>

<script setup>
import AdminCustomerSearch from '~/components/admin/AdminCustomerSearch.vue'

const props = defineProps({
  existingReceipt: { type: Object, default: null },
  // Owned by the page, because only the page knows when the whole sequence
  // (create, upload photos, send the email) has actually finished. `emit` is
  // not awaitable, so a local flag would re-enable the button mid-flight and
  // a second click would file a second receipt — and send a second email.
  submitting: { type: Boolean, default: false },
  // Edit mode only: a photo upload/removal is in flight.
  busyPhotos: { type: Boolean, default: false },
  cancelTo: { type: String, default: '' },
})
const emit = defineEmits(['submit', 'upload-images', 'remove-image'])

const route = useRoute()
// Same namespace trick AdminStoreForm uses: one component, two mount points.
const isEmployee = computed(() => route.path.includes('/employee/'))
const apiNs = computed(() => (isEmployee.value ? '/employee' : '/admin'))

// Warehouse UI is English (Mau), admin UI is Spanish.
const t = computed(() => (isEmployee.value
  ? {
      customer: 'Customer',
      customerPlaceholder: 'Search by name, email or phone...',
      customerHint: 'Pick the customer who dropped the items off.',
      selected: 'Selected',
      date: 'Drop-off date',
      dateHint: 'The day they actually handed the items over.',
      contents: 'What they dropped off',
      contentsPlaceholder: '2 boxes of Nike sneakers\n1 Coach bag',
      contentsHint: 'One item per line works well — this text goes in their receipt email.',
      photos: 'Photos (optional)',
      addPhotos: 'Add photos',
      addMorePhotos: 'Add more',
      uploading: 'Uploading...',
      photosHint: 'They show up in the customer\'s receipt email.',
      cancel: 'Cancel',
      saving: 'Saving...',
      saveChanges: 'Save changes',
      create: 'Create and send receipt',
    }
  : {
      customer: 'Cliente',
      customerPlaceholder: 'Buscar por nombre, email o teléfono...',
      customerHint: 'Selecciona el cliente que hizo la entrega.',
      selected: 'Seleccionado',
      date: 'Fecha de entrega',
      dateHint: 'El día en que realmente entregaron las cosas.',
      contents: 'Qué entregaron',
      contentsPlaceholder: '2 cajas de tenis Nike\n1 bolsa Coach',
      contentsHint: 'Una cosa por línea funciona bien — este texto va en el correo del cliente.',
      photos: 'Fotos (opcional)',
      addPhotos: 'Agregar fotos',
      addMorePhotos: 'Agregar más',
      uploading: 'Subiendo...',
      photosHint: 'Aparecen en el correo del recibo que recibe el cliente.',
      cancel: 'Cancelar',
      saving: 'Guardando...',
      saveChanges: 'Guardar cambios',
      create: 'Crear y enviar recibo',
    }))

const todayLocal = () => {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const customerName = ref('')
const customerEmail = ref('')
// The name exactly as it was when a customer was picked from the dropdown.
const pickedName = ref('')

const form = ref({
  user_id: null,
  description: '',
  dropped_off_at: todayLocal(),
})

watch(() => props.existingReceipt, (r) => {
  if (r) {
    customerName.value = r.user?.name ?? ''
    customerEmail.value = r.user?.email ?? ''
    pickedName.value = r.user?.name ?? ''
    form.value = {
      user_id: r.user_id,
      description: r.description ?? '',
      // API returns an ISO datetime for a date cast — keep just the date part.
      dropped_off_at: (r.dropped_off_at ?? '').slice(0, 10) || todayLocal(),
    }
  }
}, { immediate: true })

const selectedLabel = computed(() =>
  `${t.value.selected}: ${customerName.value}${customerEmail.value ? ` (${customerEmail.value})` : ''}`
)

const onSelectCustomer = (customer) => {
  form.value.user_id = customer.id
  customerEmail.value = customer.email ?? ''
  pickedName.value = customer.name ?? ''
}

// Typing over a chosen customer drops the selection, so we can never submit a
// user_id that no longer matches the name on screen.
watch(customerName, (name) => {
  if (name !== pickedName.value) {
    form.value.user_id = null
    customerEmail.value = ''
  }
})

// Photos picked before the receipt exists. They can't be uploaded yet — the
// storage path is keyed by receipt number — so they're held as Files with a
// local preview URL and handed to the page to upload right after create.
const staged = ref([])

const thumbnails = computed(() =>
  props.existingReceipt
    ? (props.existingReceipt.images ?? []).map((img) => ({ key: img.path, url: img.url, image: img }))
    : staged.value.map((item, i) => ({ key: item.url, url: item.url, index: i }))
)

const onPickFiles = (e) => {
  const files = Array.from(e.target.files ?? [])
  e.target.value = ''
  if (!files.length) return

  if (props.existingReceipt) {
    emit('upload-images', files)   // receipt exists — send them up now
  } else {
    files.forEach((file) => staged.value.push({ file, url: URL.createObjectURL(file) }))
  }
}

const removeThumbnail = (thumb) => {
  if (thumb.image) {
    emit('remove-image', thumb.image)
  } else {
    URL.revokeObjectURL(staged.value[thumb.index].url)
    staged.value.splice(thumb.index, 1)
  }
}

onUnmounted(() => staged.value.forEach((item) => URL.revokeObjectURL(item.url)))

const onSubmit = () => {
  if (!form.value.user_id || props.submitting) return
  emit('submit', { ...form.value }, staged.value.map((item) => item.file))
}
</script>
