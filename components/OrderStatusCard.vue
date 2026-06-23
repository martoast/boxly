<!-- components/OrderStatusCard.vue
     Customer-facing "where is my package / what happens next / when do I pay"
     card shown above the timeline for shipping orders. -->
<template>
  <div class="space-y-4">
    <!-- Estado actual -->
    <div :class="['rounded-2xl border p-5', view.cardClass]">
      <p class="text-[11px] font-bold uppercase tracking-wider" :class="view.labelClass">{{ locale === 'es' ? 'Estado actual' : 'Current status' }}</p>
      <div class="flex items-center gap-2 mt-1.5">
        <span :class="['w-2.5 h-2.5 rounded-full', view.dotClass]"></span>
        <h2 class="text-xl font-extrabold text-gray-900">{{ view.label }}</h2>
      </div>
      <p class="text-sm text-gray-600 leading-relaxed mt-2">{{ view.desc }}</p>

      <div v-if="view.next" class="flex items-start gap-2 mt-3 pt-3 border-t" :class="view.borderClass">
        <svg class="w-4 h-4 mt-0.5 shrink-0" :class="view.accentText" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <p class="text-sm text-gray-700"><span class="font-semibold">{{ locale === 'es' ? 'Próxima actualización:' : 'Next update:' }}</span> {{ view.next }}</p>
      </div>

      <div v-if="view.payNow" class="flex items-start gap-2 mt-2">
        <svg class="w-4 h-4 mt-0.5 shrink-0 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
        <p class="text-sm font-semibold text-amber-700">{{ locale === 'es' ? 'Tu cotización está lista — paga para continuar.' : 'Your quote is ready — pay to continue.' }}</p>
      </div>
      <p v-else-if="view.payLater" class="text-xs text-gray-500 mt-3">💳 {{ locale === 'es' ? 'Solo pagas cuando tu paquete ya está en México.' : 'You only pay once your package is in Mexico.' }}</p>
    </div>

    <!-- Qué pasa ahora (transfer stage) -->
    <div v-if="view.showFlow" class="rounded-2xl border border-gray-200 bg-white p-5">
      <p class="text-sm font-bold text-gray-900 mb-3">{{ locale === 'es' ? '¿Qué pasa ahora?' : 'What happens now?' }}</p>
      <ol class="space-y-2.5">
        <li v-for="(step, i) in flowSteps" :key="i" class="flex items-start gap-3">
          <span class="shrink-0 w-5 h-5 rounded-full bg-gray-100 text-gray-600 text-[11px] font-bold grid place-items-center mt-0.5">{{ i + 1 }}</span>
          <span class="text-sm text-gray-600 leading-snug">{{ step }}</span>
        </li>
      </ol>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({ order: { type: Object, required: true } })

const user = useUser().value
const locale = computed(() => (user?.preferred_language === 'en' ? 'en' : 'es'))

// status → stage
// Note: `packages_complete` = received at our SAN DIEGO warehouse (not Mexico).
// The quote (awaiting_payment) is only generated once it's received IN MEXICO.
const stage = computed(() => {
  switch (props.order?.status) {
    case 'collecting':
    case 'awaiting_packages': return 'awaiting_sd'
    case 'packages_complete': return 'transfer'
    case 'awaiting_payment': return 'quote'
    case 'processing':
    case 'paid': return 'preparing'
    case 'shipped': return 'shipped'
    case 'delivered': return 'delivered'
    case 'cancelled': return 'cancelled'
    default: return 'awaiting_sd'
  }
})

