<template>
  <section class="min-h-screen bg-white lg:bg-gray-50 pt-14 sm:pt-20 pb-24 lg:pb-12">

    <!-- Breadcrumbs (hidden on mobile — Shopify-style, the back arrow lives in the navbar) -->
    <nav class="hidden sm:flex max-w-7xl mx-auto px-6 lg:px-8 pt-2 pb-4 text-sm text-gray-500 items-center gap-2 overflow-hidden">
      <NuxtLink to="/shop" class="hover:text-primary-600 transition-colors shrink-0">{{ t.shop }}</NuxtLink>
      <span class="text-gray-300 shrink-0">/</span>
      <NuxtLink v-if="product?.store" :to="`/shop?store_id=${product.store.id}`" class="text-gray-700 hover:text-primary-600 shrink-0">{{ product.store.name }}</NuxtLink>
      <span v-if="product?.store" class="text-gray-300 shrink-0">/</span>
      <span class="text-gray-900 font-medium truncate">{{ product?.name ?? '...' }}</span>
    </nav>

    <!-- Loading skeleton -->
    <div v-if="loading" class="max-w-7xl mx-auto sm:px-6 lg:px-8 sm:py-2">
      <div class="grid lg:grid-cols-2 gap-6 lg:gap-10 animate-pulse">
        <div class="aspect-square sm:aspect-[4/5] bg-gray-200 sm:rounded-2xl"></div>
        <div class="space-y-4 px-4 sm:px-0 py-4 sm:py-2">
          <div class="h-6 bg-gray-200 rounded w-1/3"></div>
          <div class="h-9 bg-gray-200 rounded w-3/4"></div>
          <div class="h-10 bg-gray-200 rounded w-1/2 mt-2"></div>
          <div class="h-32 bg-gray-100 rounded mt-6"></div>
        </div>
      </div>
    </div>

    <!-- 404 -->
    <div v-else-if="!product" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="text-center py-20 bg-white rounded-2xl border border-gray-100">
        <p class="text-gray-700 font-semibold">{{ t.notFound }}</p>
        <NuxtLink to="/shop" class="mt-4 inline-block text-primary-600 font-medium hover:text-primary-700">
          ← {{ t.backToShop }}
        </NuxtLink>
      </div>
    </div>

    <!-- Product detail -->
    <div v-else class="max-w-7xl mx-auto lg:px-8">
      <div class="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] xl:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:gap-10">

        <!-- ────────────────────────────────────────────────
             GALLERY
             Mobile (< lg): edge-to-edge swipeable carousel + dots
             Desktop (lg+): big main image card + thumbnail strip
             ──────────────────────────────────────────────── -->
        <div>
          <!-- MOBILE: full-bleed carousel -->
          <div class="lg:hidden relative bg-white">
            <div
              v-if="displayedImages.length > 0"
              ref="mobileCarousel"
              :key="`mobile-${selectedColor || 'all'}`"
              class="flex overflow-x-auto snap-x snap-mandatory scrollbar-none"
              @scroll.passive="onMobileScroll"
            >
              <div
                v-for="(img, i) in displayedImages"
                :key="img.url"
                class="shrink-0 w-full snap-center aspect-square flex items-center justify-center bg-white"
              >
                <img
                  :src="img.url"
                  :alt="product.name"
                  class="w-full h-full object-contain cursor-zoom-in"
                  @click="lightboxOpen = true"
                  loading="lazy"
                />
              </div>
            </div>

            <!-- Empty state -->
            <div v-if="displayedImages.length === 0" class="aspect-square flex items-center justify-center text-gray-300 bg-white">
              <svg class="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>

            <!-- Expiring soon ribbon (overlay) -->
            <div v-if="expiringSoonLabel" class="absolute top-3 left-3 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow z-10">
              {{ expiringSoonLabel }}
            </div>

            <!-- Image counter pill (top-right) -->
            <div v-if="displayedImages.length > 1" class="absolute top-3 right-3 bg-black/55 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm z-10">
              {{ activeIndex + 1 }} / {{ displayedImages.length }}
            </div>

            <!-- Dots indicator -->
            <div v-if="displayedImages.length > 1" class="absolute bottom-3 inset-x-0 flex justify-center gap-1.5 z-10">
              <button
                v-for="(_, i) in displayedImages"
                :key="i"
                @click="goToImage(i)"
                :class="[
                  activeIndex === i ? 'bg-gray-900 w-5' : 'bg-gray-400/70 w-1.5',
                  'h-1.5 rounded-full transition-all'
                ]"
                :aria-label="`Imagen ${i + 1}`"
              ></button>
            </div>

            <!-- Next-image button (Lululemon-style) — bottom-right circle.
                 Hints that swiping is possible AND gives non-swipe users a way
                 to advance. Wraps back to image 0 when at the end. -->
            <button
              v-if="displayedImages.length > 1"
              @click="goToImage((activeIndex + 1) % displayedImages.length)"
              class="absolute bottom-3 right-3 z-10 h-10 w-10 flex items-center justify-center bg-white/95 hover:bg-white shadow-md rounded-full text-gray-900 active:scale-95 transition-transform"
              aria-label="Siguiente imagen"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>

          <!-- DESKTOP: big card image + thumbnail strip.
               max-w cap keeps the gallery from filling a wide column on
               large monitors — without it, a square-ish product like a
               tumbler renders ~900px tall on a 1600px screen and pushes
               the thumbnail strip below the fold. -->
          <div class="hidden lg:block space-y-3 lg:sticky lg:top-24 max-w-[460px]">
            <div class="relative aspect-square bg-white rounded-2xl border border-gray-100 overflow-hidden group">
              <img
                v-if="activeImage"
                :src="activeImage"
                :alt="product.name"
                class="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-[1.02] cursor-zoom-in"
                @click="lightboxOpen = true"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-gray-300">
                <svg class="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
              </div>
              <div v-if="expiringSoonLabel" class="absolute top-3 left-3 bg-amber-500 text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow">
                {{ expiringSoonLabel }}
              </div>
            </div>

            <div v-if="displayedImages.length > 1" class="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-thin">
              <button
                v-for="(img, i) in displayedImages"
                :key="img.url"
                @click="activeIndex = i"
                :class="[
                  activeIndex === i ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-200 hover:border-gray-400',
                  'h-20 w-20 rounded-xl overflow-hidden border-2 shrink-0 snap-start transition-colors bg-white'
                ]"
              >
                <img :src="img.url" alt="" class="w-full h-full object-contain p-1" />
              </button>
            </div>
          </div>
        </div>

        <!-- ────────────────────────────────────────────────
             INFO COLUMN
             Mobile: padded text below the gallery
             Desktop: sticky card on the right
             ──────────────────────────────────────────────── -->
        <div class="px-4 sm:px-6 lg:px-0 pt-5 lg:pt-0">
          <div class="lg:bg-white lg:rounded-2xl lg:border lg:border-gray-100 lg:shadow-sm lg:p-6">

            <!-- Store + Categories chips -->
            <div class="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2">
              <NuxtLink
                v-if="product.store"
                :to="`/shop?store_id=${product.store.id}`"
                class="inline-flex items-center gap-1.5 text-[11px] sm:text-xs text-gray-700 font-semibold uppercase tracking-widest hover:text-primary-600"
              >
                <img v-if="product.store.logo_url" :src="product.store.logo_url" alt="" class="h-4 w-4 rounded-full object-cover" />
                {{ product.store.name }}
              </NuxtLink>
              <span v-if="product.store && product.categories?.length" class="text-gray-300">·</span>
              <NuxtLink
                v-for="cat in (product.categories ?? [])"
                :key="cat.id"
                :to="`/shop?category_id=${cat.id}`"
                class="text-[11px] sm:text-xs text-primary-600 font-semibold uppercase tracking-widest hover:text-primary-700"
              >
                {{ cat.name }}
              </NuxtLink>
            </div>

            <!-- Title -->
            <h1 class="text-2xl sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight mb-2">
              {{ product.name }}
            </h1>

            <!-- Color — primary attribute of this product. Each Boxly product
                 represents one specific color of the source-store SKU group, so
                 we show it prominently right under the name. -->
            <div v-if="product.color" class="flex items-center gap-2 mb-4">
              <span class="text-[11px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ t.color }}</span>
              <span class="inline-flex items-center px-3 py-1 rounded-full bg-gray-900 text-white text-sm font-medium">
                {{ product.color }}
              </span>
            </div>

            <!-- Price -->
            <div class="flex items-baseline gap-2 mb-6">
              <p class="text-2xl sm:text-3xl font-extrabold text-gray-900">
                ${{ formatPrice(product.price_cents) }}
              </p>
              <span class="text-xs sm:text-sm font-semibold text-gray-500">MXN</span>
            </div>

            <!-- Length selector (only when product has length variants — Lululemon tights, denim inseam) -->
            <div v-if="availableLengths.length > 0" class="mb-5">
              <p class="text-[11px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {{ t.length }}<span v-if="selectedLength" class="text-gray-900 normal-case ml-1.5 tracking-normal font-bold">— {{ selectedLength }}</span>
              </p>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="len in availableLengths"
                  :key="len.value"
                  @click="selectLength(len.value)"
                  :class="[
                    selectedLength === len.value
                      ? 'border-gray-900 text-gray-900 bg-gray-50'
                      : 'border-gray-200 text-gray-700 hover:border-gray-400 active:border-gray-900',
                    'px-3.5 py-2 rounded-xl border text-sm font-medium transition-colors'
                  ]"
                >{{ len.value }}</button>
              </div>
            </div>

            <!-- Size selector -->
            <div v-if="availableSizes.length > 0" class="mb-6">
              <p class="text-[11px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {{ t.size }}<span v-if="selectedSize" class="text-gray-900 normal-case ml-1.5 tracking-normal font-bold">— {{ selectedSize }}</span>
              </p>
              <div class="grid grid-cols-4 sm:grid-cols-5 gap-2">
                <button
                  v-for="size in availableSizes"
                  :key="size.value"
                  @click="selectSize(size.value)"
                  :disabled="!size.hasStock"
                  :class="[
                    selectedSize === size.value
                      ? 'border-gray-900 text-gray-900 bg-gray-50'
                      : 'border-gray-200 text-gray-700 hover:border-gray-400 active:border-gray-900',
                    !size.hasStock ? 'opacity-40 line-through cursor-not-allowed' : '',
                    'h-11 px-3 rounded-lg border text-sm font-semibold transition-colors text-center'
                  ]"
                >{{ size.value }}</button>
              </div>
              <p v-if="hasVariants && !selectedVariant" class="text-xs text-amber-600 mt-2 font-medium">{{ t.pickVariant }}</p>
            </div>

            <!-- Inline CTAs (desktop / tablet only — mobile uses sticky bottom bar) -->
            <div class="hidden lg:flex items-center gap-3 mb-3">
              <div class="flex items-center border border-gray-200 rounded-xl overflow-hidden shrink-0">
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
                  max="99"
                  class="w-12 text-center font-semibold focus:outline-none"
                />
                <button
                  @click="qty = Math.min(99, qty + 1)"
                  :disabled="qty >= 99"
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

            <button
              @click="buyNow"
              :disabled="!canAddToCart"
              class="hidden lg:block w-full py-3 bg-amber-400 hover:bg-amber-500 active:bg-amber-600 disabled:bg-gray-200 disabled:cursor-not-allowed text-amber-900 font-bold rounded-xl shadow transition-colors mb-5"
            >
              {{ t.buyNow }}
            </button>


            <!-- Description (collapsible on mobile) -->
            <details v-if="product.description" class="mt-4 lg:mt-5 border-t lg:border-t-0 border-gray-100 pt-4 lg:pt-0 group" :open="false">
              <summary class="font-semibold text-gray-900 mb-2 text-xs sm:text-sm uppercase tracking-wider cursor-pointer list-none flex items-center justify-between">
                <span>{{ t.aboutThis }}</span>
                <svg class="w-4 h-4 text-gray-400 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </summary>
              <div class="prose prose-sm max-w-none text-gray-700 whitespace-pre-line leading-relaxed pt-2">{{ product.description }}</div>
            </details>

            <!-- Specs (collapsible on mobile, open on desktop) -->
            <details class="mt-4 border-t border-gray-100 pt-4 group" :open="true">
              <summary class="font-semibold text-gray-900 mb-3 text-xs sm:text-sm uppercase tracking-wider cursor-pointer list-none flex items-center justify-between">
                <span>{{ t.specs }}</span>
                <svg class="w-4 h-4 text-gray-400 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </summary>
              <dl class="space-y-1.5 text-sm">
                <div class="flex justify-between py-1.5">
                  <dt class="text-gray-500">{{ t.weight }}</dt>
                  <dd class="text-gray-900 font-medium">{{ Number(product.weight_kg).toFixed(2) }} kg</dd>
                </div>
                <div class="flex justify-between py-1.5">
                  <dt class="text-gray-500">{{ t.dimensions }}</dt>
                  <dd class="text-gray-900 font-medium text-right">
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
                  <dd class="text-gray-900 font-medium text-right">{{ product.categories.map(c => c.name).join(', ') }}</dd>
                </div>
              </dl>
            </details>
          </div>
        </div>
      </div>

      <!-- Related products -->
      <div v-if="related.length > 0" class="px-4 sm:px-6 lg:px-0 mt-10 sm:mt-14">
        <h2 class="font-bold text-gray-900 text-xl sm:text-2xl mb-4 sm:mb-5">{{ t.related }}</h2>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 auto-rows-fr">
          <ProductCard v-for="r in related" :key="r.id" :product="r" />
        </div>
      </div>
    </div>

    <!-- ────────────────────────────────────────────────
         Sticky bottom bar (mobile only) — Add to Cart always reachable
         ──────────────────────────────────────────────── -->
    <div
      v-if="product"
      class="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-sm border-t border-gray-200 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
    >
      <div class="flex items-center gap-3">
        <div class="flex items-center border border-gray-200 rounded-xl overflow-hidden shrink-0">
          <button
            @click="qty = Math.max(1, qty - 1)"
            :disabled="qty <= 1"
            class="px-3 py-2.5 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
            type="button"
            aria-label="Disminuir cantidad"
          >−</button>
          <span class="w-7 text-center font-semibold text-sm">{{ qty }}</span>
          <button
            @click="qty = Math.min(99, qty + 1)"
            :disabled="qty >= 99"
            class="px-3 py-2.5 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
            type="button"
            aria-label="Aumentar cantidad"
          >+</button>
        </div>
        <button
          @click="addToCart"
          :disabled="added || !canAddToCart"
          class="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 bg-primary-500 active:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 transition-colors text-sm"
        >
          <svg v-if="added" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
          </svg>
          <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
          </svg>
          <span class="truncate">{{ added ? t.added : t.addToCart }} · ${{ formatPrice(product.price_cents * qty) }} MXN</span>
        </button>
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
  addToCart:      { es: 'Agregar al carrito', en: 'Add to cart' },
  added:          { es: '¡Agregado!', en: 'Added!' },
  buyNow:         { es: 'Comprar ahora', en: 'Buy now' },
  size:           { es: 'Talla', en: 'Size' },
  color:          { es: 'Color', en: 'Color' },
  length:         { es: 'Largo', en: 'Length' },
  pickVariant:    { es: 'Elige todas las opciones para continuar', en: 'Pick every option to continue' },
  specs:          { es: 'Especificaciones', en: 'Specifications' },
  weight:         { es: 'Peso', en: 'Weight' },
  dimensions:     { es: 'Dimensiones', en: 'Dimensions' },
  category:       { es: 'Categoría', en: 'Category' },
  categories:     { es: 'Categorías', en: 'Categories' },
  brand:          { es: 'Tienda', en: 'Store' },
  aboutThis:      { es: 'Acerca de este producto', en: 'About this product' },
  related:        { es: 'Productos relacionados', en: 'Related products' },
})

