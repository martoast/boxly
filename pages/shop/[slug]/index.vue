<template>
  <section class="min-h-screen bg-gray-50 pt-20">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <!-- Breadcrumbs -->
      <nav class="mb-4 text-sm text-gray-500 flex items-center gap-2">
        <NuxtLink to="/shop" class="hover:text-primary-600 transition-colors">{{ t.shop }}</NuxtLink>
        <span>/</span>
        <NuxtLink v-if="product?.store" :to="`/shop?store_id=${product.store.id}`" class="text-gray-700 hover:text-primary-600">{{ product.store.name }}</NuxtLink>
        <span v-if="product?.store">/</span>
        <span class="text-gray-900 font-medium truncate">{{ product?.name ?? '...' }}</span>
      </nav>

      <!-- Loading -->
      <div v-if="loading" class="bg-white rounded-2xl border border-gray-100 p-8 animate-pulse grid lg:grid-cols-2 gap-8">
        <div class="aspect-square bg-gray-200 rounded-xl"></div>
        <div class="space-y-4">
          <div class="h-8 bg-gray-200 rounded w-3/4"></div>
          <div class="h-6 bg-gray-200 rounded w-1/3"></div>
          <div class="h-32 bg-gray-100 rounded"></div>
        </div>
      </div>

      <!-- 404 -->
      <div v-else-if="!product" class="text-center py-16 bg-white rounded-2xl border border-gray-100">
        <p class="text-gray-700 font-semibold">{{ t.notFound }}</p>
        <NuxtLink to="/shop" class="mt-4 inline-block text-primary-600 font-medium hover:text-primary-700">
          ← {{ t.backToShop }}
        </NuxtLink>
      </div>

      <!-- Detail -->
      <div v-else class="grid lg:grid-cols-2 gap-8">

        <!-- Gallery -->
        <div class="space-y-3">
          <div class="aspect-square bg-white rounded-2xl border border-gray-100 overflow-hidden relative group">
            <img
              v-if="activeImage"
              :src="activeImage"
              :alt="product.name"
              class="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105 cursor-zoom-in"
              @click="lightboxOpen = true"
            />
            <div v-else class="w-full h-full flex items-center justify-center text-gray-300">
              <svg class="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>

            <div v-if="expiringSoonLabel" class="absolute top-3 left-3 bg-amber-500 text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">
              {{ expiringSoonLabel }}
            </div>
          </div>

          <!-- Thumbnails -->
          <div v-if="product.images?.length > 1" class="flex gap-2 overflow-x-auto">
            <button
              v-for="(img, i) in product.images"
              :key="i"
              @click="activeIndex = i"
              :class="[
                activeIndex === i ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-200 hover:border-gray-400',
                'h-20 w-20 rounded-xl overflow-hidden border-2 shrink-0 transition-colors'
              ]"
            >
              <img :src="img.url" alt="" class="w-full h-full object-cover" />
            </button>
          </div>
        </div>

        <!-- Info column -->
        <div class="lg:sticky lg:top-24 lg:self-start">
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

            <!-- Store + Categories -->
            <div class="flex flex-wrap items-center gap-2 mb-2">
              <NuxtLink v-if="product.store" :to="`/shop?store_id=${product.store.id}`" class="inline-flex items-center gap-1.5 text-xs text-gray-700 font-semibold uppercase tracking-widest hover:text-primary-600">
                <img v-if="product.store.logo_url" :src="product.store.logo_url" alt="" class="h-4 w-4 rounded-full object-cover" />
                {{ product.store.name }}
              </NuxtLink>
              <span v-if="product.store && product.categories?.length" class="text-gray-300">·</span>
              <NuxtLink
                v-for="cat in (product.categories ?? [])"
                :key="cat.id"
                :to="`/shop?category_id=${cat.id}`"
                class="text-xs text-primary-600 font-semibold uppercase tracking-widest hover:text-primary-700"
              >
                {{ cat.name }}
              </NuxtLink>
            </div>

            <!-- Title -->
            <h1 class="text-2xl md:text-3xl font-bold text-gray-900 leading-tight mb-3">
              {{ product.name }}
            </h1>

            <!-- Price -->
            <div class="flex items-baseline gap-2 mb-5">
              <p class="text-3xl font-extrabold text-gray-900">
                ${{ formatPrice(product.price_cents) }}
              </p>
              <span class="text-sm font-semibold text-gray-500">MXN</span>
            </div>

            <!-- Stock -->
            <div class="mb-5">
              <p v-if="rechecking" class="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-sm font-semibold">
                <svg class="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                {{ t.verifying }}
              </p>
              <p v-else-if="isOutOfStock" class="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-full text-sm font-semibold">
                <span class="h-2 w-2 rounded-full bg-red-500"></span>
                {{ t.soldOut }}
              </p>
              <p v-else class="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-full text-sm font-semibold">
                <span class="h-2 w-2 rounded-full bg-green-500"></span>
                {{ t.inStock }}
              </p>
            </div>

            <!-- Out of stock: WhatsApp CTA replacing the buy buttons -->
            <div v-if="isOutOfStock" class="space-y-3 mb-5">
              <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <p class="font-semibold text-amber-900 mb-1">{{ t.outOfStockTitle }}</p>
                <p class="text-sm text-amber-800 leading-relaxed">{{ t.outOfStockBody }}</p>
              </div>
              <a
                :href="whatsappLink"
                target="_blank"
                rel="noopener"
                class="flex items-center justify-center gap-2.5 w-full py-3.5 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-500/20 transition-colors"
              >
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                {{ t.contactWhatsApp }}
              </a>
            </div>

            <!-- In stock: variant selectors + Quantity + Add to Cart -->
            <template v-else>
              <!-- Color selector -->
              <div v-if="availableColors.length > 0" class="mb-4">
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {{ t.color }}<span v-if="selectedColor" class="text-gray-900 normal-case ml-1.5 tracking-normal">— {{ selectedColor }}</span>
                </p>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="color in availableColors"
                    :key="color.value"
                    @click="selectColor(color.value)"
                    :disabled="!color.hasStock"
                    :class="[
                      selectedColor === color.value
                        ? 'border-primary-500 ring-2 ring-primary-200 text-primary-700 bg-primary-50'
                        : 'border-gray-200 text-gray-700 hover:border-gray-400',
                      !color.hasStock ? 'opacity-40 line-through cursor-not-allowed' : '',
                      'px-3.5 py-2 rounded-xl border-2 text-sm font-medium transition-colors min-w-12'
                    ]"
                  >{{ color.value }}</button>
                </div>
              </div>

              <!-- Size selector -->
              <div v-if="availableSizes.length > 0" class="mb-5">
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {{ t.size }}<span v-if="selectedSize" class="text-gray-900 normal-case ml-1.5 tracking-normal">— {{ selectedSize }}</span>
                </p>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="size in availableSizes"
                    :key="size.value"
                    @click="selectSize(size.value)"
                    :disabled="!size.hasStock"
                    :class="[
                      selectedSize === size.value
                        ? 'border-primary-500 ring-2 ring-primary-200 text-primary-700 bg-primary-50'
                        : 'border-gray-200 text-gray-700 hover:border-gray-400',
                      !size.hasStock ? 'opacity-40 line-through cursor-not-allowed' : '',
                      'min-w-12 px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-colors'
                    ]"
                  >{{ size.value }}</button>
                </div>
                <p v-if="hasVariants && !selectedVariant" class="text-xs text-amber-600 mt-2">{{ t.pickVariant }}</p>
              </div>

              <div class="flex items-center gap-3 mb-4">
                <div class="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    @click="qty = Math.max(1, qty - 1)"
                    :disabled="qty <= 1"
                    class="px-4 py-3 text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-colors"
                    type="button"
                  >−</button>
                  <input
                    v-model.number="qty"
                    type="number"
                    min="1"
                    :max="product.stock"
                    class="w-14 text-center font-semibold focus:outline-none"
                  />
                  <button
                    @click="qty = Math.min(product.stock, qty + 1)"
                    :disabled="qty >= product.stock"
                    class="px-4 py-3 text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-colors"
                    type="button"
                  >+</button>
                </div>

                <button
                  @click="addToCart"
                  :disabled="added || !canAddToCart"
                  class="flex-1 inline-flex items-center justify-center gap-2 py-3 px-6 bg-primary-500 hover:bg-primary-600 active:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 transition-colors"
                >
                  <svg v-if="added" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                  </svg>
                  <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                  {{ added ? t.added : t.addToCart }}
                </button>
              </div>

              <!-- Buy Now (go to cart) -->
              <button
                @click="buyNow"
                :disabled="!canAddToCart"
                class="w-full py-3 bg-amber-400 hover:bg-amber-500 active:bg-amber-600 disabled:bg-gray-200 disabled:cursor-not-allowed text-amber-900 font-bold rounded-xl shadow transition-colors mb-5"
              >
                {{ t.buyNow }}
              </button>
            </template>

            <!-- Trust signals -->
            <div class="space-y-2 pb-5 mb-5 border-b border-gray-100">
              <div class="flex items-start gap-3 text-sm">
                <svg class="w-5 h-5 text-primary-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
                <p class="text-gray-700">{{ t.trustQuality }}</p>
              </div>
              <div class="flex items-start gap-3 text-sm">
                <svg class="w-5 h-5 text-primary-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
                <p class="text-gray-700">{{ t.trustConsolidation }}</p>
              </div>
              <div class="flex items-start gap-3 text-sm">
                <svg class="w-5 h-5 text-primary-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p class="text-gray-700">{{ t.trustShippingLater }}</p>
              </div>
            </div>

            <!-- Specs -->
            <div>
              <h3 class="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wider">{{ t.specs }}</h3>
              <dl class="space-y-2 text-sm">
                <div class="flex justify-between py-1.5">
                  <dt class="text-gray-500">{{ t.weight }}</dt>
                  <dd class="text-gray-900 font-medium">{{ Number(product.weight_kg).toFixed(2) }} kg</dd>
                </div>
                <div class="flex justify-between py-1.5">
                  <dt class="text-gray-500">{{ t.dimensions }}</dt>
                  <dd class="text-gray-900 font-medium">
                    {{ Number(product.length_cm).toFixed(1) }} × {{ Number(product.width_cm).toFixed(1) }} × {{ Number(product.height_cm).toFixed(1) }} cm
                  </dd>
                </div>
                <div v-if="product.sku" class="flex justify-between py-1.5">
                  <dt class="text-gray-500">SKU</dt>
                  <dd class="text-gray-900 font-medium font-mono text-xs">{{ product.sku }}</dd>
                </div>
                <div v-if="product.store" class="flex justify-between py-1.5">
                  <dt class="text-gray-500">{{ t.brand }}</dt>
                  <dd class="text-gray-900 font-medium">{{ product.store.name }}</dd>
                </div>
                <div v-if="(product.categories ?? []).length" class="flex justify-between py-1.5">
                  <dt class="text-gray-500">{{ t.categories }}</dt>
                  <dd class="text-gray-900 font-medium">{{ product.categories.map(c => c.name).join(', ') }}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <!-- Description (full-width below) -->
      <div v-if="product?.description" class="mt-8 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 class="font-bold text-gray-900 text-xl mb-3">{{ t.aboutThis }}</h2>
        <div class="prose prose-sm max-w-none text-gray-700 whitespace-pre-line leading-relaxed">{{ product.description }}</div>
      </div>

      <!-- Related products -->
      <div v-if="related.length > 0" class="mt-12">
        <h2 class="font-bold text-gray-900 text-2xl mb-5">{{ t.related }}</h2>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <ProductCard v-for="r in related" :key="r.id" :product="r" />
        </div>
      </div>
    </div>

    <!-- Lightbox -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="lightboxOpen"
          class="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          @click="lightboxOpen = false"
        >
          <button class="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
          <img :src="activeImage" :alt="product?.name" class="max-w-full max-h-full object-contain" />
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<script setup>
import ProductCard from '~/components/store/ProductCard.vue'

