<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 class="text-2xl font-extrabold text-gray-900">Asistente IA · Intención</h1>
          <p class="text-sm text-gray-500 mt-1">Qué quiere la gente cuando usa Boxly — lo que <span class="font-semibold text-gray-700">buscan</span> para comprar y lo que <span class="font-semibold text-gray-700">preguntan</span> del negocio, organizado por intención.</p>
        </div>
        <div class="flex items-center gap-2">
          <select v-model.number="days" @change="load" class="border border-gray-300 rounded-xl px-3 py-2 text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option :value="7">Últimos 7 días</option>
            <option :value="30">Últimos 30 días</option>
            <option :value="90">Últimos 90 días</option>
          </select>
          <button @click="downloadCsv" :disabled="downloading" class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white text-sm font-semibold transition" title="Descargar todos los datos para análisis">
            <svg v-if="!downloading" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"/></svg>
            <svg v-else class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
            {{ downloading ? 'Preparando…' : 'Descargar todo (CSV)' }}
          </button>
        </div>
      </div>

      <div v-if="loading" class="py-24 text-center text-gray-400">
        <svg class="inline-block w-10 h-10 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
      </div>

      <template v-else-if="stats">
        <div v-if="stats.unavailable" class="mb-6 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          La tabla de analítica aún no existe — corre las migraciones en producción.
        </div>

        <!-- Stat cards (intent-framed) -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div v-for="c in cards" :key="c.label" class="rounded-2xl border bg-white border-gray-100 shadow-sm p-5">
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-400">{{ c.label }}</p>
            <p class="text-3xl font-extrabold mt-1 text-gray-900">{{ c.value }}</p>
            <p v-if="c.sub" class="text-xs mt-1 text-gray-400">{{ c.sub }}</p>
          </div>
        </div>

        <!-- Intent map (the hero) -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <div class="flex items-center justify-between mb-1">
            <h2 class="text-lg font-bold text-gray-900">Mapa de intención</h2>
            <button @click="loadIntent" :disabled="intentLoading" class="text-xs font-semibold text-gray-400 hover:text-primary-600 disabled:opacity-50">Recalcular</button>
          </div>
          <p class="text-xs text-gray-400 mb-3">La IA agrupa cada consulta por lo que la persona realmente quiere. Toca un tema para ver las consultas reales.</p>
          <div v-if="intentLoading" class="py-16 text-center text-gray-400">
            <svg class="inline-block w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            <p class="text-xs mt-2">Analizando la intención…</p>
          </div>
          <AdminIntentMap v-else :clusters="intentMap.clusters" />
        </div>

        <!-- Recent activity (everything, chronological) + stores shown -->
        <div class="grid lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 class="text-lg font-bold text-gray-900 mb-1">Actividad reciente</h2>
            <p class="text-xs text-gray-400 mb-3">Búsquedas y preguntas, tal como entraron</p>
            <div v-if="recentFeed.length" class="divide-y divide-gray-100">
              <div v-for="(r, i) in recentFeed" :key="i" class="py-2.5">
                <div class="flex items-start justify-between gap-3">
                  <span class="flex items-start gap-2 min-w-0">
                    <span class="shrink-0 mt-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded" :class="r.kind === 'question' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'">{{ r.kind === 'question' ? 'PREGUNTA' : 'BÚSQUEDA' }}</span>
                    <span class="font-semibold text-gray-900 min-w-0 truncate">“{{ r.query }}”</span>
                  </span>
                  <span class="shrink-0 text-xs font-bold text-gray-400">{{ r.kind === 'search' ? (r.results + ' result.') : '' }}</span>
                </div>
                <p v-if="r.kind === 'search' && (r.stores || []).length" class="text-xs text-gray-500 mt-0.5 ml-[4.5rem] truncate">{{ (r.stores || []).join(' · ') }}</p>
                <p v-else-if="r.kind === 'question' && r.answer" class="text-xs text-gray-500 mt-0.5 ml-[4.5rem] line-clamp-2">{{ r.answer }}</p>
              </div>
            </div>
            <p v-else class="text-sm text-gray-400 py-6 text-center">Aún sin actividad en este periodo.</p>
          </div>

          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 class="text-lg font-bold text-gray-900 mb-1">Tiendas que mostramos</h2>
            <p class="text-xs text-gray-400 mb-3">Las que más aparecen en los resultados de compra</p>
            <ol v-if="(stats.top_result_stores || []).length" class="space-y-2">
              <li v-for="(s, i) in stats.top_result_stores" :key="i" class="flex items-center justify-between gap-3 text-sm">
                <span class="flex items-center gap-2 min-w-0"><span class="text-gray-300 w-5 text-right">{{ i + 1 }}</span><span class="text-gray-800 truncate">{{ s.store }}</span></span>
                <span class="shrink-0 font-bold text-gray-900">{{ s.c }}</span>
              </li>
            </ol>
            <p v-else class="text-sm text-gray-400 py-6 text-center">Aún sin datos.</p>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] })
