<!-- pages/app/admin/war-chest/[id].vue — account checkbook / ledger -->
<template>
  <section class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20">
    <!-- Header -->
    <div class="bg-white/90 backdrop-blur-sm shadow-sm border-b border-gray-100">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <NuxtLink to="/app/admin/war-chest" class="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
              <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
              </svg>
            </NuxtLink>
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <h1 class="text-xl sm:text-2xl font-extrabold text-gray-900 truncate">{{ account?.name || '…' }}</h1>
                <span v-if="account?.payment_method" class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary-50 text-primary-700">{{ account.payment_method }}</span>
              </div>
              <p v-if="account" class="text-xs sm:text-sm text-gray-600 mt-0.5">{{ t.balance }}: <span class="font-bold text-gray-900">${{ formatMoney(account.current_balance) }}</span></p>
            </div>
          </div>
          <button
            @click="openAdd"
            class="inline-flex items-center px-3 sm:px-4 py-2.5 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 shadow-sm transition-all flex-shrink-0"
          >
            <svg class="w-5 h-5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            <span class="hidden sm:inline">{{ t.addEntry }}</span>
          </button>
        </div>
      </div>
    </div>

    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <!-- Month filter -->
      <div class="flex items-center gap-3 mb-5">
        <select v-model="monthFilter" class="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option value="">{{ t.allTime }}</option>
          <option v-for="m in months" :key="m.value" :value="m.value">{{ m.label }}</option>
        </select>
      </div>

      <!-- Summary: in / out / net -->
      <div class="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
          <p class="text-[11px] font-semibold text-emerald-600 uppercase tracking-wide">{{ t.moneyIn }}</p>
          <p class="text-lg sm:text-2xl font-bold text-emerald-600 mt-1">+${{ formatMoney(summary.in) }}</p>
        </div>
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
          <p class="text-[11px] font-semibold text-rose-600 uppercase tracking-wide">{{ t.moneyOut }}</p>
          <p class="text-lg sm:text-2xl font-bold text-rose-600 mt-1">−${{ formatMoney(summary.out) }}</p>
        </div>
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
          <p class="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{{ t.net }}</p>
          <p class="text-lg sm:text-2xl font-bold mt-1" :class="summary.net >= 0 ? 'text-gray-900' : 'text-rose-600'">
            {{ summary.net >= 0 ? '+' : '−' }}${{ formatMoney(Math.abs(summary.net)) }}
          </p>
        </div>
      </div>

      <!-- Ledger -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div v-if="loading" class="py-16 text-center">
          <svg class="animate-spin h-8 w-8 text-primary-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
        </div>

        <div v-else-if="transactions.length === 0" class="py-16 text-center">
          <p class="text-sm text-gray-500">{{ t.noEntries }}</p>
        </div>

        <div v-else class="divide-y divide-gray-100">
          <div v-for="tx in transactions" :key="tx.id" class="flex items-center gap-3 px-4 sm:px-6 py-3.5 hover:bg-gray-50/60 transition-colors">
            <div class="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" :class="tx.direction === 'in' ? 'bg-emerald-50' : 'bg-rose-50'">
              <svg class="w-4 h-4" :class="tx.direction === 'in' ? 'text-emerald-600' : 'text-rose-600'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path v-if="tx.direction === 'in'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19V5m0 0l-7 7m7-7l7 7"/>
                <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v14m0 0l7-7m-7 7l-7-7"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <p class="text-sm font-medium text-gray-900 truncate">{{ tx.description || sourceLabel(tx.source_type) }}</p>
                <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold flex-shrink-0" :class="sourceBadge(tx.source_type)">{{ sourceLabel(tx.source_type) }}</span>
              </div>
              <p class="text-xs text-gray-500 mt-0.5">{{ formatDate(tx.occurred_at) }}</p>
            </div>
            <div class="text-right flex-shrink-0">
              <p class="text-sm font-bold" :class="tx.direction === 'in' ? 'text-emerald-600' : 'text-rose-600'">
                {{ tx.direction === 'in' ? '+' : '−' }}${{ formatMoney(tx.amount) }}
              </p>
              <p v-if="tx.balance_after !== null" class="text-[11px] text-gray-400 mt-0.5">${{ formatMoney(tx.balance_after) }}</p>
            </div>
            <button
              v-if="canDelete(tx)"
              @click="deleteTx(tx)"
              class="p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
              :title="t.delete"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="!loading && pagination.lastPage > 1" class="px-4 sm:px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <p class="text-sm text-gray-600">{{ pagination.from }}-{{ pagination.to }} / {{ pagination.total }}</p>
          <div class="flex gap-2">
            <button @click="load(pagination.currentPage - 1)" :disabled="pagination.currentPage === 1" class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">{{ t.previous }}</button>
            <button @click="load(pagination.currentPage + 1)" :disabled="pagination.currentPage === pagination.lastPage" class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">{{ t.next }}</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add manual entry modal -->
    <Teleport to="body">
      <div v-if="showAdd" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click.self="showAdd = false">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
          <h2 class="text-lg font-bold text-gray-900 mb-4">{{ t.addEntry }}</h2>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-2">
              <button type="button" @click="addForm.direction = 'in'" :class="['px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors', addForm.direction === 'in' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50']">{{ t.moneyIn }}</button>
              <button type="button" @click="addForm.direction = 'out'" :class="['px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors', addForm.direction === 'out' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50']">{{ t.moneyOut }}</button>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">{{ t.amount }}</label>
              <input v-model="addForm.amount" type="number" step="0.01" min="0.01" class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">{{ t.date }}</label>
              <input v-model="addForm.occurred_at" type="date" :max="today" class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">{{ t.description }}</label>
              <input v-model="addForm.description" type="text" :placeholder="t.descriptionPlaceholder" class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            </div>
          </div>
          <div class="flex justify-end gap-3 mt-6">
            <button @click="showAdd = false" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">{{ t.cancel }}</button>
            <button @click="saveEntry" :disabled="saving || !(addForm.amount > 0)" class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">{{ t.save }}</button>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin']
})

