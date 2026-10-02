<template>
  <div id="calculator" class="w-full max-w-lg mx-auto px-4 py-6">
    <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <!-- Header -->
      <div class="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-5">
        <h2 class="text-xl font-bold text-white">{{ t.title }}</h2>
        <p class="text-primary-100 text-sm mt-1">{{ t.subtitle }}</p>
      </div>

      <!-- Loading State -->
      <div v-if="loadingProducts" class="p-8 text-center">
        <svg class="animate-spin h-8 w-8 text-primary-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>

      <!-- Main Form -->
      <div v-else class="p-6 space-y-5">
        <!-- Weight Input with Unit Toggle -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-3">
            {{ t.weightLabel }}
          </label>
          
          <!-- Weight Unit Toggle Pills -->
          <div class="flex justify-center mb-3">
            <div class="inline-flex bg-gray-100 rounded-lg p-1">
              <button
                @click="weightUnit = 'kg'"
                :class="['px-4 py-2 text-sm font-medium rounded-md transition-all duration-200', 
                         weightUnit === 'kg' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900']"
              >
                {{ t.kilograms }}
              </button>
              <button
                @click="weightUnit = 'lb'"
                :class="['px-4 py-2 text-sm font-medium rounded-md transition-all duration-200', 
                         weightUnit === 'lb' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900']"
              >
                {{ t.pounds }}
              </button>
            </div>
          </div>
          
          <!-- Weight Input -->
          <div class="relative">
            <input 
              v-model.number="weight" 
              type="number" 
              step="0.1"
              placeholder="0" 
              @keyup.enter="calculate"
              class="w-full px-4 py-3 pr-12 text-lg font-medium rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
            >
            <div class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium pointer-events-none">
              {{ weightUnit }}
            </div>
          </div>
        </div>

        <!-- Optional Dimensions Toggle -->
        <div class="flex items-center gap-3">
          <input 
            id="show-dimensions" 
            type="checkbox" 
            v-model="showDimensions"
            class="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
          >
          <label for="show-dimensions" class="text-sm text-gray-600 cursor-pointer select-none">
            {{ t.addDimensions }}
          </label>
        </div>

        <!-- Dimensions (Optional) -->
        <div v-if="showDimensions" class="space-y-4 pt-2 animate-slideDown">
          <!-- Unit Toggle for Dimensions -->
          <div class="flex justify-end">
            <div class="inline-flex bg-gray-100 rounded-lg p-1">
              <button
                @click="dimensionUnit = 'cm'"
                :class="['px-3 py-1.5 text-sm font-medium rounded-md transition-all', 
                         dimensionUnit === 'cm' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900']"
              >
                cm
              </button>
              <button
                @click="dimensionUnit = 'in'"
                :class="['px-3 py-1.5 text-sm font-medium rounded-md transition-all', 
                         dimensionUnit === 'in' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900']"
              >
                in
              </button>
            </div>
          </div>

          <!-- Dimension Inputs Grid -->
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">{{ t.length }}</label>
              <input 
                v-model.number="lengthDisplay" 
                type="number" 
                step="0.1"
                placeholder="0" 
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">{{ t.width }}</label>
              <input 
                v-model.number="widthDisplay" 
                type="number" 
                step="0.1"
                placeholder="0" 
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">{{ t.height }}</label>
              <input 
                v-model.number="heightDisplay" 
                type="number" 
                step="0.1"
                placeholder="0" 
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
            </div>
          </div>
        </div>

        <!-- Calculate Button -->
        <button 
          @click="calculate"
          :disabled="!canCalculate || calculating"
          class="w-full py-3 px-4 bg-primary-500 text-white font-semibold rounded-lg shadow-md hover:bg-primary-600 hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md"
        >
          <span v-if="!calculating">{{ t.calculateButton }}</span>
          <span v-else class="flex items-center justify-center gap-2">
            <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            {{ t.calculating }}
          </span>
        </button>

        <!-- Result -->
        <transition name="fade">
          <div v-if="result" class="mt-6 pt-6 border-t border-gray-200">
            <!-- Success Result -->
            <div v-if="result.box" class="space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-medium text-gray-600">{{ t.recommendedBox }}</h3>
                <span v-if="result.usedDimensions" class="text-xs text-primary-600 bg-primary-50 px-2 py-1 rounded-full">
                  {{ t.withDimensions }}
                </span>
              </div>
              
              <div class="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-4">
                <div class="text-center">
                  <div class="text-lg font-semibold text-gray-900 mb-1">
                    {{ getBoxName(result.box) }}
                  </div>
                  <div class="text-3xl font-bold text-primary-600">
                    ${{ result.box.price.toFixed(2) }}
                    <span class="text-lg font-normal text-gray-600">{{ result.box.currency }}</span>
                  </div>
                  
                  <!-- Specs Grid -->
                  <div class="grid grid-cols-2 gap-3 mt-4 text-xs">
                    <div v-if="result.box.max_weight" class="bg-white/70 rounded-lg p-2">
                      <div class="text-gray-500">{{ t.maxWeight }}</div>
                      <div class="font-semibold text-gray-900">{{ result.box.max_weight }} kg</div>
                    </div>
                    <div v-if="result.box.max_length" class="bg-white/70 rounded-lg p-2">
                      <div class="text-gray-500">{{ t.maxSize }}</div>
                      <div class="font-semibold text-gray-900">
                        {{ result.box.max_length }}×{{ result.box.max_width }}×{{ result.box.max_height }} cm
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- CTA Buttons -->
              <div class="space-y-3">
                <!-- Create Order Button -->
                <NuxtLink 
                  to="/app/orders/create"
                  class="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-all"
                >
                  {{ t.createOrder }}
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                  </svg>
                </NuxtLink>
                
                <!-- WhatsApp Contact Button -->
                <a 
                  href="https://wa.me/16195591910" 
                  target="_blank"
                  class="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-all"
                >
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  {{ t.questionsContact }}
                </a>
                
                <p class="text-center text-xs text-gray-500">
                  {{ t.whatsAppAvailability }}
                </p>
              </div>
            </div>

            <!-- Custom Quote CTA (replaces error alert) -->
            <div v-else-if="result.needsCustomQuote" class="space-y-4">
              <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5">
                <div class="text-center space-y-3">
                  <svg class="w-12 h-12 text-green-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                  </svg>
                  
                  <div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-1">
                      {{ t.customQuoteTitle }}
                    </h3>
                    <p class="text-sm text-gray-600">
                      {{ t.customQuoteMessage }}
                    </p>
                  </div>
                </div>
              </div>
              
              <!-- WhatsApp CTA Button -->
              <a 
                href="https://wa.me/16195591910" 
                target="_blank"
                class="w-full inline-flex items-center justify-center gap-3 py-3 px-4 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-all shadow-md hover:shadow-lg"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                <span>{{ t.contactWhatsApp }}</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                </svg>
              </a>
              
              <p class="text-center text-xs text-gray-500">
                {{ t.whatsAppAvailability }}
              </p>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// Nuxt imports
