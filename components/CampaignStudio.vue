<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- header -->
      <div class="flex items-center justify-between gap-3 mb-6">
        <div>
          <NuxtLink to="/app/admin/campaigns" class="text-sm text-gray-400 hover:text-gray-600 inline-flex items-center gap-1 mb-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" stroke-linecap="round"/></svg> Campañas
          </NuxtLink>
          <h1 class="text-2xl font-extrabold text-gray-900">Estudio con IA</h1>
        </div>
        <button v-if="view !== 'start'" @click="reset" class="text-sm font-semibold text-gray-500 hover:text-gray-800">Empezar de nuevo</button>
      </div>

      <!-- ══ START ══ -->
      <div v-if="view === 'start'" class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-10 text-center">
        <div class="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 grid place-items-center text-white shadow-lg shadow-primary-500/25 mb-4">
          <svg class="w-7 h-7" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9z"/></svg>
        </div>
        <h2 class="text-xl font-extrabold text-gray-900">Ideas de campaña, aterrizadas en hoy</h2>
        <p class="text-sm text-gray-500 max-w-md mx-auto mt-1.5">La IA investiga las ofertas que están pasando ahora, lee tu base de conocimiento y tus campañas pasadas, y te propone ideas listas para desarrollar.</p>
        <input v-model="guidance" type="text" placeholder="¿Algo en mente? (opcional) — ej. Prime Day, expats, envío gratis"
               class="mt-5 w-full max-w-md mx-auto block border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        <button @click="genIdeas" :disabled="busy" class="mt-4 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-bold shadow-lg shadow-primary-600/20 transition">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9z"/></svg>
          Generar ideas
        </button>
        <div class="mt-8 grid sm:grid-cols-3 gap-3 max-w-2xl mx-auto text-left">
          <div v-for="(s, i) in steps" :key="i" class="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
            <div class="w-6 h-6 rounded-lg bg-white border border-gray-200 grid place-items-center text-[12px] font-extrabold text-primary-600 mb-1.5">{{ i + 1 }}</div>
            <p class="text-[12.5px] font-bold text-gray-800">{{ s.t }}</p>
            <p class="text-[11.5px] text-gray-500 leading-snug mt-0.5">{{ s.d }}</p>
          </div>
        </div>
      </div>

      <!-- ══ LOADER ══ -->
      <div v-else-if="busy && view !== 'draft'" class="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
        <svg class="w-8 h-8 text-primary-500 animate-spin mx-auto mb-4" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
        <p class="text-sm font-bold text-gray-900">{{ loaderMsg }}</p>
        <p class="text-xs text-gray-400 mt-1">Esto toma unos segundos.</p>
      </div>

      <!-- ══ IDEAS ══ -->
      <div v-else-if="view === 'ideas'">
        <div class="rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 text-white p-4 mb-4 shadow-sm">
          <div class="text-[11px] font-bold uppercase tracking-widest text-white/60">🗓 Momento detectado</div>
          <div class="text-[15px] font-bold mt-0.5">{{ moment }}</div>
          <!-- evidence: what the AI actually researched, so the grounding is proven, not claimed -->
          <div class="flex flex-wrap gap-1.5 mt-2.5">
            <span class="text-[11px] font-semibold text-white/90 bg-white/15 rounded-full px-2 py-0.5">🔍 {{ researched || 0 }} búsquedas web hoy</span>
            <span class="text-[11px] font-semibold text-white/90 bg-white/15 rounded-full px-2 py-0.5">📅 calendario retail MX/US</span>
            <span class="text-[11px] font-semibold text-white/90 bg-white/15 rounded-full px-2 py-0.5">📚 base de conocimiento</span>
            <span v-if="pastCampaigns.length" class="text-[11px] font-semibold text-white/90 bg-white/15 rounded-full px-2 py-0.5">📈 {{ pastCampaigns.length }} campañas pasadas</span>
          </div>
          <!-- the exact Google searches it ran — visible + steerable -->
          <div v-if="queriesRun.length" class="flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t border-white/15">
            <span class="text-[11px] font-bold text-white/50">Buscó:</span>
            <span v-for="(q, i) in queriesRun" :key="i" class="text-[11px] text-white/85 bg-white/10 rounded px-1.5 py-0.5">{{ q }}</span>
            <button @click="openEditSearch" class="text-[11px] font-semibold text-white/80 hover:text-white underline underline-offset-2 ml-1">editar búsquedas</button>
            <span class="text-white/30">·</span>
            <button @click="editStyle = true" class="text-[11px] font-semibold text-white/80 hover:text-white underline underline-offset-2">ajustar cómo escribe</button>
          </div>
        </div>

        <!-- steer the WRITING: tone / info — regenerate keeping the same search -->
        <div v-if="editStyle" class="rounded-2xl border border-primary-200 bg-primary-50/60 p-3.5 mb-4">
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-[12.5px] font-bold text-gray-800">¿Cómo quieres que escriba? — tono, qué incluir o evitar, en qué enfocarse</span>
            <button @click="editStyle = false" class="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
          </div>
          <textarea v-model="guidance" rows="3" placeholder="ej. tono más urgente y directo · menciona el envío gratis de Amazon · enfócate en electrónica · más corto" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"></textarea>
          <div class="flex items-center justify-between gap-2 mt-2">
            <span class="text-[11px] text-gray-500">Se aplica a las ideas y a los correos que generes.</span>
            <div class="flex gap-2">
              <button @click="editStyle = false" class="text-[13px] font-semibold text-gray-500 px-3 py-1.5">Cerrar</button>
              <button @click="applyGuidance" :disabled="busy" class="text-[13px] font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg px-4 py-1.5 disabled:opacity-50">Regenerar ideas</button>
            </div>
          </div>
        </div>

        <!-- steer the search: edit the Google queries and re-run -->
        <div v-if="editSearch" class="rounded-2xl border border-primary-200 bg-primary-50/60 p-3.5 mb-4">
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-[12.5px] font-bold text-gray-800">Edita las búsquedas de Google (una por línea)</span>
            <button @click="editSearch = false" class="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
          </div>
          <textarea v-model="editQueries" rows="4" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] font-mono bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"></textarea>
          <div class="flex justify-end gap-2 mt-2">
            <button @click="editSearch = false" class="text-[13px] font-semibold text-gray-500 px-3 py-1.5">Cancelar</button>
            <button @click="reSearch" :disabled="busy" class="text-[13px] font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg px-4 py-1.5 disabled:opacity-50">Buscar de nuevo</button>
          </div>
        </div>
        <div class="grid sm:grid-cols-2 gap-3">
          <article v-for="(idea, i) in ideas" :key="i" class="flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-primary-200 hover:-translate-y-0.5 transition">
            <span class="self-start text-[11px] font-extrabold uppercase tracking-wide text-primary-700 bg-primary-50 border border-primary-100 rounded-full px-2 py-0.5">{{ idea.hook }}</span>
            <h3 class="text-[15px] font-extrabold text-gray-900 mt-2 leading-snug">{{ idea.subject }}</h3>
            <p class="text-[13px] text-gray-600 mt-1 leading-relaxed">{{ idea.angle }}</p>
            <p class="text-[12px] text-gray-400 mt-2 leading-relaxed"><span class="font-semibold text-gray-500">Por qué ahora:</span> {{ idea.why_now }}</p>
            <div class="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-gray-50">
              <span class="text-[11px] font-semibold text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">{{ audLabel(idea.audience) }}</span>
              <button @click="pick(idea)" class="inline-flex items-center gap-1 text-[13px] font-bold text-primary-600 hover:text-primary-700">Desarrollar <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
            </div>
          </article>
        </div>
        <div class="text-center mt-4">
          <button @click="genIdeas" :disabled="busy" class="text-sm font-semibold text-gray-500 hover:text-gray-800 disabled:opacity-50">↻ Generar otras ideas</button>
        </div>
      </div>

      <!-- ══ DRAFT ══ -->
      <div v-else-if="view === 'draft'" class="pb-4">
        <button @click="back" class="text-sm font-semibold text-gray-500 hover:text-gray-800 mb-3">← Volver a ideas</button>

        <!-- HERO: editor + live preview side by side -->
        <div class="grid lg:grid-cols-2 gap-4">
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5" :class="drafting && 'opacity-50 pointer-events-none'">
            <div class="flex items-center justify-between mb-1">
              <label class="text-[11px] font-bold uppercase tracking-wide text-gray-400">Asunto</label>
              <span class="text-[11px] font-semibold tabular-nums" :class="(draft.subject||'').length > 50 ? 'text-red-500' : 'text-gray-300'">{{ (draft.subject||'').length }}/50</span>
            </div>
            <input v-model="draft.subject" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-[15px] font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500" />
            <label class="block text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1 mt-4">Cuerpo</label>
            <textarea v-model="draft.body" rows="6" class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-[14px] leading-relaxed text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"></textarea>
            <div class="mt-3 grid grid-cols-2 gap-3">
              <div><label class="block text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1">Botón (CTA)</label><input v-model="draft.cta_text" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
              <div><label class="block text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1">Enlace</label><input v-model="draft.cta_url" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
            </div>
          </div>
          <div class="lg:sticky lg:top-4 self-start">
            <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div class="bg-gray-50 border-b border-gray-100 px-4 py-2 flex items-center justify-between">
                <span class="text-[11px] font-bold uppercase tracking-wide text-gray-400">Vista previa · así se verá</span>
                <span v-if="drafting" class="text-[11px] text-primary-600 font-semibold inline-flex items-center gap-1"><svg class="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> reescribiendo…</span>
              </div>
              <div class="p-5">
                <p class="text-[16px] font-bold text-gray-900">{{ draft.subject }}</p>
                <p class="text-[14px] text-gray-700 whitespace-pre-wrap leading-relaxed mt-2">{{ draft.body }}</p>
                <a class="inline-block mt-4 px-4 py-2 rounded-lg bg-primary-600 text-white text-[13px] font-bold">{{ draft.cta_text || 'Ver más' }}</a>
              </div>
            </div>
          </div>
        </div>

        <!-- AFINAR CON IA — the two AI actions, unified -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mt-4">
          <div class="flex items-center gap-2 mb-2.5">
            <span class="grid place-items-center w-6 h-6 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 text-white"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9z"/></svg></span>
            <span class="text-[13px] font-extrabold text-gray-900">Afinar con IA</span>
          </div>
          <div class="flex flex-col sm:flex-row gap-2">
            <input v-model="comment" @keydown.enter="refine" placeholder="Dile qué cambiar — ej. hazlo más corto, menciona el envío gratis…" class="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary-500" />
            <button @click="refine" :disabled="drafting || !comment.trim()"
              class="rounded-lg px-4 py-2.5 text-[13px] font-bold transition whitespace-nowrap"
              :class="comment.trim() && !drafting ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm' : 'border border-gray-200 text-gray-400 cursor-not-allowed'">Aplicar cambio</button>
            <button @click="variations" :disabled="drafting" class="rounded-lg px-4 py-2.5 text-[13px] font-bold border border-gray-200 text-gray-700 hover:border-primary-200 disabled:opacity-40 transition whitespace-nowrap">✨ 3 variaciones</button>
          </div>
        </div>

        <!-- STICKY action bar: audience + save always in reach -->
        <div class="sticky bottom-3 mt-4 z-10">
          <div class="bg-white/95 backdrop-blur border border-gray-200 rounded-2xl shadow-lg p-2.5 flex flex-col sm:flex-row items-center gap-2.5">
            <div class="flex items-center gap-2 flex-1 w-full">
              <select v-model="draft.audience" class="border border-gray-200 rounded-lg px-3 py-2 text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 flex-1 sm:flex-none">
                <option v-for="a in AUDIENCES" :key="a" :value="a">{{ audLabel(a) }}</option>
              </select>
              <span class="text-[12px] text-gray-500 whitespace-nowrap">{{ audienceSize == null ? 'Calculando…' : `~${audienceSize.toLocaleString('es-MX')} personas` }}</span>
            </div>
            <button @click="save" :disabled="saving || !canSave" class="w-full sm:w-auto rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-[14px] font-bold px-6 py-2.5 shadow-lg shadow-primary-600/20 transition whitespace-nowrap">
              {{ saving ? 'Guardando…' : 'Guardar como borrador' }}
            </button>
          </div>
          <p class="text-[11px] text-gray-400 text-center mt-1.5">Se guarda como borrador. El envío sigue siendo un paso aparte, con confirmación.</p>
        </div>
      </div>

      <!-- variations overlay -->
      <div v-if="variationsList.length" class="fixed inset-0 z-40 bg-gray-900/40 flex items-end sm:items-center justify-center p-3" @click.self="variationsList = []">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-base font-extrabold text-gray-900">Elige una variación</h3>
            <button @click="variationsList = []" class="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
          </div>
          <div class="space-y-2.5">
            <button v-for="(v, i) in variationsList" :key="i" @click="chooseVariation(v)" class="w-full text-left rounded-xl border border-gray-200 hover:border-primary-300 hover:bg-primary-50/40 p-3 transition">
              <p class="text-[14px] font-bold text-gray-900">{{ v.subject }}</p>
              <p class="text-[13px] text-gray-600 mt-1 line-clamp-3 whitespace-pre-wrap">{{ v.body }}</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({ demo: { type: Boolean, default: false } })