definePageMeta({
  layout: 'default',
})

const { $customFetch } = useNuxtApp()
const { t: createTranslations } = useLanguage()
const route = useRoute()
const router = useRouter()
const toast = useToast()

const t = createTranslations({
  shop:           { es: 'Tienda', en: 'Shop' },
  notFound:       { es: 'Producto no encontrado', en: 'Product not found' },
  backToShop:     { es: 'Volver a la Tienda', en: 'Back to Shop' },
  inStock:        { es: 'Disponible', en: 'In stock' },
  soldOut:        { es: 'Agotado', en: 'Sold out' },
  verifying:      { es: 'Verificando disponibilidad...', en: 'Verifying availability...' },
  addToCart:      { es: 'Agregar al carrito', en: 'Add to cart' },
  added:          { es: '¡Agregado!', en: 'Added!' },
  buyNow:         { es: 'Comprar ahora', en: 'Buy now' },
  outOfStockTitle:{ es: 'Sin stock por ahora', en: 'Out of stock right now' },
  outOfStockBody: { es: 'Si lo necesitas, podemos comprarlo y enviártelo cuando regrese al inventario. Escríbenos por WhatsApp y te ayudamos.', en: 'If you need it, we can source it and ship it once it\'s back in stock. Message us on WhatsApp and we\'ll help.' },
  contactWhatsApp:{ es: 'Pedir por WhatsApp', en: 'Request on WhatsApp' },
  size:           { es: 'Talla', en: 'Size' },
  color:          { es: 'Color', en: 'Color' },
  pickVariant:    { es: 'Elige talla y color para continuar', en: 'Pick size and color to continue' },
  specs:          { es: 'Especificaciones', en: 'Specifications' },
  weight:         { es: 'Peso', en: 'Weight' },
  dimensions:     { es: 'Dimensiones', en: 'Dimensions' },
  category:       { es: 'Categoría', en: 'Category' },
  categories:     { es: 'Categorías', en: 'Categories' },
  brand:          { es: 'Tienda', en: 'Store' },
  aboutThis:      { es: 'Acerca de este producto', en: 'About this product' },
  related:        { es: 'Productos relacionados', en: 'Related products' },
  trustQuality:   { es: 'Producto verificado por Boxly', en: 'Quality verified by Boxly' },
  trustConsolidation: { es: 'Se consolida con tu envío actual', en: 'Consolidated with your current shipment' },
  trustShippingLater: { es: 'El envío se cotiza al consolidar', en: 'Shipping quoted at consolidation' },
})

