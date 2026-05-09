<template>
  <section class="py-16 md:py-24 bg-gradient-to-br from-dark-500 via-dark-600 to-dark-700 overflow-hidden relative">
    <!-- Background decorative elements - Soft Gradients -->
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute top-10 left-10 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl"></div>
      <div class="absolute bottom-10 right-10 w-80 h-80 bg-accent-green/10 rounded-full blur-3xl"></div>
      <div class="absolute top-1/2 left-1/2 w-96 h-96 bg-accent-green/5 rounded-full blur-3xl"></div>
    </div>

    <!-- Floating Boxes Background (hidden on mobile) -->
    <div class="hidden md:block absolute inset-0 overflow-hidden pointer-events-none select-none">
      <!-- Layer 1: Background (Small, Slow, Low Opacity) -->
      <div class="absolute top-[15%] left-[5%] opacity-20 animate-orbit-slow">
        <img src="/box.svg" alt="" width="40" height="40" loading="lazy" decoding="async" aria-hidden="true" class="w-7 h-7 rotate-12" />
      </div>
      <div class="absolute bottom-[20%] right-[5%] opacity-15 animate-orbit-reverse-slow">
        <img src="/box.svg" alt="" width="40" height="40" loading="lazy" decoding="async" aria-hidden="true" class="w-6 h-6 -rotate-12" />
      </div>

      <!-- Layer 2: Mid-Range -->
      <div class="absolute top-[60%] left-[8%] opacity-30 animate-orbit-medium" style="animation-delay: -8s;">
        <img src="/box.svg" alt="" width="40" height="40" loading="lazy" decoding="async" aria-hidden="true" class="w-10 h-10 rotate-45" />
      </div>
      <div class="absolute top-[10%] right-[15%] opacity-25 animate-orbit-reverse-medium">
        <img src="/box.svg" alt="" width="40" height="40" loading="lazy" decoding="async" aria-hidden="true" class="w-9 h-9 -rotate-6" />
      </div>

      <!-- Layer 3: Foreground -->
      <div class="absolute bottom-[30%] left-[3%] opacity-40 animate-float-horizontal" style="animation-delay: -3s;">
        <img src="/box.svg" alt="" width="40" height="40" loading="lazy" decoding="async" aria-hidden="true" class="w-12 h-12 drop-shadow-lg rotate-12" />
      </div>

      <!-- Floating Dollar Signs -->
      <div class="absolute top-[20%] left-[12%] opacity-35 animate-float-vertical text-accent-green font-bold text-xl" style="animation-delay: -2s;">
        $
      </div>
      <div class="absolute bottom-[15%] right-[10%] opacity-30 animate-orbit-slow text-accent-green font-bold text-lg" style="animation-delay: -6s;">
        $
      </div>
      <div class="absolute top-[70%] right-[20%] opacity-25 animate-float-horizontal-reverse text-accent-green font-bold text-2xl" style="animation-delay: -4s;">
        $
      </div>
    </div>

    <div class="max-w-6xl mx-auto px-5 relative z-10">
      <div class="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
        <!-- Left Content -->
        <div class="order-2 md:order-1 text-center md:text-left">
          <!-- Badge -->
          <div class="inline-flex items-center gap-2 px-4 py-2 bg-accent-green/20 text-accent-green rounded-full text-sm font-semibold mb-6">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            {{ t.badge }}
          </div>

          <!-- Headline -->
          <h2 class="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-5 leading-tight">
            {{ t.headline }}
            <span class="text-accent-green">{{ t.headlineHighlight }}</span>
          </h2>

          <!-- Subtitle -->
          <p class="text-lg md:text-xl text-gray-300 mb-8 max-w-lg mx-auto md:mx-0">
            {{ t.subtitle }}
          </p>

          <!-- Simple benefits -->
          <div class="flex flex-wrap justify-center md:justify-start gap-3 mb-8">
            <div class="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full">
              <svg class="w-5 h-5 text-accent-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span class="text-white text-sm font-medium">{{ t.benefit1 }}</span>
            </div>
            <div class="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full">
              <svg class="w-5 h-5 text-accent-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
              </svg>
              <span class="text-white text-sm font-medium">{{ t.benefit2 }}</span>
            </div>
            <div class="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full">
              <svg class="w-5 h-5 text-accent-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
              <span class="text-white text-sm font-medium">{{ t.benefit3 }}</span>
            </div>
          </div>

          <!-- CTA Button -->
          <NuxtLink
            to="/affiliate-program"
            class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-accent-green hover:bg-green-400 text-dark-700 font-bold rounded-full transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-lg shadow-accent-green/30"
          >
            {{ t.ctaButton }}
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
            </svg>
          </NuxtLink>
        </div>

        <!-- Right Visual - Image -->
        <div class="order-1 md:order-2 relative flex justify-center">
          <div class="relative">
            <picture>
              <source srcset="/affiliate-marketing.webp" type="image/webp" />
              <img
                src="/affiliate-marketing.png"
                alt="Affiliate marketing program"
                width="2500" height="1311"
                loading="lazy" decoding="async"
                class="w-full max-w-sm md:max-w-md rounded-3xl shadow-2xl"
              />
            </picture>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const { t: createTranslations } = useLanguage()

