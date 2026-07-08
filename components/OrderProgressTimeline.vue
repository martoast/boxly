<!-- components/OrderProgressTimeline.vue -->
<template>
  <div class="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-lg font-semibold text-gray-900">{{ t.orderProgress }}</h2>
      <span class="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-full">
        <span class="relative flex h-1.5 w-1.5">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-70"></span>
          <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary-500"></span>
        </span>
        {{ currentLabel }}
      </span>
    </div>

    <!-- Horizontal stepper — an endless wave of light ripples through each phase -->
    <div class="px-1 pt-2 pb-1">
      <div class="flex">
        <div
          v-for="(step, i) in steps"
          :key="i"
          class="relative flex-1 flex flex-col items-center text-center px-1"
          :style="{ '--i': i }"
        >
          <!-- connector from the previous dot -->
          <span
            v-if="i > 0"
            class="absolute top-5 right-1/2 left-[-50%] h-0.5 rounded-full transition-colors duration-300"
            :class="steps[i - 1].state === 'done' ? (steps[i - 1].success ? 'bg-emerald-500' : 'bg-primary-500') : 'bg-gray-200'"
          ></span>

          <!-- dot -->
          <span
            class="pt-dot relative z-10 grid place-items-center w-10 h-10 rounded-full ring-1 transition-all duration-300"
            :class="[dotClass(step), step.state === 'active' ? 'pt-active' : '']"
          >
            <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" :d="step.icon" /></svg>
            <span v-if="step.state === 'done'" class="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-white grid place-items-center">
              <span class="w-3.5 h-3.5 rounded-full grid place-items-center" :class="step.success ? 'bg-emerald-500' : 'bg-primary-600'">
                <svg class="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" stroke-width="3.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
              </span>
            </span>
          </span>

          <p class="mt-2.5 text-[11px] sm:text-xs font-semibold leading-tight" :class="step.state === 'pending' ? 'text-gray-400' : 'text-gray-800'">{{ step.label }}</p>
          <span v-if="step.state === 'active'" class="mt-1 inline-block text-[9px] font-bold uppercase tracking-wide text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">{{ t.now }}</span>
          <span v-else-if="step.state === 'done' && step.date" class="mt-1 text-[10px] text-gray-400">{{ formatDate(step.date) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  order: { type: Object, required: true },
});

const user = useUser().value;
const { t: createTranslations } = useLanguage();

const isCrossing = computed(() => props.order.order_type === 'crossing')

const ICON = {
  doc: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  inbox: "M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4",
  truck: "M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1",
  camera: "M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9zM15 13a3 3 0 11-6 0 3 3 0 016 0z",
  plane: "M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5",
  store: "M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z",
}

const shippingStatusOrder = ["collecting", "awaiting_packages", "packages_complete", "awaiting_payment", "processing", "paid", "shipped", "delivered"];
const crossingStatusOrder = ["collecting", "awaiting_packages", "packages_complete", "processing", "shipped", "paid", "delivered"];

const isStatusReached = (targetStatus) => {
  const statusOrder = isCrossing.value ? crossingStatusOrder : shippingStatusOrder;
  return statusOrder.indexOf(props.order.status) >= statusOrder.indexOf(targetStatus);
};

const crossingPaidDone = computed(() => !!props.order.paid_at || !!props.order.deposit_paid_at || isStatusReached('paid'))
const crossingPaidDate = computed(() => props.order.paid_at || props.order.deposit_paid_at)

// Three customer-facing milestones (we don't track the San Diego arrival, so we
// don't show it): Registrada → En México (crossed/received — where updates begin)
// → Enviado (plane). Crossing swaps the last stage for pickup-ready.
const steps = computed(() => {
  const s = props.order.status
  if (isCrossing.value) {
    return [
      { label: t.value.stepRegistered, icon: ICON.doc, state: 'done', date: props.order.created_at },
      { label: t.value.stepMexico, icon: ICON.camera, state: isStatusReached('shipped') ? 'done' : ['collecting', 'awaiting_packages', 'packages_complete', 'processing'].includes(s) ? 'active' : 'pending' },
      { label: t.value.stepReady, icon: ICON.store, success: true, state: s === 'delivered' ? 'done' : ['shipped', 'paid'].includes(s) ? 'active' : 'pending', date: crossingPaidDone.value ? crossingPaidDate.value : null },
    ]
  }
  return [
    { label: t.value.stepRegistered, icon: ICON.doc, state: 'done', date: props.order.created_at },
    { label: t.value.stepMexico, icon: ICON.camera, state: isStatusReached('processing') ? 'done' : ['collecting', 'awaiting_packages', 'packages_complete', 'awaiting_payment'].includes(s) ? 'active' : 'pending' },
    { label: t.value.stepShipped, icon: ICON.plane, success: true, state: isStatusReached('shipped') ? 'done' : ['paid', 'processing'].includes(s) ? 'active' : 'pending' },
  ]
})

const dotClass = (step) =>
  step.state === 'done'
    ? (step.success ? 'bg-emerald-600 ring-0 text-white shadow-sm shadow-emerald-500/30' : 'bg-primary-600 ring-0 text-white shadow-sm shadow-primary-500/30')
    : step.state === 'active'
      ? 'bg-white ring-primary-500 text-primary-600'
      : 'bg-white ring-gray-200 text-gray-300'

const currentLabel = computed(() => {
  const active = steps.value.find((s) => s.state === 'active')
  if (active) return active.label
  const lastDone = [...steps.value].reverse().find((s) => s.state === 'done')
  return lastDone ? lastDone.label : ''
})

const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const locale = user?.preferred_language === "es" ? "es-MX" : "en-US";
  return d.toLocaleDateString(locale, { month: "short", day: "numeric" });
};

const translations = {
  orderProgress: { es: "Progreso de la Orden", en: "Order Progress" },
  now: { es: "Ahora", en: "Now" },
  stepRegistered: { es: "Registrada", en: "Registered" },
  stepMexico: { es: "En México", en: "In Mexico" },
  stepShipped: { es: "Enviado", en: "Shipped" },
  stepReady: { es: "Listo", en: "Ready" },
};

const t = createTranslations(translations);
</script>

<style scoped>
/* Endless "carousel" cadence: a ping ripple travels dot → dot, forever, so the
   whole journey is always visibly coming into fruition. */
.pt-dot::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 9999px;
  pointer-events: none;
  animation: ptPing 3.4s ease-out infinite;
  animation-delay: calc(var(--i) * 0.45s);
}
@keyframes ptPing {
  0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.45); }
  40%, 100% { box-shadow: 0 0 0 10px rgba(37, 99, 235, 0); }
}
/* the current phase keeps a persistent ring so "you are here" is always clear */
.pt-active { box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.14); }

@media (prefers-reduced-motion: reduce) {
  .pt-dot::after { animation: none; }
}
</style>
