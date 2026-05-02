<template>
  <main class="min-h-screen bg-white">
    <!-- WhatsApp Button -->
    <WhatsAppButton />

    <!-- Products Section -->
    <section class="py-16 md:py-24 bg-white">
      <div class="container mx-auto px-4 md:px-8 lg:px-12">
        <!-- Header with Currency Info -->
        <div class="mb-8 flex items-center justify-between">
          <div>
            <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{{ t.hotDeals }}</h1>
            <p class="text-gray-600">{{ t.dealsDescription }}</p>
          </div>
          <div class="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span class="text-sm font-semibold text-blue-900">{{ t.pricesInUSD }}</span>
          </div>
        </div>

        <!-- Products Grid -->
        <div v-if="productsStore.hotDeals.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          <div
            v-for="product in productsStore.hotDeals"
            :key="product.id"
            class="group bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-gray-300 transition-all duration-300 flex flex-col h-full hover:shadow-xl"
          >

            <!-- Product Info -->
            <div class="p-6 flex flex-col flex-1">
              <!-- Store / Category -->
              <div class="mb-3">
                <span class="inline-block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {{ product.store?.name ?? product.categories?.[0]?.name ?? '' }}
                </span>
              </div>
              
              <!-- Product Name -->
              <h3 class="font-semibold text-gray-900 mb-3 line-clamp-3 leading-snug min-h-[4rem] group-hover:text-primary-600 transition-colors">
                {{ product.name }}
              </h3>
              
              <!-- Description -->
              <p class="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                {{ product.description }}
              </p>

              <!-- Rating -->
              <div v-if="product.rating" class="flex items-center gap-2 mb-4">
                <div class="flex items-center">
                  <svg v-for="star in 5" :key="star" class="w-4 h-4" :class="star <= Math.round(product.rating) ? 'text-yellow-400' : 'text-gray-300'" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                </div>
                <span class="text-sm font-medium text-gray-700">{{ product.rating }}</span>
                <span v-if="product.reviews" class="text-xs text-gray-500">({{ formatNumber(product.reviews) }})</span>
              </div>

              <!-- Spacer -->
              <div class="flex-1"></div>

              <!-- Pricing -->
              <div class="mb-5">
                <div class="flex items-baseline gap-2 mb-1">
                  <span class="text-3xl font-bold text-gray-900">
                    ${{ product.price.toFixed(2) }}
                  </span>
                  <span class="text-base text-gray-400 line-through">
                    ${{ product.originalPrice.toFixed(2) }}
                  </span>
                  <span class="text-xs text-gray-500 font-medium">USD</span>
                </div>
                <div class="text-sm font-semibold text-green-600">
                  {{ t.saveAmount }} ${{ product.savings.toFixed(2) }}
                </div>
              </div>

              <!-- CTA Button -->
              <NuxtLink
                :to="product.amazonLink"
                external
                target="_blank"
                class="block w-full px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-all duration-300 text-center"
              >
                <span class="flex items-center justify-center gap-2">
                  {{ t.viewDeal }}
                  <svg class="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                  </svg>
                </span>
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-20">
          <div class="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
            <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
            </svg>
          </div>
          <h3 class="text-2xl font-bold text-gray-900 mb-3">{{ t.noDealsAvailable }}</h3>
          <p class="text-gray-600 mb-8 text-lg">{{ t.checkBackSoon }}</p>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <FooterSection />
  </main>
</template>

<script setup>
import { useProductsStore } from '~/stores/products'
import WhatsAppButton from '~/components/Landing/WhatsAppButton.vue'
import FooterSection from '~/components/Landing/FooterSection.vue'

definePageMeta({
  layout: 'default'
})

const { t: createTranslations } = useLanguage()
const productsStore = useProductsStore()

const formatNumber = (num) => {
  return new Intl.NumberFormat('en-US').format(num)
}

const translations = {
  hotDeals: {
    es: 'Ofertas Calientes',
    en: 'Hot Deals'
  },
  dealsDescription: {
    es: 'Las mejores ofertas de Amazon actualizadas diariamente',
    en: 'Best Amazon deals updated daily'
  },
  pricesInUSD: {
    es: 'Precios en USD',
    en: 'Prices in USD'
  },
  saveAmount: {
    es: 'Ahorra',
    en: 'Save'
  },
  viewDeal: {
    es: 'Ver Oferta',
    en: 'View Deal'
  },
  noDealsAvailable: {
    es: 'No hay ofertas disponibles',
    en: 'No deals available'
  },
  checkBackSoon: {
    es: 'Vuelve pronto para nuevas ofertas increíbles',
    en: 'Check back soon for amazing new deals'
  }
}

const t = createTranslations(translations)
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>