const { $customFetch } = useNuxtApp()

// Use the language composable
const { t: createTranslations, language } = useLanguage()

// State
const weightInKg = ref(null) // Store weight internally in kg
const weightUnit = ref('kg')
const dimensionsInCm = ref({ length: null, width: null, height: null }) // Store dimensions internally in cm
const dimensionUnit = ref('cm')
const showDimensions = ref(false)
const products = ref([])
const loadingProducts = ref(true)
const calculating = ref(false)
const result = ref(null)

// Computed property for display weight
const weight = computed({
  get() {
    if (weightInKg.value === null) return null
    // Convert from internal kg to display unit, round to 2 decimal places
    const converted = weightUnit.value === 'kg' ? weightInKg.value : weightInKg.value * 2.20462
    return Math.round(converted * 100) / 100
  },
  set(value) {
    if (value === null || value === '') {
      weightInKg.value = null
      return
    }
    // Convert from display unit to internal kg
    weightInKg.value = weightUnit.value === 'kg' ? value : value / 2.20462
  }
})

// Computed property for display dimensions
const lengthDisplay = computed({
  get() {
    if (dimensionsInCm.value.length === null) return null
    const converted = dimensionUnit.value === 'cm' ? dimensionsInCm.value.length : dimensionsInCm.value.length / 2.54
    return Math.round(converted * 100) / 100
  },
  set(value) {
    if (value === null || value === '') {
      dimensionsInCm.value.length = null
      return
    }
    dimensionsInCm.value.length = dimensionUnit.value === 'cm' ? value : value * 2.54
  }
})

