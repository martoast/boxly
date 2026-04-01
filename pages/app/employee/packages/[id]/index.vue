<template>
  <div>
    <!-- Back -->
    <NuxtLink to="/app/employee/packages" class="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 transition-colors mb-5">
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      Back to queue
    </NuxtLink>

    <!-- Loading -->
    <div v-if="loading" class="space-y-4 animate-pulse">
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div class="h-5 w-40 bg-gray-200 rounded mb-2" />
        <div class="h-3 w-28 bg-gray-100 rounded" />
      </div>
      <div v-for="i in 3" :key="i" class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-3">
        <div class="h-14 w-14 bg-gray-100 rounded-xl shrink-0" />
        <div class="flex-1">
          <div class="h-4 w-32 bg-gray-200 rounded mb-2" />
          <div class="h-3 w-24 bg-gray-100 rounded" />
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
      <h2 class="text-xl font-extrabold text-gray-900 mb-2">Photos uploaded!</h2>
      <p class="text-gray-500 text-sm mb-7">All done for this order.</p>
      <NuxtLink
        to="/app/employee/packages"
        class="inline-flex items-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:bg-primary-600 transition-all"
      >
        Back to queue
      </NuxtLink>
    </div>

    <template v-else-if="order">
      <!-- Order header -->
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
        <h1 class="text-lg font-extrabold text-gray-900">{{ order.user?.name }}</h1>
        <p class="text-xs font-mono text-gray-400 mt-0.5">{{ order.order_number }}</p>
        <p class="text-xs text-gray-400 mt-2">{{ order.items?.length }} item{{ order.items?.length !== 1 ? 's' : '' }} in this order</p>
      </div>

      <!-- Items (read-only reference) -->
      <div class="space-y-2 mb-6">
        <h2 class="text-xs font-semibold uppercase tracking-wider text-gray-400 px-1">
          Items in this order
        </h2>
        <div
          v-for="item in order.items"
          :key="item.id"
          class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3"
        >
          <!-- Product image -->
          <div class="h-12 w-12 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 shrink-0 flex items-center justify-center">
            <img
              v-if="item.product_image_url"
              :src="item.product_image_url"
              :alt="item.product_name || 'Item'"
              class="h-full w-full object-cover"
              @error="(e) => e.target.style.display = 'none'"
            />
            <svg v-else class="h-5 w-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-medium text-gray-900 text-sm truncate">{{ item.product_name || item.name || 'Package' }}</p>
            <div class="flex items-center gap-2 mt-0.5 flex-wrap">
              <span v-if="item.carrier" class="inline-block px-1.5 py-0.5 bg-primary-50 text-primary-700 text-[10px] font-semibold rounded uppercase">{{ item.carrier }}</span>
              <span v-if="item.tracking_number" class="font-mono text-xs text-gray-400 truncate">{{ item.tracking_number }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Photos already uploaded -->
      <div v-if="hasUploadedPhotos" class="bg-green-50 border border-green-100 rounded-2xl p-5 flex items-center gap-3 mb-4">
        <div class="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
          <svg class="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
        </div>
        <div>
          <p class="font-semibold text-green-800 text-sm">Photos already uploaded</p>
          <p class="text-xs text-green-600 mt-0.5">{{ order.arrival_images?.length }} photo{{ order.arrival_images?.length !== 1 ? 's' : '' }} on file</p>
        </div>
      </div>

      <!-- Upload section — always visible -->
      <div class="space-y-4">
        <h2 class="text-xs font-semibold uppercase tracking-wider text-gray-400 px-1">
          {{ hasUploadedPhotos ? 'Add more photos' : 'Upload arrival photos' }}
        </h2>

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
              <p class="text-xs text-gray-400">One photo per box — the shipping label</p>
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
          <div v-if="labelFiles.length > 0" class="flex gap-2 mt-3 flex-wrap">
            <div v-for="(f, i) in labelFiles" :key="i" class="relative h-16 w-16 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
              <img :src="labelPreviews[i]" class="h-full w-full object-cover" />
              <button class="absolute top-0.5 right-0.5 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] shadow" @click="removeLabelFile(i)">✕</button>
            </div>
          </div>
        </div>

        <!-- Contents photos -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div class="flex items-center gap-3 mb-3">
            <div class="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <svg class="h-5 w-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p class="font-semibold text-gray-900 text-sm">Contents photos</p>
              <p class="text-xs text-gray-400">Photos of the items inside the packages</p>
            </div>
          </div>
          <label class="block w-full cursor-pointer">
            <div
              class="border-2 border-dashed rounded-xl py-3 px-4 text-center transition-colors"
              :class="contentsFiles.length > 0 ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50'"
            >
              <p class="text-sm font-medium" :class="contentsFiles.length > 0 ? 'text-emerald-600' : 'text-gray-500'">
                {{ contentsFiles.length > 0 ? `${contentsFiles.length} photo${contentsFiles.length > 1 ? 's' : ''} selected` : '+ Add contents photos' }}
              </p>
            </div>
            <input type="file" accept="image/*" multiple class="hidden" @change="onContentsFilesChange" />
          </label>
          <div v-if="contentsFiles.length > 0" class="flex gap-2 mt-3 flex-wrap">
            <div v-for="(f, i) in contentsFiles" :key="i" class="relative h-16 w-16 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
              <img :src="contentsPreviews[i]" class="h-full w-full object-cover" />
              <button class="absolute top-0.5 right-0.5 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] shadow" @click="removeContentsFile(i)">✕</button>
            </div>
          </div>
        </div>

        <!-- Upload button -->
        <button
          class="w-full py-4 rounded-xl font-bold text-base transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
          :class="canUpload ? 'bg-primary-500 hover:bg-primary-600 text-white hover:shadow-xl hover:-translate-y-0.5' : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'"
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
    </template>
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
const uploading = ref(false)
const uploadError = ref(null)

const labelFiles = ref([])
const labelPreviews = ref([])
const contentsFiles = ref([])
const contentsPreviews = ref([])

const hasUploadedPhotos = computed(() =>
  order.value?.arrival_images?.length > 0 || !!order.value?.arrival_image_url
)
const canUpload = computed(() => labelFiles.value.length > 0 && contentsFiles.value.length > 0)
const totalPhotoCount = computed(() => labelFiles.value.length + contentsFiles.value.length)

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

const onLabelFilesChange = (e) => {
  Array.from(e.target.files ?? []).forEach(f => {
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

const onContentsFilesChange = (e) => {
  Array.from(e.target.files ?? []).forEach(f => {
    contentsFiles.value.push(f)
    const reader = new FileReader()
    reader.onload = (ev) => contentsPreviews.value.push(ev.target.result)
    reader.readAsDataURL(f)
  })
  e.target.value = ''
}

const removeContentsFile = (i) => {
  contentsFiles.value.splice(i, 1)
  contentsPreviews.value.splice(i, 1)
}

const handleUpload = async () => {
  if (!canUpload.value) return
  uploading.value = true
  uploadError.value = null
  try {
    const formData = new FormData()
    labelFiles.value.forEach(f => formData.append('labels[]', f))
    contentsFiles.value.forEach(f => formData.append('contents[]', f))
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
