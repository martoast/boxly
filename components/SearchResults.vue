<template>
  <div class="min-h-[100dvh] bg-gray-50 flex flex-col">
    <!-- Sticky search header -->
    <div class="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-100">
      <div class="max-w-6xl mx-auto px-3 md:px-6 py-3">
        <div class="flex items-center gap-2">
          <NuxtLink to="/buscar" class="shrink-0" aria-label="Inicio">
            <img src="/logo.svg" alt="Boxly" class="w-9 h-9" />
          </NuxtLink>
          <form class="flex-1 flex items-center gap-1 bg-white border border-gray-200 rounded-2xl pl-3 pr-1.5 py-1.5 shadow-sm focus-within:border-primary-400 focus-within:shadow-md transition-all" @submit.prevent="submitSearch">
            <svg class="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"/></svg>
            <input v-model="q" type="text" inputmode="search" enterkeyhint="search" placeholder="Buscar…" class="flex-1 min-w-0 border-0 bg-transparent px-1 py-1.5 text-[16px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0" />
            <button v-if="q" type="button" @click="q = ''" class="shrink-0 w-8 h-8 grid place-items-center rounded-full text-gray-400 hover:text-gray-600" aria-label="Limpiar"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
            <button type="submit" class="shrink-0 w-9 h-9 grid place-items-center rounded-full bg-primary-500 hover:bg-primary-600 active:scale-90 text-white transition" aria-label="Buscar"><svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.3" d="M14 5l7 7-7 7M21 12H3"/></svg></button>
          </form>
          <button v-if="user" @click="showProfile = true" class="shrink-0 w-10 h-10 grid place-items-center rounded-xl border border-gray-200 text-gray-500 hover:text-primary-600 hover:border-gray-300 transition" aria-label="Tu perfil de compras" title="Tu perfil de compras">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Body -->
    <div class="flex-1 max-w-6xl w-full mx-auto px-3 md:px-6 py-5">
      <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        <div v-for="n in 8" :key="n" class="bg-white border border-gray-100 rounded-2xl overflow-hidden animate-pulse">
          <div class="h-44 md:h-52 bg-gray-100"></div>
          <div class="p-3 space-y-2"><div class="h-3 w-1/2 bg-gray-100 rounded"></div><div class="h-3 w-3/4 bg-gray-100 rounded"></div><div class="h-4 w-1/3 bg-gray-100 rounded"></div></div>
        </div>
      </div>

      <template v-else>
        <!-- Value-prop banner: reframe results as "Boxly buys these for you" -->
        <div v-if="results.length" class="mb-4 rounded-2xl border border-primary-100 bg-primary-50/60 px-4 py-3">
          <p class="text-[14px] md:text-[15px] font-bold text-gray-900 flex items-center gap-1.5">🇺🇸 Productos encontrados en tiendas de EE.UU.</p>
          <div class="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-1.5">
            <span v-for="b in bannerProps" :key="b" class="flex items-center gap-1.5 text-[12.5px] md:text-[13px] text-gray-700">
              <svg class="w-4 h-4 text-primary-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
              {{ b }}
            </span>
          </div>
        </div>

        <div v-if="results.length" class="flex items-baseline justify-between mb-3">
          <p class="text-sm text-gray-500"><span class="font-semibold text-gray-700">{{ results.length }}</span> resultados para <span class="font-semibold text-gray-700">“{{ q }}”</span><span v-if="priceRange"> · ${{ priceRange.min }}–${{ priceRange.max }} USD</span></p>
        </div>
        <ResultsGrid v-if="results.length" :products="results" @open="goProduct" />
        <div v-else class="text-center py-20">
          <p class="text-gray-600 font-semibold">Sin resultados</p>
          <p class="text-sm text-gray-400 mt-1">Prueba con otras palabras, otra marca, o quita filtros.</p>
          <NuxtLink to="/buscar" class="inline-block mt-4 text-sm font-semibold text-primary-600">← Nueva búsqueda</NuxtLink>
        </div>
      </template>
    </div>

    <CartButton />

    <!-- Profile modal -->
    <Teleport to="body">
      <Transition name="sb-fade">
        <div v-if="showProfile" class="fixed inset-0 z-[1100] flex items-end md:items-center justify-center" role="dialog" aria-modal="true">
          <div class="absolute inset-0 bg-black/50 md:backdrop-blur-sm" @click="closeProfile"></div>
          <Transition name="sb-sheet" appear>
            <div v-if="showProfile" class="relative w-full md:w-auto md:max-w-lg md:mx-4 flex flex-col max-h-[92vh] md:max-h-[85vh]">
              <button @click="closeProfile" class="absolute -top-12 right-4 md:-top-3.5 md:-right-3.5 z-10 w-10 h-10 grid place-items-center rounded-full bg-white shadow-lg ring-1 ring-black/5 text-gray-600 hover:text-gray-900 active:scale-90 transition" aria-label="Cerrar">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
              <div class="overflow-y-auto bg-white rounded-t-3xl md:rounded-3xl shadow-2xl pb-[max(1rem,env(safe-area-inset-bottom))] md:pb-0 md:w-[32rem] max-w-full">
                <div class="md:hidden pt-3 pb-1 flex justify-center"><span class="w-10 h-1.5 rounded-full bg-gray-300"></span></div>
                <ShoppingProfileCard bare />
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
const { $customFetch } = useNuxtApp()
const user = useState('user')
const route = useRoute()
const router = useRouter()