const widthDisplay = computed({
  get() {
    if (dimensionsInCm.value.width === null) return null
    const converted = dimensionUnit.value === 'cm' ? dimensionsInCm.value.width : dimensionsInCm.value.width / 2.54
    return Math.round(converted * 100) / 100
  },
  set(value) {
    if (value === null || value === '') {
      dimensionsInCm.value.width = null
      return
    }
    dimensionsInCm.value.width = dimensionUnit.value === 'cm' ? value : value * 2.54
  }
})

const heightDisplay = computed({
  get() {
    if (dimensionsInCm.value.height === null) return null
    const converted = dimensionUnit.value === 'cm' ? dimensionsInCm.value.height : dimensionsInCm.value.height / 2.54
    return Math.round(converted * 100) / 100
  },
  set(value) {
    if (value === null || value === '') {
      dimensionsInCm.value.height = null
      return
    }
    dimensionsInCm.value.height = dimensionUnit.value === 'cm' ? value : value * 2.54
  }
})

// Translations
const translations = {
  title: {
    es: 'Calculadora de Envío',
    en: 'Shipping Calculator'
  },
  subtitle: {
    es: 'Obtén un estimado instantáneo',
    en: 'Get an instant estimate'
  },
  weightLabel: {
    es: 'Peso del paquete',
    en: 'Package weight'
  },
  kilograms: {
    es: 'Kilogramos (kg)',
    en: 'Kilograms (kg)'
  },
  pounds: {
    es: 'Libras (lb)',
    en: 'Pounds (lb)'
  },
  addDimensions: {
    es: 'Añadir dimensiones para mayor precisión',
    en: 'Add dimensions for better accuracy'
  },
  length: {
    es: 'Largo',
    en: 'Length'
  },
  width: {
    es: 'Ancho',
    en: 'Width'
  },
  height: {
    es: 'Alto',
    en: 'Height'
  },
  calculateButton: {
    es: 'Calcular Precio',
    en: 'Calculate Price'
  },
  calculating: {
    es: 'Calculando...',
    en: 'Calculating...'
  },
  recommendedBox: {
    es: 'Caja Recomendada',
    en: 'Recommended Box'
  },
  withDimensions: {
    es: 'Con dimensiones',
    en: 'With dimensions'
  },
  maxWeight: {
    es: 'Peso máx.',
    en: 'Max weight'
  },
  maxSize: {
    es: 'Tamaño máx.',
    en: 'Max size'
  },
  createOrder: {
    es: 'Crear Orden',
    en: 'Create Order'
  },
  customQuoteTitle: {
    es: 'Necesitas una Cotización Personalizada',
    en: 'Need a Custom Quote'
  },
  customQuoteMessage: {
    es: 'Tu paquete requiere un servicio especial. ¡Contáctanos por WhatsApp para una cotización personalizada!',
    en: 'Your package requires special handling. Contact us on WhatsApp for a personalized quote!'
  },
  contactWhatsApp: {
    es: 'Contactar por WhatsApp',
    en: 'Contact on WhatsApp'
  },
  questionsContact: {
    es: '¿Preguntas? Cotización Personalizada',
    en: 'Questions? Custom Quote'
  },
  whatsAppAvailability: {
    es: 'Disponible: Lun-Vie 9AM-6PM PST',
    en: 'Available: Mon-Fri 9AM-6PM PST'
  }
}

// Get reactive translations
const t = createTranslations(translations)

// Computed
const canCalculate = computed(() => {
  return weightInKg.value && weightInKg.value > 0
})

const consolidatedProducts = computed(() => {
  return products.value
    .filter(product => product.consolidated === 'true')
    .sort((a, b) => a.price - b.price)
})

