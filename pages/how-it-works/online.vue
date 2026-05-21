<template>
  <main class="min-h-screen bg-gradient-to-b from-gray-50 to-white">
    <!-- Hero Section — same structure as the casillero page so navigation
         between the 3 explainers feels cohesive. -->
    <section class="relative w-full bg-white py-12 md:py-16 overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-br from-primary-50/30 via-transparent to-primary-50/20"></div>

      <!-- Floating boxes background (hidden on mobile) — matches casillero -->
      <div class="hidden md:block absolute inset-0 overflow-hidden pointer-events-none select-none">
        <div class="absolute top-[20%] left-[8%] opacity-[0.12] animate-orbit-slow">
          <img src="/box.svg" alt="" class="w-8 h-8 rotate-12" />
        </div>
        <div class="absolute top-[30%] right-[10%] opacity-[0.10] animate-orbit-reverse-slow">
          <img src="/box.svg" alt="" class="w-7 h-7 -rotate-12" />
        </div>
        <div class="absolute bottom-[25%] left-[15%] opacity-[0.12] animate-orbit-slow" style="animation-delay: -5s;">
          <img src="/box.svg" alt="" class="w-6 h-6 rotate-45" />
        </div>
        <div class="absolute top-[15%] right-[25%] opacity-[0.18] animate-orbit-medium">
          <img src="/box.svg" alt="" class="w-10 h-10 -rotate-6" />
        </div>
        <div class="absolute bottom-[20%] right-[8%] opacity-[0.15] animate-orbit-reverse-medium" style="animation-delay: -10s;">
          <img src="/box.svg" alt="" class="w-9 h-9 rotate-180" />
        </div>
        <div class="absolute top-[40%] left-[5%] opacity-[0.22] animate-float-horizontal" style="animation-delay: -2s;">
          <img src="/box.svg" alt="" class="w-12 h-12 drop-shadow-sm rotate-12" />
        </div>
        <div class="absolute top-[25%] right-[5%] opacity-[0.20] animate-float-horizontal-reverse" style="animation-delay: -7s;">
          <img src="/box.svg" alt="" class="w-11 h-11 drop-shadow-sm -rotate-12" />
        </div>
      </div>

      <div class="container mx-auto px-4 md:px-8 lg:px-12 relative z-10">
        <div class="text-center max-w-4xl mx-auto">
          <span class="text-primary-600 uppercase font-bold text-sm tracking-wider animate-fadeIn">{{ t.howItWorksTag }}</span>
          <h1 class="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mt-2 mb-4 animate-fadeIn" style="animation-delay: 0.1s">
            {{ t.heroTitle }}
          </h1>
          <p class="text-lg md:text-xl text-gray-600 animate-fadeIn" style="animation-delay: 0.2s">
            {{ t.heroSubtitle }}
          </p>
        </div>
      </div>
    </section>

    <!-- Step-by-Step Process -->
    <AssistedShoppingSteps />

    <!-- CTA Section — premium dark band like casillero, with assisted-shopping copy -->
    <section class="py-16 md:py-24 bg-gradient-to-br from-dark-500 via-dark-600 to-dark-700 relative overflow-hidden">
      <div class="absolute inset-0 overflow-hidden">
        <div class="absolute -top-24 -right-24 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl"></div>
        <div class="absolute -bottom-24 -left-24 w-96 h-96 bg-primary-400/10 rounded-full blur-3xl"></div>
      </div>

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
          <span class="inline-flex items-center px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/15 text-[11px] sm:text-xs font-semibold text-white uppercase tracking-wider mb-5">
            🛒 {{ t.ctaBadge }}
          </span>
          <h2 class="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">{{ t.ctaTitle }}</h2>
          <p class="text-lg text-white/80 mb-8">{{ t.ctaSubtitle }}</p>

          <div class="flex flex-wrap justify-center gap-4 mb-8 text-sm">
            <div v-for="(trust, i) in trustPoints" :key="i" class="inline-flex items-center gap-2 text-white/90">
              <svg class="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
              {{ trust }}
            </div>
          </div>

          <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
            <NuxtLink
              to="/shop/request/online"
              class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary-700 font-bold rounded-full shadow-lg hover:bg-gray-100 transition-all duration-300"
            >
              {{ t.ctaButton }}
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
            </NuxtLink>
            <NuxtLink
              to="/how-it-works"
              class="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white/30 text-white font-bold rounded-full hover:bg-white/10 transition-all duration-300"
            >
              {{ t.ctaSecondary }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ Section (shared component) -->
    <MainFAQSection />

    <!-- Still have questions? WhatsApp support CTA -->
    <WhatsAppHelpCTA />

    <!-- Footer -->
    <FooterSection />
  </main>
</template>

<script setup>
import { computed } from 'vue';
import FooterSection from "~/components/Landing/FooterSection.vue";
import MainFAQSection from "~/components/Landing/Main/FAQSection.vue";
import AssistedShoppingSteps from "~/components/Landing/Main/AssistedShoppingSteps.vue";
import WhatsAppHelpCTA from "~/components/Landing/Main/WhatsAppHelpCTA.vue";

definePageMeta({ layout: 'default' });

const { t: createTranslations } = useLanguage();

const translations = {
  howItWorksTag: {
    es: "COMPRA ASISTIDA",
    en: "ASSISTED SHOPPING",
  },
  heroTitle: {
    es: "🛒 Compra asistida en cualquier tienda de USA",
    en: "🛒 Assisted shopping at any US store",
  },
  heroSubtitle: {
    es: "¿No puedes comprar el producto? BOXLY lo compra por ti desde cualquier tienda de USA y te lo enviamos hasta tu casa en México.",
    en: "Can't buy the product yourself? BOXLY buys it for you from any US store and ships it to your door in Mexico.",
  },
  ctaBadge: {
    es: "Acceso a USA",
    en: "US access",
  },
  ctaTitle: {
    es: "Si lo encuentras en USA, lo conseguimos para ti",
    en: "If you find it in the US, we get it for you",
  },
  ctaSubtitle: {
    es: "Mándanos el link, te cotizamos en minutos y compramos por ti. Sin tarjetas mexicanas bloqueadas, sin envíos imposibles.",
    en: "Send us the link, we quote you in minutes, and we buy it for you. No blocked Mexican cards, no impossible shipping.",
  },
  trust1: { es: "Cualquier tienda de USA", en: "Any US store" },
  trust2: { es: "Cotización en minutos", en: "Quote in minutes" },
  trust3: { es: "Pagas en pesos", en: "Pay in pesos" },
  ctaButton: {
    es: "Enviar producto",
    en: "Send product",
  },
  ctaSecondary: {
    es: "Ver otros servicios",
    en: "See other services",
  },
};

const t = createTranslations(translations);

const trustPoints = computed(() => [t.value.trust1, t.value.trust2, t.value.trust3]);
</script>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-fadeIn { animation: fadeIn 0.6s ease-out forwards; opacity: 0; }
</style>
