<template>
    <section class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20">
      <!-- Header -->
      <div class="bg-white/90 backdrop-blur-sm shadow-sm border-b border-gray-100">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div class="flex items-center gap-3 sm:gap-4">
            <NuxtLink 
              :to="`/app/admin/expenses/${route.params.id}`"
              class="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
              </svg>
            </NuxtLink>
            <div>
              <h1 class="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{{ t.editExpense }}</h1>
              <p class="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">{{ t.updateExpenseInfo }}</p>
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
  
        <!-- Edit Form -->
        <form v-else-if="form" @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Error Alert -->
          <Transition
            enter-active-class="transform ease-out duration-300 transition"
            enter-from-class="translate-y-2 opacity-0"
            enter-to-class="translate-y-0 opacity-100"
            leave-active-class="transition ease-in duration-200"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
          >
            <div v-if="errorMessage" class="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 shadow-sm">
              <div class="flex">
                <svg class="w-5 h-5 text-red-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                </svg>
                <p class="ml-3 text-sm font-medium text-red-800 flex-1">{{ errorMessage }}</p>
                <button @click="errorMessage = ''" class="ml-3 flex-shrink-0">
                  <svg class="w-5 h-5 text-red-400 hover:text-red-600 transition-colors" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                  </svg>
                </button>
              </div>
            </div>
          </Transition>
  
          <!-- Form Card -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <div class="space-y-6">
              <!-- Scope: Business vs Personal -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">{{ t.scopeLabel }}</label>
                <div class="grid grid-cols-2 gap-2 max-w-sm">
                  <button
                    v-for="s in ['business', 'personal']"
                    :key="s"
                    type="button"
                    @click="setScope(s)"
                    :class="[
                      'px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors',
                      form.scope === s
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    ]"
                  >
                    {{ s === 'business' ? t.scopeBusiness : t.scopePersonal }}
                  </button>
                </div>
              </div>

              <!-- Category -->
              <div>
                <label for="category" class="block text-sm font-medium text-gray-700 mb-2">
                  {{ t.category }} <span class="text-red-500">*</span>
                </label>
                <select
                  v-model="form.category"
                  id="category"
                  required
                  class="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                >
                  <option value="">{{ t.selectCategory }}</option>
                  <option v-for="cat in categories" :key="cat.value" :value="cat.value">
                    {{ cat.label }}
                  </option>
                </select>
              </div>
  
              <!-- Amount -->
              <div>
                <label for="amount" class="block text-sm font-medium text-gray-700 mb-2">
                  {{ t.amount }} <span class="text-red-500">*</span>
                </label>
                <div class="relative">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                  <input
                    v-model="form.amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    id="amount"
                    required
                    placeholder="0.00"
                    class="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  >
                </div>
              </div>
  
              <!-- Date -->
              <div>
                <label for="expense_date" class="block text-sm font-medium text-gray-700 mb-2">
                  {{ t.date }} <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="form.expense_date"
                  type="date"
                  id="expense_date"
                  required
                  :max="maxDate"
                  class="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                >
              </div>
  
              <!-- Description -->
              <div>
                <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
                  {{ t.description }}
                </label>
                <textarea
                  v-model="form.description"
                  id="description"
                  rows="4"
                  :placeholder="t.descriptionPlaceholder"
                  class="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                ></textarea>
              </div>
  
              <!-- Reference Number -->
              <div>
                <label for="reference_number" class="block text-sm font-medium text-gray-700 mb-2">
                  {{ t.referenceNumber }}
                </label>
                <input
                  v-model="form.reference_number"
                  type="text"
                  id="reference_number"
                  :placeholder="t.referenceNumberPlaceholder"
                  maxlength="100"
                  class="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                >
              </div>
            </div>
          </div>
  
          <!-- Action Buttons -->
          <div class="flex flex-col-reverse sm:flex-row gap-3 sm:justify-between">
            <NuxtLink
              :to="`/app/admin/expenses/${route.params.id}`"
              class="px-6 py-3 bg-white text-gray-700 font-medium rounded-xl border border-gray-300 hover:bg-gray-50 transition-all duration-200 text-center text-sm"
            >
              {{ t.cancel }}
            </NuxtLink>
            
            <button
              type="submit"
              :disabled="saving"
              class="px-8 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-xl shadow-lg hover:from-primary-600 hover:to-primary-700 hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <svg v-if="saving" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span v-if="!saving">{{ t.saveChanges }}</span>
              <span v-else>{{ t.saving }}</span>
            </button>
          </div>
        </form>
      </div>
    </section>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue'
  
  definePageMeta({
    layout: 'admin',
    middleware: ['auth', 'admin']
  })
  
  const route = useRoute()
  const router = useRouter()
  const { $customFetch, $toast } = useNuxtApp()
  const { t: createTranslations } = useLanguage()
  const { categoryOptionsForScope } = useExpenseCategories()

  // State
  const loading = ref(true)
  const saving = ref(false)
  const errorMessage = ref('')
  const form = ref(null)

  // Categories for the active scope
  const categories = computed(() => categoryOptionsForScope(form.value?.scope || 'business'))

  // Switching scope resets the category (options differ per scope).
  const setScope = (s) => {
    if (!form.value || form.value.scope === s) return
    form.value.scope = s
    form.value.category = ''
  }
  
  const maxDate = computed(() => {
    return new Date().toISOString().split('T')[0]
  })
  
  // Translations
  const translations = {
    editExpense: { es: 'Editar Gasto', en: 'Edit Expense' },
    updateExpenseInfo: { es: 'Actualizar información del gasto', en: 'Update expense information' },
    scopeLabel: { es: 'Tipo de gasto', en: 'Expense type' },
    scopeBusiness: { es: 'Negocio', en: 'Business' },
    scopePersonal: { es: 'Personal', en: 'Personal' },
    category: { es: 'Categoría', en: 'Category' },
    selectCategory: { es: 'Selecciona una categoría', en: 'Select a category' },
    amount: { es: 'Monto', en: 'Amount' },
    date: { es: 'Fecha', en: 'Date' },
    description: { es: 'Descripción', en: 'Description' },
    descriptionPlaceholder: { es: 'Detalles del gasto...', en: 'Expense details...' },
    referenceNumber: { es: 'Número de Referencia', en: 'Reference Number' },
    referenceNumberPlaceholder: { es: 'Factura #, Recibo #, etc.', en: 'Invoice #, Receipt #, etc.' },
    cancel: { es: 'Cancelar', en: 'Cancel' },
    saveChanges: { es: 'Guardar Cambios', en: 'Save Changes' },
    saving: { es: 'Guardando...', en: 'Saving...' },
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
  const fetchExpense = async () => {
    loading.value = true
    try {
      const response = await $customFetch(`/admin/expenses/${route.params.id}`)
      form.value = {
        scope: response.data.scope || 'business',
        category: response.data.category,
        amount: response.data.amount,
        expense_date: response.data.expense_date,
        description: response.data.description || '',
        reference_number: response.data.reference_number || ''
      }
    } catch (error) {
      console.error('Error fetching expense:', error)
      $toast.error('Failed to load expense')
      router.push('/app/admin/expenses')
    } finally {
      loading.value = false
    }
  }
  
  const handleSubmit = async () => {
    saving.value = true
    errorMessage.value = ''
  
    try {
      const response = await $customFetch(`/admin/expenses/${route.params.id}`, {
        method: 'PUT',
        body: form.value
      })
  
      if (response.success) {
        $toast.success('Expense updated successfully')
        router.push(`/app/admin/expenses/${route.params.id}`)
      }
    } catch (error) {
      console.error('Error updating expense:', error)
      errorMessage.value = error.data?.message || 'An error occurred. Please try again.'
      $toast.error(errorMessage.value)
    } finally {
      saving.value = false
    }
  }
  
  onMounted(() => {
    fetchExpense()
  })
  </script>