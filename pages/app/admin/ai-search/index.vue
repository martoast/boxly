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
        <div class="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div v-for="c in cards" :key="c.label"
               :class="['rounded-2xl border shadow-sm p-5', c.alert ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-100']">
            <p :class="['text-xs font-semibold uppercase tracking-wide', c.alert ? 'text-amber-700' : 'text-gray-400']">{{ c.label }}</p>
            <p :class="['text-3xl font-extrabold mt-1', c.alert ? 'text-amber-900' : 'text-gray-900']">{{ c.value }}</p>
            <p v-if="c.sub" :class="['text-xs mt-1', c.alert ? 'text-amber-700/80' : 'text-gray-400']">{{ c.sub }}</p>
          </div>
        </div>

        <!-- Recent activity (everything, chronological) + stores shown -->
        <div class="grid lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div class="flex items-start justify-between gap-3 mb-1">
              <h2 class="text-lg font-bold text-gray-900">Actividad reciente</h2>
              <span v-if="feedTotal" class="shrink-0 text-xs font-semibold text-gray-400 mt-1">{{ fmt(feedTotal) }} en total</span>
            </div>
            <p class="text-xs text-gray-400 mb-3">Búsquedas y preguntas, tal como entraron</p>

            <!-- Its own spinner: paging must never blank the cards or the stores
                 panel beside it, so this block loads independently of `stats`. -->
            <div v-if="feedLoading" class="py-16 text-center text-gray-400">
              <svg class="inline-block w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            </div>
            <div v-else-if="recentFeed.length" class="divide-y divide-gray-100">
              <div v-for="(r, i) in recentFeed" :key="i"
                   :class="['py-2.5 -mx-2 px-2 rounded-lg transition', r.conversation_id ? 'cursor-pointer hover:bg-primary-50/60' : '']"
                   @click="openThread(r)">
                <div class="flex items-start justify-between gap-3">
                  <span class="flex items-start gap-2 min-w-0">
                    <span class="shrink-0 mt-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded" :class="r.kind === 'question' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'">{{ r.kind === 'question' ? 'PREGUNTA' : 'BÚSQUEDA' }}</span>
                    <span class="font-semibold text-gray-900 min-w-0 truncate">“{{ r.query }}”</span>
                  </span>
                  <span class="shrink-0 flex items-center gap-2">
                    <span v-if="r.kind === 'search'"
                          :class="['text-xs font-bold', r.broadened ? 'text-amber-600' : (r.results ? 'text-gray-400' : 'text-red-500')]">
                      {{ r.results }} result.<template v-if="r.broadened"> genéricos</template>
                    </span>
                    <svg v-if="r.conversation_id" class="w-3.5 h-3.5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" title="Ver conversación"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-3.6-7.2L21 3v6h-6"/></svg>
                  </span>
                </div>
                <!-- who + when -->
                <p class="text-[11px] mt-0.5 ml-[4.5rem] flex items-center gap-1.5 flex-wrap">
                  <span v-if="r.user" class="font-semibold text-gray-600">{{ r.user.name }}</span>
                  <span v-if="r.user" class="text-gray-400">· {{ r.user.email }}</span>
                  <span v-if="r.user && r.user.created_at" class="text-emerald-600 font-medium">· cliente desde {{ fmtDate(r.user.created_at) }}</span>
                  <span v-else-if="!r.user" class="text-amber-600 font-semibold">Invitado</span>
                  <span class="text-gray-300">· {{ fmtDateTime(r.created_at) }}</span>
                  <span v-if="r.conversation_id" class="text-primary-500 font-semibold">· ver chat →</span>
                </p>
                <!-- Spell out the substitution: these results answer a DIFFERENT
                     query than the one shown above, which is exactly what used to
                     be impossible to see from this feed. -->
                <p v-if="r.kind === 'search' && r.broadened" class="text-xs text-amber-700 font-semibold mt-0.5 ml-[4.5rem] truncate">
                  ⚠ No encontramos esto — mostramos el catálogo de “{{ r.served_query || 'la tienda' }}”
                </p>
                <p v-if="r.kind === 'search' && (r.stores || []).length" class="text-xs text-gray-500 mt-0.5 ml-[4.5rem] truncate">{{ (r.stores || []).join(' · ') }}</p>
                <p v-else-if="r.kind === 'question' && r.answer" class="text-xs text-gray-500 mt-0.5 ml-[4.5rem] line-clamp-2">{{ r.answer }}</p>
              </div>
            </div>
            <p v-else class="text-sm text-gray-400 py-6 text-center">Aún sin actividad en este periodo.</p>

            <!-- Pager. Hidden entirely when everything fits on one page. -->
            <div v-if="feedPages > 1" class="flex items-center justify-between gap-3 pt-3 mt-1 border-t border-gray-100">
              <button @click="goFeed(feedPage - 1)" :disabled="feedPage <= 1 || feedLoading"
                      class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent transition">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                Anteriores
              </button>
              <span class="text-xs font-semibold text-gray-400">Página {{ fmt(feedPage) }} de {{ fmt(feedPages) }}</span>
              <button @click="goFeed(feedPage + 1)" :disabled="feedPage >= feedPages || feedLoading"
                      class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent transition">
                Siguientes
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
              </button>
            </div>
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

    <!-- Conversation thread drawer -->
    <Teleport to="body">
      <Transition name="fade-fast">
        <div v-if="threadOpen" class="fixed inset-0 z-50 bg-gray-900/40" @click="closeThread"></div>
      </Transition>
      <Transition name="slide-over">
        <aside v-if="threadOpen" class="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl flex flex-col">
          <!-- header -->
          <div class="shrink-0 border-b border-gray-100 px-5 py-4 flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-xs font-semibold uppercase tracking-wide text-gray-400">Conversación</p>
              <h3 class="text-base font-bold text-gray-900 truncate">{{ thread?.title || 'Chat' }}</h3>
              <p v-if="thread?.user" class="text-xs mt-0.5">
                <span class="font-semibold text-gray-700">{{ thread.user.name }}</span>
                <span class="text-gray-400"> · {{ thread.user.email }}</span>
                <span v-if="thread.user.created_at" class="text-emerald-600 font-medium"> · cliente desde {{ fmtDate(thread.user.created_at) }}</span>
              </p>
              <p v-else-if="thread && !threadLoading" class="text-xs mt-0.5 text-amber-600 font-semibold">Invitado</p>
              <p v-if="thread?.id" class="text-[11px] text-gray-300 mt-0.5">Chat #{{ thread.id }}</p>
            </div>
            <button @click="closeThread" class="shrink-0 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <!-- body -->
          <div class="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-gray-50">
            <div v-if="threadLoading" class="py-24 text-center text-gray-400">
              <svg class="inline-block w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            </div>
            <p v-else-if="thread?.error" class="py-24 text-center text-sm text-gray-400">No se pudo cargar la conversación.</p>
            <p v-else-if="!(thread?.messages || []).length" class="py-24 text-center text-sm text-gray-400">Sin mensajes en este chat.</p>
            <template v-else>
              <div v-for="m in thread.messages" :key="m.id" :class="['flex', m.role === 'user' ? 'justify-end' : 'justify-start']">
                <div :class="['max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm', m.role === 'user' ? 'bg-primary-600 text-white' : 'bg-white border border-gray-100 text-gray-800']">
                  <template v-for="(b, bi) in messageBits(m)" :key="bi">
                    <!-- Assistant replies are markdown — render them; user messages stay plain (white on primary). -->
                    <MarkdownText v-if="b.t === 'text' && m.role !== 'user'" :text="b.text" />
                    <p v-else-if="b.t === 'text'" class="whitespace-pre-wrap leading-relaxed">{{ b.text }}</p>

                    <!-- Product gallery the customer was actually shown -->
                    <div v-else-if="b.t === 'products'" class="mt-1.5">
                      <div class="text-[11px] font-semibold text-gray-400 mb-1">{{ b.label }}</div>
                      <div class="grid grid-cols-2 gap-1.5">
                        <a v-for="(pr, pi) in b.products.slice(0, 8)" :key="pi" :href="pr.url || pr.link || undefined" target="_blank" rel="noopener"
                           class="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg p-1.5 hover:bg-gray-100 transition">
                          <img v-if="pr.image" :src="pr.image" referrerpolicy="no-referrer" loading="lazy" class="w-9 h-9 rounded object-cover bg-white border border-gray-100 shrink-0" />
                          <span v-else class="w-9 h-9 rounded bg-gray-200 grid place-items-center text-gray-400 shrink-0 text-xs">🛍</span>
                          <span class="min-w-0 leading-tight">
                            <span class="block text-[11px] font-semibold text-gray-800 truncate">{{ pr.title || pr.name || 'Producto' }}</span>
                            <span class="block text-[10px] text-gray-400 truncate">{{ [pr.store, pr.price != null ? ('$' + pr.price) : null].filter(Boolean).join(' · ') }}</span>
                          </span>
                        </a>
                      </div>
                      <div v-if="b.products.length > 8" class="text-[10px] text-gray-400 mt-1">+{{ b.products.length - 8 }} más</div>
                    </div>

                    <!-- Box price table the customer was actually shown. Without
                         this it rendered as a bare "⚙️ show_box_guide" chip, which
                         reads as "we never quoted them" — the opposite of what
                         happened. The prices are the ones really sent, not a
                         re-read of today's Stripe catalog. -->
                    <div v-else-if="b.t === 'boxes'" class="mt-1.5">
                      <div class="text-[11px] font-semibold text-gray-400 mb-1">{{ b.label }}</div>
                      <div class="rounded-lg border border-gray-100 bg-gray-50 divide-y divide-gray-100">
                        <div v-for="(bx, xi) in b.boxes" :key="xi" class="flex items-center justify-between gap-3 px-2 py-1">
                          <span class="min-w-0 text-[11px] text-gray-600 truncate">
                            <span class="font-semibold text-gray-800">{{ bx.label || bx.key }}</span>
                            <span v-if="bx.dims" class="text-gray-400"> · {{ bx.dims }}</span>
                          </span>
                          <span class="shrink-0 text-[11px] font-bold text-gray-800 tabular-nums">${{ fmtMx(bx.price_mxn) }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Follow-up suggestions the assistant offered -->
                    <div v-else-if="b.t === 'suggestions'" class="mt-1.5">
                      <div class="text-[11px] font-semibold text-gray-400 mb-1">{{ b.label }}</div>
                      <div class="flex flex-wrap gap-1">
                        <span v-for="(sg, si) in b.items" :key="si" class="text-[11px] bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{{ sg }}</span>
                      </div>
                    </div>

                    <span v-else :class="['inline-block mt-1 mr-1 text-[11px] font-semibold px-2 py-0.5 rounded-full', m.role === 'user' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600']">{{ b.label }}</span>
                  </template>
                </div>
              </div>
            </template>
          </div>
        </aside>
      </Transition>
    </Teleport>
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

// ── Activity feed: paginated SERVER-side ─────────────────────────────────────
// It used to be derived from `stats.recent_searches` + `recent_questions`, which
// meant every page load pulled 70 rows with their full answers — 35 KB of a
// 42 KB response — just to render 40 of them. Now it pages through
// /admin/ai-search/events (already paginated) and `stats` is asked for the
// light payload it actually draws.
const FEED_PER_PAGE = 15
const feedRows = ref([])
const feedTotal = ref(0)
const feedPages = ref(1)
const feedPage = ref(1)
const feedLoading = ref(true)

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
  // "Sin lo que pidieron" is the only honest quality number: a search that
  // returned 0 AND a search we answered with the store's generic catalog both
  // mean the customer didn't get what they asked for. The broadened half used
  // to be invisible here — it looked like a 16-result hit.
  const unmatched = Number(s.unmatched_searches) || 0
  const zero = Number(s.zero_result_searches) || 0
  const broad = Number(s.broadened_searches) || 0
  return [
    { label: 'Interacciones', value: fmt(total), sub: `${fmt(searches)} búsquedas · ${fmt(questions)} preguntas` },
    { label: 'Intención de compra', value: fmt(searches), sub: `${pct(searches)}% del total` },
    { label: 'Intención de aprender', value: fmt(questions), sub: `${pct(questions)}% del total` },
    { label: 'Productos vistos', value: fmt(s.total_product_views), sub: `${s.view_rate ?? 0}% de las búsquedas` },
    {
      label: 'Sin lo que pidieron',
      value: `${s.unmatched_rate ?? 0}%`,
      sub: `${fmt(zero)} sin resultados · ${fmt(broad)} catálogo genérico`,
      alert: unmatched > 0,
    },
  ]
})

