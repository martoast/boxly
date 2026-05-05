<template>
  <section id="categories" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
    <div class="flex items-end justify-between gap-4 mb-8">
      <div>
        <p class="text-xs font-bold text-primary-600 uppercase tracking-widest mb-2">Categorías</p>
        <h2 class="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Compra por categoría</h2>
      </div>
    </div>

    <div v-if="categoriesWithCovers.length === 0" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      <div v-for="i in 8" :key="i" class="aspect-[4/5] rounded-2xl bg-gray-100 animate-pulse" />
    </div>

    <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      <NuxtLink
        v-for="cat in categoriesWithCovers"
        :key="cat.id"
        :to="`/shop?category_id=${cat.id}`"
        class="group relative block aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
      >
        <img
          v-if="cat.cover_image"
          :src="cat.cover_image"
          :alt="cat.name"
          class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <!-- Fallback gradient when no products yet -->
        <div v-else class="absolute inset-0 bg-gradient-to-br from-primary-500 to-primary-700"></div>

        <!-- Bottom gradient for text legibility -->
        <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

        <div class="absolute inset-x-0 bottom-0 p-4 sm:p-5">
          <h3 class="text-white font-extrabold text-lg sm:text-xl tracking-tight">{{ cat.name }}</h3>
          <p class="text-white/80 text-xs font-medium mt-0.5 inline-flex items-center gap-1 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
            Explorar
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
          </p>
        </div>
      </NuxtLink>
    </div>
  </section>
</template>

<script setup>
const { $customFetch } = useNuxtApp()

// Fetch categories + first product image per category. Done server-side
// (the /shop route is SSR'd) so the tiles render with covers in the
// initial HTML.
const { data } = await useAsyncData('shop-landing-categories', async () => {
  const cats = await $customFetch('/store/categories').catch(() => null)
  const list = cats?.data ?? []
  if (! list.length) return []

  // For each category, pull the first product's image as the tile cover.
  const withCovers = await Promise.all(
    list.map(async (c) => {
      try {
        const res = await $customFetch('/store/products', { query: { category_id: c.id, per_page: 1 } })
        const cover = res?.data?.data?.[0]?.first_image_url ?? null
        return { ...c, cover_image: cover }
      } catch {
        return { ...c, cover_image: null }
      }
    }),
  )
  // Categories with covers first, then any without (placeholder gradient)
  return withCovers.sort((a, b) => Number(!!b.cover_image) - Number(!!a.cover_image))
})

const categoriesWithCovers = computed(() => data.value ?? [])
</script>
