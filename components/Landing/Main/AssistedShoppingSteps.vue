<template>
  <!-- 3-step explainer for the assisted-online (compra asistida) flow.
       Structure mirrors CasilleroSteps: alternating left/right image+copy
       blocks with a big numbered circle, h3 title, body copy, and a
       single accent tip per step. Visual reuses the step-online-* images
       generated for this flow. -->
  <section class="py-16 md:py-24 bg-white">
    <div class="container mx-auto px-4 md:px-8 lg:px-12">
      <div class="text-center mb-16">
        <span class="text-primary-600 uppercase font-bold text-sm tracking-wider">{{ t.processTag }}</span>
        <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-4">{{ t.processTitle }}</h2>
        <p class="text-lg text-gray-600 max-w-2xl mx-auto">{{ t.processSubtitle }}</p>
      </div>

      <div class="space-y-20">
        <!-- Step 1 — Mándanos el link o screenshot -->
        <div class="grid lg:grid-cols-2 items-center gap-8 lg:gap-12 xl:gap-16">
          <div class="order-2 lg:order-1">
            <div class="flex items-center gap-4 mb-6">
              <div class="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-xl">1</div>
              <h3 class="text-2xl md:text-3xl font-bold text-gray-900">{{ t.step1Title }}</h3>
            </div>
            <div class="space-y-4 text-gray-700">
              <p class="text-lg">{{ t.step1Desc }}</p>
              <div class="flex items-start gap-3 text-sm">
                <svg class="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <p class="text-gray-600">{{ t.step1Tip }}</p>
              </div>
            </div>
          </div>
          <div class="order-1 lg:order-2">
            <div class="relative max-w-lg mx-auto lg:max-w-none">
              <div class="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="/images/step-online-1-link.png"
                  :alt="t.step1Alt"
                  width="1408" height="1056"
                  loading="lazy" decoding="async"
                  class="w-full h-full object-cover"
                />
              </div>
              <!-- Floating callout: speed signal -->
              <div class="absolute -top-4 -left-4 bg-white rounded-xl shadow-xl p-3 flex items-center gap-2">
                <div class="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center text-lg">⚡</div>
                <div>
                  <p class="text-xs font-bold text-gray-900">{{ t.step1BadgeTitle }}</p>
                  <p class="text-xs text-gray-600">{{ t.step1BadgeDesc }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 2 — BOXLY compra y recibe en San Diego -->
        <div class="grid lg:grid-cols-2 items-center gap-8 lg:gap-12 xl:gap-16">
          <div class="order-1">
            <div class="relative max-w-lg mx-auto lg:max-w-none">
              <div class="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="/images/step-online-2-warehouse.png"
                  :alt="t.step2Alt"
                  width="1408" height="1056"
                  loading="lazy" decoding="async"
                  class="w-full h-full object-cover"
                />
              </div>
              <!-- Floating callout: photos signal -->
              <div class="absolute -bottom-4 -right-4 bg-white rounded-xl shadow-xl p-3 flex items-center gap-2">
                <div class="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center text-lg">📸</div>
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
              <div class="bg-primary-50 rounded-xl p-5 border-2 border-primary-100">
                <p class="text-sm font-semibold text-primary-900">{{ t.step2CalloutTitle }}</p>
                <p class="text-sm text-primary-800 mt-1.5 leading-relaxed">{{ t.step2CalloutDesc }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 3 — Lo enviamos a tu casa en México -->
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
                  src="/images/step-online-3-delivery.png"
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

      <!-- "Ideal para tiendas que..." pain-points block -->
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
  processTag:        { es: 'Compra asistida', en: 'Assisted shopping' },
  processTitle:      { es: 'Cómo funciona la compra asistida', en: 'How assisted shopping works' },
  processSubtitle:   { es: 'Tres pasos. Cero fricción. Compra en cualquier tienda de USA y nosotros nos encargamos del resto.', en: 'Three steps. Zero friction. Shop any US store and we handle the rest.' },

  step1Title:        { es: 'Mándanos el link o screenshot', en: 'Send us the link or screenshot' },
  step1Desc:         { es: 'Comparte el URL del producto desde cualquier tienda de USA — Nike, Sephora, Amazon, lo que sea. También aceptamos fotos, capturas de pantalla, o solo el nombre del producto si no encuentras el link.', en: 'Share the product URL from any US store — Nike, Sephora, Amazon, anything. Screenshots or just the product name work too if you can\'t find the link.' },
  step1Tip:          { es: 'Te cotizamos en minutos por WhatsApp. Tú apruebas antes de que compremos.', en: 'You get a quote in minutes on WhatsApp. You approve before we buy.' },
  step1Alt:          { es: 'Compartir un link de producto desde una tienda de USA', en: 'Sharing a product link from a US store' },
  step1BadgeTitle:   { es: 'Respuesta rápida', en: 'Fast response' },
  step1BadgeDesc:    { es: 'Cotización en minutos', en: 'Quote in minutes' },

  step2Title:        { es: 'BOXLY compra el producto y lo recibe en San Diego', en: 'BOXLY buys the product and receives it in San Diego' },
  step2Desc:         { es: 'En cuanto apruebas la cotización, hacemos la compra en la tienda con nuestra tarjeta de USA. El paquete llega a nuestra bodega en San Diego — sin tarjetas bloqueadas, sin direcciones imposibles.', en: 'Once you approve the quote, we place the order with our US card. The package arrives at our San Diego warehouse — no blocked cards, no impossible addresses.' },
  step2CalloutTitle: { es: 'Te mandamos foto cuando llega', en: 'We send you photos on arrival' },
  step2CalloutDesc:  { es: 'Apenas recibimos el paquete, te avisamos por WhatsApp con foto. Si pides varios productos, los consolidamos en una sola caja para ahorrar en envío.', en: 'As soon as we receive the package, we notify you on WhatsApp with photos. If you ordered multiple items, we consolidate them into one box to save on shipping.' },
  step2Alt:          { es: 'BOXLY recibe el paquete en su bodega de San Diego', en: 'BOXLY receives the package at its San Diego warehouse' },
  step2BadgeTitle:   { es: 'Fotos al llegar', en: 'Photos on arrival' },
  step2BadgeDesc:    { es: 'Confirmación por WhatsApp', en: 'WhatsApp confirmation' },

  step3Title:        { es: 'Lo enviamos hasta tu casa en México', en: 'We ship it to your door in Mexico' },
  step3Desc:         { es: 'Te enviamos por Estafeta a tu dirección en México, con guía de seguimiento y entrega en 3–5 días hábiles. Tú pagas en pesos a cuenta mexicana, sin comisiones internacionales.', en: 'We ship via Estafeta to your address in Mexico, with tracking and 3–5 business day delivery. You pay in pesos to a Mexican account, no international fees.' },
  step3Tip:          { es: 'Seguimiento en tiempo real desde tu cuenta y por WhatsApp.', en: 'Real-time tracking from your account and on WhatsApp.' },
  step3Alt:          { es: 'Entrega del paquete a tu casa en México', en: 'Package delivered to your door in Mexico' },

  idealTitle:        { es: 'Ideal para tiendas que…', en: 'Built for stores that…' },
  ideal1:            { es: 'No aceptan tarjetas mexicanas', en: 'Don\'t accept Mexican cards' },
  ideal2:            { es: 'No envían a México', en: 'Don\'t ship to Mexico' },
  ideal3:            { es: 'Requieren una dirección en USA', en: 'Require a US address' },
  ideal4:            { es: 'Tienen productos exclusivos del mercado de USA', en: 'Have US-exclusive products' },
})

const idealItems = computed(() => [t.value.ideal1, t.value.ideal2, t.value.ideal3, t.value.ideal4])
</script>
