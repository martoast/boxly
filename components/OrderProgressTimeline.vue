<!-- components/OrderProgressTimeline.vue -->
<template>
  <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <div class="px-4 sm:px-6 py-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900">
          {{ t.orderProgress }}
        </h2>
        <!-- Order Type Badge -->

      </div>
    </div>

    <div class="p-4 sm:p-6">
      <!-- Progress Steps -->
      <div class="relative">
        <!-- Vertical line -->
        <div
          class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"
          aria-hidden="true"
        ></div>

        <!-- SHIPPING ORDER TIMELINE (5 steps mapped to statuses:
             created → awaiting_packages/packages_complete → awaiting_payment → shipped → delivered) -->
        <div v-if="!isCrossing" class="space-y-6 relative">

          <!-- Step 1: Order Registered -->
          <div class="flex items-start gap-4">
            <div class="relative flex-shrink-0">
              <div :class="['w-8 h-8 rounded-full flex items-center justify-center', order.created_at ? 'bg-primary-600' : 'bg-gray-200']">
                <svg v-if="order.created_at" class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <div v-else class="w-3 h-3 rounded-full bg-white"></div>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <p :class="['text-sm font-medium', order.created_at ? 'text-gray-900' : 'text-gray-500']">{{ t.orderRegistered }}</p>
              <p v-if="order.created_at" class="text-xs text-gray-600 mt-0.5">{{ formatDate(order.created_at) }}</p>
              <p v-if="order.items?.length" class="text-xs text-gray-500 mt-1">{{ order.items.length }} {{ t.itemsAddedCount }}</p>
            </div>
          </div>

          <!-- Step 2: Awaiting Reception in Mexico -->
          <div class="flex items-start gap-4">
            <div class="relative flex-shrink-0">
              <div :class="['w-8 h-8 rounded-full flex items-center justify-center', receivedDone ? 'bg-primary-600' : 'bg-gray-200']">
                <svg v-if="receivedDone" class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <div v-else-if="receivingActive" class="w-3 h-3 rounded-full bg-amber-400 animate-pulse"></div>
                <div v-else class="w-3 h-3 rounded-full bg-white"></div>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <p :class="['text-sm font-medium', receivedDone || receivingActive ? 'text-gray-900' : 'text-gray-500']">{{ t.waitingReceptionMx }}</p>
              <p :class="['text-xs mt-0.5', receivedDone ? 'text-gray-600' : receivingActive ? 'text-amber-600' : 'text-gray-400']">
                {{ receivedDone ? t.allPackagesReceived : receivingActive ? t.waitingForPackages : t.pendingPackages }}
              </p>
            </div>
          </div>

          <!-- Step 3: Quote Ready (awaiting_payment) -->
          <div class="flex items-start gap-4">
            <div class="relative flex-shrink-0">
              <div :class="['w-8 h-8 rounded-full flex items-center justify-center', quoteDone ? 'bg-primary-600' : 'bg-gray-200']">
                <svg v-if="quoteDone" class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <div v-else-if="quoteActive" class="w-3 h-3 rounded-full bg-amber-400 animate-pulse"></div>
                <div v-else class="w-3 h-3 rounded-full bg-white"></div>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <p :class="['text-sm font-medium', quoteDone || quoteActive ? 'text-gray-900' : 'text-gray-500']">{{ t.quoteReady }}</p>
              <p :class="['text-xs mt-0.5', quoteDone ? 'text-gray-600' : quoteActive ? 'text-amber-600' : 'text-gray-400']">
                {{ quoteDone ? t.quoteReadyDesc : quoteActive ? t.quotePreparingDesc : t.pending }}
              </p>
            </div>
          </div>

          <!-- Step 4: Shipped -->
          <div class="flex items-start gap-4">
            <div class="relative flex-shrink-0">
              <div :class="['w-8 h-8 rounded-full flex items-center justify-center', shippedDone ? 'bg-indigo-600' : 'bg-gray-200']">
                <svg v-if="shippedDone" class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <div v-else-if="shippingActive" class="w-3 h-3 rounded-full bg-amber-400 animate-pulse"></div>
                <div v-else class="w-3 h-3 rounded-full bg-white"></div>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <p :class="['text-sm font-medium', shippedDone || shippingActive ? 'text-gray-900' : 'text-gray-500']">{{ t.shippedLabel }}</p>
              <p v-if="order.shipped_at" class="text-xs text-gray-600 mt-0.5">{{ formatDate(order.shipped_at) }}</p>
              <p v-else :class="['text-xs mt-0.5', shippingActive ? 'text-amber-600' : 'text-gray-400']">
                {{ shippingActive ? t.preparingShipment : t.pendingShipment }}
              </p>
            </div>
          </div>

          <!-- Step 5: Delivered (Final) -->
          <div class="flex items-start gap-4">
            <div class="relative flex-shrink-0">
              <div :class="['w-8 h-8 rounded-full flex items-center justify-center', deliveredDone ? 'bg-green-600' : 'bg-gray-200']">
                <svg v-if="deliveredDone" class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <div v-else-if="deliveryActive" class="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
                <div v-else class="w-3 h-3 rounded-full bg-white"></div>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <p :class="['text-sm font-medium', deliveredDone ? 'text-gray-900' : 'text-gray-500']">{{ t.delivered }}</p>
              <p v-if="order.delivered_at" class="text-xs text-green-600 mt-0.5">{{ t.orderCompleteDesc }} - {{ formatDate(order.delivered_at) }}</p>
              <p v-else :class="['text-xs mt-0.5', deliveryActive ? 'text-green-600' : 'text-gray-400']">
                {{ deliveryActive ? t.inTransit : t.pendingDelivery }}
              </p>
            </div>
          </div>

        </div>

        <!-- CROSSING ORDER TIMELINE -->
        <div v-else class="space-y-6 relative">

          <!-- Step 1: Order Created -->
          <div class="flex items-start gap-4">
            <div class="relative flex-shrink-0">
              <div :class="['w-8 h-8 rounded-full flex items-center justify-center', order.created_at ? 'bg-primary-600' : 'bg-gray-200']">
                <svg v-if="order.created_at" class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <div v-else class="w-3 h-3 rounded-full bg-white"></div>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <p :class="['text-sm font-medium', order.created_at ? 'text-gray-900' : 'text-gray-500']">{{ t.orderCreated }}</p>
              <p v-if="order.created_at" class="text-xs text-gray-600 mt-0.5">{{ formatDate(order.created_at) }}</p>
              <p v-if="order.items?.length" class="text-xs text-gray-500 mt-1">{{ order.items.length }} {{ t.itemsAddedCount }}</p>
            </div>
          </div>

          <!-- Step 2: Packages at Warehouse -->
          <div class="flex items-start gap-4">
            <div class="relative flex-shrink-0">
              <div :class="['w-8 h-8 rounded-full flex items-center justify-center', isStatusReached('packages_complete') ? 'bg-primary-600' : 'bg-gray-200']">
                <svg v-if="isStatusReached('packages_complete')" class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <div v-else-if="order.status === 'awaiting_packages'" class="w-3 h-3 rounded-full bg-amber-400 animate-pulse"></div>
                <div v-else class="w-3 h-3 rounded-full bg-white"></div>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <p :class="['text-sm font-medium', isStatusReached('packages_complete') ? 'text-gray-900' : 'text-gray-500']">{{ t.packagesAtWarehouse }}</p>
              <p :class="['text-xs mt-0.5', isStatusReached('packages_complete') ? 'text-gray-600' : order.status === 'awaiting_packages' ? 'text-amber-600' : 'text-gray-400']">
                {{ isStatusReached('packages_complete') ? t.allPackagesReceived : order.status === 'awaiting_packages' ? t.waitingForPackages : t.pendingPackages }}
              </p>
            </div>
          </div>

          <!-- Step 3: Crossing Border -->
          <div class="flex items-start gap-4">
            <div class="relative flex-shrink-0">
              <div :class="['w-8 h-8 rounded-full flex items-center justify-center', isStatusReached('processing') ? 'bg-primary-600' : 'bg-gray-200']">
                <svg v-if="isStatusReached('processing')" class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <div v-else-if="order.status === 'packages_complete'" class="w-3 h-3 rounded-full bg-amber-400 animate-pulse"></div>
                <div v-else class="w-3 h-3 rounded-full bg-white"></div>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <p :class="['text-sm font-medium', isStatusReached('processing') ? 'text-gray-900' : 'text-gray-500']">{{ t.crossingBorder }}</p>
              <p :class="['text-xs mt-0.5', isStatusReached('processing') ? 'text-gray-600' : order.status === 'packages_complete' ? 'text-amber-600' : 'text-gray-400']">
                {{ isStatusReached('processing') ? t.crossingToMexico : order.status === 'packages_complete' ? t.readyToCross : t.pendingCrossing }}
              </p>
              <p v-if="order.processing_started_at" class="text-xs text-gray-500 mt-1">{{ formatDate(order.processing_started_at) }}</p>
            </div>
          </div>

          <!-- Step 4: Ready for Pickup -->
          <div class="flex items-start gap-4">
            <div class="relative flex-shrink-0">
              <div :class="['w-8 h-8 rounded-full flex items-center justify-center', isStatusReached('shipped') ? 'bg-amber-600' : 'bg-gray-200']">
                <svg v-if="isStatusReached('shipped')" class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <div v-else-if="order.status === 'processing'" class="w-3 h-3 rounded-full bg-amber-400 animate-pulse"></div>
                <div v-else class="w-3 h-3 rounded-full bg-white"></div>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <p :class="['text-sm font-medium', isStatusReached('shipped') ? 'text-gray-900' : 'text-gray-500']">{{ t.readyForPickup }}</p>
              <p :class="['text-xs mt-0.5', isStatusReached('shipped') ? 'text-amber-600' : order.status === 'processing' ? 'text-amber-600' : 'text-gray-400']">
                {{ isStatusReached('shipped') ? t.readyAtWarehouse : order.status === 'processing' ? t.preparingForPickup : t.pendingReady }}
              </p>
            </div>
          </div>

          <!-- Step 5: Full Payment (100%) -->
          <div class="flex items-start gap-4">
            <div class="relative flex-shrink-0">
              <div :class="['w-8 h-8 rounded-full flex items-center justify-center', order.deposit_paid_at || isStatusReached('paid') ? 'bg-green-600' : 'bg-gray-200']">
                <svg v-if="order.deposit_paid_at || isStatusReached('paid')" class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <div v-else-if="order.status === 'shipped' && !order.deposit_paid_at" class="w-3 h-3 rounded-full bg-orange-400 animate-pulse"></div>
                <div v-else class="w-3 h-3 rounded-full bg-white"></div>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <p :class="['text-sm font-medium', order.deposit_paid_at || isStatusReached('paid') ? 'text-gray-900' : 'text-gray-500']">{{ t.fullPaymentStatus }}</p>
              <p v-if="order.deposit_paid_at" class="text-xs text-green-600 mt-0.5">{{ t.paymentConfirmed }} ({{ formatDate(order.deposit_paid_at) }})</p>
              <p v-else-if="order.status === 'shipped'" class="text-xs text-orange-600 font-medium mt-0.5">{{ t.paymentRequired }}</p>
              <p v-else class="text-xs text-gray-400 mt-0.5">{{ t.pendingPayment }}</p>
            </div>
          </div>

          <!-- Step 6: Picked Up -->
          <div class="flex items-start gap-4">
            <div class="relative flex-shrink-0">
              <div :class="['w-8 h-8 rounded-full flex items-center justify-center', isStatusReached('delivered') ? 'bg-green-600' : 'bg-gray-200']">
                <svg v-if="isStatusReached('delivered')" class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <div v-else-if="order.deposit_paid_at && !isStatusReached('delivered')" class="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
                <div v-else class="w-3 h-3 rounded-full bg-white"></div>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <p :class="['text-sm font-medium', isStatusReached('delivered') ? 'text-gray-900' : 'text-gray-500']">{{ t.pickedUp }}</p>
              <p v-if="order.delivered_at" class="text-xs text-green-600 mt-0.5">{{ t.orderCompleteDesc }} - {{ formatDate(order.delivered_at) }}</p>
              <p v-else-if="order.deposit_paid_at" class="text-xs text-green-600 mt-0.5">{{ t.readyToCollect }}</p>
              <p v-else class="text-xs text-gray-400 mt-0.5">{{ t.pendingPickup }}</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  order: {
    type: Object,
    required: true,
  },
});