const { $customFetch } = useNuxtApp()
const router = useRouter()
const route = useRoute()

const AUDIENCES = ['all', 'has_orders', 'no_orders', 'active_orders', 'expat', 'business', 'shopper']
const AUD_LABEL = {
  all: 'Todos los clientes', has_orders: 'Con pedidos (leales)', no_orders: 'Sin pedidos (reactivar)',
  active_orders: 'Con caja activa', expat: 'Expats', business: 'Negocios (B2B)', shopper: 'Cazadores de ofertas',
}
function audLabel(a) { return AUD_LABEL[a] || a }
const steps = [
  { t: 'Investiga hoy', d: 'Ofertas activas en la web, tu base de conocimiento y tus campañas pasadas.' },
  { t: 'Propone ideas', d: 'Aterrizadas en lo que está pasando ahora, cada una con su porqué.' },
  { t: 'Eliges y afinas', d: 'Desarrolla la que más te guste, pídele cambios y guárdala.' },
]

const view = ref('start')          // start | ideas | draft
const busy = ref(false)            // ideas/pick loading
const drafting = ref(false)        // refine/variations loading
const saving = ref(false)
const guidance = ref('')
const moment = ref('')
const ideas = ref([])
const researched = ref(0) // number of live web searches the last generation ran
const queriesRun = ref([]) // the exact Google queries used (AI-planned or admin-steered)
const editSearch = ref(false)
const editQueries = ref('')
const editStyle = ref(false) // steer HOW it writes (tone / info), separate from the search
const draft = ref({ name: '', subject: '', body: '', cta_text: '', cta_url: '', audience: 'all' })
const comment = ref('')
const variationsList = ref([])
const pastCampaigns = ref([])
const audienceSize = ref(null)

