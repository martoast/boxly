<template>
  <section class="min-h-screen bg-gray-50">

    <div class="bg-white shadow-sm border-b border-gray-100">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
        <NuxtLink to="/app/admin/marketplace-orders" class="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </NuxtLink>
        <div class="flex-1 min-w-0">
          <h1 class="font-bold text-gray-900 font-mono">{{ order?.order_number ?? '...' }}</h1>
          <p v-if="order" class="text-xs text-gray-500">{{ order.user?.name }} · {{ order.user?.email }}</p>
        </div>
        <StatusBadge v-if="order" :status="order.status" />
      </div>
    </div>

    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div v-if="loading" class="text-center py-12 text-gray-400">Cargando...</div>

      <div v-else-if="order" class="space-y-5">

        <!-- Assign Box panel (when ready_to_ship or packing) -->
        <div v-if="canAssignBox" class="bg-gradient-to-br from-primary-50 to-blue-50 border border-primary-200 rounded-2xl p-5">
          <h2 class="font-bold text-gray-900 mb-1">Asignar caja y enviar cotización</h2>
          <p class="text-sm text-gray-600 mb-4">Total declarado: <strong>{{ totalWeightKg.toFixed(2) }} kg</strong> · Sugerencia: <strong>{{ suggestedBox }}</strong></p>

          <div class="grid grid-cols-5 gap-2 mb-4">
            <button
              v-for="tier in BOX_TIERS"
              :key="tier.size"
              @click="selectedBox = tier.size; boxPriceCents = tier.price_cents"
              :class="[
                selectedBox === tier.size
                  ? 'border-primary-500 ring-2 ring-primary-200 bg-white'
                  : 'border-gray-200 bg-white hover:border-primary-300',
                'rounded-xl border-2 p-3 text-center transition-all'
              ]"
            >
              <p class="text-lg font-extrabold text-gray-900">{{ tier.size }}</p>
              <p class="text-xs text-gray-400">≤{{ tier.weight }}kg</p>
              <p class="text-xs font-semibold text-primary-600 mt-1">${{ formatPrice(tier.price_cents) }}</p>
            </button>
          </div>

          <div class="grid sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Precio (MXN)</label>
              <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input v-model.number="boxPriceDisplay" type="number" min="0" step="0.01" class="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Entrega estimada</label>
              <input v-model="estDelivery" type="date" class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>

          <button
            @click="assignBox"
            :disabled="!selectedBox || assigning"
            class="w-full py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 transition-colors"
          >
            {{ assigning ? 'Generando factura...' : 'Asignar caja y enviar factura' }}
          </button>
        </div>

        <!-- Awaiting shipping payment -->
        <div v-if="order.status === 'awaiting_shipping_payment'" class="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <h2 class="font-bold text-gray-900 mb-1">Esperando pago de envío</h2>
          <p class="text-sm text-gray-700 mb-3">Caja {{ order.box_size }} · ${{ formatPrice(order.box_price_cents) }} MXN</p>
          <a v-if="order.shipping_payment_link" :href="order.shipping_payment_link" target="_blank" class="text-primary-600 text-sm font-semibold hover:text-primary-700">
            Ver factura en Stripe →
          </a>
        </div>

        <!-- Shipping paid → upload GIA + mark shipped -->
        <div v-if="order.status === 'shipping_paid'" class="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
          <h2 class="font-bold text-gray-900 mb-3">Listo para enviar</h2>

          <label class="block w-full cursor-pointer mb-3">
            <input type="file" accept="application/pdf,image/*" class="hidden" @change="onGiaSelect" />
            <div class="border-2 border-dashed border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50/50 rounded-xl py-4 text-center">
              <p class="text-sm font-medium text-emerald-700">{{ giaFile ? giaFile.name : 'Subir GIA (PDF o imagen)' }}</p>
            </div>
          </label>

          <input v-model="guiaNumber" placeholder="Número de guía" class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-primary-500" />
          <input v-model="estDelivery" type="date" class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-primary-500" />

          <div class="grid grid-cols-2 gap-2">
            <button @click="uploadGia" :disabled="!giaFile || uploadingGia" class="py-2.5 bg-white border border-emerald-300 text-emerald-700 font-semibold rounded-xl hover:bg-emerald-50 disabled:opacity-50">
              {{ uploadingGia ? 'Subiendo...' : 'Subir GIA' }}
            </button>
            <button @click="markShipped" :disabled="marking" class="py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20">
              Marcar enviado
            </button>
          </div>
        </div>

        <!-- Shipped/Delivered -->
        <div v-if="['shipped','delivered'].includes(order.status)" class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 class="font-bold text-gray-900 mb-3">{{ order.status === 'delivered' ? 'Entregado' : 'En tránsito' }}</h2>
          <dl class="space-y-2 text-sm">
            <div class="flex justify-between"><dt class="text-gray-500">Guía</dt><dd class="font-mono">{{ order.guia_number ?? '—' }}</dd></div>
            <div class="flex justify-between"><dt class="text-gray-500">Caja</dt><dd>{{ order.box_size }} (${{ formatPrice(order.box_price_cents) }})</dd></div>
            <div v-if="order.estimated_delivery_date" class="flex justify-between"><dt class="text-gray-500">Entrega estimada</dt><dd>{{ order.estimated_delivery_date }}</dd></div>
          </dl>
          <button v-if="order.status === 'shipped'" @click="markDelivered" class="mt-4 w-full py-2.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl">
            Marcar entregado
          </button>
        </div>

        <!-- Items -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 class="font-semibold text-gray-900">Productos</h2>
            <p class="text-sm text-gray-500">{{ totalItems }} productos · {{ totalWeightKg.toFixed(2) }} kg</p>
          </div>
          <div class="divide-y divide-gray-100">
            <div v-for="item in order.items" :key="item.id" class="p-4 flex items-center gap-4">
              <div class="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                <img v-if="item.image_url_snapshot" :src="item.image_url_snapshot" alt="" class="w-full h-full object-cover" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-medium text-gray-900 line-clamp-2">{{ item.name_snapshot }}</p>
                <p class="text-xs text-gray-400">Cant: {{ item.quantity }} · ${{ formatPrice(item.price_cents_snapshot) }} c/u · {{ Number(item.weight_kg_snapshot).toFixed(2) }}kg</p>
              </div>
              <div class="shrink-0">
                <button
                  v-if="item.status === 'ordered'"
                  @click="markItemReceived(item)"
                  class="px-3 py-1.5 text-xs font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg"
                >
                  Marcar recibido
                </button>
                <button
                  v-else-if="item.status === 'received'"
                  @click="unmarkItemReceived(item)"
                  class="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg"
                  title="Quitar marca de recibido"
                >
                  ✓ Recibido
                </button>
                <span v-else class="text-xs text-gray-400 italic">{{ item.status }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Address -->
        <div v-if="order.shipping_address?.full_address" class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 class="font-semibold text-gray-900 mb-2">Dirección de envío</h2>
          <p class="text-sm text-gray-600 leading-relaxed">{{ order.shipping_address.full_address }}</p>
        </div>

        <!-- Refund -->
        <div v-if="canRefund" class="bg-red-50 border border-red-200 rounded-2xl p-5">
          <h3 class="font-bold text-red-900 mb-1">Reembolsar pedido</h3>
          <p class="text-sm text-red-700 mb-3">Restaura stock + reembolsa al cliente vía Stripe.</p>
          <textarea v-model="refundReason" placeholder="Razón del reembolso..." rows="2" class="w-full rounded-xl border border-red-200 px-4 py-2 text-sm mb-2"></textarea>
          <button @click="refund" :disabled="refunding || !refundReason.trim()" class="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white font-semibold rounded-xl transition-colors">
            {{ refunding ? 'Procesando...' : 'Reembolsar' }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import StatusBadge from '~/components/store/MarketplaceStatusBadge.vue'

definePageMeta({
  middleware: ['auth', 'admin'],
})

const { $customFetch } = useNuxtApp()
const route = useRoute()
const toast = useToast()

const BOX_TIERS = [
  { size: 'XS', weight: 8,  price_cents: 120000 },
  { size: 'S',  weight: 15, price_cents: 220000 },
  { size: 'M',  weight: 25, price_cents: 400000 },
  { size: 'L',  weight: 35, price_cents: 510000 },
  { size: 'XL', weight: 50, price_cents: 625000 },
]

const order = ref(null)
const loading = ref(true)

const selectedBox = ref(null)
const boxPriceCents = ref(0)
const estDelivery = ref('')
const assigning = ref(false)

const giaFile = ref(null)
const guiaNumber = ref('')
const uploadingGia = ref(false)
const marking = ref(false)

const refundReason = ref('')
const refunding = ref(false)

const boxPriceDisplay = computed({
  get: () => boxPriceCents.value / 100,
  set: (v) => { boxPriceCents.value = Math.round(Number(v || 0) * 100) },
})

const totalWeightKg = computed(() =>
  (order.value?.items ?? []).reduce((s, i) => s + Number(i.weight_kg_snapshot) * i.quantity, 0)
)

const totalItems = computed(() =>
  (order.value?.items ?? []).reduce((s, i) => s + i.quantity, 0)
)

const suggestedBox = computed(() => {
  const w = totalWeightKg.value
  if (w <= 0) return '—'
  if (w > 50) return '> XL (split needed)'
  return BOX_TIERS.find(t => w <= t.weight)?.size ?? '—'
})

const canAssignBox = computed(() =>
  order.value && ['ready_to_ship', 'packing'].includes(order.value.status)
)

const canRefund = computed(() =>
  order.value && !['shipped', 'delivered', 'refunded', 'cancelled'].includes(order.value.status)
)

const formatPrice = (cents) => (cents / 100).toLocaleString('es-MX', { minimumFractionDigits: 2 })

const fetchOrder = async () => {
  loading.value = true
  try {
    const res = await $customFetch(`/admin/marketplace-orders/${route.params.id}`)
    order.value = res.data
    if (order.value.box_size) selectedBox.value = order.value.box_size
    if (order.value.box_price_cents) boxPriceCents.value = order.value.box_price_cents
    if (order.value.estimated_delivery_date) estDelivery.value = order.value.estimated_delivery_date
    if (order.value.guia_number) guiaNumber.value = order.value.guia_number
  } catch (err) {
    toast.error('No se pudo cargar el pedido.')
  } finally {
    loading.value = false
  }
}

const markItemReceived = async (item) => {
  try {
    const res = await $customFetch(`/admin/marketplace-orders/${order.value.id}/items/${item.id}/mark-received`, { method: 'PUT' })
    order.value = res.data
    toast.success('Producto marcado recibido.')
  } catch { toast.error('Falló.') }
}

const unmarkItemReceived = async (item) => {
  try {
    const res = await $customFetch(`/admin/marketplace-orders/${order.value.id}/items/${item.id}/unmark-received`, { method: 'PUT' })
    order.value = res.data
  } catch { toast.error('Falló.') }
}

const assignBox = async () => {
  if (!selectedBox.value) return
  assigning.value = true
  try {
    const res = await $customFetch(`/admin/marketplace-orders/${order.value.id}/assign-box`, {
      method: 'POST',
      body: {
        box_size: selectedBox.value,
        box_price_cents: boxPriceCents.value,
        estimated_delivery_date: estDelivery.value || undefined,
      },
    })
    order.value = res.data
    toast.success('Factura de envío enviada al cliente.')
  } catch (err) {
    toast.error(err?.data?.message ?? 'Falló al asignar caja.')
  } finally {
    assigning.value = false
  }
}

const onGiaSelect = (e) => {
  giaFile.value = e.target.files?.[0] ?? null
}

const uploadGia = async () => {
  if (!giaFile.value) return
  uploadingGia.value = true
  try {
    const fd = new FormData()
    fd.append('gia', giaFile.value)
    if (guiaNumber.value) fd.append('guia_number', guiaNumber.value)
    const res = await $customFetch(`/admin/marketplace-orders/${order.value.id}/upload-gia`, {
      method: 'POST',
      body: fd,
    })
    order.value = res.data
    giaFile.value = null
    toast.success('GIA subida.')
  } catch (err) {
    toast.error('Falló la subida.')
  } finally {
    uploadingGia.value = false
  }
}

const markShipped = async () => {
  if (!confirm('¿Marcar como enviado?')) return
  marking.value = true
  try {
    const res = await $customFetch(`/admin/marketplace-orders/${order.value.id}/mark-shipped`, {
      method: 'POST',
      body: {
        guia_number: guiaNumber.value || undefined,
        estimated_delivery_date: estDelivery.value || undefined,
      },
    })
    order.value = res.data
    toast.success('Marcado como enviado.')
  } catch (err) {
    toast.error(err?.data?.message ?? 'Falló.')
  } finally {
    marking.value = false
  }
}

const markDelivered = async () => {
  if (!confirm('¿Marcar como entregado?')) return
  try {
    const res = await $customFetch(`/admin/marketplace-orders/${order.value.id}/mark-delivered`, { method: 'POST' })
    order.value = res.data
    toast.success('Marcado como entregado.')
  } catch (err) {
    toast.error(err?.data?.message ?? 'Falló.')
  }
}

const refund = async () => {
  if (!refundReason.value.trim()) return
  if (!confirm('¿Reembolsar este pedido?')) return
  refunding.value = true
  try {
    const res = await $customFetch(`/admin/marketplace-orders/${order.value.id}/refund`, {
      method: 'POST',
      body: { reason: refundReason.value.trim() },
    })
    order.value = res.data
    refundReason.value = ''
    toast.success('Reembolso procesado.')
  } catch (err) {
    toast.error(err?.data?.message ?? 'Falló el reembolso.')
  } finally {
    refunding.value = false
  }
}

onMounted(fetchOrder)
</script>
