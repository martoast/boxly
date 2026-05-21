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

      <!-- Mobile: horizontal scroll. Desktop: grid. -->
      <div class="flex sm:grid sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 overflow-x-auto sm:overflow-visible -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory sm:snap-none">
        <NuxtLink
          v-for="p in products"
          :key="p.id"
          :to="`/shop/${p.slug}`"
          class="snap-start flex-shrink-0 w-44 sm:w-auto bg-white rounded-2xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all overflow-hidden group"
        >
          <div class="aspect-square bg-gray-100 overflow-hidden">
            <img
              v-if="p.images?.[0]"
              :src="p.images[0]"
              :alt="p.name"
              loading="lazy"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            >
            <div v-else class="w-full h-full flex items-center justify-center text-gray-300">
              <svg class="w-10 h-10" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01"/></svg>
            </div>
          </div>
          <div class="p-3">
            <div v-if="p.store?.name" class="text-[10px] uppercase tracking-wider text-gray-500 font-semibold truncate">{{ p.store.name }}</div>
            <div class="font-semibold text-gray-900 text-sm leading-tight mt-0.5 line-clamp-2">{{ p.name }}</div>
            <div v-if="p.price_cents" class="text-sm font-bold text-primary-600 mt-1.5">${{ (p.price_cents / 100).toFixed(2) }} MXN</div>
          </div>
        </NuxtLink>
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