const user = useUser().value;
const { t: createTranslations } = useLanguage();

// Check if this is a crossing order
const isCrossing = computed(() => props.order.order_type === 'crossing')

// Status order for SHIPPING (New Flow)
// packages_complete → awaiting_payment → processing → shipped → delivered
const shippingStatusOrder = [
  "collecting",
  "awaiting_packages",
  "packages_complete",
  "awaiting_payment",
  "processing",
  "paid",      // Legacy status - treat same as processing
  "shipped",
  "delivered",
];

// Status order for CROSSING (different flow!)
const crossingStatusOrder = [
  "collecting",
  "awaiting_packages",
  "packages_complete",
  "processing",
  "shipped",  // Ready for pickup
  "paid",     // Payment received
  "delivered", // Picked up
];

const isStatusReached = (targetStatus) => {
  const statusOrder = isCrossing.value ? crossingStatusOrder : shippingStatusOrder;
  const currentIndex = statusOrder.indexOf(props.order.status);
  const targetIndex = statusOrder.indexOf(targetStatus);
  return currentIndex >= targetIndex;
};

// ── Shipping timeline (5 steps) — done (✓) states, cumulative via status order ──
const receivedDone = computed(() => isStatusReached('packages_complete'))   // Step 2
const quoteDone = computed(() => isStatusReached('awaiting_payment'))        // Step 3 (quote/invoice generated)
const shippedDone = computed(() => isStatusReached('shipped'))              // Step 4
const deliveredDone = computed(() => isStatusReached('delivered'))          // Step 5

