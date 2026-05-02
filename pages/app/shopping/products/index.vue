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
          to="/app/shopping/products/create"
          class="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/20 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Crear producto
        </NuxtLink>
      </div>

      <!-- Bulk Actions Bar -->
      <div
        v-if="selectedIds.length > 0"
        class="flex items-center justify-between p-3 bg-primary-50 border border-primary-200 rounded-xl mb-4"
      >
        <div class="flex items-center gap-3">
          <span class="text-sm font-medium text-primary-900">
            {{ selectedIds.length }} seleccionado(s)
          </span>
          <button
            @click="clearSelection"
            class="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Limpiar selección
          </button>
        </div>
        <button
          @click="confirmBulkDelete"
          :disabled="deletingBulk"
          class="inline-flex items-center px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 disabled:opacity-50 transition-all"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
          {{ deletingBulk ? 'Eliminando...' : 'Eliminar seleccionados' }}
        </button>
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
              placeholder="Buscar por nombre..."
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
                <th class="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    :checked="allOnPageSelected"
                    :indeterminate.prop="someOnPageSelected && !allOnPageSelected"
                    @change="toggleSelectAll"
                    class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                  />
                </th>
                <th class="px-4 py-3">Producto</th>
                <th class="px-4 py-3 text-right">Precio</th>
                <th class="px-4 py-3">Disponibilidad</th>
                <th class="px-4 py-3">Estado</th>
                <th class="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="p in products"
                :key="p.id"
                :class="[isSelected(p.id) ? 'bg-primary-50/40' : 'hover:bg-gray-50', 'transition-colors']"
              >
                <td class="px-4 py-3">
                  <input
                    type="checkbox"
                    :checked="isSelected(p.id)"
                    @change="toggleSelection(p.id)"
                    class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                  />
                </td>
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
                <td class="px-4 py-3 text-right font-semibold text-gray-900">${{ formatPrice(p.price_cents) }}</td>
                <td class="px-4 py-3">
                  <span :class="stockColor(p.stock_check_status)" class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border">
                    <span :class="stockDot(p.stock_check_status)" class="w-1.5 h-1.5 rounded-full"></span>
                    {{ stockLabel(p.stock_check_status) }}
                  </span>
                  <p v-if="p.last_stock_check_at" class="text-[11px] text-gray-400 mt-1">{{ formatCheckedAt(p.last_stock_check_at) }}</p>
                </td>
                <td class="px-4 py-3">
                  <span :class="statusColor(p.status)" class="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border">
                    {{ statusLabel(p.status) }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right">
                  <NuxtLink :to="`/app/shopping/products/${p.id}/edit`" class="text-primary-600 font-medium hover:text-primary-700 text-sm">Editar</NuxtLink>
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

    <!-- Confirm Bulk Delete Modal -->
    <Teleport to="body">
      <div v-if="showDeleteModal" class="fixed inset-0 z-50 overflow-y-auto">
        <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 sm:p-0">
          <div class="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" @click="showDeleteModal = false"></div>
          <div class="relative inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-2xl shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full p-6">
            <div class="sm:flex sm:items-start">
              <div class="flex items-center justify-center flex-shrink-0 w-12 h-12 mx-auto bg-red-100 rounded-full sm:mx-0 sm:h-10 sm:w-10">
                <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
              </div>
              <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 class="text-lg font-medium leading-6 text-gray-900">¿Eliminar productos?</h3>
                <p class="mt-2 text-sm text-gray-500">
                  Se desactivarán {{ selectedIds.length }} producto(s). Pasarán a estado <strong>inactivo</strong> y se ocultarán de la tienda. El historial de órdenes se conserva.
                </p>
              </div>
            </div>
            <div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
              <button
                @click="bulkDelete"
                :disabled="deletingBulk"
                class="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-red-600 border border-transparent rounded-lg shadow-sm hover:bg-red-700 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {{ deletingBulk ? 'Eliminando...' : 'Sí, eliminar' }}
              </button>
              <button
                @click="showDeleteModal = false"
                :disabled="deletingBulk"
                class="inline-flex justify-center w-full px-4 py-2 mt-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<script setup>
definePageMeta({
  layout: 'shopping',
  middleware: ['auth', 'shopping'],
})

const { $customFetch, $toast } = useNuxtApp()

const products = ref([])
const loading = ref(true)
const search = ref('')
const statusFilter = ref('')
const perPage = ref(20)
const currentPage = ref(1)
const lastPage = ref(1)
const total = ref(0)
let searchTimer = null

// Bulk selection
const selectedIds = ref([])
const showDeleteModal = ref(false)
const deletingBulk = ref(false)

const isSelected = (id) => selectedIds.value.includes(id)
const toggleSelection = (id) => {
  const idx = selectedIds.value.indexOf(id)
  if (idx > -1) selectedIds.value.splice(idx, 1)
  else selectedIds.value.push(id)
}

const allOnPageSelected = computed(
  () => products.value.length > 0 && products.value.every(p => selectedIds.value.includes(p.id))
)
const someOnPageSelected = computed(
  () => products.value.some(p => selectedIds.value.includes(p.id))
)

const toggleSelectAll = () => {
  if (allOnPageSelected.value) {
    // Deselect just the ones on this page (preserve cross-page selection)
    const pageIds = new Set(products.value.map(p => p.id))
    selectedIds.value = selectedIds.value.filter(id => !pageIds.has(id))
  } else {
    const merged = new Set([...selectedIds.value, ...products.value.map(p => p.id)])
    selectedIds.value = [...merged]
  }
}

const clearSelection = () => { selectedIds.value = [] }

const confirmBulkDelete = () => {
  if (selectedIds.value.length > 0) showDeleteModal.value = true
}

const bulkDelete = async () => {
  deletingBulk.value = true
  try {
    const res = await $customFetch('/shopping/products/bulk', {
      method: 'DELETE',
      body: { ids: selectedIds.value },
    })
    $toast?.success?.(res?.message ?? 'Productos eliminados')
    showDeleteModal.value = false
    selectedIds.value = []
    await fetchProducts()
  } catch (err) {
    console.error(err)
    $toast?.error?.(err?.data?.message ?? 'Error al eliminar productos')
  } finally {
    deletingBulk.value = false
  }
}

const fetchProducts = async () => {
  loading.value = true
  try {
    const res = await $customFetch('/shopping/products', {
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

const stockLabel = (s) => ({
  in_stock:     'En stock',
  out_of_stock: 'Agotado',
  unknown:      'Sin verificar',
})[s] ?? 'Sin verificar'

const stockColor = (s) => ({
  in_stock:     'bg-green-50 text-green-700 border-green-100',
  out_of_stock: 'bg-red-50 text-red-700 border-red-100',
  unknown:      'bg-gray-50 text-gray-500 border-gray-100',
})[s] ?? 'bg-gray-50 text-gray-500 border-gray-100'

const stockDot = (s) => ({
  in_stock:     'bg-green-500',
  out_of_stock: 'bg-red-500',
  unknown:      'bg-gray-400',
})[s] ?? 'bg-gray-400'

const formatCheckedAt = (iso) => {
  const d = new Date(iso)
  const diffMin = Math.round((Date.now() - d.getTime()) / 60000)
  if (diffMin < 1) return 'hace segundos'
  if (diffMin < 60) return `hace ${diffMin} min`
  const diffH = Math.round(diffMin / 60)
  if (diffH < 24) return `hace ${diffH}h`
  const diffD = Math.round(diffH / 24)
  return `hace ${diffD}d`
}

watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { currentPage.value = 1; fetchProducts() }, 300)
})

watch(statusFilter, () => { currentPage.value = 1; fetchProducts() })
watch(perPage, () => { currentPage.value = 1; fetchProducts() })

onMounted(fetchProducts)
</script>