// One chronological stream of searches + questions, already ordered and paged
// by the API (`type=search,question` leaves product views out).
const recentFeed = computed(() => (feedRows.value || []).map((r) => ({
  kind: r.type === 'question' ? 'question' : 'search',
  query: r.query,
  results: r.results,
  // The query matched nothing and we served the store's catalog instead.
  broadened: !!r.broadened,
  served_query: r.served_query,
  stores: r.stores,
  answer: r.answer,
  guest: r.guest,
  user: r.user,
  conversation_id: r.conversation_id,
  created_at: r.created_at,
})))

async function loadFeed(page = 1) {
  feedLoading.value = true
  try {
    const res = await $customFetch('/admin/ai-search/events', {
      params: { type: 'search,question', days: days.value, per_page: FEED_PER_PAGE, page },
    })
    const d = res.data || {}
    feedRows.value = d.data || []
    feedTotal.value = d.total || 0
    feedPages.value = d.last_page || 1
    feedPage.value = d.current_page || page
  } catch (e) {
    console.error(e)
    feedRows.value = []
    feedTotal.value = 0
    feedPages.value = 1
  } finally {
    feedLoading.value = false
  }
}

function goFeed(page) {
  if (page < 1 || page > feedPages.value || feedLoading.value) return
  loadFeed(page)
}

