<template>
  <!-- "Trending en USA" — small curated rail of 6-8 products. Horizontal
       scroll on mobile, grid on desktop. Hides itself entirely if there
       are no products (better than rendering an empty header). Backend
       endpoint /store/products/featured returns is_featured=true products;
       falling back to /store/products?sort=newest while the feature flag
       column is still rolling out to prod. -->
  <section v-if="!loading && products.length > 0" class="bg-gray-50 py-10 sm:py-14">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-end justify-between mb-5 sm:mb-7">
        <div>
          <p class="text-xs sm:text-sm font-semibold text-primary-600 uppercase tracking-wider mb-1">{{ t.eyebrow }}</p>
          <h2 class="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 tracking-tight">{{ t.title }}</h2>
        </div>
        <NuxtLink to="/shop" class="text-sm font-semibold text-primary-600 hover:text-primary-700 hidden sm:inline-flex items-center gap-1">
          {{ t.seeAll }}
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
        </NuxtLink>
      </div>

      <!-- Mobile: horizontal scroll. Desktop: grid. Cards are the shared
           store ProductCard so the rail matches the shop listing exactly. -->
      <div class="flex sm:grid sm:grid-cols-3 lg:grid-cols-4 sm:auto-rows-fr gap-3 sm:gap-4 overflow-x-auto sm:overflow-visible -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory sm:snap-none">
        <div
          v-for="p in products"
          :key="p.id"
          class="snap-start flex-shrink-0 w-44 sm:w-auto"
        >
          <ProductCard :product="p" />
        </div>
      </div>

      <NuxtLink to="/shop" class="mt-5 inline-flex sm:hidden items-center justify-center gap-1.5 w-full py-3 bg-white border border-gray-200 hover:border-primary-300 rounded-xl text-sm font-semibold text-primary-600">
        {{ t.seeAll }}
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
      </NuxtLink>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import ProductCard from '~/components/store/ProductCard.vue'

const { $customFetch } = useNuxtApp()
const { t: createTranslations } = useLanguage()

const t = createTranslations({
  eyebrow: { es: 'Lo más buscado en USA', en: 'Trending in the US' },
  title:   { es: 'Productos que están moviéndose', en: 'What\'s moving right now' },
  seeAll:  { es: 'Ver toda la tienda', en: 'See the full store' },
})

const products = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await $customFetch('/store/products/featured')
    // Featured endpoint returns a flat array under `data` (not paginated).
    products.value = Array.isArray(res?.data) ? res.data : []
  } catch (e) {
    console.error('Trending rail load failed', e)
  } finally {
    loading.value = false
  }
})
</script>
