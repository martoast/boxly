<template>
  <section class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20">
    <!-- Header -->
    <div class="bg-white/90 backdrop-blur-sm shadow-sm border-b border-gray-100 sticky top-0 z-30">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <NuxtLink 
              :to="`/app/shopping/purchase-requests/${requestId}`" 
              class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
              </svg>
            </NuxtLink>
            <div>
              <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900">{{ t.editRequest }}</h1>
              <p class="text-sm text-gray-600 mt-1">{{ request?.request_number }} - {{ request?.user?.name }}</p>
            </div>
          </div>
          
          <!-- Status Badge -->
          <span v-if="request" :class="[
            'px-3 py-1 rounded-full text-xs font-medium border hidden sm:inline-block',
            getStatusColor(request.status)
          ]">
            {{ getStatusLabel(request.status) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      
      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-16">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-primary-50 rounded-2xl">
          <svg class="animate-spin h-8 w-8 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>

      <!-- Warning Banner -->
      <Transition
        enter-active-class="transform ease-out duration-300 transition"
        enter-from-class="translate-y-2 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
      >
        <div v-if="request && !loading" class="mb-6 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg p-4 shadow-sm animate-fadeIn">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm text-amber-700 font-medium">
                {{ t.manualEditWarning }}
              </p>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Edit Form -->
      <form v-if="request" @submit.prevent="handleSubmit" class="space-y-6 animate-fadeIn" style="animation-delay: 0.1s">
        
        <!-- 1. General Info Card -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <h2 class="text-xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-50">{{ t.generalInfo }}</h2>
          
          <div class="space-y-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-semibold text-gray-900 mb-2">{{ t.status }}</label>
                <select
                  v-model="form.status"
                  class="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all cursor-pointer bg-gray-50 hover:bg-white"
                >
                  <option value="pending_review">{{ t.pendingReview }}</option>
                  <option value="quoted">{{ t.quoted }}</option>
                  <option value="paid">{{ t.paid }}</option>
                  <option value="purchased">{{ t.purchased }}</option>
                  <option value="rejected">{{ t.rejected }}</option>
                  <option value="cancelled">{{ t.cancelled }}</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-900 mb-2">{{ t.paymentMethod }}</label>
                <select
                  v-model="form.payment_method"
                  class="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all cursor-pointer bg-gray-50 hover:bg-white"
                >
                  <option value="stripe">{{ t.stripe }}</option>
                  <option value="manual_deposit">{{ t.manualDeposit }}</option>
                </select>
              </div>
            </div>

            <div>
                <label class="block text-sm font-semibold text-gray-900 mb-2">{{ t.adminNotes }}</label>
                <textarea 
                    v-model="form.admin_notes" 
                    rows="3"
                    class="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all resize-none"
                    :placeholder="t.notesPlaceholder"
                ></textarea>
                <p class="mt-1 text-xs text-gray-400">Visible to customer if rejected.</p>
            </div>
          </div>
        </div>

        <!-- 2. Financials Card -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <div class="flex justify-between items-center mb-6 pb-2 border-b border-gray-50">
             <h2 class="text-xl font-bold text-gray-900">{{ t.financials }} ({{ form.currency?.toUpperCase() || 'USD' }})</h2>
             <span class="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded border border-gray-200">Manual Override</span>
          </div>
          
          <div class="space-y-6">
            <!-- Currency Select -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">{{ t.currency }}</label>
              <select
                v-model="form.currency"
                class="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all cursor-pointer bg-gray-50 hover:bg-white"
              >
                <option value="usd">USD - US Dollar</option>
                <option value="mxn">MXN - Peso Mexicano</option>
              </select>
            </div>

            <!-- Your Cost -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">{{ t.yourCost }}</label>
              <p class="text-xs text-gray-500 mb-2">{{ t.yourCostHint }}</p>
              <div class="relative">
                 <span class="absolute left-3 top-3 text-gray-400">{{ currencySymbol }}</span>
                 <input v-model.number="form.items_total" type="number" step="0.01" class="w-full pl-7 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 transition-all">
              </div>
            </div>

            <!-- Customer Pays -->
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="block text-sm font-bold text-gray-900">{{ t.customerPays }}</label>
                <button
                  type="button"
                  @click="applyMargin"
                  class="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors font-medium"
                >
                  {{ t.apply8Percent }}
                </button>
              </div>
              <div class="relative">
                 <span class="absolute left-3 top-3 text-gray-900 font-bold">{{ currencySymbol }}</span>
                 <input v-model.number="form.total_amount" type="number" step="0.01" class="w-full pl-7 pr-4 py-3 rounded-xl border border-gray-300 bg-gray-50 font-bold text-gray-900 focus:ring-2 focus:ring-primary-500 transition-all">
              </div>
            </div>

            <!-- Margin Display -->
            <div class="pt-4 border-t border-gray-100">
              <div class="flex justify-between items-center rounded-xl px-4 py-3 border" :class="marginDisplayClass">
                <span class="text-sm font-medium">{{ t.yourMargin }}</span>
                <div class="text-right">
                  <span class="text-lg font-bold">{{ currencySymbol }}{{ calculatedFee }}</span>
                  <span class="text-sm ml-1">({{ marginPercent }}%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Links Card -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <h2 class="text-xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-50">{{ t.links }}</h2>
          <div>
            <label class="block text-sm font-semibold text-gray-900 mb-2">{{ t.paymentLink }}</label>
            <input v-model="form.payment_link" type="url" class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 text-sm text-blue-600 font-medium bg-blue-50/30">
            <p class="mt-1 text-xs text-gray-400">{{ t.paymentLinkHint }}</p>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row gap-4 sm:justify-between mt-8 pt-4 border-t border-gray-200">
          <NuxtLink
            :to="`/app/shopping/purchase-requests/${requestId}`"
            class="order-2 sm:order-1 px-6 py-3.5 bg-white text-gray-700 font-semibold rounded-xl border border-gray-300 hover:bg-gray-50 transition-all duration-300 text-center shadow-sm hover:shadow"
          >
            {{ t.cancel }}
          </NuxtLink>
          
          <button
            type="submit"
            :disabled="saving || !hasChanges"
            class="order-1 sm:order-2 px-8 py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl shadow-lg hover:from-primary-600 hover:to-primary-700 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
          >
            <span v-if="saving" class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            <span v-if="!saving">{{ t.saveChanges }}</span>
            <span v-else>{{ t.saving }}</span>
          </button>
        </div>
      </form>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";

definePageMeta({
  layout: 'shopping',
  middleware: ['auth', 'shopping'],
});

const { $customFetch, $toast } = useNuxtApp();
const route = useRoute();
const router = useRouter();
const { t: createTranslations } = useLanguage();

const requestId = route.params.id;
const request = ref(null);
const loading = ref(true);
const saving = ref(false);
const originalData = ref(null);

const form = ref({
  status: "",
  payment_method: "stripe",
  admin_notes: "",
  items_total: 0,
  total_amount: 0,
  currency: "usd",
  payment_link: "",
});

// Auto-calculated fee (total - items)
const calculatedFee = computed(() => {
  const fee = (form.value.total_amount || 0) - (form.value.items_total || 0);
  return Math.max(0, fee).toFixed(2);
});

// Margin percentage
const marginPercent = computed(() => {
  const cost = form.value.items_total || 0;
  if (cost <= 0) return '0';
  const fee = (form.value.total_amount || 0) - cost;
  return ((fee / cost) * 100).toFixed(1);
});

// Color coding for margin display
const marginDisplayClass = computed(() => {
  const percent = parseFloat(marginPercent.value);
  if (percent < 5) return 'bg-red-50 border-red-200 text-red-700';
  if (percent < 8) return 'bg-yellow-50 border-yellow-200 text-yellow-700';
  return 'bg-green-50 border-green-200 text-green-700';
});

// Quick apply 8% margin
const applyMargin = () => {
  const cost = form.value.items_total || 0;
  form.value.total_amount = Math.round(cost * 1.08 * 100) / 100;
};

const translations = {
  editRequest: { es: "Editar Solicitud", en: "Edit Request" },
  manualEditWarning: {
    es: "Estás en modo de edición manual. Los cambios aquí NO envían correos ni actualizan facturas de Stripe.",
    en: "You are in manual edit mode. Changes here do NOT send emails or update Stripe invoices.",
  },
  generalInfo: { es: "Información General", en: "General Information" },
  status: { es: "Estado", en: "Status" },
  paymentMethod: { es: "Método de Pago", en: "Payment Method" },
  stripe: { es: "Stripe (Factura)", en: "Stripe (Invoice)" },
  manualDeposit: { es: "Depósito Manual (NU Bank)", en: "Manual Deposit (NU Bank)" },
  adminNotes: { es: "Notas de Admin", en: "Admin Notes" },
  financials: { es: "Finanzas", en: "Financials" },
  currency: { es: "Moneda", en: "Currency" },
  yourCost: { es: "Tu Costo", en: "Your Cost" },
  yourCostHint: { es: "Incluye artículos + envío + impuestos", en: "Includes items + shipping + taxes" },
  customerPays: { es: "Cliente Paga", en: "Customer Pays" },
  apply8Percent: { es: "+ 8%", en: "+ 8%" },
  yourMargin: { es: "Tu Ganancia", en: "Your Margin" },
  links: { es: "Enlaces", en: "Links" },
  paymentLink: { es: "Enlace de Pago", en: "Payment Link" },
  paymentLinkHint: { es: "Solo aplica para pagos con Stripe.", en: "Only applies to Stripe payments." },
  cancel: { es: "Cancelar", en: "Cancel" },
  saveChanges: { es: "Guardar Cambios", en: "Save Changes" },
  saving: { es: "Guardando...", en: "Saving..." },
  notesPlaceholder: {
    es: "Notas para el cliente o internas...",
    en: "Notes for customer or internal...",
  },
  // Statuses
  pendingReview: { es: "Pendiente Revisión", en: "Pending Review" },
  quoted: { es: "Cotizado", en: "Quoted" },
  paid: { es: "Pagado", en: "Paid" },
  purchased: { es: "Comprado", en: "Purchased" },
  rejected: { es: "Rechazado", en: "Rejected" },
  cancelled: { es: "Cancelado", en: "Cancelled" },
};

const t = createTranslations(translations);

const currencySymbol = computed(() => {
  return form.value.currency === 'mxn' ? '$' : '$';
});

const fetchRequest = async () => {
  loading.value = true;
  try {
    const response = await $customFetch(
      `/shopping/purchase-requests/${requestId}`
    );
    const data = response.data || response;
    request.value = data;

    // Calculate sum of items (price * quantity)
    const calculatedTotal =
      data.items?.reduce((sum, item) => {
        return sum + parseFloat(item.price || 0) * parseInt(item.quantity || 1);
      }, 0) || 0;

    form.value = {
      status: data.status,
      payment_method: data.payment_method || "stripe",
      admin_notes: data.admin_notes || "",
      items_total: data.items_total || calculatedTotal.toFixed(2),
      total_amount: data.total_amount,
      currency: data.currency || "usd",
      payment_link: data.payment_link || "",
    };

    originalData.value = JSON.parse(JSON.stringify(form.value));
  } catch (e) {
    console.error(e);
    $toast.error("Error loading request");
  } finally {
    loading.value = false;
  }
};

const hasChanges = computed(() => {
  return JSON.stringify(form.value) !== JSON.stringify(originalData.value);
});

const getStatusColor = (status) => {
  const map = {
    pending_review: "bg-yellow-100 text-yellow-800 border-yellow-200",
    quoted: "bg-blue-100 text-blue-800 border-blue-200",
    paid: "bg-primary-100 text-primary-800 border-primary-200",
    purchased: "bg-green-100 text-green-800 border-green-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
    cancelled: "bg-gray-100 text-gray-800 border-gray-200",
  };
  return map[status] || "bg-gray-100 text-gray-600";
};

const getStatusLabel = (status) => status?.replace("_", " ").toUpperCase();

const handleSubmit = async () => {
  saving.value = true;
  try {
    const response = await $customFetch(
      `/shopping/purchase-requests/${requestId}`,
      {
        method: "PUT",
        body: form.value,
      }
    );

    if (response.success) {
      $toast.success("Updated successfully");
      router.push(`/app/shopping/purchase-requests/${requestId}`);
    }
  } catch (e) {
    console.error(e);
    $toast.error("Error updating request");
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  fetchRequest();
});
</script>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fadeIn {
  animation: fadeIn 0.6s ease-out forwards;
  opacity: 0;
}
</style>