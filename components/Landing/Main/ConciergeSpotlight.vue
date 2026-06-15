<template>
  <!-- Full-width premium section dedicated to the in-person concierge.
       Distinct visual energy from the rest of the landing — this is the
       wow lane and gets its own room. Aspirational copy, image of an
       outlet shopping vibe, single strong CTA into /in-person. -->
  <section class="bg-white py-12 sm:py-20">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-800 via-primary-700 to-primary-500 text-white shadow-xl">
        <div class="absolute -top-32 -right-24 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none" aria-hidden="true"></div>
        <div class="absolute -bottom-32 -left-24 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none" aria-hidden="true"></div>

        <div class="relative grid lg:grid-cols-2 gap-0 items-stretch">
          <!-- Copy side -->
          <div class="p-8 sm:p-12 lg:p-16 flex flex-col justify-center">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-[11px] font-semibold uppercase tracking-wider mb-5 w-fit">
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.539 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
              {{ t.eyebrow }}
            </span>
            <h2 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.1] mb-4">
              {{ t.headline }}
            </h2>
            <p class="text-white/85 text-base sm:text-lg leading-relaxed mb-7 max-w-lg">
              {{ t.subline }}
            </p>

            <div class="flex flex-col sm:flex-row gap-3">
              <NuxtLink
                to="/in-person"
                class="inline-flex items-center justify-center gap-2 px-7 py-4 bg-white text-primary-700 font-bold rounded-full shadow-lg hover:shadow-xl hover:bg-gray-100 transition-all text-base"
              >
                {{ t.cta }}
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
              </NuxtLink>
              <p class="text-xs text-white/70 sm:self-center leading-snug max-w-[200px]">{{ t.hint }}</p>
            </div>
          </div>

          <!-- Image side — uses existing asset, aspect-ratio set so it
               stays nice on tall mobile + wide desktop. -->
          <div class="relative min-h-[280px] lg:min-h-[480px]">
            <img
              src="/images/concierge-spotlight.png"
              :alt="t.imageAlt"
              loading="lazy"
              decoding="async"
              class="absolute inset-0 w-full h-full object-cover"
            >
            <div class="absolute inset-0 bg-gradient-to-l from-transparent via-primary-800/20 to-primary-700/60 lg:via-transparent lg:from-transparent lg:to-primary-700/40 pointer-events-none"></div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const { t: createTranslations } = useLanguage()

const t = createTranslations({
  eyebrow:  { es: 'Servicio premium', en: 'Premium service' },
  headline: { es: 'Tu personal shopper en USA', en: 'Your personal shopper in the US' },
  subline:  { es: 'Vamos a los outlets y tiendas que tú elijas en San Diego, compramos por ti y lo enviamos a México.', en: 'We visit the San Diego outlets and stores you pick, shop for you, and ship to Mexico.' },
  cta:      { es: 'Agendar visita', en: 'Schedule a visit' },
  hint:     { es: 'Reservas con $10 USD por tienda', en: 'Reserve with $10 USD per store' },
  imageAlt: { es: 'Personal shopper de Boxly en San Diego', en: 'Boxly personal shopper in San Diego' },
})
</script>
