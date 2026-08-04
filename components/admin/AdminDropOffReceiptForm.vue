<template>
  <form @submit.prevent="onSubmit" class="space-y-6">
    <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
      <div>
        <label class="block text-sm font-semibold text-gray-900 mb-1">{{ t.customer }} <span class="text-red-500">*</span></label>
        <AdminCustomerSearch
          v-model="customerName"
          :endpoint="`${apiNs}/customers`"
          :placeholder="t.customerPlaceholder"
          @select="onSelectCustomer"
        />
        <p v-if="form.user_id" class="text-xs text-green-600 mt-1 font-medium">{{ selectedLabel }}</p>
        <p v-else class="text-xs text-gray-400 mt-1">{{ t.customerHint }}</p>
      </div>

      <div>
        <label class="block text-sm font-semibold text-gray-900 mb-1">{{ t.date }} <span class="text-red-500">*</span></label>
        <input
          v-model="form.dropped_off_at"
          type="date"
          required
          class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <p class="text-xs text-gray-400 mt-1">{{ t.dateHint }}</p>
      </div>

      <div>
        <label class="block text-sm font-semibold text-gray-900 mb-1">{{ t.contents }} <span class="text-red-500">*</span></label>
        <textarea
          v-model="form.description"
          rows="5"
          required
          :placeholder="t.contentsPlaceholder"
          class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        ></textarea>
        <p class="text-xs text-gray-400 mt-1">{{ t.contentsHint }}</p>
      </div>
    </div>

    <div class="flex justify-end gap-3">
      <NuxtLink :to="basePath" class="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50">{{ t.cancel }}</NuxtLink>
      <button
        type="submit"
        :disabled="saving || !form.user_id"
        class="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 transition-colors"
      >
        {{ saving ? t.saving : (existingReceipt ? t.saveChanges : t.create) }}
      </button>
    </div>
  </form>
</template>

<script setup>
import AdminCustomerSearch from '~/components/admin/AdminCustomerSearch.vue'

const props = defineProps({
  existingReceipt: { type: Object, default: null },
})
const emit = defineEmits(['submit'])

const route = useRoute()
// Same namespace trick AdminStoreForm uses: one component, two mount points.
const isEmployee = computed(() => route.path.includes('/employee/'))
const apiNs = computed(() => (isEmployee.value ? '/employee' : '/admin'))
const basePath = computed(() =>
  isEmployee.value ? '/app/employee/drop-off-receipts' : '/app/admin/drop-off-receipts'
)

// Warehouse UI is English (Mau), admin UI is Spanish.
const t = computed(() => (isEmployee.value
  ? {
      customer: 'Customer',
      customerPlaceholder: 'Search by name, email or phone...',
      customerHint: 'Pick the customer who dropped the items off.',
      selected: 'Selected',
      date: 'Drop-off date',
      dateHint: 'The day they actually handed the items over.',
      contents: 'What they dropped off',
      contentsPlaceholder: '2 boxes of Nike sneakers\n1 Coach bag',
      contentsHint: 'One item per line works well — this text goes in their receipt email.',
      cancel: 'Cancel',
      saving: 'Saving...',
      saveChanges: 'Save changes',
      create: 'Create receipt',
    }
  : {
      customer: 'Cliente',
      customerPlaceholder: 'Buscar por nombre, email o teléfono...',
      customerHint: 'Selecciona el cliente que hizo la entrega.',
      selected: 'Seleccionado',
      date: 'Fecha de entrega',
      dateHint: 'El día en que realmente entregaron las cosas.',
      contents: 'Qué entregaron',
      contentsPlaceholder: '2 cajas de tenis Nike\n1 bolsa Coach',
      contentsHint: 'Una cosa por línea funciona bien — este texto va en el correo del cliente.',
      cancel: 'Cancelar',
      saving: 'Guardando...',
      saveChanges: 'Guardar cambios',
      create: 'Crear recibo',
    }))

const todayLocal = () => {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const customerName = ref('')
const customerEmail = ref('')
// The name exactly as it was when a customer was picked from the dropdown.
const pickedName = ref('')

const form = ref({
  user_id: null,
  description: '',
  dropped_off_at: todayLocal(),
})

watch(() => props.existingReceipt, (r) => {
  if (r) {
    customerName.value = r.user?.name ?? ''
    customerEmail.value = r.user?.email ?? ''
    pickedName.value = r.user?.name ?? ''
    form.value = {
      user_id: r.user_id,
      description: r.description ?? '',
      // API returns an ISO datetime for a date cast — keep just the date part.
      dropped_off_at: (r.dropped_off_at ?? '').slice(0, 10) || todayLocal(),
    }
  }
}, { immediate: true })

const selectedLabel = computed(() =>
  `${t.value.selected}: ${customerName.value}${customerEmail.value ? ` (${customerEmail.value})` : ''}`
)

const onSelectCustomer = (customer) => {
  form.value.user_id = customer.id
  customerEmail.value = customer.email ?? ''
  pickedName.value = customer.name ?? ''
}

// Typing over a chosen customer drops the selection, so we can never submit a
// user_id that no longer matches the name on screen.
watch(customerName, (name) => {
  if (name !== pickedName.value) {
    form.value.user_id = null
    customerEmail.value = ''
  }
})

const saving = ref(false)

const onSubmit = async () => {
  if (!form.value.user_id) return
  saving.value = true
  try {
    await emit('submit', { ...form.value })
  } finally {
    saving.value = false
  }
}
</script>
