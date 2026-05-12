<template>
  <section class="min-h-screen bg-gray-50 pt-20 pb-16">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <!-- Header -->
      <div class="mb-8 flex flex-wrap items-baseline justify-between gap-3">
        <h1 class="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
          {{ t.title }}
          <span v-if="items.length > 0" class="ml-2 text-base font-medium text-gray-400 align-middle">
            ({{ totalItems }} {{ totalItems === 1 ? t.item : t.items }})
          </span>
        </h1>
        <NuxtLink to="/shop" class="text-primary-600 font-medium hover:text-primary-700 text-sm inline-flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          {{ t.continueShopping }}
        </NuxtLink>
      </div>

      <!-- Empty state -->
      <div v-if="items.length === 0" class="text-center py-20 bg-white rounded-2xl border border-gray-100">
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

      <!-- Two-column cart: items on the left, summary on the right (sticky on desktop).
           Stacks below md so phones see a clean linear flow. -->
      <div v-else class="flex flex-col lg:flex-row lg:items-start gap-6">

        <!-- Items list -->
        <div class="flex-1 min-w-0 bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100 overflow-hidden">
          <div
            v-for="item in items"
            :key="lineKey(item.product_id, item.variant_id)"
            class="p-4 sm:p-5 flex gap-4 sm:gap-5"
          >
            <NuxtLink :to="`/shop/${item.slug}`" class="shrink-0">
              <div class="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-gray-100 overflow-hidden">
                <img v-if="item.image_url" :src="item.image_url" :alt="item.name" class="w-full h-full object-cover" />
              </div>
            </NuxtLink>

            <div class="flex-1 min-w-0 flex flex-col">
              <div class="flex items-start justify-between gap-3">
                <NuxtLink :to="`/shop/${item.slug}`" class="block min-w-0">
                  <h3 class="font-semibold text-gray-900 line-clamp-2 hover:text-primary-600 transition-colors leading-snug">{{ item.name }}</h3>
                </NuxtLink>
                <button
                  type="button"
                  @click="remove(item.product_id, item.variant_id)"
                  class="shrink-0 -m-1 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  :title="t.remove"
                  :aria-label="t.remove"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>

              <!-- Variant chips — always inline -->
              <div v-if="item.size || item.color || item.length" class="flex flex-wrap gap-1.5 mt-1.5">
                <span v-if="item.size" class="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-md">
                  {{ t.size }}:&nbsp;<strong>{{ item.size }}</strong>
                </span>
                <span v-if="item.color" class="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-md">
                  {{ t.color }}:&nbsp;<strong>{{ item.color }}</strong>
                </span>
                <span v-if="item.length" class="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-md">
                  {{ t.length }}:&nbsp;<strong>{{ item.length }}</strong>
                </span>
              </div>

              <p v-if="item.weight_kg" class="text-xs text-gray-400 mt-1.5">{{ Number(item.weight_kg).toFixed(2) }} kg c/u</p>

              <!-- Bottom row: qty controls on the left, price on the right -->
              <div class="mt-auto pt-3 flex items-end justify-between gap-3">
                <div class="inline-flex items-center border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    @click="setQuantity(item.product_id, item.variant_id, item.quantity - 1)"
                    class="px-3 py-1.5 text-gray-500 hover:bg-gray-50 transition-colors text-base leading-none"
                    :aria-label="t.decrease"
                  >−</button>
                  <span class="w-9 text-center text-sm font-semibold border-x border-gray-200 py-1.5">{{ item.quantity }}</span>
                  <button
                    type="button"
                    @click="setQuantity(item.product_id, item.variant_id, item.quantity + 1)"
                    class="px-3 py-1.5 text-gray-500 hover:bg-gray-50 transition-colors text-base leading-none"
                    :aria-label="t.increase"
                  >+</button>
                </div>
                <div class="text-right">
                  <p class="font-bold text-gray-900 whitespace-nowrap text-base sm:text-lg">${{ formatPrice(item.price_cents * item.quantity) }}</p>
                  <p v-if="item.quantity > 1" class="text-xs text-gray-400 mt-0.5">${{ formatPrice(item.price_cents) }} {{ t.each }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Summary sidebar -->
        <aside class="w-full lg:w-96 shrink-0">
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:sticky lg:top-24">
            <h2 class="font-bold text-gray-900 text-lg mb-5">{{ t.summary }}</h2>

            <dl class="space-y-3 text-sm pb-5 mb-5 border-b border-gray-100">
              <div class="flex justify-between text-gray-600">
                <dt>{{ t.subtotal }} ({{ totalItems }} {{ totalItems === 1 ? t.item : t.items }})</dt>
                <dd class="font-medium text-gray-900">${{ formatPrice(cartSubtotalCents) }}</dd>
              </div>
              <div class="flex justify-between text-gray-500">
                <dt>{{ t.shippingLine }}</dt>
                <dd class="text-gray-400">{{ t.shippingTbd }}</dd>
              </div>
            </dl>

            <div class="flex items-baseline justify-between mb-5">
              <span class="font-semibold text-gray-900">{{ t.payNow }}</span>
              <span class="text-2xl font-extrabold text-gray-900">${{ formatPrice(cartSubtotalCents) }} <span class="text-xs font-medium text-gray-500">USD</span></span>
            </div>

            <NuxtLink
              to="/checkout"
              class="block w-full py-3.5 bg-primary-500 hover:bg-primary-600 text-white text-center font-bold rounded-xl shadow-lg shadow-primary-500/20 transition-colors"
            >
              {{ t.checkout }} →
            </NuxtLink>

            <p class="mt-4 text-xs text-gray-500 leading-relaxed">{{ t.shippingNote }}</p>
          </div>
        </aside>
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
  increase:            { es: 'Aumentar cantidad', en: 'Increase quantity' },
  decrease:            { es: 'Disminuir cantidad', en: 'Decrease quantity' },
  size:                { es: 'Talla', en: 'Size' },
  color:               { es: 'Color', en: 'Color' },
  length:              { es: 'Largo', en: 'Length' },
  each:                { es: 'c/u', en: 'each' },
  summary:             { es: 'Resumen del pedido', en: 'Order summary' },
  subtotal:            { es: 'Subtotal', en: 'Subtotal' },
  shippingLine:        { es: 'Envío', en: 'Shipping' },
  shippingTbd:         { es: 'Por calcular', en: 'Calculated later' },
  item:                { es: 'producto', en: 'item' },
  items:               { es: 'productos', en: 'items' },
  payNow:              { es: 'Total estimado', en: 'Estimated total' },
  checkout:            { es: 'Continuar a checkout', en: 'Continue to checkout' },
  shippingNote:        {
    es: 'Boxly verificará disponibilidad en cada tienda. Si todo está disponible, te enviaremos un link de pago. El envío se cotiza después, cuando consolidamos tu caja.',
    en: 'Boxly will verify availability at each store. If everything is in stock, we\'ll send you a payment link. Shipping is quoted later, when we consolidate your box.',
  },
})

const {
  items,
  totalItems,
  cartSubtotalCents,
  setQuantity,
  remove,
  lineKey,
} = useStoreCart()

const formatPrice = (cents) => (cents / 100).toLocaleString('es-MX', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
</script>
