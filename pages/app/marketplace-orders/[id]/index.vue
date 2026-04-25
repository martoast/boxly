<template>
  <section class="min-h-screen bg-gray-50">

    <!-- Header -->
    <div class="bg-white shadow-sm border-b border-gray-100">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
        <NuxtLink to="/app/marketplace-orders" class="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </NuxtLink>
        <div class="flex-1 min-w-0">
          <h1 class="text-lg font-bold text-gray-900 font-mono truncate">{{ order?.order_number ?? '...' }}</h1>
        </div>
        <StatusBadge v-if="order" :status="order.status" />
      </div>
    </div>

    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center min-h-[40vh]">
        <div class="w-12 h-12 border-3 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <div v-else-if="order" class="space-y-5">

        <!-- Success banner (after Stripe redirect) -->
        <div v-if="$route.query.status === 'success'" class="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
          <svg class="w-6 h-6 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
          <p class="text-green-900 font-medium text-sm">{{ t.successBanner }}</p>
        </div>

        <!-- Status-specific primary card -->
        <!-- Collecting → "Pedir envío" -->
        <div v-if="order.status === 'collecting'" class="bg-gradient-to-br from-primary-50 to-blue-50 border border-primary-200 rounded-2xl p-5">
          <h2 class="font-bold text-gray-900 mb-2">{{ t.collectingTitle }}</h2>
          <p class="text-sm text-gray-600 mb-4">{{ t.collectingBody }}</p>

          <div class="grid grid-cols-2 gap-3 mb-4">
            <div class="bg-white rounded-xl p-3">
              <p class="text-xs text-gray-400 uppercase tracking-wider">{{ t.totalWeight }}</p>
              <p class="font-bold text-gray-900 text-lg">{{ totalWeightKg.toFixed(2) }} kg</p>
            </div>
            <div class="bg-white rounded-xl p-3">
              <p class="text-xs text-gray-400 uppercase tracking-wider">{{ t.estBox }}</p>
              <p class="font-bold text-gray-900 text-lg">{{ estBoxLabel }}</p>
            </div>
          </div>

          <p class="text-xs text-gray-500 leading-relaxed mb-4">
            {{ t.shippingDisclaimer }}
          </p>

          <div class="grid sm:grid-cols-2 gap-3">
            <NuxtLink to="/shop" class="text-center py-3 bg-white border border-primary-200 text-primary-700 font-semibold rounded-xl hover:bg-primary-50 transition-colors">
              {{ t.keepShopping }}
            </NuxtLink>
            <button
              @click="requestShipment"
              :disabled="!canRequest || requesting"
              class="py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 transition-colors"
            >
              {{ requesting ? t.requesting : t.requestShipment }}
            </button>
          </div>
        </div>

        <!-- Awaiting shipping payment → "Pagar envío" -->
        <div v-if="order.status === 'awaiting_shipping_payment'" class="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5">
          <h2 class="font-bold text-gray-900 mb-2">{{ t.shippingReadyTitle }}</h2>
          <p class="text-sm text-gray-700 mb-4">
            {{ t.shippingReadyBody.replace('{box}', order.box_size) }}
          </p>
          <p class="text-3xl font-extrabold text-gray-900 mb-4">
            ${{ formatPrice(order.box_price_cents) }} <span class="text-sm font-medium text-gray-500">MXN</span>
          </p>
          <a
            v-if="order.shipping_payment_link"
            :href="order.shipping_payment_link"
            target="_blank"
            rel="noopener"
            class="inline-block w-full text-center py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg shadow-amber-500/30 transition-colors"
          >
            {{ t.payShipping }}
          </a>
        </div>

        <!-- Shipped -->
        <div v-if="order.status === 'shipped' || order.status === 'delivered'" class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 class="font-bold text-gray-900 mb-3">{{ order.status === 'delivered' ? t.deliveredTitle : t.shippedTitle }}</h2>
          <dl class="space-y-2 text-sm">
            <div v-if="order.guia_number" class="flex justify-between">
              <dt class="text-gray-500">{{ t.tracking }}</dt>
              <dd class="text-gray-900 font-mono font-medium">{{ order.guia_number }}</dd>
            </div>
            <div v-if="order.estimated_delivery_date" class="flex justify-between">
              <dt class="text-gray-500">{{ t.estDelivery }}</dt>
              <dd class="text-gray-900 font-medium">{{ formatDate(order.estimated_delivery_date) }}</dd>
            </div>
            <div v-if="order.actual_delivery_date" class="flex justify-between">
              <dt class="text-gray-500">{{ t.deliveredOn }}</dt>
              <dd class="text-gray-900 font-medium">{{ formatDate(order.actual_delivery_date) }}</dd>
            </div>
          </dl>
        </div>

        <!-- Items -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100">
            <h2 class="font-semibold text-gray-900">{{ t.items }}</h2>
          </div>
          <div class="divide-y divide-gray-100">
            <div v-for="item in order.items" :key="item.id" class="p-4 flex items-center gap-4">
              <div class="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                <img v-if="item.image_url_snapshot" :src="item.image_url_snapshot" :alt="item.name_snapshot" class="w-full h-full object-cover" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-medium text-gray-900 line-clamp-2">{{ item.name_snapshot }}</p>
                <p class="text-xs text-gray-400 mt-1">{{ t.qty }}: {{ item.quantity }} · {{ Number(item.weight_kg_snapshot).toFixed(2) }} kg c/u</p>
              </div>
              <div class="text-right shrink-0">
                <p class="font-bold text-gray-900">${{ formatPrice(item.price_cents_snapshot * item.quantity) }}</p>
                <p class="text-xs text-gray-400 mt-0.5">${{ formatPrice(item.price_cents_snapshot) }} c/u</p>
              </div>
            </div>
          </div>
          <div class="px-5 py-4 border-t border-gray-100 bg-gray-50 flex justify-between items-baseline">
            <span class="text-sm font-semibold text-gray-700">{{ t.productsPaid }}</span>
            <span class="text-xl font-extrabold text-gray-900">${{ formatPrice(order.items_subtotal_cents) }} <span class="text-xs font-medium text-gray-500">MXN</span></span>
          </div>
        </div>

        <!-- Shipping address -->
        <div v-if="order.shipping_address?.full_address" class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 class="font-semibold text-gray-900 mb-2">{{ t.shippingAddress }}</h2>
          <p class="text-sm text-gray-600 leading-relaxed">{{ order.shipping_address.full_address }}</p>
        </div>

        <!-- Cancel CTA (when allowed) -->
        <div v-if="canCancel" class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between gap-4">
          <p class="text-sm text-gray-500">{{ t.cancelHint }}</p>
          <button
            @click="cancelOrder"
            :disabled="cancelling"
            class="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
          >
            {{ cancelling ? '...' : t.cancel }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import StatusBadge from '~/components/store/MarketplaceStatusBadge.vue'

definePageMeta({
  middleware: ['auth'],
})

const { $customFetch } = useNuxtApp()
const { t: createTranslations } = useLanguage()
const route = useRoute()
const router = useRouter()
const toast = useToast()

const t = createTranslations({
  successBanner:    { es: 'Pago recibido. Productos agregados a tu envío.', en: 'Payment received. Items added to your shipment.' },
  collectingTitle:  { es: 'Tu envío sigue acumulando productos', en: 'Your shipment is still collecting items' },
  collectingBody:   { es: 'Sigue agregando productos para llenar tu caja y bajar tu costo por kg. Cuando estés listo, pídenos enviar.', en: 'Keep adding products to fill your box and lower your per-kg cost. When ready, request shipment.' },
  totalWeight:      { es: 'Peso total', en: 'Total weight' },
  estBox:           { es: 'Caja estimada', en: 'Estimated box' },
  shippingDisclaimer:{ es: 'El precio del envío se confirma cuando Boxly consolida tu caja en San Diego.', en: 'Shipping price is confirmed when Boxly consolidates your box in San Diego.' },
  keepShopping:     { es: 'Seguir comprando', en: 'Keep shopping' },
  requestShipment:  { es: 'Pedir envío →', en: 'Request shipment →' },
  requesting:       { es: 'Procesando...', en: 'Processing...' },
  shippingReadyTitle:{ es: 'Tu envío está listo para pagar', en: 'Your shipment is ready for shipping payment' },
  shippingReadyBody:{ es: 'Consolidamos tu envío en una caja {box}. Paga el envío para que salga a México.', en: 'We consolidated your shipment into a {box} box. Pay shipping to send it to Mexico.' },
  payShipping:      { es: 'Pagar envío con Stripe', en: 'Pay shipping with Stripe' },
  shippedTitle:     { es: '🚚 Tu envío está en camino', en: '🚚 Your shipment is on the way' },
  deliveredTitle:   { es: '✅ Entregado', en: '✅ Delivered' },
  tracking:         { es: 'Guía', en: 'Tracking' },
  estDelivery:      { es: 'Entrega estimada', en: 'Estimated delivery' },
  deliveredOn:      { es: 'Entregado el', en: 'Delivered on' },
  items:            { es: 'Productos', en: 'Items' },
  qty:              { es: 'Cant', en: 'Qty' },
  productsPaid:     { es: 'Total productos', en: 'Products total' },
  shippingAddress:  { es: 'Dirección de envío', en: 'Shipping address' },
  cancel:           { es: 'Cancelar pedido', en: 'Cancel order' },
  cancelling:       { es: 'Cancelando...', en: 'Cancelling...' },
  cancelHint:       { es: 'Puedes cancelar mientras los productos no han llegado al almacén.', en: 'You can cancel while products haven\'t arrived at the warehouse.' },
})

const BOX_TIERS = [
  { size: 'XS', weight: 8 },
  { size: 'S',  weight: 15 },
  { size: 'M',  weight: 25 },
  { size: 'L',  weight: 35 },
  { size: 'XL', weight: 50 },
]

const order = ref(null)
const loading = ref(true)
const requesting = ref(false)
const cancelling = ref(false)

const totalWeightKg = computed(() =>
  (order.value?.items ?? []).reduce((s, i) => s + Number(i.weight_kg_snapshot) * i.quantity, 0)
)

const estBoxLabel = computed(() => {
  const w = totalWeightKg.value
  if (w <= 0) return '—'
  if (w > 50) return '> XL'
  return BOX_TIERS.find(t => w <= t.weight)?.size ?? '—'
})

const canRequest = computed(() => {
  if (!order.value) return false
  if (order.value.status !== 'collecting') return false
  if ((order.value.items ?? []).length === 0) return false
  // All items must be paid (status !== pending_payment)
  return ! (order.value.items ?? []).some(i => i.status === 'pending_payment')
})

const canCancel = computed(() =>
  order.value && ['collecting', 'ready_to_ship'].includes(order.value.status)
)

const formatPrice = (cents) => (cents / 100).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const formatDate = (d) => new Date(d).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })

