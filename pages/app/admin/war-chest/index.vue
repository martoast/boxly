<!-- pages/app/admin/war-chest/index.vue -->
<template>
  <section class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20">
    <!-- Header -->
    <div class="bg-white/90 backdrop-blur-sm shadow-sm border-b border-gray-100">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <NuxtLink to="/app/admin/dashboard" class="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
              <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
              </svg>
            </NuxtLink>
            <div>
              <h1 class="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900">🛡️ {{ t.title }}</h1>
              <p class="text-xs sm:text-sm text-gray-600 mt-0.5">{{ t.subtitle }}</p>
            </div>
          </div>
          <button
            @click="openCreate"
            class="inline-flex items-center px-3 sm:px-4 py-2.5 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 shadow-sm transition-all"
          >
            <svg class="w-5 h-5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            <span class="hidden sm:inline">{{ t.addAccount }}</span>
          </button>
        </div>
      </div>
    </div>

    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <!-- Loading -->
      <div v-if="loading" class="py-16 text-center">
        <svg class="animate-spin h-8 w-8 text-primary-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
      </div>

      <template v-else>
        <!-- Account cards -->
        <div class="space-y-4">
          <div
            v-for="account in accounts"
            :key="account.id"
            class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6"
          >
            <div class="flex items-start justify-between gap-3 mb-4">
              <NuxtLink :to="`/app/admin/war-chest/${account.id}`" class="flex items-center gap-2 min-w-0 group">
                <h3 class="text-lg font-bold text-gray-900 truncate group-hover:text-primary-600 transition-colors">{{ account.name }}</h3>
                <span v-if="account.payment_method" class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary-50 text-primary-700 flex-shrink-0">
                  {{ account.payment_method }}
                </span>
                <svg class="w-4 h-4 text-gray-300 group-hover:text-primary-500 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
              </NuxtLink>
              <div class="flex items-center gap-1 flex-shrink-0">
                <button @click="openEdit(account)" class="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" :title="t.edit">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                </button>
                <button @click="confirmDelete(account)" class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" :title="t.delete">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            </div>

            <!-- Editable balance / target -->
            <div class="flex items-end justify-between gap-4 mb-2">
              <label class="flex-1">
                <span class="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{{ t.balance }}</span>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input
                    type="number" step="0.01" min="0"
                    :value="account.current_balance"
                    @change="(e) => saveField(account, 'current_balance', e.target.value)"
                    class="w-full pl-7 pr-3 py-2 rounded-lg border border-gray-200 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                </div>
              </label>
              <span class="text-gray-300 text-lg pb-2">/</span>
              <label class="flex-1">
                <span class="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{{ t.goal }}</span>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input
                    type="number" step="0.01" min="0"
                    :value="account.target_amount"
                    @change="(e) => saveField(account, 'target_amount', e.target.value)"
                    class="w-full pl-7 pr-3 py-2 rounded-lg border border-gray-200 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                </div>
              </label>
            </div>

            <!-- Progress bar -->
            <div class="flex items-center gap-3">
              <div class="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all duration-500" :class="barColor(pct(account))" :style="{ width: pct(account) + '%' }"></div>
              </div>
              <span class="text-sm font-bold text-gray-700 w-12 text-right">{{ pct(account) }}%</span>
            </div>
          </div>
        </div>

        <!-- Overall progress -->
        <div class="mt-6 bg-gray-900 rounded-2xl shadow-sm p-6 text-white">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-base font-bold">{{ t.overall }}</h3>
            <span class="text-sm font-semibold text-white/80">
              ${{ formatMoney(overallBalance) }} / ${{ formatMoney(overallTarget) }}
            </span>
          </div>
          <div class="flex items-center gap-3">
            <div class="flex-1 h-3 bg-white/15 rounded-full overflow-hidden">
              <div class="h-full bg-primary-400 rounded-full transition-all duration-500" :style="{ width: overallPct + '%' }"></div>
            </div>
            <span class="text-sm font-bold w-12 text-right">{{ overallPct }}%</span>
          </div>
          <p class="text-xs text-white/50 mt-3">{{ t.overallNote }}</p>
        </div>
      </template>
    </div>

    <!-- Create/Edit account modal -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click.self="showModal = false">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
          <h2 class="text-lg font-bold text-gray-900 mb-4">{{ editing ? t.editAccount : t.addAccount }}</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">{{ t.name }}</label>
              <input v-model="modalForm.name" type="text" class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">{{ t.routingMethod }}</label>
              <div class="flex flex-wrap gap-2">
                <button
                  type="button" @click="modalForm.payment_method = ''"
                  :class="['px-3 py-2 rounded-xl text-sm font-medium border transition-colors', !modalForm.payment_method ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50']"
                >{{ t.methodNone }}</button>
                <button
                  v-for="pm in paymentMethods" :key="pm" type="button" @click="modalForm.payment_method = pm"
                  :class="['px-3 py-2 rounded-xl text-sm font-medium border transition-colors', modalForm.payment_method === pm ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50']"
                >{{ pm }}</button>
              </div>
              <p class="text-xs text-gray-500 mt-1.5">{{ t.routingHint }}</p>
            </div>
            <div v-if="!editing" class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">{{ t.balance }}</label>
                <input v-model="modalForm.current_balance" type="number" step="0.01" min="0" class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">{{ t.goal }}</label>
                <input v-model="modalForm.target_amount" type="number" step="0.01" min="0" class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              </div>
            </div>
          </div>
          <div class="flex justify-end gap-3 mt-6">
            <button @click="showModal = false" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">{{ t.cancel }}</button>
            <button @click="saveModal" :disabled="saving || !modalForm.name" class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {{ t.save }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <ConfirmModal
      v-if="showDeleteModal"
      :title="t.deleteAccountTitle"
      :message="t.deleteAccountMessage"
      :confirmText="t.deleteConfirm"
      :cancelText="t.cancel"
      @confirm="deleteAccount"
      @cancel="showDeleteModal = false"
    />
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ConfirmModal from '~/components/admin/ConfirmModal.vue'

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin']
})

