<!-- components/user/UserOrderStatusBanner.vue -->
<template>
  <div
    v-if="banner"
    class="relative overflow-hidden rounded-2xl bg-white ring-1 ring-gray-900/5 shadow-sm p-5 sm:p-6 transition-all duration-300 ease-out hover:shadow-md hover:-translate-y-0.5"
  >
    <!-- faint gradient wash for a high-tech feel -->
    <div class="pointer-events-none absolute -top-16 -right-10 w-52 h-52 rounded-full blur-3xl opacity-60" :class="tone.wash"></div>

    <div class="relative flex flex-col sm:flex-row sm:items-center gap-4">
      <!-- gradient icon tile -->
      <div class="w-12 h-12 rounded-2xl grid place-items-center text-white shadow-md flex-shrink-0" :class="tone.tile">
        <svg class="w-6 h-6" :class="banner.spin ? 'animate-spin' : ''" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" :d="banner.icon" /></svg>
      </div>

      <div class="flex-1 min-w-0 text-center sm:text-left">
        <div class="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
          <h3 class="text-base sm:text-lg font-bold text-gray-900">{{ banner.title }}</h3>
          <span v-if="banner.badge" class="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">✓ {{ banner.badge }}</span>
        </div>
        <p class="text-sm text-gray-500 mt-0.5">{{ banner.desc }}</p>
        <p v-if="banner.amount" class="text-2xl font-extrabold text-gray-900 mt-2 tracking-tight">{{ banner.amount }}</p>
      </div>

      <!-- CTA or status chip -->
      <div class="flex-shrink-0 w-full sm:w-auto">
        <NuxtLink
          v-if="banner.cta && banner.cta.kind === 'link'"
          :to="banner.cta.to"
          class="cta-btn"
          :class="tone.btn"
        >{{ banner.cta.label }}</NuxtLink>
        <button
          v-else-if="banner.cta && banner.cta.kind === 'complete'"
          @click="$emit('complete')"
          class="cta-btn"
          :class="tone.btn"
        >{{ banner.cta.label }}</button>
        <a
          v-else-if="banner.cta && banner.cta.kind === 'external'"
          :href="banner.cta.href"
          target="_blank"
          rel="noopener"
          class="cta-btn"
          :class="tone.btn"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          {{ banner.cta.label }}
        </a>
        <span
          v-else-if="banner.chip"
          class="inline-flex items-center justify-center gap-1.5 w-full sm:w-auto px-4 py-2 rounded-xl text-sm font-semibold"
          :class="tone.chip"
        >
          <span class="relative flex h-1.5 w-1.5"><span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-70" :class="tone.dot"></span><span class="relative inline-flex rounded-full h-1.5 w-1.5" :class="tone.dot"></span></span>
          {{ banner.chip }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps(['order'])
defineEmits(['complete', 'reopen'])
const { t: createTranslations } = useLanguage()

const status = computed(() => props.order?.status)
const hasItems = computed(() => props.order?.items?.length > 0)
const isCrossing = computed(() => props.order?.order_type === 'crossing')

const ICON = {
  store: "M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z",
  plus: "M12 4v16m8-8H4",
  check: "M5 13l4 4L19 7",
  spin: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
  card: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
  plane: "M13 10V3L4 14h7v7l9-11h-7z",
  coin: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  checkCircle: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
}

const TONES = {
  primary: { tile: 'bg-gradient-to-br from-primary-500 to-indigo-600', wash: 'bg-primary-400/30', btn: 'bg-primary-600 hover:bg-primary-500', chip: 'bg-primary-50 text-primary-700', dot: 'bg-primary-500' },
  info:    { tile: 'bg-gradient-to-br from-sky-500 to-blue-600',       wash: 'bg-sky-400/30',     btn: 'bg-primary-600 hover:bg-primary-500', chip: 'bg-sky-50 text-sky-700',       dot: 'bg-sky-500' },
  pay:     { tile: 'bg-gradient-to-br from-amber-500 to-orange-600',   wash: 'bg-amber-400/30',   btn: 'bg-gray-900 hover:bg-black',          chip: 'bg-amber-50 text-amber-700',   dot: 'bg-amber-500' },
  ship:    { tile: 'bg-gradient-to-br from-indigo-500 to-violet-600',  wash: 'bg-indigo-400/30',  btn: 'bg-primary-600 hover:bg-primary-500', chip: 'bg-indigo-50 text-indigo-700', dot: 'bg-indigo-500' },
  success: { tile: 'bg-gradient-to-br from-emerald-500 to-green-600',  wash: 'bg-emerald-400/30', btn: 'bg-emerald-600 hover:bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
}

const banner = computed(() => {
  const o = props.order
  if (!o) return null
  const s = status.value
  const cur = (o.currency || '').toUpperCase()

  if (s === 'collecting' && !hasItems.value)
    return { tone: 'primary', icon: ICON.plus, title: t.value.collectingNoItemsTitle, desc: t.value.collectingNoItemsDescription, cta: { kind: 'link', to: `/app/orders/${o.id}/items`, label: t.value.addItems } }
  if (s === 'collecting' && hasItems.value)
    return { tone: 'primary', icon: ICON.check, title: t.value.completeOrderTitle, desc: t.value.completeOrderDesc, cta: { kind: 'complete', label: t.value.completeOrder } }
  if (['packages_complete', 'processing'].includes(s))
    return { tone: 'info', icon: s === 'processing' ? ICON.spin : ICON.check, spin: s === 'processing', title: s === 'processing' ? t.value.processingTitle : t.value.packagesCompleteTitle, desc: s === 'processing' ? t.value.processingDescription : t.value.packagesCompleteDescription, chip: t.value.inProgress }
  // Crossing: `shipped` means "ready for pickup in Tijuana" — not "in transit".
  if (isCrossing.value && s === 'shipped') {
    const link = o.payment_link || o.deposit_payment_link
    const amt = o.quoted_amount ?? o.deposit_amount
    return { tone: 'pay', icon: ICON.store, title: t.value.readyPickupTitle, desc: t.value.readyPickupDesc, amount: (link && amt) ? `$${amt} ${cur}` : null, cta: link ? { kind: 'external', href: link, label: t.value.payAndPickup } : null, chip: link ? null : t.value.readyChip }
  }
  if (s === 'shipped' && !o.deposit_paid_at && o.deposit_payment_link)
    return { tone: 'pay', icon: ICON.card, title: t.value.depositRequiredTitle, desc: t.value.depositRequiredDesc, amount: `$${o.deposit_amount} ${cur}`, cta: { kind: 'external', href: o.deposit_payment_link, label: t.value.payDeposit } }
  if (s === 'shipped')
    return { tone: 'ship', icon: ICON.plane, title: t.value.shippedTitle, desc: t.value.shippedDescription, badge: o.deposit_paid_at ? t.value.depositPaid : null, chip: t.value.inTransit }
  if (s === 'awaiting_payment')
    return { tone: 'pay', icon: ICON.coin, title: t.value.finalPaymentTitle, desc: t.value.finalPaymentDesc, amount: `$${o.quoted_amount} ${cur}`, cta: o.payment_link ? { kind: 'external', href: o.payment_link, label: t.value.payBalance } : null }
  if (s === 'paid')
    return { tone: 'success', icon: ICON.checkCircle, title: t.value.orderComplete, desc: t.value.orderCompleteDesc }
  return null
})

const tone = computed(() => TONES[banner.value?.tone] || TONES.primary)

const translations = {
  collectingNoItemsTitle: { es: "Comienza tu envío", en: "Start Your Shipment" },
  collectingNoItemsDescription: { es: "Agrega los productos que vas a enviar.", en: "Add the products you are going to ship." },
  addItems: { es: "Agregar Artículos", en: "Add Items" },
  completeOrderTitle: { es: "Completa tu Orden", en: "Complete Your Order" },
  completeOrderDesc: { es: "Si ya agregaste todos tus artículos, completa la orden.", en: "If you've added all items, complete the order." },
  completeOrder: { es: "Completar Orden", en: "Complete Order" },
  reopenOrder: { es: "Reabrir Orden", en: "Reopen Order" },
  processingTitle: { es: "Procesando", en: "Processing" },
  processingDescription: { es: "Estamos preparando tu envío.", en: "We are preparing your shipment." },
  packagesCompleteTitle: { es: "Paquetes Recibidos", en: "Packages Received" },
  packagesCompleteDescription: { es: "Tus paquetes han llegado. Pronto iniciaremos el proceso.", en: "Your packages have arrived. We will start processing soon." },
  inProgress: { es: "En Progreso", en: "In Progress" },
  depositRequiredTitle: { es: "¡Orden Enviada! Depósito Requerido", en: "Order Shipped! Deposit Required" },
  depositRequiredDesc: { es: "Tu paquete está en camino. Paga el 50% de depósito para continuar.", en: "Your package is on its way. Pay the 50% deposit to continue." },
  payDeposit: { es: "Pagar Depósito", en: "Pay Deposit" },
  shippedTitle: { es: "En Camino", en: "On Its Way" },
  shippedDescription: { es: "Tu paquete ha sido enviado.", en: "Your package has been shipped." },
  depositPaid: { es: "Depósito Pagado", en: "Deposit Paid" },
  inTransit: { es: "En Tránsito", en: "In Transit" },
  finalPaymentTitle: { es: "Pago Final Requerido", en: "Final Payment Required" },
  finalPaymentDesc: { es: "Tu paquete fue entregado. Paga el saldo restante.", en: "Your package was delivered. Please pay the remaining balance." },
  payBalance: { es: "Pagar Saldo", en: "Pay Balance" },
  orderComplete: { es: "¡Orden Completada!", en: "Order Complete!" },
  orderCompleteDesc: { es: "Gracias por tu pago. Tu orden ha finalizado.", en: "Thank you for your payment. Your order is complete." },
  readyPickupTitle: { es: "¡Listo para Recoger!", en: "Ready for Pickup!" },
  readyPickupDesc: { es: "Tu caja ya está en nuestra bodega de Tijuana, lista para que la recojas.", en: "Your box is at our Tijuana warehouse, ready for pickup." },
  payAndPickup: { es: "Pagar y Recoger", en: "Pay & Pick Up" },
  readyChip: { es: "Listo", en: "Ready" },
}
const t = createTranslations(translations)
</script>

<style scoped>
.cta-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  transition: background-color 0.2s ease, transform 0.1s ease;
}
.cta-btn:active { transform: scale(0.99); }
@media (min-width: 640px) { .cta-btn { width: auto; } }
</style>
