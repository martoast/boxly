<template>
  <section class="py-16 md:py-24 bg-gray-50" id="box-pricing">
    <div class="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="text-center max-w-2xl mx-auto">
        <h2 class="text-4xl sm:text-5xl font-semibold tracking-tight text-gray-900">{{ t.pricingTitle }}</h2>
        <p class="mt-3 text-lg sm:text-xl text-gray-500">{{ t.pricingSubtitle }}</p>
        <div class="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-1.5 text-[13px] text-gray-500">
          <span v-for="tr in TRUST" :key="tr.key" class="inline-flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" :stroke-width="tr.key === 'plane' ? 1.8 : 2.5" :d="tr.key === 'plane' ? ICON_PLANE : ICON_CHECK" /></svg>
            {{ t[tr.key] }}
          </span>
        </div>
      </div>

      <!-- Pricing cards -->
      <div class="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div
          v-for="box in boxes"
          :key="box.size"
          :class="['relative flex flex-col rounded-3xl bg-white p-6 transition-shadow duration-200', box.popular ? 'ring-1 ring-gray-900/10 shadow-md' : 'ring-1 ring-gray-900/5 shadow-sm hover:shadow-md']"
        >
          <div class="flex items-center justify-between h-5">
            <p class="text-[17px] font-semibold text-gray-900">{{ t.boxLabel }} {{ box.size }}</p>
            <span v-if="box.popular" class="text-[10.5px] font-semibold uppercase tracking-wide text-primary-600">{{ t.popularBadge }}</span>
            <span v-else-if="box.bestValue" class="text-[10.5px] font-semibold uppercase tracking-wide text-emerald-600">{{ t.bestValueBadge }}</span>
          </div>

          <!-- price — FIXED per box size -->
          <div class="mt-5">
            <p class="text-[11.5px] text-gray-400">{{ t.boxPrice }}</p>
            <p class="mt-1 text-[30px] font-semibold tracking-tight text-gray-900 leading-none">${{ box.price.toLocaleString('en-US') }}<span class="text-[13px] font-medium text-gray-400 ml-1">MXN</span></p>
            <p class="mt-1.5 text-[12.5px] text-gray-500">≈ ${{ box.perItem }} {{ t.perItem }}</p>
          </div>

          <!-- capacity — approximate examples of what fits -->
          <div class="mt-5 border-t border-gray-100 pt-4">
            <p class="text-[11px] text-gray-400 mb-2.5">{{ t.fits }}</p>
            <ul class="space-y-2.5 text-[13.5px]">
              <li class="flex items-center justify-between"><span class="text-gray-500">{{ t.garments }}</span><span class="font-medium text-gray-900">~{{ box.garments }}</span></li>
              <li class="flex items-center justify-between"><span class="text-gray-500">{{ t.pairs }}</span><span class="font-medium text-gray-900">~{{ box.pairs }}</span></li>
              <li class="flex items-center justify-between"><span class="text-gray-500">{{ t.maxWeight }}</span><span class="font-medium text-gray-900">{{ box.weightLimit }} kg</span></li>
            </ul>
          </div>

          <div class="mt-auto pt-6">
            <NuxtLink :to="ctaLink" class="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-full text-[14px] font-semibold transition-colors active:scale-[.98]" :class="box.popular ? 'bg-primary-600 hover:bg-primary-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'">
              {{ t.choose }}
            </NuxtLink>
            <button @click="specsOpen[box.size] = !specsOpen[box.size]" class="mt-3 w-full text-[12px] text-gray-400 hover:text-gray-600 transition-colors">
              {{ specsOpen[box.size] ? box.dimensions[language] : t.seeDimensions }}
            </button>
          </div>
        </div>
      </div>

      <!-- Consolidated key facts — clean value points + one clarity line -->
      <div class="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] font-medium text-gray-700">
        <span v-for="f in FACTS" :key="f" class="inline-flex items-center gap-1.5">
          <svg class="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" /></svg>
          {{ t[f] }}
        </span>
      </div>
      <p class="mt-3 text-center text-[12px] text-gray-400 max-w-lg mx-auto">{{ t.approxNote }}</p>

      <!-- Main CTA -->
      <div class="mt-8 text-center">
        <NuxtLink
          :to="ctaLink"
          class="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-primary-600 hover:bg-primary-700 text-white text-[15px] font-semibold transition-colors active:scale-[.98]"
        >
          {{ t.ctaButton }}
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup>
import { reactive } from "vue";