const { $customFetch, $toast } = useNuxtApp()
const { t: createTranslations } = useLanguage()

const paymentMethods = ['NU', 'HSBC', 'Stripe']

const loading = ref(true)
const saving = ref(false)
const accounts = ref([])
const showModal = ref(false)
const editing = ref(null)
const modalForm = ref({ name: '', payment_method: '', current_balance: 0, target_amount: 0 })
const showDeleteModal = ref(false)
const accountToDelete = ref(null)

const overallBalance = computed(() => accounts.value.reduce((s, a) => s + parseFloat(a.current_balance || 0), 0))
const overallTarget = computed(() => accounts.value.reduce((s, a) => s + parseFloat(a.target_amount || 0), 0))
const overallPct = computed(() => pctOf(overallBalance.value, overallTarget.value))

const pctOf = (bal, tgt) => {
  const t = parseFloat(tgt || 0)
  if (t <= 0) return 0
  return Math.min(100, Math.round((parseFloat(bal || 0) / t) * 100))
}
const pct = (account) => pctOf(account.current_balance, account.target_amount)

const barColor = (p) => {
  if (p >= 100) return 'bg-emerald-500'
  if (p >= 50) return 'bg-primary-500'
  if (p >= 25) return 'bg-amber-500'
  return 'bg-rose-500'
}

const formatMoney = (amount) =>
  new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(parseFloat(amount || 0))

const fetchAccounts = async () => {
  loading.value = true
  try {
    const res = await $customFetch('/admin/war-chest')
    accounts.value = res.data || []
  } catch (e) {
    $toast.error(t.value.loadError)
  } finally {
    loading.value = false
  }
}

// Inline-save a single field (balance or goal) on blur/enter.
const saveField = async (account, field, value) => {
  const num = parseFloat(value)
  if (isNaN(num) || num < 0) return
  const prev = account[field]
  account[field] = num
  try {
    await $customFetch(`/admin/war-chest/${account.id}`, { method: 'PUT', body: { [field]: num } })
  } catch (e) {
    account[field] = prev
    $toast.error(t.value.saveError)
  }
}

