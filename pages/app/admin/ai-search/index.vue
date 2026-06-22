<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 class="text-2xl font-extrabold text-gray-900">Búsqueda con IA</h1>
          <p class="text-sm text-gray-500 mt-1">Cómo y cuánto se usa el buscador asistido — qué buscan y en qué tiendas.</p>
        </div>
        <select v-model.number="days" @change="load" class="border border-gray-300 rounded-xl px-3 py-2 text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option :value="7">Últimos 7 días</option>
          <option :value="30">Últimos 30 días</option>
          <option :value="90">Últimos 90 días</option>
        </select>
      </div>

      <div v-if="loading" class="py-24 text-center text-gray-400">
        <svg class="inline-block w-10 h-10 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
      </div>

      <template v-else-if="stats">
        <div v-if="stats.unavailable" class="mb-6 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          La tabla de analítica aún no existe — corre la migración <code>2026_06_21_000001_create_search_events_table</code> en producción.
        </div>

        <!-- Stat cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div v-for="c in cards" :key="c.label" class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">{{ c.label }}</p>
            <p class="text-3xl font-extrabold text-gray-900 mt-1">{{ c.value }}</p>
            <p v-if="c.sub" class="text-xs text-gray-400 mt-1">{{ c.sub }}</p>
          </div>
        </div>

        <!-- Daily activity -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-gray-900">Actividad diaria</h2>
            <div class="flex items-center gap-4 text-xs text-gray-500">
              <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-sm bg-primary-500"></span>Búsquedas</span>
              <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-sm bg-indigo-300"></span>Productos vistos</span>
            </div>
          </div>
          <div v-if="stats.daily.length" class="flex items-end gap-1 h-40">
            <div v-for="d in stats.daily" :key="d.date" class="flex-1 flex flex-col justify-end items-center group" :title="`${d.date}: ${d.searches} búsquedas, ${d.views} vistas`">
              <div class="w-full flex flex-col justify-end" :style="{ height: '100%' }">
                <div class="w-full bg-indigo-300 rounded-t-sm" :style="{ height: barPct(d.views) + '%' }"></div>
                <div class="w-full bg-primary-500" :style="{ height: barPct(d.searches) + '%' }"></div>
              </div>
            </div>
          </div>
          <p v-else class="text-sm text-gray-400 py-10 text-center">Sin actividad en este periodo.</p>
        </div>

        <!-- Top queries + stores -->
        <div class="grid lg:grid-cols-2 gap-6">
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 class="text-lg font-bold text-gray-900 mb-3">Búsquedas más comunes</h2>
            <ol v-if="stats.top_queries.length" class="space-y-2">
              <li v-for="(q, i) in stats.top_queries" :key="i" class="flex items-center justify-between gap-3 text-sm">
                <span class="flex items-center gap-2 min-w-0"><span class="text-gray-300 w-5 text-right">{{ i + 1 }}</span><span class="text-gray-800 truncate">{{ q.query }}</span></span>
                <span class="shrink-0 font-bold text-gray-900">{{ q.c }}</span>
              </li>
            </ol>
            <p v-else class="text-sm text-gray-400 py-6 text-center">Aún sin búsquedas.</p>
          </div>

          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 class="text-lg font-bold text-gray-900 mb-3">Tiendas más vistas</h2>
            <ol v-if="stats.top_stores.length" class="space-y-2">
              <li v-for="(s, i) in stats.top_stores" :key="i" class="flex items-center justify-between gap-3 text-sm">
                <span class="flex items-center gap-2 min-w-0"><span class="text-gray-300 w-5 text-right">{{ i + 1 }}</span><span class="text-gray-800 truncate">{{ s.store }}</span></span>
                <span class="shrink-0 font-bold text-gray-900">{{ s.c }}</span>
              </li>
            </ol>
            <p v-else class="text-sm text-gray-400 py-6 text-center">Aún sin vistas de productos.</p>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] })
useHead({ title: 'Búsqueda con IA — Admin' })

const { $customFetch } = useNuxtApp()
const days = ref(30)
const stats = ref(null)
const loading = ref(true)

const cards = computed(() => {
  const s = stats.value || {}
  return [
    { label: 'Búsquedas', value: fmt(s.total_searches), sub: `Últimos ${s.days} días` },
    { label: 'Productos vistos', value: fmt(s.total_product_views), sub: `${s.view_rate ?? 0}% de las búsquedas` },
    { label: 'Solicitudes creadas', value: fmt(s.purchase_requests), sub: 'Compra asistida (online)' },
    { label: 'Conversión a solicitud', value: (s.search_to_pr_rate ?? 0) + '%', sub: 'Solicitudes ÷ búsquedas' },
  ]
})

const maxDaily = computed(() => {
  const d = stats.value?.daily || []
  return Math.max(1, ...d.map((x) => Math.max(x.searches, x.views)))
})
function barPct(n) { return Math.round((Number(n) || 0) / maxDaily.value * 100) }
function fmt(n) { return new Intl.NumberFormat('es-MX').format(Number(n) || 0) }

async function load() {
  loading.value = true
  try {
    stats.value = (await $customFetch('/admin/ai-search/stats', { params: { days: days.value } })).data
  } catch (e) {
    console.error(e)
    stats.value = { days: days.value, total_searches: 0, total_product_views: 0, purchase_requests: 0, view_rate: 0, search_to_pr_rate: 0, top_queries: [], top_stores: [], daily: [] }
  } finally {
    loading.value = false
  }
}
onMounted(load)
</script>