// ── Thread drawer: click a search/question → the full chat behind it ──────────
const threadOpen = ref(false)
const threadLoading = ref(false)
const thread = ref(null)

async function openThread(r) {
  if (!r?.conversation_id) return
  threadOpen.value = true
  threadLoading.value = true
  thread.value = null
  try {
    thread.value = (await $customFetch(`/admin/ai-search/thread/${r.conversation_id}`)).data
  } catch (e) {
    console.error(e)
    thread.value = { error: true }
  } finally {
    threadLoading.value = false
  }
}
function closeThread() { threadOpen.value = false }

// Flatten a stored message ({ parts: [...] }) into renderable bits: text blocks
// and compact chips for tool calls (search, gallery, order, etc.).
// Tool calls whose output is a product GALLERY — we render the actual products the
// customer saw, not just a "16 result" chip, so an admin can review the real chat.
const GALLERY_TOOLS = new Set(['search_products', 'browse_store', 'browse_stores', 'show_products', 'show_saved_products', 'show_orders'])
function messageBits(m) {
  const parts = (m?.content?.parts) || (Array.isArray(m?.content) ? m.content : [])
  const bits = []
  for (const p of parts) {
    if (!p || typeof p !== 'object') continue
    if (p.type === 'text' && p.text) { bits.push({ t: 'text', text: p.text }); continue }
    if (typeof p.type === 'string' && p.type.startsWith('tool-')) {
      const name = p.type.slice(5)
      const q = p.input?.query || p.input?.store || p.input?.store_url
      const products = Array.isArray(p.output?.products) ? p.output.products : null
      const suggestions = Array.isArray(p.output?.suggestions) ? p.output.suggestions : null
      const boxes = Array.isArray(p.output?.boxes) ? p.output.boxes : null
      if (GALLERY_TOOLS.has(name) && products && products.length) {
        bits.push({ t: 'products', label: toolLabel(name, q, products.length), products })
      } else if (name === 'show_box_guide' && boxes && boxes.length) {
        bits.push({ t: 'boxes', label: toolLabel(name), boxes })
      } else if (name === 'suggest_followups' && suggestions && suggestions.length) {
        bits.push({ t: 'suggestions', label: toolLabel(name), items: suggestions.map((s) => (typeof s === 'string' ? s : s?.text)).filter(Boolean) })
      } else {
        bits.push({ t: 'tool', name, label: toolLabel(name, q, products ? products.length : null) })
      }
    }
  }
  return bits
}
function toolLabel(name, q, n) {
  const map = {
    search_products: `🔍 Buscó${q ? ` “${q}”` : ''}${n != null ? ` · ${n} result.` : ''}`,
    browse_store: `🛍 Exploró tienda${q ? ` (${q})` : ''}`,
    browse_stores: `🛍 Exploró varias tiendas`,
    show_products: `🖼 Mostró productos`,
    show_saved_products: `🖼 Re-mostró productos`,
    show_orders: `📦 Mostró pedidos`,
    show_assisted_summary: `🧾 Resumen de compra asistida`,
    cancel_order: `✖️ Cancelar pedido`,
    plan_in_person: `📍 Compra en persona`,
    create_self_order: `➕ Creó envío`,
    create_purchase_request: `🛒 Creó solicitud`,
    web_search: `🌐 Búsqueda web${q ? ` “${q}”` : ''}`,
    extract_product: `🔗 Extrajo producto`,
    suggest_followups: `💬 Sugerencias`,
    show_box_guide: `📦 Mostró precios de cajas`,
    show_shipment: `📦 Mostró el envío`,
    get_profile: `👤 Leyó el perfil`,
    update_shopping_profile: `👤 Actualizó el perfil`,
    list_orders: `📋 Consultó pedidos`,
    create_account: `✨ Creó cuenta`,
  }
  return map[name] || `⚙️ ${name}`
}

