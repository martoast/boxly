<template>
  <main class="min-h-screen bg-gradient-to-b from-gray-50 to-white">
    <!-- Hero — matches casillero + online page shape so the three
         /how-it-works/* pages feel like a series. -->
    <section class="relative w-full bg-white py-12 md:py-16 overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-br from-primary-50/30 via-transparent to-primary-50/20"></div>

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
    <InPersonShoppingSteps />

    <!-- CTA Section — same dark band style as online + casillero -->
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
            🛍️ {{ t.ctaBadge }}
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
              to="/shop/in-person"
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

    <!-- FAQ Section (shared) -->
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
import InPersonShoppingSteps from "~/components/Landing/Main/InPersonShoppingSteps.vue";
import WhatsAppHelpCTA from "~/components/Landing/Main/WhatsAppHelpCTA.vue";

definePageMeta({ layout: 'default' });

const { t: createTranslations } = useLanguage();

const translations = {
  howItWorksTag: {
    es: "COMPRAS PRESENCIALES",
    en: "IN-PERSON SHOPPING",
  },
  heroTitle: {
    es: "🛍️ Tu personal shopper en outlets y tiendas físicas de USA",
    en: "🛍️ Your personal shopper at US outlets and physical stores",
  },
  heroSubtitle: {
    es: "Agendamos una visita a Las Américas Outlets o a las tiendas que tú elijas en San Diego. Vamos en persona, compramos por ti y te enviamos a México.",
    en: "We book a visit to Las Americas Outlets or the stores you pick in San Diego. We shop in person and ship to Mexico.",
  },
  ctaBadge: {
    es: "Compra remota en USA",
    en: "Remote US shopping",
  },
  ctaTitle: {
    es: "Reserva tu visita en San Diego",
    en: "Book your San Diego visit",
  },
  ctaSubtitle: {
    es: "Elige la fecha, marca las tiendas que quieres visitar y reserva con $10 USD por tienda. Lo demás es nuestro trabajo.",
    en: "Pick the date, mark the stores you want us to visit, and reserve with $10 USD per store. We handle the rest.",
  },
  trust1: { es: "Outlets y tiendas físicas", en: "Outlets and physical stores" },
  trust2: { es: "Reservas con $10 USD/tienda", en: "Reserve with $10 USD/store" },
  trust3: { es: "Pagas la mercancía al final", en: "Pay merchandise at the end" },
  ctaButton: {
    es: "Agendar mi visita",
    en: "Schedule my visit",
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