const canSave = computed(() => draft.value.subject?.trim() && draft.value.body?.trim())

// staged loader messages
const LOADER = ['Revisando el calendario de ofertas…', 'Buscando las ofertas de hoy en la web…', 'Leyendo tu base de conocimiento…', 'Analizando tus campañas pasadas…', 'Generando ideas…']
const loaderMsg = ref(LOADER[0])
let loaderTimer = null
function startLoader() { let i = 0; loaderMsg.value = LOADER[0]; loaderTimer = setInterval(() => { i = (i + 1) % LOADER.length; loaderMsg.value = LOADER[i] }, 1600) }
function stopLoader() { if (loaderTimer) clearInterval(loaderTimer); loaderTimer = null }

// DEV/demo data so the studio can be previewed without auth or the AI backend.
const DEMO_IDEAS = [
  { hook: 'Pre-Prime Day', subject: 'prepara tu lista para el prime day', angle: 'El Prime Day está por comenzar; ayúdalos a armar su carrito con tiempo usando su dirección Boxly.', why_now: 'Amazon anuncia el Prime Day estos días de julio; preparar con tiempo evita saturaciones.', audience: 'has_orders', cta_text: 'ver mis beneficios' },
  { hook: 'Summer sales', subject: 'liquidaciones de verano en eeuu', angle: 'Las tiendas gringas rematan inventario de verano con hasta 70% de descuento.', why_now: 'Temporada de liquidaciones post-4 de julio antes de la mercancía de otoño.', audience: 'shopper', cta_text: 'comprar en tiendas' },
  { hook: 'Regreso a clases', subject: 'todo listo para el regreso a clases', angle: 'Útiles y gadgets escolares mucho más baratos en EE. UU., traídos sin complicaciones.', why_now: 'A mediados de julio arranca la temporada escolar y bajan laptops y mochilas.', audience: 'all', cta_text: 'empezar mi lista' },
  { hook: 'Compra asistida', subject: 'compra donde no aceptan tu tarjeta', angle: 'Muchas tiendas bloquean tarjetas mexicanas; si ves una oferta, la compramos por ti.', why_now: 'Con las ofertas de julio, muchas tarjetas locales son rechazadas en sitios de nicho.', audience: 'no_orders', cta_text: 'usar compra asistida' },
]
const DEMO_DRAFT = { name: 'Prime Day — envío a México', subject: 'prime day: pídelo antes de que suba', body: 'Ya arrancó el Prime Day y las mejores ofertas se agotan rápido. Compra en Amazon con tu dirección Boxly y nosotros lo consolidamos y te lo mandamos a casa. Aprovecha ahora que los precios están bajos y evita el envío caro comprando todo en una sola caja.', cta_text: 'ver cómo funciona', cta_url: 'https://boxly.mx', audience: 'has_orders' }