useHead({ title: 'Asistente IA — Admin' })

const { $customFetch } = useNuxtApp()
const days = ref(30)
const stats = ref(null)
const loading = ref(true)
const downloading = ref(false)
const intentMap = ref({ clusters: [], total: 0 })
const intentLoading = ref(true)

async function downloadCsv() {
  downloading.value = true
  try {
    // days=0 → ALL data (the intent is to hand the full export to an AI).
    const blob = await $customFetch('/admin/ai-search/export', { params: { days: 0 }, responseType: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `boxly-ai-search-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch (e) {
    console.error(e)
  } finally {
    downloading.value = false
  }
}

const cards = computed(() => {
  const s = stats.value || {}
  const searches = Number(s.total_searches) || 0
  const questions = Number(s.total_questions) || 0
  const total = searches + questions
  const pct = (n) => (total ? Math.round((n / total) * 100) : 0)
  return [
    { label: 'Interacciones', value: fmt(total), sub: `${fmt(searches)} búsquedas · ${fmt(questions)} preguntas` },
    { label: 'Intención de compra', value: fmt(searches), sub: `${pct(searches)}% del total` },
    { label: 'Intención de aprender', value: fmt(questions), sub: `${pct(questions)}% del total` },
    { label: 'Productos vistos', value: fmt(s.total_product_views), sub: `${s.view_rate ?? 0}% de las búsquedas` },
  ]
})

// One chronological stream of everything (searches + questions).
const recentFeed = computed(() => {
  const s = stats.value || {}
  const searches = (s.recent_searches || []).map((r) => ({ kind: 'search', query: r.query, results: r.results, stores: r.stores, created_at: r.created_at }))
  const questions = (s.recent_questions || []).map((r) => ({ kind: 'question', query: r.query, answer: r.answer, guest: r.guest, created_at: r.created_at }))
  return [...searches, ...questions]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 40)
})

function fmt(n) { return new Intl.NumberFormat('es-MX').format(Number(n) || 0) }

async function loadIntent() {
  intentLoading.value = true
  try {
    intentMap.value = await $fetch('/api/intent-map', { method: 'POST', body: { days: days.value } })
  } catch (e) {
    console.error(e)
    intentMap.value = { clusters: [], total: 0 }
  } finally {
    intentLoading.value = false
  }
}

async function load() {
  loading.value = true
  try {
    stats.value = (await $customFetch('/admin/ai-search/stats', { params: { days: days.value } })).data
  } catch (e) {
    console.error(e)
    stats.value = { days: days.value, total_searches: 0, total_product_views: 0, total_questions: 0, view_rate: 0, recent_questions: [], recent_searches: [], top_result_stores: [] }
  } finally {
    loading.value = false
  }
  loadIntent()
}
onMounted(load)
</script>
