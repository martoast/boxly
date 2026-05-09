<template>
  <header class="relative w-full h-screen min-h-[600px] overflow-hidden">
    <!-- Carousel Container with Touch Support -->
    <div class="relative w-full h-full" 
         @touchstart="handleTouchStart"
         @touchmove="handleTouchMove"
         @touchend="handleTouchEnd">
      <!-- Slides -->
      <transition-group
        name="slide"
        tag="div"
        class="relative w-full h-full"
      >
        <div
          v-for="(slide, index) in slides"
          v-show="currentSlide === index"
          :key="index"
          class="absolute inset-0 w-full h-full"
        >
          <!-- Desktop Background Image — modern browsers get the WebP
               variant (60-80% smaller). First slide is the LCP element
               so it's eager + high fetchpriority; subsequent slides
               are lazy. Explicit dimensions reserve space and prevent
               any layout shift. -->
          <picture class="hidden md:block">
            <source :srcset="webpFor(slide.image)" type="image/webp" />
            <img
              :src="slide.image"
              :alt="slide.title"
              width="1600" height="768"
              :loading="index === 0 ? 'eager' : 'lazy'"
              :fetchpriority="index === 0 ? 'high' : undefined"
              decoding="async"
              class="absolute inset-0 w-full h-full object-cover"
            />
          </picture>

          <!-- Mobile Background Image -->
          <picture class="md:hidden">
            <source :srcset="webpFor(slide.mobileImage)" type="image/webp" />
            <img
              :src="slide.mobileImage"
              :alt="slide.title"
              width="1009" height="1414"
              :loading="index === 0 ? 'eager' : 'lazy'"
              :fetchpriority="index === 0 ? 'high' : undefined"
              decoding="async"
              class="absolute inset-0 w-full h-full object-cover"
            />
          </picture>
          
          <!-- Gradient Overlay for better text readability -->
          <div class="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-transparent"></div>
          
          <!-- Content Container -->
          <div class="relative h-full flex items-center">
            <div class="container mx-auto px-6 md:px-12 lg:px-20">
              <div class="max-w-2xl">
                <!-- Title -->
                <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight text-shadow-lg">
                  {{ slide.title }}
                </h1>
                
                <!-- Subtitle -->
                <p class="text-lg md:text-xl text-white mb-8 text-shadow">
                  {{ slide.subtitle }}
                </p>
                
                <!-- CTA Buttons -->
                <div
                  class="flex gap-4 justify-start flex-wrap"
                  @touchstart.stop
                  @touchmove.stop
                  @touchend.stop
                >
                  <NuxtLink
                    :to="registerLink"
                    class="px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-full transition-all duration-300 hover:scale-105 hover:shadow-xl inline-flex items-center gap-2"
                  >
                    {{ slide.ctaText || t.ctaRegister }}
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                    </svg>
                  </NuxtLink>

                  <NuxtLink
                    to="/how-it-works"
                    class="px-8 py-4 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-semibold rounded-full transition-all duration-300 border border-white/30"
                  >
                    {{ t.ctaHowItWorks }}
                  </NuxtLink>
                </div>

                <!-- Trustpilot Reviews Link -->
                <a
                  href="https://www.trustpilot.com/review/boxly.mx"
                  target="_blank"
                  rel="noopener"
                  class="mt-6 inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors duration-300 group"
                >
                  <div class="flex items-center gap-0.5">
                    <svg v-for="i in 5" :key="i" class="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  </div>
                  <span class="text-sm font-medium">{{ t.reviewsOnTrustpilot }}</span>
                  <svg class="w-4 h-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </transition-group>
      
      <!-- Navigation Arrows - Hidden on mobile -->
      <button
        @click="previousSlide"
        class="hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full items-center justify-center text-white hover:bg-white/30 transition-all duration-300 hover:scale-110"
        aria-label="Previous slide"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </button>
      
      <button
        @click="nextSlide"
        class="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full items-center justify-center text-white hover:bg-white/30 transition-all duration-300 hover:scale-110"
        aria-label="Next slide"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </button>
      
      <!-- Dots Navigation -->
      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        <button
          v-for="(slide, index) in slides"
          :key="index"
          @click="goToSlide(index)"
          :class="[
            'w-3 h-3 rounded-full transition-all duration-300',
            currentSlide === index ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/70'
          ]"
          :aria-label="`Go to slide ${index + 1}`"
        ></button>
      </div>
    </div>
    
    <!-- Track Package Section (appears below carousel) -->
    <!-- <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent py-6">
      <div class="container mx-auto px-6 text-center">
        <div class="flex items-center justify-center gap-3 mb-3">
          <span class="block w-16 h-[1px] bg-white/30"></span>
          <span class="text-white/80 text-sm">{{ t.alreadyHavePackage }}</span>
          <span class="block w-16 h-[1px] bg-white/30"></span>
        </div>
        <NuxtLink
          :to="trackLink"
          class="group inline-flex items-center gap-3 text-white hover:text-primary-300 transition-colors duration-300"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 01.553-.894L9 2m0 18l6-3m-6 3V2m6 16l5.447 2.724A1 1 0 0021 19.382V8.618a1 1 0 00-.553-.894L15 5m0 13V5m0 0L9 2"/>
          </svg>
          <span class="font-semibold">{{ t.ctaTrack }}</span>
          <svg class="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </NuxtLink>
      </div>
    </div> -->
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