const translations = {
  badge: {
    es: 'Programa de Afiliados',
    en: 'Affiliate Program'
  },
  headline: {
    es: 'Convierte tu red en ',
    en: 'Turn your network into '
  },
  headlineHighlight: {
    es: 'ingresos',
    en: 'income'
  },
  subtitle: {
    es: 'Recomienda Boxly y gana dinero cada vez que tus referidos envían sus compras. Simple, sin límites.',
    en: 'Recommend Boxly and earn money every time your referrals ship their purchases. Simple, no limits.'
  },
  benefit1: {
    es: 'Ganancias pasivas',
    en: 'Passive income'
  },
  benefit2: {
    es: 'Sin límites',
    en: 'No limits'
  },
  benefit3: {
    es: 'Pagos mensuales',
    en: 'Monthly payouts'
  },
  ctaButton: {
    es: 'Conoce el programa',
    en: 'Learn more'
  }
}

const t = createTranslations(translations)
</script>

<style scoped>
/* Zero-gravity orbital animations for floating boxes */
@keyframes orbit-slow {
  0% { transform: translate(0, 0) rotate(0deg); }
  25% { transform: translate(20px, -15px) rotate(5deg); }
  50% { transform: translate(40px, 0px) rotate(0deg); }
  75% { transform: translate(20px, 15px) rotate(-5deg); }
  100% { transform: translate(0, 0) rotate(0deg); }
}

@keyframes orbit-reverse-slow {
  0% { transform: translate(0, 0) rotate(0deg); }
  33% { transform: translate(-30px, 20px) rotate(-8deg); }
  66% { transform: translate(-15px, -10px) rotate(4deg); }
  100% { transform: translate(0, 0) rotate(0deg); }
}

@keyframes orbit-medium {
  0% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-40px, -40px) scale(1.05); }
  100% { transform: translate(0, 0) scale(1); }
}

@keyframes orbit-reverse-medium {
  0% { transform: translate(0, 0) rotate(0deg); }
  50% { transform: translate(40px, 20px) rotate(15deg); }
  100% { transform: translate(0, 0) rotate(0deg); }
}

@keyframes float-horizontal {
  0% { transform: translateX(0) translateY(0) rotate(12deg); }
  50% { transform: translateX(-50px) translateY(-20px) rotate(20deg); }
  100% { transform: translateX(0) translateY(0) rotate(12deg); }
}

@keyframes float-horizontal-reverse {
  0% { transform: translateX(0) translateY(0) rotate(-12deg); }
  50% { transform: translateX(60px) translateY(30px) rotate(-5deg); }
  100% { transform: translateX(0) translateY(0) rotate(-12deg); }
}

@keyframes float-vertical {
  0% { transform: translateY(0) rotate(3deg); }
  50% { transform: translateY(-40px) rotate(-3deg); }
  100% { transform: translateY(0) rotate(3deg); }
}

.animate-orbit-slow {
  animation: orbit-slow 20s ease-in-out infinite;
}

.animate-orbit-reverse-slow {
  animation: orbit-reverse-slow 25s ease-in-out infinite;
}

.animate-orbit-medium {
  animation: orbit-medium 15s ease-in-out infinite;
}

.animate-orbit-reverse-medium {
  animation: orbit-reverse-medium 18s ease-in-out infinite;
}

.animate-float-horizontal {
  animation: float-horizontal 12s ease-in-out infinite;
}

.animate-float-horizontal-reverse {
  animation: float-horizontal-reverse 14s ease-in-out infinite;
}

.animate-float-vertical {
  animation: float-vertical 10s ease-in-out infinite;
}
</style>
