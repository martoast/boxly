<template>
  <div class="min-h-screen bg-gray-50/50">
    <!-- Header -->
    <div class="bg-white/90 backdrop-blur-sm shadow-sm border-b border-gray-100">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div class="flex items-center gap-4">
          <NuxtLink to="/app/shopping/campaigns"
            class="p-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </NuxtLink>
          <h1 class="text-xl sm:text-2xl font-extrabold text-gray-900">{{ t.createCampaign }}</h1>
        </div>
      </div>
    </div>

    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Campaign Details -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">{{ t.campaignDetails }}</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">{{ t.name }}</label>
              <input v-model="form.name" type="text" required
                class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                :placeholder="t.namePlaceholder" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">{{ t.subject }}</label>
              <input v-model="form.subject" type="text" required
                class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                :placeholder="t.subjectPlaceholder" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">{{ t.body }}</label>
              <textarea v-model="form.body" rows="8" required
                class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                :placeholder="t.bodyPlaceholder"></textarea>
            </div>
          </div>
        </div>

        <!-- Link (Optional) -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-1">{{ t.linkSection }}</h2>
          <p class="text-sm text-gray-500 mb-4">{{ t.linkOptional }}</p>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">{{ t.linkUrl }}</label>
              <input v-model="form.link_url" type="url"
                class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="https://example.com" />
            </div>

            <div v-if="form.link_url">
              <label class="block text-sm font-medium text-gray-700 mb-2">{{ t.linkText }}</label>
              <input v-model="form.link_text" type="text"
                class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                :placeholder="t.linkTextPlaceholder" />
            </div>
          </div>
        </div>

        <!-- Audience & Settings -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">{{ t.audienceSettings }}</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">{{ t.audience }}</label>
              <select v-model="form.audience" required
                class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option value="all">{{ t.audienceAll }}</option>
                <option value="has_orders">{{ t.audienceHasOrders }}</option>
                <option value="no_orders">{{ t.audienceNoOrders }}</option>
                <option value="active_orders">{{ t.audienceActiveOrders }}</option>
                <option value="expat">{{ t.audienceExpat }}</option>
                <option value="business">{{ t.audienceBusiness }}</option>
                <option value="shopper">{{ t.audienceShopper }}</option>
              </select>

              <!-- Audience Preview -->
              <div v-if="audienceCount !== null" class="mt-2 p-3 bg-primary-50 border border-primary-200 rounded-xl">
                <p class="text-sm text-primary-700 font-medium">
                  {{ audienceCount }} {{ t.recipientsWillReceive }}
                </p>
              </div>
              <div v-if="audienceLoading" class="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                <p class="text-sm text-gray-500">{{ t.loadingAudience }}</p>
              </div>
            </div>

            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">{{ t.batchSize }}</label>
                <input v-model="form.batch_size" type="number" min="1" max="500"
                  class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">{{ t.batchDelay }}</label>
                <input v-model="form.batch_delay_seconds" type="number" min="10" max="3600"
                  class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
              </div>
            </div>
          </div>
        </div>

        <!-- Error -->
        <div v-if="errorMessage" class="bg-red-50 border border-red-200 rounded-xl p-4">
          <p class="text-sm text-red-600">{{ errorMessage }}</p>
        </div>

        <!-- Actions -->
        <div class="flex gap-4">
          <NuxtLink to="/app/shopping/campaigns"
            class="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all text-center">
            {{ t.cancel }}
          </NuxtLink>
          <button type="submit" :disabled="submitting"
            class="flex-1 px-6 py-3 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
            {{ submitting ? t.saving : t.saveDraft }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'shopping',
  middleware: ['auth', 'shopping']
})

const { $customFetch } = useNuxtApp()
const { t: createTranslations } = useLanguage()