const q = ref(String(route.query.q || ''))
const results = ref([])
const loading = ref(false)
const error = ref('')
const shoppingProfile = ref(null)
const showProfile = ref(false)

const bannerProps = [
  'BOXLY los compra por ti',
  'No necesitas tarjeta americana',
  'Entrega a todo México',
  'Pagas solo cuando apruebes la cotización',
]

// Price range across the results (Google Shopping returns up to ~40 per query).
const priceRange = computed(() => {
  const ps = results.value.map((p) => Number(p.price ?? p.price_usd)).filter((n) => n > 0)
  return ps.length ? { min: Math.min(...ps), max: Math.max(...ps) } : null
})

// Filters can still arrive via the URL (e.g. a shared link), but there's no
// in-header filter UI — the page is just the search box + results.
const filters = reactive({
  store: String(route.query.store || ''),
  min_price: route.query.min ? Number(route.query.min) : null,
  max_price: route.query.max ? Number(route.query.max) : null,
  sale: route.query.sale === '1',
})

async function loadProfile() {
  if (!user.value) return
  try { shoppingProfile.value = (await $customFetch('/me/shopping-profile')).data } catch { /* ignore */ }
}

function syncUrl() {
  const query = {}
  if (q.value) query.q = q.value
  if (filters.store) query.store = filters.store
  if (filters.min_price != null) query.min = String(filters.min_price)
  if (filters.max_price != null) query.max = String(filters.max_price)
  if (filters.sale) query.sale = '1'
  router.replace({ path: '/buscar/resultados', query })
}

// Per-query cache in sessionStorage so a refresh restores results instantly and
// they survive the reload (kept until the tab closes).
function cacheKey() {
  return 'boxly_results:' + JSON.stringify({ q: q.value.trim(), store: filters.store, min: filters.min_price, max: filters.max_price, sale: filters.sale })
}
function readCache() {
  try { const raw = sessionStorage.getItem(cacheKey()); return raw ? JSON.parse(raw) : null } catch { return null }
}
function writeCache() {
  try { sessionStorage.setItem(cacheKey(), JSON.stringify({ products: results.value })) } catch { /* ignore */ }
}

async function runSearch({ imageData = null, useCache = true, updateUrl = true } = {}) {
  const text = q.value.trim()
  if (!text && !imageData) { navigateTo('/buscar'); return }
  if (updateUrl) syncUrl()

  if (!imageData && useCache) {
    const c = readCache()
    if (c) {
      results.value = c.products || []
      loading.value = false
      return
    }
  }

  loading.value = true
  error.value = ''
  try {
    const r = await $fetch('/api/search', {
      method: 'POST',
      body: {
        q: text || undefined,
        image: imageData || undefined,
        filters: { store: filters.store || undefined, min_price: filters.min_price ?? undefined, max_price: filters.max_price ?? undefined, sale: filters.sale || undefined },
        shoppingProfile: shoppingProfile.value,
      },
    })
    if (r?.type === 'product' && r.product?.url) { goProduct({ url: r.product.url }); return }
    results.value = r?.products || []
    if (r?.query && !text) { q.value = r.query; syncUrl() } // image search fills the box + URL
    writeCache()
  } catch {
    error.value = 'No se pudo buscar.'
    results.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadProfile()
  if (route.query.q) {
    runSearch({ updateUrl: false })
  } else if (route.query.img === '1') {
    let img = null
    try { img = sessionStorage.getItem('boxly_pending_image'); sessionStorage.removeItem('boxly_pending_image') } catch { /* ignore */ }
    if (img) runSearch({ imageData: img, updateUrl: false })
    else navigateTo('/buscar')
  } else {
    navigateTo('/buscar') // bare /buscar/resultados → back to the landing
  }
})

function submitSearch() { runSearch({ useCache: false }) }

function goProduct(p) {
  const query = {}
  if (p.url) query.u = p.url
  if (p.token) query.t = p.token
  if (p.title) query.title = p.title
  if (p.image) query.img = p.image
  if (p.price != null) query.price = String(p.price)
  if (p.was != null) query.was = String(p.was)
  if (p.store) query.store = p.store
  if (p.onSale ?? p.on_sale) query.sale = '1'
  navigateTo({ path: '/producto', query })
}

function closeProfile() { showProfile.value = false; loadProfile() }
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

.sb-fade-enter-from, .sb-fade-leave-to { opacity: 0; }
.sb-fade-enter-active, .sb-fade-leave-active { transition: opacity .2s ease; }
.sb-sheet-enter-from, .sb-sheet-leave-to { opacity: 0; transform: translateY(100%); }
.sb-sheet-enter-active, .sb-sheet-leave-active { transition: opacity .25s ease, transform .32s cubic-bezier(.2,.8,.2,1); }
@media (min-width: 768px) { .sb-sheet-enter-from, .sb-sheet-leave-to { transform: translateY(10px) scale(.97); } }
@media (prefers-reduced-motion: reduce) { .sb-sheet-enter-active, .sb-sheet-leave-active { transition: opacity .2s ease; } .sb-sheet-enter-from, .sb-sheet-leave-to { transform: none; } }
</style>
