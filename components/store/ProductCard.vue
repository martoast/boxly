<template>
  <NuxtLink
    :to="`/shop/${product.slug}`"
    class="group block bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 relative"
  >
    <!-- Image -->
    <div class="relative aspect-square bg-gray-100 overflow-hidden">
      <img
        v-if="product.first_image_url"
        :src="product.first_image_url"
        :alt="product.name"
        :class="['w-full h-full object-cover transition-transform duration-300 group-hover:scale-105', isOutOfStock ? 'opacity-50 grayscale' : '']"
        loading="lazy"
      />
      <div v-else class="w-full h-full flex items-center justify-center text-gray-300">
        <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
      </div>

      <!-- Out of stock overlay -->
      <div v-if="isOutOfStock" class="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span class="bg-white/90 backdrop-blur-sm text-gray-900 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full shadow border border-gray-200">
          Agotado
        </span>
      </div>

      <!-- Expiring soon badge (only if not out of stock) -->
      <div v-else-if="expiringSoon" class="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full">
        {{ expiringLabel }}
      </div>
    </div>

    <!-- Body -->
    <div class="p-4">
      <h3 class="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 mb-2 min-h-[2.5em]">
        {{ product.name }}
      </h3>

      <p class="text-lg font-bold text-gray-900">
        ${{ formatPrice(product.price_cents) }} <span class="text-xs font-medium text-gray-500">MXN</span>
      </p>

      <p class="text-xs text-gray-400 mt-1">{{ Number(product.weight_kg).toFixed(2) }} kg</p>
    </div>
  </NuxtLink>
</template>

<script setup>
const props = defineProps({
  product: { type: Object, required: true },
})

const formatPrice = (cents) => (cents / 100).toLocaleString('es-MX', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const isOutOfStock = computed(() =>
  props.product.stock_check_status === 'out_of_stock' || props.product.stock <= 0
)

const expiringSoon = computed(() => {
  if (!props.product.available_until) return false
  const date = new Date(props.product.available_until)
  const days = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  return days >= 0 && days <= 7
})

const expiringLabel = computed(() => {
  if (!props.product.available_until) return ''
  const date = new Date(props.product.available_until)
  const days = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (days <= 0) return 'Último día'
  if (days === 1) return '1 día'
  return `${days} días`
})
</script>
