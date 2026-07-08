<!-- components/checkout/DeliveryAddressStep.vue -->
<template>
  <div class="animate-fadeIn">
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
      <!-- Success Message for Autocomplete -->
      <Transition
        enter-active-class="transform ease-out duration-300 transition"
        enter-from-class="translate-y-2 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showAutocompleteSuccess" class="mb-4 bg-primary-50 border border-primary-200 rounded-lg p-3">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-4 w-4 text-primary-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-primary-800">{{ t.addressFoundMessage }}</p>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Address Form -->
      <div class="space-y-4">
        <!-- Street -->
        <div>
          <label for="street" class="block text-sm font-semibold text-gray-900 mb-2">
            {{ t.streetLabel }}
          </label>
          <input
            :value="deliveryAddress.street"
            @input="updateAddress('street', $event.target.value)"
            type="text"
            id="street"
            :placeholder="t.streetPlaceholder"
            class="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
            required
          />
        </div>

        <!-- Numbers -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="exterior_number" class="block text-sm font-semibold text-gray-900 mb-2">
              {{ t.exteriorNumberLabel }}
            </label>
            <input
              :value="deliveryAddress.exterior_number"
              @input="updateAddress('exterior_number', $event.target.value)"
              type="text"
              id="exterior_number"
              :placeholder="t.exteriorNumberPlaceholder"
              class="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
          <div>
            <label for="interior_number" class="block text-sm font-semibold text-gray-900 mb-2">
              {{ t.interiorNumberLabel }}
            </label>
            <input
              :value="deliveryAddress.interior_number"
              @input="updateAddress('interior_number', $event.target.value)"
              type="text"
              id="interior_number"
              :placeholder="t.interiorNumberPlaceholder"
              class="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        <!-- Colonia and Municipio -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label for="colonia" class="block text-sm font-semibold text-gray-900 mb-2">
              {{ t.coloniaLabel }}
            </label>
            <input
              :value="deliveryAddress.colonia"
              @input="updateAddress('colonia', $event.target.value)"
              type="text"
              id="colonia"
              :placeholder="t.coloniaPlaceholder"
              class="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
          <div>
            <label for="municipio" class="block text-sm font-semibold text-gray-900 mb-2">
              {{ t.municipioLabel }}
            </label>
            <input
              :value="deliveryAddress.municipio"
              @input="updateAddress('municipio', $event.target.value)"
              type="text"
              id="municipio"
              :placeholder="t.municipioPlaceholder"
              class="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
        </div>

        <!-- Estado and Postal Code -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label for="estado" class="block text-sm font-semibold text-gray-900 mb-2">
              {{ t.estadoLabel }}
            </label>
            <select
              :value="deliveryAddress.estado"
              @change="updateAddress('estado', $event.target.value)"
              id="estado"
              class="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              required
            >
              <option value="">{{ t.selectEstado }}</option>
              <option v-for="estado in mexicanStates" :key="estado" :value="estado">
                {{ estado }}
              </option>
            </select>
          </div>
          <div>
            <label for="postal_code" class="block text-sm font-semibold text-gray-900 mb-2">
              {{ t.postalCodeLabel }}
            </label>
            <input
              :value="deliveryAddress.postal_code"
              @input="updateAddress('postal_code', $event.target.value)"
              type="text"
              id="postal_code"
              :placeholder="t.postalCodePlaceholder"
              maxlength="5"
              pattern="[0-9]{5}"
              class="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
        </div>

        <!-- Referencias -->
        <div>
          <label for="referencias" class="block text-sm font-semibold text-gray-900 mb-2">
            {{ t.referenciasLabel }}
          </label>
          <textarea
            :value="deliveryAddress.referencias"
            @input="updateAddress('referencias', $event.target.value)"
            id="referencias"
            rows="3"
            :placeholder="t.referenciasPlaceholder"
            class="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 resize-none"
          ></textarea>
        </div>

        <!-- Rural Checkbox -->
        <div class="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
          <label class="flex items-start gap-3 cursor-pointer">
            <input
              :checked="isRural"
              @change="$emit('update:isRural', $event.target.checked)"
              type="checkbox"
              class="mt-1 h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
            />
            <div class="flex-1">
              <span class="text-sm font-semibold text-gray-900">{{ t.ruralAreaLabel }}</span>
              <p class="text-sm text-gray-600 mt-1">
                {{ t.ruralAreaDescription }}
              </p>
              <p v-if="ruralSurcharge" class="text-sm font-medium text-yellow-700 mt-1">
                +${{ ruralSurcharge.price.toFixed(2) }} {{ ruralSurcharge.currency }}
              </p>
            </div>
          </label>
        </div>

        <!-- Save Address Checkbox -->
        <div class="bg-green-50 rounded-xl p-4 border border-green-200">
          <label class="flex items-start gap-3 cursor-pointer">
            <input
              :checked="saveAddress"
              @change="$emit('update:saveAddress', $event.target.checked)"
              type="checkbox"
              class="mt-1 h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
            />
            <div class="flex-1">
              <span class="text-sm font-semibold text-gray-900">{{ t.saveAddressLabel }}</span>
              <p class="text-sm text-gray-600 mt-1">
                {{ t.saveAddressDescription }}
              </p>
            </div>
          </label>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  deliveryAddress: Object,
  isRural: Boolean,
  saveAddress: Boolean,
  ruralSurcharge: Object,
  mexicanStates: Array,
  t: Object,
});

