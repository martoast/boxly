<!-- components/SuccessBanner.vue -->
<template>
  <TransitionRoot
    :show="show"
    enter="transition ease-out duration-300"
    enter-from="opacity-0 translate-y-4"
    enter-to="opacity-100 translate-y-0"
    leave="transition ease-in duration-200"
    leave-from="opacity-100 translate-y-0"
    leave-to="opacity-0 translate-y-4"
    @after-enter="handleAfterEnter"
  >
    <div class="relative">
      <div class="relative rounded-2xl bg-white ring-1 ring-gray-900/5 shadow-lg overflow-hidden">
        <!-- soft gradient wash -->
        <div class="pointer-events-none absolute -top-16 -right-10 w-56 h-56 rounded-full blur-3xl opacity-70" :class="tone.wash"></div>

        <!-- Content -->
        <div class="relative p-5 sm:p-6">
          <!-- Close button -->
          <button
            @click="$emit('dismiss')"
            class="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg transition-colors duration-200"
            :aria-label="t.close"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>

          <!-- Main Content -->
          <div class="flex flex-col sm:flex-row sm:items-start sm:gap-4">
            <!-- Gradient icon tile -->
            <div class="flex justify-center sm:justify-start mb-3 sm:mb-0">
              <div class="w-12 h-12 rounded-2xl grid place-items-center text-white shadow-md bg-gradient-to-br" :class="tone.tile">
                <StatusIcon />
              </div>
            </div>

            <!-- Text -->
            <div class="flex-1 text-center sm:text-left pr-0 sm:pr-8">
              <h3 class="text-xl sm:text-2xl font-bold text-gray-900 mb-1.5">
                {{ getTitle() }}
              </h3>
              <p class="text-sm sm:text-base text-gray-500 leading-relaxed">
                {{ getMessage() }}
              </p>

              <!-- Estimated Delivery Date for Shipped Orders (SHIPPING only) -->
              <div v-if="props.order?.status === 'shipped' && !isCrossing && props.order?.estimated_delivery_date"
                   class="mt-4 bg-gray-50 rounded-xl p-3 sm:p-4">
                <div class="flex items-center gap-2 mb-1">
                  <svg class="w-5 h-5" :class="tone.accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  <p class="text-sm font-medium text-gray-500">{{ t.estimatedDelivery }}</p>
                </div>
                <p class="text-base sm:text-lg font-semibold text-gray-900">
                  {{ formatDate(props.order.estimated_delivery_date) }}
                </p>
              </div>

              <!-- Pickup Location for Ready Orders (CROSSING only) -->
              <div v-if="props.order?.status === 'shipped' && isCrossing"
                   class="mt-4 bg-gray-50 rounded-xl p-3 sm:p-4">
                <div class="flex items-center gap-2 mb-2">
                  <svg class="w-5 h-5" :class="tone.accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"/>
                  </svg>
                  <p class="text-sm font-medium text-gray-500">{{ t.pickupLocation }}</p>
                </div>
                <p class="text-base font-semibold text-gray-900">Bodega Boxly - Tijuana</p>
                <p class="text-sm text-gray-500 mt-1">Av. Jalisco 2850, Local 5, Col. Madero (Cacho)</p>
                <a
                  href="https://maps.app.goo.gl/4SsEVjy2D4noFM9n8"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-gray-900 hover:bg-black rounded-lg text-sm font-medium text-white transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {{ t.getDirections }}
                </a>
              </div>

              <!-- Info Box -->
              <div v-if="getNextSteps()" class="mt-4 bg-gray-50 rounded-xl p-3 sm:p-4">
                <p class="text-sm font-semibold text-gray-900 mb-1">
                  {{ getNextSteps().title }}
                </p>
                <p class="text-xs sm:text-sm text-gray-500 leading-relaxed">
                  {{ getNextSteps().message }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </TransitionRoot>
</template>

<script setup>
import { TransitionRoot } from '@headlessui/vue'
import { computed, h, onMounted } from 'vue'

// Get confetti from Nuxt app
const { $confetti } = useNuxtApp()

// Use language composable
const { t: createTranslations } = useLanguage()

// Define props
const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  order: {
    type: Object,
    required: true
  },
  trigger: {
    type: String,
    default: 'auto' // 'auto', 'just_completed', 'status_change'
  }
})

