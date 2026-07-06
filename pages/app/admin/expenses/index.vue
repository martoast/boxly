<!-- pages/app/admin/expenses/index.vue -->
<template>
    <section class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20">
      <!-- Header -->
      <div class="bg-white/90 backdrop-blur-sm shadow-sm border-b border-gray-100">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <!-- Mobile Layout -->
          <div class="lg:hidden space-y-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <NuxtLink 
                  to="/app/admin/dashboard" 
                  class="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                >
                  <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                  </svg>
                </NuxtLink>
                <h1 class="text-xl sm:text-2xl font-extrabold text-gray-900">{{ t.businessExpenses }}</h1>
              </div>
              <button 
                @click="showCreateModal = true"
                class="p-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-all duration-300 shadow-sm"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
              </button>
            </div>
          </div>
  
          <!-- Desktop Layout -->
          <div class="hidden lg:flex lg:items-center lg:justify-between">
            <div class="flex items-center gap-4">
              <NuxtLink 
                to="/app/admin/dashboard" 
                class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                </svg>
              </NuxtLink>
              <div>
                <h1 class="text-3xl font-extrabold text-gray-900">{{ t.businessExpenses }}</h1>
                <p class="text-sm text-gray-600 mt-1">{{ t.trackAndManage }}</p>
              </div>
            </div>
  
            <div class="flex items-center gap-3">
              <button 
                @click="showCreateModal = true"
                class="inline-flex items-center px-4 py-2.5 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                {{ t.addExpense }}
              </button>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Main Content -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <!-- Scope tabs: Business / Personal / All -->
        <div class="mb-6">
          <div class="inline-flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
            <button
              v-for="tab in scopeTabs"
              :key="tab.value"
              @click="scopeTab = tab.value"
              :class="[
                'px-5 py-2 rounded-lg text-sm font-semibold transition-colors',
                scopeTab === tab.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              ]"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>

        <!-- Month Summary Cards (per-category totals for the active scope) -->
        <div v-if="summaryCards.length" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <div
            v-for="(category, index) in summaryCards"
            :key="category.key"
            class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 animate-fadeIn"
            :style="`animation-delay: ${index * 0.1}s`"
          >
            <div class="flex items-center justify-between mb-3">
              <div :class="['p-2.5 rounded-xl', category.bgColor]">
                <svg class="w-5 h-5" :class="category.iconColor" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="category.icon"/>
                </svg>
              </div>
            </div>
            <p class="text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">{{ category.label }}</p>
            <p class="text-2xl font-bold text-gray-900">${{ formatMoney(getCategoryTotal(category.key)) }}</p>
          </div>
        </div>
  
        <!-- Expenses Table -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <!-- Filters -->
          <div class="px-4 sm:px-6 py-4 bg-gray-50/50 border-b border-gray-100">
            <div class="space-y-3">
              <!-- Search Input -->
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                </div>
                <input
                  v-model="searchQuery"
                  type="text"
                  :placeholder="t.searchPlaceholder"
                  class="block w-full pl-10 pr-10 py-3 sm:py-2.5 border border-gray-200 rounded-xl bg-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                >
                <button
                  v-if="searchQuery"
                  @click="searchQuery = ''"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg class="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              
              <!-- Filters Row -->
              <div class="flex flex-col sm:flex-row gap-3">
                <select 
                  v-model="categoryFilter" 
                  class="w-full sm:w-auto px-4 py-3 sm:py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                >
                  <option value="">{{ t.allCategories }}</option>
                  <option v-for="cat in categoryFilterOptions" :key="cat.value" :value="cat.value">
                    {{ cat.label }}
                  </option>
                </select>

                <select
                  v-if="scopeTab !== 'personal'"
                  v-model="subcategoryFilter"
                  class="w-full sm:w-auto px-4 py-3 sm:py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  :disabled="!categoryFilter"
                >
                  <option value="">{{ t.allSubcategories }}</option>
                  <option v-for="sub in availableSubcategories" :key="sub.value" :value="sub.value">
                    {{ sub.label }}
                  </option>
                </select>
  
                <select 
                  v-model="monthFilter" 
                  class="w-full sm:w-auto px-4 py-3 sm:py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                >
                  <option value="">{{ t.allMonths }}</option>
                  <option v-for="month in months" :key="month.value" :value="month.value">
                    {{ month.label }}
                  </option>
                </select>
  
                <button
                  v-if="categoryFilter || subcategoryFilter || monthFilter || searchQuery"
                  @click="clearFilters"
                  class="px-4 py-2.5 text-sm text-gray-700 hover:text-gray-900 font-medium"
                >
                  {{ t.clearFilters }}
                </button>
              </div>
            </div>
          </div>
  
          <!-- Loading State -->
          <div v-if="loading" class="px-6 py-16 text-center">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-primary-50 rounded-2xl mb-4">
              <svg class="animate-spin h-8 w-8 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p class="text-gray-500">{{ t.loadingExpenses }}</p>
          </div>
  
          <!-- Empty State -->
          <div v-else-if="!loading && expenses.length === 0" class="px-6 py-16 text-center">
            <div class="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-2xl mb-4">
              <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ t.noExpenses }}</h3>
            <p class="text-gray-500 mb-6">{{ t.noExpensesDescription }}</p>
            <button 
              @click="showCreateModal = true"
              class="inline-flex items-center px-4 py-2 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              {{ t.addFirstExpense }}
            </button>
          </div>
  
          <!-- Expenses List -->
          <div v-else>
            <!-- Mobile Cards -->
            <div class="sm:hidden divide-y divide-gray-100">
              <div
                v-for="expense in expenses"
                :key="expense.id"
                @click="viewExpense(expense)"
                class="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div class="flex items-start justify-between mb-3">
                  <div class="flex-1">
                    <p class="font-semibold text-gray-900">{{ getCategoryLabel(expense.category) }}</p>
                    <p v-if="expense.subcategory" class="text-xs text-primary-600 mt-0.5">{{ getSubcategoryLabel(expense.subcategory) }}</p>
                    <p class="text-sm text-gray-500 mt-1">{{ expense.description || t.noDescription }}</p>
                  </div>
                  <span class="text-lg font-bold text-red-600 ml-3">${{ formatMoney(expense.amount) }}</span>
                </div>
                
                <div class="flex items-center justify-between text-sm">
                  <div class="flex items-center gap-2">
                    <span class="text-gray-500">{{ formatDate(expense.expense_date) }}</span>
                    <span v-if="expense.payment_method" class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700">{{ expense.payment_method }}</span>
                  </div>
                  <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                  </svg>
                </div>
              </div>
            </div>
  
            <!-- Desktop Table -->
            <div class="hidden sm:block overflow-x-auto">
              <table class="w-full">
                <thead class="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {{ t.date }}
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {{ t.category }}
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {{ t.description }}
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {{ t.account }}
                    </th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {{ t.amount }}
                    </th>
                    <th class="relative px-6 py-3">
                      <span class="sr-only">{{ t.actions }}</span>
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr 
                    v-for="expense in expenses"
                    :key="expense.id"
                    class="hover:bg-gray-50 transition-colors cursor-pointer"
                    @click="viewExpense(expense)"
                  >
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {{ formatDate(expense.expense_date) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                          {{ getCategoryLabel(expense.category) }}
                        </span>
                        <span v-if="expense.scope === 'personal'" class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-700 ml-1">{{ t.scopePersonal }}</span>
                        <p v-if="expense.subcategory" class="text-xs text-primary-600 mt-1 font-medium">{{ getSubcategoryLabel(expense.subcategory) }}</p>
                      </div>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-900">
                      <p class="max-w-md truncate">{{ expense.description || t.noDescription }}</p>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                      <span v-if="expense.payment_method" class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">{{ expense.payment_method }}</span>
                      <span v-else class="text-gray-400">—</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-red-600">
                      ${{ formatMoney(expense.amount) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        @click.stop="editExpense(expense)"
                        class="text-primary-600 hover:text-primary-900 mr-3"
                      >
                        {{ t.edit }}
                      </button>
                      <button 
                        @click.stop="confirmDelete(expense)"
                        class="text-red-600 hover:text-red-900"
                      >
                        {{ t.delete }}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
  
            <!-- Pagination -->
            <div v-if="pagination.lastPage > 1" class="px-4 sm:px-6 py-4 border-t border-gray-100">
              <div class="flex items-center justify-between">
                <p class="text-sm text-gray-700 hidden sm:block">
                  {{ t.showing }} {{ pagination.from }}-{{ pagination.to }} {{ t.of }} {{ pagination.total }}
                </p>
                <p class="text-sm text-gray-700 sm:hidden">
                  {{ pagination.from }}-{{ pagination.to }} {{ t.of }} {{ pagination.total }}
                </p>
                <div class="flex gap-2">
                  <button 
                    @click="changePage(pagination.currentPage - 1)"
                    :disabled="pagination.currentPage === 1"
                    class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {{ t.previous }}
                  </button>
                  <button 
                    @click="changePage(pagination.currentPage + 1)"
                    :disabled="pagination.currentPage === pagination.lastPage"
                    class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {{ t.next }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Create/Edit Modal -->
      <ExpenseModal
        v-if="showCreateModal || showEditModal"
        :expense="selectedExpense"
        :categories="expenseCategories"
        :scope="scopeTab === 'all' ? 'business' : scopeTab"
        @close="closeModal"
        @saved="handleExpenseSaved"
      />
  
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
  import { ref, computed, onMounted, watch } from 'vue'
  import ExpenseModal from '~/components/admin/ExpenseModal.vue'
  import ConfirmModal from '~/components/admin/ConfirmModal.vue'
  
  definePageMeta({
    layout: 'admin',
    middleware: ['auth', 'admin']
  })
  
  const { $customFetch, $toast } = useNuxtApp()
  const router = useRouter()
  const user = useUser().value
  const { t: createTranslations } = useLanguage()
  const {
    categoryOptionsForScope,
    categoryCardsForScope,
    getCategoryLabel: getScopeCategoryLabel,
    BUSINESS_CATEGORIES,
    PERSONAL_CATEGORIES,
  } = useExpenseCategories()

  // State
  const scopeTab = ref('business') // 'business' | 'personal' | 'all'
  const loading = ref(true)
  const expenses = ref([])
  const categoryFilter = ref('')
  const subcategoryFilter = ref('')
  const monthFilter = ref('')
  const searchQuery = ref('')
  const searchDebounce = ref(null)
  const showCreateModal = ref(false)
  const showEditModal = ref(false)
  const showDeleteModal = ref(false)
  const selectedExpense = ref(null)
  const expenseToDelete = ref(null)
  const pagination = ref({
    currentPage: 1,
    lastPage: 1,
    from: 0,
    to: 0,
    total: 0
  })
  
  // Current date
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1
  
  // Predefined subcategories
  const subcategoryDefinitions = {
    shipping: [
      { value: 'jesus', label: { es: 'Jesús', en: 'Jesús' } },
      { value: 'paco', label: { es: 'Paco', en: 'Paco' } },
      { value: 'other_carrier', label: { es: 'Otra Paquetería', en: 'Other Carrier' } }
    ],
    ads: [
      { value: 'facebook', label: { es: 'Facebook Ads', en: 'Facebook Ads' } },
      { value: 'instagram', label: { es: 'Instagram Ads', en: 'Instagram Ads' } },
      { value: 'google', label: { es: 'Google Ads', en: 'Google Ads' } },
      { value: 'tiktok', label: { es: 'TikTok Ads', en: 'TikTok Ads' } },
      { value: 'twitter', label: { es: 'Twitter/X Ads', en: 'Twitter/X Ads' } },
      { value: 'other_platform', label: { es: 'Otra Plataforma', en: 'Other Platform' } }
    ],
    software: [
      { value: 'stripe', label: { es: 'Stripe', en: 'Stripe' } },
      { value: 'shopify', label: { es: 'Shopify', en: 'Shopify' } },
      { value: 'hosting', label: { es: 'Hosting/Servidor', en: 'Hosting/Server' } },
      { value: 'domain', label: { es: 'Dominio', en: 'Domain' } },
      { value: 'email', label: { es: 'Servicio de Email', en: 'Email Service' } },
      { value: 'analytics', label: { es: 'Analytics/Tracking', en: 'Analytics/Tracking' } },
      { value: 'other_saas', label: { es: 'Otro Software', en: 'Other Software' } }
    ],
    office: [
      { value: 'rent', label: { es: 'Renta', en: 'Rent' } },
      { value: 'utilities', label: { es: 'Utilidades', en: 'Utilities' } },
      { value: 'internet', label: { es: 'Internet', en: 'Internet' } },
      { value: 'phone', label: { es: 'Teléfono', en: 'Phone' } },
      { value: 'supplies', label: { es: 'Suministros', en: 'Supplies' } },
      { value: 'other_office', label: { es: 'Otros', en: 'Other' } }
    ],
    po_box: [
      { value: 'monthly_fee', label: { es: 'Cuota Mensual', en: 'Monthly Fee' } },
      { value: 'setup_fee', label: { es: 'Cuota de Instalación', en: 'Setup Fee' } },
      { value: 'additional_services', label: { es: 'Servicios Adicionales', en: 'Additional Services' } }
    ],
    misc: [
      { value: 'gas', label: { es: 'Gasolina', en: 'Gas/Fuel' } },
      { value: 'packing_materials', label: { es: 'Material de Empaque', en: 'Packing Materials' } },
      { value: 'boxes', label: { es: 'Cajas', en: 'Boxes' } },
      { value: 'tape', label: { es: 'Cinta', en: 'Tape' } },
      { value: 'bubble_wrap', label: { es: 'Plástico de Burbujas', en: 'Bubble Wrap' } },
      { value: 'labels', label: { es: 'Etiquetas', en: 'Labels' } },
      { value: 'printer_supplies', label: { es: 'Suministros de Impresora', en: 'Printer Supplies' } },
      { value: 'other_misc', label: { es: 'Otros', en: 'Other' } }
    ]
  }
  
  // Expense categories
  const expenseCategories = computed(() => [
    {
      key: 'shipping',
      label: t.value.shipping,
      icon: 'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      key: 'ads',
      label: t.value.ads,
      icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    },
    {
      key: 'software',
      label: t.value.software,
      icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      key: 'office',
      label: t.value.office,
      icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-600'
    },
    {
      key: 'misc',
      label: t.value.misc,
      icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4',
      bgColor: 'bg-gray-50',
      iconColor: 'text-gray-600'
    }
  ])
  
  // Scope tabs
  const scopeTabs = computed(() => [
    { value: 'business', label: t.value.scopeBusiness },
    { value: 'personal', label: t.value.scopePersonal },
    { value: 'all', label: t.value.scopeAll },
  ])

  // Summary cards for the active scope (hidden on the combined "All" tab).
  const summaryCards = computed(() =>
    scopeTab.value === 'all' ? [] : categoryCardsForScope(scopeTab.value)
  )

  // Category filter options — scope-aware; "All" merges both sets (unique).
  const categoryFilterOptions = computed(() => {
    if (scopeTab.value !== 'all') return categoryOptionsForScope(scopeTab.value)
    const seen = new Set()
    return [...BUSINESS_CATEGORIES, ...PERSONAL_CATEGORIES]
      .filter((k) => (seen.has(k) ? false : seen.add(k)))
      .map((k) => ({ value: k, label: getScopeCategoryLabel(k) }))
  })

  // Available subcategories based on selected category
  const availableSubcategories = computed(() => {
    if (!categoryFilter.value) return []
    
    const subcats = subcategoryDefinitions[categoryFilter.value] || []
    const userLang = user?.preferred_language || 'en'
    
    return subcats.map(sub => ({
      value: sub.value,
      label: sub.label[userLang] || sub.label.en
    }))
  })
  
  // Months for filter
  const months = computed(() => {
    const result = []
    for (let i = 1; i <= 12; i++) {
      const date = new Date(currentYear, i - 1)
      result.push({
        value: `${currentYear}-${String(i).padStart(2, '0')}`,
        label: date.toLocaleDateString(user?.preferred_language === 'es' ? 'es-MX' : 'en-US', {
          month: 'long',
          year: 'numeric'
        })
      })
    }
    return result.reverse()
  })
  
  // Translations
  const translations = {
    businessExpenses: { es: 'Gastos', en: 'Expenses' },
    trackAndManage: { es: 'Rastrea y gestiona los gastos del negocio y personales', en: 'Track and manage business and personal expenses' },
    scopeBusiness: { es: 'Negocio', en: 'Business' },
    scopePersonal: { es: 'Personal', en: 'Personal' },
    scopeAll: { es: 'Todos', en: 'All' },
    addExpense: { es: 'Agregar Gasto', en: 'Add Expense' },
    addFirstExpense: { es: 'Agregar Primer Gasto', en: 'Add First Expense' },
    searchPlaceholder: { es: 'Buscar por descripción...', en: 'Search by description...' },
    allCategories: { es: 'Todas las Categorías', en: 'All Categories' },
    allSubcategories: { es: 'Todas las Subcategorías', en: 'All Subcategories' },
    allMonths: { es: 'Todos los Meses', en: 'All Months' },
    clearFilters: { es: 'Limpiar Filtros', en: 'Clear Filters' },
    loadingExpenses: { es: 'Cargando gastos...', en: 'Loading expenses...' },
    noExpenses: { es: 'No hay gastos registrados', en: 'No expenses registered' },
    noExpensesDescription: { es: 'Comienza agregando tu primer gasto', en: 'Start by adding your first expense' },
    date: { es: 'Fecha', en: 'Date' },
    category: { es: 'Categoría', en: 'Category' },
    description: { es: 'Descripción', en: 'Description' },
    account: { es: 'Cuenta', en: 'Account' },
    amount: { es: 'Monto', en: 'Amount' },
    actions: { es: 'Acciones', en: 'Actions' },
    edit: { es: 'Editar', en: 'Edit' },
    delete: { es: 'Eliminar', en: 'Delete' },
    showing: { es: 'Mostrando', en: 'Showing' },
    of: { es: 'de', en: 'of' },
    previous: { es: 'Anterior', en: 'Previous' },
    next: { es: 'Siguiente', en: 'Next' },
    noDescription: { es: 'Sin descripción', en: 'No description' },
    deleteExpenseTitle: { es: 'Eliminar Gasto', en: 'Delete Expense' },
    deleteExpenseMessage: { es: '¿Estás seguro que deseas eliminar este gasto?', en: 'Are you sure you want to delete this expense?' },
    deleteConfirm: { es: 'Sí, Eliminar', en: 'Yes, Delete' },
    cancel: { es: 'Cancelar', en: 'Cancel' },
    // Categories
    shipping: { es: 'Envíos', en: 'Shipping' },
    ads: { es: 'Publicidad', en: 'Advertising' },
    software: { es: 'Software', en: 'Software' },
    office: { es: 'Oficina', en: 'Office' },
    po_box: { es: 'Apartado Postal', en: 'PO Box' },
    misc: { es: 'Varios', en: 'Miscellaneous' },
  }
  
  const t = createTranslations(translations)
  
  // Methods
  const fetchExpenses = async (page = 1) => {
    loading.value = true
    try {
      const params = {
        page,
        per_page: 50
      }
  
      if (scopeTab.value !== 'all') params.scope = scopeTab.value
      if (categoryFilter.value) params.category = categoryFilter.value
      if (subcategoryFilter.value) params.subcategory = subcategoryFilter.value
      if (searchQuery.value) params.search = searchQuery.value
      if (monthFilter.value) {
        const [year, month] = monthFilter.value.split('-')
        params.year = year
        params.month = month
      }
  
      const response = await $customFetch('/admin/expenses', { params })
      
      expenses.value = response.data.data
      pagination.value = {
        currentPage: response.data.current_page,
        lastPage: response.data.last_page,
        from: response.data.from,
        to: response.data.to,
        total: response.data.total
      }
    } catch (error) {
      console.error('Error fetching expenses:', error)
      $toast.error('Error loading expenses')
    } finally {
      loading.value = false
    }
  }
  
  const getCategoryTotal = (category) => {
    return expenses.value
      .filter(e => e.category === category)
      .reduce((sum, e) => sum + parseFloat(e.amount), 0)
  }
  
  const getCategoryLabel = (category) => getScopeCategoryLabel(category)
  
  const getSubcategoryLabel = (subcategory) => {
    if (!subcategory) return ''
    
    // Find the subcategory in definitions
    for (const category in subcategoryDefinitions) {
      const found = subcategoryDefinitions[category].find(sub => sub.value === subcategory)
      if (found) {
        const userLang = user?.preferred_language || 'en'
        return found.label[userLang] || found.label.en
      }
    }
    
    return subcategory
  }
  
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }
  
  const formatDate = (date) => {
    // Extract just the date part to avoid timezone conversion
    const dateOnly = date.split('T')[0]
    const [year, month, day] = dateOnly.split('-')
    
    // Create date in local timezone at noon to avoid any edge cases
    const localDate = new Date(year, month - 1, day, 12, 0, 0)
    
    return localDate.toLocaleDateString(user?.preferred_language === 'es' ? 'es-MX' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
  
  const changePage = (page) => {
    if (page >= 1 && page <= pagination.value.lastPage) {
      fetchExpenses(page)
    }
  }
  
  const clearFilters = () => {
    categoryFilter.value = ''
    subcategoryFilter.value = ''
    monthFilter.value = ''
    searchQuery.value = ''
    fetchExpenses(1)
  }
  
  const viewExpense = (expense) => {
    router.push(`/app/admin/expenses/${expense.id}`)
  }
  
  const editExpense = (expense) => {
    selectedExpense.value = expense
    showEditModal.value = true
  }
  
  const confirmDelete = (expense) => {
    expenseToDelete.value = expense
    showDeleteModal.value = true
  }
  
  const deleteExpense = async () => {
    if (!expenseToDelete.value) return
  
    try {
      await $customFetch(`/admin/expenses/${expenseToDelete.value.id}`, {
        method: 'DELETE'
      })
  
      $toast.success('Expense deleted successfully')
      showDeleteModal.value = false
      expenseToDelete.value = null
      fetchExpenses(pagination.value.currentPage)
    } catch (error) {
      console.error('Error deleting expense:', error)
      $toast.error('Failed to delete expense')
    }
  }
  
  const closeModal = () => {
    showCreateModal.value = false
    showEditModal.value = false
    selectedExpense.value = null
  }
  
  const handleExpenseSaved = () => {
    closeModal()
    fetchExpenses(pagination.value.currentPage)
  }
  
  // Watchers
  watch(scopeTab, () => {
    // Category/subcategory options differ per scope — reset when switching tabs.
    categoryFilter.value = ''
    subcategoryFilter.value = ''
    fetchExpenses(1)
  })
  watch(categoryFilter, () => {
    subcategoryFilter.value = '' // Clear subcategory when category changes
    fetchExpenses(1)
  })
  watch(subcategoryFilter, () => fetchExpenses(1))
  watch(monthFilter, () => fetchExpenses(1))
  watch(searchQuery, () => {
    clearTimeout(searchDebounce.value)
    searchDebounce.value = setTimeout(() => {
      fetchExpenses(1)
    }, 300)
  })
  
  onMounted(() => {
    fetchExpenses()
  })
  </script>
  
  <style scoped>
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.6s ease-out forwards;
    opacity: 0;
  }
  </style>