const emit = defineEmits([
  'update:deliveryAddress',
  'update:isRural',
  'update:saveAddress',
  'previous',
  'next'
]);

// Local state for autocomplete success message
const showAutocompleteSuccess = ref(false)

const isFormValid = computed(() => {
  const addr = props.deliveryAddress;
  return (
    addr.street &&
    addr.exterior_number &&
    addr.colonia &&
    addr.municipio &&
    addr.estado &&
    addr.postal_code &&
    /^\d{5}$/.test(addr.postal_code)
  );
});

const updateAddress = (field, value) => {
  emit('update:deliveryAddress', {
    ...props.deliveryAddress,
    [field]: value
  });
};

// Handle autocomplete selection
const handleAutocompleteSelect = (addressData) => {
  console.log('Autocomplete data received:', addressData)
  
  // Parse the address from Mapbox
  const { address, latitude, longitude } = addressData
  
  // Create a new address object with existing values
  const updatedAddress = { ...props.deliveryAddress }
  
  // Parse address format: "Avenida Jalisco 3415, 22046 Tijuana, Baja California, México"
  const parts = address.split(',').map(part => part.trim())
  
  if (parts.length >= 2) {
    // First part: "Avenida Jalisco 3415"
    const streetAndNumber = parts[0]
    // Try to extract street and number - number is usually at the end
    const streetMatch = streetAndNumber.match(/^(.+?)\s+(\d+)$/)
    
    if (streetMatch) {
      updatedAddress.street = streetMatch[1].trim() // "Avenida Jalisco"
      updatedAddress.exterior_number = streetMatch[2] // "3415"
    } else {
      // If no number found, put entire thing in street
      updatedAddress.street = streetAndNumber
    }
    
    // Second part: "22046 Tijuana" - contains postal code and city
    if (parts[1]) {
      const cityPart = parts[1]
      // Extract postal code (5 digits at the beginning)
      const postalMatch = cityPart.match(/^(\d{5})\s+(.+)/)
      
      if (postalMatch) {
        updatedAddress.postal_code = postalMatch[1] // "22046"
        updatedAddress.municipio = postalMatch[2] // "Tijuana"
      } else {
        // If no postal code pattern, assume it's just the city
        updatedAddress.municipio = cityPart
      }
    }
    
    // Third part: "Baja California" - state
    if (parts[2]) {
      const stateName = parts[2].trim()
      // Find matching state in our list
      const matchedState = props.mexicanStates.find(state => 
        state.toLowerCase() === stateName.toLowerCase() ||
        stateName.toLowerCase().includes(state.toLowerCase()) ||
        state.toLowerCase().includes(stateName.toLowerCase())
      )
      if (matchedState) {
        updatedAddress.estado = matchedState
      } else {
        // If exact match not found, try to set as is
        updatedAddress.estado = stateName
      }
    }
  }
  
  // Emit the updated address
  emit('update:deliveryAddress', updatedAddress)
  
  // Show autocomplete success message
  showAutocompleteSuccess.value = true
  setTimeout(() => {
    showAutocompleteSuccess.value = false
  }, 3000)
}
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
  animation: fadeIn 0.6s ease-out;
}
</style>