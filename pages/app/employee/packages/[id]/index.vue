<template>
  <div>
    <!-- Back -->
    <NuxtLink to="/app/employee/packages" class="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 transition-colors mb-5">
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      Back to queue
    </NuxtLink>

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-4 animate-pulse">
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div class="h-5 w-40 bg-gray-200 rounded mb-2" />
        <div class="h-3 w-28 bg-gray-100 rounded mb-4" />
        <div class="h-2 w-full bg-gray-100 rounded-full" />
      </div>
      <div v-for="i in 3" :key="i" class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div class="flex gap-3">
          <div class="h-14 w-14 bg-gray-100 rounded-xl shrink-0" />
          <div class="flex-1">
            <div class="h-4 w-32 bg-gray-200 rounded mb-2" />
            <div class="h-3 w-24 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
      <p class="text-red-600 font-medium">{{ error }}</p>
    </div>

    <!-- Done state -->
    <div v-else-if="done" class="text-center py-16">
      <div class="h-20 w-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-green-100">
        <svg class="h-10 w-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 class="text-xl font-extrabold text-gray-900 mb-2">All done!</h2>
      <p class="text-gray-500 text-sm mb-7">Photos uploaded. Customer has been notified.</p>
      <NuxtLink
        to="/app/employee/packages"
        class="inline-flex items-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:bg-primary-600 transition-all"
      >
        Back to queue
      </NuxtLink>
    </div>

    <template v-else-if="order">
      <!-- Order header card -->
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
        <div class="flex items-start justify-between mb-4">
          <div>
            <h1 class="text-lg font-extrabold text-gray-900">{{ order.user?.name }}</h1>
            <p class="text-xs font-mono text-gray-400 mt-0.5">{{ order.order_number }}</p>
          </div>
          <span
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border"
            :class="allItemsArrived
              ? 'bg-green-50 text-green-700 border-green-100'
              : 'bg-amber-50 text-amber-700 border-amber-100'"
          >
            <span class="h-1.5 w-1.5 rounded-full" :class="allItemsArrived ? 'bg-green-500' : 'bg-amber-400'" />
            {{ allItemsArrived ? 'All arrived' : `${arrivedCount} / ${order.items?.length} arrived` }}
          </span>
        </div>

        <!-- Progress bar -->
        <div>
          <div class="flex justify-between text-xs text-gray-400 mb-1.5">
            <span>Package progress</span>
            <span class="font-semibold" :class="allItemsArrived ? 'text-green-600' : 'text-primary-600'">
              {{ order.items?.length > 0 ? Math.round((arrivedCount / order.items.length) * 100) : 0 }}%
            </span>
          </div>
          <div class="w-full bg-gray-100 rounded-full h-2">
            <div
              class="h-2 rounded-full transition-all duration-700"
              :class="allItemsArrived ? 'bg-green-500' : 'bg-primary-500'"
              :style="{ width: order.items?.length > 0 ? `${(arrivedCount / order.items.length) * 100}%` : '0%' }"
            />
          </div>
        </div>
      </div>

      <!-- Items -->
      <div class="space-y-3 mb-6">
        <h2 class="text-xs font-semibold uppercase tracking-wider text-gray-400 px-1">
          Packages ({{ order.items?.length }})
        </h2>

        <div
          v-for="item in order.items"
          :key="item.id"
          class="bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-300"
          :class="item.arrived ? 'border-green-100' : 'border-gray-100'"
        >
          <!-- Arrived accent bar -->
          <div v-if="item.arrived" class="h-1 bg-gradient-to-r from-green-400 to-emerald-500" />

          <div class="p-4">
            <div class="flex gap-3">
              <!-- Product image -->
              <div class="shrink-0">
                <div
                  class="h-14 w-14 rounded-xl overflow-hidden border"
                  :class="item.arrived ? 'border-green-100' : 'border-gray-100'"
                >
                  <img
                    v-if="item.product_image_url"
                    :src="item.product_image_url"
                    :alt="item.product_name || 'Package'"
                    class="h-full w-full object-cover"
                    @error="(e) => e.target.style.display = 'none'"
                  />
                  <div v-else class="h-full w-full bg-gray-50 flex items-center justify-center">
                    <svg class="h-6 w-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                    </svg>
                  </div>
                </div>
              </div>

              <!-- Item info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2">
                  <p class="font-semibold text-gray-900 text-sm leading-tight truncate">
                    {{ item.product_name || item.name || 'Package' }}
                  </p>
                  <!-- Status -->
                  <span v-if="item.arrived" class="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-green-600">
                    <svg class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                    Arrived
                  </span>
                </div>

                <!-- Meta row 1: carrier + tracking -->
                <div v-if="item.tracking_number" class="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span
                    v-if="item.carrier"
                    class="inline-block px-1.5 py-0.5 bg-primary-50 text-primary-700 text-[10px] font-semibold rounded uppercase tracking-wide"
                  >
                    {{ item.carrier }}
                  </span>
                  <span class="font-mono text-xs text-gray-500 truncate">{{ item.tracking_number }}</span>
                </div>

                <!-- Meta row 2: value + weight -->
                <div class="flex items-center gap-3 mt-1.5 flex-wrap">
                  <span v-if="item.declared_value" class="text-xs text-gray-500">
                    💵 ${{ Number(item.declared_value).toFixed(2) }} USD
                  </span>
                  <span v-if="item.weight" class="text-xs text-gray-500">
                    ⚖️ {{ item.weight }} lbs
                  </span>
                  <span v-if="item.quantity && item.quantity > 1" class="text-xs text-gray-500">
                    ×{{ item.quantity }}
                  </span>
                </div>

                <!-- Arrived at -->
                <p v-if="item.arrived && item.arrived_at" class="text-[10px] text-gray-400 mt-1">
                  Marked arrived {{ formatDate(item.arrived_at) }}
                </p>
              </div>
            </div>

            <!-- Mark arrived button (full width below when not arrived) -->
            <button
              v-if="!item.arrived"
              class="mt-3 w-full py-2.5 bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-sm flex items-center justify-center gap-2"
              :disabled="markingItemId === item.id"
              @click="openWeightModal(item)"
            >
              <svg v-if="markingItemId !== item.id" class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <svg v-else class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {{ markingItemId === item.id ? 'Saving...' : 'Mark as arrived' }}
            </button>
          </div>
        </div>
      </div>

      <!-- ── UPLOAD SECTION ── shown when all items arrived + no photos yet -->
      <div v-if="allItemsArrived && !hasUploadedPhotos" class="space-y-4">
        <h2 class="text-xs font-semibold uppercase tracking-wider text-gray-400 px-1">Upload arrival photos</h2>

        <!-- Label photos -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div class="flex items-center gap-3 mb-3">
            <div class="h-9 w-9 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
              <svg class="h-5 w-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div>
              <p class="font-semibold text-gray-900 text-sm">Box label photos</p>
              <p class="text-xs text-gray-400">One photo per box — shows the shipping label</p>
            </div>
          </div>

          <label class="block w-full cursor-pointer">
            <div
              class="border-2 border-dashed rounded-xl py-3 px-4 text-center transition-colors"
              :class="labelFiles.length > 0 ? 'border-primary-200 bg-primary-50' : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50/50'"
            >
              <p class="text-sm font-medium" :class="labelFiles.length > 0 ? 'text-primary-600' : 'text-gray-500'">
                {{ labelFiles.length > 0 ? `${labelFiles.length} photo${labelFiles.length > 1 ? 's' : ''} selected` : '+ Add label photos' }}
              </p>
            </div>
            <input type="file" accept="image/*" multiple class="hidden" @change="onLabelFilesChange" />
          </label>

          <!-- Thumbnails -->
          <div v-if="labelFiles.length > 0" class="flex gap-2 mt-3 flex-wrap">
            <div
              v-for="(f, i) in labelFiles"
              :key="i"
              class="relative h-16 w-16 rounded-xl overflow-hidden bg-gray-100 border border-gray-200"
            >
              <img :src="labelPreviews[i]" class="h-full w-full object-cover" />
              <button
                class="absolute top-0.5 right-0.5 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] shadow"
                @click="removeLabelFile(i)"
              >✕</button>
            </div>
          </div>
        </div>

        <!-- Contents photo -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div class="flex items-center gap-3 mb-3">
            <div class="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <svg class="h-5 w-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p class="font-semibold text-gray-900 text-sm">Contents photo</p>
              <p class="text-xs text-gray-400">Lay out all items — take one photo of everything</p>
            </div>
          </div>

          <label class="block w-full cursor-pointer">
            <div
              class="border-2 border-dashed rounded-xl py-3 px-4 text-center transition-colors"
              :class="contentsFile ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50'"
            >
              <p class="text-sm font-medium" :class="contentsFile ? 'text-emerald-600' : 'text-gray-500'">
                {{ contentsFile ? 'Photo selected ✓' : '+ Add contents photo' }}
              </p>
            </div>
            <input type="file" accept="image/*" class="hidden" @change="onContentsFileChange" />
          </label>

          <!-- Thumbnail -->
          <div v-if="contentsFile" class="mt-3 relative h-16 w-16 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
            <img :src="contentsPreview" class="h-full w-full object-cover" />
            <button
              class="absolute top-0.5 right-0.5 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] shadow"
              @click="removeContentsFile"
            >✕</button>
          </div>
        </div>

        <!-- Upload CTA -->
        <button
          class="w-full py-4 rounded-xl font-bold text-base transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
          :class="canUpload
            ? 'bg-primary-500 hover:bg-primary-600 text-white hover:shadow-xl hover:-translate-y-0.5'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'"
          :disabled="!canUpload || uploading"
          @click="handleUpload"
        >
          <svg v-if="uploading" class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          {{ uploading ? 'Uploading...' : canUpload ? `Upload ${totalPhotoCount} photo${totalPhotoCount !== 1 ? 's' : ''}` : 'Select photos above to upload' }}
        </button>

        <p v-if="uploadError" class="text-red-500 text-sm text-center bg-red-50 rounded-xl py-3 px-4 border border-red-100">
          {{ uploadError }}
        </p>
      </div>

      <!-- Photos already uploaded -->
      <div v-else-if="hasUploadedPhotos" class="bg-green-50 border border-green-100 rounded-2xl p-5 flex items-center gap-3">
        <div class="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
          <svg class="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
        </div>
        <div>
          <p class="font-semibold text-green-800 text-sm">Arrival photos uploaded</p>
          <p class="text-xs text-green-600 mt-0.5">Customer has been notified</p>
        </div>
      </div>

      <!-- Not all arrived yet — gentle reminder -->
      <div v-else-if="!allItemsArrived" class="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-3">
        <svg class="h-5 w-5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <p class="text-sm text-amber-700">Mark all <strong>{{ order.items?.length - arrivedCount }}</strong> remaining package{{ (order.items?.length - arrivedCount) !== 1 ? 's' : '' }} as arrived to unlock photo upload.</p>
      </div>
    </template>

    <!-- ── WEIGHT MODAL ── -->
    <Transition name="modal">
      <div v-if="showWeightModal" class="fixed inset-0 z-50 flex items-end" @click.self="closeWeightModal">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="closeWeightModal" />
        <div class="relative bg-white w-full rounded-t-3xl p-6 shadow-2xl">
          <div class="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
          <div class="flex items-center gap-3 mb-5">
            <div class="h-10 w-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
              <svg class="h-5 w-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 class="font-bold text-gray-900">Mark as arrived</h3>
              <p class="text-xs text-gray-500 truncate max-w-[200px]">{{ pendingItem?.product_name || pendingItem?.name || 'Package' }}</p>
            </div>
          </div>

          <label class="block text-sm font-semibold text-gray-700 mb-2">
            Weight <span class="text-gray-400 font-normal">(lbs — optional)</span>
          </label>
          <input
            v-model="weight"
            type="number"
            inputmode="decimal"
            placeholder="e.g. 2.5"
            min="0"
            step="0.1"
            class="w-full border border-gray-200 rounded-xl px-4 py-3 text-base mb-5 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />

          <div class="flex gap-3">
            <button
              class="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              @click="closeWeightModal"
            >
              Cancel
            </button>
            <button
              class="flex-1 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold transition-colors shadow-lg"
              :disabled="markingItemId !== null"
              @click="confirmMarkArrived"
            >
              {{ markingItemId ? 'Saving...' : 'Confirm arrived' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
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

// Photo selection
const labelFiles = ref([])
const labelPreviews = ref([])
const contentsFile = ref(null)
const contentsPreview = ref(null)

const arrivedCount = computed(() => order.value?.items?.filter(i => i.arrived).length ?? 0)
const allItemsArrived = computed(() =>
  order.value?.items?.length > 0 && arrivedCount.value === order.value.items.length
)
const hasUploadedPhotos = computed(() =>
  order.value?.arrival_images?.length > 0 || !!order.value?.arrival_image_url
)
const canUpload = computed(() => labelFiles.value.length > 0 && contentsFile.value !== null)
const totalPhotoCount = computed(() => labelFiles.value.length + (contentsFile.value ? 1 : 0))

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const fetchOrder = async () => {
  loading.value = true
  error.value = null
  try {
    const data = await $customFetch(`/employee/orders/${route.params.id}`)
    order.value = data.data
  } catch {
    error.value = 'Could not load this order.'
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

const onLabelFilesChange = (e) => {
  const files = Array.from(e.target.files ?? [])
  files.forEach(f => {
    labelFiles.value.push(f)
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

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