// Define emits
defineEmits(['dismiss'])

// Check if this is a crossing-only order
const isCrossing = computed(() => props.order?.order_type === 'crossing')

// Define translations
const translations = {
  close: {
    es: 'Cerrar',
    en: 'Close'
  },
  estimatedDelivery: {
    es: 'Fecha estimada de entrega:',
    en: 'Estimated delivery date:'
  },
  pickupLocation: {
    es: 'Ubicación de recolección:',
    en: 'Pickup location:'
  },
  getDirections: {
    es: 'Ver en Google Maps',
    en: 'Get Directions'
  },

  // ========== SHIPPING ORDER MESSAGES ==========
  
  // Collecting status
  collectingTitle: {
    es: '¡Orden Creada! 🎉',
    en: 'Order Created! 🎉'
  },
  collectingMessage: {
    es: '¡Listo! Ya puedes empezar a agregar los productos que compraste en línea.',
    en: 'All set! Now add the items you bought online to start your shipment.'
  },
  collectingNextTitle: {
    es: '¿Qué sigue?',
    en: 'What\'s next?'
  },
  collectingNextMessage: {
    es: 'Agrega cada producto que compraste: el nombre, tienda y número de rastreo (si lo tienes).',
    en: 'Add each item you bought: name, store, and tracking number (if you have it).'
  },

  // Awaiting packages status
  awaitingTitle: {
    es: '¡Orden Creada! 🎉',
    en: 'Order Created! 🎉'
  },
  awaitingMessage: {
    es: '¡Listo! Registraste todos tus productos. Cuando lleguen a nuestra bodega en San Diego, los cruzamos a México (~2–3 días hábiles), te enviamos fotos y armamos tu caja consolidada.',
    en: 'All set! You added all your products. Once they reach our San Diego warehouse, we cross them into Mexico (~2–3 business days), send you photos, and build your consolidated box.',
  },
  awaitingNextTitle: {
    es: '¿Cuándo pago?',
    en: 'When do I pay?'
  },
  awaitingNextMessage: {
    es: 'Solo pagas cuando todo llegó y tu caja está lista para volar por avión a tu dirección en México.',
    en: 'You only pay once everything has arrived and your box is ready to fly to your address in Mexico.',
  },

  // Packages complete status
  packagesCompleteTitle: {
    es: '¡Todos tus paquetes han llegado! 📦',
    en: 'All your packages have arrived! 📦'
  },
  packagesCompleteMessage: {
    es: 'Hemos recibido todos tus paquetes en nuestro almacén. Estamos preparando tu envío.',
    en: 'We\'ve received all your packages at our warehouse. We\'re preparing your shipment.'
  },
  packagesCompleteNextTitle: {
    es: '¿Qué sigue?',
    en: 'What\'s next?'
  },
  packagesCompleteNextMessage: {
    es: 'Consolidaremos tus paquetes y te enviaremos todo a tu Dirección de Entrega.',
    en: 'We\'ll consolidate your packages and ship everything to your Delivery Address.'
  },

  // Shipped status (SHIPPING)
  shippedTitle: {
    es: '¡Tu paquete está en camino! 🚚',
    en: 'Your package is on its way! 🚚'
  },
  shippedMessage: {
    es: 'Tu paquete salió de nuestro almacén y está en camino a tu Dirección de Entrega.',
    en: 'Your package has left our warehouse and is on its way to your Delivery Address.'
  },
  shippedNextTitle: {
    es: 'Información de rastreo',
    en: 'Tracking information'
  },
  shippedNextMessage: {
    es: 'Pronto recibirás el número de guía para rastrear tu paquete con el transportista en México.',
    en: 'You\'ll soon receive the tracking number to track your package with the carrier in Mexico.'
  },

  // Delivered status (SHIPPING)
  deliveredTitle: {
    es: '¡Paquete Entregado! ✅',
    en: 'Package Delivered! ✅'
  },
  deliveredMessage: {
    es: '¡Tu paquete fue entregado exitosamente! Gracias por confiar en nosotros para tus compras en línea.',
    en: 'Your package was successfully delivered! Thank you for trusting us with your online shopping.'
  },
  deliveredNextTitle: {
    es: '¿Necesitas ayuda?',
    en: 'Need help?'
  },
  deliveredNextMessage: {
    es: 'Si tienes algún problema con tu paquete o necesitas soporte, contáctanos.',
    en: 'If you have any issues with your package or need support, contact us.'
  },

  // ========== CROSSING ORDER MESSAGES ==========

  // Collecting status (CROSSING)
  crossingCollectingTitle: {
    es: '¡Orden de Cruce Creada! 🎉',
    en: 'Crossing Order Created! 🎉'
  },
  crossingCollectingMessage: {
    es: '¡Listo! Ya puedes empezar a agregar los productos que compraste en línea.',
    en: 'All set! Now add the items you bought online.'
  },
  crossingCollectingNextTitle: {
    es: '¿Qué sigue?',
    en: 'What\'s next?'
  },
  crossingCollectingNextMessage: {
    es: 'Agrega cada producto que compraste: el nombre, tienda y número de rastreo (si lo tienes).',
    en: 'Add each item you bought: name, store, and tracking number (if you have it).'
  },

  // Awaiting packages status (CROSSING)
  crossingAwaitingTitle: {
    es: '¡Orden de Cruce Creada! 🎉',
    en: 'Crossing Order Created! 🎉'
  },
  crossingAwaitingMessage: {
    es: '¡Listo! Registraste todos tus productos. Cuando lleguen a nuestra bodega en San Diego, los cruzamos a Tijuana (~2–3 días hábiles) y te avisamos cuando estén listos para recoger.',
    en: 'All set! You added all your products. Once they reach our San Diego warehouse, we cross them to Tijuana (~2–3 business days) and let you know when they\'re ready for pickup.',
  },
  crossingAwaitingNextTitle: {
    es: '¿Cuándo pago?',
    en: 'When do I pay?'
  },
  crossingAwaitingNextMessage: {
    es: 'Solo pagas cuando todo llegó y está listo para recoger en nuestra bodega de Tijuana.',
    en: 'You only pay once everything has arrived and is ready for pickup at our Tijuana warehouse.',
  },

  // Packages complete status (CROSSING)
  crossingPackagesCompleteTitle: {
    es: '¡Todos tus paquetes han llegado! 📦',
    en: 'All your packages have arrived! 📦'
  },
  crossingPackagesCompleteMessage: {
    es: 'Hemos recibido todos tus paquetes en nuestro almacén de USA. Estamos preparando el cruce a Tijuana.',
    en: 'We\'ve received all your packages at our US warehouse. We\'re preparing the border crossing to Tijuana.'
  },
  crossingPackagesCompleteNextTitle: {
    es: '¿Qué sigue?',
    en: 'What\'s next?'
  },
  crossingPackagesCompleteNextMessage: {
    es: 'Consolidaremos tus paquetes y los cruzaremos a nuestra bodega en Tijuana. Te avisaremos cuando estén listos para recoger.',
    en: 'We\'ll consolidate your packages and cross them to our Tijuana warehouse. We\'ll notify you when they\'re ready for pickup.'
  },

  // Ready for Pickup status (CROSSING - uses 'shipped' status internally)
  crossingReadyTitle: {
    es: '¡Listo para Recoger! 🏪',
    en: 'Ready for Pickup! 🏪'
  },
  crossingReadyMessage: {
    es: 'Tu paquete ya está en nuestra bodega de Tijuana y listo para que lo recojas. Realiza el pago para completar tu orden.',
    en: 'Your package is now at our Tijuana warehouse and ready for pickup. Complete payment to finalize your order.'
  },
  crossingReadyNextTitle: {
    es: 'Para recoger tu paquete',
    en: 'To pick up your package'
  },
  crossingReadyNextMessage: {
    es: 'Realiza el pago del 100% y presenta tu identificación al recoger. Horario: Lunes a Viernes, 9:00 AM - 6:00 PM.',
    en: 'Complete the 100% payment and present your ID when picking up. Hours: Monday - Friday, 9:00 AM - 6:00 PM.'
  },

  // Picked Up status (CROSSING - uses 'delivered' status internally)
  crossingPickedUpTitle: {
    es: '¡Paquete Recogido! ✅',
    en: 'Package Picked Up! ✅'
  },
  crossingPickedUpMessage: {
    es: '¡Recogiste tu paquete exitosamente! Gracias por confiar en Boxly para tus compras en línea.',
    en: 'You\'ve successfully picked up your package! Thank you for trusting Boxly with your online shopping.'
  },
  crossingPickedUpNextTitle: {
    es: '¿Necesitas ayuda?',
    en: 'Need help?'
  },
  crossingPickedUpNextMessage: {
    es: 'Si tienes algún problema con tu paquete o necesitas soporte, contáctanos.',
    en: 'If you have any issues with your package or need support, contact us.'
  },
}

