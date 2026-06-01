<template>
  <section class="min-h-screen bg-gray-50">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

      <div class="flex items-center gap-3 mb-6">
        <NuxtLink to="/app/admin/products" class="p-2 rounded-full hover:bg-gray-100 transition-colors shrink-0">
          <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </NuxtLink>
        <div class="flex-1 min-w-0">
          <h1 class="text-2xl font-extrabold text-gray-900">Hero de la tienda</h1>
          <p class="text-sm text-gray-500">Banner editable en /shop. Cambia título, imagen y a dónde lleva al cliente.</p>
        </div>
        <a
          href="/shop"
          target="_blank"
          rel="noopener"
          class="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 hover:border-primary-300 hover:bg-primary-50 text-sm font-semibold text-gray-700 hover:text-primary-700 rounded-xl transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
          </svg>
          <span class="hidden sm:inline">Ver pública</span>
        </a>
      </div>

      <!-- Live preview -->
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div class="px-4 py-2 border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wider font-semibold text-gray-500">Vista previa</div>
        <div class="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] items-center gap-6 p-6 bg-gradient-to-br from-primary-50 via-white to-amber-50">
          <div>
            <h2 class="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-[1.05] tracking-tight">
              {{ form.title || 'Título' }}
            </h2>
            <p v-if="form.subtitle" class="mt-3 text-base text-gray-600">{{ form.subtitle }}</p>
            <span class="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white font-semibold rounded-full text-sm">
              {{ form.cta_label || 'Comprar' }} →
            </span>
            <p class="text-xs text-gray-400 mt-2 font-mono break-all">{{ form.cta_link }}</p>
          </div>
          <div class="relative rounded-2xl overflow-hidden aspect-[5/4] bg-gray-100">
            <img
              v-if="previewImage"
              :src="previewImage"
              :alt="form.title"
              class="absolute inset-0 w-full h-full object-cover"
            />
            <div v-else class="absolute inset-0 flex items-center justify-center text-gray-300">
              <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            </div>
          </div>
        </div>
      </div>

      <form @submit.prevent="onSubmit" class="space-y-6">
        <!-- Images — desktop + mobile crops -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 class="font-bold text-gray-900 mb-1">Imágenes</h2>
          <p class="text-xs text-gray-400 mb-4">Sube las versiones para escritorio (horizontal) y celular (vertical). Las dos se muestran según el dispositivo del cliente.</p>

          <div class="grid sm:grid-cols-2 gap-5">
            <!-- Desktop crop -->
            <div>
              <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Escritorio · 21:9</p>
              <div v-if="previewImage" class="mb-3 relative aspect-[16/9] rounded-xl overflow-hidden bg-gray-100">
                <img :src="previewImage" alt="" class="absolute inset-0 w-full h-full object-cover" />
              </div>
              <label class="block w-full cursor-pointer">
                <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />
                <div class="border-2 border-dashed border-gray-200 hover:border-primary-300 hover:bg-primary-50/40 transition-colors rounded-xl py-5 text-center">
                  <svg class="h-8 w-8 mx-auto text-gray-400 mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  <p class="text-sm font-medium text-gray-700">{{ previewImage ? 'Reemplazar' : 'Subir imagen' }}</p>
                  <p class="text-[11px] text-gray-400 mt-0.5">JPG, PNG, WebP · max 10MB · 1920×820 ideal</p>
                </div>
              </label>
            </div>

            <!-- Mobile crop -->
            <div>
              <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Celular · 4:5</p>
              <div v-if="previewMobileImage" class="mb-3 relative aspect-[4/5] rounded-xl overflow-hidden bg-gray-100 max-w-[200px]">
                <img :src="previewMobileImage" alt="" class="absolute inset-0 w-full h-full object-cover" />
              </div>
              <label class="block w-full cursor-pointer">
                <input ref="mobileFileInput" type="file" accept="image/*" class="hidden" @change="onMobileFileChange" />
                <div class="border-2 border-dashed border-gray-200 hover:border-primary-300 hover:bg-primary-50/40 transition-colors rounded-xl py-5 text-center">
                  <svg class="h-8 w-8 mx-auto text-gray-400 mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                  </svg>
                  <p class="text-sm font-medium text-gray-700">{{ previewMobileImage ? 'Reemplazar' : 'Subir imagen' }}</p>
                  <p class="text-[11px] text-gray-400 mt-0.5">JPG, PNG, WebP · max 10MB · 1080×1350 ideal</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        <!-- Copy -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 class="font-bold text-gray-900 mb-1">Texto</h2>
          <div>
            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Título *</label>
            <input v-model="form.title" type="text" required maxlength="120" placeholder="Ej: Athletic Wear" class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Subtítulo <span class="text-gray-300 font-normal">— opcional</span></label>
            <input v-model="form.subtitle" type="text" maxlength="240" placeholder="Ej: Premium athleisure de Lululemon, Alo y más" class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>

        <!-- CTA -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 class="font-bold text-gray-900 mb-1">Botón</h2>
          <div class="grid sm:grid-cols-[180px_1fr] gap-4">
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Etiqueta del botón *</label>
              <input v-model="form.cta_label" type="text" required maxlength="60" placeholder="Comprar" class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">A dónde lleva *</label>
              <input v-model="form.cta_link" type="text" required placeholder="/shop?category_id=5" class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>

          <!-- Smart pickers — clicking pre-fills cta_link -->
          <div class="space-y-2 pt-2 border-t border-gray-100">
            <p class="text-xs text-gray-500">Atajos:</p>
            <div class="flex flex-wrap gap-2">
              <button type="button" @click="form.cta_link = '/shop?view=all'" class="text-xs px-2.5 py-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-700 font-mono">Todos los productos</button>
              <button v-for="c in categories" :key="`c-${c.id}`" type="button" @click="form.cta_link = `/shop?category_id=${c.id}`" class="text-xs px-2.5 py-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-700">{{ c.name }}</button>
              <button v-for="s in stores" :key="`s-${s.id}`" type="button" @click="form.cta_link = `/shop?store_id=${s.id}`" class="text-xs px-2.5 py-1 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg text-primary-700 font-medium">{{ s.name }}</button>
            </div>
          </div>
        </div>

        <!-- Active toggle -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <label class="flex items-start gap-3 cursor-pointer">
            <input v-model="form.is_active" type="checkbox" class="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
            <div>
              <p class="font-bold text-gray-900">Activo</p>
              <p class="text-sm text-gray-500">Si está apagado, /shop muestra el banner por defecto.</p>
            </div>
          </label>
        </div>

        <div class="flex justify-end gap-3">
          <button
            type="submit"
            :disabled="saving"
            class="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-400 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 transition-colors"
          >
            <svg v-if="saving" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            {{ saving ? 'Guardando...' : 'Guardar cambios' }}
          </button>
        </div>
      </form>
    </div>
  </section>
