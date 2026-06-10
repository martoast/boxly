<template>
  <div class="h-full flex flex-col bg-gray-50/70 overflow-hidden">
    <!-- Header -->
    <header class="shrink-0 bg-white/90 backdrop-blur border-b border-gray-200/80 px-4 sm:px-6 py-4">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h1 class="text-xl font-bold text-gray-900 tracking-tight">{{ t.title }}</h1>
          <p class="text-[13px] text-gray-400 mt-0.5">{{ t.subtitle }}</p>
        </div>

        <div class="flex items-center gap-2.5 flex-wrap">
          <div class="flex items-center bg-gray-100 rounded-lg p-0.5">
            <button @click="shiftWindow(-1)" class="p-1.5 rounded-md text-gray-500 hover:bg-white hover:text-gray-700 transition-colors" :title="t.prevWeek">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <button @click="goToday" class="px-3 py-1 text-[13px] font-medium text-gray-700 rounded-md hover:bg-white transition-colors">{{ t.thisWeek }}</button>
            <button @click="shiftWindow(1)" class="p-1.5 rounded-md text-gray-500 hover:bg-white hover:text-gray-700 transition-colors" :title="t.nextWeek">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
          <span class="text-[13px] font-medium text-gray-400 hidden sm:inline">{{ rangeLabel }}</span>

          <button @click="openCreate" class="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 text-white text-[13px] font-semibold rounded-lg hover:bg-black active:scale-[0.98] transition-all shadow-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
            {{ t.newOrder }}
          </button>

          <button @click="openWarehouseList" class="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary-600 text-white text-[13px] font-semibold rounded-lg hover:bg-primary-700 active:scale-[0.98] transition-all shadow-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
            {{ t.generateList }}
          </button>
        </div>
      </div>

      <!-- Search -->
      <div class="relative mt-3 w-full sm:max-w-xs">
        <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M11 17a6 6 0 100-12 6 6 0 000 12z"/></svg>
        <input v-model="searchTerm" type="text" :placeholder="t.searchCards" class="w-full border border-gray-200 rounded-lg pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        <button v-if="searchTerm" @click="searchTerm = ''" class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" :title="t.cancel">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <!-- Legend -->
      <div class="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3">
        <span v-for="key in legendKeys" :key="key" class="inline-flex items-center gap-1.5 text-[11px] text-gray-400">
          <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: badgeMeta[key].hex }"></span>{{ badgeMeta[key][lang] }}
        </span>
      </div>
    </header>

    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <svg class="animate-spin h-7 w-7 text-primary-500" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
    </div>

    <div v-else class="flex-1 min-h-0 p-4 sm:p-5">
      <ClientOnly>
        <!-- Calendar: backlog + weekday columns -->
        <div class="h-full grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          <!-- Backlog -->
          <section class="flex flex-col min-h-0">
            <div class="flex items-center justify-between px-1.5 mb-1.5">
              <div class="flex items-center gap-1.5 min-w-0">
                <span class="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
                <h3 class="text-[11px] font-bold text-amber-700 uppercase tracking-wider truncate">{{ t.backlog }}</h3>
              </div>
              <span class="text-[11px] font-medium text-amber-500 tabular-nums">{{ displayBacklog.length }}</span>
            </div>
            <draggable
              v-model="backlog"
              :group="{ name: 'board', pull: true, put: true }"
              item-key="id"
              class="rounded-xl bg-amber-50/40 border border-amber-100 p-1.5 space-y-1.5 flex-1 min-h-0 overflow-y-auto"
              ghost-class="ops-ghost"
              @change="(e) => onChange(e, null)"
            >
              <template #item="{ element }">
                <div v-show="cardMatches(element)">
                  <OpsCard :card="element" :badge-meta="badgeMeta" :lang="lang" @open="openDetail(element)" />
                </div>
              </template>
            </draggable>
          </section>

          <!-- Weekday columns -->
          <section v-for="col in dayCols" :key="col.date" class="flex flex-col min-h-0">
            <div class="flex items-center justify-between px-1.5 mb-1.5">
              <div class="flex items-baseline gap-1.5 min-w-0">
                <h3 class="text-[11px] font-bold uppercase tracking-wider truncate" :class="col.isToday ? 'text-primary-600' : 'text-gray-500'">{{ col.label }}</h3>
                <span class="text-[10px] font-medium" :class="col.isToday ? 'text-primary-400' : 'text-gray-300'">{{ col.dayNum }}</span>
              </div>
              <span class="text-[11px] font-medium tabular-nums" :class="col.isToday ? 'text-primary-500' : 'text-gray-300'">{{ displayDays(col.date).length }}</span>
            </div>
            <draggable
              :list="daysMap[col.date] || (daysMap[col.date] = [])"
              :group="{ name: 'board', pull: true, put: true }"
              item-key="id"
              class="rounded-xl border p-1.5 space-y-1.5 flex-1 min-h-0 overflow-y-auto transition-colors"
              :class="col.isToday ? 'bg-primary-50/40 border-primary-100' : 'bg-gray-100/40 border-gray-100'"
              ghost-class="ops-ghost"
              @change="(e) => onChange(e, col.date)"
            >
              <template #item="{ element }">
                <div v-show="cardMatches(element)">
                  <OpsCard :card="element" :badge-meta="badgeMeta" :lang="lang" @open="openDetail(element)" />
                </div>
              </template>
            </draggable>
          </section>
        </div>
      </ClientOnly>
    </div>

    <!-- Order detail / quick-edit modal (opened by clicking a card) -->
    <OpsOrderModal
      :show="showDetail"
      :card="detailCard"
      :badge-meta="badgeMeta"
      @close="showDetail = false"
      @updated="fetchBoard"
      @consolidate="onConsolidateFromDetail"
    />

    <!-- Consolidate modal (opened by dropping a not-yet-consolidated card on a day) -->
    <AdminOrderModalConsolidate
      :show="showConsolidate"
      :order="consolidateOrder"
      :default-ship-date="consolidateDate"
      @close="showConsolidate = false"
      @success="onConsolidated"
    />

    <!-- Reschedule confirmation (drag a card to a new day) -->
    <div v-if="showReschedule" class="fixed inset-0 z-[60] flex items-center justify-center p-4" @click.self="cancelReschedule">
      <div class="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" @click="cancelReschedule"></div>
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5">
        <h2 class="text-base font-bold text-gray-900">{{ t.rescheduleTitle }}</h2>
        <p class="text-sm text-gray-500 mt-0.5 truncate">{{ pendingCard?.customer_name }}</p>

        <div class="mt-4 rounded-xl bg-primary-50/60 border border-primary-100 px-4 py-3 flex items-center justify-between gap-3">
          <span class="text-[11px] font-bold uppercase tracking-wider text-primary-700">{{ t.rescheduleTo }}</span>
          <span class="text-sm font-semibold text-primary-800 capitalize">{{ niceDate(pendingDate) }}</span>
        </div>

        <label class="mt-4 flex items-center gap-2.5 cursor-pointer select-none">
          <input type="checkbox" v-model="notifyCustomer" class="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
          <span class="text-sm text-gray-700">{{ t.notifyCustomer }}</span>
        </label>

        <div class="mt-5 flex gap-2.5">
          <button @click="cancelReschedule" class="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">{{ t.cancel }}</button>
          <button @click="confirmReschedule" class="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors">{{ t.confirm }}</button>
        </div>
      </div>
    </div>

    <!-- Warehouse list modal -->
    <div v-if="showWarehouse" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="showWarehouse = false">
      <div class="fixed inset-0 bg-gray-900/40 backdrop-blur-sm"></div>
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col">
        <div class="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <h2 class="text-base font-bold text-gray-900">{{ t.warehouseTitle }}</h2>
          <div class="flex items-center gap-1.5">
            <button @click="copyWarehouse" class="px-3 py-1.5 text-[13px] font-medium rounded-lg transition-colors" :class="copied ? 'bg-green-50 text-green-700' : 'text-gray-600 bg-gray-100 hover:bg-gray-200'">{{ copied ? t.copied : t.copy }}</button>
            <button @click="showWarehouse = false" class="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"><svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>
          </div>
        </div>
        <div class="px-5 py-4 overflow-y-auto">
          <pre class="text-[13px] text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">{{ warehouseText }}</pre>
        </div>
      </div>
    </div>

    <!-- Quick-create order shell -->
    <div v-if="showCreate" class="fixed inset-0 z-[60] flex items-center justify-center p-4" @click.self="closeCreate">
      <div class="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" @click="closeCreate"></div>
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5">
        <h2 class="text-base font-bold text-gray-900">{{ t.newOrderTitle }}</h2>
        <p class="text-sm text-gray-500 mt-0.5">{{ t.newOrderSubtitle }}</p>

        <!-- Order type -->
        <div class="mt-4 grid grid-cols-2 gap-2">
          <button type="button" @click="createType = 'shipping'"
            :class="['px-3 py-2 text-sm font-semibold rounded-xl border transition-colors', createType === 'shipping' ? 'bg-blue-50 border-blue-300 text-blue-800' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50']">
            {{ t.shipping }}
          </button>
          <button type="button" @click="createType = 'crossing'"
            :class="['px-3 py-2 text-sm font-semibold rounded-xl border transition-colors', createType === 'crossing' ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50']">
            {{ t.crossing }}
          </button>
        </div>

        <!-- Customer -->
        <div class="mt-4">
          <label class="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">{{ t.customer }}</label>
          <AdminCustomerSearch v-model="createSearch" endpoint="/admin/customers" :placeholder="t.searchPlaceholder" @select="onSelectCustomer" />

          <div v-if="createCustomer" class="mt-3">
            <!-- Crossing: no delivery address needed -->
            <p v-if="createType === 'crossing'" class="text-xs text-gray-500">{{ createCustomer.email }}</p>

            <!-- Shipping with a saved address: let the admin choose to use it -->
            <div v-else-if="createHasAddress" class="rounded-xl border border-gray-200 bg-gray-50/60 p-3">
              <label class="flex items-start gap-2.5 cursor-pointer select-none">
                <input type="checkbox" v-model="useSavedAddress" class="mt-0.5 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                <span class="min-w-0">
                  <span class="block text-xs font-semibold text-gray-700">{{ t.useSavedAddress }}</span>
                  <span class="block text-xs text-gray-500 mt-0.5 break-words">{{ savedAddressText }}</span>
                </span>
              </label>
              <p v-if="!useSavedAddress" class="text-xs text-amber-600 mt-2">{{ t.noAddressNote }}</p>
            </div>

            <!-- Shipping, no saved address: just stub it -->
            <p v-else class="text-xs text-amber-600">{{ t.noAddressNote }}</p>
          </div>
        </div>

        <div class="mt-5 flex gap-2.5">
          <button @click="closeCreate" class="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">{{ t.cancel }}</button>
          <button @click="createShell" :disabled="!createCustomer || creatingShell"
            class="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-gray-900 rounded-xl hover:bg-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            {{ creatingShell ? '…' : t.create }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import draggable from 'vuedraggable'