// Derive the .webp sibling path of a JPEG/PNG asset. We generate
// these via cwebp at build/asset time and ship them next to the
// originals; this lets us bind <source srcset> directly off the
// existing slide.image / slide.mobileImage strings without extra
// data fields.
const webpFor = (path) => path ? path.replace(/\.(jpe?g|png)$/i, '.webp') : path

// Preload the first slide's hero images — they're the LCP element of
// the marketing landing. Two media-targeted preloads so each viewport
// only downloads its variant. Browser parses these in <head> before
// the slide markup is even processed.
useHead({
  link: [
    { rel: 'preload', as: 'image', href: '/hero1.webp', type: 'image/webp', media: '(min-width: 768px)', fetchpriority: 'high' },
    { rel: 'preload', as: 'image', href: '/mobilehero1test.webp', type: 'image/webp', media: '(max-width: 767px)', fetchpriority: 'high' },
  ],
})

const { t: createTranslations, language } = useLanguage()
const route = useRoute()

// Props
const props = defineProps({
  landingType: {
    type: String,
    default: 'shoppers',
    validator: (value) => ['shoppers', 'business', 'general'].includes(value)
  }
})

// Carousel state
const currentSlide = ref(0)
let slideInterval = null

// Touch handling state
const touchStartX = ref(0)
const touchEndX = ref(0)
const isDragging = ref(false)

// Translations
const translations = {
  ctaRegister: {
    es: "Regístrate Gratis",
    en: "Register Free",
  },
  ctaHowItWorks: {
    es: "Como Funciona",
    en: "How it works",
  },
  alreadyHavePackage: {
    es: "¿Ya tienes una orden?",
    en: "Already have an order?",
  },
  ctaTrack: {
    es: "Rastrear Mi Envío",
    en: "Track My Shipment",
  },
  reviewsOnTrustpilot: {
    es: "Ver reseñas en Trustpilot",
    en: "See reviews on Trustpilot",
  }
}

const t = createTranslations(translations)

