<!-- components/admin/ExpenseModal.vue -->
<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition ease-out duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click.self="$emit('close')">
        <Transition
          enter-active-class="transition ease-out duration-300"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition ease-in duration-200"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <!-- Header -->
            <div class="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <h2 class="text-xl font-bold text-gray-900">
                {{ isEdit ? t.editExpense : t.addNewExpense }}
              </h2>
              <button
                @click="$emit('close')"
                class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Form -->
            <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
              <!-- Error Alert -->
              <Transition
                enter-active-class="transform ease-out duration-300 transition"
                enter-from-class="translate-y-2 opacity-0"
                enter-to-class="translate-y-0 opacity-100"
                leave-active-class="transition ease-in duration-200"
                leave-from-class="opacity-100"
                leave-to-class="opacity-0"
              >
                <div v-if="errorMessage" class="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
                  <div class="flex">
                    <svg class="w-5 h-5 text-red-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                    </svg>
                    <p class="ml-3 text-sm font-medium text-red-800">{{ errorMessage }}</p>
                  </div>
                </div>
              </Transition>

              <!-- Scope: Business vs Personal -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">{{ t.scopeLabel }}</label>
                <div class="grid grid-cols-2 gap-2">
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
                  @change="form.subcategory = ''"
                  class="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                >
                  <option value="">{{ t.selectCategory }}</option>
                  <option v-for="opt in categoryOptionsForScope(form.scope)" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </option>
                </select>
              </div>

              <!-- Subcategory (business only; predefined based on category) -->
              <div v-if="form.scope === 'business' && form.category && getSubcategoryOptions(form.category).length > 0">
                <label for="subcategory" class="block text-sm font-medium text-gray-700 mb-2">
                  {{ t.subcategory }}
                </label>
                <select
                  v-model="form.subcategory"
                  id="subcategory"
                  class="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                >
                  <option value="">{{ t.selectSubcategory }}</option>
                  <option 
                    v-for="sub in getSubcategoryOptions(form.category)" 
                    :key="sub.value" 
                    :value="sub.value"
                  >
                    {{ sub.label }}
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

              <!-- Payment method (War Chest account it was paid from) -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">{{ t.paymentMethod }}</label>
                <div class="flex flex-wrap gap-2">
                  <button
                    type="button"
                    @click="form.payment_method = ''"
                    :class="[
                      'px-4 py-2 rounded-xl text-sm font-medium border transition-colors',
                      !form.payment_method ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    ]"
                  >
                    {{ t.paymentNone }}
                  </button>
                  <button
                    v-for="pm in paymentMethods"
                    :key="pm"
                    type="button"
                    @click="form.payment_method = pm"
                    :class="[
                      'px-4 py-2 rounded-xl text-sm font-medium border transition-colors',
                      form.payment_method === pm ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    ]"
                  >
                    {{ pm }}
                  </button>
                </div>
                <p class="text-xs text-gray-500 mt-1.5">{{ t.paymentMethodHint }}</p>
              </div>

              <!-- Description -->
              <div>
                <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
                  {{ t.description }}
                </label>
                <textarea
                  v-model="form.description"
                  id="description"
                  rows="3"
                  :placeholder="t.descriptionPlaceholder"
                  class="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                ></textarea>
              </div>


              <!-- Action Buttons -->
              <div class="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  @click="$emit('close')"
                  class="px-6 py-3 bg-white text-gray-700 font-medium rounded-xl border border-gray-300 hover:bg-gray-50 transition-all duration-200 text-sm"
                >
                  {{ t.cancel }}
                </button>
                
                <button
                  type="submit"
                  :disabled="saving"
                  class="flex-1 sm:flex-none px-8 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-xl shadow-lg hover:from-primary-600 hover:to-primary-700 hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <svg v-if="saving" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span v-if="!saving">{{ isEdit ? t.saveChanges : t.addExpense }}</span>
                  <span v-else>{{ t.saving }}</span>
                </button>
              </div>
            </form>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  expense: {
    type: Object,
    default: null
  },
  categories: {
    type: Array,
    required: true
  },
  // Which scope the expense screen is currently on. New expenses default to it.
  scope: {
    type: String,
    default: 'business'
  }
})

const emit = defineEmits(['close', 'saved'])

const { $customFetch, $toast } = useNuxtApp()
const { t: createTranslations } = useLanguage()
const { categoryOptionsForScope } = useExpenseCategories()

// State
const saving = ref(false)
const errorMessage = ref('')

// War Chest accounts an expense can be paid from (debits that balance).
const paymentMethods = ['NU', 'HSBC', 'Stripe']

// Form data
const form = ref({
  scope: props.scope || 'business',
  category: '',
  subcategory: '',
  amount: '',
  payment_method: '',
  expense_date: new Date().toISOString().split('T')[0],
  description: '',
  reference_number: ''
})

// Switching scope resets the category (its options change per scope).
const setScope = (s) => {
  if (form.value.scope === s) return
  form.value.scope = s
  form.value.category = ''
  form.value.subcategory = ''
}

// Computed
const isEdit = computed(() => !!props.expense)

const maxDate = computed(() => {
  return new Date().toISOString().split('T')[0]
})