const { add } = useStoreCart()

const product = ref(null)
const related = ref([])
const loading = ref(true)
const qty = ref(1)
const activeIndex = ref(0)
const lightboxOpen = ref(false)
const added = ref(false)
const selectedSize = ref(null)
const selectedColor = ref(null)
// In-flight guard so the page-load auto-recheck can't double-fire
const rechecking = ref(false)

const activeImage = computed(() => {
  const imgs = product.value?.images ?? []
  return imgs[activeIndex.value]?.url ?? null
})

// Variants — list of all variants for this product (may be empty for products without variants)
const variants = computed(() => product.value?.variants ?? [])
const hasVariants = computed(() => variants.value.length > 0)

// Unique colors / sizes drawn from variants, with hasStock derived from
// availability of any variant matching that axis (and respecting the other
// axis selection if present).
const availableColors = computed(() => {
  const seen = new Set()
  const out = []
  for (const v of variants.value) {
    if (!v.color || seen.has(v.color)) continue
    seen.add(v.color)
    // hasStock = any variant with this color and (current size or no size constraint) is in stock
    const hasStock = variants.value.some(x =>
      x.color === v.color
      && (!selectedSize.value || x.size === selectedSize.value)
      && x.stock_check_status !== 'out_of_stock'
    )
    out.push({ value: v.color, hasStock })
  }
  return out
})