const route = useRoute()
const { $customFetch, $toast } = useNuxtApp()
const user = useUser().value
const { t: createTranslations } = useLanguage()

const id = route.params.id
const loading = ref(true)
const saving = ref(false)
const account = ref(null)
const transactions = ref([])
const summary = ref({ in: 0, out: 0, net: 0 })
const monthFilter = ref('')
const pagination = ref({ currentPage: 1, lastPage: 1, from: 0, to: 0, total: 0 })
const showAdd = ref(false)
const addForm = ref({ direction: 'in', amount: '', occurred_at: new Date().toISOString().split('T')[0], description: '' })

const today = computed(() => new Date().toISOString().split('T')[0])

const currentYear = new Date().getFullYear()
const months = computed(() => {
  const out = []
  for (let i = 1; i <= 12; i++) {
    const d = new Date(currentYear, i - 1)
    out.push({
      value: `${currentYear}-${String(i).padStart(2, '0')}`,
      label: d.toLocaleDateString(user?.preferred_language === 'es' ? 'es-MX' : 'en-US', { month: 'long', year: 'numeric' }),
    })
  }
  return out.reverse()
})

const load = async (page = 1) => {
  loading.value = true
  try {
    const params = { page, per_page: 50 }
    if (monthFilter.value) {
      const [y, m] = monthFilter.value.split('-')
      params.year = y
      params.month = m
    }
    const res = await $customFetch(`/admin/war-chest/${id}/transactions`, { params })
    account.value = res.account
    transactions.value = res.data.data
    summary.value = res.summary
    pagination.value = {
      currentPage: res.data.current_page,
      lastPage: res.data.last_page,
      from: res.data.from,
      to: res.data.to,
      total: res.data.total,
    }
  } catch (e) {
    $toast.error(t.value.loadError)
  } finally {
    loading.value = false
  }
}

