<template>
  <!-- Three service lanes — Apple-clean treatment.
       All cards equal-width, white, same border, same image treatment.
       CTAs are minimal text links in primary blue, not pill buttons.
       Visual hierarchy comes from a small "NUEVO" badge on the
       in-person card, nothing else. Mobile = stacked, desktop = 3-col. -->
  <section class="bg-gray-50 py-12 sm:py-16 lg:py-20">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-8 sm:mb-12 max-w-2xl mx-auto">
        <p class="text-xs sm:text-sm font-semibold text-primary-600 uppercase tracking-wider mb-2">{{ t.eyebrow }}</p>
        <h2 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight">{{ t.title }}</h2>
        <p class="text-sm sm:text-base text-gray-600 mt-3 leading-relaxed">{{ t.subtitle }}</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-7">

        <NuxtLink
          v-for="lane in lanes"
          :key="lane.key"
          :to="lane.href"
          class="group block bg-white rounded-2xl overflow-hidden border border-gray-200/80 hover:border-gray-300 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
        >
          <div class="relative aspect-[4/3] overflow-hidden bg-gray-100">
            <img
              :src="lane.image"
              :alt="lane.imageAlt"
              loading="lazy"
              decoding="async"
              class="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
            >
            <span
              v-if="lane.badge"
              class="absolute top-3 left-3 inline-flex items-center px-2.5 py-1 rounded-full bg-white text-[10px] font-bold uppercase tracking-wider text-primary-700 shadow-sm"
            >{{ lane.badge }}</span>
          </div>
          <div class="p-6 sm:p-7">
            <h3 class="text-xl font-bold text-gray-900 tracking-tight">{{ lane.title }}</h3>
            <p class="text-[15px] text-gray-500 mt-2 leading-relaxed">{{ lane.desc }}</p>
            <div class="mt-4 inline-flex items-center gap-1.5 text-[15px] font-semibold text-primary-600 group-hover:text-primary-700">
              {{ lane.cta }}
              <svg class="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
            </div>
          </div>
        </NuxtLink>

      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const { t: createTranslations } = useLanguage()

const t = createTranslations({
  eyebrow:           { es: 'Tres formas de comprar en USA', en: 'Three ways to shop in the US' },
  title:             { es: '¿Cómo te ayudamos hoy?', en: 'How can we help you today?' },
  subtitle:          { es: 'Elige el servicio que mejor te funcione. Mismo equipo, misma bodega, misma entrega segura a México.', en: 'Pick the service that fits you. Same team, same warehouse, same secure delivery to Mexico.' },

  onlineTitle:       { es: 'Mándanos el link', en: 'Send us the link' },
  onlineDesc:        { es: 'Encuentra el producto que quieres en cualquier tienda de USA — nosotros lo compramos y te lo enviamos a México.', en: 'Find any product in any US store — we buy it and ship it to Mexico for you.' },
  onlineCta:         { es: 'Crear solicitud', en: 'Create request' },
  onlineImageAlt:    { es: 'Producto de tienda USA visto en celular', en: 'US store product on phone' },

  inPersonBadge:     { es: 'Nuevo', en: 'New' },
  inPersonTitle:     { es: 'Compras presenciales en San Diego', en: 'In-person shopping in San Diego' },
  inPersonDesc:      { es: 'Vamos en persona a outlets y tiendas físicas. Ideal para boutiques, mayoreo y compras múltiples.', en: 'We visit outlets and physical stores for you. Built for boutiques, wholesale, and multi-store runs.' },
  inPersonCta:       { es: 'Agendar visita', en: 'Schedule a visit' },
  inPersonImageAlt:  { es: 'Compras presenciales en outlets de San Diego', en: 'In-person shopping at San Diego outlets' },

  casilleroTitle:    { es: 'Tu casillero en USA', en: 'Your US warehouse' },
  casilleroDesc:     { es: 'Compra tú mismo y envía a nuestra bodega en San Diego. Consolidamos tus paquetes y los mandamos a tu casa.', en: 'Shop yourself and send to our San Diego warehouse. We consolidate and ship to your home.' },
  casilleroCta:      { es: 'Ver mi cuenta', en: 'Go to my account' },
  casilleroImageAlt: { es: 'Cajas listas para envío en bodega', en: 'Packages ready for shipment' },
})

// Landing-page lanes intentionally route to the public explainer pages
// (not the action surfaces). New visitors get the marketing/education
// first; the explainer pages handle the "Create request / Schedule visit /
// Go to my account" CTA themselves. Action-side links live elsewhere
// (e.g. the WedgeCTA "Crear solicitud" still goes straight to the form).
const lanes = computed(() => [
  // Casillero leads — it's our flagship service right now.
  {
    key: 'casillero',
    href: '/how-it-works/casillero',
    image: '/images/lane-casillero.png',
    imageAlt: t.value.casilleroImageAlt,
    badge: null,
    title: t.value.casilleroTitle,
    desc: t.value.casilleroDesc,
    cta: t.value.casilleroCta,
  },
  {
    key: 'online',
    href: '/how-it-works/online',
    image: '/images/lane-online.png',
    imageAlt: t.value.onlineImageAlt,
    badge: null,
    title: t.value.onlineTitle,
    desc: t.value.onlineDesc,
    cta: t.value.onlineCta,
  },
  {
    key: 'in_person',
    href: '/how-it-works/in-person',
    image: '/images/lane-in-person.png',
    imageAlt: t.value.inPersonImageAlt,
    badge: t.value.inPersonBadge,
    title: t.value.inPersonTitle,
    desc: t.value.inPersonDesc,
    cta: t.value.inPersonCta,
  },
])
</script>
