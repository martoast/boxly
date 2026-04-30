<template>
  <div class="min-h-screen bg-gray-50/50">
    <!-- Header -->
    <div class="bg-white/90 backdrop-blur-sm shadow-sm border-b border-gray-100">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <!-- Mobile Layout -->
        <div class="lg:hidden space-y-4">
          <div class="flex items-center justify-between">
            <h1 class="text-2xl font-extrabold text-gray-900">{{ t.campaigns }}</h1>
            <NuxtLink to="/app/shopping/campaigns/create"
              class="p-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-all duration-300 shadow-sm">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
            </NuxtLink>
          </div>
        </div>
        <!-- Desktop Layout -->
        <div class="hidden lg:flex lg:items-center lg:justify-between">
          <h1 class="text-3xl font-extrabold text-gray-900">{{ t.campaigns }}</h1>
          <NuxtLink to="/app/shopping/campaigns/create"
            class="inline-flex items-center px-4 py-2.5 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 transition-all duration-300 shadow-sm gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            {{ t.createCampaign }}
          </NuxtLink>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <!-- Stats Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div v-for="stat in stats" :key="stat.label" class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p class="text-sm text-gray-500 mb-1">{{ stat.label }}</p>
          <p class="text-2xl font-bold text-gray-900">{{ stat.value }}</p>
        </div>
      </div>

      <!-- Main Card -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <!-- Search & Filters -->
        <div class="px-4 sm:px-6 py-4 bg-gray-50/50 border-b border-gray-100">
          <div class="space-y-3">
            <div class="relative" style="max-width: 500px">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>
              <input v-model="searchQuery" type="text" :placeholder="t.searchPlaceholder"
                class="block w-full pl-10 pr-10 py-3 sm:py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
              <button v-if="searchQuery" @click="searchQuery = ''" class="absolute inset-y-0 right-0 pr-3 flex items-center">
                <svg class="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div class="flex flex-col sm:flex-row sm:items-center gap-3">
              <select v-model="statusFilter" class="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option value="">{{ t.allStatuses }}</option>
                <option value="draft">{{ t.statusDraft }}</option>
                <option value="sending">{{ t.statusSending }}</option>
                <option value="paused">{{ t.statusPaused }}</option>
                <option value="completed">{{ t.statusCompleted }}</option>
                <option value="cancelled">{{ t.statusCancelled }}</option>
              </select>

              <button v-if="searchQuery || statusFilter" @click="clearFilters"
                class="text-primary-600 hover:text-primary-700 text-sm font-medium">
                {{ t.clearFilters }}
              </button>
            </div>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="p-8 text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p class="text-gray-500">{{ t.loading }}</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="campaigns.length === 0" class="p-8 text-center">
          <p class="text-gray-500">{{ t.noCampaigns }}</p>
        </div>

        <template v-else>
          <!-- Mobile Cards -->
          <div class="sm:hidden divide-y divide-gray-100">
            <NuxtLink v-for="campaign in campaigns" :key="campaign.id"
              :to="`/app/shopping/campaigns/${campaign.id}`"
              class="block p-4 hover:bg-gray-50 transition-colors">
              <div class="flex items-start justify-between mb-3">
                <div>
                  <p class="font-semibold text-gray-900">{{ campaign.name }}</p>
                  <p class="text-sm text-gray-500">{{ getAudienceLabel(campaign.audience) }}</p>
                </div>
                <span :class="getStatusBadgeClass(campaign.status)" class="text-xs px-2 py-1 rounded-full font-medium">
                  {{ getStatusLabel(campaign.status) }}
                </span>
              </div>
              <div class="grid grid-cols-4 gap-2 text-center text-sm">
                <div>
                  <p class="font-semibold text-gray-900">{{ campaign.total_recipients }}</p>
                  <p class="text-xs text-gray-500">{{ t.recipients }}</p>
                </div>
                <div>
                  <p class="font-semibold text-gray-900">{{ campaign.sent_count }}</p>
                  <p class="text-xs text-gray-500">{{ t.sent }}</p>
                </div>
                <div>
                  <p class="font-semibold text-gray-900">{{ campaign.open_rate }}%</p>
                  <p class="text-xs text-gray-500">{{ t.openRate }}</p>
                </div>
                <div>
                  <p class="font-semibold text-gray-900">{{ campaign.click_rate }}%</p>
                  <p class="text-xs text-gray-500">{{ t.clickRate }}</p>
                </div>
              </div>
            </NuxtLink>
          </div>

          <!-- Desktop Table -->
          <div class="hidden sm:block overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{{ t.name }}</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{{ t.audience }}</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{{ t.status }}</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{{ t.recipients }}</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{{ t.sent }}</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{{ t.openRate }}</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{{ t.clickRate }}</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{{ t.created }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="campaign in campaigns" :key="campaign.id"
                  class="hover:bg-gray-50 transition-colors cursor-pointer"
                  @click="navigateTo(`/app/shopping/campaigns/${campaign.id}`)">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <p class="text-sm font-medium text-gray-900">{{ campaign.name }}</p>
                    <p class="text-xs text-gray-500">{{ campaign.subject }}</p>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {{ getAudienceLabel(campaign.audience) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span :class="getStatusBadgeClass(campaign.status)" class="text-xs px-2.5 py-1 rounded-full font-medium">
                      {{ getStatusLabel(campaign.status) }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{{ campaign.total_recipients }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{{ campaign.sent_count }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{{ campaign.open_rate }}%</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{{ campaign.click_rate }}%</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ new Date(campaign.created_at).toLocaleDateString() }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div v-if="pagination.lastPage > 1" class="px-4 sm:px-6 py-4 border-t border-gray-100">
            <div class="flex items-center justify-between">
              <p class="text-sm text-gray-700 hidden sm:block">
                {{ t.showing }} <span class="font-medium">{{ pagination.from }}</span> {{ t.to }}
                <span class="font-medium">{{ pagination.to }}</span> {{ t.of }}
                <span class="font-medium">{{ pagination.total }}</span> {{ t.results }}
              </p>
              <p class="text-sm text-gray-700 sm:hidden">
                {{ pagination.from }}-{{ pagination.to }} {{ t.of }} {{ pagination.total }}
              </p>
              <div class="flex gap-2">
                <button @click="changePage(pagination.currentPage - 1)" :disabled="pagination.currentPage === 1"
                  class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                  {{ t.previous }}
                </button>
                <button @click="changePage(pagination.currentPage + 1)" :disabled="pagination.currentPage === pagination.lastPage"
                  class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                  {{ t.next }}
                </button>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'shopping',
  middleware: ['auth', 'shopping']
})

const { $customFetch } = useNuxtApp()
const { t: createTranslations } = useLanguage()

const translations = {
  campaigns: { es: 'Campañas', en: 'Campaigns' },
  createCampaign: { es: 'Crear Campaña', en: 'Create Campaign' },
  searchPlaceholder: { es: 'Buscar por nombre...', en: 'Search by name...' },
  allStatuses: { es: 'Todos los estados', en: 'All statuses' },
  statusDraft: { es: 'Borrador', en: 'Draft' },
  statusSending: { es: 'Enviando', en: 'Sending' },
  statusPaused: { es: 'Pausada', en: 'Paused' },
  statusCompleted: { es: 'Completada', en: 'Completed' },
  statusCancelled: { es: 'Cancelada', en: 'Cancelled' },
  clearFilters: { es: 'Limpiar filtros', en: 'Clear filters' },
  loading: { es: 'Cargando campañas...', en: 'Loading campaigns...' },
  noCampaigns: { es: 'No se encontraron campañas', en: 'No campaigns found' },
  name: { es: 'Nombre', en: 'Name' },
  audience: { es: 'Audiencia', en: 'Audience' },
  status: { es: 'Estado', en: 'Status' },
  recipients: { es: 'Destinatarios', en: 'Recipients' },
  sent: { es: 'Enviados', en: 'Sent' },
  openRate: { es: 'Apertura', en: 'Open Rate' },
  clickRate: { es: 'Clics', en: 'Click Rate' },
  created: { es: 'Creada', en: 'Created' },
  totalCampaigns: { es: 'Total Campañas', en: 'Total Campaigns' },
  activeCampaigns: { es: 'Activas', en: 'Active' },
  completedCampaigns: { es: 'Completadas', en: 'Completed' },
  totalEmailsSent: { es: 'Emails Enviados', en: 'Emails Sent' },
  showing: { es: 'Mostrando', en: 'Showing' },
  to: { es: 'a', en: 'to' },
  of: { es: 'de', en: 'of' },
  results: { es: 'resultados', en: 'results' },
  previous: { es: 'Anterior', en: 'Previous' },
  next: { es: 'Siguiente', en: 'Next' },
  audienceAll: { es: 'Todos', en: 'All' },
  audienceHasOrders: { es: 'Con órdenes', en: 'Has Orders' },
  audienceNoOrders: { es: 'Sin órdenes', en: 'No Orders' },
  audienceActiveOrders: { es: 'Órdenes activas', en: 'Active Orders' },
  audienceExpat: { es: 'Expat', en: 'Expat' },
  audienceBusiness: { es: 'Business', en: 'Business' },
  audienceShopper: { es: 'Shopper', en: 'Shopper' },
}

const t = createTranslations(translations)

const campaigns = ref([])
const loading = ref(true)
const searchQuery = ref('')
const statusFilter = ref('')
const searchDebounce = ref(null)
const summaryStats = ref({ total: 0, active: 0, completed: 0, total_emails_sent: 0 })
const pagination = ref({
  currentPage: 1, lastPage: 1, from: 0, to: 0, total: 0
})

const stats = computed(() => [
  { label: t.value.totalCampaigns, value: summaryStats.value.total },
  { label: t.value.activeCampaigns, value: summaryStats.value.active },
  { label: t.value.completedCampaigns, value: summaryStats.value.completed },
  { label: t.value.totalEmailsSent, value: summaryStats.value.total_emails_sent },
])

const getStatusBadgeClass = (status) => {
  const classes = {
    draft: 'bg-gray-100 text-gray-700',
    sending: 'bg-blue-100 text-blue-700',
    paused: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  }
  return classes[status] || 'bg-gray-100 text-gray-700'
}

const getStatusLabel = (status) => {
  const labels = {
    draft: t.value.statusDraft,
    sending: t.value.statusSending,
    paused: t.value.statusPaused,
    completed: t.value.statusCompleted,
    cancelled: t.value.statusCancelled,
  }
  return labels[status] || status
}

const getAudienceLabel = (audience) => {
  const labels = {
    all: t.value.audienceAll,
    has_orders: t.value.audienceHasOrders,
    no_orders: t.value.audienceNoOrders,
    active_orders: t.value.audienceActiveOrders,
    expat: t.value.audienceExpat,
    business: t.value.audienceBusiness,
    shopper: t.value.audienceShopper,
  }
  return labels[audience] || audience
}

const fetchCampaigns = async (page = 1) => {
  loading.value = true
  try {
    const params = {
      page,
      search: searchQuery.value || undefined,
      status: statusFilter.value || undefined,
    }

    const response = await $customFetch('/shopping/campaigns', { params })

    campaigns.value = response.data.data
    pagination.value = {
      currentPage: response.data.current_page,
      lastPage: response.data.last_page,
      from: response.data.from || 0,
      to: response.data.to || 0,
      total: response.data.total,
    }

    if (response.summary) {
      summaryStats.value = response.summary
    }
  } catch (error) {
    console.error('Error fetching campaigns:', error)
  } finally {
    loading.value = false
  }
}

const changePage = (page) => {
  if (page >= 1 && page <= pagination.value.lastPage) {
    fetchCampaigns(page)
  }
}

const clearFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
}

watch(searchQuery, () => {
  clearTimeout(searchDebounce.value)
  searchDebounce.value = setTimeout(() => {
    fetchCampaigns(1)
  }, 300)
})

watch(statusFilter, () => {
  fetchCampaigns(1)
})

onMounted(() => {
  fetchCampaigns()
})

onUnmounted(() => {
  clearTimeout(searchDebounce.value)
})
</script>