// ── Shipping timeline — active (current, pulsing) states ──
const receivingActive = computed(() => ['collecting', 'awaiting_packages'].includes(props.order.status))
const quoteActive = computed(() => props.order.status === 'packages_complete')
const shippingActive = computed(() => ['awaiting_payment', 'processing', 'paid'].includes(props.order.status))
const deliveryActive = computed(() => props.order.status === 'shipped')

const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const locale = user?.preferred_language === "es" ? "es-MX" : "en-US";
  return d.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const translations = {
  orderProgress: { es: "Progreso de la Orden", en: "Order Progress" },
  shipping: { es: "Envío", en: "Shipping" },

  // Common
  itemsAddedCount: { es: "artículo(s)", en: "item(s)" },
  orderCreated: { es: "Orden Creada", en: "Order Created" },
  packagesAtWarehouse: { es: "Paquetes en Almacén", en: "Packages at Warehouse" },
  allPackagesReceived: { es: "Todos los paquetes recibidos", en: "All packages received" },
  waitingForPackages: { es: "Esperando llegada de paquetes", en: "Waiting for packages to arrive" },
  pendingPackages: { es: "Pendiente de recepción", en: "Pending reception" },
  pending: { es: "Pendiente", en: "Pending" },
  orderCompleteDesc: { es: "¡Completado!", en: "Completed!" },
  pendingPayment: { es: "Pendiente de pago del envío", en: "Pending payment" },

  // Shipping specific (5-step flow)
  orderRegistered: { es: "Orden Registrada", en: "Order Registered" },
  waitingReceptionMx: { es: "Esperando recepción en México", en: "Awaiting Reception in Mexico" },
  quoteReady: { es: "Cotización lista", en: "Quote Ready" },
  quoteReadyDesc: { es: "Cotización generada", en: "Quote generated" },
  quotePreparingDesc: { es: "Preparando cotización", en: "Preparing quote" },
  shippedLabel: { es: "Enviado", en: "Shipped" },
  paymentConfirmed: { es: "Pago Confirmado", en: "Payment Confirmed" },
  paymentRequired: { es: "Pago Requerido", en: "Payment Required" },
  preparingShipment: { es: "Preparando envío", en: "Preparing shipment" },
  pendingShipment: { es: "Pendiente de envío", en: "Pending shipment" },
  delivered: { es: "Entregado", en: "Delivered" },
  inTransit: { es: "En tránsito", en: "In transit" },
  pendingDelivery: { es: "Pendiente de entrega", en: "Pending delivery" },

  // Crossing specific
  crossingBorder: { es: "Cruzando la Frontera", en: "Crossing the Border" },
  crossingToMexico: { es: "Cruzando a México", en: "Crossing to Mexico" },
  readyToCross: { es: "Listo para cruzar", en: "Ready to cross" },
  pendingCrossing: { es: "Pendiente de cruce", en: "Pending crossing" },
  readyForPickup: { es: "Listo para Recoger", en: "Ready for Pickup" },
  readyAtWarehouse: { es: "Disponible en bodega de Tijuana", en: "Available at Tijuana warehouse" },
  preparingForPickup: { es: "Preparando para recolección", en: "Preparing for pickup" },
  pendingReady: { es: "Pendiente", en: "Pending" },
  fullPaymentStatus: { es: "Pago Completo (100%)", en: "Full Payment (100%)" },
  pickedUp: { es: "Recogido", en: "Picked Up" },
  readyToCollect: { es: "Puedes recoger tu paquete", en: "You can pick up your package" },
  pendingPickup: { es: "Pendiente de recolección", en: "Pending pickup" },
};

const t = createTranslations(translations);
</script>

<style scoped>
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