// Get reactive translations
const t = createTranslations(translations)

// Format date function
const formatDate = (dateString) => {
  const date = new Date(dateString)
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }
  return date.toLocaleDateString(undefined, options)
}

// Status configurations
const getStatusConfig = (status, orderType) => {
  const isCrossingOrder = orderType === 'crossing'
  
  const configs = {
    collecting: { tone: 'primary', icon: 'DocumentPlusIcon', confetti: false },
    awaiting_packages: { tone: 'success', icon: 'CheckBadgeIcon', confetti: true },
    packages_complete: { tone: 'primary', icon: 'CubeIcon', confetti: true },
    shipped: {
      tone: isCrossingOrder ? 'amber' : 'ship',
      icon: isCrossingOrder ? 'WarehouseIcon' : 'PlaneIcon',
      confetti: isCrossingOrder
    },
    delivered: { tone: 'success', icon: 'CheckBadgeIcon', confetti: false }
  }

  return configs[status] || { tone: 'primary', icon: 'CheckCircleIcon', confetti: false }
}

// Premium tone system (gradient tile + soft wash + accent), matching the rest of the app.
const TONES = {
  primary: { tile: 'from-primary-500 to-indigo-600', wash: 'bg-primary-400/25', accent: 'text-primary-600' },
  success: { tile: 'from-emerald-500 to-green-600', wash: 'bg-emerald-400/25', accent: 'text-emerald-600' },
  ship:    { tile: 'from-primary-500 to-indigo-600', wash: 'bg-indigo-400/25', accent: 'text-indigo-600' },
  amber:   { tile: 'from-amber-400 to-amber-500', wash: 'bg-amber-400/25', accent: 'text-amber-600' },
}
const tone = computed(() => TONES[getStatusConfig(props.order?.status, props.order?.order_type).tone] || TONES.primary)