// Predefined subcategories for each category
const subcategoryOptions = {
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
  { value: 'hosting', label: { es: 'Hosting/Servidor', en: 'Hosting/Server' } },
  { value: 'domain', label: { es: 'Dominio', en: 'Domain' } },
  { value: 'mailgun', label: { es: 'Mailgun', en: 'Mailgun' } },
  { value: 'digital_ocean', label: { es: 'Digital Ocean', en: 'Digital Ocean' } },
  { value: 'rewardsful', label: { es: 'Rewardsful', en: 'Rewardsful' } },
  { value: 'vpn', label: { es: 'VPN', en: 'VPN' } },
  { value: 'crm', label: { es: 'CRM', en: 'CRM' } },
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

// Translations
const translations = {
  addNewExpense: { es: 'Agregar Nuevo Gasto', en: 'Add New Expense' },
  editExpense: { es: 'Editar Gasto', en: 'Edit Expense' },
  scopeLabel: { es: 'Tipo de gasto', en: 'Expense type' },
  scopeBusiness: { es: 'Negocio', en: 'Business' },
  scopePersonal: { es: 'Personal', en: 'Personal' },
  paymentMethod: { es: '¿De qué cuenta se pagó?', en: 'Paid from which account?' },
  paymentNone: { es: 'Ninguna', en: 'None' },
  paymentMethodHint: { es: 'Se resta del saldo de esa cuenta en el War Chest.', en: 'Subtracted from that account\'s War Chest balance.' },
  category: { es: 'Categoría', en: 'Category' },
  selectCategory: { es: 'Selecciona una categoría', en: 'Select a category' },
  subcategory: { es: 'Subcategoría', en: 'Subcategory' },
  selectSubcategory: { es: 'Selecciona una subcategoría (opcional)', en: 'Select a subcategory (optional)' },
  optional: { es: 'opcional', en: 'optional' },
  amount: { es: 'Monto', en: 'Amount' },
  date: { es: 'Fecha', en: 'Date' },
  description: { es: 'Descripción', en: 'Description' },
  descriptionPlaceholder: { es: 'Detalles adicionales del gasto...', en: 'Additional expense details...' },
  referenceNumber: { es: 'Número de Referencia', en: 'Reference Number' },
  referenceNumberPlaceholder: { es: 'Factura #, Recibo #, etc.', en: 'Invoice #, Receipt #, etc.' },
  cancel: { es: 'Cancelar', en: 'Cancel' },
  addExpense: { es: 'Agregar Gasto', en: 'Add Expense' },
  saveChanges: { es: 'Guardar Cambios', en: 'Save Changes' },
  saving: { es: 'Guardando...', en: 'Saving...' },
  // Categories
  shipping: { es: 'Envíos', en: 'Shipping' },
  ads: { es: 'Publicidad', en: 'Advertising' },
  software: { es: 'Software', en: 'Software' },
  office: { es: 'Oficina', en: 'Office' },
  po_box: { es: 'PO Box', en: 'PO Box' },
  misc: { es: 'Varios', en: 'Miscellaneous' },
}

const t = createTranslations(translations)

// Methods
const getSubcategoryOptions = (category) => {
  const options = subcategoryOptions[category] || []
  const userLang = useUser().value?.preferred_language || 'en'
  
  return options.map(opt => ({
    value: opt.value,
    label: opt.label[userLang] || opt.label.en
  }))
}

const handleSubmit = async () => {
  saving.value = true
  errorMessage.value = ''

  try {
    // Create a copy of the form data
    const submitData = { ...form.value }

    // Personal expenses never carry a subcategory.
    if (submitData.scope === 'personal') submitData.subcategory = ''

    // Convert the date to ISO format at noon UTC to avoid timezone issues
    // This ensures the date is interpreted correctly regardless of timezone
    const [year, month, day] = submitData.expense_date.split('-')
    submitData.expense_date = `${year}-${month}-${day}T12:00:00Z`

    const url = isEdit.value 
      ? `/admin/expenses/${props.expense.id}`
      : '/admin/expenses'
    
    const method = isEdit.value ? 'PUT' : 'POST'

    const response = await $customFetch(url, {
      method,
      body: submitData
    })

    if (response.success) {
      $toast.success(isEdit.value ? 'Expense updated successfully' : 'Expense added successfully')
      emit('saved')
    }
  } catch (error) {
    console.error('Error saving expense:', error)
    errorMessage.value = error.data?.message || 'An error occurred. Please try again.'
    $toast.error(errorMessage.value)
  } finally {
    saving.value = false
  }
}

// Initialize form if editing
onMounted(() => {
  if (props.expense) {
    // When editing, extract just the date part from the stored datetime
    const expenseDate = props.expense.expense_date.split('T')[0]
    
    form.value = {
      scope: props.expense.scope || 'business',
      category: props.expense.category,
      subcategory: props.expense.subcategory || '',
      amount: props.expense.amount,
      payment_method: props.expense.payment_method || '',
      expense_date: expenseDate,
      description: props.expense.description || '',
      reference_number: props.expense.reference_number || ''
    }
  }
})
</script>