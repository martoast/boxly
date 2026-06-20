<template>
  <div class="min-h-[100dvh] bg-gray-50 flex flex-col">
    <!-- ===== Sticky search header ===== -->
    <div class="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-100">
      <div class="max-w-6xl mx-auto px-3 md:px-6 py-3">
        <div class="flex items-center gap-2">
          <form class="flex-1 flex items-center gap-1 bg-white border border-gray-200 rounded-2xl pl-3 pr-1.5 py-1.5 shadow-sm focus-within:border-primary-400 focus-within:shadow-md transition-all" @submit.prevent="submitSearch">
            <svg class="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"/></svg>
            <input
              v-model="q"
              type="text"
              inputmode="search"
              enterkeyhint="search"
              placeholder="Busca producto, marca o pega un link de EE.UU."
              class="flex-1 min-w-0 border-0 bg-transparent px-1 py-1.5 text-[16px] text-gray-900 placeholder:text-gray-400 focus:outline-none"
            />
            <button v-if="q" type="button" @click="clearQuery" class="shrink-0 w-8 h-8 grid place-items-center rounded-full text-gray-400 hover:text-gray-600" aria-label="Limpiar">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
            <button type="button" @click="pickImage" class="shrink-0 w-9 h-9 grid place-items-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition" aria-label="Buscar por imagen">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </button>
            <button type="submit" class="shrink-0 w-9 h-9 grid place-items-center rounded-full bg-primary-500 hover:bg-primary-600 active:scale-90 text-white transition" aria-label="Buscar">
              <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.3" d="M14 5l7 7-7 7M21 12H3"/></svg>
            </button>
            <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onImage" />
          </form>
          <button v-if="user" @click="showProfile = true" class="shrink-0 w-10 h-10 grid place-items-center rounded-xl border border-gray-200 text-gray-500 hover:text-primary-600 hover:border-gray-300 transition" aria-label="Tu perfil de compras" title="Tu perfil de compras">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
          </button>
        </div>

        <!-- Filters (only once you've searched) -->
        <div v-if="searched" class="flex items-center gap-2 mt-2.5 overflow-x-auto no-scrollbar">
          <button @click="toggleSale" :class="['shrink-0 px-3 py-1.5 rounded-full text-[12.5px] font-semibold border transition', filters.sale ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300']">🔥 Ofertas</button>
          <div class="shrink-0 flex items-center gap-1 bg-white border border-gray-200 rounded-full px-2.5 py-1">
            <span class="text-[12px] text-gray-400">$</span>
            <input v-model.number="filters.min_price" @change="applyFilters" type="number" inputmode="numeric" placeholder="mín" class="w-12 text-[12.5px] bg-transparent focus:outline-none" />
            <span class="text-gray-300">–</span>
            <input v-model.number="filters.max_price" @change="applyFilters" type="number" inputmode="numeric" placeholder="máx" class="w-12 text-[12.5px] bg-transparent focus:outline-none" />
          </div>
          <input v-model="filters.store" @keydown.enter="applyFilters" @blur="applyFilters" placeholder="Tienda" class="shrink-0 w-28 px-3 py-1.5 rounded-full text-[12.5px] bg-white border border-gray-200 focus:outline-none focus:border-primary-400" />
          <button v-if="hasFilters" @click="clearFilters" class="shrink-0 px-3 py-1.5 text-[12.5px] font-semibold text-gray-500 hover:text-gray-800">Limpiar</button>
        </div>
      </div>
    </div>

    <!-- ===== Body ===== -->
    <div class="flex-1 max-w-6xl w-full mx-auto px-3 md:px-6 py-5">
      <!-- Hero (no search yet) -->
      <div v-if="!searched" class="flex flex-col items-center text-center pt-10 md:pt-16 pb-8">
        <h1 class="text-[26px] leading-tight md:text-4xl font-extrabold text-gray-900 tracking-tight">¿Qué quieres comprar de USA hoy?</h1>
        <p class="text-gray-500 mt-3 text-[15px] md:text-base max-w-md leading-relaxed">Búscalo en miles de tiendas de EE.UU. <span class="font-semibold text-gray-700">Boxly lo compra y te lo trae a tu puerta en México.</span></p>
        <div class="mt-5 grid grid-cols-2 gap-x-5 gap-y-2 text-left">
          <span v-for="v in valueProps" :key="v" class="flex items-center gap-1.5 text-[13px] text-gray-600">
            <svg class="w-4 h-4 text-primary-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
            {{ v }}
          </span>
        </div>
        <div class="mt-7 flex flex-wrap justify-center gap-2 max-w-lg">
          <button v-for="s in suggestions" :key="s.text" @click="quickSearch(s.text)" class="px-3.5 py-2 rounded-full bg-white border border-gray-200 text-[13.5px] text-gray-700 hover:border-gray-300 hover:bg-gray-50 active:scale-95 transition">
            {{ s.emoji }} {{ s.text }}
          </button>
        </div>
      </div>

      <!-- Loading skeleton -->
      <div v-else-if="loading" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        <div v-for="n in 8" :key="n" class="bg-white border border-gray-100 rounded-2xl overflow-hidden animate-pulse">
          <div class="h-44 md:h-52 bg-gray-100"></div>
          <div class="p-3 space-y-2"><div class="h-3 w-1/2 bg-gray-100 rounded"></div><div class="h-3 w-3/4 bg-gray-100 rounded"></div><div class="h-4 w-1/3 bg-gray-100 rounded"></div></div>
        </div>
      </div>

      <!-- Results -->
      <template v-else>
        <div v-if="results.length" class="flex items-baseline justify-between mb-3">
          <p class="text-sm text-gray-500"><span class="font-semibold text-gray-700">{{ results.length }}</span> resultados<span v-if="priceRange"> · ${{ priceRange.min }}–${{ priceRange.max }} USD</span></p>
        </div>
        <ResultsGrid v-if="results.length" :products="results" @open="goProduct" />
        <div v-else class="text-center py-20">
          <p class="text-gray-600 font-semibold">Sin resultados</p>
          <p class="text-sm text-gray-400 mt-1">Prueba con otras palabras, otra marca, o quita filtros.</p>
        </div>
      </template>
    </div>

    <CartButton />

    <!-- Profile (memory) modal -->
    <Teleport to="body">
      <Transition name="sb-fade">
        <div v-if="showProfile" class="fixed inset-0 z-[110] flex items-end md:items-center justify-center" role="dialog" aria-modal="true">
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
const priceRange = ref(null)
const loading = ref(false)
const searched = ref(false)
const error = ref('')
const shoppingProfile = ref(null)
const showProfile = ref(false)
const fileInput = ref(null)

const filters = reactive({
  store: String(route.query.store || ''),
  min_price: route.query.min ? Number(route.query.min) : null,
  max_price: route.query.max ? Number(route.query.max) : null,
  sale: route.query.sale === '1',
})
const hasFilters = computed(() => !!(filters.store || filters.min_price != null || filters.max_price != null || filters.sale))

const valueProps = [
  'Miles de tiendas de USA', 'Sin VPN', 'Sin tarjeta americana',
  'Boxly compra por ti', 'Entrega en todo México', 'Ideal para reventa',
]
const DEFAULT_SUGGESTIONS = [
  { emoji: '🔥', text: 'Ofertas en YoungLA' },
  { emoji: '👟', text: 'New Balance en oferta' },
  { emoji: '🦅', text: 'American Eagle' },
  { emoji: '💧', text: 'Owala' },
]
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)
const suggestions = computed(() => {
  const p = shoppingProfile.value || {}
  const out = []
  if (p.shopper_type === 'reseller') out.push({ emoji: '📈', text: 'Mejores ofertas para revender' })
  for (const b of (Array.isArray(p.favorite_brands) ? p.favorite_brands : []).slice(0, 2)) if (b) out.push({ emoji: '🔥', text: `Ofertas en ${b}` })
  for (const c of [...(Array.isArray(p.interests) ? p.interests : []), ...(Array.isArray(p.categories) ? p.categories : [])].slice(0, 2)) if (c) out.push({ emoji: '🛍️', text: cap(c) })
  const seen = new Set()
  return [...out, ...DEFAULT_SUGGESTIONS].filter((s) => { const k = s.text.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true }).slice(0, 5)
})