const availableSizes = computed(() => {
  const seen = new Set()
  const out = []
  for (const v of variants.value) {
    if (!v.size || seen.has(v.size)) continue
    seen.add(v.size)
    const hasStock = variants.value.some(x =>
      x.size === v.size
      && (!selectedColor.value || x.color === selectedColor.value)
      && x.stock_check_status !== 'out_of_stock'
    )
    out.push({ value: v.size, hasStock })
  }
  return out
})

// Find the selected variant given current size/color picks
const selectedVariant = computed(() => {
  if (!hasVariants.value) return null
  return variants.value.find(v =>
    (v.size ?? null) === (selectedSize.value ?? null)
    && (v.color ?? null) === (selectedColor.value ?? null)
  ) ?? null
})

const isOutOfStock = computed(() => {
  if (!product.value) return false
  if (hasVariants.value) {
    // Out of stock at product level only if EVERY variant is out_of_stock
    return variants.value.every(v => v.stock_check_status === 'out_of_stock')
  }
  return product.value.stock_check_status === 'out_of_stock' || product.value.stock <= 0
})

const canAddToCart = computed(() => {
  // Lock the buy buttons while a stock recheck is in flight — we don't want
  // the user adding something to cart that might be flipping to out-of-stock
  // a second later.
  if (rechecking.value) return false
  if (isOutOfStock.value) return false
  if (!hasVariants.value) return true
  // Need both axes filled if both exist; selectedVariant must be in stock
  const colorRequired = availableColors.value.length > 0
  const sizeRequired = availableSizes.value.length > 0
  if (colorRequired && !selectedColor.value) return false
  if (sizeRequired && !selectedSize.value) return false
  return selectedVariant.value && selectedVariant.value.stock_check_status !== 'out_of_stock'
})

