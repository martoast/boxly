<template>
  <section class="min-h-screen bg-gray-50 pt-20">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <h1 class="text-3xl font-extrabold text-gray-900 mb-6">{{ t.title }}</h1>

      <!-- Empty cart -->
      <div v-if="items.length === 0" class="text-center py-16 bg-white rounded-2xl border border-gray-100">
        <p class="text-gray-700 font-semibold">{{ t.emptyCart }}</p>
        <NuxtLink to="/shop" class="mt-4 inline-block text-primary-600 font-medium hover:text-primary-700">
          ← {{ t.backToShop }}
        </NuxtLink>
      </div>

      <div v-else class="space-y-6">
        <!-- Order summary -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 class="font-semibold text-gray-900 mb-4">{{ t.orderSummary }}</h2>

          <div class="space-y-3 mb-4">
            <div v-for="item in items" :key="`${item.product_id}-${item.variant_id ?? 'base'}`" class="flex items-center gap-3 py-2">
              <div class="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                <img v-if="item.image_url" :src="item.image_url" :alt="item.name" class="w-full h-full object-cover" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 line-clamp-1">{{ item.name }}</p>
                <p class="text-xs text-gray-400">{{ t.qty }}: {{ item.quantity }}</p>
              </div>
              <p class="text-sm font-semibold text-gray-900 whitespace-nowrap">${{ formatPrice(item.price_cents * item.quantity) }}</p>
            </div>
          </div>

          <div class="pt-4 border-t border-gray-100">
            <div class="flex justify-between items-baseline">
              <p class="font-semibold text-gray-700">{{ t.total }}</p>
              <p class="text-2xl font-extrabold text-gray-900">${{ formatPrice(cartSubtotalCents) }} <span class="text-xs font-medium text-gray-500">MXN</span></p>
            </div>
            <p class="text-xs text-gray-400 mt-2">{{ t.shippingNote }}</p>
          </div>
        </div>

        <!-- Checkout CTA -->
        <button
          @click="startCheckout"
          :disabled="loading || items.length === 0"
          class="w-full py-4 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-primary-500/25 transition-colors flex items-center justify-center gap-2"
        >
          <svg v-if="loading" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          {{ loading ? t.redirecting : t.payProducts }}
        </button>

        <p v-if="error" class="text-red-600 text-sm text-center bg-red-50 rounded-xl py-3 px-4 border border-red-100">
          {{ error }}
        </p>

        <p class="text-xs text-gray-400 text-center">{{ t.poweredBy }}</p>
      </div>
    </div>
  </section>
</template>

<script setup>
// Auth-gated page — buying requires an account
definePageMeta({
  layout: 'default',
  middleware: ['auth'],
})

const { $customFetch } = useNuxtApp()
const { t: createTranslations } = useLanguage()
const toast = useToast()

const t = createTranslations({
  title:             { es: 'Finalizar compra', en: 'Checkout' },
  emptyCart:         { es: 'Tu carrito está vacío', en: 'Your cart is empty' },
  backToShop:        { es: 'Volver a la Tienda', en: 'Back to Shop' },
  orderSummary:      { es: 'Resumen del pedido', en: 'Order summary' },
  qty:               { es: 'Cant', en: 'Qty' },
  total:             { es: 'Total a pagar ahora', en: 'Total to pay now' },
  shippingNote:      { es: 'El envío se cotiza después, cuando Boxly consolida tu caja.', en: 'Shipping is quoted later, when Boxly consolidates your box.' },
  payProducts:       { es: 'Pagar productos', en: 'Pay for products' },
  redirecting:       { es: 'Redirigiendo...', en: 'Redirecting...' },
  poweredBy:         { es: 'Pago seguro con Stripe', en: 'Secure payment by Stripe' },
})

const { items, cartSubtotalCents, clear } = useStoreCart()

const loading = ref(false)
const error = ref(null)

const formatPrice = (cents) => (cents / 100).toLocaleString('es-MX', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const startCheckout = async () => {
  error.value = null
  loading.value = true

  try {
    const res = await $customFetch('/store/checkout', {
      method: 'POST',
      body: {
        items: items.value.map((it) => ({
          product_id: it.product_id,
          variant_id: it.variant_id ?? null,
          quantity: it.quantity,
        })),
      },
    })

    if (res?.checkout_url) {
      clear()
      window.location.href = res.checkout_url
    } else {
      throw new Error('No checkout URL returned')
    }
  } catch (err) {
    console.error('Checkout failed', err)
    error.value = err?.data?.message ?? err?.message ?? 'No se pudo procesar el pago.'
    toast.error(error.value)
  } finally {
    loading.value = false
  }
}
</script>
