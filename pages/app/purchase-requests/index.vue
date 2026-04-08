<!-- pages/app/purchase-requests/index.vue -->
<template>
    <section class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20">
      <!-- Onboarding Modal -->
      <AssistedPurchaseOnboarding v-model="showOnboarding" @close="onOnboardingClose" />

      <!-- Personal Shopping Modal -->
      <Teleport to="body">
        <Transition name="modal">
          <div
            v-if="showPersonalShoppingModal"
            class="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            @click.self="showPersonalShoppingModal = false"
          >
            <!-- Backdrop -->
            <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showPersonalShoppingModal = false" />

            <!-- Sheet -->
            <div class="relative w-full sm:max-w-md sm:mx-4 bg-white sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl z-10">

              <!-- Hero banner -->
              <div class="bg-gradient-to-br from-primary-600 to-primary-800 px-6 pt-8 pb-6 relative overflow-hidden">
                <!-- decorative circles -->
                <div class="absolute -top-6 -right-6 h-32 w-32 rounded-full bg-white/10" />
                <div class="absolute top-8 -right-2 h-16 w-16 rounded-full bg-white/10" />

                <!-- Close button -->
                <button
                  class="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                  @click="showPersonalShoppingModal = false"
                >
                  <svg class="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>

                <!-- Icon + title -->
                <div class="flex items-center gap-4 mb-3">
                  <div class="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                    <svg class="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                    </svg>
                  </div>
                  <div>
                    <p class="text-white/70 text-xs font-medium uppercase tracking-widest">Nuevo servicio</p>
                    <h2 class="text-white font-extrabold text-xl leading-tight">Personal Shopping</h2>
                  </div>
                </div>
                <p class="text-white/80 text-sm leading-relaxed">
                  Uno de nuestros agentes va personalmente a Las Americas Premium Outlets en San Ysidro, CA y compra por ti.
                </p>
              </div>

              <!-- Body -->
              <div class="px-6 py-5 space-y-4">

                <!-- Info pills -->
                <div class="grid grid-cols-2 gap-3">
                  <div class="bg-primary-50 rounded-2xl p-3.5">
                    <p class="text-xs text-primary-500 font-semibold uppercase tracking-wider mb-1">Comisión</p>
                    <p class="text-2xl font-extrabold text-primary-700">8%</p>
                    <p class="text-xs text-primary-600 mt-0.5">del valor de tus compras</p>
                  </div>
                  <div class="bg-amber-50 rounded-2xl p-3.5">
                    <p class="text-xs text-amber-600 font-semibold uppercase tracking-wider mb-1">Mínimo</p>
                    <p class="text-2xl font-extrabold text-amber-700">$600</p>
                    <p class="text-xs text-amber-600 mt-0.5">USD en compras</p>
                  </div>
                </div>

                <!-- Steps -->
                <div class="space-y-2.5">
                  <div v-for="(step, i) in steps" :key="i" class="flex items-start gap-3">
                    <div class="h-6 w-6 rounded-full bg-primary-100 flex items-center justify-center shrink-0 mt-0.5">
                      <span class="text-primary-600 font-bold text-xs">{{ i + 1 }}</span>
                    </div>
                    <p class="text-sm text-gray-600 leading-snug">{{ step }}</p>
                  </div>
                </div>

                <!-- Location pill -->
                <div class="flex items-center gap-2.5 bg-gray-50 rounded-xl px-4 py-3">
                  <svg class="h-4 w-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  <p class="text-xs text-gray-500">Las Americas Premium Outlets · San Ysidro, San Diego CA</p>
                </div>

                <!-- CTA -->
                <a
                  href="https://calendly.com/contact-boxly/30min"
                  target="_blank"
                  rel="noopener"
                  class="flex items-center justify-center gap-2.5 w-full py-4 bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white font-bold rounded-2xl transition-colors shadow-lg shadow-primary-500/30 text-base"
                >
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  Agendar mi sesión de compras
                </a>

                <p class="text-center text-xs text-gray-400 pb-1">Sin costo por agendar · El envío se cotiza por separado</p>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>

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
  
      <!-- Personal Shopping Banner -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <button
          class="w-full flex items-center gap-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 active:scale-[0.99] text-white rounded-2xl px-5 py-4 shadow-lg shadow-primary-500/20 transition-all duration-200 text-left"
          @click="showPersonalShoppingModal = true"
        >
          <div class="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <svg class="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-bold text-sm leading-tight">Personal Shopping en Las Americas Outlets</p>
            <p class="text-white/70 text-xs mt-0.5">Nosotros vamos por ti · 8% de comisión · mín. $600 USD</p>
          </div>
          <svg class="h-5 w-5 text-white/60 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
      </div>

      <!-- Main Content -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center py-12">
          <div class="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        </div>
  
        <!-- Empty State -->
        <div v-else-if="requests.length === 0" class="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100 animate-fadeIn">
          <div class="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg class="w-10 h-10 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">{{ t.noRequests }}</h3>
          <p class="text-gray-500 mb-6 max-w-md mx-auto px-4">{{ t.noRequestsDesc }}</p>

          <!-- Learn More Button -->
          <button
            @click="showOnboarding = true"
            class="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium mb-6 text-sm transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {{ t.learnMore }}
          </button>

          <div class="block">
            <NuxtLink
              to="/app/purchase-requests/create"
              class="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/25"
            >
              {{ t.startShopping }}
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
  const showPersonalShoppingModal = ref(false);

  const steps = [
    'Agenda una llamada gratuita de 30 min con nuestro equipo.',
    'Nos dices qué quieres comprar y tu presupuesto.',
    'Vamos a Las Americas Outlets y compramos por ti.',
    'Recibimos los paquetes y te los enviamos a México vía Boxly.',
  ];

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
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}
.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .relative {
  transform: translateY(100%);
}
@media (min-width: 640px) {
  .modal-enter-from .relative {
    transform: translateY(20px) scale(0.96);
  }
}
</style>