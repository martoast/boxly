<template>
  <section class="min-h-screen bg-gray-50 flex items-start sm:items-center justify-center px-4 py-12 sm:py-16">
    <div class="w-full max-w-lg bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-10 text-center">

      <!-- Animated green check -->
      <div class="mx-auto mb-6 h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
        <svg class="h-10 w-10 text-green-600 success-check" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
        {{ t.heading }}
      </h1>

      <p v-if="ref" class="mt-2 text-sm text-gray-500 font-mono">
        {{ t.refLabel }}: <span class="font-semibold text-gray-700">{{ ref }}</span>
      </p>

      <p class="mt-4 text-base text-gray-600 leading-relaxed">
        {{ t.body }}
      </p>

      <!-- Primary CTA — view requests -->
      <NuxtLink
        to="/app/purchase-requests"
        class="mt-8 w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold shadow-lg shadow-primary-500/20 transition-colors"
      >
        {{ t.viewRequests }}
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
      </NuxtLink>

      <!-- WhatsApp button — secondary action, gives the customer a way
           to reach Velonie if they have a question while waiting. -->
      <a
        :href="whatsappLink"
        target="_blank"
        rel="noopener noreferrer"
        class="mt-3 w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#25D366] hover:bg-[#1fbb5a] text-white font-semibold transition-colors"
      >
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
        </svg>
        {{ t.whatsapp }}
      </a>

      <NuxtLink
        to="/shop"
        class="mt-4 inline-block text-sm text-gray-500 hover:text-gray-700 font-medium"
      >
        ← {{ t.keepShopping }}
      </NuxtLink>
    </div>
  </section>
</template>

<script setup>
definePageMeta({
  layout: 'shop',
  middleware: ['auth', 'customer'],
})

const { t: createTranslations } = useLanguage()
const route = useRoute()
const userState = useState('user')

const t = createTranslations({
  heading: { es: '¡Solicitud enviada!', en: 'Request submitted!' },
  refLabel: { es: 'Referencia', en: 'Reference' },
  body: {
    es: 'Recibimos tu solicitud de compra. Velonie, nuestra shopping manager, la revisará y te enviará una cotización detallada por email lo antes posible. ¿Tienes preguntas?',
    en: "We got your purchase request. Velonie, our shopping manager, will review it and email you a detailed quote as soon as possible. Got questions?",
  },
  viewRequests: { es: 'Ver mis solicitudes', en: 'View my requests' },
  whatsapp: { es: 'Habla con Velonie por WhatsApp', en: 'Chat with Velonie on WhatsApp' },
  keepShopping: { es: 'Seguir comprando', en: 'Keep shopping' },
})

// Optional reference number passed from the submit handler so the
// customer sees their PR-25-XXXXX. If absent, the page still works.
const ref = computed(() => route.query.ref?.toString() ?? null)

// Pre-filled WhatsApp message that gives Velonie immediate context —
// her name, ref number if available, and the customer's name so she
// doesn't have to ask.
const whatsappLink = computed(() => {
  const customerName = userState.value?.name?.split(' ')[0] ?? ''
  const refSuffix = ref.value ? ` (${ref.value})` : ''
  const greeting = customerName
    ? `Hola Velonie, soy ${customerName}. Acabo de enviar una solicitud de compra${refSuffix} y tengo una pregunta.`
    : `Hola Velonie, acabo de enviar una solicitud de compra${refSuffix} y tengo una pregunta.`
  return `https://wa.me/16195591910?text=${encodeURIComponent(greeting)}`
})

useHead({
  title: 'Solicitud enviada — Tienda Boxly',
  meta: [{ name: 'robots', content: 'noindex' }],
})
</script>

<style scoped>
/* Subtle bounce-in for the green check so the success state feels
   alive without being annoying. Plays once on mount. */
.success-check {
  animation: success-pop 0.5s cubic-bezier(0.18, 1.25, 0.4, 1) both;
}
@keyframes success-pop {
  0%   { transform: scale(0); opacity: 0; }
  60%  { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
</style>
