<template>
  <form @submit.prevent="onSubmit" class="space-y-6">
    <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
      <div>
        <label class="block text-sm font-semibold text-gray-900 mb-1">Cliente <span class="text-red-500">*</span></label>
        <AdminCustomerSearch v-model="form.customer_name" @select="onCustomerSelect" />
        <p class="text-xs text-gray-400 mt-1">Empieza a escribir para buscar un cliente, o escribe un nombre manualmente.</p>
      </div>

      <div>
        <label class="block text-sm font-semibold text-gray-900 mb-1">Contacto (teléfono)</label>
        <input v-model="form.contact_phone" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
      </div>

      <div>
        <label class="block text-sm font-semibold text-gray-900 mb-1">Productos</label>
        <textarea v-model="form.items" rows="4" placeholder="1x Sudadera YoungLA&#10;2x Shorts Chubbies" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"></textarea>
      </div>

      <div>
        <label class="block text-sm font-semibold text-gray-900 mb-1"># de orden (tienda)</label>
        <input v-model="form.order_number" placeholder="Número de orden de la tienda" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        <p class="text-xs text-gray-400 mt-1">El número de confirmación de la tienda (no el de Boxly).</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-semibold text-gray-900 mb-1">Estado</label>
          <select v-model="form.status" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="pending">Pendiente</option>
            <option value="delivered">Entregado</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-semibold text-gray-900 mb-1">Fecha</label>
          <input v-model="form.order_date" type="date" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
      </div>
    </div>

    <div class="flex justify-end gap-3">
      <NuxtLink :to="cancelTo" class="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50">Cancelar</NuxtLink>
      <button type="submit" :disabled="saving" class="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 transition-colors">
        {{ saving ? 'Guardando...' : (recordId ? 'Guardar cambios' : 'Crear registro') }}
      </button>
    </div>
  </form>
</template>

<script setup>
import AdminCustomerSearch from '~/components/admin/AdminCustomerSearch.vue'

const props = defineProps({
  existingRecord: { type: Object, default: null },
})
const emit = defineEmits(['submit'])

// When she picks a customer from the search, auto-fill the phone too.
const onCustomerSelect = (customer) => {
  if (customer?.phone) form.value.contact_phone = customer.phone
}

const cancelTo = '/app/shopping/purchased-products'

const recordId = computed(() => props.existingRecord?.id)

const form = ref({
  customer_name: '',
  contact_phone: '',
  items: '',
  order_number: '',
  status: 'pending',
  order_date: '',
})

watch(() => props.existingRecord, (r) => {
  if (r) {
    form.value = {
      customer_name: r.customer_name ?? '',
      contact_phone: r.contact_phone ?? '',
      items: r.items ?? '',
      order_number: r.order_number ?? '',
      status: r.status ?? 'pending',
      order_date: r.order_date ? String(r.order_date).slice(0, 10) : '',
    }
  }
}, { immediate: true })

const saving = ref(false)

const onSubmit = async () => {
  saving.value = true
  try {
    await emit('submit', form.value)
  } finally {
    saving.value = false
  }
}
</script>
