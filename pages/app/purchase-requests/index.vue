<!-- pages/app/purchase-requests/index.vue -->
<template>
    <section class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20">
      <!-- Onboarding Modal -->
      <AssistedPurchaseOnboarding v-model="showOnboarding" @close="onOnboardingClose" />

      <!-- Header -->
      <div class="bg-white/90 backdrop-blur-sm shadow-sm border-b border-gray-100">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div class="flex items-center justify-between">
            <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900 animate-fadeIn">
              {{ t.purchaseRequests }}
            </h1>

            <NuxtLink
              to="/app/purchase-requests/create"
              class="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-primary-500 text-white font-semibold rounded-xl shadow-lg hover:bg-primary-600 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 animate-fadeIn"
              style="animation-delay: 0.1s"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span class="hidden sm:inline">{{ t.newRequest }}</span>
              <span class="sm:hidden">{{ t.new }}</span>
            </NuxtLink>
          </div>
        </div>
      </div>
  
      <!-- Tienda Boxly CTA — replaces the old Personal Shopping/WhatsApp banner. -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <NuxtLink
          to="/shop"
          class="relative w-full rounded-3xl overflow-hidden block group shadow-lg shadow-black/5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
        >
          <img
            src="/images/shop-hero.png"
            alt="Tienda Boxly"
            class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
          <!-- Heavier gradient on the left for legibility, fading to clear on the right where the photo carries the design. -->
          <div class="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent" />
          <!-- Content drives the banner's natural height — keeps padding
               consistent across breakpoints without min-height tricks. -->
          <div class="relative max-w-md sm:max-w-lg lg:max-w-2xl p-6 sm:p-8 lg:p-12">
            <p class="text-white/70 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-2">Tienda Boxly</p>
            <h2 class="text-white font-extrabold text-xl sm:text-2xl lg:text-4xl leading-tight mb-2 sm:mb-3">Productos curados, listos para enviar</h2>
            <p class="hidden sm:block text-white/80 text-sm lg:text-base mb-4 lg:mb-5 max-w-md lg:max-w-lg">Marcas de Estados Unidos seleccionadas a mano. Compra y nosotros consolidamos.</p>
            <span class="inline-flex items-center gap-2 bg-white text-gray-900 font-semibold text-xs sm:text-sm px-4 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-lg group-hover:bg-gray-100 transition-colors">
              Explorar tienda
              <svg class="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
            </span>
          </div>
        </NuxtLink>
      </div>

      <!-- Main Content -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center py-12">
          <div class="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        </div>
  
        <!-- Empty State -->
        <div v-else-if="requests.length === 0" class="animate-fadeIn">
          <p class="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3 px-1">¿Cómo quieres comprar?</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">

            <!-- Online purchase path -->
            <NuxtLink
              to="/app/purchase-requests/create"
              class="group flex flex-col gap-3 p-5 bg-white rounded-2xl border-2 border-gray-100 hover:border-primary-200 hover:shadow-md active:scale-[0.99] transition-all duration-200 shadow-sm"
            >
              <div class="h-12 w-12 rounded-2xl bg-primary-100 flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                <svg class="h-6 w-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                </svg>
              </div>
              <div>
                <h3 class="font-bold text-gray-900 text-base mb-1">Compra Online</h3>
                <p class="text-sm text-gray-500 leading-snug">Mándanos el link y compramos con nuestra tarjeta americana.</p>
              </div>
              <div class="mt-auto flex items-center justify-between">
                <span class="text-xs font-semibold text-primary-600 bg-primary-50 border border-primary-100 px-2.5 py-1 rounded-full">8% comisión</span>
                <svg class="h-4 w-4 text-gray-300 group-hover:text-primary-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </NuxtLink>

            <!-- Tienda Boxly path — replaces the old WhatsApp / outlet flow. -->
            <NuxtLink
              to="/shop"
              class="group flex flex-col gap-3 p-5 bg-white rounded-2xl border-2 border-gray-100 hover:border-amber-200 hover:shadow-md active:scale-[0.99] transition-all duration-200 shadow-sm text-left"
            >
              <div class="h-12 w-12 rounded-2xl bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                <svg class="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
              </div>
              <div>
                <h3 class="font-bold text-gray-900 text-base mb-1">Tienda Boxly</h3>
                <p class="text-sm text-gray-500 leading-snug">Productos ya curados de marcas como Lululemon, Alo y Stanley — listos para enviar.</p>
              </div>
              <div class="mt-auto flex items-center justify-between">
                <span class="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full">Sin comisión</span>
                <svg class="h-4 w-4 text-gray-300 group-hover:text-amber-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </NuxtLink>

          </div>
        </div>
  
        <!-- List -->
        <div v-else class="grid gap-6 animate-fadeIn" style="animation-delay: 0.2s">
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
    cancelled: { es: 'Cancelado', en: 'Cancelled' }
  };
  
  const t = createTranslations(translations);
  const requests = ref([]);
  const loading = ref(true);
  const pagination = ref({ currentPage: 1, lastPage: 1 });
  const showOnboarding = ref(false);

  // Use Nuxt's useCookie for SSR-friendly persistent storage
  const onboardingDismissed = useCookie('boxly_assisted_purchase_onboarding_dismissed', {
    default: () => false
  });

  const checkOnboarding = () => {
    // Show onboarding only if: no requests AND hasn't been dismissed before
    if (!onboardingDismissed.value && requests.value.length === 0) {
      showOnboarding.value = true;
    }
  };

  const onOnboardingClose = () => {
    showOnboarding.value = false;
  };

  const fetchRequests = async (page = 1) => {
    loading.value = true;
    try {
      const { data } = await $customFetch(`/purchase-requests?page=${page}`);
      requests.value = data.data;
      pagination.value = {
        currentPage: data.current_page,
        lastPage: data.last_page
      };
      // Check if we should show onboarding after fetching
      if (page === 1) {
        checkOnboarding();
      }
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