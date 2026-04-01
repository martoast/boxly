<template>
  <div>
    <!-- Back -->
    <NuxtLink to="/app/employee/packages" class="inline-flex items-center text-sm text-gray-500 mb-4">
      ← Back to queue
    </NuxtLink>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-12 text-gray-400">Loading...</div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-12 text-red-500">{{ error }}</div>

    <!-- Done state -->
    <div v-else-if="done" class="text-center py-16">
      <div class="text-5xl mb-4">✓</div>
      <h2 class="text-xl font-bold text-gray-900 mb-2">All done!</h2>
      <p class="text-gray-500 mb-6">Photos uploaded. Customer has been notified.</p>
      <NuxtLink
        to="/app/employee/packages"
        class="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl font-medium"
      >
        Back to queue
      </NuxtLink>
    </div>

    <template v-else-if="order">
      <!-- Header -->
      <div class="bg-white rounded-xl border border-gray-200 p-4 mb-4 shadow-sm">
        <p class="text-lg font-bold text-gray-900">{{ order.user?.name }}</p>
        <p class="text-gray-400 text-sm">Order #{{ order.order_number }}</p>
        <div class="mt-3">
          <div class="flex justify-between text-xs text-gray-400 mb-1">
            <span>{{ arrivedCount }} / {{ order.items?.length }} items arrived</span>
          </div>
          <div class="w-full bg-gray-100 rounded-full h-2">
            <div
              class="bg-green-500 h-2 rounded-full transition-all"
              :style="{ width: order.items?.length > 0 ? `${(arrivedCount / order.items.length) * 100}%` : '0%' }"
            />
          </div>
        </div>
      </div>

      <!-- Items -->
      <div class="space-y-3 mb-6">
        <div
          v-for="item in order.items"
          :key="item.id"
          class="bg-white rounded-xl border p-4 shadow-sm"
          :class="item.arrived ? 'border-green-200 bg-green-50' : 'border-gray-200'"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1 pr-3">
              <p class="font-medium text-gray-900">{{ item.name || 'Package' }}</p>
              <p v-if="item.tracking_number" class="text-xs text-gray-400 mt-0.5">
                {{ item.tracking_number }}
              </p>
            </div>
            <span v-if="item.arrived" class="text-green-600 text-sm font-medium shrink-0">
              ✓ Arrived
            </span>
            <button
              v-else
              class="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg font-medium shrink-0 active:bg-blue-700"
              :disabled="markingItemId === item.id"
              @click="openWeightModal(item)"
            >
              {{ markingItemId === item.id ? '...' : 'Mark arrived' }}
            </button>
          </div>
          <p v-if="item.arrived && item.weight" class="text-xs text-gray-400 mt-1">
            Weight: {{ item.weight }} lbs
          </p>
        </div>
      </div>

      <!-- Upload photos — shown when all items arrived and no photos yet -->
      <div v-if="allItemsArrived && !hasUploadedPhotos" class="space-y-4">

        <!-- Label photos -->
        <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 class="font-bold text-gray-900 text-base mb-1">📦 Box label photos</h2>
          <p class="text-gray-500 text-sm mb-3">Take a photo of the shipping label on each box. You can select multiple.</p>
          <label class="block w-full">
            <span class="block w-full text-center border-2 border-dashed border-gray-300 text-gray-600 py-3 rounded-xl text-sm cursor-pointer active:bg-gray-50">
              {{ labelFiles.length > 0 ? `${labelFiles.length} photo(s) selected` : '📷 Select label photos' }}
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              class="hidden"
              @change="onLabelFilesChange"
            />
          </label>
          <!-- Thumbnails -->
          <div v-if="labelFiles.length > 0" class="flex gap-2 mt-3 flex-wrap">
            <div
              v-for="(f, i) in labelFiles"
              :key="i"
              class="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100"
            >
              <img :src="labelPreviews[i]" class="w-full h-full object-cover" />
              <button
                class="absolute top-0 right-0 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-bl"
                @click="removeLabelFile(i)"
              >✕</button>
            </div>
          </div>
        </div>

        <!-- Contents photo -->
        <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 class="font-bold text-gray-900 text-base mb-1">🗂 Contents photo</h2>
          <p class="text-gray-500 text-sm mb-3">Lay out all the items and take one photo of everything together.</p>
          <label class="block w-full">
            <span class="block w-full text-center border-2 border-dashed border-gray-300 text-gray-600 py-3 rounded-xl text-sm cursor-pointer active:bg-gray-50">
              {{ contentsFile ? 'Photo selected ✓' : '📷 Select contents photo' }}
            </span>
            <input
              type="file"
              accept="image/*"
              class="hidden"
              @change="onContentsFileChange"
            />
          </label>
          <!-- Thumbnail -->
          <div v-if="contentsFile" class="mt-3 relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
            <img :src="contentsPreview" class="w-full h-full object-cover" />
            <button
              class="absolute top-0 right-0 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-bl"
              @click="removeContentsFile"
            >✕</button>
          </div>
        </div>

        <!-- Upload button -->
        <button
          class="w-full py-4 rounded-xl font-semibold text-base transition-colors"
          :class="canUpload ? 'bg-blue-600 text-white active:bg-blue-700' : 'bg-gray-100 text-gray-400'"
          :disabled="!canUpload || uploading"
          @click="handleUpload"
        >
          {{ uploading ? 'Uploading...' : `Upload ${totalPhotoCount} photo${totalPhotoCount !== 1 ? 's' : ''}` }}
        </button>

        <p v-if="uploadError" class="text-red-500 text-sm text-center">{{ uploadError }}</p>
      </div>

      <!-- Photos already uploaded -->
      <div v-else-if="hasUploadedPhotos" class="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
        <p class="text-green-700 font-medium">Photos uploaded ✓</p>
      </div>
    </template>

    <!-- Weight modal -->
    <div v-if="showWeightModal" class="fixed inset-0 bg-black/50 flex items-end z-50" @click.self="closeWeightModal">
      <div class="bg-white w-full rounded-t-2xl p-6">
        <h3 class="font-bold text-gray-900 text-lg mb-1">Mark as arrived</h3>
        <p class="text-gray-500 text-sm mb-4">{{ pendingItem?.name || 'Package' }}</p>

        <label class="block text-sm font-medium text-gray-700 mb-1">Weight (lbs) — optional</label>
        <input
          v-model="weight"
          type="number"
          inputmode="decimal"
          placeholder="e.g. 2.5"
          min="0"
          step="0.1"
          class="w-full border border-gray-300 rounded-lg px-4 py-3 text-base mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div class="flex gap-3">
          <button
            class="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium"
            @click="closeWeightModal"
          >
            Cancel
          </button>
          <button
            class="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold active:bg-blue-700"
            :disabled="markingItemId !== null"
            @click="confirmMarkArrived"
          >
            {{ markingItemId ? 'Saving...' : 'Confirm arrived' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'employee',
  middleware: ['auth', 'employee'],
})