const COPY = {
  awaiting_sd: {
    es: { label: 'Orden registrada', desc: 'Tu pedido fue registrado correctamente. Ahora esperamos que la tienda entregue tu paquete en nuestra dirección de San Diego. En cuanto llegue, lo trasladamos a México.', next: 'Tu paquete será recibido en México en aproximadamente 2–3 días hábiles después de llegar a San Diego.' },
    en: { label: 'Order registered', desc: 'Your order was registered. We are now waiting for the store to deliver your package to our San Diego address. Once it arrives, we move it to Mexico.', next: 'Your package will be received in Mexico about 2–3 business days after it arrives in San Diego.' },
    showFlow: true, payLater: true,
  },
  transfer: {
    es: { label: 'Recibido en San Diego', desc: 'Tu paquete ya llegó a nuestra dirección de San Diego. BOXLY lo está trasladando a México.', next: 'Tu paquete será recibido en México en aproximadamente 2–3 días hábiles.' },
    en: { label: 'Received in San Diego', desc: 'Your package arrived at our San Diego address. BOXLY is now moving it to Mexico.', next: 'Your package will be received in Mexico in about 2–3 business days.' },
    showFlow: true, payLater: true,
  },
  quote: {
    es: { label: 'Cotización lista', desc: 'Tu cotización ya está lista. Realiza el pago para que preparemos y enviemos tu paquete.', next: 'Cuando confirmemos tu pago.' },
    en: { label: 'Quote ready', desc: 'Your quote is ready. Pay so we can prepare and ship your package.', next: 'When we confirm your payment.' },
    payNow: true,
  },
  preparing: {
    es: { label: 'Preparando tu envío', desc: 'Recibimos tu pago. Estamos preparando tu paquete para enviarlo.', next: 'Cuando tu paquete sea enviado.' },
    en: { label: 'Preparing your shipment', desc: 'We received your payment. We are getting your package ready to ship.', next: 'When your package ships.' },
  },
  shipped: {
    es: { label: 'Enviado', desc: 'Tu paquete va en camino a tu dirección en México.', next: 'Cuando tu paquete sea entregado.' },
    en: { label: 'Shipped', desc: 'Your package is on its way to your address in Mexico.', next: 'When your package is delivered.' },
  },
  delivered: {
    es: { label: 'Entregado', desc: '¡Tu paquete fue entregado! Gracias por comprar con Boxly.', next: null },
    en: { label: 'Delivered', desc: 'Your package was delivered! Thanks for shopping with Boxly.', next: null },
  },
  cancelled: {
    es: { label: 'Cancelado', desc: 'Esta orden fue cancelada.', next: null },
    en: { label: 'Cancelled', desc: 'This order was cancelled.', next: null },
  },
}

const STYLE = {
  awaiting_sd: { cardClass: 'border-blue-200 bg-blue-50/60', labelClass: 'text-blue-600', dotClass: 'bg-blue-500 animate-pulse', borderClass: 'border-blue-200', accentText: 'text-blue-500' },
  transfer:  { cardClass: 'border-blue-200 bg-blue-50/60', labelClass: 'text-blue-600', dotClass: 'bg-blue-500 animate-pulse', borderClass: 'border-blue-200', accentText: 'text-blue-500' },
  quote:     { cardClass: 'border-amber-200 bg-amber-50/70', labelClass: 'text-amber-600', dotClass: 'bg-amber-500 animate-pulse', borderClass: 'border-amber-200', accentText: 'text-amber-500' },
  preparing: { cardClass: 'border-indigo-200 bg-indigo-50/60', labelClass: 'text-indigo-600', dotClass: 'bg-indigo-500 animate-pulse', borderClass: 'border-indigo-200', accentText: 'text-indigo-500' },
  shipped:   { cardClass: 'border-indigo-200 bg-indigo-50/60', labelClass: 'text-indigo-600', dotClass: 'bg-indigo-500 animate-pulse', borderClass: 'border-indigo-200', accentText: 'text-indigo-500' },
  delivered: { cardClass: 'border-green-200 bg-green-50/60', labelClass: 'text-green-600', dotClass: 'bg-green-500', borderClass: 'border-green-200', accentText: 'text-green-500' },
  cancelled: { cardClass: 'border-gray-200 bg-gray-50', labelClass: 'text-gray-500', dotClass: 'bg-gray-400', borderClass: 'border-gray-200', accentText: 'text-gray-400' },
}

const view = computed(() => {
  const s = stage.value
  const c = COPY[s][locale.value]
  return { ...c, ...STYLE[s], showFlow: !!COPY[s].showFlow, payLater: !!COPY[s].payLater, payNow: !!COPY[s].payNow }
})

const flowSteps = computed(() => locale.value === 'es'
  ? [
      'La tienda entrega tu paquete en nuestra dirección de San Diego.',
      'BOXLY recoge los paquetes normalmente al día siguiente.',
      'Trasladamos tu paquete a México.',
      'El traslado y la recepción en México toman normalmente 2–3 días hábiles.',
      'Al llegar a México generamos tu cotización.',
      'Solo pagas cuando tu paquete ya está en México.',
      'Enviamos tu paquete a tu domicilio.',
    ]
  : [
      'The store delivers your package to our San Diego address.',
      'BOXLY picks up packages, usually the next day.',
      'We move your package to Mexico.',
      'Transfer and reception in Mexico usually take 2–3 business days.',
      'Once it arrives in Mexico, we generate your quote.',
      'You only pay once your package is in Mexico.',
      'We ship your package to your address.',
    ])
</script>
