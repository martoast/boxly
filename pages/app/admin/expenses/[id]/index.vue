<template>
    <section class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20">
      <!-- Header -->
      <div class="bg-white/90 backdrop-blur-sm shadow-sm border-b border-gray-100">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div class="flex items-center gap-3 sm:gap-4">
            <NuxtLink 
              to="/app/admin/expenses" 
              class="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
              </svg>
            </NuxtLink>
            <div class="flex-1">
              <h1 class="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{{ t.expenseDetails }}</h1>
              <p class="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">{{ t.viewExpenseInfo }}</p>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Main Content -->
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center py-16">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-primary-50 rounded-2xl">
            <svg class="animate-spin h-8 w-8 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        </div>
  
        <!-- Content -->
        <div v-else-if="expense" class="space-y-6">
          <!-- Main Info Card -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="p-6 sm:p-8 space-y-6">
              <!-- Amount Header -->
              <div class="text-center pb-6 border-b border-gray-100">
                <p class="text-sm font-medium text-gray-600 uppercase tracking-wider mb-2">{{ t.expenseAmount }}</p>
                <p class="text-4xl sm:text-5xl font-bold text-red-600">${{ formatMoney(expense.amount) }}</p>
              </div>
  
              <!-- Details Grid -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <!-- Category -->
                <div>
                  <p class="text-sm font-medium text-gray-600 mb-2">{{ t.category }}</p>
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
                    {{ getCategoryLabel(expense.category) }}
                  </span>
                  <span
                    v-if="expense.scope === 'personal'"
                    class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 ml-2"
                  >{{ t.personalBadge }}</span>
                </div>
  
                <!-- Date -->
                <div>
                  <p class="text-sm font-medium text-gray-600 mb-2">{{ t.date }}</p>
                  <p class="text-base text-gray-900">{{ formatDate(expense.expense_date) }}</p>
                </div>

                <!-- Payment account (War Chest) -->
                <div>
                  <p class="text-sm font-medium text-gray-600 mb-2">{{ t.paidFrom }}</p>
                  <span v-if="expense.payment_method" class="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-semibold bg-indigo-50 text-indigo-700">{{ expense.payment_method }}</span>
                  <span v-else class="text-base text-gray-400">{{ t.noAccount }}</span>
                </div>

                <!-- Description -->
                <div class="sm:col-span-2" v-if="expense.description">
                  <p class="text-sm font-medium text-gray-600 mb-2">{{ t.description }}</p>
                  <p class="text-base text-gray-900">{{ expense.description }}</p>
                </div>
  
                <!-- Reference Number -->
                <div v-if="expense.reference_number">
                  <p class="text-sm font-medium text-gray-600 mb-2">{{ t.referenceNumber }}</p>
                  <p class="text-base text-gray-900 font-mono">{{ expense.reference_number }}</p>
                </div>
  
                <!-- Currency -->
                <div>
                  <p class="text-sm font-medium text-gray-600 mb-2">{{ t.currency }}</p>
                  <p class="text-base text-gray-900">{{ expense.currency.toUpperCase() }}</p>
                </div>
  
                <!-- Created By -->
                <div v-if="expense.creator">
                  <p class="text-sm font-medium text-gray-600 mb-2">{{ t.createdBy }}</p>
                  <p class="text-base text-gray-900">{{ expense.creator.name }}</p>
                </div>
  
                <!-- Created At -->
                <div>
                  <p class="text-sm font-medium text-gray-600 mb-2">{{ t.createdAt }}</p>
                  <p class="text-base text-gray-900">{{ formatDateTime(expense.created_at) }}</p>
                </div>
              </div>
            </div>
  
            <!-- Actions -->
            <div class="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row gap-3">
              <NuxtLink
                :to="`/app/admin/expenses/${expense.id}/edit`"
                class="flex-1 sm:flex-none inline-flex items-center justify-center px-6 py-2.5 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 transition-all duration-200 text-sm"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
                {{ t.editExpense }}
              </NuxtLink>
              
              <button
                @click="showDeleteModal = true"
                class="flex-1 sm:flex-none inline-flex items-center justify-center px-6 py-2.5 bg-white text-red-600 font-medium rounded-xl border border-red-200 hover:bg-red-50 transition-all duration-200 text-sm"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
                {{ t.deleteExpense }}
              </button>
            </div>
          </div>
        </div>
  
        <!-- Not Found -->
        <div v-else class="text-center py-16">
          <div class="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-2xl mb-4">
            <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ t.expenseNotFound }}</h3>
          <p class="text-gray-500 mb-6">{{ t.expenseNotFoundDescription }}</p>
          <NuxtLink 
            to="/app/admin/expenses"
            class="inline-flex items-center px-4 py-2 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 shadow-sm hover:shadow-md transition-all duration-300"
          >
            {{ t.backToExpenses }}
          </NuxtLink>
        </div>
      </div>
  
      <!-- Delete Confirmation Modal -->
      <ConfirmModal
        v-if="showDeleteModal"
        :title="t.deleteExpenseTitle"
        :message="t.deleteExpenseMessage"
        :confirmText="t.deleteConfirm"
        :cancelText="t.cancel"
        @confirm="deleteExpense"
        @cancel="showDeleteModal = false"
      />
    </section>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import ConfirmModal from '~/components/admin/ConfirmModal.vue'
  
  definePageMeta({
    layout: 'admin',
    middleware: ['auth', 'admin']
  })
  
  const route = useRoute()
  const router = useRouter()
  const { $customFetch, $toast } = useNuxtApp()
  const user = useUser().value
  const { t: createTranslations } = useLanguage()
  
  // State
  const loading = ref(true)
  const expense = ref(null)
  const showDeleteModal = ref(false)
  
  // Translations
  const translations = {
    expenseDetails: { es: 'Detalles del Gasto', en: 'Expense Details' },
    viewExpenseInfo: { es: 'Ver información completa del gasto', en: 'View complete expense information' },
    expenseAmount: { es: 'Monto del Gasto', en: 'Expense Amount' },
    category: { es: 'Categoría', en: 'Category' },
    date: { es: 'Fecha', en: 'Date' },
    description: { es: 'Descripción', en: 'Description' },
    referenceNumber: { es: 'Número de Referencia', en: 'Reference Number' },
    currency: { es: 'Moneda', en: 'Currency' },
    createdBy: { es: 'Creado Por', en: 'Created By' },
    createdAt: { es: 'Fecha de Creación', en: 'Created At' },
    editExpense: { es: 'Editar Gasto', en: 'Edit Expense' },
    deleteExpense: { es: 'Eliminar Gasto', en: 'Delete Expense' },
    expenseNotFound: { es: 'Gasto No Encontrado', en: 'Expense Not Found' },
    expenseNotFoundDescription: { es: 'El gasto que buscas no existe', en: 'The expense you are looking for does not exist' },
    backToExpenses: { es: 'Volver a Gastos', en: 'Back to Expenses' },
    deleteExpenseTitle: { es: 'Eliminar Gasto', en: 'Delete Expense' },
    deleteExpenseMessage: { es: '¿Estás seguro que deseas eliminar este gasto?', en: 'Are you sure you want to delete this expense?' },
    deleteConfirm: { es: 'Sí, Eliminar', en: 'Yes, Delete' },
    cancel: { es: 'Cancelar', en: 'Cancel' },
    personalBadge: { es: 'Personal', en: 'Personal' },
    paidFrom: { es: 'Pagado de (cuenta)', en: 'Paid from (account)' },
    noAccount: { es: 'Sin cuenta', en: 'No account' },
    // Categories
    shipping: { es: 'Envíos', en: 'Shipping' },
    ads: { es: 'Publicidad', en: 'Advertising' },
    software: { es: 'Software', en: 'Software' },
    office: { es: 'Oficina', en: 'Office' },
    po_box: { es: 'Apartado Postal', en: 'PO Box' },
    misc: { es: 'Varios', en: 'Miscellaneous' },
  }

  const t = createTranslations(translations)
  const { getCategoryLabel: getScopeCategoryLabel } = useExpenseCategories()
  
  // Methods
  const fetchExpense = async () => {
    loading.value = true
    try {
      const response = await $customFetch(`/admin/expenses/${route.params.id}`)
      expense.value = response.data
    } catch (error) {
      console.error('Error fetching expense:', error)
      expense.value = null
    } finally {
      loading.value = false
    }
  }
  
  const getCategoryLabel = (category) => getScopeCategoryLabel(category)
  
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }
  
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString(user?.preferred_language === 'es' ? 'es-MX' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  
  const formatDateTime = (date) => {
    return new Date(date).toLocaleString(user?.preferred_language === 'es' ? 'es-MX' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  const deleteExpense = async () => {
    try {
      await $customFetch(`/admin/expenses/${route.params.id}`, {
        method: 'DELETE'
      })
  
      $toast.success('Expense deleted successfully')
      router.push('/app/admin/expenses')
    } catch (error) {
      console.error('Error deleting expense:', error)
      $toast.error('Failed to delete expense')
      showDeleteModal.value = false
    }
  }
  
  onMounted(() => {
    fetchExpense()
  })
  </script>