const fetchOrder = async () => {
  loading.value = true
  try {
    const res = await $customFetch(`/marketplace/orders/${route.params.id}`)
    order.value = res.data
  } catch (err) {
    console.error(err)
    toast.error('No se pudo cargar el pedido.')
  } finally {
    loading.value = false
  }
}

const requestShipment = async () => {
  if (!canRequest.value) return
  requesting.value = true
  try {
    const res = await $customFetch(`/marketplace/orders/${order.value.id}/request-shipment`, {
      method: 'POST',
    })
    order.value = res.data
    toast.success('Envío solicitado. Boxly se encargará desde aquí.')
  } catch (err) {
    toast.error(err?.data?.message ?? 'No se pudo solicitar el envío.')
  } finally {
    requesting.value = false
  }
}

const cancelOrder = async () => {
  if (!canCancel.value) return
  if (!confirm('¿Seguro que quieres cancelar este pedido?')) return
  cancelling.value = true
  try {
    const res = await $customFetch(`/marketplace/orders/${order.value.id}/cancel`, {
      method: 'POST',
    })
    order.value = res.data
    toast.success('Pedido cancelado.')
  } catch (err) {
    toast.error(err?.data?.message ?? 'No se pudo cancelar.')
  } finally {
    cancelling.value = false
  }
}

onMounted(fetchOrder)
</script>