const { add } = useStoreCart()

// useAsyncData = data fetched on the SERVER for SSR-enabled routes
// (we set /shop/** to ssr: true via routeRules), then re-used on the
// client during hydration. This is what makes social-share previews
// and SEO indexing work natively — the product's title, image, and
// description are baked into the initial HTML the crawler sees.
const { data: pageData, pending, refresh } = await useAsyncData(
  () => `shop-product-${route.params.slug}`,
  () => $customFetch(`/store/products/${route.params.slug}`).catch((err) => {
    if (err?.response?.status === 404) return null
    throw err
  }),
  { watch: [() => route.params.slug] },
)

const product = computed(() => pageData.value?.data?.product ?? null)
const related = computed(() => pageData.value?.data?.related ?? [])
const loading = computed(() => pending.value)

const qty = ref(1)
const activeIndex = ref(0)
const lightboxOpen = ref(false)
const added = ref(false)
const selectedSize = ref(null)
const selectedLength = ref(null)
const mobileCarousel = ref(null)

// Reset gallery + variant pickers when navigating between products
watch(() => route.params.slug, () => {
  activeIndex.value = 0
  selectedSize.value = null
  selectedLength.value = null
  qty.value = 1
})

// SEO meta — driven by computed product so it auto-refreshes when the
// route changes. useHead is reactive in Nuxt 3 when given functions /
// refs / computeds, and runs both server-side (for crawlers) and
// client-side (for in-app navigation tab titles).
useHead(() => {
  const p = product.value
  if (!p) return { title: 'Tienda Boxly' }
  const colorSuffix = p.color ? ` - ${p.color}` : ''
  const title = `${p.name}${colorSuffix} — Tienda Boxly`
  const description = (p.description || `${p.name} en la Tienda Boxly`).trim().slice(0, 200)
  const image = p.first_image_url || 'https://boxly.mx/logo.jpeg'
  const fullUrl = `https://boxly.mx/shop/${p.slug}`
  return {
    title,
    meta: [
      { name: 'description', content: description },
      { property: 'og:type', content: 'product' },
      { property: 'og:url', content: fullUrl },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: image },
      { property: 'og:image:alt', content: p.name },
      { property: 'og:locale', content: 'es_MX' },
      { property: 'og:site_name', content: 'Boxly' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image },
    ],
    link: [{ rel: 'canonical', href: fullUrl }],
  }
})