// Get appropriate title
const getTitle = () => {
  const status = props.order?.status || 'collecting'
  
  if (isCrossing.value) {
    const titleKey = {
      collecting: 'crossingCollectingTitle',
      awaiting_packages: 'crossingAwaitingTitle',
      packages_complete: 'crossingPackagesCompleteTitle',
      shipped: 'crossingReadyTitle',
      delivered: 'crossingPickedUpTitle'
    }[status]
    return t.value[titleKey] || ''
  }
  
  const titleKey = {
    collecting: 'collectingTitle',
    awaiting_packages: 'awaitingTitle',
    packages_complete: 'packagesCompleteTitle',
    shipped: 'shippedTitle',
    delivered: 'deliveredTitle'
  }[status]
  
  return t.value[titleKey] || ''
}

// Get appropriate message
const getMessage = () => {
  const status = props.order?.status || 'collecting'
  
  if (isCrossing.value) {
    const messageKey = {
      collecting: 'crossingCollectingMessage',
      awaiting_packages: 'crossingAwaitingMessage',
      packages_complete: 'crossingPackagesCompleteMessage',
      shipped: 'crossingReadyMessage',
      delivered: 'crossingPickedUpMessage'
    }[status]
    return t.value[messageKey] || ''
  }
  
  const messageKey = {
    collecting: 'collectingMessage',
    awaiting_packages: 'awaitingMessage',
    packages_complete: 'packagesCompleteMessage',
    shipped: 'shippedMessage',
    delivered: 'deliveredMessage'
  }[status]
  
  return t.value[messageKey] || ''
}

