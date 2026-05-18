<template>
 <!-- Confirmation after a successful POST /purchase-requests/in-person.
 Resets the flow state on mount so a back-button + new flow starts
 cleanly. -->
 <section class="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
 <div class="max-w-md w-full bg-white rounded-3xl shadow-lg p-8 text-center">
 <div class="relative w-20 h-20 mx-auto mb-5">
 <div class="relative w-20 h-20 rounded-full bg-primary-600 flex items-center justify-center text-white ring-4 ring-primary-200 shadow-lg">
 <svg class="w-10 h-10" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
 </div>
 </div>
 <h1 class="text-2xl font-extrabold text-gray-900">{{ t.title }}</h1>
 <p class="text-sm text-gray-600 mt-2">{{ t.subtitle }}</p>

 <div v-if="prRef" class="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-full">
 <span class="text-xs text-primary-700 uppercase tracking-wider font-semibold">{{ t.refLabel }}</span>
 <span class="text-sm font-mono font-bold text-primary-900">{{ prRef }}</span>
 </div>

 <p class="text-xs text-gray-500 mt-6 leading-relaxed">{{ t.next }}</p>

 <div class="mt-6 flex flex-col gap-2">
 <NuxtLink to="/app/purchase-requests" class="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-lg shadow-primary-600/20 transition-colors">
 {{ t.viewMine }}
 </NuxtLink>
 <NuxtLink to="/shop" class="w-full py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50">
 {{ t.backToShop }}
 </NuxtLink>
 </div>
 </div>
 </section>
</template>

<script setup>
import { onMounted } from 'vue'

definePageMeta({
 layout: 'shop',
 middleware: ['auth', 'customer', 'complete-profile'],
})

const { t: createTranslations } = useLanguage()
const route = useRoute()
const { reset } = useInPersonRequest()

const prRef = computed(() => route.query.ref || null)

const t = createTranslations({
 title: { es: '¡Pago recibido!', en: 'Payment received!' },
 subtitle: { es: 'Tu visita en Las Américas está confirmada. Te enviamos un correo con todos los detalles.', en: "Your Las Americas visit is locked in. We've emailed you the details." },
 refLabel: { es: 'Tu solicitud', en: 'Your request' },
 next: { es: 'Después de la visita te enviamos la cuenta final con la mercancía, el envío y el 8% de servicio. La reserva que pagaste hoy ya está cubierta.', en: "After the trip we'll send the final bill with merchandise, shipping, and the 8% service fee. Your booking deposit is already covered." },
 viewMine: { es: 'Ver mis solicitudes', en: 'View my requests' },
 backToShop: { es: 'Volver a la tienda', en: 'Back to shop' },
})

onMounted(() => {
 // Clear the flow state so back-navigating into the wizard starts fresh.
 reset()
})
</script>
