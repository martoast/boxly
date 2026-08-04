<template>
  <section :class="isEmployee ? '' : 'min-h-screen bg-gray-50'">
    <div :class="isEmployee ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'">
      <div class="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900">{{ t.title }}</h1>
          <p class="text-sm text-gray-500 mt-1">{{ t.subtitle }}</p>
        </div>
        <NuxtLink :to="`${basePath}/create`" class="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/20 transition-colors shrink-0">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          <span class="hidden sm:inline">{{ t.create }}</span>
        </NuxtLink>
      </div>

      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
        <input v-model="search" :placeholder="t.searchPlaceholder" class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
      </div>

      <div v-if="loading" class="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">{{ t.loading }}</div>

      <div v-else-if="receipts.length === 0" class="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <p class="text-gray-700 font-semibold">{{ t.emptyTitle }}</p>
        <p class="text-gray-400 text-sm mt-1">{{ t.emptyHint }}</p>
      </div>

      <!-- Cards on mobile / warehouse, table on desktop admin -->
      <div v-else-if="isEmployee" class="space-y-3">
        <NuxtLink
          v-for="r in receipts"
          :key="r.id"
          :to="`${basePath}/${r.id}`"
          class="block bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-primary-200 transition-colors"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="font-semibold text-gray-900 truncate">{{ r.user?.name ?? '—' }}</p>
              <p class="text-xs text-gray-400 font-mono mt-0.5">{{ r.receipt_number }}</p>
            </div>
            <span :class="r.email_sent_at ? 'bg-green-50 text-green-700 border-green-100' : 'bg-amber-50 text-amber-700 border-amber-100'" class="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border shrink-0">
              {{ r.email_sent_at ? t.sent : t.notSent }}
            </span>
          </div>
          <p class="text-sm text-gray-600 mt-2 line-clamp-2 whitespace-pre-line">{{ r.description }}</p>
          <div class="flex items-center gap-3 mt-2 text-xs text-gray-400">
            <span>{{ formatDate(r.dropped_off_at) }}</span>
            <span v-if="(r.images?.length ?? 0) > 0">{{ r.images.length }} {{ t.photos }}</span>
          </div>
        </NuxtLink>
      </div>

      <div v-else class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr class="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th class="px-4 py-3">{{ t.colReceipt }}</th>
              <th class="px-4 py-3">{{ t.colCustomer }}</th>
              <th class="px-4 py-3">{{ t.colContents }}</th>
              <th class="px-4 py-3">{{ t.colDate }}</th>
              <th class="px-4 py-3">{{ t.colEmail }}</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="r in receipts" :key="r.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 font-mono text-xs text-gray-500">
                {{ r.receipt_number }}
                <span v-if="(r.images?.length ?? 0) > 0" class="block text-gray-400 mt-0.5">{{ r.images.length }} {{ t.photos }}</span>
              </td>
              <td class="px-4 py-3">
                <p class="font-medium text-gray-900">{{ r.user?.name ?? '—' }}</p>
                <p class="text-xs text-gray-400">{{ r.user?.email }}</p>
              </td>
              <td class="px-4 py-3 text-gray-600 max-w-xs">
                <p class="line-clamp-2 whitespace-pre-line">{{ r.description }}</p>
              </td>
              <td class="px-4 py-3 text-gray-600 whitespace-nowrap">{{ formatDate(r.dropped_off_at) }}</td>
              <td class="px-4 py-3">
                <span :class="r.email_sent_at ? 'bg-green-50 text-green-700 border-green-100' : 'bg-amber-50 text-amber-700 border-amber-100'" class="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border">
                  {{ r.email_sent_at ? t.sent : t.notSent }}
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <NuxtLink :to="`${basePath}/${r.id}`" class="text-primary-600 font-medium hover:text-primary-700 text-sm">{{ t.open }}</NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<script setup>
const { $customFetch } = useNuxtApp()
const route = useRoute()

const isEmployee = computed(() => route.path.includes('/employee/'))
const apiNs = computed(() => (isEmployee.value ? '/employee' : '/admin'))
const basePath = computed(() =>
  isEmployee.value ? '/app/employee/drop-off-receipts' : '/app/admin/drop-off-receipts'
)

const t = computed(() => (isEmployee.value
  ? {
      title: 'Drop-offs',
      subtitle: 'Receipts for items customers handed over in person',
      create: 'New receipt',
      searchPlaceholder: 'Search by customer or receipt number...',
      loading: 'Loading...',
      emptyTitle: 'No drop-off receipts',
      emptyHint: 'Create one when a customer hands packages over.',
      sent: 'Emailed',
      notSent: 'Not sent',
      photos: 'photos',
      open: 'Open',
      colReceipt: 'Receipt',
      colCustomer: 'Customer',
      colContents: 'Contents',
      colDate: 'Date',
      colEmail: 'Email',
    }
  : {
      title: 'Recibos de entrega',
      subtitle: 'Comprobantes de lo que los clientes entregan en persona',
      create: 'Crear recibo',
      searchPlaceholder: 'Buscar por cliente o número de recibo...',
      loading: 'Cargando...',
      emptyTitle: 'Sin recibos de entrega',
      emptyHint: 'Crea uno cuando un cliente entregue paquetes.',
      sent: 'Enviado',
      notSent: 'Sin enviar',
      photos: 'fotos',
      open: 'Abrir',
      colReceipt: 'Recibo',
      colCustomer: 'Cliente',
      colContents: 'Contenido',
      colDate: 'Fecha',
      colEmail: 'Correo',
    }))

const receipts = ref([])
const loading = ref(true)
const search = ref('')
let searchTimer = null

const formatDate = (value) => {
  if (!value) return '—'
  const [y, m, d] = String(value).slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

const fetchReceipts = async () => {
  loading.value = true
  try {
    const res = await $customFetch(`${apiNs.value}/drop-off-receipts`, {
      query: { search: search.value || undefined, per_page: 100 },
    })
    receipts.value = res.data?.data ?? []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(fetchReceipts, 300)
})

onMounted(fetchReceipts)
</script>
