<!-- components/admin/CommandPalette.vue
     Quick admin navigation. Open with Cmd/Ctrl+K, type a few letters, Enter.
     Mounted globally in layouts/admin.vue. -->
<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition ease-out duration-150"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="open" class="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-start justify-center pt-[15vh] px-4" @click.self="close">
        <div class="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden" @keydown.down.prevent="move(1)" @keydown.up.prevent="move(-1)" @keydown.enter.prevent="go(results[activeIndex])" @keydown.esc="close">
          <!-- Search input -->
          <div class="flex items-center gap-3 px-4 border-b border-gray-100">
            <svg class="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              ref="inputEl"
              v-model="query"
              type="text"
              :placeholder="t.placeholder"
              class="flex-1 py-4 text-base text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent"
              @input="activeIndex = 0"
            >
            <kbd class="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded border border-gray-200 text-[10px] font-semibold text-gray-400">ESC</kbd>
          </div>

          <!-- Results -->
          <div v-if="results.length" ref="listEl" class="max-h-[50vh] overflow-y-auto py-2">
            <button
              v-for="(item, i) in results"
              :key="item.route"
              :data-idx="i"
              @click="go(item)"
              @mousemove="activeIndex = i"
              :class="[
                'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                i === activeIndex ? 'bg-primary-50' : 'hover:bg-gray-50'
              ]"
            >
              <span :class="['w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0', i === activeIndex ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-500']">
                {{ label(item).charAt(0) }}
              </span>
              <span :class="['text-sm font-medium', i === activeIndex ? 'text-primary-700' : 'text-gray-800']">{{ label(item) }}</span>
              <svg v-if="i === activeIndex" class="w-4 h-4 text-primary-400 ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
          <div v-else class="px-4 py-8 text-center text-sm text-gray-400">{{ t.noResults }}</div>

          <!-- Footer hint -->
          <div class="flex items-center gap-4 px-4 py-2.5 border-t border-gray-100 bg-gray-50/60 text-[11px] text-gray-400">
            <span class="flex items-center gap-1"><kbd class="px-1 rounded bg-white border border-gray-200">↑</kbd><kbd class="px-1 rounded bg-white border border-gray-200">↓</kbd> {{ t.navigate }}</span>
            <span class="flex items-center gap-1"><kbd class="px-1 rounded bg-white border border-gray-200">↵</kbd> {{ t.open }}</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'

const router = useRouter()
const user = useUser().value
const { t: createTranslations } = useLanguage()

const open = ref(false)
const query = ref('')
const activeIndex = ref(0)
const inputEl = ref(null)
const listEl = ref(null)

const lang = computed(() => (user?.preferred_language === 'es' ? 'es' : 'en'))
const label = (item) => item[lang.value]

// Admin destinations. `kw` = extra search keywords (both languages / synonyms).
const destinations = [
  { route: '/app/admin/dashboard', es: 'Panel de Control', en: 'Dashboard', kw: 'home inicio metrics metricas resumen' },
  { route: '/app/admin/dashboard/classic', es: 'Panel Clásico', en: 'Classic Dashboard', kw: 'financials finanzas expenses profit ganancia' },
  { route: '/app/admin/war-chest', es: 'War Chest', en: 'War Chest', kw: 'cofre dinero cuentas accounts balance saldo nu hsbc stripe cash' },
  { route: '/app/admin/expenses', es: 'Gastos', en: 'Expenses', kw: 'expenses money spend personal business gasto' },
  { route: '/app/admin/orders', es: 'Órdenes', en: 'Orders', kw: 'orders pedidos shipping envios' },
  { route: '/app/admin/operations-board', es: 'Tablero de Operaciones', en: 'Operations Board', kw: 'ops board tablero pipeline' },
  { route: '/app/admin/purchase-requests', es: 'Compra Asistida', en: 'Assisted Purchase', kw: 'purchase requests pr compras asistida' },
  { route: '/app/admin/purchased-products', es: 'Productos Comprados', en: 'Purchased Products', kw: 'purchased productos comprados' },
  { route: '/app/admin/packages', es: 'Paquetes', en: 'Packages', kw: 'packages paquetes tracking' },
  { route: '/app/admin/boxes', es: 'Cajas', en: 'Boxes', kw: 'boxes cajas' },
  { route: '/app/admin/customers', es: 'Clientes', en: 'Customers', kw: 'customers clientes users usuarios' },
  { route: '/app/admin/shopping-trips', es: 'Visitas en Persona', en: 'In-Person Trips', kw: 'shopping trips visitas presencial las americas' },
  { route: '/app/admin/stores', es: 'Tiendas (presencial)', en: 'Stores (in-person)', kw: 'stores tiendas brands' },
  { route: '/app/admin/categories', es: 'Categorías (presencial)', en: 'Categories (in-person)', kw: 'categories categorias' },
  { route: '/app/admin/affiliates', es: 'Afiliados', en: 'Affiliates', kw: 'affiliates afiliados referrals payouts' },
  { route: '/app/admin/campaigns', es: 'Campañas', en: 'Campaigns', kw: 'campaigns campanas email correo' },
  { route: '/app/admin/wall', es: 'Mapa en Vivo', en: 'Live Map', kw: 'live map mapa wall' },
  { route: '/app/admin/ai-search', es: 'Búsqueda con IA', en: 'AI Search', kw: 'ai search busqueda ia intent' },
  { route: '/app/admin/knowledge', es: 'Base de Conocimiento', en: 'Knowledge Base', kw: 'knowledge base conocimiento faq' },
  { route: '/app/admin/starter-prompts', es: 'Tarjetas de Sugerencia', en: 'Starter Prompts', kw: 'starter prompts sugerencias' },
]

const results = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return destinations
  const tokens = q.split(/\s+/)
  const scored = []
  for (const d of destinations) {
    const lbl = label(d).toLowerCase()
    const hay = `${d.es} ${d.en} ${d.kw} ${d.route}`.toLowerCase()
    if (!tokens.every((tok) => hay.includes(tok))) continue
    let score = 3
    if (lbl.startsWith(q)) score = 0
    else if (lbl.includes(q)) score = 1
    else if (lbl.split(/\s+/).some((w) => w.startsWith(q))) score = 2
    scored.push({ d, score })
  }
  scored.sort((a, b) => a.score - b.score || label(a.d).localeCompare(label(b.d)))
  return scored.map((s) => s.d)
})

const move = (dir) => {
  if (!results.value.length) return
  activeIndex.value = (activeIndex.value + dir + results.value.length) % results.value.length
  nextTick(() => {
    const el = listEl.value?.querySelector(`[data-idx="${activeIndex.value}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  })
}

const go = (item) => {
  if (!item) return
  close()
  router.push(item.route)
}

const openPalette = () => {
  open.value = true
  query.value = ''
  activeIndex.value = 0
  nextTick(() => inputEl.value?.focus())
}
const close = () => { open.value = false }

watch(query, () => { activeIndex.value = 0 })

const onKeydown = (e) => {
  if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
    e.preventDefault()
    open.value ? close() : openPalette()
  }
}

// Lets any UI element open the palette: window.dispatchEvent(new Event('open-command-palette'))
const onOpenEvent = () => openPalette()

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('open-command-palette', onOpenEvent)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('open-command-palette', onOpenEvent)
})

const t = createTranslations({
  placeholder: { es: 'Buscar página… (ej. "war", "gastos")', en: 'Search a page… (e.g. "war", "orders")' },
  noResults: { es: 'Sin resultados', en: 'No results' },
  navigate: { es: 'navegar', en: 'navigate' },
  open: { es: 'abrir', en: 'open' },
})
</script>
