<template>
  <!-- Landing hero — bright outlet-shopping photo with a gradient overlay
       so the white headline stays readable. Overlay is left-heavy on
       desktop (text sits left, subject sits right) and bottom-heavy on
       mobile where the layout stacks. Primary CTA on mobile is
       register/login because the mobile nav doesn't expose those buttons;
       signed-in users see a "Mi cuenta" shortcut instead. -->
  <header class="relative w-full overflow-hidden bg-gray-900">
    <picture>
      <source media="(max-width: 768px)" :srcset="mobileImageSrc" type="image/webp" />
      <source :srcset="desktopImageSrc" type="image/webp" />
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
           hero. Edges are masked so logos fade in/out over the image.
           A REAL scroller (2026-10-19): users reported they couldn't swipe it
           and that it went blank at the end. It used to be a CSS translate
           inside overflow-hidden — nothing to swipe, a tap left iOS's sticky
           :hover pausing it, and the -100%/3 loop drifted by a third of a gap
           per lap. Now the finger scrolls it natively and `tick` auto-advances
           it, wrapping by the MEASURED width of one set in both directions. -->
      <div class="relative pb-5 sm:pb-6">
        <div
          ref="strip"
          class="logo-marquee-mask logo-strip overflow-x-auto"
          @touchstart.passive="hold"
          @touchend.passive="release"
          @touchcancel.passive="release"
          @pointerenter="e => e.pointerType === 'mouse' && hold()"
          @pointerleave="e => e.pointerType === 'mouse' && release()"
          @wheel.passive="nudge"
        >
          <div ref="track" class="flex gap-8 sm:gap-10 lg:gap-12 w-max">
            <template v-for="n in COPIES" :key="`set-${n}`">
              <img
                v-for="(logo, index) in logos"
                :key="`logo-${n}-${index}`"
                :src="logo.src"
                :alt="n === 1 ? logo.alt : ''"
                :aria-hidden="n === 1 ? undefined : 'true'"
                width="120" height="120"
                class="h-10 sm:h-12 w-auto object-contain flex-shrink-0 hero-logo-white opacity-70"
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
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const { t: createTranslations } = useLanguage()
const user = useUser()

// The LCP element. It was a 781 KB PNG served identically to phones and
// desktops, which is most of why Lighthouse measured LCP at 10.6s on a
// throttled Moto G. Now WebP, with a 768px-wide variant for phones — the
// audience that complains about this is on 3G, and they were downloading a
// 1376px desktop hero to paint a ~400px-wide box.
//   PNG 781K  ->  desktop WebP 176K  ->  mobile WebP 65K
const desktopImageSrc = '/images/hero-shopper.webp'
const mobileImageSrc  = '/images/hero-shopper-mobile.webp'

const t = createTranslations({
  title:          { es: 'Compra en USA como si vivieras allá', en: 'Shop in the US like you live there' },
  subtitle:       { es: 'Nosotros compramos, recibimos e importamos tus pedidos. Tú los recibes en la puerta de tu casa en México.', en: 'We buy, receive and import your orders. You get them at your door in Mexico.' },
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
  { src: '/images/stores/ulta-beauty-square.png', alt: 'Ulta Beauty' },
  { src: 'https://static.nc-myus.com/images/pub/www/uploads/image/774f8d281cfe45ef81f7882de1599be2/carters-logo-120x120.png', alt: "Carter's" },
]

// The strip scrolls within [one set, two sets); five copies keep logos on
// screen up to a viewport three sets wide (~3,400px at lg sizes).
const COPIES = 5
const SPEED = 30         // px per second of auto-scroll
const RESUME_MS = 2500   // after a swipe, let momentum settle before taking over

const strip = ref(null)
const track = ref(null)
let period = 0           // exact width of one set, gap included
let pos = 0              // float position — scrollLeft rounds on some browsers
let held = false
let resumeAt = 0
let last = 0
let raf = 0
let observer = null

function measure() {
  const imgs = track.value?.children
  if (!imgs || imgs.length <= logos.length) return
  const next = imgs[logos.length].offsetLeft - imgs[0].offsetLeft
  if (next > 0 && next !== period) {
    // Keep the same logo under the viewport when the layout changes (a logo
    // finishing loading, a resize).
    const into = period ? (pos - period) / period : 0
    period = next
    pos = period + into * period
    strip.value.scrollLeft = pos
  }
}

function hold() { held = true }
function release() { held = false; nudge() }
function nudge() { resumeAt = performance.now() + RESUME_MS }

function tick(t) {
  const el = strip.value
  const dt = last ? Math.min(t - last, 100) / 1000 : 0
  last = t
  if (el && period) {
    const auto = !held && t >= resumeAt
    pos = auto ? pos + SPEED * dt : el.scrollLeft
    let wrapped = false
    if (pos >= 2 * period) { pos -= period; wrapped = true }
    else if (pos < period) { pos += period; wrapped = true }
    // Only write while auto-scrolling or to wrap; writing during a swipe would
    // fight the finger.
    if (auto || wrapped) el.scrollLeft = pos
  }
  raf = requestAnimationFrame(tick)
}

onMounted(() => {
  measure()
  observer = new ResizeObserver(measure)
  observer.observe(track.value)
  // Reduced motion: still swipeable, just never moves on its own.
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    raf = requestAnimationFrame(tick)
  } else {
    strip.value.addEventListener('scroll', () => {
      pos = strip.value.scrollLeft
      if (pos >= 2 * period) strip.value.scrollLeft = pos - period
      else if (pos < period) strip.value.scrollLeft = pos + period
    }, { passive: true })
  }
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  observer?.disconnect()
})
</script>

<style scoped>
/* Solid-white treatment so dark-mark logos read over the photo. */
.hero-logo-white {
  filter: brightness(0) invert(1);
}

/* Swipeable, but no visible scrollbar. */
.logo-strip {
  scrollbar-width: none;
  overscroll-behavior-x: contain;
}
.logo-strip::-webkit-scrollbar {
  display: none;
}

/* Fade the strip edges into the photo instead of a hard cut. */
.logo-marquee-mask {
  -webkit-mask-image: linear-gradient(to right, transparent, #000 8%, #000 92%, transparent);
          mask-image: linear-gradient(to right, transparent, #000 8%, #000 92%, transparent);
}
</style>
