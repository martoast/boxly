<template>
  <div class="bg-white">
    <!-- Intro -->
    <section class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-2 text-center">
      <p class="text-primary-600 uppercase font-bold text-sm tracking-wider">{{ t.tag }}</p>
      <h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mt-2 mb-4 tracking-tight">{{ t.title }}</h1>
      <p class="text-lg text-gray-600 max-w-2xl mx-auto">{{ t.subtitle }}</p>
    </section>

    <!-- Two ways to pay — the core pricing model -->
    <section class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid sm:grid-cols-2 gap-4">
        <div class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">🛍️ {{ t.casilleroTitle }}</h2>
          <p class="text-sm text-gray-600 mt-2 leading-relaxed">{{ t.casilleroDesc }}</p>
          <p class="text-sm font-semibold text-primary-700 mt-3">{{ t.casilleroPrice }}</p>
        </div>
        <div class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">🤝 {{ t.asistidaTitle }}</h2>
          <p class="text-sm text-gray-600 mt-2 leading-relaxed">{{ t.asistidaDesc }}</p>
          <p class="text-sm font-semibold text-primary-700 mt-3">{{ t.asistidaPrice }}</p>
        </div>
      </div>
    </section>

    <!-- Box price table (reuses the landing pricing component) -->
    <BoxPricing />

    <!-- Funnel CTA — the whole pipeline: search with the AI or create an account -->
    <section class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-4">
      <div class="bg-gradient-to-br from-primary-600 to-primary-500 text-white rounded-3xl p-8 sm:p-10 text-center shadow-xl">
        <h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight">{{ t.ctaTitle }}</h2>
        <p class="text-white/85 mt-2 max-w-xl mx-auto">{{ t.ctaSubtitle }}</p>
        <div class="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <NuxtLink to="/search" class="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white text-primary-700 font-bold rounded-full shadow-md hover:bg-gray-100 transition-colors">
            {{ t.ctaSearch }}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
          </NuxtLink>
          <NuxtLink to="/register" class="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-primary-700/40 border border-white/30 text-white font-bold rounded-full hover:bg-primary-700/60 transition-colors">
            {{ t.ctaRegister }}
          </NuxtLink>
        </div>
      </div>
    </section>

    <FooterSection />
  </div>
</template>

<script setup>
import BoxPricing from '~/components/BoxPricing.vue'
import FooterSection from '~/components/Landing/FooterSection.vue'

const { t: createTranslations } = useLanguage()

definePageMeta({ layout: 'default' })

const t = createTranslations({
  tag:            { es: 'PRECIOS', en: 'PRICING' },
  title:          { es: 'Precios de envío de USA a México', en: 'USA to Mexico shipping prices' },
  subtitle:       { es: 'Precio fijo por caja, sin costos ocultos. Junta todo lo que compres en una sola caja y paga el envío una sola vez.', en: 'Flat price per box, no hidden fees. Consolidate everything into one box and pay shipping once.' },

  casilleroTitle: { es: 'Tú lo compras (casillero)', en: 'You buy it (locker)' },
  casilleroDesc:  { es: 'Compras tú mismo en la tienda de USA con tu tarjeta y lo envías a tu dirección Boxly en San Diego. Nosotros lo consolidamos e importamos a tu casa.', en: 'You buy it yourself at the US store with your card and send it to your Boxly address in San Diego. We consolidate and import it to your door.' },
  casilleroPrice: { es: 'Pagas solo la caja (tabla de abajo). Sin comisión.', en: 'You pay only the box (table below). No commission.' },

  asistidaTitle:  { es: 'Boxly lo compra (compra asistida)', en: 'Boxly buys it (assisted purchase)' },
  asistidaDesc:   { es: 'Ideal si no tienes una tarjeta aceptada en USA. Nosotros compramos el producto por ti, lo importamos y lo entregamos.', en: 'Ideal if you don\'t have a US-accepted card. We buy the product for you, import it, and deliver it.' },
  asistidaPrice:  { es: 'Producto + 10% de comisión (sobre el total al checkout) + la caja.', en: 'Product + 10% commission (on the checkout total) + the box.' },

  ctaTitle:       { es: '¿Listo para comprar de Estados Unidos?', en: 'Ready to shop from the US?' },
  ctaSubtitle:    { es: 'Dile a Boxly AI qué quieres comprar, o crea tu cuenta gratis para empezar.', en: 'Tell Boxly AI what you want to buy, or create your free account to start.' },
  ctaSearch:      { es: 'Buscar con Boxly AI', en: 'Search with Boxly AI' },
  ctaRegister:    { es: 'Crear cuenta gratis', en: 'Create free account' },
})

useSeoMeta({
  title: 'Precios de envío USA → México | Boxly',
  description: 'Tarifas de envío de Estados Unidos a México: precio fijo por caja (XS a XL), sin costos ocultos. Casillero (solo la caja) o compra asistida (producto + 10% + caja). Consolida y ahorra.',
  ogTitle: 'Precios de envío USA → México | Boxly',
  ogDescription: 'Precio fijo por caja, sin costos ocultos. Casillero o compra asistida. Consolida tus compras de USA en una sola caja a México.',
  ogType: 'website',
  ogLocale: 'es_MX',
  twitterCard: 'summary_large_image',
})
useHead({ link: [{ rel: 'canonical', href: 'https://boxly.mx/precios' }] })
</script>