import OpsCard from '~/components/admin/OpsCard.vue'
import OpsOrderModal from '~/components/admin/OpsOrderModal.vue'

definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] })

const { $customFetch, $toast } = useNuxtApp()
const { t: createTranslations, language } = useLanguage()

const translations = {
  title: { es: 'Tablero de Operaciones', en: 'Operations Board' },
  subtitle: { es: 'Una pantalla. La verdad de toda la semana.', en: 'One screen. The truth for the whole week.' },
  searchCards: { es: 'Buscar por nombre o teléfono…', en: 'Search by name or phone…' },
  prevWeek: { es: 'Días anteriores', en: 'Previous days' },
  nextWeek: { es: 'Días siguientes', en: 'Next days' },
  thisWeek: { es: 'Hoy', en: 'Today' },
  generateList: { es: 'Lista de Almacén', en: 'Warehouse List' },
  backlog: { es: 'Falta Fecha', en: 'Needs Date' },
  inProgress: { es: 'En Proceso', en: 'In Progress' },
  inProgressHint: { es: 'Solo lectura · cajas en preparación', en: 'Read-only · boxes in preparation' },
  empty: { es: 'Nada por aquí', en: 'Nothing here' },
  warehouseTitle: { es: 'Lista de Almacén', en: 'Warehouse List' },
  copy: { es: 'Copiar', en: 'Copy' },
  copied: { es: '¡Copiado!', en: 'Copied!' },
  readyToShip: { es: 'LISTO PARA ENVIAR', en: 'READY TO SHIP' },
  activeBoxes: { es: 'CAJAS ACTIVAS', en: 'ACTIVE BOXES' },
  needsShipDate: { es: 'FALTA FECHA', en: 'NEEDS SHIP DATE' },
  rescheduled: { es: 'Fecha de envío actualizada', en: 'Ship date updated' },
  unscheduled: { es: 'Fecha de envío quitada', en: 'Ship date removed' },
  rescheduleTitle: { es: '¿Cambiar fecha de envío?', en: 'Change ship date?' },
  rescheduleTo: { es: 'Nueva fecha', en: 'New date' },
  notifyCustomer: { es: 'Notificar al cliente por correo', en: 'Email the customer about the change' },
  confirm: { es: 'Confirmar', en: 'Confirm' },
  cancel: { es: 'Cancelar', en: 'Cancel' },
  error: { es: 'Algo salió mal', en: 'Something went wrong' },
  // Quick-create order shell
  newOrder: { es: 'Nueva Orden', en: 'New Order' },
  newOrderTitle: { es: 'Crear orden', en: 'Create order' },
  newOrderSubtitle: { es: 'Genera el shell de una orden para un cliente.', en: 'Stub an order for a customer.' },
  shipping: { es: 'Envío', en: 'Shipping' },
  crossing: { es: 'Cruce', en: 'Crossing' },
  customer: { es: 'Cliente', en: 'Customer' },
  searchPlaceholder: { es: 'Buscar por nombre, email o teléfono…', en: 'Search by name, email or phone…' },
  useSavedAddress: { es: 'Usar dirección guardada', en: 'Use saved address' },
  noAddressNote: { es: 'Sin dirección — se añade después', en: 'No address — added later' },
  create: { es: 'Crear', en: 'Create' },
  orderCreated: { es: 'Orden creada', en: 'Order created' },
}
const t = createTranslations(translations)
const lang = computed(() => (language.value === 'en' ? 'en' : 'es'))

