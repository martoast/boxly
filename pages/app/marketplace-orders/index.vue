<template>
  <section class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20">

    <!-- Header -->
    <div class="bg-white/90 backdrop-blur-sm shadow-sm border-b border-gray-100">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900">{{ t.title }}</h1>
        <p class="text-sm text-gray-500 mt-1">{{ t.subtitle }}</p>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

      <!-- Loading -->
      <div v-if="loading" class="space-y-3">
        <div v-for="i in 3" :key="i" class="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
          <div class="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div class="h-3 bg-gray-100 rounded w-1/2"></div>
        </div>
      </div>

      <!-- Empty -->
      <div v-else-if="orders.length === 0" class="text-center py-16 bg-white rounded-2xl border border-gray-100">
        <div class="h-20 w-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center text-gray-300">
          <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
          </svg>
        </div>
        <p class="text-xl font-semibold text-gray-700">{{ t.empty }}</p>
        <p class="text-gray-400 mt-1">{{ t.emptyDesc }}</p>
        <NuxtLink to="/shop" class="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-colors">
          {{ t.goToShop }}
        </NuxtLink>
      </div>

      <!-- List -->
      <div v-else class="space-y-3">
        <NuxtLink
          v-for="order in orders"
          :key="order.id"
          :to="`/app/marketplace-orders/${order.id}`"
          class="block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-primary-200 transition-all duration-200 p-5"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <p class="font-bold text-gray-900 font-mono text-sm">{{ order.order_number }}</p>
                <StatusBadge :status="order.status" />
              </div>
              <p class="text-xs text-gray-400">{{ formatDate(order.created_at) }} · {{ totalItems(order) }} {{ totalItems(order) === 1 ? t.item : t.items }}</p>
              <p class="text-sm text-gray-700 mt-2 font-semibold">${{ formatPrice(order.items_subtotal_cents) }} MXN <span class="text-xs text-gray-400 font-normal">{{ t.products }}</span></p>
            </div>
            <svg class="w-5 h-5 text-gray-300 shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </div>
        </NuxtLink>
      </div>

      <!-- Pagination -->
      <div v-if="lastPage > 1" class="flex items-center justify-center gap-2 mt-8">
        <button :disabled="currentPage === 1" @click="goToPage(currentPage - 1)" class="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40">
          ← {{ t.prev }}
        </button>
        <span class="text-sm text-gray-500">{{ currentPage }} / {{ lastPage }}</span>
        <button :disabled="currentPage === lastPage" @click="goToPage(currentPage + 1)" class="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40">
          {{ t.next }} →
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import StatusBadge from '~/components/store/MarketplaceStatusBadge.vue'

definePageMeta({
  middleware: ['auth'],
})

const { $customFetch } = useNuxtApp()
const { t: createTranslations } = useLanguage()

const t = createTranslations({
  title:    { es: 'Mis Pedidos de la Tienda', en: 'My Store Orders' },
  subtitle: { es: 'Productos comprados en la Tienda Boxly', en: 'Items purchased on the Boxly Store' },
  empty:    { es: 'Sin pedidos todavía', en: 'No orders yet' },
  emptyDesc:{ es: 'Cuando compres en la Tienda, los verás aquí.', en: 'When you buy from the Store, your orders show up here.' },
  goToShop: { es: 'Ir a la Tienda', en: 'Go to Store' },
  item:     { es: 'producto', en: 'item' },
  items:    { es: 'productos', en: 'items' },
  products: { es: 'productos', en: 'products' },
  prev:     { es: 'Anterior', en: 'Prev' },
  next:     { es: 'Siguiente', en: 'Next' },
})

const orders = ref([])
const loading = ref(true)
const currentPage = ref(1)
const lastPage = ref(1)

const fetchOrders = async () => {
  loading.value = true
  try {
    const res = await $customFetch('/marketplace/orders', {
      query: { page: currentPage.value },
    })
    orders.value = res.data?.data ?? []
    lastPage.value = res.data?.last_page ?? 1
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const goToPage = (p) => {
  currentPage.value = p
  fetchOrders()
}

const formatDate = (d) => new Date(d).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })
const formatPrice = (cents) => (cents / 100).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const totalItems = (order) => (order.items ?? []).reduce((s, i) => s + i.quantity, 0)

onMounted(fetchOrders)
</script>
