<template>
  <section class="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-20">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-4xl font-extrabold text-gray-900">{{ t.title }}</h1>
        <p class="text-gray-500 mt-2 text-lg">{{ t.subtitle }}</p>
      </div>

      <!-- Open shipment banner -->
      <div
        v-if="openOrder"
        class="mb-6 bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200 rounded-2xl p-4 flex items-center justify-between gap-4"
      >
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-xl bg-primary-500 flex items-center justify-center text-white shrink-0">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
          </div>
          <div class="min-w-0">
            <p class="font-semibold text-gray-900 text-sm">{{ t.openShipment }}</p>
            <p class="text-xs text-gray-500">
              {{ openOrder.item_count }} {{ openOrder.item_count === 1 ? t.product : t.products }} · ~{{ Number(openOrder.total_weight_kg).toFixed(1) }} kg
              <span v-if="estimatedBox && estimatedBox !== 'over_50'">· {{ t.estBox }} {{ estimatedBox }}</span>
            </p>
          </div>
        </div>
        <NuxtLink
          :to="`/app/marketplace-orders/${openOrder.id}`"
          class="text-primary-600 text-sm font-semibold hover:text-primary-700 whitespace-nowrap"
        >
          {{ t.viewShipment }} →
        </NuxtLink>
      </div>

      <!-- Search + filters -->
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
        <div class="flex flex-col md:flex-row gap-3">
          <div class="relative flex-1">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              v-model="search"
              type="text"
              :placeholder="t.searchPlaceholder"
              class="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <select
            v-model="sort"
            class="px-4 py-3 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="newest">{{ t.sortNewest }}</option>
            <option value="price_asc">{{ t.sortPriceAsc }}</option>
            <option value="price_desc">{{ t.sortPriceDesc }}</option>
          </select>
        </div>

        <!-- Category pills -->
        <div v-if="categories.length > 0" class="flex flex-wrap gap-2 mt-4">
          <button
            @click="setCategory(null)"
            :class="[
              !selectedCategory
                ? 'bg-primary-500 text-white border-primary-500'
                : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300',
              'px-4 py-1.5 rounded-full border text-sm font-medium transition-colors'
            ]"
          >
            {{ t.all }}
          </button>
          <button
            v-for="cat in categories"
            :key="cat"
            @click="setCategory(cat)"
            :class="[
              selectedCategory === cat
                ? 'bg-primary-500 text-white border-primary-500'
                : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300',
              'px-4 py-1.5 rounded-full border text-sm font-medium transition-colors'
            ]"
          >
            {{ cat }}
          </button>
        </div>
      </div>

      <!-- Loading skeleton -->
      <div v-if="loading" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div v-for="i in 8" :key="i" class="bg-white rounded-2xl border border-gray-100 animate-pulse">
          <div class="aspect-square bg-gray-200 rounded-t-2xl"></div>
          <div class="p-4 space-y-2">
            <div class="h-4 bg-gray-200 rounded w-3/4"></div>
            <div class="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else-if="products.length === 0" class="text-center py-16 bg-white rounded-2xl border border-gray-100">
        <div class="h-16 w-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center text-gray-300">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
          </svg>
        </div>
        <p class="text-gray-700 font-semibold">{{ t.noResults }}</p>
        <p class="text-gray-400 text-sm mt-1">{{ t.tryAdjusting }}</p>
      </div>

      <!-- Product grid -->
      <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <ProductCard v-for="product in products" :key="product.id" :product="product" />
      </div>

      <!-- Pagination -->
      <div v-if="lastPage > 1" class="flex items-center justify-center gap-2 mt-10">
        <button
          :disabled="currentPage === 1"
          @click="goToPage(currentPage - 1)"
          class="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ← {{ t.prev }}
        </button>

        <button
          v-for="p in pageRange"
          :key="p"
          @click="typeof p === 'number' && goToPage(p)"
          :disabled="p === '...'"
          :class="[
            p === currentPage
              ? 'bg-primary-500 text-white border-primary-500'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50',
            p === '...' ? 'cursor-default' : '',
            'min-w-10 px-3 py-2 rounded-xl border text-sm font-medium transition-colors'
          ]"
        >
          {{ p }}
        </button>

        <button
          :disabled="currentPage === lastPage"
          @click="goToPage(currentPage + 1)"
          class="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {{ t.next }} →
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import ProductCard from '~/components/store/ProductCard.vue'

