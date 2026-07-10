<template>
  <!-- Supplementary pipeline ad: Boxly AI search. The hero stays the proven
       register/login funnel; THIS section promotes the optional AI concierge and
       hands off to /search. The real HeroSearch box is embedded so it both
       advertises and works as the call-to-action (type → /search?q=…). -->
  <section class="relative overflow-hidden bg-gray-900 py-16 sm:py-20">
    <!-- Brand glow backdrop -->
    <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_30%,rgba(254,205,4,0.14),transparent_70%)]"></div>

    <div class="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
      <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-500/15 text-primary-200 text-xs font-bold tracking-wide ring-1 ring-primary-400/30">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.9 5.1L19 9l-5.1 1.9L12 16l-1.9-5.1L5 9l5.1-1.9L12 2z"/></svg>
        {{ t.badge }}
      </span>

      <h2 class="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-[1.1] tracking-tight">
        {{ t.title }}
      </h2>
      <p class="mt-3 text-base sm:text-lg text-white/70 max-w-xl mx-auto leading-relaxed">
        {{ t.subtitle }}
      </p>

      <!-- The working CTA: typing/submitting hands off to /search. -->
      <div class="mt-7">
        <HeroSearch />
      </div>
    </div>
  </section>
</template>

<script setup>
import HeroSearch from './HeroSearch.vue'

const { t: createTranslations } = useLanguage()

const t = createTranslations({
  badge:    { es: 'Nuevo · Boxly AI', en: 'New · Boxly AI' },
  title:    { es: 'Busca cualquier producto de USA con IA', en: 'Search any US product with AI' },
  subtitle: { es: 'Dile a Boxly AI qué quieres y te encuentra las mejores opciones de todas las tiendas de Estados Unidos en segundos.', en: 'Tell Boxly AI what you want and it finds the best options across every US store in seconds.' },
})
</script>