const openCreate = () => {
  editing.value = null
  modalForm.value = { name: '', payment_method: '', current_balance: 0, target_amount: 0 }
  showModal.value = true
}

const openEdit = (account) => {
  editing.value = account
  modalForm.value = { name: account.name, payment_method: account.payment_method || '' }
  showModal.value = true
}

const saveModal = async () => {
  saving.value = true
  try {
    if (editing.value) {
      const body = { name: modalForm.value.name, payment_method: modalForm.value.payment_method || null }
      const res = await $customFetch(`/admin/war-chest/${editing.value.id}`, { method: 'PUT', body })
      const idx = accounts.value.findIndex((a) => a.id === editing.value.id)
      if (idx !== -1) accounts.value[idx] = res.data
    } else {
      const body = {
        name: modalForm.value.name,
        payment_method: modalForm.value.payment_method || null,
        current_balance: parseFloat(modalForm.value.current_balance || 0),
        target_amount: parseFloat(modalForm.value.target_amount || 0),
      }
      await $customFetch('/admin/war-chest', { method: 'POST', body })
      await fetchAccounts()
    }
    showModal.value = false
    $toast.success(t.value.saved)
  } catch (e) {
    $toast.error(e.data?.message || t.value.saveError)
  } finally {
    saving.value = false
  }
}

const confirmDelete = (account) => {
  accountToDelete.value = account
  showDeleteModal.value = true
}

const deleteAccount = async () => {
  if (!accountToDelete.value) return
  try {
    await $customFetch(`/admin/war-chest/${accountToDelete.value.id}`, { method: 'DELETE' })
    accounts.value = accounts.value.filter((a) => a.id !== accountToDelete.value.id)
    $toast.success(t.value.deleted)
  } catch (e) {
    $toast.error(t.value.saveError)
  } finally {
    showDeleteModal.value = false
    accountToDelete.value = null
  }
}

const translations = {
  title: { es: 'Operating War Chest', en: 'Operating War Chest' },
  subtitle: { es: 'Saldo en cada cuenta y avance hacia la meta.', en: 'Balance in each account and progress to goal.' },
  addAccount: { es: 'Agregar Cuenta', en: 'Add Account' },
  editAccount: { es: 'Editar Cuenta', en: 'Edit Account' },
  balance: { es: 'Saldo', en: 'Balance' },
  goal: { es: 'Meta', en: 'Goal' },
  overall: { es: 'Progreso General', en: 'Overall Progress' },
  overallNote: { es: 'La meta general es la suma de las metas de cada cuenta.', en: 'The overall goal is the sum of each account\'s goal.' },
  name: { es: 'Nombre', en: 'Name' },
  routingMethod: { es: 'Método de pago vinculado', en: 'Linked payment method' },
  methodNone: { es: 'Ninguno', en: 'None' },
  routingHint: { es: 'Órdenes pagadas y gastos con este método entran/salen de esta cuenta.', en: 'Orders paid and expenses with this method flow in/out of this account.' },
  edit: { es: 'Editar', en: 'Edit' },
  delete: { es: 'Eliminar', en: 'Delete' },
  cancel: { es: 'Cancelar', en: 'Cancel' },
  save: { es: 'Guardar', en: 'Save' },
  saved: { es: 'Guardado', en: 'Saved' },
  deleted: { es: 'Cuenta eliminada', en: 'Account deleted' },
  loadError: { es: 'Error al cargar', en: 'Error loading' },
  saveError: { es: 'Error al guardar', en: 'Error saving' },
  deleteAccountTitle: { es: 'Eliminar Cuenta', en: 'Delete Account' },
  deleteAccountMessage: { es: '¿Seguro que deseas eliminar esta cuenta del War Chest?', en: 'Delete this War Chest account?' },
  deleteConfirm: { es: 'Sí, Eliminar', en: 'Yes, Delete' },
}
const t = createTranslations(translations)

onMounted(fetchAccounts)
</script>
