<template>
  <!-- 3-step explainer for the in-person concierge (compras presenciales)
       flow. Same alternating layout as CasilleroSteps and AssistedShopping
       Steps for visual consistency across the three /how-it-works pages. -->
  <section class="py-16 md:py-24 bg-white">
    <div class="container mx-auto px-4 md:px-8 lg:px-12">
      <div class="text-center mb-16">
        <span class="text-primary-600 uppercase font-bold text-sm tracking-wider">{{ t.processTag }}</span>
        <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-4">{{ t.processTitle }}</h2>
        <p class="text-lg text-gray-600 max-w-2xl mx-auto">{{ t.processSubtitle }}</p>
      </div>

      <div class="space-y-20">
        <!-- Step 1 — Reserva tu visita -->
        <div class="grid lg:grid-cols-2 items-center gap-8 lg:gap-12 xl:gap-16">
          <div class="order-2 lg:order-1">
            <div class="flex items-center gap-4 mb-6">
              <div class="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-xl">1</div>
              <h3 class="text-2xl md:text-3xl font-bold text-gray-900">{{ t.step1Title }}</h3>
            </div>
            <div class="space-y-4 text-gray-700">
              <p class="text-lg">{{ t.step1Desc }}</p>
              <div class="bg-primary-50 rounded-xl p-5 border-2 border-primary-100">
                <p class="text-sm font-semibold text-primary-900">{{ t.step1CalloutTitle }}</p>
                <p class="text-sm text-primary-800 mt-1.5 leading-relaxed">{{ t.step1CalloutDesc }}</p>
              </div>
            </div>
          </div>
          <div class="order-1 lg:order-2">
            <div class="relative max-w-lg mx-auto lg:max-w-none">
              <div class="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="/images/step-inperson-1-schedule.png"
                  :alt="t.step1Alt"
                  width="1408" height="1056"
                  loading="lazy" decoding="async"
                  class="w-full h-full object-cover"
                />
              </div>
              <div class="absolute -top-4 -left-4 bg-white rounded-xl shadow-xl p-3 flex items-center gap-2">
                <div class="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center text-lg">📅</div>
                <div>
                  <p class="text-xs font-bold text-gray-900">{{ t.step1BadgeTitle }}</p>
                  <p class="text-xs text-gray-600">{{ t.step1BadgeDesc }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 2 — Vamos al outlet y compramos en persona -->
        <div class="grid lg:grid-cols-2 items-center gap-8 lg:gap-12 xl:gap-16">
          <div class="order-1">
            <div class="relative max-w-lg mx-auto lg:max-w-none">
              <div class="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="/images/step-inperson-2-shopping.png"
                  :alt="t.step2Alt"
                  width="1408" height="1056"
                  loading="lazy" decoding="async"
                  class="w-full h-full object-cover"
                />
              </div>
              <div class="absolute -bottom-4 -right-4 bg-white rounded-xl shadow-xl p-3 flex items-center gap-2">
                <div class="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center text-lg">🛍️</div>
                <div>
                  <p class="text-xs font-bold text-gray-900">{{ t.step2BadgeTitle }}</p>
                  <p class="text-xs text-gray-600">{{ t.step2BadgeDesc }}</p>
                </div>
              </div>
            </div>
          </div>
          <div class="order-2">
            <div class="flex items-center gap-4 mb-6">
              <div class="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-xl">2</div>
              <h3 class="text-2xl md:text-3xl font-bold text-gray-900">{{ t.step2Title }}</h3>
            </div>
            <div class="space-y-4 text-gray-700">
              <p class="text-lg">{{ t.step2Desc }}</p>
              <div class="flex items-start gap-3 text-sm">
                <svg class="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <p class="text-gray-600">{{ t.step2Tip }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 3 — Te enviamos a tu casa en México -->
        <div class="grid lg:grid-cols-2 items-center gap-8 lg:gap-12 xl:gap-16">
          <div class="order-2 lg:order-1">
            <div class="flex items-center gap-4 mb-6">
              <div class="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-xl">3</div>
              <h3 class="text-2xl md:text-3xl font-bold text-gray-900">{{ t.step3Title }}</h3>
            </div>
            <div class="space-y-4 text-gray-700">
              <p class="text-lg">{{ t.step3Desc }}</p>
              <div class="flex items-start gap-3 text-sm">
                <svg class="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <p class="text-gray-600">{{ t.step3Tip }}</p>
              </div>
            </div>
          </div>
          <div class="order-1 lg:order-2">
            <div class="relative max-w-lg mx-auto lg:max-w-none">
              <div class="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="/images/step-inperson-3-delivery.png"
                  :alt="t.step3Alt"
                  width="1408" height="1056"
                  loading="lazy" decoding="async"
                  class="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- "Ideal para…" pain-points block — same shape as the online page,
           different content reflecting the in-person audience. -->
      <div class="mt-20 max-w-3xl mx-auto">
        <div class="bg-gradient-to-br from-primary-50 to-white rounded-3xl border border-primary-100 p-8 sm:p-10">
          <h3 class="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight text-center">{{ t.idealTitle }}</h3>
          <ul class="mt-6 space-y-3">
            <li v-for="(item, i) in idealItems" :key="i" class="flex items-start gap-3">
              <div class="w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
              </div>
              <span class="text-base text-gray-700">{{ item }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const { t: createTranslations } = useLanguage()

const t = createTranslations({
  processTag:        { es: 'Compras presenciales', en: 'In-person shopping' },
  processTitle:      { es: 'Cómo funciona la compra presencial', en: 'How in-person shopping works' },
  processSubtitle:   { es: 'Tres pasos. Vamos por ti a outlets y tiendas físicas en San Diego.', en: 'Three steps. We visit US outlets and physical stores on your behalf.' },

  step1Title:        { es: 'Reserva tu visita y elige las tiendas', en: 'Book your visit and pick the stores' },
  step1Desc:         { es: 'Elige la fecha en que vamos a Las Américas Outlets o a las tiendas que tú decidas en San Diego. Selecciona qué tiendas visitar, marca categorías y deja una lista de deseos.', en: 'Pick the date we visit Las Americas Outlets or whichever stores you choose in San Diego. Select which stores, tag the categories that interest you, and leave a wishlist.' },
  step1CalloutTitle: { es: 'Reservas con $10 USD por tienda', en: 'Reserve with $10 USD per store' },
  step1CalloutDesc:  { es: 'Esto bloquea tu visita y nos permite organizar la ruta. Lo restante (mercancía + 10% de servicio) lo pagas al final, cuando recibimos todo en bodega.', en: 'This locks in your visit and lets us plan the route. You pay the rest (merchandise + 10% service fee) at the end, once we receive everything in our warehouse.' },
  step1Alt:          { es: 'Reserva tu visita desde tu celular', en: 'Book your visit from your phone' },
  step1BadgeTitle:   { es: 'Fecha disponible', en: 'Available date' },
  step1BadgeDesc:    { es: 'En minutos', en: 'In minutes' },

  step2Title:        { es: 'Vamos al outlet y compramos en persona', en: 'We visit the outlet and shop in person' },
  step2Desc:         { es: 'En la fecha agendada, nuestro equipo va físicamente a las tiendas que elegiste. Compramos los productos de tu lista, buscamos las mejores ofertas de outlet y te mandamos fotos en vivo si lo pides.', en: 'On your scheduled date, our team physically visits the stores you picked. We shop your wishlist, hunt the best outlet deals, and send live photos if you ask.' },
  step2Tip:          { es: 'Ideal para boutiques, mayoreo, productos exclusivos de outlet y compras múltiples en una visita.', en: 'Built for boutiques, wholesale, outlet-only finds, and multi-store runs in one visit.' },
  step2Alt:          { es: 'Personal shopper de Boxly en outlet de San Diego', en: 'Boxly personal shopper at a San Diego outlet' },
  step2BadgeTitle:   { es: 'Compramos por ti', en: 'We shop for you' },
  step2BadgeDesc:    { es: 'En outlets de USA', en: 'At US outlets' },

  step3Title:        { es: 'Te enviamos a tu casa en México', en: 'We ship to your door in Mexico' },
  step3Desc:         { es: 'Consolidamos todo en una sola caja en San Diego y te enviamos por Estafeta a tu dirección en México. Pagas la cuenta final en pesos a cuenta mexicana — sin comisiones internacionales.', en: 'We consolidate everything in a single box in San Diego and ship via Estafeta to your address in Mexico. You pay the final bill in pesos to a Mexican account — no international fees.' },
  step3Tip:          { es: 'Seguimiento en tiempo real desde tu cuenta y por WhatsApp.', en: 'Real-time tracking from your account and on WhatsApp.' },
  step3Alt:          { es: 'Recibe tu compra en México', en: 'Receive your shopping in Mexico' },

  idealTitle:        { es: 'Ideal para…', en: 'Built for…' },
  ideal1:            { es: 'Boutiques que compran al mayoreo en USA', en: 'Boutiques buying wholesale in the US' },
  ideal2:            { es: 'Resellers que necesitan acceso a outlets', en: 'Resellers who need outlet access' },
  ideal3:            { es: 'Productos exclusivos de outlet o fuera de catálogo online', en: 'Outlet-only items not sold online' },
  ideal4:            { es: 'Compras múltiples en varias tiendas en una sola visita', en: 'Multi-store runs in a single visit' },
  ideal5:            { es: 'Cuando necesitas a alguien físicamente en USA por ti', en: 'When you need someone physically in the US for you' },
})

const idealItems = computed(() => [t.value.ideal1, t.value.ideal2, t.value.ideal3, t.value.ideal4, t.value.ideal5])
</script>