const props = defineProps({
  ctaLink: {
    type: String,
    default: "/register",
  },
});

const { t: createTranslations, language } = useLanguage();

const ICON_CHECK = "M5 13l4 4L19 7";
const ICON_PLANE = "M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z";

const TRUST = [
  { key: "trustNoVpn" },
  { key: "trustNoCard" },
  { key: "trustPayWhenReady" },
  { key: "plane" },
];

// The three things that matter, as clean value points (replaces the disclaimer paragraphs).
const FACTS = ["factPrice", "factShipping", "factConsolidate"];

// Box pricing data — fixed price per size; capacity numbers are approximate examples.
const boxes = [
  { size: "XS", price: 1200, perItem: 240, garments: 5,   pairs: 2,  weightLimit: 8,  dimensions: { es: "32 × 24 × 13 cm", en: "32 × 24 × 13 cm" } },
  { size: "S",  price: 2200, perItem: 110, garments: 20,  pairs: 5,  weightLimit: 15, dimensions: { es: "42 × 27 × 32 cm", en: "42 × 27 × 32 cm" } },
  { size: "M",  price: 4000, perItem: 100, garments: 40,  pairs: 10, weightLimit: 25, dimensions: { es: "42 × 52 × 40 cm", en: "42 × 52 × 40 cm" }, popular: true },
  { size: "L",  price: 5100, perItem: 85,  garments: 60,  pairs: 20, weightLimit: 35, dimensions: { es: "52 × 42 × 40 cm", en: "52 × 42 × 40 cm" } },
  { size: "XL", price: 6250, perItem: 55,  garments: 100, pairs: 30, weightLimit: 50, dimensions: { es: "52 × 62 × 53 cm", en: "52 × 62 × 53 cm" }, bestValue: true },
];
const specsOpen = reactive({});

// Translations
const translations = {
  pricingTitle: {
    es: "Cajas y tarifas",
    en: "Boxes & pricing",
  },
  pricingSubtitle: {
    es: "Una caja. Un envío. Precio fijo por tamaño, sin costos ocultos.",
    en: "One box. One shipment. Flat price by size, no hidden fees.",
  },
  trustNoVpn: { es: "Sin VPN", en: "No VPN" },
  trustNoCard: { es: "Sin tarjeta americana", en: "No US card" },
  trustPayWhenReady: { es: "Pagas cuando tu caja está lista", en: "Pay when your box is ready" },
  plane: { es: "Envíos rápidos por avión", en: "Fast air shipping" },
  boxLabel: { es: "Caja", en: "Box" },
  boxPrice: { es: "Precio de la caja", en: "Box price" },
  perItem: { es: "por artículo", en: "per item" },
  fits: { es: "Cuánto le cabe (aprox.)", en: "About what fits" },
  garments: { es: "Prendas", en: "Garments" },
  pairs: { es: "Pares de tenis", en: "Sneaker pairs" },
  maxWeight: { es: "Peso máximo", en: "Max weight" },
  choose: { es: "Elegir", en: "Choose" },
  seeDimensions: { es: "Ver medidas", en: "See dimensions" },
  popularBadge: { es: "Más popular", en: "Most popular" },
  bestValueBadge: { es: "Mejor valor", en: "Best value" },
  factPrice: { es: "Precio fijo, sin costos ocultos", en: "Flat price, no hidden fees" },
  factShipping: { es: "Envío aéreo a todo México incluido", en: "Air shipping across Mexico included" },
  factConsolidate: { es: "Consolida hasta 60 días", en: "Consolidate for up to 60 days" },
  approxNote: {
    es: "Las cantidades son aproximadas — el límite de cada caja es por volumen o peso, lo que se alcance primero.",
    en: "Quantities are approximate — each box's limit is by volume or weight, whichever fills first.",
  },
  ctaButton: { es: "Empezar ahora", en: "Start now" },
};

const t = createTranslations(translations);
</script>