onMounted(async () => {
  if (props.demo) {
    const s = route.query.state
    if (s === 'ideas') { moment.value = 'Amazon Prime Day + regreso a clases — 13 de julio de 2026'; ideas.value = DEMO_IDEAS; researched.value = 8; pastCampaigns.value = Array(6).fill({ subject: '' }); queriesRun.value = ['Amazon Prime Day July 2026 best deals', 'back to school sales July 2026 US retailers', 'Las Americas Premium Outlets San Diego summer sales']; view.value = 'ideas' }
    else if (s === 'draft') { draft.value = { ...DEMO_DRAFT }; audienceSize.value = 1240; view.value = 'draft' }
    return
  }
  try {
    const res = await $customFetch('/admin/campaigns', { query: { per_page: 30 } })
    const rows = res?.data?.data || res?.data || []
    pastCampaigns.value = (Array.isArray(rows) ? rows : []).map((c) => ({ subject: c.subject, audience: c.audience, open_rate: c.open_rate, click_rate: c.click_rate })).slice(0, 20)
  } catch { /* non-fatal */ }
})

async function genIdeas(override) {
  editSearch.value = false
  busy.value = true; view.value = 'ideas-loading'; startLoader()
  try {
    const body = { pastCampaigns: pastCampaigns.value, guidance: guidance.value }
    if (Array.isArray(override) && override.length) body.queries = override
    const res = await $fetch('/api/campaigns/ideas', { method: 'POST', body })
    if (res?.ideas?.length) { moment.value = res.moment; ideas.value = res.ideas; researched.value = res.researched || 0; queriesRun.value = res.queries || []; view.value = 'ideas' }
    else { alert(res?.message || 'No se pudieron generar ideas.'); view.value = 'start' }
  } catch (e) { alert(e?.data?.message || 'No se pudieron generar ideas.'); view.value = 'start' }
  finally { busy.value = false; stopLoader() }
}
function openEditSearch() { editQueries.value = queriesRun.value.join('\n'); editSearch.value = true }
function reSearch() {
  const qs = editQueries.value.split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 5)
  if (qs.length) genIdeas(qs)
}
// Apply the writing guidance and regenerate ideas — KEEPING the current searches
// (so "I like the search, just change the writing" works).
function applyGuidance() { editStyle.value = false; genIdeas(queriesRun.value.length ? queriesRun.value : undefined) }

