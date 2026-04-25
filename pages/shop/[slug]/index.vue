<template>
  <section class="min-h-screen bg-gray-50 pt-20">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <!-- Breadcrumbs -->
      <nav class="mb-4 text-sm text-gray-500 flex items-center gap-2">
        <NuxtLink to="/shop" class="hover:text-primary-600 transition-colors">{{ t.shop }}</NuxtLink>
        <span>/</span>
        <span v-if="product?.category" class="text-gray-700">{{ product.category }}</span>
        <span v-if="product?.category">/</span>
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

            <!-- Category -->
            <p v-if="product.category" class="text-xs text-primary-600 font-semibold uppercase tracking-widest mb-2">
              {{ product.category }}
            </p>

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
              <p v-if="product.stock <= 0" class="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-full text-sm font-semibold">
                <span class="h-2 w-2 rounded-full bg-red-500"></span>
                {{ t.soldOut }}
              </p>
              <p v-else-if="product.stock <= 10" class="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-sm font-semibold">
                <span class="h-2 w-2 rounded-full bg-amber-500"></span>
                {{ t.onlyLeft.replace('{n}', product.stock) }}
              </p>
              <p v-else class="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-full text-sm font-semibold">
                <span class="h-2 w-2 rounded-full bg-green-500"></span>
                {{ t.inStock }}
              </p>
            </div>

            <!-- Quantity selector + Add to Cart -->
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
                :disabled="product.stock <= 0 || added"
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
              :disabled="product.stock <= 0"
              class="w-full py-3 bg-amber-400 hover:bg-amber-500 active:bg-amber-600 disabled:bg-gray-200 disabled:cursor-not-allowed text-amber-900 font-bold rounded-xl shadow transition-colors mb-5"
            >
              {{ t.buyNow }}
            </button>

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
                <div v-if="product.category" class="flex justify-between py-1.5">
                  <dt class="text-gray-500">{{ t.category }}</dt>
                  <dd class="text-gray-900 font-medium">{{ product.category }}</dd>
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
  onlyLeft:       { es: 'Solo {n} disponibles', en: 'Only {n} left' },
  soldOut:        { es: 'Agotado', en: 'Sold out' },
  addToCart:      { es: 'Agregar al carrito', en: 'Add to cart' },
  added:          { es: '¡Agregado!', en: 'Added!' },
  buyNow:         { es: 'Comprar ahora', en: 'Buy now' },
  specs:          { es: 'Especificaciones', en: 'Specifications' },
  weight:         { es: 'Peso', en: 'Weight' },
  dimensions:     { es: 'Dimensiones', en: 'Dimensions' },
  category:       { es: 'Categoría', en: 'Category' },
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

const activeImage = computed(() => {
  const imgs = product.value?.images ?? []
  return imgs[activeIndex.value]?.url ?? null
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
  if (!product.value || product.value.stock <= 0) return
  add({
    product_id:  product.value.id,
    slug:        product.value.slug,
    name:        product.value.name,
    price_cents: product.value.price_cents,
    weight_kg:   Number(product.value.weight_kg),
    image_url:   product.value.first_image_url,
  }, qty.value)
  added.value = true
  toast.success(`${product.value.name} agregado al carrito`)
  setTimeout(() => { added.value = false }, 2000)
}

const buyNow = () => {
  addToCart()
  setTimeout(() => router.push('/cart'), 250)
}

watch(() => route.params.slug, fetchProduct)
onMounted(fetchProduct)
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
