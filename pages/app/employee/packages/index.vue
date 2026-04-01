<template>
  <div>
    <!-- Page header -->
    <div class="mb-6">
      <h1 class="text-2xl font-extrabold text-gray-900">Package Queue</h1>
      <p class="text-sm text-gray-500 mt-0.5">Orders waiting for packages to arrive at the warehouse</p>
    </div>

    <!-- Search -->
    <div class="relative mb-5">
      <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        v-model="search"
        type="text"
        placeholder="Search by customer name..."
        class="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm"
        @input="onSearch"
      />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 4" :key="i" class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 animate-pulse">
        <div class="flex justify-between mb-3">
          <div>
            <div class="h-4 w-36 bg-gray-200 rounded mb-2" />
            <div class="h-3 w-24 bg-gray-100 rounded" />
          </div>
          <div class="h-6 w-20 bg-gray-100 rounded-full" />
        </div>
        <div class="h-2 w-full bg-gray-100 rounded-full" />
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="orders.length === 0" class="text-center py-16">
      <div class="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4" />
        </svg>
      </div>
      <p class="font-semibold text-gray-700">No orders in queue</p>
      <p class="text-sm text-gray-400 mt-1">All caught up! Check back later.</p>
    </div>

    <!-- Order list -->
    <div v-else class="space-y-3">
      <NuxtLink
        v-for="order in orders"
        :key="order.id"
        :to="`/app/employee/packages/${order.id}`"
        class="block bg-white rounded-2xl border border-gray-100 shadow-sm p-4 transition-all duration-200 active:scale-[0.99] hover:shadow-md hover:border-primary-100"
      >
        <div class="flex items-start justify-between mb-3">
          <div class="flex-1 min-w-0 pr-3">
            <p class="font-bold text-gray-900 text-base truncate">{{ order.user?.name }}</p>
            <p class="text-xs text-gray-400 mt-0.5 font-mono">{{ order.order_number }}</p>
          </div>
          <!-- Badge -->
          <span
            v-if="order.all_items_arrived"
            class="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-100"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-green-500" />
            Ready
          </span>
          <span v-else class="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
            <span class="h-1.5 w-1.5 rounded-full bg-amber-400" />
            {{ order.pending_items }} pending
          </span>
        </div>

        <!-- Progress -->
        <div>
          <div class="flex justify-between text-xs text-gray-400 mb-1.5">
            <span>{{ order.arrived_items }} of {{ order.total_items }} items arrived</span>
            <span class="font-medium" :class="order.all_items_arrived ? 'text-green-600' : 'text-gray-400'">
              {{ order.total_items > 0 ? Math.round((order.arrived_items / order.total_items) * 100) : 0 }}%
            </span>
          </div>
          <div class="w-full bg-gray-100 rounded-full h-1.5">
            <div
              class="h-1.5 rounded-full transition-all duration-500"
              :class="order.all_items_arrived ? 'bg-green-500' : 'bg-primary-500'"
              :style="{ width: order.total_items > 0 ? `${(order.arrived_items / order.total_items) * 100}%` : '0%' }"
            />
          </div>
        </div>

        <!-- Arrow -->
        <div class="flex justify-end mt-2">
          <svg class="h-4 w-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </NuxtLink>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex justify-center items-center gap-3 mt-6">
      <button
        :disabled="page === 1"
        class="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors"
        @click="changePage(page - 1)"
      >
        ← Prev
      </button>
      <span class="text-sm text-gray-500">{{ page }} / {{ totalPages }}</span>
      <button
        :disabled="page === totalPages"
        class="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors"
        @click="changePage(page + 1)"
      >
        Next →
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
