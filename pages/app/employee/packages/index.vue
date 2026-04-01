<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-1">Package Queue</h1>
      <p class="text-gray-500 text-sm">Orders waiting for packages to arrive</p>
    </div>

    <!-- Search -->
    <div class="mb-4">
      <input
        v-model="search"
        type="text"
        placeholder="Search by customer name..."
        class="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
        @input="onSearch"
      />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-12 text-gray-400">
      Loading...
    </div>

    <!-- Empty state -->
    <div v-else-if="orders.length === 0" class="text-center py-12">
      <p class="text-gray-400 text-lg">No orders waiting for packages</p>
    </div>

    <!-- Order list -->
    <div v-else class="space-y-3">
      <NuxtLink
        v-for="order in orders"
        :key="order.id"
        :to="`/app/employee/packages/${order.id}`"
        class="block bg-white rounded-xl border border-gray-200 p-4 shadow-sm active:bg-gray-50"
      >
        <div class="flex items-start justify-between mb-2">
          <div>
            <p class="font-semibold text-gray-900 text-base">{{ order.user?.name }}</p>
            <p class="text-gray-400 text-sm">Order #{{ order.order_number }}</p>
          </div>
          <span
            v-if="order.all_items_arrived"
            class="text-xs font-medium bg-green-100 text-green-700 px-2 py-1 rounded-full"
          >
            Ready for photo
          </span>
          <span v-else class="text-xs font-medium bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
            {{ order.pending_items }} pending
          </span>
        </div>

        <!-- Progress bar -->
        <div class="mt-3">
          <div class="flex justify-between text-xs text-gray-400 mb-1">
            <span>{{ order.arrived_items }} / {{ order.total_items }} items arrived</span>
          </div>
          <div class="w-full bg-gray-100 rounded-full h-2">
            <div
              class="bg-green-500 h-2 rounded-full transition-all"
              :style="{ width: order.total_items > 0 ? `${(order.arrived_items / order.total_items) * 100}%` : '0%' }"
            />
          </div>
        </div>
      </NuxtLink>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex justify-center gap-3 mt-6">
      <button
        :disabled="page === 1"
        class="px-4 py-2 rounded-lg border text-sm disabled:opacity-40"
        @click="changePage(page - 1)"
      >
        Prev
      </button>
      <span class="py-2 text-sm text-gray-500">{{ page }} / {{ totalPages }}</span>
      <button
        :disabled="page === totalPages"
        class="px-4 py-2 rounded-lg border text-sm disabled:opacity-40"
        @click="changePage(page + 1)"
      >
        Next
      </button>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'employee',
  middleware: ['auth', 'employee'],
})

const { $customFetch } = useNuxtApp()

const search = ref('')
const orders = ref([])
const loading = ref(true)
const page = ref(1)
const totalPages = ref(1)
let searchTimeout = null

const fetchOrders = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({ page: page.value })
    if (search.value) params.set('search', search.value)

    const data = await $customFetch(`/employee/orders?${params}`)
    orders.value = data.data?.data ?? []
    totalPages.value = data.data?.last_page ?? 1
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const onSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    page.value = 1
    fetchOrders()
  }, 300)
}

const changePage = (p) => {
  page.value = p
  fetchOrders()
}

onMounted(fetchOrders)
</script>