const badgeMeta = {
  ready_to_ship: { es: 'Listo para Enviar', en: 'Ready to Ship', hex: '#3b82f6' },
  needs_ship_date: { es: 'Falta Fecha', en: 'Needs Date', hex: '#f59e0b' },
  active_box: { es: 'Caja Activa', en: 'Active Box', hex: '#22c55e' },
  inventory_expected: { es: 'Esperando Inventario', en: 'Inventory Expected', hex: '#eab308' },
  collecting: { es: 'Recolectando', en: 'Collecting', hex: '#9ca3af' },
}
// Badges now shown on the board: the backlog holds every order still needing a
// ship date (collecting → inventory expected → active box → needs date), plus
// ready-to-ship cards land on their weekday column.
const legendKeys = ['collecting', 'inventory_expected', 'active_box', 'needs_ship_date', 'ready_to_ship']

const loading = ref(true)
const startDate = ref('') // first working day shown
const backlog = ref([])
const daysMap = ref({})
const inProgress = ref([])

// --- search (client-side filter by customer name / phone) ---
const searchTerm = ref('')
const isSearching = computed(() => !!searchTerm.value.trim())
const digitsOnly = (s) => (s ?? '').toString().replace(/\D/g, '')
const cardMatches = (card) => {
  const q = searchTerm.value.trim().toLowerCase()
  if (!q) return true
  if ((card.customer_name || '').toLowerCase().includes(q)) return true
  const qDigits = digitsOnly(q)
  if (qDigits && digitsOnly(card.customer_phone).includes(qDigits)) return true
  // bonus matches so a card is also findable by what's printed on it
  if ((card.customer_email || '').toLowerCase().includes(q)) return true
  if ((card.order_number || '').toLowerCase().includes(q)) return true
  if ((card.tracking_number || '').toLowerCase().includes(q)) return true
  return false
}
// While searching, render filtered copies (drag is disabled, so they're never
// mutated). With no search, return the real arrays so drag still mutates source.
const displayBacklog = computed(() => isSearching.value ? backlog.value.filter(cardMatches) : backlog.value)
const displayDays = (date) => {
  const list = daysMap.value[date] || (daysMap.value[date] = [])
  return isSearching.value ? list.filter(cardMatches) : list
}