async function loadProfile() {
  if (!user.value) return
  try { shoppingProfile.value = (await $customFetch('/me/shopping-profile')).data } catch { /* ignore */ }
}

onMounted(() => {
  loadProfile()
  if (q.value) runSearch(false)
})

function syncUrl() {
  const query = {}
  if (q.value) query.q = q.value
  if (filters.store) query.store = filters.store
  if (filters.min_price != null) query.min = String(filters.min_price)
  if (filters.max_price != null) query.max = String(filters.max_price)
  if (filters.sale) query.sale = '1'
  router.replace({ path: route.path, query })
}

async function runSearch(updateUrl = true, imageData = null) {
  const text = q.value.trim()
  if (!text && !imageData) return
  loading.value = true
  error.value = ''
  searched.value = true
  if (updateUrl) syncUrl()
  try {
    const r = await $fetch('/api/search', {
      method: 'POST',
      body: {
        q: text || undefined,
        image: imageData || undefined,
        filters: {
          store: filters.store || undefined,
          min_price: filters.min_price ?? undefined,
          max_price: filters.max_price ?? undefined,
          sale: filters.sale || undefined,
        },
        shoppingProfile: shoppingProfile.value,
      },
    })
    if (r?.type === 'product' && r.product?.url) { goProduct({ url: r.product.url }); return }
    results.value = r?.products || []
    priceRange.value = r?.price_range || null
    if (r?.query && !text) { q.value = r.query; syncUrl() } // image search fills the box
  } catch {
    error.value = 'No se pudo buscar.'
    results.value = []
  } finally {
    loading.value = false
  }
}

function submitSearch() { runSearch(true) }
function quickSearch(text) { q.value = text; runSearch(true) }
function clearQuery() { q.value = '' }
function applyFilters() { if (searched.value) runSearch(true) }
function toggleSale() { filters.sale = !filters.sale; applyFilters() }
function clearFilters() { filters.store = ''; filters.min_price = null; filters.max_price = null; filters.sale = false; runSearch(true) }

function pickImage() { fileInput.value?.click() }
function onImage(e) {
  const f = e.target.files?.[0]
  e.target.value = ''
  if (!f) return
  const reader = new FileReader()
  reader.onload = () => runSearch(true, reader.result)
  reader.readAsDataURL(f)
}

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
