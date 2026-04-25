<template>
  <section class="min-h-screen bg-gray-50">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

      <div class="flex items-center gap-3 mb-6">
        <NuxtLink to="/app/admin/products" class="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </NuxtLink>
        <h1 class="text-2xl font-extrabold text-gray-900 truncate">{{ product?.name ?? 'Cargando...' }}</h1>
      </div>

      <div v-if="loading" class="text-center py-12 text-gray-400">Cargando...</div>

      <AdminProductForm
        v-else-if="product"
        :existing-product="product"
        :saving="saving"
        @submit="onSubmit"
        @upload-images="onUploadImages"
        @delete-image="onDeleteImage"
      />

      <!-- Danger zone -->
      <div v-if="product" class="mt-8 bg-red-50 border border-red-200 rounded-2xl p-5">
        <h3 class="font-bold text-red-900 mb-1">Desactivar producto</h3>
        <p class="text-sm text-red-700 mb-3">Pone el producto en estado "inactivo". No afecta órdenes existentes.</p>
        <button @click="onDestroy" class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors">
          Desactivar
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import AdminProductForm from '~/components/admin/AdminProductForm.vue'

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin'],
})

const { $customFetch } = useNuxtApp()
const route = useRoute()
const router = useRouter()
const toast = useToast()

const product = ref(null)
const loading = ref(true)
const saving = ref(false)

const compressImage = (file, maxDim = 1600, quality = 0.78) => new Promise((resolve) => {
  const img = new Image()
  const url = URL.createObjectURL(file)
  img.onload = () => {
    URL.revokeObjectURL(url)
    let { width, height } = img
    if (width > maxDim || height > maxDim) {
      if (width >= height) { height = Math.round(height * maxDim / width); width = maxDim }
      else { width = Math.round(width * maxDim / height); height = maxDim }
    }
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d').drawImage(img, 0, 0, width, height)
    canvas.toBlob(
      blob => resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })),
      'image/jpeg', quality
    )
  }
  img.src = url
})

const fetchProduct = async () => {
  loading.value = true
  try {
    const res = await $customFetch(`/admin/products/${route.params.id}`)
    product.value = res.data
  } catch (err) {
    toast.error('No se pudo cargar el producto.')
  } finally {
    loading.value = false
  }
}

const onSubmit = async (payload) => {
  saving.value = true
  try {
    const res = await $customFetch(`/admin/products/${product.value.id}`, {
      method: 'PUT',
      body: payload,
    })
    product.value = res.data
    toast.success('Cambios guardados.')
  } catch (err) {
    toast.error(err?.data?.message ?? 'No se pudo guardar.')
  } finally {
    saving.value = false
  }
}

const onUploadImages = async (files) => {
  saving.value = true
  try {
    const compressed = await Promise.all(files.map(f => compressImage(f)))
    const formData = new FormData()
    compressed.forEach(f => formData.append('images[]', f))
    const res = await $customFetch(`/admin/products/${product.value.id}/images`, {
      method: 'POST',
      body: formData,
    })
    product.value = res.data
    toast.success('Imágenes subidas.')
  } catch (err) {
    toast.error(err?.data?.message ?? 'Falló la subida.')
  } finally {
    saving.value = false
  }
}

const onDeleteImage = async (index) => {
  if (!confirm('¿Eliminar esta imagen?')) return
  try {
    const res = await $customFetch(`/admin/products/${product.value.id}/images/${index}`, {
      method: 'DELETE',
    })
    product.value = res.data
  } catch (err) {
    toast.error('No se pudo eliminar.')
  }
}

const onDestroy = async () => {
  if (!confirm('¿Desactivar este producto?')) return
  try {
    await $customFetch(`/admin/products/${product.value.id}`, { method: 'DELETE' })
    toast.success('Producto desactivado.')
    router.push('/app/admin/products')
  } catch (err) {
    toast.error('No se pudo desactivar.')
  }
}

onMounted(fetchProduct)
</script>