async function pick(idea) {
  busy.value = true; view.value = 'draft-loading'; startLoader()
  try {
    const res = await $fetch('/api/campaigns/draft', { method: 'POST', body: { mode: 'expand', idea, guidance: guidance.value } })
    if (res?.draft) { draft.value = res.draft; view.value = 'draft' } else { alert(res?.message || 'Error'); view.value = 'ideas' }
  } catch (e) { alert(e?.data?.message || 'Error'); view.value = 'ideas' }
  finally { busy.value = false; stopLoader() }
}

async function refine() {
  if (!comment.value.trim()) return
  drafting.value = true
  try {
    const res = await $fetch('/api/campaigns/draft', { method: 'POST', body: { mode: 'refine', draft: draft.value, comment: comment.value, guidance: guidance.value } })
    if (res?.draft) { draft.value = res.draft; comment.value = '' }
  } catch (e) { alert(e?.data?.message || 'Error') } finally { drafting.value = false }
}

async function variations() {
  drafting.value = true
  try {
    const res = await $fetch('/api/campaigns/draft', { method: 'POST', body: { mode: 'variations', draft: draft.value, guidance: guidance.value } })
    if (res?.variations?.length) variationsList.value = res.variations
  } catch (e) { alert(e?.data?.message || 'Error') } finally { drafting.value = false }
}
function chooseVariation(v) { draft.value = { ...draft.value, ...v }; variationsList.value = [] }