function fmtMx(n) {
  return new Intl.NumberFormat('es-MX').format(Number(n) || 0)
}
function fmtDateTime(d) {
  if (!d) return ''
  try { return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(d)) } catch { return '' }
}

// Account-creation date — day-level (no time), used for "Cliente desde …".
function fmtDate(d) {
  if (!d) return ''
  try { return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d)) } catch { return '' }
}

function fmt(n) { return new Intl.NumberFormat('es-MX').format(Number(n) || 0) }

// Both requests go out TOGETHER. The old version awaited `stats` before it even
// started the second call, so the two round-trips were serial for no reason.
async function load() {
  loading.value = true
  const stats$ = $customFetch('/admin/ai-search/stats', { params: { days: days.value, light: 1 } })
    .then((r) => { stats.value = r.data })
    .catch((e) => {
      console.error(e)
      stats.value = { days: days.value, total_searches: 0, total_product_views: 0, total_questions: 0, view_rate: 0, top_result_stores: [] }
    })
    .finally(() => { loading.value = false })

  await Promise.all([stats$, loadFeed(1)])
}
onMounted(load)
</script>

<style scoped>
.fade-fast-enter-active, .fade-fast-leave-active { transition: opacity .2s ease; }
.fade-fast-enter-from, .fade-fast-leave-to { opacity: 0; }
.slide-over-enter-active, .slide-over-leave-active { transition: transform .28s cubic-bezier(.2,.8,.2,1); }
.slide-over-enter-from, .slide-over-leave-to { transform: translateX(100%); }
</style>