// --- date helpers (local-time safe) ---
const z = (n) => String(n).padStart(2, '0')
const ymd = (d) => `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`
const parseYmd = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }
const addDays = (s, n) => { const d = parseYmd(s); d.setDate(d.getDate() + n); return ymd(d) }
const isWeekend = (s) => { const d = parseYmd(s).getDay(); return d === 0 || d === 6 }
const firstWorkingFrom = (s) => { let x = s; while (isWeekend(x)) x = addDays(x, 1); return x }
// the next `n` working days (Mon–Fri), starting at/after `start`
const workingDays = (start, n) => { const out = []; let x = firstWorkingFrom(start); while (out.length < n) { if (!isWeekend(x)) out.push(x); x = addDays(x, 1) } return out }
// step back `n` working days before `start`
const backWorkingDays = (start, n) => { let x = start, c = 0; while (c < n) { x = addDays(x, -1); if (!isWeekend(x)) c++ } return x }

const dayNamesEs = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']
const dayNamesEn = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const monthsEs = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const todayStr = ymd(new Date())

const dayCols = computed(() => {
  if (!startDate.value) return []
  return workingDays(startDate.value, 5).map((date) => {
    const d = parseYmd(date)
    return {
      date,
      label: (lang.value === 'en' ? dayNamesEn : dayNamesEs)[d.getDay() - 1],
      dayNum: `${d.getDate()} ${monthsEs[d.getMonth()]}`,
      isToday: date === todayStr,
    }
  })
})