definePageMeta({
  layout: 'default',
})

const { $customFetch } = useNuxtApp()
const { t: createTranslations } = useLanguage()
const route = useRoute()
const router = useRouter()

const t = createTranslations({
  title:           { es: 'Tienda Boxly', en: 'Boxly Store' },
  subtitle:        { es: 'Productos curados, listos para llegar a tu casa.', en: 'Curated products ready to ship to your door.' },
  searchPlaceholder: { es: 'Buscar productos...', en: 'Search products...' },
  sortNewest:      { es: 'Más recientes', en: 'Newest' },
  sortPriceAsc:    { es: 'Precio: menor a mayor', en: 'Price: low to high' },
  sortPriceDesc:   { es: 'Precio: mayor a menor', en: 'Price: high to low' },
  all:             { es: 'Todos', en: 'All' },
  noResults:       { es: 'No encontramos productos', en: 'No products found' },
  tryAdjusting:    { es: 'Intenta ajustar tu búsqueda o filtros', en: 'Try adjusting your search or filters' },
  prev:            { es: 'Anterior', en: 'Prev' },
  next:            { es: 'Siguiente', en: 'Next' },
  openShipment:    { es: 'Tu envío actual', en: 'Your current shipment' },
  product:         { es: 'producto', en: 'product' },
  products:        { es: 'productos', en: 'products' },
  estBox:          { es: 'caja estimada', en: 'estimated box' },
  viewShipment:    { es: 'Ver envío', en: 'View shipment' },
})

const { openOrder, refreshOpenOrder, estimatedBox } = useStoreCart()

const products = ref([])
const categories = ref([])
const loading = ref(true)
const search = ref(route.query.search?.toString() ?? '')
const selectedCategory = ref(route.query.category?.toString() ?? null)
const sort = ref(route.query.sort?.toString() ?? 'newest')
const currentPage = ref(parseInt(route.query.page?.toString() ?? '1', 10) || 1)
const lastPage = ref(1)
const total = ref(0)

let searchTimer = null

const fetchProducts = async () => {
  loading.value = true
  try {
    const res = await $customFetch('/store/products', {
      query: {
        page: currentPage.value,
        per_page: 24,
        search: search.value || undefined,
        category: selectedCategory.value || undefined,
        sort: sort.value,
      },
    })
    products.value = res.data?.data ?? []
    lastPage.value = res.data?.last_page ?? 1
    total.value = res.data?.total ?? 0

    // Update URL query
    router.replace({
      query: {
        ...(currentPage.value > 1 ? { page: currentPage.value } : {}),
        ...(search.value ? { search: search.value } : {}),
        ...(selectedCategory.value ? { category: selectedCategory.value } : {}),
        ...(sort.value !== 'newest' ? { sort: sort.value } : {}),
      },
    })
  } catch (err) {
    console.error('Failed to load products', err)
  } finally {
    loading.value = false
  }
}

const fetchCategories = async () => {
  try {
    const res = await $customFetch('/store/categories')
    categories.value = res.data ?? []
  } catch {}
}

const setCategory = (cat) => {
  selectedCategory.value = cat
  currentPage.value = 1
  fetchProducts()
}

const goToPage = (p) => {
  if (p < 1 || p > lastPage.value) return
  currentPage.value = p
  fetchProducts()
  if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Smart pagination range with ellipses
const pageRange = computed(() => {
  const total = lastPage.value
  const cur = currentPage.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const range = []
  range.push(1)
  if (cur > 3) range.push('...')
  const start = Math.max(2, cur - 1)
  const end = Math.min(total - 1, cur + 1)
  for (let i = start; i <= end; i++) range.push(i)
  if (cur < total - 2) range.push('...')
  range.push(total)
  return range
})

watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    currentPage.value = 1
    fetchProducts()
  }, 300)
})

watch(sort, () => {
  currentPage.value = 1
  fetchProducts()
})

onMounted(() => {
  fetchProducts()
  fetchCategories()
  refreshOpenOrder()
})
</script>
