<template>
  <section class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900">Ventas Tienda</h1>
        <p class="text-sm text-gray-500 mt-1">Transacciones generadas por checkouts del Boxly Store</p>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p class="text-xs uppercase tracking-wider text-gray-400 font-semibold">Total ventas</p>
          <p class="text-2xl font-extrabold text-gray-900 mt-1">{{ stats.total_sales ?? '—' }}</p>
        </div>
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p class="text-xs uppercase tracking-wider text-gray-400 font-semibold">Pagadas</p>
          <p class="text-2xl font-extrabold text-green-700 mt-1">{{ stats.paid_sales ?? '—' }}</p>
        </div>
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p class="text-xs uppercase tracking-wider text-gray-400 font-semibold">Ingresos (MXN)</p>
          <p class="text-2xl font-extrabold text-gray-900 mt-1">${{ formatMoney(stats.total_revenue_mxn ?? 0) }}</p>
        </div>
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p class="text-xs uppercase tracking-wider text-gray-400 font-semibold">Productos vendidos</p>
          <p class="text-2xl font-extrabold text-gray-900 mt-1">{{ stats.items_sold ?? '—' }}</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div class="relative md:col-span-2">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              v-model="search"
              placeholder="Buscar por cliente, email o producto..."
              class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select v-model="statusFilter" class="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">Todos los estados</option>
            <option value="quoted">Cotizada</option>
            <option value="paid">Pagada</option>
            <option value="purchased">Comprada</option>
            <option value="rejected">Rechazada</option>
            <option value="cancelled">Cancelada</option>
          </select>
        </div>
      </div>

      <!-- Table -->
      <div v-if="loading" class="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">Cargando...</div>

      <div v-else-if="sales.length === 0" class="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <p class="text-gray-700 font-semibold">Sin ventas todavía</p>
        <p class="text-gray-400 text-sm mt-1">Cuando un cliente complete un checkout en la tienda aparecerá aquí.</p>
      </div>

      <div v-else class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-100">
              <tr class="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th class="px-4 py-3">Fecha</th>
                <th class="px-4 py-3">Cliente</th>
                <th class="px-4 py-3">Productos</th>
                <th class="px-4 py-3 text-right">Items</th>
                <th class="px-4 py-3 text-right">Total</th>
                <th class="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="sale in sales"
                :key="sale.id"
                @click="goToDetail(sale.id)"
                class="hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <td class="px-4 py-3 text-gray-600 whitespace-nowrap">{{ formatDate(sale.created_at) }}</td>
                <td class="px-4 py-3">
                  <p class="font-medium text-gray-900">{{ sale.user?.name ?? '—' }}</p>
                  <p class="text-xs text-gray-400">{{ sale.user?.email }}</p>
                </td>
                <td class="px-4 py-3">
                  <p class="text-gray-700 line-clamp-2">{{ productSummary(sale) }}</p>
                </td>
                <td class="px-4 py-3 text-right text-gray-700">{{ sale.items?.length || 0 }}</td>
                <td class="px-4 py-3 text-right font-semibold text-gray-900">${{ formatMoney(sale.total_amount) }}</td>
                <td class="px-4 py-3">
                  <span :class="statusColor(sale.status)" class="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border">
                    {{ statusLabel(sale.status) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="lastPage > 1" class="flex items-center justify-center gap-2 mt-6">
        <button :disabled="currentPage === 1" @click="goToPage(currentPage - 1)" class="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40">
          ← Prev
        </button>
        <span class="text-sm text-gray-500">Página {{ currentPage }} de {{ lastPage }} · {{ total }} ventas</span>
        <button :disabled="currentPage === lastPage" @click="goToPage(currentPage + 1)" class="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40">
          Next →
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
definePageMeta({
  layout: 'shopping',
  middleware: ['auth', 'shopping'],
})

const { $customFetch } = useNuxtApp()
const route = useRoute()
const router = useRouter()

const apiNs = computed(() => route.path.includes('/shopping/') ? '/shopping' : '/admin')
const detailBase = computed(() => route.path.includes('/shopping/') ? '/app/shopping/purchase-requests' : '/app/admin/purchase-requests')

const sales = ref([])
const stats = ref({})
const loading = ref(true)
const search = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const lastPage = ref(1)
const total = ref(0)
let searchTimer = null

const fetchSales = async () => {
  loading.value = true
  try {
    const res = await $customFetch(`${apiNs.value}/store-sales`, {
      query: {
        page: currentPage.value,
        per_page: 20,
        search: search.value || undefined,
        status: statusFilter.value || undefined,
      },
    })
    sales.value = res.data?.data ?? []
    lastPage.value = res.data?.last_page ?? 1
    total.value = res.data?.total ?? 0
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const fetchStats = async () => {
  try {
    const res = await $customFetch(`${apiNs.value}/store-sales/stats`)
    stats.value = res.data ?? {}
  } catch (e) {
    console.error(e)
  }
}

const goToPage = (p) => {
  currentPage.value = p
  fetchSales()
}

const goToDetail = (id) => router.push(`${detailBase.value}/${id}`)

const productSummary = (sale) => {
  const names = (sale.items ?? []).map(i => i.product_name).filter(Boolean)
  if (names.length === 0) return '—'
  if (names.length <= 2) return names.join(', ')
  return `${names.slice(0, 2).join(', ')} + ${names.length - 2} más`
}

const formatMoney = (n) => Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const formatDate = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })
}

const statusLabel = (s) => ({
  pending_review: 'Pendiente',
  quoted:    'Cotizada',
  paid:      'Pagada',
  purchased: 'Comprada',
  rejected:  'Rechazada',
  cancelled: 'Cancelada',
})[s] ?? s

const statusColor = (s) => ({
  pending_review: 'bg-gray-50 text-gray-600 border-gray-100',
  quoted:    'bg-amber-50 text-amber-700 border-amber-100',
  paid:      'bg-green-50 text-green-700 border-green-100',
  purchased: 'bg-blue-50 text-blue-700 border-blue-100',
  rejected:  'bg-red-50 text-red-700 border-red-100',
  cancelled: 'bg-gray-50 text-gray-500 border-gray-100',
})[s] ?? 'bg-gray-50 text-gray-600 border-gray-100'

watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { currentPage.value = 1; fetchSales() }, 300)
})
watch(statusFilter, () => { currentPage.value = 1; fetchSales() })

onMounted(() => {
  fetchSales()
  fetchStats()
})
</script>