const translations = {
  createCampaign: { es: 'Crear Campaña', en: 'Create Campaign' },
  campaignDetails: { es: 'Detalles de la Campaña', en: 'Campaign Details' },
  name: { es: 'Nombre', en: 'Name' },
  namePlaceholder: { es: 'Ej: Promoción de Verano', en: 'E.g. Summer Promotion' },
  subject: { es: 'Asunto del email', en: 'Email Subject' },
  subjectPlaceholder: { es: 'Ej: ¡Oferta especial para ti!', en: 'E.g. Special offer just for you!' },
  body: { es: 'Cuerpo del mensaje', en: 'Message Body' },
  bodyPlaceholder: { es: 'Escribe el contenido del email...', en: 'Write the email content...' },
  linkSection: { es: 'Enlace', en: 'Link' },
  linkOptional: { es: 'Agrega un botón de acción (opcional)', en: 'Add a call-to-action button (optional)' },
  linkUrl: { es: 'URL del enlace', en: 'Link URL' },
  linkText: { es: 'Texto del botón', en: 'Button Text' },
  linkTextPlaceholder: { es: 'Ej: Ver más', en: 'E.g. Learn More' },
  audienceSettings: { es: 'Audiencia y Configuración', en: 'Audience & Settings' },
  audience: { es: 'Audiencia', en: 'Audience' },
  audienceAll: { es: 'Todos los clientes', en: 'All Customers' },
  audienceHasOrders: { es: 'Con órdenes', en: 'Has Orders' },
  audienceNoOrders: { es: 'Sin órdenes', en: 'No Orders' },
  audienceActiveOrders: { es: 'Con órdenes activas', en: 'Active Orders' },
  audienceExpat: { es: 'Expat', en: 'Expat' },
  audienceBusiness: { es: 'Business', en: 'Business' },
  audienceShopper: { es: 'Shopper', en: 'Shopper' },
  recipientsWillReceive: { es: 'destinatarios recibirán esta campaña', en: 'recipients will receive this campaign' },
  loadingAudience: { es: 'Calculando audiencia...', en: 'Calculating audience...' },
  batchSize: { es: 'Tamaño de lote', en: 'Batch Size' },
  batchDelay: { es: 'Delay entre lotes (seg)', en: 'Batch Delay (sec)' },
  cancel: { es: 'Cancelar', en: 'Cancel' },
  saveDraft: { es: 'Guardar Borrador', en: 'Save Draft' },
  saving: { es: 'Guardando...', en: 'Saving...' },
}

const t = createTranslations(translations)

const form = ref({
  name: '',
  subject: '',
  body: '',
  link_url: '',
  link_text: '',
  audience: 'all',
  batch_size: 50,
  batch_delay_seconds: 60,
})

const submitting = ref(false)
const errorMessage = ref('')
const audienceCount = ref(null)
const audienceLoading = ref(false)
const audienceDebounce = ref(null)

const fetchAudiencePreview = async () => {
  audienceLoading.value = true
  audienceCount.value = null
  try {
    const response = await $customFetch('/shopping/campaigns/preview-audience', {
      params: { audience: form.value.audience }
    })
    audienceCount.value = response.data.count
  } catch (error) {
    console.error('Error fetching audience preview:', error)
  } finally {
    audienceLoading.value = false
  }
}

watch(() => form.value.audience, () => {
  clearTimeout(audienceDebounce.value)
  audienceDebounce.value = setTimeout(fetchAudiencePreview, 300)
})

const handleSubmit = async () => {
  submitting.value = true
  errorMessage.value = ''

  try {
    const response = await $customFetch('/shopping/campaigns', {
      method: 'POST',
      body: {
        name: form.value.name,
        subject: form.value.subject,
        body: form.value.body,
        link_url: form.value.link_url || null,
        link_text: form.value.link_text || null,
        audience: form.value.audience,
        batch_size: form.value.batch_size,
        batch_delay_seconds: form.value.batch_delay_seconds,
      }
    })

    await navigateTo(`/app/shopping/campaigns/${response.data.id}`)
  } catch (error) {
    console.error('Error creating campaign:', error)
    errorMessage.value = error.data?.message || 'An error occurred'
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchAudiencePreview()
})

onUnmounted(() => {
  clearTimeout(audienceDebounce.value)
})
</script>
