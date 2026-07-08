<template>
  <div class="rounded-2xl border border-gray-200 bg-white p-4 max-w-md shadow-sm">
    <!-- header -->
    <div class="flex items-center justify-between gap-2">
      <div class="min-w-0">
        <p class="text-[14px] font-extrabold text-gray-900 flex items-center gap-1.5">
          {{ o.order_type === 'crossing' ? '🛃' : '🚚' }} Envío {{ o.order_number }}
        </p>
        <p class="text-[11px] text-gray-400 mt-0.5">{{ o.item_count }} artículo{{ o.item_count === 1 ? '' : 's' }}<span v-if="o.tracking_number"> · Guía {{ o.tracking_number }}</span></p>
      </div>
      <span :class="['shrink-0 text-[11px] font-bold px-2.5 py-0.5 rounded-full', badge.badge]">{{ badge.label }}</span>
    </div>

    <!-- cancelled banner -->
    <div v-if="o.status === 'cancelled'" class="mt-3 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-[12.5px] text-red-700 font-semibold">
      Este pedido fue cancelado.
    </div>

    <!-- progress timeline -->
    <ol v-else class="mt-4 space-y-0">
      <li v-for="(st, i) in stages" :key="st.key" class="relative flex items-start gap-3 pb-4 last:pb-0">
        <!-- connector line -->
        <span v-if="i < stages.length - 1" :class="['absolute left-[9px] top-5 bottom-0 w-0.5', i < currentIndex ? 'bg-primary-400' : 'bg-gray-200']"></span>
        <!-- node -->
        <span :class="['relative z-10 mt-0.5 grid place-items-center w-[19px] h-[19px] rounded-full shrink-0 transition-colors', i < currentIndex ? 'bg-primary-500 text-white' : i === currentIndex ? 'bg-primary-500 text-white ring-4 ring-primary-100' : 'bg-gray-200 text-gray-400']">
          <svg v-if="i < currentIndex" class="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 011.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z" clip-rule="evenodd"/></svg>
          <span v-else-if="i === currentIndex" class="w-1.5 h-1.5 rounded-full bg-white"></span>
        </span>
        <!-- label -->
        <div class="min-w-0 -mt-0.5">
          <p :class="['text-[13.5px] leading-tight', i === currentIndex ? 'font-bold text-gray-900' : i < currentIndex ? 'font-medium text-gray-700' : 'text-gray-400']">{{ st.label }}</p>
          <p v-if="i === currentIndex && subline" class="text-[11.5px] text-gray-400 mt-0.5">{{ subline }}</p>
        </div>
      </li>
    </ol>

    <!-- footer -->
    <div class="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
      <span v-if="o.eta" class="text-[11.5px] text-gray-500">📅 Entrega estimada: <span class="font-semibold text-gray-700">{{ o.eta }}</span></span>
      <span v-else class="text-[11px] text-gray-400">Creado {{ o.created }}</span>
      <NuxtLink :to="`/app/orders/${o.id}`" class="text-[12px] font-semibold text-primary-600 hover:text-primary-700 active:scale-95 transition-transform">Ver detalles →</NuxtLink>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({ order: { type: Object, default: () => ({}) } })
const { getCustomerStatus } = useOrderStatus()

const o = computed(() => {
  const raw = props.order || {}
  return {
    id: raw.id,
    order_number: raw.order_number || '—',
    status: raw.status || 'collecting',
    order_type: raw.order_type || 'shipping',
    tracking_number: raw.tracking_number || null,
    item_count: raw.item_count ?? (Array.isArray(raw.items) ? raw.items.length : 0),
    eta: raw.eta || raw.estimated_delivery_date || null,
    created: raw.created || null,
  }
})
const badge = computed(() => getCustomerStatus(props.order || {}))

// Customer-facing journeys (mirrors useOrderStatus customer maps). Shipping is the
// flagship flow; crossing (Las Americas pickup) has its own stages.
const SHIPPING_STAGES = [
  { key: 'transfer', label: 'En transferencia a México' },
  { key: 'received', label: 'Recibido en México' },
  { key: 'quote', label: 'Cotización lista' },
  { key: 'paid', label: 'Pagado' },
]
const CROSSING_STAGES = [
  { key: 'awaiting', label: 'Esperando paquetes' },
  { key: 'warehouse', label: 'En bodega' },
  { key: 'crossing', label: 'Cruzando a México' },
  { key: 'ready', label: 'Listo para recoger' },
]
// status → stage index per order type.
const SHIP_IDX = { collecting: 0, awaiting_packages: 0, packages_complete: 1, awaiting_payment: 2, processing: 2, paid: 3, shipped: 3, delivered: 3 }
const CROSS_IDX = { collecting: 0, awaiting_packages: 0, packages_complete: 1, processing: 2, awaiting_payment: 2, shipped: 3, paid: 3, delivered: 3 }

const isCrossing = computed(() => o.value.order_type === 'crossing')
const stages = computed(() => (isCrossing.value ? CROSSING_STAGES : SHIPPING_STAGES))
const currentIndex = computed(() => {
  const map = isCrossing.value ? CROSS_IDX : SHIP_IDX
  return map[o.value.status] ?? 0
})
const subline = computed(() => {
  const s = o.value.status
  if (s === 'awaiting_payment') return 'Revisa tu cotización y paga para continuar.'
  if (s === 'paid') return '¡Listo! Tu pago fue recibido.'
  if (s === 'packages_complete') return 'Tus paquetes llegaron a nuestra bodega.'
  return 'Te avisamos en cuanto avance.'
})
</script>
