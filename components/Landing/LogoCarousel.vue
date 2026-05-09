<template>
  <section class="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-white to-gray-50 border-b border-gray-100 overflow-hidden">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="text-center mb-8 sm:mb-10 lg:mb-12">
        <h3 class="text-base sm:text-lg font-semibold text-gray-700">
          {{ t.logosHeader }}
        </h3>
      </div>
      
      <!-- Carousel Container -->
      <div class="relative">
        <!-- Gradient Overlays -->
        <div class="absolute left-0 top-0 w-8 sm:w-16 md:w-24 lg:w-32 h-full bg-gradient-to-r from-white via-white/80 to-transparent z-10 pointer-events-none"></div>
        <div class="absolute right-0 top-0 w-8 sm:w-16 md:w-24 lg:w-32 h-full bg-gradient-to-l from-white via-white/80 to-transparent z-10 pointer-events-none"></div>
        
        <!-- Scrollable Container -->
        <div 
          ref="scrollContainer"
          class="flex overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing"
          @mousedown="startDrag"
          @mousemove="onDrag"
          @mouseup="endDrag"
          @mouseleave="endDrag"
          @touchstart="handleTouch"
          @touchmove="handleTouch"
          @touchend="stopTouch"
        >
          <!-- Logo Track with continuous animation -->
          <div 
            ref="logoTrack"
            class="flex gap-6 sm:gap-8 md:gap-10 lg:gap-12 animate-infinite-scroll"
            :class="{ 'pause-animation': isDragging }"
          >
            <!-- Triple set for true infinite scroll -->
            <template v-for="n in 3">
              <div 
                v-for="(logo, index) in logos" 
                :key="`logo-${n}-${index}`"
                class="flex-shrink-0"
              >
                <img
                  :src="logo.src"
                  :alt="logo.alt"
                  width="160"
                  height="64"
                  class="h-16 lg:h-20 w-auto object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer hover:scale-105 select-none"
                  loading="lazy"
                  decoding="async"
                  draggable="false"
                >
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// Use language composable
const { t: createTranslations } = useLanguage()

// Translations
const translations = {
  logosHeader: {
    es: 'Compra en tus tiendas favoritas de EE. UU. y ahorra en el envío a México',
    en: 'Shop from your favorite U.S. stores and save on shipping to Mexico'
  }
}

const t = createTranslations(translations)

// Logo data
const logos = [
  {
    src: 'https://static.nc-myus.com/images/pub/www/uploads/image/21afeea318a64a71bcb1dbd3ef27ffec/shein-logo.png',
    alt: 'SHEIN'
  },
  {
    src: 'https://static.nc-myus.com/images/pub/www/uploads/image/c7378301189a420a8648cdc317dad98b/sephora.png',
    alt: 'Sephora'
  },
  {
    src: 'https://static.nc-myus.com/images/pub/www/uploads/image/4342cf740e1d4c809a5266f006012ffc/macys-logo.png',
    alt: "Macy's"
  },
  {
    src: 'https://static.nc-myus.com/images/pub/www/uploads/image/9b11fc458968411b972a0f7df9e42c67/apple-logo.png',
    alt: 'Apple'
  },
  {
    src: 'https://static.nc-myus.com/images/pub/www/uploads/image/22ea4c4db5df4d4fbb4f5067de096869/shop-disney-logo.png',
    alt: 'Disney'
  },
  {
    src: 'https://static.nc-myus.com/images/pub/www/uploads/image/9c6f199c00bc41a8ba335347cbb4ac66/ready-edit-nordstrom-logo-transparent-2.png',
    alt: 'Nordstrom'
  },
  {
    src: 'https://static.nc-myus.com/images/pub/www/uploads/image/3706eb76defa4368bf0c8b1d738b3456/amazon-logo.png',
    alt: 'Amazon'
  },
  {
    src: 'https://static.nc-myus.com/images/pub/www/uploads/image/7569832f95cb49f8af42a2aa4c4adc8d/walmart-logo.png',
    alt: 'Walmart'
  },
  {
    src: 'https://static.nc-myus.com/images/pub/www/uploads/image/fbd77ea07e224a73b1fecf4137d7ba78/ebay-logo.png',
    alt: 'eBay'
  },
  {
    src: 'https://static.nc-myus.com/images/pub/www/uploads/image/f3ffc5a464e94ff89d4405d026923c27/bath-body-works.png',
    alt: 'Bath & Body Works'
  },
  {
    src: 'https://static.nc-myus.com/images/pub/www/uploads/image/3e5ad2a7062640a1a4fee03f0004ebbe/gap.png',
    alt: 'Gap'
  },
  {
    src: 'https://static.nc-myus.com/images/pub/www/uploads/image/774f8d281cfe45ef81f7882de1599be2/carters-logo-120x120.png',
    alt: "Carter's"
  }
]

// Refs and state
const scrollContainer = ref(null)
const logoTrack = ref(null)
const isDragging = ref(false)
const startX = ref(0)
const scrollLeft = ref(0)
let checkInterval = null

// Mouse drag handlers (your original smooth implementation)
const startDrag = (e) => {
  isDragging.value = true
  startX.value = e.pageX - scrollContainer.value.offsetLeft
  scrollLeft.value = scrollContainer.value.scrollLeft
}

const onDrag = (e) => {
  if (!isDragging.value) return
  e.preventDefault()
  const x = e.pageX - scrollContainer.value.offsetLeft
  const walk = (x - startX.value) * 2
  scrollContainer.value.scrollLeft = scrollLeft.value - walk
}

const endDrag = () => {
  isDragging.value = false
}

// Touch handlers
const handleTouch = (e) => {
  isDragging.value = true
}

const stopTouch = () => {
  isDragging.value = false
}

// Check scroll position for infinite loop
const checkScrollPosition = () => {
  if (!scrollContainer.value || isDragging.value) return
  
  const container = scrollContainer.value
  const scrollWidth = container.scrollWidth
  const currentScroll = container.scrollLeft
  const clientWidth = container.clientWidth
  
  // Calculate the width of one set (1/3 of total)
  const oneSetWidth = scrollWidth / 3
  
  // If we've scrolled past 2 sets, reset to position of 1 set
  if (currentScroll >= oneSetWidth * 2) {
    container.scrollLeft = currentScroll - oneSetWidth
  }
  // If we've scrolled before the first set, jump forward
  else if (currentScroll <= 0) {
    container.scrollLeft = oneSetWidth
  }
}

// Initialize
onMounted(() => {
  if (scrollContainer.value) {
    // Start at middle position
    const scrollWidth = scrollContainer.value.scrollWidth
    scrollContainer.value.scrollLeft = scrollWidth / 3
    
    // Check position periodically for infinite loop
    checkInterval = setInterval(checkScrollPosition, 100)
  }
})

onUnmounted(() => {
  if (checkInterval) {
    clearInterval(checkInterval)
  }
})
</script>

<style scoped>
/* Hide scrollbar */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* Continuous scroll animation */
@keyframes infinite-scroll {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(calc(-100% / 3));
  }
}

.animate-infinite-scroll {
  animation: infinite-scroll 60s linear infinite;
  will-change: transform;
}

/* Pause animation when dragging or hovering */
.animate-infinite-scroll:hover,
.animate-infinite-scroll.pause-animation {
  animation-play-state: paused;
}
</style>