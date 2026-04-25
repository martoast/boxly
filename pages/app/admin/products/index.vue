<template>
  <section class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

      <!-- Header -->
      <div class="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900">Productos de la Tienda</h1>
          <p class="text-sm text-gray-500 mt-1">Catálogo de Boxly Store</p>
        </div>
        <NuxtLink
          to="/app/admin/products/create"
          class="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/20 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Crear producto
        </NuxtLink>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div class="relative">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              v-model="search"
              placeholder="Buscar por nombre o SKU..."
              class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select v-model="statusFilter" class="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="draft">Borradores</option>
            <option value="inactive">Inactivos</option>
            <option value="sold_out">Agotados</option>
          </select>
          <select v-model="perPage" class="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option :value="20">20 / página</option>
            <option :value="50">50 / página</option>
            <option :value="100">100 / página</option>
          </select>
        </div>
      </div>

      <!-- Table -->
      <div v-if="loading" class="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">Cargando...</div>

      <div v-else-if="products.length === 0" class="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <p class="text-gray-700 font-semibold">Sin productos</p>
        <p class="text-gray-400 text-sm mt-1">Crea tu primer producto para empezar.</p>
      </div>

      <div v-else class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-100">
              <tr class="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th class="px-4 py-3">Producto</th>
                <th class="px-4 py-3">SKU</th>
                <th class="px-4 py-3 text-right">Precio</th>
                <th class="px-4 py-3 text-right">Stock</th>
                <th class="px-4 py-3">Estado</th>
                <th class="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="p in products" :key="p.id" class="hover:bg-gray-50 transition-colors">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                      <img v-if="p.first_image_url" :src="p.first_image_url" alt="" class="w-full h-full object-cover" />
                    </div>
                    <div class="min-w-0">
                      <p class="font-medium text-gray-900 line-clamp-1">{{ p.name }}</p>
                      <p class="text-xs text-gray-400 font-mono">{{ p.slug }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-3 text-gray-500 font-mono text-xs">{{ p.sku ?? '—' }}</td>
                <td class="px-4 py-3 text-right font-semibold text-gray-900">${{ formatPrice(p.price_cents) }}</td>
                <td class="px-4 py-3 text-right">
                  <span :class="p.stock <= 0 ? 'text-red-600' : p.stock <= 10 ? 'text-amber-600' : 'text-gray-900'" class="font-medium">{{ p.stock }}</span>
                </td>
                <td class="px-4 py-3">
                  <span :class="statusColor(p.status)" class="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border">
                    {{ statusLabel(p.status) }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right">
                  <NuxtLink :to="`/app/admin/products/${p.id}/edit`" class="text-primary-600 font-medium hover:text-primary-700 text-sm">Editar</NuxtLink>
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
        <span class="text-sm text-gray-500">Página {{ currentPage }} de {{ lastPage }} · {{ total }} productos</span>
        <button :disabled="currentPage === lastPage" @click="goToPage(currentPage + 1)" class="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40">
          Next →
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
definePageMeta({
  middleware: ['auth', 'admin'],
})

const { $customFetch } = useNuxtApp()

const products = ref([])
const loading = ref(true)
const search = ref('')
const statusFilter = ref('')
const perPage = ref(20)
const currentPage = ref(1)
const lastPage = ref(1)
const total = ref(0)
let searchTimer = null

const fetchProducts = async () => {
  loading.value = true
  try {
    const res = await $customFetch('/admin/products', {
      query: {
        page: currentPage.value,
        per_page: perPage.value,
        search: search.value || undefined,
        status: statusFilter.value || undefined,
      },
    })
    products.value = res.data?.data ?? []
    lastPage.value = res.data?.last_page ?? 1
    total.value = res.data?.total ?? 0
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const goToPage = (p) => {
  currentPage.value = p
  fetchProducts()
}

const formatPrice = (cents) => (cents / 100).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const statusLabel = (s) => ({
  active: 'Activo',
  draft: 'Borrador',
  inactive: 'Inactivo',
  sold_out: 'Agotado',
})[s] ?? s

const statusColor = (s) => ({
  active:   'bg-green-50 text-green-700 border-green-100',
  draft:    'bg-gray-50 text-gray-600 border-gray-100',
  inactive: 'bg-red-50 text-red-700 border-red-100',
  sold_out: 'bg-amber-50 text-amber-700 border-amber-100',
})[s] ?? 'bg-gray-50 text-gray-600 border-gray-100'

watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { currentPage.value = 1; fetchProducts() }, 300)
})

watch(statusFilter, () => { currentPage.value = 1; fetchProducts() })
watch(perPage, () => { currentPage.value = 1; fetchProducts() })

onMounted(fetchProducts)
</script>