const selectColor = (c) => {
  selectedColor.value = selectedColor.value === c ? null : c
}
const selectSize = (s) => {
  selectedSize.value = selectedSize.value === s ? null : s
}

const whatsappLink = computed(() => {
  const name = product.value?.name ?? ''
  const message = `Hola! Me interesa el producto "${name}" en la Tienda Boxly. ¿Pueden ayudarme a conseguirlo cuando regrese al inventario?`
  return `https://wa.me/16195591910?text=${encodeURIComponent(message)}`
})

const formatPrice = (cents) => (cents / 100).toLocaleString('es-MX', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const expiringSoonLabel = computed(() => {
  if (!product.value?.available_until) return null
  const date = new Date(product.value.available_until)
  const days = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (days < 0 || days > 7) return null
  if (days <= 0) return 'Último día'
  if (days === 1) return '1 día restante'
  return `${days} días restantes`
})

const fetchProduct = async () => {
  loading.value = true
  try {
    const res = await $customFetch(`/store/products/${route.params.slug}`)
    product.value = res.data?.product ?? null
    related.value = res.data?.related ?? []
    activeIndex.value = 0

    // SEO
    if (product.value) {
      useHead({
        title: `${product.value.name} — Tienda Boxly`,
        meta: [
          { name: 'description', content: product.value.description?.slice(0, 160) ?? `${product.value.name} en la Tienda Boxly` },
          { property: 'og:title', content: product.value.name },
          { property: 'og:image', content: product.value.first_image_url ?? '' },
        ],
      })

      // If the cron data is stale (>15 min old), the first user to view the page
      // triggers a fresh check. The result writes back to the DB, so every other
      // visitor in the next 15 min sees the updated state immediately.
      // Fires in parallel with the page render — the badge shows "Verificando..."
      // and the Add-to-Cart button is locked until the check completes.
      const lastCheck = product.value.last_stock_check_at
        ? new Date(product.value.last_stock_check_at).getTime()
        : 0
      if (Date.now() - lastCheck > 15 * 60 * 1000) {
        recheckStock()
      }
    }
  } catch (err) {
    if (err?.response?.status === 404) {
      product.value = null
    } else {
      console.error('Failed to load product', err)
    }
  } finally {
    loading.value = false
  }
}

const addToCart = () => {
  if (!product.value || !canAddToCart.value) return
  const v = selectedVariant.value
  // Variant price override if set, otherwise product price
  const unitPrice = v?.price_cents ?? product.value.price_cents

  add({
    product_id:  product.value.id,
    variant_id:  v?.id ?? null,
    slug:        product.value.slug,
    name:        product.value.name,
    price_cents: unitPrice,
    weight_kg:   Number(product.value.weight_kg),
    image_url:   product.value.first_image_url,
    size:        v?.size ?? null,
    color:       v?.color ?? null,
  }, qty.value)
  added.value = true
  const variantSuffix = v ? ` (${[v.size, v.color].filter(Boolean).join(' / ')})` : ''
  toast.success(`${product.value.name}${variantSuffix} agregado al carrito`)
  setTimeout(() => { added.value = false }, 2000)
}

const buyNow = () => {
  if (!canAddToCart.value) return
  addToCart()
  setTimeout(() => router.push('/cart'), 250)
}

/**
 * Silent background recheck — only fires on page load when the cron data is stale.
 * Updates the product (and its variants) inline so the user never sees a stale
 * "Disponible" badge for a size that just sold out at the source.
 */
const recheckStock = async () => {
  if (rechecking.value || !product.value) return
  rechecking.value = true
  try {
    const res = await $customFetch(`/store/products/${product.value.slug}/check-stock`, {
      method: 'POST',
    })
    if (res?.data) {
      product.value = res.data

      // If the variant the user already picked is now sold out, surface that loudly
      if (selectedVariant.value && selectedVariant.value.stock_check_status === 'out_of_stock') {
        toast.info('La variante que tenías seleccionada ya no está disponible')
      }
    }
  } catch {
    // Silent fail — fall back to whatever cron data we already have
  } finally {
    rechecking.value = false
  }
}

watch(() => route.params.slug, fetchProduct)
onMounted(fetchProduct)
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