// Update activeIndex while the user swipes through the mobile carousel
const onMobileScroll = (e) => {
  const el = e.target
  const idx = Math.round(el.scrollLeft / el.clientWidth)
  if (idx !== activeIndex.value) activeIndex.value = idx
}

// Click a dot → scroll the carousel to that image
const goToImage = (i) => {
  activeIndex.value = i
  const el = mobileCarousel.value
  if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
}

// All images belong to this product's single color, so no filtering.
const displayedImages = computed(() => product.value?.images ?? [])

const activeImage = computed(() => {
  return displayedImages.value[activeIndex.value]?.url ?? null
})

// Variants — list of all variants for this product (may be empty for products without variants)
const variants = computed(() => product.value?.variants ?? [])
const hasVariants = computed(() => variants.value.length > 0)

const availableSizes = computed(() => {
  const seen = new Set()
  const out = []
  for (const v of variants.value) {
    if (!v.size || seen.has(v.size)) continue
    seen.add(v.size)
    out.push({ value: v.size, hasStock: true })
  }
  return out
})

// Third axis — only renders when at least one variant has a length value.
// Lululemon Wunder Train (25" / 28"), denim inseam, etc.
const availableLengths = computed(() => {
  const seen = new Set()
  const out = []
  for (const v of variants.value) {
    if (!v.length || seen.has(v.length)) continue
    seen.add(v.length)
    out.push({ value: v.length })
  }
  return out
})

