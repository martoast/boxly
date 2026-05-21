<template>
  <!-- Chooser for the three "how it works" explainer pages, one per Boxly
       product. Same visual pattern as the rest of the redesigned site.
       Mirrors the homepage ServiceLanes lane order so the wedge (online)
       sits first. -->
  <main class="min-h-screen bg-gray-50">
    <section class="bg-white border-b border-gray-200">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center">
        <p class="text-xs sm:text-sm font-semibold text-primary-600 uppercase tracking-wider mb-2">{{ t.eyebrow }}</p>
        <h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight">{{ t.title }}</h1>
        <p class="text-sm sm:text-base text-gray-600 mt-3">{{ t.subtitle }}</p>
      </div>
    </section>

    <section class="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
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
          </div>
          <div class="p-6 sm:p-7">
            <h3 class="text-xl font-bold text-gray-900 tracking-tight">{{ lane.title }}</h3>
            <p class="text-[15px] text-gray-500 mt-2 leading-relaxed">{{ lane.desc }}</p>
            <div class="mt-4 inline-flex items-center gap-1.5 text-[15px] font-semibold text-primary-600 group-hover:text-primary-700">
              {{ t.readMore }}
              <svg class="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
            </div>
          </div>
        </NuxtLink>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed } from 'vue'

definePageMeta({ layout: 'default' })

const { t: createTranslations } = useLanguage()

const t = createTranslations({
  eyebrow:    { es: 'Cómo funciona', en: 'How it works' },
  title:      { es: '¿Cómo te ayudamos a comprar en USA?', en: 'How we help you shop the US' },
  subtitle:   { es: 'Boxly te da tres formas de acceder a las tiendas de USA. Cada una funciona distinto — elige la que quieres entender mejor.', en: 'Boxly gives you three ways to access US stores. Each one works a little differently — pick the one you want to learn more about.' },
  readMore:   { es: 'Ver detalles', en: 'See details' },
  onlineTitle:      { es: 'Mándanos el link', en: 'Send us the link' },
  onlineDesc:       { es: 'Compramos en línea por ti desde cualquier tienda de USA.', en: 'We buy online from any US store for you.' },
  inPersonTitle:    { es: 'Compras presenciales', en: 'In-person shopping' },
  inPersonDesc:     { es: 'Vamos en persona a outlets y tiendas en San Diego.', en: 'We visit outlets and physical stores in San Diego for you.' },
  casilleroTitle:   { es: 'Tu casillero en USA', en: 'Your US locker' },
  casilleroDesc:    { es: 'Compra tú mismo y manda a nuestra bodega — consolidamos y enviamos.', en: 'Shop yourself and ship to our warehouse — we consolidate and forward.' },
})

const lanes = computed(() => [
  {
    key: 'online',
    href: '/how-it-works/online',
    image: '/images/lane-online.png',
    imageAlt: 'Send us the link',
    title: t.value.onlineTitle,
    desc: t.value.onlineDesc,
  },
  {
    key: 'in-person',
    href: '/how-it-works/in-person',
    image: '/images/lane-in-person.png',
    imageAlt: 'In-person shopping',
    title: t.value.inPersonTitle,
    desc: t.value.inPersonDesc,
  },
  {
    key: 'casillero',
    href: '/how-it-works/casillero',
    image: '/images/lane-casillero.png',
    imageAlt: 'Your US locker',
    title: t.value.casilleroTitle,
    desc: t.value.casilleroDesc,
  },
])
</script>
