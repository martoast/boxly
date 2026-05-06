<template>
  <div>
    <!-- LANDING MODE — bare /shop with no filters/view applied -->
    <template v-if="isLandingMode">
      <ShopLandingHeroBanner />
      <ShopLandingFeaturedProducts />
      <ShopLandingBrandShowcase />
    </template>

    <!-- CATALOG MODE — any filter (category, store, search) or ?view=all -->
    <section v-else class="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <!-- Header -->
        <div class="mb-6">
          <h1 class="text-3xl sm:text-4xl font-extrabold text-gray-900">{{ catalogTitle }}</h1>
          <p v-if="total > 0" class="text-gray-500 mt-1 text-sm">{{ total }} {{ total === 1 ? 'producto' : 'productos' }}</p>
        </div>

        <!-- Slim toolbar — Show Filters · Sort · active filter chips -->
        <div class="flex items-center justify-between gap-3 mb-2 flex-wrap">
          <button
            type="button"
            @click="filtersOpen = true"
            class="inline-flex items-center gap-2 text-sm font-semibold text-gray-900 hover:text-primary-600 transition-colors"
          >
            <span>{{ t.showFilters }}</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 4h18M6 12h12m-9 8h6"/>
            </svg>
          </button>

          <select
            v-model="sort"
            class="text-sm font-semibold text-gray-700 bg-transparent border border-gray-200 rounded-full pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="newest">{{ t.sortNewest }}</option>
            <option value="price_asc">{{ t.sortPriceAsc }}</option>
            <option value="price_desc">{{ t.sortPriceDesc }}</option>
          </select>
        </div>

        <!-- Active filter chips -->
        <div v-if="hasActiveFilters" class="flex flex-wrap items-center gap-2 mb-6">
          <span
            v-if="search"
            class="inline-flex items-center gap-1.5 pl-3 pr-1 py-1 rounded-full border border-gray-200 bg-white text-xs font-medium text-gray-700"
          >
            {{ t.searchPlaceholder.replace('...', '') }}: <strong class="font-semibold">{{ search }}</strong>
            <button type="button" @click="clearSearch" class="ml-1 inline-flex items-center justify-center h-5 w-5 rounded-full hover:bg-gray-100">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </span>
          <span
            v-if="selectedStoreObj"
            class="inline-flex items-center gap-1.5 pl-3 pr-1 py-1 rounded-full border border-gray-200 bg-white text-xs font-medium text-gray-700"
          >
            {{ t.storesLabel.replace(':','') }}: <strong class="font-semibold">{{ selectedStoreObj.name }}</strong>
            <button type="button" @click="setStore(null)" class="ml-1 inline-flex items-center justify-center h-5 w-5 rounded-full hover:bg-gray-100">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </span>
          <span
            v-if="selectedCategoryObj"
            class="inline-flex items-center gap-1.5 pl-3 pr-1 py-1 rounded-full border border-gray-200 bg-white text-xs font-medium text-gray-700"
          >
            {{ t.categoryLabel.replace(':','') }}: <strong class="font-semibold">{{ selectedCategoryObj.name }}</strong>
            <button type="button" @click="setCategory(null)" class="ml-1 inline-flex items-center justify-center h-5 w-5 rounded-full hover:bg-gray-100">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </span>
          <button
            type="button"
            @click="clearAllFilters"
            class="text-xs text-gray-500 hover:text-gray-900 font-semibold underline ml-1"
          >{{ t.clearAll }}</button>
        </div>

        <!-- Filters drawer -->
        <Teleport to="body">
          <Transition
            enter-active-class="transition-opacity duration-200"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition-opacity duration-200"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
          >
            <div v-if="filtersOpen" class="fixed inset-0 z-50 bg-black/40" @click="filtersOpen = false">
              <div
                class="absolute left-0 top-0 h-full w-full sm:w-96 max-w-[100vw] bg-white shadow-2xl flex flex-col"
                @click.stop
              >
                <div class="flex items-center justify-between p-4 border-b border-gray-100">
                  <button
                    type="button"
                    @click="filtersOpen = false"
                    class="inline-flex items-center gap-2 text-sm font-semibold text-gray-900 hover:text-primary-600 transition-colors"
                  >
                    <span>{{ t.hideFilters }}</span>
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 4h18M6 12h12m-9 8h6"/>
                    </svg>
                  </button>
                  <button
                    @click="filtersOpen = false"
                    class="h-9 w-9 inline-flex items-center justify-center rounded-full hover:bg-gray-100"
                    aria-label="Cerrar"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>

                <div class="flex-1 overflow-y-auto p-5 space-y-6">
                  <!-- Search -->
                  <div>
                    <label class="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">{{ t.searchPlaceholder.replace('...','') }}</label>
                    <div class="relative">
                      <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                      <input
                        v-model="search"
                        type="text"
                        :placeholder="t.searchPlaceholder"
                        class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <!-- Categoría -->
                  <details v-if="categories.length > 0" open class="group">
                    <summary class="flex items-center justify-between cursor-pointer list-none py-2 border-t border-gray-100">
                      <span class="text-sm font-bold text-gray-900 uppercase tracking-wider">{{ t.categoryLabel.replace(':','') }}</span>
                      <svg class="w-4 h-4 text-gray-500 transition-transform group-open:rotate-45" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m-8-8h16"/></svg>
                    </summary>
                    <div class="space-y-1 pt-2">
                      <button
                        type="button"
                        @click="setCategory(null)"
                        :class="[!selectedCategory ? 'text-gray-900 font-semibold' : 'text-gray-600 hover:text-gray-900', 'block w-full text-left text-sm py-1.5']"
                      >{{ t.all }}</button>
                      <button
                        v-for="c in categories"
                        :key="c.id"
                        type="button"
                        @click="setCategory(c.id)"
                        :class="[selectedCategory === c.id ? 'text-gray-900 font-semibold' : 'text-gray-600 hover:text-gray-900', 'block w-full text-left text-sm py-1.5']"
                      >{{ c.name }}</button>
                    </div>
                  </details>

                  <!-- Tienda -->
                  <details v-if="stores.length > 0" open class="group">
                    <summary class="flex items-center justify-between cursor-pointer list-none py-2 border-t border-gray-100">
                      <span class="text-sm font-bold text-gray-900 uppercase tracking-wider">{{ t.storesLabel.replace(':','') }}</span>
                      <svg class="w-4 h-4 text-gray-500 transition-transform group-open:rotate-45" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m-8-8h16"/></svg>
                    </summary>
                    <div class="space-y-1 pt-2">
                      <button
                        type="button"
                        @click="setStore(null)"
                        :class="[!selectedStore ? 'text-gray-900 font-semibold' : 'text-gray-600 hover:text-gray-900', 'block w-full text-left text-sm py-1.5']"
                      >{{ t.all }}</button>
                      <button
                        v-for="s in stores"
                        :key="s.id"
                        type="button"
                        @click="setStore(s.id)"
                        :class="[selectedStore === s.id ? 'text-gray-900 font-semibold' : 'text-gray-600 hover:text-gray-900', 'flex items-center gap-2 w-full text-left text-sm py-1.5']"
                      >
                        <img v-if="s.logo_url" :src="s.logo_url" alt="" class="h-5 w-5 rounded-full object-cover" />
                        {{ s.name }}
                      </button>
                    </div>
                  </details>
                </div>

                <div class="border-t border-gray-100 p-4 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    @click="clearAllFilters"
                    class="text-sm font-semibold text-gray-500 hover:text-gray-900 underline"
                  >{{ t.clearAll }}</button>
                  <button
                    type="button"
                    @click="filtersOpen = false"
                    class="px-5 py-2.5 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
                  >Ver {{ total }} {{ total === 1 ? 'producto' : 'productos' }}</button>
                </div>
              </div>
            </div>
          </Transition>
        </Teleport>

        <!-- Loading skeleton -->
        <div v-if="loading" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-fr">
          <div v-for="i in 8" :key="i" class="bg-white rounded-2xl border border-gray-100 animate-pulse">
            <div class="aspect-[4/5] bg-gray-200 rounded-t-2xl"></div>
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
        <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-fr">
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
            v-for="(p, i) in pageRange"
            :key="i"
            @click="typeof p === 'number' ? goToPage(p) : null"
            :disabled="typeof p !== 'number'"
            :class="[
              p === currentPage ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50',
              'min-w-10 px-3 py-2 rounded-xl border text-sm font-medium transition-colors',
              typeof p !== 'number' ? 'cursor-default' : '',
            ]"
          >{{ p }}</button>
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
  </div>
