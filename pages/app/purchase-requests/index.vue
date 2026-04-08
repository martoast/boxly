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
  
      <!-- Personal Shopping Hero Card -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <a
          href="https://wa.me/16195591910?text=Hola%21+Me+gustar%C3%ADa+agendar+un+personal+shopping+en+Las+Americas+Premium+Outlets"
          target="_blank"
          rel="noopener"
          class="relative w-full rounded-3xl overflow-hidden cursor-pointer group shadow-xl shadow-black/10 hover:shadow-2xl hover:shadow-black/20 transition-all duration-300 hover:-translate-y-0.5 block"
          style="min-height: 280px"
        >
          <!-- Background photo -->
          <img
            src="/outlet.jpeg"
            alt="Las Americas Premium Outlets"
            class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
          <!-- Gradient overlay -->
          <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />

          <!-- "Nuevo" badge -->
          <div class="absolute top-4 left-4">
            <span class="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
              <span class="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Nuevo servicio
            </span>
          </div>

          <!-- Content anchored to bottom -->
          <div class="absolute bottom-0 left-0 right-0 px-5 pb-5">

            <!-- Location -->
            <div class="flex items-center gap-1.5 mb-2.5">
              <svg class="h-3.5 w-3.5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              <span class="text-white/60 text-xs font-medium">Las Americas Premium Outlets · San Ysidro, CA</span>
            </div>

            <!-- Headline -->
            <h2 class="text-white font-extrabold text-2xl sm:text-3xl leading-tight mb-1">Personal Shopping</h2>
            <p class="text-white/75 text-sm mb-4">Compramos por ti en tiendas oficiales de San Diego</p>

            <!-- Brands strip -->
            <div class="flex items-center gap-2 overflow-x-auto no-scrollbar mb-4">
              <span v-for="brand in brands" :key="brand"
                class="shrink-0 bg-white/15 backdrop-blur-sm border border-white/20 text-white/90 text-xs font-semibold px-3 py-1.5 rounded-full">
                {{ brand }}
              </span>
            </div>

            <!-- Bottom row: chips + CTA -->
            <div class="flex items-center gap-3">
              <div class="flex items-center gap-2">
                <span class="bg-white/15 backdrop-blur-sm border border-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full">8% comisión</span>
                <span class="bg-white/15 backdrop-blur-sm border border-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full">mín. $600 USD</span>
              </div>
              <div class="ml-auto shrink-0">
                <div class="inline-flex items-center gap-2 bg-white text-gray-900 font-bold text-sm px-4 py-2.5 rounded-2xl shadow-lg group-hover:bg-primary-500 group-hover:text-white transition-colors duration-200">
                  Agendar
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
                </div>
              </div>
            </div>
          </div>
        </a>
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

            <!-- Personal shopping path -->
            <a
              href="https://wa.me/16195591910?text=Hola%21+Me+gustar%C3%ADa+agendar+un+personal+shopping+en+Las+Americas+Premium+Outlets"
              target="_blank"
              rel="noopener"
              class="group flex flex-col gap-3 p-5 bg-white rounded-2xl border-2 border-gray-100 hover:border-amber-200 hover:shadow-md active:scale-[0.99] transition-all duration-200 shadow-sm text-left"
            >
              <div class="h-12 w-12 rounded-2xl bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                <svg class="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
              <div>
                <h3 class="font-bold text-gray-900 text-base mb-1">Personal Shopping</h3>
                <p class="text-sm text-gray-500 leading-snug">Vamos físicamente a Las Americas Outlets en San Diego a comprar por ti.</p>
              </div>
              <div class="mt-auto flex items-center justify-between">
                <span class="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full">mín. $600 USD</span>
                <svg class="h-4 w-4 text-gray-300 group-hover:text-amber-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </a>

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

  const brands = ['Nike', 'Coach', 'Michael Kors', 'Hugo Boss', 'Karl Lagerfeld', 'Calvin Klein'];

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