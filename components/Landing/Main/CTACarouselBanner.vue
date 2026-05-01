<template>
    <section class="relative w-full h-[500px] md:h-[450px] overflow-hidden bg-gray-900">
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
            <!-- Background Image -->
            <img
              :src="slide.image"
              :alt="slide.title"
              class="absolute inset-0 w-full h-full object-cover"
            />
            
            <!-- Gradient Overlay -->
            <div class="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent"></div>
            
            <!-- Content Container -->
            <div class="relative h-full flex items-center">
              <div class="container mx-auto px-6 md:px-12 lg:px-20">
                <div class="max-w-xl">
                  <!-- Title -->
                  <h2 class="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 leading-tight text-shadow-lg">
                    {{ slide.title }}
                  </h2>
                  
                  <!-- Description -->
                  <p class="text-base md:text-lg text-white/90 mb-6 text-shadow">
                    {{ slide.description }}
                  </p>
                  
                  <!-- CTA Button -->
                  <NuxtLink
                    :to="slide.link || registerLink"
                    class="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-full transition-all duration-300 hover:scale-105 hover:shadow-xl"
                  >
                    {{ slide.buttonText }}
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                    </svg>
                  </NuxtLink>
                </div>
              </div>
            </div>
          </div>
        </transition-group>
        
        <!-- Navigation Arrows - Hidden on mobile -->
        <button
          @click="previousSlide"
          class="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full items-center justify-center text-white hover:bg-white/30 transition-all duration-300"
          aria-label="Previous slide"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        
        <button
          @click="nextSlide"
          class="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full items-center justify-center text-white hover:bg-white/30 transition-all duration-300"
          aria-label="Next slide"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
        
        <!-- Dots Navigation -->
        <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          <button
            v-for="(slide, index) in slides"
            :key="index"
            @click="goToSlide(index)"
            :class="[
              'w-2 h-2 rounded-full transition-all duration-300',
              currentSlide === index ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/70'
            ]"
            :aria-label="`Go to slide ${index + 1}`"
          ></button>
        </div>
      </div>
    </section>
  </template>
  
  <script setup>
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  
  const { t: createTranslations, language } = useLanguage()
  const route = useRoute()
  
  // Carousel state
  const currentSlide = ref(0)
  let slideInterval = null
  
  // Touch handling state
  const touchStartX = ref(0)
  const touchEndX = ref(0)
  const isDragging = ref(false)
  
  // Props for customization
  const props = defineProps({
    autoPlayInterval: {
      type: Number,
      default: 4000 // 4 seconds
    },
    showAutoPlay: {
      type: Boolean,
      default: true
    }
  })
  
  // Slides data
const slides = computed(() => {
  const baseSlides = language.value === 'es' ? [
    {
      image: '/yellow2.jpg',
      title: '¿Primera vez comprando?',
      description: 'Te guiamos paso a paso en tu primera compra internacional. Soporte 24/7 en español.',
      buttonText: 'Comenzar Ahora',
      link: '/register?source=cta_first_time'
    },
    {
      image: '/newbanner.jpeg',
      title: 'Ahorra hasta 60% en envíos',
      description: 'Consolidamos todos tus paquetes en uno solo. Paga un solo envío a México.',
      buttonText: 'Calcular Envío',
      link: '/shipping-calculator'
    }
  ] : [
    {
      image: '/yellow2.jpg',
      title: 'First time shopping abroad?',
      description: 'We guide you step by step in your first international purchase. 24/7 support.',
      buttonText: 'Start Now',
      link: '/register?source=landing_page_shoppers&preselect=shopper'
    },
    {
      image: '/newbanner.jpeg',
      title: 'Save up to 60% on shipping',
      description: 'We consolidate all your packages into one. Pay only one shipment to Mexico.',
      buttonText: 'Calculate Savings',
      link: '/shipping-calculator'
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
    if (props.showAutoPlay) {
      stopAutoPlay()
      startAutoPlay()
    }
  }
  
  // Auto-play carousel
  const startAutoPlay = () => {
    if (props.showAutoPlay) {
      slideInterval = setInterval(nextSlide, props.autoPlayInterval)
    }
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
    stopAutoPlay()
  }
  
  const handleTouchMove = (e) => {
    if (!isDragging.value) return
    touchEndX.value = e.touches[0].clientX
  }
  
  const handleTouchEnd = () => {
    if (!isDragging.value) return
    
    const swipeDistance = touchStartX.value - touchEndX.value
    const threshold = 50
    
    if (Math.abs(swipeDistance) > threshold) {
      if (swipeDistance > 0) {
        nextSlide()
      } else {
        previousSlide()
      }
    }
    
    isDragging.value = false
    if (props.showAutoPlay) {
      startAutoPlay()
    }
  }
  
  // Link building function
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
  
  const registerLink = computed(() => buildTrackedLink('/register', { source: 'cta_banner' }))
  
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
    transition: opacity 0.8s ease-in-out;
  }
  
  .slide-enter-from {
    opacity: 0;
  }
  
  .slide-leave-to {
    opacity: 0;
  }
  
  /* Text shadow for better readability */
  .text-shadow {
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.6);
  }
  
  .text-shadow-lg {
    text-shadow: 0 3px 6px rgba(0, 0, 0, 0.8);
  }
  </style>