// Get next steps
const getNextSteps = () => {
  const status = props.order?.status || 'collecting'
  
  if (isCrossing.value) {
    const nextStepsKeys = {
      collecting: {
        title: 'crossingCollectingNextTitle',
        message: 'crossingCollectingNextMessage'
      },
      awaiting_packages: {
        title: 'crossingAwaitingNextTitle',
        message: 'crossingAwaitingNextMessage'
      },
      packages_complete: {
        title: 'crossingPackagesCompleteNextTitle',
        message: 'crossingPackagesCompleteNextMessage'
      },
      shipped: {
        title: 'crossingReadyNextTitle',
        message: 'crossingReadyNextMessage'
      },
      delivered: {
        title: 'crossingPickedUpNextTitle',
        message: 'crossingPickedUpNextMessage'
      }
    }
    
    const keys = nextStepsKeys[status]
    if (!keys) return null
    
    return {
      title: t.value[keys.title],
      message: t.value[keys.message]
    }
  }
  
  const nextStepsKeys = {
    collecting: {
      title: 'collectingNextTitle',
      message: 'collectingNextMessage'
    },
    awaiting_packages: {
      title: 'awaitingNextTitle',
      message: 'awaitingNextMessage'
    },
    packages_complete: {
      title: 'packagesCompleteNextTitle',
      message: 'packagesCompleteNextMessage'
    },
    shipped: {
      title: 'shippedNextTitle',
      message: 'shippedNextMessage'
    },
    delivered: {
      title: 'deliveredNextTitle',
      message: 'deliveredNextMessage'
    }
  }
  
  const keys = nextStepsKeys[status]
  if (!keys) return null
  
  return {
    title: t.value[keys.title],
    message: t.value[keys.message]
  }
}

// Get status icon component
const StatusIcon = computed(() => {
  const status = props.order?.status || 'collecting'
  const config = getStatusConfig(status, props.order?.order_type)
  const iconName = config?.icon || 'CheckCircleIcon'
  
  // Return a functional component that renders the appropriate SVG
  return () => h('svg', {
    fill: 'none',
    stroke: 'currentColor',
    viewBox: '0 0 24 24',
    class: 'w-6 h-6 text-white'
  }, [
    iconName === 'PlaneIcon' ? h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5'
    }) : iconName === 'DocumentPlusIcon' ? h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
    }) : iconName === 'CubeIcon' ? h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
    }) : iconName === 'TruckIcon' ? h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0'
    }) : iconName === 'WarehouseIcon' ? h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '1.5',
      d: 'M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z'
    }) : iconName === 'CheckBadgeIcon' ? h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z'
    }) : h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
    })
  ])
})

// Trigger confetti on mount for certain statuses
onMounted(() => {
  if (props.show && props.trigger === 'just_completed') {
    const config = getStatusConfig(props.order?.status, props.order?.order_type)
    if (config?.confetti) {
      setTimeout(() => {
        $confetti()
      }, 300)
    }
  }
})

// Handle after enter transition (keep empty)
const handleAfterEnter = () => {
  // Empty
}
</script>