<template>
  <section class="min-h-screen bg-gray-50">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

      <div class="flex items-center gap-3 mb-6">
        <NuxtLink to="/app/admin/products" class="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </NuxtLink>
        <h1 class="text-2xl font-extrabold text-gray-900">Crear producto</h1>
      </div>

      <AdminProductForm
        :saving="saving"
        @submit="onSubmit"
      />
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
const router = useRouter()
const toast = useToast()

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

const onSubmit = async ({ fields, images, variants }) => {
  saving.value = true
  try {
    // 1. Create product
    const createRes = await $customFetch('/admin/products', {
      method: 'POST',
      body: fields,
    })
    const product = createRes.data

    // 2. Sync variants if any
    if (variants && variants.length > 0) {
      await $customFetch(`/admin/products/${product.id}/variants/sync`, {
        method: 'POST',
        body: { variants },
      })
    }

    // 3. If there are images, upload them
    if (images && images.length > 0) {
      const compressed = await Promise.all(images.map(f => compressImage(f)))
      const fd = new FormData()
      compressed.forEach(f => fd.append('images[]', f))
      await $customFetch(`/admin/products/${product.id}/images`, {
        method: 'POST',
        body: fd,
      })
    }

    toast.success('Producto creado.')
    router.push(`/app/admin/products/${product.id}/edit`)
  } catch (err) {
    console.error(err)
    toast.error(err?.data?.message ?? 'No se pudo crear el producto.')
  } finally {
    saving.value = false
  }
}
</script>
