<template>
  <main class="min-h-screen bg-gradient-to-b from-gray-50 to-white">
    <!-- Hero Section -->
    <section class="relative w-full bg-white py-12 md:py-16 overflow-hidden">
      <!-- Background Gradient -->
      <div
        class="absolute inset-0 bg-gradient-to-br from-primary-50/30 via-transparent to-primary-50/20"
      ></div>

      <!-- Floating Boxes Background (hidden on mobile) -->
      <div class="hidden md:block absolute inset-0 overflow-hidden pointer-events-none select-none">
        <!-- Layer 1: Background (Small, Slow, Low Opacity) -->
        <div class="absolute top-[20%] left-[8%] opacity-[0.12] animate-orbit-slow">
          <img src="/box.svg" alt="" class="w-8 h-8 rotate-12" />
        </div>
        <div class="absolute top-[30%] right-[10%] opacity-[0.10] animate-orbit-reverse-slow">
          <img src="/box.svg" alt="" class="w-7 h-7 -rotate-12" />
        </div>
        <div class="absolute bottom-[25%] left-[15%] opacity-[0.12] animate-orbit-slow" style="animation-delay: -5s;">
          <img src="/box.svg" alt="" class="w-6 h-6 rotate-45" />
        </div>

        <!-- Layer 2: Mid-Range -->
        <div class="absolute top-[15%] right-[25%] opacity-[0.18] animate-orbit-medium">
          <img src="/box.svg" alt="" class="w-10 h-10 -rotate-6" />
        </div>
        <div class="absolute bottom-[20%] right-[8%] opacity-[0.15] animate-orbit-reverse-medium" style="animation-delay: -10s;">
          <img src="/box.svg" alt="" class="w-9 h-9 rotate-180" />
        </div>

        <!-- Layer 3: Foreground (Larger, Slightly More Visible) -->
        <div class="absolute top-[40%] left-[5%] opacity-[0.22] animate-float-horizontal" style="animation-delay: -2s;">
          <img src="/box.svg" alt="" class="w-12 h-12 drop-shadow-sm rotate-12" />
        </div>
        <div class="absolute top-[25%] right-[5%] opacity-[0.20] animate-float-horizontal-reverse" style="animation-delay: -7s;">
          <img src="/box.svg" alt="" class="w-11 h-11 drop-shadow-sm -rotate-12" />
        </div>
      </div>

      <div class="container mx-auto px-4 md:px-8 lg:px-12 relative z-10">
        <div class="text-center max-w-4xl mx-auto">
          <span
            class="text-primary-600 uppercase font-bold text-sm tracking-wider animate-fadeIn"
          >
            {{ t.howItWorksTag }}
          </span>
          <h1
            class="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mt-2 mb-4 animate-fadeIn"
            style="animation-delay: 0.1s"
          >
            {{ t.heroTitle }}
          </h1>
          <p
            class="text-lg md:text-xl text-gray-600 animate-fadeIn"
            style="animation-delay: 0.2s"
          >
            {{ t.heroSubtitle }}
          </p>
        </div>
      </div>
    </section>

    <!-- Step-by-Step Process -->
    <CasilleroSteps />

    <!-- CTA Section -->
    <section class="py-16 md:py-24 bg-gradient-to-br from-dark-500 via-dark-600 to-dark-700 relative overflow-hidden">
      <!-- Background Gradients -->
      <div class="absolute inset-0 overflow-hidden">
        <div class="absolute -top-24 -right-24 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl"></div>
        <div class="absolute -bottom-24 -left-24 w-96 h-96 bg-primary-400/10 rounded-full blur-3xl"></div>
      </div>

      <!-- Floating Boxes (hidden on mobile) -->
      <div class="hidden md:block absolute inset-0 overflow-hidden pointer-events-none select-none">
        <div class="absolute top-[15%] left-[8%] opacity-20 animate-orbit-slow">
          <img src="/box.svg" alt="" class="w-8 h-8 rotate-12" />
        </div>
        <div class="absolute bottom-[20%] right-[10%] opacity-15 animate-orbit-reverse-slow">
          <img src="/box.svg" alt="" class="w-7 h-7 -rotate-12" />
        </div>
        <div class="absolute top-[60%] left-[5%] opacity-25 animate-orbit-medium" style="animation-delay: -8s;">
          <img src="/box.svg" alt="" class="w-10 h-10 rotate-45" />
        </div>
        <div class="absolute top-[20%] right-[15%] opacity-30 animate-float-horizontal" style="animation-delay: -3s;">
          <img src="/box.svg" alt="" class="w-11 h-11 drop-shadow-lg -rotate-6" />
        </div>
        <div class="absolute bottom-[30%] right-[5%] opacity-25 animate-float-horizontal-reverse" style="animation-delay: -5s;">
          <img src="/box.svg" alt="" class="w-9 h-9 drop-shadow-md rotate-12" />
        </div>
      </div>

      <div class="container mx-auto px-4 md:px-8 lg:px-12 relative z-10">
        <div class="text-center max-w-3xl mx-auto">
          <!-- Badge -->
          <div class="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm font-semibold text-white/90 mb-6">
            <div class="flex -space-x-1">
              <span class="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-[8px] font-bold text-white border border-white/20">US</span>
              <span class="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-[8px] font-bold text-white border border-white/20">MX</span>
            </div>
            {{ t.ctaBadge }}
          </div>

          <h2 class="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            {{ t.ctaTitle }}
          </h2>
          <p class="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            {{ t.ctaSubtitle }}
          </p>

          <!-- Trust points -->
          <div class="flex flex-wrap items-center justify-center gap-4 md:gap-6 mb-8 text-white/80">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
              <span class="text-sm font-medium">{{ t.trustPoint1 }}</span>
            </div>
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
              <span class="text-sm font-medium">{{ t.trustPoint2 }}</span>
            </div>
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
              <span class="text-sm font-medium">{{ t.trustPoint3 }}</span>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <NuxtLink
              to="/register"
              class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-dark-600 font-bold rounded-full hover:bg-gray-100 transition-all duration-300 hover:shadow-xl hover:scale-105"
            >
              {{ t.ctaButton }}
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </NuxtLink>
            <button
              type="button"
              @click="calculatorOpen = true"
              class="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white/30 text-white font-bold rounded-full hover:bg-white/10 transition-all duration-300"
            >
              {{ t.calculateButton }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <MainFAQSection />

    <!-- Still have questions? WhatsApp support CTA -->
    <WhatsAppHelpCTA />

    <!-- Footer -->
    <FooterSection />

    <!-- Shipping calculator modal, triggered by the "Calcular envío" CTA above. -->
    <ShippingCalculatorModal v-model="calculatorOpen" />
  </main>
</template>

<script setup>
import { ref } from "vue";
import FooterSection from "~/components/Landing/FooterSection.vue";
import MainFAQSection from "~/components/Landing/Main/FAQSection.vue";
import CasilleroSteps from "~/components/Landing/Main/CasilleroSteps.vue";
import ShippingCalculatorModal from "~/components/Landing/Main/ShippingCalculatorModal.vue";
import WhatsAppHelpCTA from "~/components/Landing/Main/WhatsAppHelpCTA.vue";

const calculatorOpen = ref(false);

const { t: createTranslations } = useLanguage();

const translations = {
  howItWorksTag: {
    es: "CÓMO FUNCIONA",
    en: "HOW IT WORKS",
  },
  heroTitle: {
    es: "Tu casillero en USA · Compra tú mismo, te lo enviamos",
    en: "Your US locker · Shop yourself, we ship it",
  },
  heroSubtitle: {
    es: "Simple, rápido y seguro.",
    en: "Simple, fast and secure.",
  },
  // CTA
  ctaBadge: {
    es: "USA → México",
    en: "USA → Mexico",
  },
  ctaTitle: {
    es: "La forma más inteligente de recibir tus compras",
    en: "The smartest way to receive your purchases",
  },
  ctaSubtitle: {
    es: "Tu dirección personal en USA, envíos rápidos a México y los mejores precios. Todo en un solo lugar.",
    en: "Your personal US address, fast shipping to Mexico, and the best prices. All in one place.",
  },
  trustPoint1: {
    es: "Dirección gratis en USA",
    en: "Free US address",
  },
  trustPoint2: {
    es: "Envío en 3-5 días",
    en: "3-5 day delivery",
  },
  trustPoint3: {
    es: "Hasta 80% de ahorro",
    en: "Up to 80% savings",
  },
  ctaButton: {
    es: "Obtener mi dirección",
    en: "Get my address",
  },
  calculateButton: {
    es: "Calcular envío",
    en: "Calculate shipping",
  },
};

const t = createTranslations(translations);
</script>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.6s ease-out forwards;
  opacity: 0;
}

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
</style>