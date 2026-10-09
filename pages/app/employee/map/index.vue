<template>
  <div class="relative h-[100dvh] w-screen overflow-hidden bg-gray-50">
    <!-- Full-bleed customer map — its own page, never squeezed into a dashboard (Alex, 2026-10-08) -->
    <ClientOnly>
      <CitiesMap
        :points="clients"
        metric="orders"
        :metric-label="t.orders"
        format="number"
        :token="mapboxToken"
        height="100dvh"
        :show-caption="false"
        :show-nav="!isMobile"
        :show-revenue="false"
        nav-position="bottom-right"
        scroll-zoom
        glow
        :center="[-101.5, 23.2]"
        :zoom="isMobile ? 3.85 : 4.55"
      />
      <template #fallback>
        <div class="h-full flex items-center justify-center text-gray-300 text-sm">{{ t.loading }}</div>
      </template>
    </ClientOnly>

    <header class="absolute top-0 inset-x-0 p-3 sm:p-6 flex items-start justify-between gap-3 pointer-events-none">
      <div class="flex items-center gap-3 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-lg px-3.5 sm:px-4 py-2 sm:py-2.5">
        <span class="relative flex h-2.5 w-2.5">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70"></span>
          <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        <div class="leading-tight">
          <p class="text-base sm:text-lg font-extrabold tracking-tight text-gray-900">BOXLY</p>
          <p class="text-[11px] sm:text-xs font-medium text-gray-500 -mt-0.5">{{ t.title }}</p>
        </div>
      </div>
      <div class="flex items-center gap-2 pointer-events-auto">
        <button
          class="h-9 w-9 grid place-items-center rounded-2xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-lg text-gray-600 hover:text-gray-900"
          :title="t.fullscreen"
          @click="toggleFullscreen"
        >
          <ArrowsPointingOutIcon v-if="!isFullscreen" class="h-4 w-4" />
          <ArrowsPointingInIcon v-else class="h-4 w-4" />
        </button>
      </div>
    </header>

    <!-- the operator's three sections, floating over the full-screen map -->
    <nav class="absolute top-3 sm:top-6 left-1/2 -translate-x-1/2 flex gap-1 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-lg p-1 max-sm:top-auto max-sm:bottom-[6.5rem]">
      <NuxtLink
        v-for="tab in tabs"
        :key="tab.route"
        :to="tab.route"
        class="px-3 py-1.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors"
        :class="tab.route === '/app/employee/map' ? 'bg-primary-600 text-white shadow' : 'text-gray-600 hover:text-gray-900'"
      >{{ tab.label }}</NuxtLink>
    </nav>

    <!-- counts only: customers, orders, states — the operator never sees money -->
    <footer class="absolute bottom-0 inset-x-0 p-3 sm:p-6 pointer-events-none">
      <div class="grid grid-cols-3 gap-2 sm:flex sm:gap-3">
        <div v-for="m in statCards" :key="m.key" class="sm:min-w-[140px] rounded-2xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-lg px-3.5 sm:px-4 py-2.5 sm:py-3">
          <p class="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-gray-400 truncate">{{ m.label }}</p>
          <p class="text-xl sm:text-3xl font-extrabold tracking-tight tabular-nums" :class="m.color">{{ m.value }}</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import CitiesMap from '~/components/admin/CitiesMap.vue'
import { ArrowsPointingOutIcon, ArrowsPointingInIcon } from '@heroicons/vue/24/outline'

/**
 * The warehouse operator's customer map: where Boxly's customers are across Mexico, full screen.
 * Data from /employee/map — the admin live-map data with every money field stripped server-side.
 */
definePageMeta({
  layout: 'empty',
  middleware: ['auth', 'employee'],
})

const { $customFetch } = useNuxtApp()
const tabs = useOperatorTabs()
const { t: createTranslations } = useLanguage()
const mapboxToken = useRuntimeConfig().public.MAPBOX_API_TOKEN

const t = createTranslations({
  title: { es: 'Clientes en México', en: 'Customers across Mexico' },
  orders: { es: 'Órdenes', en: 'Orders' },
  customers: { es: 'Clientes', en: 'Customers' },
  states: { es: 'Estados', en: 'States' },
  loading: { es: 'Cargando...', en: 'Loading...' },
  fullscreen: { es: 'Pantalla completa', en: 'Fullscreen' },
  exit: { es: 'Volver', en: 'Back' },
})

const isMobile = ref(import.meta.client ? window.matchMedia('(max-width: 639px)').matches : false)
const geo = ref(null)
const clients = computed(() => geo.value?.clients ?? [])
const fmt = (n) => new Intl.NumberFormat('es-MX').format(n ?? 0)
// Same numbers as the admin live map: orders + customers from the overview (every one, not only the
// located ones — the map data alone undercounted), states from the map. Just no revenue card.
const statCards = computed(() => [
  { key: 'orders', label: t.value.orders, value: fmt(geo.value?.overview?.orders), color: 'text-primary-600' },
  { key: 'customers', label: t.value.customers, value: fmt(geo.value?.overview?.customers), color: 'text-violet-600' },
  { key: 'states', label: t.value.states, value: fmt(geo.value?.totals?.states_active), color: 'text-amber-600' },
])

const isFullscreen = ref(false)
const toggleFullscreen = () => {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen?.()
  else document.exitFullscreen?.()
}
const onFsChange = () => { isFullscreen.value = !!document.fullscreenElement }

const fetchMap = async () => {
  try { geo.value = (await $customFetch('/employee/map')).data } catch (e) { console.error('employee map', e) }
}
let timer = null
onMounted(() => {
  fetchMap()
  timer = setInterval(fetchMap, 120000)
  document.addEventListener('fullscreenchange', onFsChange)
})
onBeforeUnmount(() => {
  clearInterval(timer)
  document.removeEventListener('fullscreenchange', onFsChange)
})
</script>
