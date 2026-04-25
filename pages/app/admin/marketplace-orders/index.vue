<template>
  <section class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

      <div class="mb-6">
        <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900">Pedidos de la Tienda</h1>
        <p class="text-sm text-gray-500 mt-1">Gestión de envíos del Boxly Store</p>
      </div>

      <!-- Tabs -->
      <div class="flex flex-wrap gap-2 mb-5 border-b border-gray-200 overflow-x-auto pb-px">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          @click="setStatus(tab.value)"
          :class="[
            statusFilter === tab.value
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700',
            'border-b-2 px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors'
          ]"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Search -->
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
        <div class="relative">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input v-model="search" placeholder="Buscar por # de orden o cliente..." class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
      </div>

      <div v-if="loading" class="bg-white rounded-2xl p-8 text-center text-gray-400">Cargando...</div>

      <div v-else-if="orders.length === 0" class="bg-white rounded-2xl p-12 text-center">
        <p class="text-gray-700 font-semibold">Sin pedidos en este filtro</p>
      </div>

      <div v-else class="space-y-3">
        <NuxtLink
          v-for="order in orders"
          :key="order.id"
          :to="`/app/admin/marketplace-orders/${order.id}`"
          class="block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-primary-200 transition-all p-5"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1 flex-wrap">
                <p class="font-bold text-gray-900 font-mono text-sm">{{ order.order_number }}</p>
                <StatusBadge :status="order.status" />
              </div>
              <p class="text-sm text-gray-700 mt-1">{{ order.user?.name }} · <span class="text-gray-400">{{ order.user?.email }}</span></p>
              <p class="text-xs text-gray-400 mt-1">{{ formatDate(order.created_at) }} · {{ totalItems(order) }} productos · ${{ formatPrice(order.items_subtotal_cents) }} MXN</p>
            </div>
            <svg class="w-5 h-5 text-gray-300 shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </div>
        </NuxtLink>
      </div>

      <!-- Pagination -->
      <div v-if="lastPage > 1" class="flex items-center justify-center gap-2 mt-6">
        <button :disabled="currentPage === 1" @click="goToPage(currentPage - 1)" class="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40">← Prev</button>
        <span class="text-sm text-gray-500">Página {{ currentPage }} / {{ lastPage }}</span>
        <button :disabled="currentPage === lastPage" @click="goToPage(currentPage + 1)" class="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40">Next →</button>
      </div>
    </div>
  </section>
</template>

<script setup>
import StatusBadge from '~/components/store/MarketplaceStatusBadge.vue'

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin'],
})

const { $customFetch } = useNuxtApp()

const tabs = [
  { value: 'ready_to_ship', label: 'Por empacar' },
  { value: 'packing',       label: 'Empacando' },
  { value: 'awaiting_shipping_payment', label: 'Esperando pago' },
  { value: 'shipping_paid', label: 'Listas para enviar' },
  { value: 'shipped',       label: 'Enviadas' },
  { value: 'delivered',     label: 'Entregadas' },
  { value: 'collecting',    label: 'Acumulando' },
  { value: 'refunded',      label: 'Reembolsadas' },
  { value: '',              label: 'Todas' },
]

const orders = ref([])
const loading = ref(true)
const statusFilter = ref('ready_to_ship')
const search = ref('')
const currentPage = ref(1)
const lastPage = ref(1)
let searchTimer = null

const fetchOrders = async () => {
  loading.value = true
  try {
    const res = await $customFetch('/admin/marketplace-orders', {
      query: {
        page: currentPage.value,
        per_page: 30,
        status: statusFilter.value || undefined,
        search: search.value || undefined,
      },
    })
    orders.value = res.data?.data ?? []
    lastPage.value = res.data?.last_page ?? 1
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const setStatus = (s) => {
  statusFilter.value = s
  currentPage.value = 1
  fetchOrders()
}

const goToPage = (p) => {
  currentPage.value = p
  fetchOrders()
}

const formatDate = (d) => new Date(d).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })
const formatPrice = (cents) => (cents / 100).toLocaleString('es-MX', { minimumFractionDigits: 2 })
const totalItems = (o) => (o.items ?? []).reduce((s, i) => s + i.quantity, 0)

watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { currentPage.value = 1; fetchOrders() }, 300)
})

onMounted(fetchOrders)
</script>
