<template>
  <!-- Social-proof strip, moved OUT of the hero so it doesn't compete with the
       AI input. Sits just below the fold: the US stores Boxly buys from. -->
  <section class="bg-white border-t border-gray-100 py-8 sm:py-10">
    <p class="text-center text-xs sm:text-sm font-medium text-gray-400 mb-5 px-4">{{ t.heading }}</p>
    <div class="logo-marquee-mask overflow-hidden">
      <div class="flex gap-8 sm:gap-10 lg:gap-12 w-max animate-logo-scroll">
        <template v-for="n in 3" :key="`set-${n}`">
          <img
            v-for="(logo, index) in logos"
            :key="`logo-${n}-${index}`"
            :src="logo.src"
            :alt="logo.alt"
            width="120" height="40"
            class="h-8 sm:h-10 w-auto object-contain flex-shrink-0 grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition"
            loading="lazy"
            decoding="async"
            draggable="false"
          />
        </template>
      </div>
    </div>
  </section>
</template>

<script setup>
const { t: createTranslations } = useLanguage()
const t = createTranslations({
  heading: { es: 'Compra de las mejores tiendas de Estados Unidos', en: 'Shop the best stores in the United States' },
})

// US stores whose logos scroll across the strip.
const logos = [
  { src: 'https://static.nc-myus.com/images/pub/www/uploads/image/21afeea318a64a71bcb1dbd3ef27ffec/shein-logo.png', alt: 'SHEIN' },
  { src: 'https://static.nc-myus.com/images/pub/www/uploads/image/c7378301189a420a8648cdc317dad98b/sephora.png', alt: 'Sephora' },
  { src: 'https://static.nc-myus.com/images/pub/www/uploads/image/4342cf740e1d4c809a5266f006012ffc/macys-logo.png', alt: "Macy's" },
  { src: 'https://static.nc-myus.com/images/pub/www/uploads/image/9b11fc458968411b972a0f7df9e42c67/apple-logo.png', alt: 'Apple' },
  { src: 'https://static.nc-myus.com/images/pub/www/uploads/image/22ea4c4db5df4d4fbb4f5067de096869/shop-disney-logo.png', alt: 'Disney' },
  { src: 'https://static.nc-myus.com/images/pub/www/uploads/image/9c6f199c00bc41a8ba335347cbb4ac66/ready-edit-nordstrom-logo-transparent-2.png', alt: 'Nordstrom' },
  { src: 'https://static.nc-myus.com/images/pub/www/uploads/image/3706eb76defa4368bf0c8b1d738b3456/amazon-logo.png', alt: 'Amazon' },
  { src: 'https://static.nc-myus.com/images/pub/www/uploads/image/7569832f95cb49f8af42a2aa4c4adc8d/walmart-logo.png', alt: 'Walmart' },
  { src: 'https://static.nc-myus.com/images/pub/www/uploads/image/fbd77ea07e224a73b1fecf4137d7ba78/ebay-logo.png', alt: 'eBay' },
  { src: 'https://static.nc-myus.com/images/pub/www/uploads/image/f3ffc5a464e94ff89d4405d026923c27/bath-body-works.png', alt: 'Bath & Body Works' },
  { src: 'https://static.nc-myus.com/images/pub/www/uploads/image/774f8d281cfe45ef81f7882de1599be2/carters-logo-120x120.png', alt: "Carter's" },
]
</script>

<style scoped>
@keyframes logo-scroll {
  from { transform: translateX(0); }
  to   { transform: translateX(calc(-100% / 3)); }
}
.animate-logo-scroll {
  animation: logo-scroll 50s linear infinite;
  will-change: transform;
}
.animate-logo-scroll:hover { animation-play-state: paused; }
.logo-marquee-mask {
  -webkit-mask-image: linear-gradient(to right, transparent, #000 8%, #000 92%, transparent);
          mask-image: linear-gradient(to right, transparent, #000 8%, #000 92%, transparent);
}
@media (prefers-reduced-motion: reduce) {
  .animate-logo-scroll { animation: none; }
}
</style>