const { $customFetch } = useNuxtApp()
const route = useRoute()

const order = ref(null)
const loading = ref(true)
const error = ref(null)
const done = ref(false)

const markingItemId = ref(null)
const uploading = ref(false)
const uploadError = ref(null)

// Weight modal
const showWeightModal = ref(false)
const pendingItem = ref(null)
const weight = ref('')

// Photo selection state
const labelFiles = ref([])
const labelPreviews = ref([])
const contentsFile = ref(null)
const contentsPreview = ref(null)

const arrivedCount = computed(() =>
  order.value?.items?.filter(i => i.arrived).length ?? 0
)
const allItemsArrived = computed(() =>
  order.value?.items?.length > 0 &&
  arrivedCount.value === order.value.items.length
)
const hasUploadedPhotos = computed(() =>
  order.value?.arrival_images?.length > 0 || !!order.value?.arrival_image_url
)
const canUpload = computed(() => labelFiles.value.length > 0 && contentsFile.value !== null)
const totalPhotoCount = computed(() => labelFiles.value.length + (contentsFile.value ? 1 : 0))

const fetchOrder = async () => {
  loading.value = true
  error.value = null
  try {
    const data = await $customFetch(`/employee/orders/${route.params.id}`)
    order.value = data.data
  } catch {
    error.value = 'Could not load order.'
  } finally {
    loading.value = false
  }
}

const openWeightModal = (item) => {
  pendingItem.value = item
  weight.value = ''
  showWeightModal.value = true
}

const closeWeightModal = () => {
  showWeightModal.value = false
  pendingItem.value = null
  weight.value = ''
}

const confirmMarkArrived = async () => {
  if (!pendingItem.value) return
  const item = pendingItem.value
  markingItemId.value = item.id
  closeWeightModal()

  try {
    const body = {}
    if (weight.value !== '' && !isNaN(parseFloat(weight.value))) {
      body.weight = parseFloat(weight.value)
    }
    const data = await $customFetch(
      `/employee/orders/${order.value.id}/items/${item.id}/arrived`,
      { method: 'PUT', body }
    )
    order.value = data.data.order
  } catch (err) {
    error.value = err?.data?.message ?? 'Failed to mark item as arrived.'
  } finally {
    markingItemId.value = null
  }
}

// File selection helpers
const onLabelFilesChange = (e) => {
  const files = Array.from(e.target.files ?? [])
  labelFiles.value = [...labelFiles.value, ...files]
  files.forEach(f => {
    const reader = new FileReader()
    reader.onload = (ev) => labelPreviews.value.push(ev.target.result)
    reader.readAsDataURL(f)
  })
  e.target.value = ''
}

const removeLabelFile = (i) => {
  labelFiles.value.splice(i, 1)
  labelPreviews.value.splice(i, 1)
}

const onContentsFileChange = (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  contentsFile.value = file
  const reader = new FileReader()
  reader.onload = (ev) => { contentsPreview.value = ev.target.result }
  reader.readAsDataURL(file)
  e.target.value = ''
}

const removeContentsFile = () => {
  contentsFile.value = null
  contentsPreview.value = null
}

const handleUpload = async () => {
  if (!canUpload.value) return
  uploading.value = true
  uploadError.value = null

  try {
    const formData = new FormData()
    labelFiles.value.forEach(f => formData.append('labels[]', f))
    formData.append('contents', contentsFile.value)

    await $customFetch(`/employee/orders/${order.value.id}/arrival-images`, {
      method: 'POST',
      body: formData,
    })
    done.value = true
  } catch (err) {
    uploadError.value = err?.data?.message ?? 'Upload failed. Please try again.'
  } finally {
    uploading.value = false
  }
}

onMounted(fetchOrder)
</script>