// Slides data with both desktop and mobile images
const slides = computed(() => {
  const baseSlides = language.value === 'es' ? [
    {
      image: '/hero1.jpeg',
      mobileImage: '/mobilehero1test.jpeg',
      title: 'Vive el shopping sin fronteras',
      subtitle: 'Compra en cualquier tienda de USA y recíbelo en México, todo en una sola caja.',
      ctaText: 'Empieza Ahora'
    },
    {
      image: '/hero2.jpeg',
      mobileImage: '/mobilehero2.jpeg',
      title: 'Tu dirección en USA para comprar sin límites',
      subtitle: 'Consolidamos tus compras, las enviamos a México y tú ahorras más.',
      ctaText: 'Regístrate Gratis'
    }
  ] : [
    {
      image: '/hero1.jpeg',
      mobileImage: '/mobilehero1.jpeg',
      title: 'Shop from any store in the world',
      subtitle: 'Your US address for unlimited shopping',
      ctaText: 'Start Now'
    },
    {
      image: '/hero2.jpeg',
      mobileImage: '/mobilehero2.jpeg',
      title: 'Receive all your packages in Mexico',
      subtitle: 'We consolidate your purchases and save on shipping',
      ctaText: 'Register Free'
    }
  ]
  
  return baseSlides
})

// Carousel methods
const nextSlide = () => {
  currentSlide.value = (currentSlide.value + 1) % slides.value.length
}

const previousSlide = () => {
  currentSlide.value = currentSlide.value === 0 ? slides.value.length - 1 : currentSlide.value - 1
}

const goToSlide = (index) => {
  currentSlide.value = index
  stopAutoPlay()
  startAutoPlay() // Restart auto-play after manual navigation
}

// Auto-play carousel
const startAutoPlay = () => {
  slideInterval = setInterval(nextSlide, 5000) // Change slide every 5 seconds
}

const stopAutoPlay = () => {
  if (slideInterval) {
    clearInterval(slideInterval)
  }
}

// Touch handling functions
const handleTouchStart = (e) => {
  touchStartX.value = e.touches[0].clientX
  isDragging.value = true
  stopAutoPlay() // Stop auto-play while user is interacting
}

const handleTouchMove = (e) => {
  if (!isDragging.value) return
  touchEndX.value = e.touches[0].clientX
}

const handleTouchEnd = () => {
  if (!isDragging.value) return
  
  const swipeDistance = touchStartX.value - touchEndX.value
  const threshold = 50 // Minimum swipe distance in pixels
  
  if (Math.abs(swipeDistance) > threshold) {
    if (swipeDistance > 0) {
      // Swiped left - go to next slide
      nextSlide()
    } else {
      // Swiped right - go to previous slide
      previousSlide()
    }
  }
  
  isDragging.value = false
  startAutoPlay() // Resume auto-play after swipe
}

// Link building functions
const buildTrackedLink = (basePath, additionalParams = {}) => {
  const params = new URLSearchParams()
  
  for (const [key, value] of Object.entries(route.query)) {
    if (value) params.set(key, value)
  }
  
  for (const [key, value] of Object.entries(additionalParams)) {
    if (value) params.set(key, value)
  }
  
  const queryString = params.toString()
  return queryString ? `${basePath}?${queryString}` : basePath
}

const registerLink = computed(() => {
  let source = 'landing_page_general'
  let preselect = 'shopper'
  
  switch (props.landingType) {
    case 'shoppers':
      source = 'landing_page_shoppers'
      preselect = 'shopper'
      break
    case 'business':
      source = 'landing_page_business'
      preselect = 'business'
      break
    case 'general':
      source = 'landing_page_general'
      preselect = null
      break
  }
  
  const additionalParams = { source }
  if (preselect) additionalParams.preselect = preselect
  
  return buildTrackedLink('/register', additionalParams)
})

const trackLink = computed(() => buildTrackedLink('/track'))

// Lifecycle
onMounted(() => {
  startAutoPlay()
})

onUnmounted(() => {
  stopAutoPlay()
})
</script>

<style scoped>
/* Slide transitions */
.slide-enter-active,
.slide-leave-active {
  transition: opacity 1s ease-in-out;
}

.slide-enter-from {
  opacity: 0;
}

.slide-leave-to {
  opacity: 0;
}

/* Text shadow for better readability */
.text-shadow {
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.text-shadow-lg {
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.7);
}
</style>