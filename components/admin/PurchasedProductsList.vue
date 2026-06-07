<template>
  <section class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900">Productos Comprados</h1>
          <p class="text-sm text-gray-500 mt-1">Productos comprados para los clientes — seguimiento de entregas</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="exportList"
            :disabled="exporting"
            class="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
            {{ exporting ? 'Exportando...' : 'Exportar' }}
          </button>
          <NuxtLink :to="`${basePath}/create`" class="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/20 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Nuevo registro
          </NuxtLink>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5 flex flex-col sm:flex-row gap-3">
        <input v-model="search" placeholder="Buscar por cliente, teléfono, # de orden o productos..." class="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        <select v-model="dateRange" class="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option value="">Todas las fechas</option>
          <option value="7">Últimos 7 días</option>
          <option value="30">Últimos 30 días</option>
          <option value="90">Últimos 90 días</option>
        </select>
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
                <NuxtLink :to="`${basePath}/${r.id}/edit`" class="text-primary-600 font-medium hover:text-primary-700 text-sm">Editar</NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  basePath: { type: String, default: '/app/shopping/purchased-products' },
})

const { $customFetch } = useNuxtApp()
const toast = useToast()

const records = ref([])
const loading = ref(true)
const exporting = ref(false)
const search = ref('')
const status = ref('')
const dateRange = ref('') // '', '7', '30', '90' (days back)
let searchTimer = null

const formatDate = (d) => (d ? String(d).slice(0, 10) : '—')

const dateFrom = computed(() => {
  if (!dateRange.value) return undefined
  const d = new Date()
  d.setDate(d.getDate() - parseInt(dateRange.value, 10))
  return d.toISOString().slice(0, 10)
})

const filterQuery = (perPage) => ({
  search: search.value || undefined,
  status: status.value || undefined,
  date_from: dateFrom.value,
  per_page: perPage,
})

const fetchRecords = async () => {
  loading.value = true
  try {
    const res = await $customFetch('/shopping/purchased-products', { query: filterQuery(100) })
    records.value = res.data?.data ?? []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

// Export the currently-filtered list as plain text (clipboard, .txt fallback).
const exportList = async () => {
  exporting.value = true
  try {
    const res = await $customFetch('/shopping/purchased-products', { query: filterQuery(1000) })
    const rows = res.data?.data ?? []
    const rangeLabel = { 7: 'últimos 7 días', 30: 'últimos 30 días', 90: 'últimos 90 días' }[dateRange.value] ?? 'todas las fechas'
    const lines = [
      `PRODUCTOS COMPRADOS — ${rangeLabel} — ${rows.length} registros`,
      `Generado: ${new Date().toISOString().slice(0, 10)}`,
      '',
    ]
    rows.forEach((r, i) => {
      lines.push(`${i + 1}) ${r.customer_name}${r.contact_phone ? ' — ' + r.contact_phone : ''}`)
      lines.push(`   Orden: ${r.order_number || '—'} | Fecha: ${formatDate(r.order_date)} | Estado: ${r.status === 'delivered' ? 'Entregado' : 'Pendiente'}`)
      if (r.items) String(r.items).split('\n').forEach((it) => lines.push(`   ${it}`))
      lines.push('')
    })
    const text = lines.join('\n')
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`Lista copiada al portapapeles (${rows.length} registros)`)
    } catch {
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `productos-comprados-${new Date().toISOString().slice(0, 10)}.txt`
      a.click()
      URL.revokeObjectURL(a.href)
      toast.success('Lista descargada (.txt)')
    }
  } catch (e) {
    console.error(e)
    toast.error('Error al exportar')
  } finally {
    exporting.value = false
  }
}

watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(fetchRecords, 300)
})
watch([status, dateRange], fetchRecords)

onMounted(fetchRecords)
</script>
