<template>
  <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
    <div class="flex items-baseline justify-between gap-4 mb-6">
      <h2 class="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Lo nuevo</h2>
      <NuxtLink
        to="/shop?sort=newest&view=all"
        class="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-primary-600 transition-colors"
      >
        Ver todos
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
      </NuxtLink>
    </div>

    <div v-if="products.length === 0" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      <div v-for="i in 10" :key="i" class="aspect-[4/5] rounded-2xl bg-gray-100 animate-pulse" />
    </div>

    <!-- 2 rows on desktop (5 cols × 2 = 10) so customers see more
         drops in one scroll. Smaller breakpoints stack naturally. -->
    <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 auto-rows-fr">
      <ProductCard v-for="p in products" :key="p.id" :product="p" />
    </div>
  </section>
</template>

<script setup>
import ProductCard from '~/components/store/ProductCard.vue'

const { $customFetch } = useNuxtApp()

const { data } = await useAsyncData('shop-landing-featured', async () => {
  const res = await $customFetch('/store/products', {
    query: { per_page: 10, sort: 'newest' },
  }).catch(() => null)
  return res?.data?.data ?? []
})

const products = computed(() => data.value ?? [])
</script>