// Find the selected variant given current size/length picks. Color is
// product-level now (one Boxly product = one color), so it's not part
// of variant matching.
const selectedVariant = computed(() => {
  if (!hasVariants.value) return null
  return variants.value.find(v =>
    (v.size   ?? null) === (selectedSize.value   ?? null)
    && (v.length ?? null) === (selectedLength.value ?? null)
  ) ?? null
})

const canAddToCart = computed(() => {
  if (!hasVariants.value) return true
  const sizeRequired   = availableSizes.value.length   > 0
  const lengthRequired = availableLengths.value.length > 0
  if (sizeRequired   && !selectedSize.value)   return false
  if (lengthRequired && !selectedLength.value) return false
  return !!selectedVariant.value
})

const selectSize = (s) => {
  selectedSize.value = selectedSize.value === s ? null : s
}
const selectLength = (l) => {
  selectedLength.value = selectedLength.value === l ? null : l
}

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
    length:      v?.length ?? null,
    color:       product.value.color ?? null,
  }, qty.value)
  added.value = true
  const variantSuffix = ` (${[product.value.color, v?.size, v?.length].filter(Boolean).join(' / ')})`
  toast.success(`${product.value.name}${variantSuffix} agregado al carrito`)
  setTimeout(() => { added.value = false }, 2000)
}

const buyNow = () => {
  if (!canAddToCart.value) return
  addToCart()
  setTimeout(() => router.push('/cart'), 250)
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* Hide scrollbars on the mobile gallery carousel + desktop thumbnail strip
   while keeping the swipe/scroll behavior. */
.scrollbar-none::-webkit-scrollbar,
.scrollbar-thin::-webkit-scrollbar { display: none; }
.scrollbar-none, .scrollbar-thin { -ms-overflow-style: none; scrollbar-width: none; }
</style>
