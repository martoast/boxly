<!-- pages/app/purchase-requests/index.vue -->
<template>
    <section class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20">
      <!-- Header -->
      <div class="bg-white/90 backdrop-blur-sm shadow-sm border-b border-gray-100">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div class="flex items-center justify-between">
            <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900 animate-fadeIn">
              {{ t.purchaseRequests }}
            </h1>
          </div>
        </div>
      </div>
  
      <!-- Main Content -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center py-12">
          <div class="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        </div>
  
        <!--
          Order matters here. This page used to open with two full-bleed hero
          cards for CREATING a request, pushing the list of requests you already
          sent below the fold. But a returning customer opens this page to find
          something they already did — so the list leads, and the two ways to
          start a new one sit underneath as compact rows.
        -->
        <div v-else class="animate-fadeIn space-y-8">

          <!-- ===== YOUR REQUESTS ===== -->
          <div v-if="requests.length > 0" class="space-y-3">
            <p class="text-xs font-semibold uppercase tracking-widest text-gray-400 px-1">{{ t.yourRequests }}</p>

            <div
              v-for="req in requests"
              :key="req.id"
              class="bg-white rounded-xl shadow-sm border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all px-5 py-4 group cursor-pointer"
              @click="navigateTo(`/app/purchase-requests/${req.id}`)"
            >
              <div class="flex items-center justify-between gap-4">
                <div class="flex items-center gap-3.5 min-w-0">
                  <div class="p-2.5 bg-primary-50 rounded-lg text-primary-600 group-hover:bg-primary-100 transition-colors flex-shrink-0">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <div class="min-w-0">
                    <h3 class="font-bold text-gray-900 text-sm sm:text-base truncate">{{ req.request_number }}</h3>
                    <p class="text-xs sm:text-sm text-gray-500 mt-0.5">
                      {{ formatDate(req.created_at) }} • {{ req.items.length }} {{ t.items.toLowerCase() }}
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-3 flex-shrink-0">
                  <span :class="[
                    'px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap',
                    getStatusColor(req.status)
                  ]">
                    {{ getStatusLabel(req.status) }}
                  </span>
                  <svg class="w-4 h-4 text-gray-300 group-hover:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>

            <!-- Pagination -->
            <div v-if="pagination.lastPage > 1" class="flex justify-center gap-2 pt-3">
              <button
                @click="changePage(pagination.currentPage - 1)"
                :disabled="pagination.currentPage === 1"
                class="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                {{ t.previous }}
              </button>
              <button
                @click="changePage(pagination.currentPage + 1)"
                :disabled="pagination.currentPage === pagination.lastPage"
                class="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                {{ t.next }}
              </button>
            </div>
          </div>

          <!-- ===== EMPTY ===== -->
          <div v-else class="bg-white rounded-2xl border border-gray-200 px-6 py-12 text-center">
            <div class="w-12 h-12 mx-auto rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 class="mt-4 font-semibold text-gray-900">{{ t.noRequests }}</h3>
            <p class="mt-1.5 text-sm text-gray-500 max-w-sm mx-auto">{{ t.noRequestsDesc }}</p>
          </div>

          <!-- ===== START ANOTHER — compact, deliberately quiet ===== -->
          <div class="space-y-3">
            <p class="text-xs font-semibold uppercase tracking-widest text-gray-400 px-1">{{ t.howToBuy }}</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">

              <NuxtLink
                to="/app/purchase-requests/create/online"
                class="group flex items-center gap-3.5 bg-white rounded-xl border border-gray-200 p-4 hover:border-primary-300 hover:shadow-sm transition-all"
              >
                <div class="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                  </svg>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="font-semibold text-gray-900 text-sm">{{ t.laneOnlineTitle }}</p>
                  <p class="text-xs text-gray-500 mt-0.5">{{ t.laneOnlineDesc }}</p>
                </div>
                <svg class="w-4 h-4 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
              </NuxtLink>

              <NuxtLink
                to="/in-person"
                class="group flex items-center gap-3.5 bg-white rounded-xl border border-gray-200 p-4 hover:border-primary-300 hover:shadow-sm transition-all"
              >
                <div class="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <p class="font-semibold text-gray-900 text-sm">{{ t.laneInPersonTitle }}</p>
                    <span class="px-1.5 py-0.5 rounded bg-primary-50 text-primary-700 text-[10px] font-bold uppercase tracking-wide">{{ t.new }}</span>
                  </div>
                  <p class="text-xs text-gray-500 mt-0.5">{{ t.laneInPersonDesc }}</p>
                </div>
                <svg class="w-4 h-4 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
              </NuxtLink>

            </div>
          </div>
        </div>
      </div>
    </section>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  
  definePageMeta({
    layout: 'app',
    middleware: ['auth', 'customer', 'complete-profile']
  });
  
  const { $customFetch } = useNuxtApp();
  const { t: createTranslations } = useLanguage();
  const user = useUser().value;
  
  // Translations
  const translations = {
    purchaseRequests: { es: 'Solicitudes de Compra', en: 'Purchase Requests' },
    newRequest: { es: 'Nueva Solicitud', en: 'New Request' },
    new: { es: 'Nueva', en: 'New' },
    noRequests: { es: 'Sin solicitudes recientes', en: 'No recent requests' },
    yourRequests: { es: 'Tus solicitudes', en: 'Your requests' },
    noRequestsDesc: { es: 'Déjanos comprar por ti. Envíanos los enlaces y nosotros nos encargamos del resto.', en: 'Let us shop for you. Send us the links and we handle the rest.' },
    howToBuy: { es: '¿Cómo quieres comprar?', en: 'How do you want to shop?' },
    laneOnlineTitle: { es: 'Mándanos el link', en: 'Send us the link' },
    laneOnlineDesc: { es: 'Cualquier tienda de USA — lo compramos por ti.', en: 'Any US store — we buy it for you.' },
    laneInPersonTitle: { es: 'Compras presenciales', en: 'In-person shopping' },
    laneInPersonDesc: { es: 'Vamos a outlets y tiendas físicas en San Diego.', en: 'We visit outlets and physical stores in San Diego.' },
    startShopping: { es: 'Comenzar Compra Asistida', en: 'Start Assisted Purchase' },
    learnMore: { es: '¿Cómo funciona?', en: 'How does it work?' },
    items: { es: 'Artículos', en: 'Items' },
    previous: { es: 'Anterior', en: 'Previous' },
    next: { es: 'Siguiente', en: 'Next' },
    // Statuses
    pending_review: { es: 'Pendiente de Revisión', en: 'Pending Review' },
    quoted: { es: 'Cotizado - Esperando Pago', en: 'Quoted - Awaiting Payment' },
    paid: { es: 'Pagado - Procesando Compra', en: 'Paid - Processing Purchase' },
    purchased: { es: 'Comprado', en: 'Purchased' },
    rejected: { es: 'Rechazado', en: 'Rejected' },
    cancelled: { es: 'Cancelado', en: 'Cancelled' },
    awaiting_deposit: { es: 'Pago de Reserva Pendiente', en: 'Awaiting Booking Deposit' }
  };
  
  const t = createTranslations(translations);
  const requests = ref([]);
  const loading = ref(true);
  const pagination = ref({ currentPage: 1, lastPage: 1 });

  const fetchRequests = async (page = 1) => {
    loading.value = true;
    try {
      const { data } = await $customFetch(`/purchase-requests?page=${page}`);
      requests.value = data.data;
      pagination.value = {
        currentPage: data.current_page,
        lastPage: data.last_page
      };
    } catch (e) {
      console.error(e);
    } finally {
      loading.value = false;
    }
  };
  
  const changePage = (page) => {
    if (page >= 1 && page <= pagination.value.lastPage) {
      fetchRequests(page);
    }
  };
 
  const getStatusColor = (status) => {
    const map = {
      pending_review: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      quoted: 'bg-blue-50 text-blue-700 border-blue-200',
      paid: 'bg-primary-50 text-primary-700 border-primary-200',
      purchased: 'bg-green-50 text-green-700 border-green-200',
      rejected: 'bg-red-50 text-red-700 border-red-200',
      cancelled: 'bg-gray-50 text-gray-700 border-gray-200',
      awaiting_deposit: 'bg-amber-50 text-amber-700 border-amber-200',
    };
    return map[status] || 'bg-gray-50 text-gray-600';
  };
  
  const getStatusLabel = (status) => t.value[status] || status;
  
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString(user?.preferred_language === 'es' ? 'es-MX' : 'en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };
  
  onMounted(() => {
    fetchRequests();
  });
  </script>

<style scoped>
.no-scrollbar { scrollbar-width: none; }
.no-scrollbar::-webkit-scrollbar { display: none; }
</style>