const rangeLabel = computed(() => {
  const cols = dayCols.value
  if (!cols.length) return ''
  const a = parseYmd(cols[0].date)
  const b = parseYmd(cols[cols.length - 1].date)
  return a.getMonth() === b.getMonth()
    ? `${a.getDate()} – ${b.getDate()} ${monthsEs[b.getMonth()]}`
    : `${a.getDate()} ${monthsEs[a.getMonth()]} – ${b.getDate()} ${monthsEs[b.getMonth()]}`
})

const fetchBoard = async () => {
  loading.value = true
  try {
    const cols = workingDays(startDate.value, 5)
    const res = await $customFetch('/admin/operations-board', {
      params: { start_date: cols[0], end_date: cols[cols.length - 1] },
    })
    backlog.value = res.needs_ship_date || []
    inProgress.value = res.in_progress || []
    const map = {}
    cols.forEach((d) => { map[d] = [] })
    Object.entries(res.days || {}).forEach(([date, cards]) => { map[date] = cards })
    daysMap.value = map
  } catch (e) {
    console.error(e)
    $toast?.error(t.value.error)
  } finally {
    loading.value = false
  }
}

const shiftWindow = (dir) => {
  if (dir > 0) {
    const cols = workingDays(startDate.value, 5)
    startDate.value = firstWorkingFrom(addDays(cols[cols.length - 1], 1))
  } else {
    startDate.value = backWorkingDays(startDate.value, 5)
  }
  fetchBoard()
}
const goToday = () => { startDate.value = firstWorkingFrom(todayStr); fetchBoard() }

// --- drag handling ---
const onChange = async (evt, date) => {
  if (!evt.added) return
  const card = evt.added.element

  if (date) {
    if (card.consolidated) {
      // Confirm + email choice before persisting (the card has already moved visually)
      pendingCard.value = card
      pendingDate.value = date
      notifyCustomer.value = true
      showReschedule.value = true
    } else {
      consolidateOrder.value = { id: card.id, order_number: card.order_number, user: { name: card.customer_name, email: card.customer_email } }
      consolidateDate.value = date
      showConsolidate.value = true
      await fetchBoard()
    }
    return
  }

  if (card.consolidated) {
    await setShipDate(card.id, null, t.value.unscheduled, false)
  } else {
    await fetchBoard()
  }
}

const setShipDate = async (orderId, date, successMsg, notify = true) => {
  try {
    await $customFetch(`/admin/orders/${orderId}/ship-date`, {
      method: 'POST',
      body: { planned_ship_date: date, notify },
    })
    $toast?.success(successMsg)
  } catch (e) {
    $toast?.error(e.data?.message || t.value.error)
  } finally {
    await fetchBoard()
  }
}

const niceDate = (s) => {
  if (!s) return ''
  const d = parseYmd(s)
  const wd = (lang.value === 'en' ? dayNamesEn : dayNamesEs)[d.getDay() - 1] || ''
  return `${wd} ${d.getDate()} ${monthsEs[d.getMonth()]}`
}