// Methods
const getBoxName = (box) => {
  const name = box.name.toLowerCase()
  
  if (name.includes('extra small') || name.includes('xs')) {
    return language.value === 'es' ? 'Caja Extra Pequeña' : 'Extra Small Box'
  } else if (name.includes('small') && !name.includes('extra')) {
    return language.value === 'es' ? 'Caja Pequeña' : 'Small Box'
  } else if (name.includes('medium')) {
    return language.value === 'es' ? 'Caja Mediana' : 'Medium Box'
  } else if (name.includes('large') && !name.includes('extra')) {
    return language.value === 'es' ? 'Caja Grande' : 'Large Box'
  } else if (name.includes('extra large') || name.includes('xl')) {
    return language.value === 'es' ? 'Caja Extra Grande' : 'Extra Large Box'
  }
  
  // Fallback based on weight
  const maxWeight = parseFloat(box.max_weight)
  if (maxWeight <= 5) {
    return language.value === 'es' ? 'Caja Extra Pequeña' : 'Extra Small Box'
  } else if (maxWeight <= 10) {
    return language.value === 'es' ? 'Caja Pequeña' : 'Small Box'
  } else if (maxWeight <= 25) {
    return language.value === 'es' ? 'Caja Mediana' : 'Medium Box'
  } else if (maxWeight <= 40) {
    return language.value === 'es' ? 'Caja Grande' : 'Large Box'
  } else {
    return language.value === 'es' ? 'Caja Extra Grande' : 'Extra Large Box'
  }
}

const fetchProducts = async () => {
  try {
    loadingProducts.value = true
    const response = await $customFetch('/products')
    
    // Filter only consolidated products — never the retired Extra Small box (still in Stripe for boxes in flight;
    // Alex 2026-10-02: customers must never be offered it).
    const consolidated = response.data.filter(product => product.consolidated === 'true' && !/extra small/i.test(product.name || ''))
    
    // Remove duplicates by product ID
    const uniqueProducts = []
    const seenIds = new Set()
    
    for (const product of consolidated) {
      if (!seenIds.has(product.id)) {
        seenIds.add(product.id)
        uniqueProducts.push(product)
      }
    }
    
    products.value = uniqueProducts
  } catch (error) {
    console.error('Error fetching products:', error)
  } finally {
    loadingProducts.value = false
  }
}

const calculate = () => {
  if (!canCalculate.value) return
  
  calculating.value = true
  result.value = null
  
  // Simulate calculation delay for better UX
  setTimeout(() => {
    // Use weightInKg directly (already in kg)
    const weightForCalculation = weightInKg.value
    
    let suitableBoxes = []
    let usedDimensions = false
    
    // Check if dimensions are provided and valid
    const hasDimensions = showDimensions.value && 
                          dimensionsInCm.value.length > 0 && 
                          dimensionsInCm.value.width > 0 && 
                          dimensionsInCm.value.height > 0
    
    if (hasDimensions) {
      // Use dimensionsInCm directly (already in cm)
      const lengthCm = dimensionsInCm.value.length
      const widthCm = dimensionsInCm.value.width
      const heightCm = dimensionsInCm.value.height
      
      suitableBoxes = consolidatedProducts.value.filter(box => {
        const fitsWeight = !box.max_weight || weightForCalculation <= parseFloat(box.max_weight)
        const fitsLength = !box.max_length || lengthCm <= parseFloat(box.max_length)
        const fitsWidth = !box.max_width || widthCm <= parseFloat(box.max_width)
        const fitsHeight = !box.max_height || heightCm <= parseFloat(box.max_height)
        
        return fitsWeight && fitsLength && fitsWidth && fitsHeight
      })
      
      usedDimensions = true
    } else {
      // Filter by weight only
      suitableBoxes = consolidatedProducts.value.filter(box => {
        return !box.max_weight || weightForCalculation <= parseFloat(box.max_weight)
      })
    }
    
    if (suitableBoxes.length > 0) {
      result.value = {
        box: suitableBoxes[0], // Cheapest suitable box
        usedDimensions: usedDimensions
      }
    } else {
      // Instead of error, show custom quote CTA
      result.value = {
        needsCustomQuote: true
      }
    }
    
    calculating.value = false
  }, 300)
}

// Lifecycle
onMounted(() => {
  fetchProducts()
})
</script>

<style scoped>
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slideDown {
  animation: slideDown 0.3s ease-out;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Remove number input arrows */
input[type=number]::-webkit-outer-spin-button,
input[type=number]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type=number] {
  -moz-appearance: textfield;
}

/* Mobile-first responsive adjustments */
@media (max-width: 640px) {
  #calculator {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}
</style>