</template>

<script setup>
import ProductCard from '~/components/store/ProductCard.vue'

definePageMeta({
  layout: 'shop',
})

const { $customFetch } = useNuxtApp()
const { t: createTranslations } = useLanguage()
const route = useRoute()
const router = useRouter()

const t = createTranslations({
  searchPlaceholder: { es: 'Buscar productos...', en: 'Search products...' },
  sortNewest:        { es: 'Más recientes', en: 'Newest' },
  sortPriceAsc:      { es: 'Precio: menor a mayor', en: 'Price: low to high' },
  sortPriceDesc:     { es: 'Precio: mayor a menor', en: 'Price: high to low' },
  all:               { es: 'Todos', en: 'All' },
  noResults:         { es: 'No encontramos productos', en: 'No products found' },
  tryAdjusting:      { es: 'Intenta ajustar tu búsqueda o filtros', en: 'Try adjusting your search or filters' },
  prev:              { es: 'Anterior', en: 'Prev' },
  next:              { es: 'Siguiente', en: 'Next' },
  storesLabel:       { es: 'Tienda:', en: 'Store:' },
  categoryLabel:     { es: 'Categoría:', en: 'Category:' },
  showFilters:       { es: 'Mostrar filtros', en: 'Show filters' },
  hideFilters:       { es: 'Ocultar filtros', en: 'Hide filters' },
  clearAll:          { es: 'Limpiar todo', en: 'Clear all' },
})

