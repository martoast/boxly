<template>
  <!-- The campaign calendar (2026-11-17): what is scheduled (violet) and what went out (green) on each day of the month; click a day to
       schedule a draft on it. Days and times are central Mexico time. -->
  <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
    <div class="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-gray-100">
      <div class="flex items-center gap-2">
        <button type="button" class="p-2 rounded-lg hover:bg-gray-100" :aria-label="t.prev" @click="shift(-1)">
          <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <h2 class="text-lg font-bold text-gray-900 capitalize w-44 text-center">{{ monthTitle }}</h2>
        <button type="button" class="p-2 rounded-lg hover:bg-gray-100" :aria-label="t.next" @click="shift(1)">
          <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        </button>
        <button type="button" class="ml-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50" @click="goToday">{{ t.today }}</button>
      </div>
      <div class="hidden sm:flex items-center gap-4 text-xs text-gray-600">
        <span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-violet-500"></span>{{ t.scheduled }}</span>
        <span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>{{ t.sending }}</span>
        <span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-green-500"></span>{{ t.sent }}</span>
      </div>
    </div>

    <div class="grid grid-cols-7 bg-gray-50 border-b border-gray-100 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-500">
      <div v-for="d in weekdays" :key="d" class="py-2">{{ d }}</div>
    </div>
    <div v-if="loading" class="py-16 text-center text-gray-400 text-sm">{{ t.loading }}</div>
    <div v-else>
      <div v-for="(week, wi) in grid" :key="wi" class="grid grid-cols-7 border-b border-gray-100 last:border-b-0">
        <div v-for="(day, di) in week" :key="di"
          class="min-h-[96px] sm:min-h-[112px] p-1.5 border-r border-gray-100 last:border-r-0 text-left"
          :class="[day ? (day < today ? 'bg-gray-50/60' : 'bg-white hover:bg-violet-50/40 cursor-pointer') : 'bg-gray-50/30', day === today ? 'ring-2 ring-inset ring-primary-400' : '']"
          @click="day && day >= today && openDay(day)">
          <template v-if="day">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold" :class="day === today ? 'text-primary-600' : day < today ? 'text-gray-400' : 'text-gray-700'">{{ Number(day.slice(8)) }}</span>
              <span v-if="day >= today" class="text-[10px] text-violet-500 opacity-0 hover:opacity-100">+ {{ t.schedule }}</span>
            </div>
            <div class="mt-1 space-y-1">
              <div v-for="c in byDay[day] || []" :key="c.id"
                class="group flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] leading-tight" :class="chipClass(c)"
                @click.stop="navigateTo(`${detailBase}/${c.id}`)">
                <span class="font-semibold shrink-0">{{ chipTime(c) }}</span>
                <span class="truncate">{{ c.name }}</span>
                <button v-if="isScheduled(c)" type="button" class="ml-auto shrink-0 opacity-60 hover:opacity-100" :title="t.unschedule" @click.stop="unschedule(c)">✕</button>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Schedule a draft on the clicked day -->
    <div v-if="pickDay" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" @click.self="pickDay = null">
      <div class="w-full max-w-md bg-white rounded-2xl shadow-xl p-5">
        <h3 class="text-lg font-bold text-gray-900">{{ t.scheduleOn }} <span class="capitalize">{{ dayTitle(pickDay) }}</span></h3>
        <p class="text-xs text-gray-500 mt-1">{{ t.mxTime }}</p>
        <div v-if="!drafts.length" class="mt-4 text-sm text-gray-600">{{ t.noDrafts }}</div>
        <template v-else>
          <label class="block mt-4 text-sm font-medium text-gray-700">{{ t.campaign }}</label>
          <select v-model="pickId" class="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500">
            <option v-for="d in drafts" :key="d.id" :value="d.id">{{ d.name }}</option>
          </select>
          <label class="block mt-3 text-sm font-medium text-gray-700">{{ t.time }}</label>
          <input v-model="pickTime" type="time" step="900" class="mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500" />
        </template>
        <p v-if="error" class="mt-3 text-xs text-red-600">{{ error }}</p>
        <div class="mt-5 flex justify-end gap-2">
          <button type="button" class="px-4 py-2 text-sm rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50" @click="pickDay = null">{{ t.cancel }}</button>
          <button v-if="drafts.length" type="button" :disabled="busy || !pickId || !pickTime" class="px-4 py-2 text-sm font-semibold rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50" @click="scheduleIt">{{ t.schedule }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { isScheduled, mxDay, mxTime, mxInstant, monthGrid } from '~/utils/campaignSchedule'

const props = defineProps({
  apiPrefix: { type: String, default: '/admin' },
  detailBase: { type: String, default: '/app/admin/campaigns' },
})
const emit = defineEmits(['changed'])
const { $customFetch } = useNuxtApp()
const { t: createTranslations, language } = useLanguage()
const locale = computed(() => (language?.value === 'en' ? 'en-US' : 'es-MX'))
const t = createTranslations({
  prev: { es: 'Mes anterior', en: 'Previous month' },
  next: { es: 'Mes siguiente', en: 'Next month' },
  today: { es: 'Hoy', en: 'Today' },
  scheduled: { es: 'Programada', en: 'Scheduled' },
  sending: { es: 'Enviando', en: 'Sending' },
  sent: { es: 'Enviada', en: 'Sent' },
  loading: { es: 'Cargando calendario...', en: 'Loading calendar...' },
  schedule: { es: 'Programar', en: 'Schedule' },
  unschedule: { es: 'Quitar programación', en: 'Unschedule' },
  scheduleOn: { es: 'Programar para el', en: 'Schedule on' },
  mxTime: { es: 'Hora del centro de México. Se envía sola a esa hora.', en: 'Central Mexico time. It sends by itself at that time.' },
  noDrafts: { es: 'No hay borradores sin programar. Crea una campaña primero.', en: 'No unscheduled drafts. Create a campaign first.' },
  campaign: { es: 'Campaña (borrador)', en: 'Campaign (draft)' },
  time: { es: 'Hora', en: 'Time' },
  cancel: { es: 'Cancelar', en: 'Cancel' },
  confirmUnschedule: { es: '¿Quitar la programación de esta campaña? Queda como borrador.', en: 'Unschedule this campaign? It stays a draft.' },
  failed: { es: 'No se pudo guardar', en: 'Could not save' },
})
const weekdays = computed(() => (language?.value === 'en' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']))

const today = mxDay(new Date())
const view = ref({ y: Number(today.slice(0, 4)), m: Number(today.slice(5, 7)) - 1 })
const grid = computed(() => monthGrid(view.value.y, view.value.m))
const monthTitle = computed(() => new Intl.DateTimeFormat(locale.value, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(view.value.y, view.value.m, 1))))
const dayTitle = (d) => new Intl.DateTimeFormat(locale.value, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${d}T12:00:00Z`))

const campaigns = ref([])
const drafts = ref([])
const loading = ref(true)
const busy = ref(false)
const error = ref('')
const pickDay = ref(null)
const pickId = ref(null)
const pickTime = ref('09:00')

// the day a campaign sits on: its scheduled time while a draft, else when it started sending
const whenOf = (c) => (isScheduled(c) ? c.scheduled_at : c.started_at || c.scheduled_at)
const byDay = computed(() => {
  const out = {}
  for (const c of campaigns.value) { const d = mxDay(whenOf(c)); if (d) (out[d] ||= []).push(c) }
  for (const d in out) out[d].sort((a, b) => String(whenOf(a)).localeCompare(String(whenOf(b))))
  return out
})
const chipTime = (c) => mxTime(whenOf(c)).replace(/^0/, '')
const chipClass = (c) => (isScheduled(c) ? 'bg-violet-100 text-violet-800 hover:bg-violet-200'
  : c.status === 'sending' || c.status === 'paused' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
    : c.status === 'completed' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')

async function load() {
  loading.value = true
  // one day either side: the API's days are UTC, the calendar's central Mexico (a Nov 30, 8 p.m. send is Dec 1 in UTC); byDay places each by its Mexico day
  const first = new Date(Date.UTC(view.value.y, view.value.m, 0)).toISOString().slice(0, 10)
  const last = new Date(Date.UTC(view.value.y, view.value.m + 1, 1)).toISOString().slice(0, 10)
  try {
    const r = await $customFetch(`${props.apiPrefix}/campaigns/calendar`, { params: { from: first, to: last } })
    campaigns.value = r?.data?.campaigns || []
    drafts.value = r?.data?.unscheduled_drafts || []
  } catch (e) {
    console.error('campaign calendar failed', e)
    campaigns.value = []; drafts.value = []
  } finally {
    loading.value = false
  }
}
function shift(n) { const m = view.value.m + n; view.value = { y: view.value.y + Math.floor(m / 12), m: ((m % 12) + 12) % 12 } }
function goToday() { view.value = { y: Number(today.slice(0, 4)), m: Number(today.slice(5, 7)) - 1 } }
function openDay(d) { pickDay.value = d; pickId.value = drafts.value[0]?.id ?? null; pickTime.value = '09:00'; error.value = '' }

async function put(id, at) {
  await $customFetch(`${props.apiPrefix}/campaigns/${id}`, { method: 'PUT', body: { scheduled_at: at } })
  emit('changed')
  await load()
}
async function scheduleIt() {
  busy.value = true; error.value = ''
  try { await put(pickId.value, mxInstant(pickDay.value, pickTime.value)); pickDay.value = null }
  catch (e) { error.value = e?.data?.message || t.value.failed }
  finally { busy.value = false }
}
async function unschedule(c) {
  if (!confirm(t.value.confirmUnschedule)) return
  try { await put(c.id, null) } catch (e) { alert(e?.data?.message || t.value.failed) }
}

watch(view, load)
onMounted(load)
defineExpose({ reload: load })
</script>
