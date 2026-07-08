<template>
  <section class="py-8 sm:py-16 px-4 sm:px-6 lg:px-8" :class="backgroundColor">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div v-if="showHeader" class="text-center mb-8 sm:mb-12">
        <h2 class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-3 sm:mb-4">
          {{ t.pricingTitle }}
        </h2>
        <p class="text-base sm:text-lg text-gray-600 max-w-2xl sm:max-w-3xl mx-auto px-4">
          {{ t.pricingSubtitle }}
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="loadingProducts" class="flex flex-col items-center justify-center py-12 sm:py-16">
        <div class="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-primary-50 rounded-2xl mb-4">
          <svg class="animate-spin h-6 w-6 sm:h-8 sm:w-8 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <p class="text-gray-500 text-sm sm:text-base">{{ t.loadingPricing }}</p>
      </div>

      <!-- Pricing Content -->
      <div v-else>
        <!-- Mobile: Enhanced Cards with Clear CTAs -->
        <div class="block lg:hidden space-y-3 sm:space-y-4 mb-8 sm:mb-12">
          <div 
            v-for="(box, index) in availableBoxes" 
            :key="box.id"
            class="relative bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 animate-fadeIn"
            :style="`animation-delay: ${index * 0.05}s`"
          >
            <!-- Card Content -->
            <div class="p-4 sm:p-6">
              <!-- Header with Logo and Price -->
              <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-3">
                  <img src="/logo.svg" alt="Box" class="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                  <div>
                    <h3 class="font-bold text-gray-900 text-base sm:text-lg flex items-center gap-2">
                      {{ getBoxTranslations(box).name }}
                      <span v-if="box.popular" class="text-[9px] font-bold uppercase tracking-wide text-primary-700 bg-primary-100 rounded-full px-1.5 py-0.5">{{ t.mostPopular }}</span>
                    </h3>
                  </div>
                </div>
              </div>

              <!-- Price Display - Prominent -->
              <div class="bg-primary-50 rounded-lg p-3 mb-4 text-center">
                <div class="text-2xl sm:text-3xl font-bold text-primary-600">
                  {{ formatPrice(getDisplayPrice(box)) }}
                </div>
                <div class="text-xs text-primary-600/70 mt-1">{{ t.price }}</div>
              </div>

              <!-- Key Features - Quick Info -->
              <div class="grid grid-cols-2 gap-2 mb-4">
                <div class="bg-gray-50 rounded-lg p-2 sm:p-3 text-center">
                  <svg class="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
                  </svg>
                  <div class="text-xs font-medium text-gray-700">{{ t.maxDimensions }}</div>
                  <div class="text-xs text-gray-500">{{ box.dimensions }}</div>
                </div>
                <div v-if="box.max_weight" class="bg-gray-50 rounded-lg p-2 sm:p-3 text-center">
                  <svg class="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/>
                  </svg>
                  <div class="text-xs font-medium text-gray-700">{{ t.maxWeight }}</div>
                  <div class="text-xs text-gray-500">{{ box.max_weight }}kg</div>
                </div>
              </div>

              <!-- Description - Mobile optimized -->
              <p class="text-xs sm:text-sm text-gray-600 mb-4">
                {{ getBoxTranslations(box).description }}
              </p>

              <!-- CTA Button - Full width and prominent -->
              <button
                @click="handleBoxSelection(box)"
                class="w-full py-3 px-4 rounded-lg font-semibold text-sm sm:text-base transition-all duration-300 bg-primary-500 text-white shadow-sm hover:bg-primary-600 hover:shadow-md active:scale-[0.98]"
              >
                {{ t.selectBox }}
                <svg class="inline-block w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Desktop: Enhanced Table with Visual Appeal -->
        <div class="hidden lg:block mb-12">
          <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <!-- Table Header -->
            <div class="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-5">
              <div class="grid grid-cols-12 gap-4 items-center text-white">
                <div class="col-span-4">
                  <h3 class="text-lg font-semibold flex items-center gap-2">
                    {{ t.boxType }}
                  </h3>
                </div>
                <div class="col-span-2 text-center">
                  <h3 class="text-sm font-medium opacity-90">{{ t.dimensions }}</h3>
                </div>
                <div class="col-span-2 text-center">
                  <h3 class="text-sm font-medium opacity-90">{{ t.maxWeight }}</h3>
                </div>
                <div class="col-span-2 text-center">
                  <h3 class="text-sm font-medium opacity-90">{{ t.price }}</h3>
                </div>
                <div class="col-span-2 text-center">
                  <h3 class="text-sm font-medium opacity-90">{{ t.action }}</h3>
                </div>
              </div>
            </div>

            <!-- Table Rows -->
            <div class="divide-y divide-gray-100">
              <div 
                v-for="(box, index) in availableBoxes" 
                :key="box.id"
                class="relative px-6 py-6 hover:bg-gray-50/50 transition-all duration-200 animate-fadeIn"
                :style="`animation-delay: ${index * 0.05}s`"
              >
                
                
                <div class="grid grid-cols-12 gap-4 items-center">
                  <!-- Box Info -->
                  <div class="col-span-4 flex items-center gap-4">
                    <img src="/logo.svg" alt="Box" class="w-12 h-12 flex-shrink-0">
                    <div>
                      <h4 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        {{ getBoxTranslations(box).name }}
                        <span v-if="box.popular" class="text-[10px] font-bold uppercase tracking-wide text-primary-700 bg-primary-100 rounded-full px-2 py-0.5">{{ t.mostPopular }}</span>
                      </h4>
                      <p class="text-sm text-gray-600 max-w-md">{{ getBoxTranslations(box).description }}</p>
                    </div>
                  </div>

                  <!-- Dimensions -->
                  <div class="col-span-2 text-center">
                    <div class="inline-flex flex-col items-center justify-center bg-gray-50 rounded-lg px-3 py-2">
                      <div class="text-sm font-semibold text-gray-900">{{ box.dimensions }}</div>
                      <div class="text-xs text-gray-500">cm (L × W × H)</div>
                    </div>
                  </div>

                  <!-- Max Weight -->
                  <div class="col-span-2 text-center">
                    <div v-if="box.max_weight" class="inline-flex items-center gap-1 bg-gray-50 rounded-lg px-3 py-2">
                      <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/>
                      </svg>
                      <span class="text-sm font-semibold text-gray-900">{{ box.max_weight }}kg</span>
                    </div>
                    <div v-else class="text-sm text-gray-400">-</div>
                  </div>

                  <!-- Price -->
                  <div class="col-span-2 text-center">
                    <div class="text-2xl font-bold text-primary-600">{{ formatPrice(getDisplayPrice(box)) }}</div>
                  </div>

                  <!-- Action -->
                  <div class="col-span-2 text-center">
                    <button
                      @click="handleBoxSelection(box)"
                      class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 bg-primary-500 text-white shadow-sm hover:bg-primary-600 hover:shadow-md hover:-translate-y-0.5"
                    >
                      {{ t.select }}
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Features Section - Mobile Optimized -->
        <div v-if="showFeatures" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
          <div class="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-100 text-center hover:shadow-sm transition-shadow">
            <div class="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-primary-50 rounded-lg sm:rounded-xl mb-3 sm:mb-4">
              <svg class="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <h3 class="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">{{ t.fastShipping }}</h3>
            <p class="text-xs sm:text-sm text-gray-600">{{ t.fastShippingDetails }}</p>
          </div>

          <div class="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-100 text-center hover:shadow-sm transition-shadow">
            <div class="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-green-50 rounded-lg sm:rounded-xl mb-3 sm:mb-4">
              <svg class="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h3 class="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">{{ t.fullTracking }}</h3>
            <p class="text-xs sm:text-sm text-gray-600">{{ t.fullTrackingDetails }}</p>
          </div>

          <div class="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-100 text-center hover:shadow-sm transition-shadow sm:col-span-2 lg:col-span-1">
            <div class="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-lg sm:rounded-xl mb-3 sm:mb-4">
              <svg class="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            </div>
            <h3 class="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">{{ t.securePackaging }}</h3>
            <p class="text-xs sm:text-sm text-gray-600">{{ t.securePackagingDetails }}</p>
          </div>
        </div>

        <!-- CTA Section - Mobile First -->
        <div v-if="showCTA" class="bg-gradient-to-br from-primary-50 via-primary-50/50 to-white rounded-xl sm:rounded-2xl p-6 sm:p-8 border border-primary-100 text-center">
          <h2 class="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">{{ t.readyToStart }}</h2>
          <p class="text-sm sm:text-base text-gray-600 mb-6 max-w-xl sm:max-w-2xl mx-auto px-4">{{ t.readyToStartDescription }}</p>
          
          <div class="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-md mx-auto">
            <NuxtLink 
              to="/app/orders/create"
              class="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 bg-primary-500 text-white font-semibold rounded-lg sm:rounded-xl shadow-md hover:bg-primary-600 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
            >
              <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              {{ t.createOrder }}
            </NuxtLink>
            
            <NuxtLink 
              to="/app/pricing/calculator"
              class="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 bg-white text-primary-600 font-semibold rounded-lg sm:rounded-xl shadow-sm hover:shadow-md border border-primary-200 transition-all duration-300"
            >
              <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
              </svg>
              {{ t.priceCalculator }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

// Props
const props = defineProps({
  showHeader: {
    type: Boolean,
    default: true
  },
  showFeatures: {
    type: Boolean,
    default: true
  },
  showCTA: {
    type: Boolean,
    default: true
  },
  backgroundColor: {
    type: String,
    default: 'bg-transparent'
  }
})

// Emits - removed since we don't need them

// Nuxt imports
const { $customFetch } = useNuxtApp()

// Use the language composable
const { t: createTranslations, language } = useLanguage()

// Exchange rate constant
const exchangeRate = 18

// State
const availableBoxes = ref([])
const loadingProducts = ref(true)

// Methods
const handleBoxSelection = (box) => {
  navigateTo(`/app/orders/create?box=${box.id}`)
}


const getDisplayPrice = (box) => {
  // Box prices are in MXN from the API
  const priceMXN = box.price
  const priceUSD = priceMXN / exchangeRate
  
  // Return USD for English, MXN for Spanish
  return language.value === 'en' ? priceUSD : priceMXN
}

const formatPrice = (amount) => {
  const currency = language.value === 'en' ? 'USD' : 'MXN'
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`
}

// Translations
const translations = {
  pricingTitle: {
    es: 'Precios por caja consolidada',
    en: 'Pricing per consolidated box'
  },
  pricingSubtitle: {
    es: 'Elige la caja perfecta para tu envio',
    en: 'Choose the perfect box for your shipping.'
  },
  loadingPricing: {
    es: 'Cargando precios...',
    en: 'Loading pricing...'
  },
  mostPopular: {
    es: 'Más Popular',
    en: 'Most Popular'
  },
  maxDimensions: {
    es: 'Dimensiones',
    en: 'Dimensions'
  },
  maxWeight: {
    es: 'Peso máximo',
    en: 'Maximum weight'
  },
  fastShipping: {
    es: 'Envío rápido',
    en: 'Fast shipping'
  },
  fastShippingDetails: {
    es: '3-5 días hábiles',
    en: '3-5 business days'
  },
  fullTracking: {
    es: 'Rastreo completo',
    en: 'Full tracking'
  },
  fullTrackingDetails: {
    es: 'Desde USA hasta tu puerta',
    en: 'From USA to your door'
  },
  selectBox: {
    es: 'Seleccionar Caja',
    en: 'Select Box'
  },
  select: {
    es: 'Elegir',
    en: 'Select'
  },
  boxType: {
    es: 'Tipo de Caja',
    en: 'Box Type'
  },
  dimensions: {
    es: 'Dimensiones',
    en: 'Dimensions'
  },
  price: {
    es: 'Precio',
    en: 'Price'
  },
  action: {
    es: 'Acción',
    en: 'Action'
  },
  securePackaging: {
    es: 'Empaque Seguro',
    en: 'Secure Packaging'
  },
  securePackagingDetails: {
    es: 'Protección completa para tus productos',
    en: 'Complete protection for your products'
  },
  readyToStart: {
    es: '¿Listo para Empezar?',
    en: 'Ready to Start?'
  },
  readyToStartDescription: {
    es: 'Crea tu primera orden o usa nuestra calculadora para estimar los costos exactos de tu envío.',
    en: 'Create your first order or use our calculator to estimate the exact costs of your shipment.'
  },
  createOrder: {
    es: 'Crear Envio',
    en: 'Create Order'
  },
  priceCalculator: {
    es: 'Calculadora de Precios',
    en: 'Price Calculator'
  },
  // Product translations
  smallBoxName: {
    es: 'Caja Pequeña',
    en: 'Small Box'
  },
  smallBoxDescription: {
    es: 'Ideal para: Libros, Cosméticos, Electrónicos, Suplementos y otros accesorios pequeños.',
    en: 'Best for: Books, Cosmetics, Electronics, Supplements and other small accessories.'
  },
  mediumBoxName: {
    es: 'Caja Mediana',
    en: 'Medium Box'
  },
  mediumBoxDescription: {
    es: 'Ideal para: Ropa, Tenis, Bolsas de mano, Libros, Artículos o Equipo deportivo',
    en: 'Best for: Clothing, Sneakers, Handbags, Books, Sports Gear or Equipment'
  },
  largeBoxName: {
    es: 'Caja Grande',
    en: 'Large Box'
  },
  largeBoxDescription: {
    es: 'Ideal para: Compras al mayoreo, Electrodomésticos de cocina, Artículos de decoración o Consolas de videojuegos y accesorios grandes.',
    en: 'Best for: Bulk purchases, Kitchen Appliances, Home Decor items, or gaming consoles or large accessories.'
  },
  extraSmallBoxName: {
    es: 'Caja Extra Pequeña',
    en: 'Extra Small Box'
  },
  extraSmallBoxDescription: {
    es: 'Ideal para: Joyería, Documentos importantes, Electrónicos y otros artículos valiosos compactos y ligeros.',
    en: 'Best for: Jewelry, Important documents, Electronics or other compact lightweight valuables.'
  },
  extraLargeBoxName: {
    es: 'Caja Extra Grande',
    en: 'Extra Large Box'
  },
  extraLargeBoxDescription: {
    es: 'Ideal para: Muebles pequeños, Electrodomésticos grandes, Equipos de gimnasio o Pedidos consolidados grandes.',
    en: 'Best for: Small Furniture, Large Home Appliances, Gym Equipment or Large Consolidated orders.'
  }
}

// Get reactive translations
const t = createTranslations(translations)

// Methods
const getBoxColor = (type) => {
  const colors = {
    'extra-small': {
      bgColor: 'bg-slate-50',
      iconColor: 'text-slate-600'
    },
    small: {
      bgColor: 'bg-primary-50',
      iconColor: 'text-primary-600'
    },
    medium: {
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    large: {
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600'
    },
    'extra-large': {
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600'
    }
  }
  return colors[type] || colors.small
}

const getBoxTranslations = (box) => {
  if (!box) return { name: '', description: '' }
  
  // Map Stripe product names to our translations
  const typeMapping = {
    'Extra Small Box': {
      name: t.value.extraSmallBoxName,
      description: t.value.extraSmallBoxDescription
    },
    'Small Box': {
      name: t.value.smallBoxName,
      description: t.value.smallBoxDescription
    },
    'Medium Box': {
      name: t.value.mediumBoxName,
      description: t.value.mediumBoxDescription
    },
    'Large Box': {
      name: t.value.largeBoxName,
      description: t.value.largeBoxDescription
    },
    'Extra Large Box': {
      name: t.value.extraLargeBoxName,
      description: t.value.extraLargeBoxDescription
    }
  }
  
  return typeMapping[box.name] || {
    name: box.name,
    description: box.description
  }
}

// Canonical box metadata — the /products API returns dimensions + max_weight as
// null, so we fill them from the official Boxly box table. This also fixes the row
// order and drops non-box catalog junk (e.g. Stripe CLI test products).
const BOX_META = {
  'Extra Small Box': { order: 0, dimensions: '32 × 24 × 13', max_weight: 8 },
  'Small Box':       { order: 1, dimensions: '42 × 27 × 32', max_weight: 15 },
  'Medium Box':      { order: 2, dimensions: '42 × 52 × 40', max_weight: 25, popular: true },
  'Large Box':       { order: 3, dimensions: '52 × 42 × 40', max_weight: 35 },
  'Extra Large Box': { order: 4, dimensions: '52 × 62 × 53', max_weight: 50 },
}
const fetchProducts = async () => {
  try {
    loadingProducts.value = true
    const response = await $customFetch('/products')
    const seen = new Set()
    // Keep only the real consolidated shipping boxes (MXN), one per size, in order.
    availableBoxes.value = (response.data || [])
      .filter((p) => p.currency === 'MXN' && p.consolidated === 'true' && p.shipping === 'true' && BOX_META[p.name])
      .filter((p) => (seen.has(p.name) ? false : (seen.add(p.name), true)))
      .map((p) => ({ ...p, ...BOX_META[p.name] }))
      .sort((a, b) => a.order - b.order)
  } catch (error) {
    console.error('Error fetching products:', error)
  } finally {
    loadingProducts.value = false
  }
}

// Lifecycle
onMounted(() => {
  fetchProducts()
})

// Watch for language changes to trigger re-render of prices
watch(language, () => {
  // Prices will automatically update due to reactive computed values
})
</script>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
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
</style>