// Bare /shop with no query params → landing mode. Any filter or
// ?view=all → catalog mode.
const isLandingMode = computed(() => {
  const q = route.query
  return !q.category_id && !q.store_id && !q.search && q.view !== 'all'
})

// SEO meta
useHead(() => ({
  title: isLandingMode.value
    ? 'Tienda Boxly — Compra en EUA, recibe en México'
    : 'Productos — Tienda Boxly',
  meta: [
    {
      name: 'description',
      content: 'Compra en cualquier tienda de Estados Unidos y recíbelo en México. Productos curados de tus marcas favoritas.',
    },
  ],
}))

// Categories — used by both the always-visible CategoryNav strip AND
// the landing's category grid (shared via the ShopLandingCategoryGrid
// component's own useAsyncData call). Fetched here so the strip has
// data on first paint without a flash.
const { data: categoriesData } = await useAsyncData('shop-categories', () =>
  $customFetch('/store/categories').catch(() => null)
)
const categories = computed(() => categoriesData.value?.data ?? [])

// Stores — only loaded for catalog mode. Lazy on first interaction.
const stores = ref([])
const loadStores = async () => {
  if (stores.value.length) return
  try {
    const res = await $customFetch('/store/stores')
    stores.value = res?.data ?? []
  } catch {}
}

// Catalog state — only used in catalog mode
const products = ref([])
const loading = ref(false)
const search = ref(route.query.search?.toString() ?? '')
const selectedCategory = ref(route.query.category_id ? Number(route.query.category_id) : null)
const selectedStore = ref(route.query.store_id ? Number(route.query.store_id) : null)
const sort = ref(route.query.sort?.toString() ?? 'newest')
const currentPage = ref(parseInt(route.query.page?.toString() ?? '1', 10) || 1)
const lastPage = ref(1)
const total = ref(0)
let searchTimer = null

