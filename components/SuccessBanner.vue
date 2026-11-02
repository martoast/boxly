<!-- components/SuccessBanner.vue -->
<!-- One card per order status: icon, short title, one line, and a one-line footer (when to pay, delivery date,
     pickup address). Kept deliberately short (Alex, 2026-11-01: the old banner was too much text). -->
<template>
  <TransitionRoot
    :show="show"
    enter="transition ease-out duration-300"
    enter-from="opacity-0 translate-y-4"
    enter-to="opacity-100 translate-y-0"
    leave="transition ease-in duration-200"
    leave-from="opacity-100 translate-y-0"
    leave-to="opacity-0 translate-y-4"
  >
    <div class="rounded-2xl bg-white ring-1 ring-gray-900/5 shadow-sm">
      <div class="flex items-start gap-3.5 p-4 sm:p-5">
        <div class="w-11 h-11 shrink-0 rounded-full grid place-items-center" :class="tone">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" :d="ICONS[content.icon]" />
          </svg>
        </div>

        <div class="flex-1 min-w-0 pt-0.5">
          <h3 class="text-lg font-bold text-gray-900 leading-tight">{{ content.title }}</h3>
          <p class="mt-1 text-sm text-gray-500 leading-snug">{{ content.message }}</p>
        </div>

        <button
          @click="$emit('dismiss')"
          class="-mt-1 -mr-1 w-8 h-8 shrink-0 grid place-items-center text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
          :aria-label="t.close"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div v-if="content.note" class="flex items-center gap-2.5 border-t border-gray-100 px-4 py-3 sm:px-5">
        <svg class="w-4 h-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" :d="ICONS[content.noteIcon]" />
        </svg>
        <p class="flex-1 text-sm font-medium text-gray-700">{{ content.note }}</p>
        <a
          v-if="content.mapLink"
          href="https://maps.app.goo.gl/4SsEVjy2D4noFM9n8"
          target="_blank"
          rel="noopener noreferrer"
          class="shrink-0 text-sm font-semibold text-primary-600 hover:text-primary-700"
        >{{ t.map }}</a>
      </div>
    </div>
  </TransitionRoot>
</template>

<script setup>
import { TransitionRoot } from '@headlessui/vue'
import { computed, onMounted } from 'vue'

const { $confetti } = useNuxtApp()
const { t: createTranslations } = useLanguage()

const props = defineProps({
  show: { type: Boolean, required: true },
  order: { type: Object, required: true },
  trigger: { type: String, default: 'auto' }, // 'auto', 'just_completed', 'status_change'
})

defineEmits(['dismiss'])

const isCrossing = computed(() => props.order?.order_type === 'crossing')

const t = createTranslations({
  close: { es: 'Cerrar', en: 'Close' },
  map: { es: 'Ver mapa', en: 'Map' },
  addItems: { es: 'Agrega los productos que compraste en línea.', en: 'Add the items you bought online.' },
  addItemsNote: { es: 'Nombre, tienda y número de rastreo si lo tienes.', en: 'Name, store, and tracking number if you have it.' },
  weNotify: { es: 'Te avisaremos cuando recibamos tus paquetes en San Diego.', en: "We'll let you know when your packages reach San Diego." },
  thanks: { es: 'Gracias por confiar en Boxly.', en: 'Thanks for trusting Boxly.' },
  arrivedTitle: { es: '¡Llegaron tus paquetes!', en: 'Your packages arrived!' },

  createdTitle: { es: '¡Orden creada!', en: 'Order created!' },
  payNote: { es: 'Pagas cuando tu caja esté lista para enviarse.', en: 'You pay when your box is ready to ship.' },
  packingMessage: { es: 'Estamos armando tu caja consolidada.', en: "We're building your consolidated box." },
  shippedTitle: { es: '¡Tu caja va en camino!', en: 'Your box is on its way!' },
  shippedMessage: { es: 'Pronto recibirás tu número de guía.', en: "You'll get your tracking number soon." },
  eta: { es: 'Entrega estimada:', en: 'Estimated delivery:' },
  deliveredTitle: { es: '¡Caja entregada!', en: 'Box delivered!' },

  crossingCreatedTitle: { es: '¡Orden de cruce creada!', en: 'Crossing order created!' },
  crossingPayNote: { es: 'Pagas cuando esté lista para recoger en Tijuana.', en: 'You pay when it is ready for pickup in Tijuana.' },
  crossingMessage: { es: 'Los estamos cruzando a Tijuana.', en: "We're crossing them to Tijuana." },
  crossingReadyNote: { es: 'Te avisaremos cuando estén listos para recoger.', en: "We'll let you know when they're ready for pickup." },
  readyTitle: { es: '¡Listo para recoger!', en: 'Ready for pickup!' },
  readyMessage: { es: 'Paga tu orden y trae tu identificación. Lun–Vie, 9:00–18:00.', en: 'Pay your order and bring your ID. Mon–Fri, 9 AM–6 PM.' },
  readyNote: { es: 'Av. Jalisco 2850, Local 5, Col. Madero, Tijuana', en: 'Av. Jalisco 2850, Local 5, Col. Madero, Tijuana' },
  pickedUpTitle: { es: '¡Paquete recogido!', en: 'Package picked up!' },
})

