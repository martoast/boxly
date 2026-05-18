<template>
  <!-- Confirmation after a successful POST /purchase-requests/in-person.
       Resets the flow state on mount so a back-button + new flow starts
       cleanly. -->
  <section class="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
    <div class="max-w-md w-full bg-white rounded-3xl shadow-lg p-8 text-center">
      <div class="relative w-20 h-20 mx-auto mb-5">
        <div class="absolute inset-0 rounded-full bg-boxly-yellow/40 blur-xl animate-pulse"></div>
        <div class="relative w-20 h-20 rounded-full bg-boxly-blue flex items-center justify-center text-white ring-4 ring-boxly-yellow shadow-lg">
          <svg class="w-10 h-10" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
        </div>
      </div>
      <h1 class="text-2xl font-extrabold text-gray-900">{{ t.title }}</h1>
      <p class="text-sm text-gray-600 mt-2">{{ t.subtitle }}</p>

      <div v-if="prRef" class="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-boxly-blue-50 rounded-full">
        <span class="text-xs text-boxly-blue-700 uppercase tracking-wider font-semibold">{{ t.refLabel }}</span>
        <span class="text-sm font-mono font-bold text-boxly-blue-900">{{ prRef }}</span>
      </div>

      <p class="text-xs text-gray-500 mt-6 leading-relaxed">{{ t.next }}</p>

      <div class="mt-6 flex flex-col gap-2">
        <NuxtLink to="/app/purchase-requests" class="w-full py-3 bg-boxly-blue hover:bg-boxly-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-boxly-blue/20 hover:shadow-boxly-yellow/40 transition-all">
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
  title:      { es: '¡Visita agendada!', en: 'Trip scheduled!' },
  subtitle:   { es: 'Recibimos tu solicitud y te enviamos un correo con los detalles.', en: 'We got your request and sent you a confirmation email.' },
  refLabel:   { es: 'Tu solicitud', en: 'Your request' },
  next:       { es: 'Te avisamos cuando tu cotización esté lista, después de que vayamos a Las Américas en la fecha que elegiste. No se te cobra nada hasta ese momento.', en: "We'll notify you when your quote is ready, after we visit Las Americas on your chosen date. Nothing's charged until then." },
  viewMine:   { es: 'Ver mis solicitudes', en: 'View my requests' },
  backToShop: { es: 'Volver a la tienda', en: 'Back to shop' },
})

onMounted(() => {
  // Clear the flow state so back-navigating into the wizard starts fresh.
  reset()
})
</script>
