<template>
  <section class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900">Productos Comprados</h1>
          <p class="text-sm text-gray-500 mt-1">Productos comprados para los clientes — seguimiento de entregas</p>
        </div>
        <NuxtLink to="/app/shopping/purchased-products/create" class="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/20 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Nuevo registro
        </NuxtLink>
      </div>

      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5 flex flex-col sm:flex-row gap-3">
        <input v-model="search" placeholder="Buscar por cliente, teléfono, # de orden o productos..." class="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        <select v-model="status" class="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option value="">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="delivered">Entregado</option>
        </select>
      </div>

      <div v-if="loading" class="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">Cargando...</div>
      <div v-else-if="records.length === 0" class="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <p class="text-gray-700 font-semibold">Sin registros</p>
        <p class="text-gray-400 text-sm mt-1">Las compras se agregan aquí automáticamente al marcar una solicitud como comprada, o puedes crear una manual.</p>
      </div>
      <div v-else class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr class="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th class="px-4 py-3">Cliente</th>
              <th class="px-4 py-3">Productos</th>
              <th class="px-4 py-3"># Orden</th>
              <th class="px-4 py-3">Fecha</th>
              <th class="px-4 py-3">Estado</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="r in records" :key="r.id" class="hover:bg-gray-50 align-top">
              <td class="px-4 py-3">
                <p class="font-medium text-gray-900">{{ r.customer_name }}</p>
                <p v-if="r.contact_phone" class="text-xs text-gray-400">{{ r.contact_phone }}</p>
              </td>
              <td class="px-4 py-3 text-gray-700 whitespace-pre-line max-w-xs">{{ r.items || '—' }}</td>
              <td class="px-4 py-3 text-gray-500 font-mono text-xs">{{ r.order_number || '—' }}</td>
              <td class="px-4 py-3 text-gray-500 text-xs">{{ formatDate(r.order_date) }}</td>
              <td class="px-4 py-3">
                <span :class="r.status === 'delivered' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-amber-50 text-amber-700 border-amber-100'" class="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border">
                  {{ r.status === 'delivered' ? 'Entregado' : 'Pendiente' }}
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <NuxtLink :to="`/app/shopping/purchased-products/${r.id}/edit`" class="text-primary-600 font-medium hover:text-primary-700 text-sm">Editar</NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<script setup>
definePageMeta({
  layout: 'shopping',
  middleware: ['auth', 'shopping'],
})

const { $customFetch } = useNuxtApp()

const records = ref([])
const loading = ref(true)
const search = ref('')
const status = ref('')
let searchTimer = null

const formatDate = (d) => (d ? String(d).slice(0, 10) : '—')

const fetchRecords = async () => {
  loading.value = true
  try {
    const res = await $customFetch('/shopping/purchased-products', {
      query: { search: search.value || undefined, status: status.value || undefined, per_page: 100 },
    })
    records.value = res.data?.data ?? []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(fetchRecords, 300)
})
watch(status, fetchRecords)

onMounted(fetchRecords)
</script>
