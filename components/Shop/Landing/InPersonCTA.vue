<template>
  <!-- In-person shopping CTA on the /shop landing. Sibling to
       RequestAnythingCTA but distinct: physical visit to Las Americas
       Outlets, no upfront payment, pay-after-trip model. -->
  <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
    <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-purple-600 px-6 py-12 sm:px-12 sm:py-16 lg:px-16 lg:py-20 shadow-xl">
      <div class="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none" aria-hidden="true"></div>
      <div class="absolute -bottom-32 -right-20 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" aria-hidden="true"></div>

      <div class="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 lg:gap-12">
        <div class="max-w-2xl text-white">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs font-semibold uppercase tracking-wider mb-4">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            {{ t.eyebrow }}
          </span>
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.05] drop-shadow-sm">
            {{ t.headline }}
          </h2>
          <p class="mt-4 text-white/85 text-base sm:text-lg leading-relaxed max-w-xl">
            {{ t.subline }}
          </p>
        </div>

        <div class="flex flex-col gap-3 lg:shrink-0">
          <NuxtLink
            to="/shop/in-person"
            class="inline-flex items-center justify-center gap-2 px-7 py-4 bg-white text-indigo-700 font-bold rounded-full shadow-lg hover:shadow-xl hover:bg-gray-100 transition-all text-base"
          >
            {{ t.cta }}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </NuxtLink>
          <p class="text-xs text-white/70 text-center max-w-[240px] mx-auto leading-snug">{{ t.noPaymentHint }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const { t: createTranslations } = useLanguage()

const t = createTranslations({
  eyebrow:        { es: 'Compra en persona en San Diego', en: 'In-person shopping in San Diego' },
  headline:       { es: 'Vamos por ti a Las Américas Outlets', en: "We'll shop Las Americas Outlets for you" },
  subline:        { es: 'Agenda una visita, elige las tiendas y déjanos hacer la compra en persona. $10 USD por tienda + 8% sobre la compra.', en: 'Schedule a visit, pick the stores, and let us shop in person on your behalf. $10 USD per store + 8% on the purchase.' },
  cta:            { es: 'Agendar visita', en: 'Schedule a visit' },
  noPaymentHint:  { es: 'No pagas nada al agendar', en: 'No payment to schedule' },
})
</script>