const openAdd = () => {
  addForm.value = { direction: 'in', amount: '', occurred_at: today.value, description: '' }
  showAdd.value = true
}

const saveEntry = async () => {
  saving.value = true
  try {
    await $customFetch(`/admin/war-chest/${id}/transactions`, {
      method: 'POST',
      body: {
        direction: addForm.value.direction,
        amount: parseFloat(addForm.value.amount),
        occurred_at: addForm.value.occurred_at,
        description: addForm.value.description || null,
      },
    })
    showAdd.value = false
    $toast.success(t.value.saved)
    await load(1)
  } catch (e) {
    $toast.error(e.data?.message || t.value.saveError)
  } finally {
    saving.value = false
  }
}

// Only entries not tied to an order/expense can be removed here.
const canDelete = (tx) => ['manual', 'adjustment', 'opening'].includes(tx.source_type)

const deleteTx = async (tx) => {
  try {
    await $customFetch(`/admin/war-chest/${id}/transactions/${tx.id}`, { method: 'DELETE' })
    $toast.success(t.value.deleted)
    await load(pagination.value.currentPage)
  } catch (e) {
    $toast.error(e.data?.message || t.value.saveError)
  }
}

const formatMoney = (a) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(parseFloat(a || 0))
const formatDate = (date) => {
  const d = new Date(date)
  return d.toLocaleDateString(user?.preferred_language === 'es' ? 'es-MX' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const sourceLabel = (s) => t.value['src_' + s] || s
const sourceBadge = (s) => ({
  order: 'bg-emerald-50 text-emerald-700',
  expense: 'bg-rose-50 text-rose-700',
  manual: 'bg-gray-100 text-gray-600',
  adjustment: 'bg-amber-50 text-amber-700',
  opening: 'bg-blue-50 text-blue-700',
}[s] || 'bg-gray-100 text-gray-600')

const translations = {
  balance: { es: 'Saldo', en: 'Balance' },
  addEntry: { es: 'Agregar Movimiento', en: 'Add Entry' },
  allTime: { es: 'Todo el tiempo', en: 'All time' },
  moneyIn: { es: 'Entradas', en: 'Money In' },
  moneyOut: { es: 'Salidas', en: 'Money Out' },
  net: { es: 'Neto', en: 'Net' },
  noEntries: { es: 'Sin movimientos en este periodo.', en: 'No entries in this period.' },
  amount: { es: 'Monto', en: 'Amount' },
  date: { es: 'Fecha', en: 'Date' },
  description: { es: 'Descripción', en: 'Description' },
  descriptionPlaceholder: { es: 'Ej. Depósito en efectivo', en: 'e.g. Cash deposit' },
  cancel: { es: 'Cancelar', en: 'Cancel' },
  save: { es: 'Guardar', en: 'Save' },
  saved: { es: 'Guardado', en: 'Saved' },
  deleted: { es: 'Movimiento eliminado', en: 'Entry deleted' },
  delete: { es: 'Eliminar', en: 'Delete' },
  previous: { es: 'Anterior', en: 'Previous' },
  next: { es: 'Siguiente', en: 'Next' },
  loadError: { es: 'Error al cargar', en: 'Error loading' },
  saveError: { es: 'Error al guardar', en: 'Error saving' },
  src_order: { es: 'Orden', en: 'Order' },
  src_expense: { es: 'Gasto', en: 'Expense' },
  src_manual: { es: 'Manual', en: 'Manual' },
  src_adjustment: { es: 'Ajuste', en: 'Adjustment' },
  src_opening: { es: 'Inicial', en: 'Opening' },
}
const t = createTranslations(translations)

watch(monthFilter, () => load(1))
onMounted(() => load(1))
</script>
