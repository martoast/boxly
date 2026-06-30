<template>
  <!-- Landing hero — bright outlet-shopping photo with a gradient overlay
       so the white headline stays readable. Overlay is left-heavy on
       desktop (text sits left, subject sits right) and bottom-heavy on
       mobile where the layout stacks. Primary CTA on mobile is
       register/login because the mobile nav doesn't expose those buttons;
       signed-in users see a "Mi cuenta" shortcut instead. -->
  <header class="relative w-full overflow-hidden bg-gray-900">
    <picture>
      <source media="(max-width: 768px)" :srcset="mobileImageSrc" type="image/png" />
      <source :srcset="desktopImageSrc" type="image/png" />
      <img
        :src="desktopImageSrc"
        :alt="t.imageAlt"
        width="1920" height="1080"
        fetchpriority="high"
        decoding="async"
        class="absolute inset-0 w-full h-full object-cover"
      />
    </picture>

    <!-- Readability gradient. Mobile: strong bottom-up dark fade.
         Desktop (sm+): left-to-right fade so the text column reads while
         the subject on the right stays visible. -->
    <div class="absolute inset-0 bg-gradient-to-t from-gray-900/65 via-gray-900/35 to-gray-900/25 sm:bg-gradient-to-r sm:from-gray-900/85 sm:via-gray-900/55 sm:to-transparent"></div>

    <!-- Mobile-only top fade: darkens the light sky so the white headline
         reads. Desktop is handled by the left-to-right overlay above. -->
    <div class="sm:hidden absolute inset-x-0 top-0 h-2/3 bg-gradient-to-b from-gray-900/55 via-gray-900/20 to-transparent pointer-events-none"></div>

    <!-- Extra bottom fade so the white logo strip reads across the full
         width (the desktop l-to-r overlay leaves the bottom-right light). -->
    <div class="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-gray-900/80 to-transparent pointer-events-none"></div>

    <!-- Column layout: content fills the top, logo strip pins to the bottom. -->
    <div class="relative min-h-[480px] sm:min-h-[540px] lg:min-h-[620px] flex flex-col">
      <div class="flex-1 flex items-center">
        <div class="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 lg:pt-24 pb-8">
          <div class="max-w-2xl">
            <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.05] tracking-tight">
              {{ t.title }}
            </h1>
            <p class="text-base sm:text-lg lg:text-xl text-white/85 mt-4 sm:mt-5 max-w-xl leading-relaxed">
              {{ t.subtitle }}
            </p>
            <div class="mt-7 flex flex-col sm:flex-row gap-3">
              <!-- Primary — register (or dashboard if signed in). On mobile
                   this is the main entry to the app since the nav doesn't
                   expose auth buttons. -->
              <NuxtLink
                :to="primaryHref"
                class="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-primary-600 text-white font-bold rounded-full shadow-lg hover:shadow-xl hover:bg-primary-700 transition-all text-base"
              >
                {{ primaryLabel }}
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
              </NuxtLink>
              <!-- Secondary — non-auth users see "Iniciar sesión", signed-in
                   users see "Cómo funciona" because they don't need login. -->
              <NuxtLink
                :to="secondaryHref"
                class="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white/10 backdrop-blur border border-white/20 text-white font-semibold rounded-full hover:bg-white/20 transition-colors text-base"
              >
                {{ secondaryLabel }}
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <!-- Infinite logo strip, white-on-photo, pinned to the bottom of the
           hero. Edges are masked so logos fade in/out over the image. -->
      <div class="relative pb-5 sm:pb-6">
        <div class="logo-marquee-mask overflow-hidden">
          <div class="flex gap-8 sm:gap-10 lg:gap-12 w-max animate-hero-logo-scroll">
            <template v-for="n in 3" :key="`set-${n}`">
              <img
                v-for="(logo, index) in logos"
                :key="`logo-${n}-${index}`"
                :src="logo.src"
                :alt="logo.alt"
                width="120" height="40"
                class="h-10 sm:h-12 w-auto object-contain flex-shrink-0 hero-logo-white opacity-70"
                loading="lazy"
                decoding="async"
                draggable="false"
              />
            </template>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'

const { t: createTranslations } = useLanguage()
const user = useUser()

// Image swap: hero-candidate.png is the new generation; falls back to the
// existing hero1/mobilehero1 if you ever want to revert. Same files used
// for mobile + desktop since the new hero already accounts for both.
const desktopImageSrc = '/images/hero-shopper.png'
const mobileImageSrc  = '/images/hero-shopper.png'

const t = createTranslations({
  title:          { es: 'Compra en USA sin fronteras.', en: 'Shop the US without borders.' },
  subtitle:       { es: 'Nosotros lo compramos, lo recibimos y lo trasladamos. Tú lo recibes en tu casa en México.', en: 'We buy it, receive it, and ship it. You get it delivered to your door in Mexico.' },
  createAccount:  { es: 'Crear cuenta gratis', en: 'Create free account' },
  myAccount:      { es: 'Ir a mi cuenta', en: 'Go to my account' },
  signIn:         { es: 'Iniciar sesión', en: 'Sign in' },
  howItWorks:     { es: 'Cómo funciona', en: 'How it works' },
  imageAlt:       { es: 'Compra en USA con Boxly', en: 'Shop the US with Boxly' },
})

const isAuthed = computed(() => Boolean(user?.value?.id))

const primaryHref  = computed(() => (isAuthed.value ? '/app' : '/register'))
const primaryLabel = computed(() => (isAuthed.value ? t.value.myAccount : t.value.createAccount))
const secondaryHref  = computed(() => (isAuthed.value ? '/how-it-works' : '/login'))
const secondaryLabel = computed(() => (isAuthed.value ? t.value.howItWorks : t.value.signIn))

// US stores whose logos scroll across the bottom of the hero. Rendered
// solid white over the photo via the .hero-logo-white filter.
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
/* Solid-white treatment so dark-mark logos read over the photo. */
.hero-logo-white {
  filter: brightness(0) invert(1);
}

/* Track is tripled; shifting by one set (-100%/3) loops seamlessly. */
@keyframes hero-logo-scroll {
  from { transform: translateX(0); }
  to   { transform: translateX(calc(-100% / 3)); }
}
.animate-hero-logo-scroll {
  animation: hero-logo-scroll 50s linear infinite;
  will-change: transform;
}
.animate-hero-logo-scroll:hover {
  animation-play-state: paused;
}

/* Fade the strip edges into the photo instead of a hard cut. */
.logo-marquee-mask {
  -webkit-mask-image: linear-gradient(to right, transparent, #000 8%, #000 92%, transparent);
          mask-image: linear-gradient(to right, transparent, #000 8%, #000 92%, transparent);
}

@media (prefers-reduced-motion: reduce) {
  .animate-hero-logo-scroll { animation: none; }
}
</style>
