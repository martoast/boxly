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
const stage = computed(() => {
  switch (props.order?.status) {
    case 'collecting':
    case 'awaiting_packages': return 'transfer'
    case 'packages_complete': return 'received'
    case 'awaiting_payment': return 'quote'
    case 'processing':
    case 'paid': return 'preparing'
    case 'shipped': return 'shipped'
    case 'delivered': return 'delivered'
    case 'cancelled': return 'cancelled'
    default: return 'transfer'
  }
})

const COPY = {
  transfer: {
    es: { label: 'En transferencia a México', desc: 'Tu pedido fue registrado correctamente. El siguiente paso es que tu paquete sea entregado en nuestra dirección de San Diego y posteriormente trasladado a México. Normalmente toma 1–2 días hábiles después de la entrega en San Diego.', next: 'Cuando tu paquete sea recibido en México.' },
    en: { label: 'In transfer to Mexico', desc: 'Your order was registered. Next, the store delivers your package to our San Diego address and BOXLY crosses it into Mexico — usually 1–2 business days after it arrives in San Diego.', next: 'When your package is received in Mexico.' },
    showFlow: true, payLater: true,
  },
  received: {
    es: { label: 'Recibido en México', desc: '¡Tu paquete ya llegó a México! Estamos preparando tu cotización.', next: 'Cuando tu cotización esté lista.' },
    en: { label: 'Received in Mexico', desc: 'Your package is now in Mexico! We are preparing your quote.', next: 'When your quote is ready.' },
    payLater: true,
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
  transfer:  { cardClass: 'border-blue-200 bg-blue-50/60', labelClass: 'text-blue-600', dotClass: 'bg-blue-500 animate-pulse', borderClass: 'border-blue-200', accentText: 'text-blue-500' },
  received:  { cardClass: 'border-blue-200 bg-blue-50/60', labelClass: 'text-blue-600', dotClass: 'bg-blue-500', borderClass: 'border-blue-200', accentText: 'text-blue-500' },
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
      'BOXLY recoge los paquetes en bloque (normalmente al día siguiente).',
      'BOXLY cruza los paquetes a México (1–2 días hábiles).',
      'Al recibirlo en México, generamos tu cotización.',
      'Solo pagas cuando tu paquete ya está en México.',
    ]
  : [
      'The store delivers your package to our San Diego address.',
      'BOXLY picks up packages in bulk (usually the next day).',
      'BOXLY crosses the packages into Mexico (1–2 business days).',
      'Once received in Mexico, we generate your quote.',
      'You only pay once your package is in Mexico.',
    ])
</script>
