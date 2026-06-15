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
  
        <!-- Pipeline chooser cards — always visible above the list so customers
             can start a new request whether or not they already have ones. -->
        <div v-else class="animate-fadeIn">
          <p class="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3 px-1">¿Cómo quieres comprar?</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-7">

            <!-- Online purchase path -->
            <NuxtLink
              to="/app/purchase-requests/create/online"
              class="group block bg-white rounded-2xl overflow-hidden border border-gray-200/80 hover:border-gray-300 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
            >
              <div class="relative aspect-[4/3] overflow-hidden bg-gray-100">
                <img
                  src="/images/lane-online.png"
                  alt="Producto de tienda USA visto en celular"
                  loading="lazy"
                  decoding="async"
                  class="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
                >
              </div>
              <div class="p-6 sm:p-7">
                <h3 class="text-xl font-bold text-gray-900 tracking-tight">Mándanos el link</h3>
                <p class="text-[15px] text-gray-500 mt-2 leading-relaxed">Encuentra el producto que quieres en cualquier tienda de USA — nosotros lo compramos y te lo enviamos a México.</p>
                <div class="mt-4 inline-flex items-center gap-1.5 text-[15px] font-semibold text-primary-600 group-hover:text-primary-700">
                  Crear solicitud
                  <svg class="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
                </div>
              </div>
            </NuxtLink>

            <!-- In-person shopping path -->
            <NuxtLink
              to="/in-person"
              class="group block bg-white rounded-2xl overflow-hidden border border-gray-200/80 hover:border-gray-300 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
            >
              <div class="relative aspect-[4/3] overflow-hidden bg-gray-100">
                <img
                  src="/images/lane-in-person.png"
                  alt="Compras presenciales en San Diego"
                  loading="lazy"
                  decoding="async"
                  class="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
                >
                <span class="absolute top-3 left-3 inline-flex items-center px-2.5 py-1 rounded-full bg-white text-[10px] font-bold uppercase tracking-wider text-primary-700 shadow-sm">Nuevo</span>
              </div>
              <div class="p-6 sm:p-7">
                <h3 class="text-xl font-bold text-gray-900 tracking-tight">Compras presenciales en San Diego</h3>
                <p class="text-[15px] text-gray-500 mt-2 leading-relaxed">Vamos en persona a outlets y tiendas físicas. Ideal para boutiques, mayoreo y compras múltiples.</p>
                <div class="mt-4 inline-flex items-center gap-1.5 text-[15px] font-semibold text-primary-600 group-hover:text-primary-700">
                  Agendar visita
                  <svg class="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
                </div>
              </div>
            </NuxtLink>

          </div>
        </div>
  
        <!-- List of existing requests — shown below the chooser cards. -->
        <div v-if="!loading && requests.length > 0" class="grid gap-6 animate-fadeIn mt-8" style="animation-delay: 0.2s">
          <p class="text-xs font-semibold uppercase tracking-widest text-gray-400 px-1">{{ t.yourRequests }}</p>
          <div 
            v-for="req in requests" 
            :key="req.id"
            class="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow p-6 group cursor-pointer"
            @click="navigateTo(`/app/purchase-requests/${req.id}`)"
          >
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <!-- Left Info -->
              <div class="flex items-start gap-4">
                <div class="p-3 bg-primary-50 rounded-xl text-primary-600 group-hover:bg-primary-100 transition-colors">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <div>
                  <h3 class="font-bold text-gray-900">{{ req.request_number }}</h3>
                  <p class="text-sm text-gray-500 mt-1">
                    {{ formatDate(req.created_at) }} • {{ req.items.length }} {{ t.items.toLowerCase() }}
                  </p>
                </div>
              </div>
  
              <!-- Status Badge -->
              <div class="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                 <span :class="[
                  'px-3 py-1 rounded-full text-xs font-medium border',
                  getStatusColor(req.status)
                ]">
                  {{ getStatusLabel(req.status) }}
                </span>
                <svg class="w-5 h-5 text-gray-300 group-hover:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
          
          <!-- Pagination -->
          <div v-if="pagination.lastPage > 1" class="flex justify-center gap-2 mt-6">
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