const catalogTitle = computed(() => {
  if (selectedCategory.value && categories.value.length) {
    const c = categories.value.find((x) => x.id === selectedCategory.value)
    if (c) return c.name
  }
  if (selectedStore.value && stores.value.length) {
    const s = stores.value.find((x) => x.id === selectedStore.value)
    if (s) return s.name
  }
  if (search.value) return `Resultados: "${search.value}"`
  return 'Todos los productos'
})

const fetchProducts = async () => {
  loading.value = true
  try {
    const res = await $customFetch('/store/products', {
      query: {
        page: currentPage.value,
        per_page: 24,
        search: search.value || undefined,
        category_id: selectedCategory.value || undefined,
        store_id: selectedStore.value || undefined,
        sort: sort.value,
      },
    })
    products.value = res.data?.data ?? []
    lastPage.value = res.data?.last_page ?? 1
    total.value = res.data?.total ?? 0

    // Keep view=all in the URL whenever we're in catalog mode with no
    // other filters set — otherwise the smart-switch on /shop reads
    // an empty query as "landing mode" and bounces the user back to
    // the hero. This is the empty-filters catalog state.
    const hasFilter = !! search.value || !! selectedCategory.value || !! selectedStore.value
    router.replace({
      query: {
        ...(currentPage.value > 1 ? { page: currentPage.value } : {}),
        ...(search.value ? { search: search.value } : {}),
        ...(selectedCategory.value ? { category_id: selectedCategory.value } : {}),
        ...(selectedStore.value ? { store_id: selectedStore.value } : {}),
        ...(sort.value !== 'newest' ? { sort: sort.value } : {}),
        ...(! hasFilter ? { view: 'all' } : {}),
      },
    })
  } catch (err) {
    console.error('Failed to load products', err)
  } finally {
    loading.value = false
  }
}

const setCategory = (catId) => {
  selectedCategory.value = catId
  currentPage.value = 1
  fetchProducts()
}

const setStore = (storeId) => {
  selectedStore.value = storeId
  currentPage.value = 1
  fetchProducts()
}

// Filters drawer
const filtersOpen = ref(false)

// Resolve display objects for the active filter chips
const selectedStoreObj = computed(() =>
  selectedStore.value ? stores.value.find((s) => s.id === selectedStore.value) ?? null : null
)
const selectedCategoryObj = computed(() =>
  selectedCategory.value ? categories.value.find((c) => c.id === selectedCategory.value) ?? null : null
)

const hasActiveFilters = computed(() =>
  !! search.value || !! selectedStore.value || !! selectedCategory.value
)

const clearSearch = () => {
  search.value = ''
  // search ref's watcher will re-fetch + update URL
}

const clearAllFilters = () => {
  search.value = ''
  selectedStore.value = null
  selectedCategory.value = null
  currentPage.value = 1
  fetchProducts()
}

const goToPage = (p) => {
  if (p < 1 || p > lastPage.value) return
  currentPage.value = p
  fetchProducts()
  if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
}

const pageRange = computed(() => {
  const total = lastPage.value
  const cur = currentPage.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const range = [1]
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

// Re-sync when the query string changes (e.g. user clicks a CategoryNav pill)
watch(() => route.query, () => {
  selectedCategory.value = route.query.category_id ? Number(route.query.category_id) : null
  selectedStore.value = route.query.store_id ? Number(route.query.store_id) : null
  search.value = route.query.search?.toString() ?? ''
  sort.value = route.query.sort?.toString() ?? 'newest'
  currentPage.value = parseInt(route.query.page?.toString() ?? '1', 10) || 1
  if (! isLandingMode.value) {
    loadStores()
    fetchProducts()
  }
})

// Initial fetch only when entering catalog mode
if (! isLandingMode.value) {
  loadStores()
  await useAsyncData('shop-catalog-initial', fetchProducts)
}
</script>
