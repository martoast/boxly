<template>
  <section class="min-h-screen bg-gray-50 pt-20">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <!-- Header -->
      <div class="mb-6 flex items-center justify-between gap-4">
        <h1 class="text-3xl font-extrabold text-gray-900">{{ t.title }}</h1>
        <NuxtLink to="/shop" class="text-primary-600 font-medium hover:text-primary-700 text-sm">
          ← {{ t.continueShopping }}
        </NuxtLink>
      </div>

      <!-- Empty state -->
      <div v-if="items.length === 0" class="text-center py-16 bg-white rounded-2xl border border-gray-100">
        <div class="h-20 w-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center text-gray-300">
          <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
          </svg>
        </div>
        <p class="text-xl font-semibold text-gray-700">{{ t.empty }}</p>
        <p class="text-gray-400 mt-1">{{ t.emptyDesc }}</p>
        <NuxtLink to="/shop" class="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-colors">
          {{ t.browseProducts }}
        </NuxtLink>
      </div>

      <!-- With items -->
      <div v-else class="grid lg:grid-cols-3 gap-6">

        <!-- Items list -->
        <div class="lg:col-span-2 space-y-3">
          <div
            v-for="item in items"
            :key="lineKey(item.product_id, item.variant_id)"
            class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-4"
          >
            <NuxtLink :to="`/shop/${item.slug}`" class="shrink-0">
              <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-gray-100 overflow-hidden">
                <img v-if="item.image_url" :src="item.image_url" :alt="item.name" class="w-full h-full object-cover" />
              </div>
            </NuxtLink>

            <div class="flex-1 min-w-0">
              <NuxtLink :to="`/shop/${item.slug}`" class="block">
                <h3 class="font-semibold text-gray-900 line-clamp-2 hover:text-primary-600 transition-colors">{{ item.name }}</h3>
              </NuxtLink>

              <!-- Variant chips -->
              <div v-if="item.size || item.color" class="flex flex-wrap gap-1.5 mt-1.5">
                <span v-if="item.size" class="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-md">
                  {{ t.size }}: <strong class="ml-1">{{ item.size }}</strong>
                </span>
                <span v-if="item.color" class="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-md">
                  {{ t.color }}: <strong class="ml-1">{{ item.color }}</strong>
                </span>
              </div>

              <p class="text-xs text-gray-400 mt-1">{{ Number(item.weight_kg).toFixed(2) }} kg c/u</p>

              <div class="flex items-center justify-between gap-3 mt-3">
                <div class="flex items-center border border-gray-200 rounded-lg">
                  <button
                    @click="setQuantity(item.product_id, item.variant_id, item.quantity - 1)"
                    class="px-3 py-1.5 text-gray-500 hover:bg-gray-50 transition-colors"
                  >−</button>
                  <span class="w-10 text-center text-sm font-semibold">{{ item.quantity }}</span>
                  <button
                    @click="setQuantity(item.product_id, item.variant_id, item.quantity + 1)"
                    class="px-3 py-1.5 text-gray-500 hover:bg-gray-50 transition-colors"
                  >+</button>
                </div>
                <button
                  @click="remove(item.product_id, item.variant_id)"
                  class="text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  {{ t.remove }}
                </button>
              </div>
            </div>

            <div class="text-right shrink-0">
              <p class="font-bold text-gray-900 whitespace-nowrap">
                ${{ formatPrice(item.price_cents * item.quantity) }}
              </p>
              <p class="text-xs text-gray-400 mt-0.5">${{ formatPrice(item.price_cents) }} c/u</p>
            </div>
          </div>
        </div>

        <!-- Summary sidebar -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 lg:sticky lg:top-24">
            <h2 class="font-bold text-gray-900 mb-4">{{ t.summary }}</h2>

            <!-- Open shipment context -->
            <div v-if="openOrder" class="mb-4 p-3 bg-primary-50 border border-primary-100 rounded-xl">
              <p class="text-xs font-semibold text-primary-700 uppercase tracking-wider mb-1">{{ t.openShipment }}</p>
              <p class="text-xs text-primary-900">{{ t.willAddToShipment.replace('{n}', openOrder.item_count).replace('{w}', Number(openOrder.total_weight_kg).toFixed(1)) }}</p>
            </div>

            <div class="space-y-2.5 text-sm pb-4 mb-4 border-b border-gray-100">
              <div class="flex justify-between text-gray-600">
                <span>{{ t.subtotal }} ({{ totalItems }} {{ totalItems === 1 ? t.item : t.items }})</span>
                <span class="font-medium text-gray-900">${{ formatPrice(cartSubtotalCents) }}</span>
              </div>
              <div class="flex justify-between text-gray-600">
                <span>{{ t.weight }}</span>
                <span class="font-medium text-gray-900">{{ cartWeightKg.toFixed(2) }} kg</span>
              </div>
            </div>

            <!-- Box estimate -->
            <div v-if="estimatedBox && estimatedBox !== 'over_50'" class="mb-4 p-3 bg-gray-50 rounded-xl">
              <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{{ t.boxEstimate }}</p>
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm text-gray-700">{{ t.estBox }} <strong>{{ estimatedBox }}</strong></span>
                <span class="text-sm text-gray-500">~${{ formatPrice(estimatedShippingCents) }}</span>
              </div>
              <div class="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div class="h-full bg-primary-500 rounded-full transition-all duration-500" :style="{ width: fillPercent + '%' }"></div>
              </div>
              <p v-if="nextBoxThresholdKg && nextBoxThresholdKg > 0" class="text-xs text-gray-500 mt-2">
                + {{ nextBoxThresholdKg.toFixed(1) }} kg {{ t.toNextBox }}
              </p>
            </div>

            <div v-else-if="estimatedBox === 'over_50'" class="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p class="text-xs text-amber-800">{{ t.over50 }}</p>
            </div>

            <!-- Disclaimer -->
            <p class="text-xs text-gray-400 leading-relaxed mb-4">
              <strong class="text-gray-700">{{ t.disclaimerTitle }}</strong> {{ t.disclaimerBody }}
            </p>

            <!-- Total -->
            <div class="flex items-baseline justify-between mb-5">
              <span class="font-semibold text-gray-700">{{ t.payNow }}</span>
              <span class="text-2xl font-extrabold text-gray-900">${{ formatPrice(cartSubtotalCents) }} <span class="text-xs font-medium text-gray-500">MXN</span></span>
            </div>

            <NuxtLink
              to="/checkout"
              class="block w-full py-3.5 bg-primary-500 hover:bg-primary-600 text-white text-center font-bold rounded-xl shadow-lg shadow-primary-500/20 transition-colors"
            >
              {{ t.checkout }} →
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
definePageMeta({
  layout: 'default',
})