// --- reschedule confirmation ---
const showReschedule = ref(false)
const pendingCard = ref(null)
const pendingDate = ref('')
const notifyCustomer = ref(true)
const confirmReschedule = async () => {
  const card = pendingCard.value
  const date = pendingDate.value
  showReschedule.value = false
  await setShipDate(card.id, date, t.value.rescheduled, notifyCustomer.value)
}
const cancelReschedule = async () => {
  showReschedule.value = false
  await fetchBoard() // revert the optimistic move
}

// --- order detail / quick-edit modal ---
const showDetail = ref(false)
const detailCard = ref(null)
const openDetail = (card) => { detailCard.value = card; showDetail.value = true }

// --- consolidate modal ---
const showConsolidate = ref(false)
const consolidateOrder = ref(null)
const consolidateDate = ref('')
const onConsolidated = async () => { showConsolidate.value = false; await fetchBoard() }
const onConsolidateFromDetail = (card) => {
  showDetail.value = false
  consolidateOrder.value = { id: card.id, order_number: card.order_number, user: { name: card.customer_name, email: card.customer_email } }
  consolidateDate.value = ''
  showConsolidate.value = true
}

// --- warehouse list ---
const showWarehouse = ref(false)
const warehouseText = ref('')
const copied = ref(false)

const openWarehouseList = async () => {
  try {
    const res = await $customFetch('/admin/operations-board/warehouse-list')
    warehouseText.value = buildWarehouseText(res)
    copied.value = false
    showWarehouse.value = true
  } catch (e) {
    $toast?.error(t.value.error)
  }
}

const buildWarehouseText = (res) => {
  const line = (e) => `  • ${e.customer_name || '—'}${e.box_summary ? '  (' + e.box_summary + ')' : ''}${e.planned_ship_date ? '  → ' + e.planned_ship_date : ''}`
  const section = (title, arr) => `${title}  (${arr.length})\n${arr.length ? arr.map(line).join('\n') : '  —'}`
  return [
    section(t.value.readyToShip, res.ready_to_ship || []),
    section(t.value.activeBoxes, res.active_boxes || []),
    section(t.value.needsShipDate, res.needs_ship_date || []),
  ].join('\n\n')
}

const copyWarehouse = async () => {
  try { await navigator.clipboard.writeText(warehouseText.value); copied.value = true; setTimeout(() => (copied.value = false), 1500) } catch (e) {}
}

// --- quick-create order shell ---
const showCreate = ref(false)
const createType = ref('shipping')
const createSearch = ref('')
const createCustomer = ref(null)
const creatingShell = ref(false)
const useSavedAddress = ref(true)

// The customer's saved address as a single line (empty string if none on file).
const savedAddressText = computed(() => {
  const c = createCustomer.value
  if (!c) return ''
  return c.full_address
    || [c.street, c.exterior_number, c.colonia, c.municipio, c.estado, c.postal_code].filter(Boolean).join(', ')
})
const createHasAddress = computed(() => !!savedAddressText.value)

const openCreate = () => {
  createType.value = 'shipping'
  createSearch.value = ''
  createCustomer.value = null
  useSavedAddress.value = true
  showCreate.value = true
}
const closeCreate = () => { showCreate.value = false }
const onSelectCustomer = (c) => { createCustomer.value = c; useSavedAddress.value = true }

const createShell = async () => {
  if (!createCustomer.value || creatingShell.value) return
  creatingShell.value = true
  try {
    const c = createCustomer.value
    const body = { user_id: c.id, status: 'collecting', order_type: createType.value, shell: true }
    // Use the saved address only when shipping, one exists, and the admin opted in.
    if (createType.value === 'shipping' && useSavedAddress.value && savedAddressText.value) {
      body.delivery_address = { full_address: savedAddressText.value }
    }
    await $customFetch('/admin/management/orders', { method: 'POST', body })
    $toast?.success(t.value.orderCreated)
    showCreate.value = false
    await fetchBoard()
  } catch (e) {
    $toast?.error(e.data?.message || t.value.error)
  } finally {
    creatingShell.value = false
  }
}

onMounted(() => { startDate.value = firstWorkingFrom(todayStr); fetchBoard() })
</script>

<style scoped>
/* Drag ghost: a soft dashed placeholder instead of a hard copy */
.ops-ghost {
  opacity: 0.5;
}
.ops-ghost > * {
  border-style: dashed;
}
</style>