// audience size preview
watch(() => draft.value.audience, async (a) => {
  if (props.demo || view.value !== 'draft' || !a) return
  audienceSize.value = null
  try { const res = await $customFetch('/admin/campaigns/preview-audience', { query: { audience: a } }); audienceSize.value = res?.data?.count ?? res?.count ?? res?.data ?? 0 } catch { audienceSize.value = 0 }
})
watch(view, (v) => { if (props.demo) return; if (v === 'draft') { const a = draft.value.audience; draft.value = { ...draft.value }; audienceSize.value = null; $customFetch('/admin/campaigns/preview-audience', { query: { audience: a } }).then((r) => audienceSize.value = r?.data?.count ?? r?.count ?? 0).catch(() => audienceSize.value = 0) } })

async function save() {
  if (!canSave.value) return
  if (props.demo) { alert('(demo) se guardaría como borrador'); return }
  saving.value = true
  try {
    const res = await $customFetch('/admin/campaigns', { method: 'POST', body: {
      name: draft.value.name || draft.value.subject, subject: draft.value.subject, body: draft.value.body,
      link_url: draft.value.cta_url || null, link_text: draft.value.cta_text || null, audience: draft.value.audience,
    } })
    const id = res?.data?.id || res?.id
    if (id) router.push(`/app/admin/campaigns/${id}`)
    else router.push('/app/admin/campaigns')
  } catch (e) { alert(e?.data?.message || 'No se pudo guardar.') } finally { saving.value = false }
}

function back() { view.value = 'ideas' }
function reset() {
  if ((view.value === 'draft' || ideas.value.length) && !confirm('¿Empezar de nuevo? Se descartará lo que tienes ahora.')) return
  view.value = 'start'; ideas.value = []; moment.value = ''; comment.value = ''; variationsList.value = []
}
</script>