const { t: createTranslations } = useLanguage()

const t = createTranslations({
  title:               { es: 'Tu Carrito', en: 'Your Cart' },
  continueShopping:    { es: 'Seguir comprando', en: 'Continue shopping' },
  empty:               { es: 'Tu carrito está vacío', en: 'Your cart is empty' },
  emptyDesc:           { es: 'Agrega productos para empezar a llenar tu envío.', en: 'Add products to start filling your shipment.' },
  browseProducts:      { es: 'Ver productos', en: 'Browse products' },
  remove:              { es: 'Quitar', en: 'Remove' },
  size:                { es: 'Talla', en: 'Size' },
  color:                { es: 'Color', en: 'Color' },
  summary:             { es: 'Resumen', en: 'Summary' },
  openShipment:        { es: 'Tu envío actual', en: 'Your current shipment' },
  willAddToShipment:   { es: 'Estos productos se sumarán a tu envío actual ({n} productos · {w} kg)', en: 'These will be added to your current shipment ({n} items · {w} kg)' },
  subtotal:            { es: 'Subtotal', en: 'Subtotal' },
  item:                { es: 'producto', en: 'item' },
  items:               { es: 'productos', en: 'items' },
  weight:              { es: 'Peso total', en: 'Total weight' },
  boxEstimate:         { es: 'Estimación de caja', en: 'Box estimate' },
  estBox:              { es: 'Cabría en caja', en: 'Would fit in box' },
  toNextBox:           { es: 'para llenar la siguiente caja', en: 'to fill the next box' },
  over50:              { es: 'Tu envío pasa los 50 kg. Cuando pidas envío, lo dividiremos en dos cajas.', en: 'Your shipment exceeds 50 kg. When you request shipment, we\'ll split it into two boxes.' },
  disclaimerTitle:     { es: 'Pagas productos ahora.', en: 'You pay for products now.' },
  disclaimerBody:      { es: 'El envío se cotiza después, cuando Boxly consolida tu caja en San Diego.', en: 'Shipping is quoted later, when Boxly consolidates your box in San Diego.' },
  payNow:              { es: 'A pagar ahora:', en: 'Paying now:' },
  checkout:            { es: 'Ir a pagar', en: 'Checkout' },
})

const {
  items,
  totalItems,
  cartWeightKg,
  cartSubtotalCents,
  estimatedBox,
  estimatedShippingCents,
  fillPercent,
  nextBoxThresholdKg,
  openOrder,
  setQuantity,
  remove,
  refreshOpenOrder,
  lineKey,
} = useStoreCart()

const formatPrice = (cents) => (cents / 100).toLocaleString('es-MX', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

onMounted(() => refreshOpenOrder())
</script>