// Heroicons outline paths.
const ICONS = {
  check: 'M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  plus: 'M12 4.5v15m7.5-7.5h-15',
  cube: 'm21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9',
  truck: 'M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12',
  store: 'M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z',
  card: 'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z',
  bell: 'M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0',
  calendar: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5',
  pin: 'M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z',
  list: 'M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z',
}

const TONES = {
  success: 'bg-emerald-50 text-emerald-600',
  primary: 'bg-primary-50 text-primary-600',
  amber: 'bg-amber-50 text-amber-600',
}

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })

// What the card says for the order's status: title, message, icon/tone, and the optional footer line.
const content = computed(() => {
  const s = t.value
  const status = props.order?.status || 'collecting'
  const added = { title: isCrossing.value ? s.crossingCreatedTitle : s.createdTitle, message: s.addItems, icon: 'plus', tone: 'primary', note: s.addItemsNote, noteIcon: 'list' }

  const byStatus = isCrossing.value
    ? {
        collecting: added,
        awaiting_packages: { title: s.crossingCreatedTitle, message: s.weNotify, icon: 'check', tone: 'success', note: s.crossingPayNote, noteIcon: 'card' },
        packages_complete: { title: s.arrivedTitle, message: s.crossingMessage, icon: 'cube', tone: 'primary', note: s.crossingReadyNote, noteIcon: 'bell' },
        shipped: { title: s.readyTitle, message: s.readyMessage, icon: 'store', tone: 'amber', note: s.readyNote, noteIcon: 'pin', mapLink: true },
        delivered: { title: s.pickedUpTitle, message: s.thanks, icon: 'check', tone: 'success' },
      }
    : {
        collecting: added,
        awaiting_packages: { title: s.createdTitle, message: s.weNotify, icon: 'check', tone: 'success', note: s.payNote, noteIcon: 'card' },
        packages_complete: { title: s.arrivedTitle, message: s.packingMessage, icon: 'cube', tone: 'primary', note: s.payNote, noteIcon: 'card' },
        shipped: {
          title: s.shippedTitle, message: s.shippedMessage, icon: 'truck', tone: 'primary',
          note: props.order?.estimated_delivery_date ? `${s.eta} ${formatDate(props.order.estimated_delivery_date)}` : null,
          noteIcon: 'calendar',
        },
        delivered: { title: s.deliveredTitle, message: s.thanks, icon: 'check', tone: 'success' },
      }

  return byStatus[status] || byStatus.awaiting_packages
})

const tone = computed(() => TONES[content.value.tone] || TONES.primary)

// Confetti when the customer has just finished the order (or a box just arrived / is ready for pickup).
const CONFETTI = ['awaiting_packages', 'packages_complete']

onMounted(() => {
  if (!props.show || props.trigger !== 'just_completed') return
  const status = props.order?.status
  if (CONFETTI.includes(status) || (status === 'shipped' && isCrossing.value)) {
    setTimeout(() => $confetti(), 300)
  }
})
</script>