</template>

<script setup>
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin'],
})

const { $customFetch } = useNuxtApp()
const toast = useToast()

const form = ref({
  title: '',
  subtitle: '',
  cta_label: 'Comprar',
  cta_link: '/shop?view=all',
  is_active: true,
})
const hero = ref(null)
const newImageFile = ref(null)
const newImagePreview = ref(null)
const fileInput = ref(null)
const newMobileImageFile = ref(null)
const newMobileImagePreview = ref(null)
const mobileFileInput = ref(null)
const saving = ref(false)
const stores = ref([])
const categories = ref([])

const previewImage = computed(() => newImagePreview.value || hero.value?.image_url || null)
const previewMobileImage = computed(() => newMobileImagePreview.value || hero.value?.mobile_image_url || null)

const fetchHero = async () => {
  try {
    const res = await $customFetch('/shopping/store-hero')
    hero.value = res?.data ?? null
    if (hero.value) {
      form.value = {
        title: hero.value.title ?? '',
        subtitle: hero.value.subtitle ?? '',
        cta_label: hero.value.cta_label ?? 'Comprar',
        cta_link: hero.value.cta_link ?? '/shop?view=all',
        is_active: hero.value.is_active ?? true,
      }
    }
  } catch {}
}

const fetchStoresAndCategories = async () => {
  try {
    const [s, c] = await Promise.all([
      $customFetch('/shopping/stores', { query: { active_only: 1, per_page: 200 } }),
      $customFetch('/shopping/categories', { query: { active_only: 1, per_page: 200 } }),
    ])
    stores.value = s.data?.data ?? []
    categories.value = c.data?.data ?? []
  } catch {}
}

const onFileChange = (e) => {
  const file = e.target.files?.[0]
  if (! file) return
  newImageFile.value = file
  const reader = new FileReader()
  reader.onload = (ev) => { newImagePreview.value = ev.target.result }
  reader.readAsDataURL(file)
}

const onMobileFileChange = (e) => {
  const file = e.target.files?.[0]
  if (! file) return
  newMobileImageFile.value = file
  const reader = new FileReader()
  reader.onload = (ev) => { newMobileImagePreview.value = ev.target.result }
  reader.readAsDataURL(file)
}

const uploadVariant = async (file, variant) => {
  const fd = new FormData()
  fd.append('image', file)
  fd.append('variant', variant)
  await $customFetch('/shopping/store-hero/image', { method: 'POST', body: fd })
}

const onSubmit = async () => {
  saving.value = true
  try {
    // 1. Save text + CTA + active flag
    await $customFetch('/shopping/store-hero', {
      method: 'PUT',
      body: form.value,
    })

    // 2. Upload any staged images (desktop, then mobile)
    if (newImageFile.value) {
      await uploadVariant(newImageFile.value, 'desktop')
      newImageFile.value = null
      newImagePreview.value = null
      if (fileInput.value) fileInput.value.value = ''
    }
    if (newMobileImageFile.value) {
      await uploadVariant(newMobileImageFile.value, 'mobile')
      newMobileImageFile.value = null
      newMobileImagePreview.value = null
      if (mobileFileInput.value) mobileFileInput.value.value = ''
    }

    await fetchHero()
    toast.success('Hero actualizado.')
  } catch (e) {
    console.error(e)
    toast.error(e?.data?.message || 'No se pudo guardar.')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchHero()
  fetchStoresAndCategories()
})
</script>
