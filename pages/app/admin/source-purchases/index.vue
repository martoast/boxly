<template>
  <section class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900">Compras pendientes en tienda</h1>
        <p class="text-sm text-gray-500 mt-1">
          Productos pagados por clientes que necesitamos comprar en la tienda fuente.
          Abre el link, compra con la tarjeta de Boxly USA, y registra la orden aquí.
        </p>
      </div>

      <div v-if="loading" class="bg-white rounded-2xl p-8 text-center text-gray-400">Cargando...</div>

      <div v-else-if="items.length === 0" class="bg-white rounded-2xl p-12 text-center border border-gray-100">
        <div class="h-16 w-16 mx-auto mb-3 rounded-full bg-green-50 flex items-center justify-center text-green-500">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <p class="text-gray-700 font-semibold">¡Al día!</p>
        <p class="text-gray-400 text-sm mt-1">No hay productos pendientes de compra.</p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="item in items"
          :key="item.id"
          class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
        >
          <div class="flex flex-col md:flex-row md:items-start gap-4">
            <!-- Product image + info -->
            <div class="flex gap-4 flex-1 min-w-0">
              <div class="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                <img v-if="item.image_url_snapshot" :src="item.image_url_snapshot" alt="" class="w-full h-full object-cover" />
              </div>
              <div class="min-w-0 flex-1">
                <h3 class="font-semibold text-gray-900 line-clamp-2">{{ item.name_snapshot }}</h3>
                <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mt-1">
                  <span><strong class="text-gray-900">Cant:</strong> {{ item.quantity }}</span>
                  <span><strong class="text-gray-900">Cliente:</strong> {{ item.order?.user?.name }}</span>
                  <span class="font-mono">{{ item.order?.order_number }}</span>
                </div>
                <p class="text-xs text-gray-400 mt-1">Pagado {{ formatRelativeTime(item.paid_at) }}</p>
              </div>
            </div>

            <!-- Source link + record action -->
            <div class="flex flex-col gap-2 md:items-end shrink-0 md:min-w-[280px]">
              <a
                v-if="item.product?.source_url"
                :href="item.product.source_url"
                target="_blank"
                rel="noopener"
                class="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl shadow text-sm transition-colors"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                </svg>
                Abrir tienda fuente
              </a>
              <p v-else class="text-xs text-amber-600 italic">⚠️ Sin source_url — agregar al producto</p>

              <button
                @click="openRecord(item)"
                class="inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 font-semibold rounded-xl text-sm hover:bg-gray-50 transition-colors"
              >
                Registrar compra
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="lastPage > 1" class="flex items-center justify-center gap-2 mt-6">
        <button :disabled="currentPage === 1" @click="goToPage(currentPage - 1)" class="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40">← Prev</button>
        <span class="text-sm text-gray-500">{{ currentPage }} / {{ lastPage }}</span>
        <button :disabled="currentPage === lastPage" @click="goToPage(currentPage + 1)" class="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40">Next →</button>
      </div>
    </div>

    <!-- Record purchase modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="recording"
          class="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          @click.self="recording = null"
        >
          <div class="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl shadow-2xl overflow-hidden">
            <div class="px-6 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between">
              <h3 class="font-bold text-gray-900">Registrar compra</h3>
              <button class="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200" @click="recording = null">
                <svg class="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div class="px-6 py-5 space-y-4">
              <p class="text-sm text-gray-600">
                <strong>{{ recording.name_snapshot }}</strong> · cant: {{ recording.quantity }}
              </p>

              <div>
                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Order # de la tienda</label>
                <input v-model="recordForm.source_order_id" type="text" placeholder="Ej: 1234567890" class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tracking number (opcional)</label>
                <input v-model="recordForm.source_tracking_number" type="text" placeholder="Ej: 1Z999AA10123456784" class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Carrier (opcional)</label>
                <input v-model="recordForm.source_carrier" type="text" placeholder="UPS / FedEx / USPS" class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>

              <button
                @click="submitRecord"
                :disabled="submitting"
                class="w-full py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 transition-colors"
              >
                {{ submitting ? 'Guardando...' : 'Guardar compra' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<script setup>
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin'],
})

const { $customFetch } = useNuxtApp()
const toast = useToast()

const items = ref([])
const loading = ref(true)
const currentPage = ref(1)
const lastPage = ref(1)

const recording = ref(null)
const recordForm = ref({ source_order_id: '', source_tracking_number: '', source_carrier: '' })
const submitting = ref(false)

const fetchItems = async () => {
  loading.value = true
  try {
    const res = await $customFetch('/admin/marketplace-orders/pending-source-purchase', {
      query: { page: currentPage.value, per_page: 30 },
    })
    items.value = res.data?.data ?? []
    lastPage.value = res.data?.last_page ?? 1
  } catch (err) {
    console.error(err)
    toast.error('No se pudieron cargar los productos pendientes.')
  } finally {
    loading.value = false
  }
}

const goToPage = (p) => {
  currentPage.value = p
  fetchItems()
}

const openRecord = (item) => {
  recording.value = item
  recordForm.value = {
    source_order_id: item.source_order_id ?? '',
    source_tracking_number: item.source_tracking_number ?? '',
    source_carrier: item.source_carrier ?? '',
  }
}

const submitRecord = async () => {
  if (!recording.value) return
  submitting.value = true
  try {
    await $customFetch(
      `/admin/marketplace-orders/${recording.value.marketplace_order_id}/items/${recording.value.id}/record-source-purchase`,
      { method: 'POST', body: recordForm.value }
    )
    toast.success('Compra registrada.')
    recording.value = null
    fetchItems()
  } catch (err) {
    toast.error(err?.data?.message ?? 'Falló al registrar.')
  } finally {
    submitting.value = false
  }
}

const formatRelativeTime = (iso) => {
  if (!iso) return ''
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 60) return `hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  return `hace ${days}d`
}

onMounted(fetchItems)
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.fade-enter-active > div:last-child, .fade-leave-active > div:last-child {
  transition: transform 0.25s ease;
}
.fade-enter-from > div:last-child, .fade-leave-to > div:last-child {
  transform: translateY(20px);
}
</style>
