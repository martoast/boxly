<template>
  <div>
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      <div class="mb-8">
        <p class="text-xs font-bold text-primary-600 uppercase tracking-widest mb-2">Tienda Boxly</p>
        <h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight">Categorías</h1>
        <p class="text-gray-500 mt-2 text-base">Explora la tienda completa por categoría.</p>
      </div>

      <div v-if="sortedCategories.length === 0" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        <div v-for="i in 8" :key="i" class="aspect-[4/5] rounded-2xl bg-gray-100 animate-pulse" />
      </div>

      <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        <NuxtLink
          v-for="cat in sortedCategories"
          :key="cat.id"
          :to="`/shop?category_id=${cat.id}`"
          class="group relative block aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
        >
          <StoreImage
            v-if="cat.image_url"
            :src="cat.image_url"
            :alt="cat.name"
            class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div v-else class="absolute inset-0 bg-gradient-to-br from-primary-500 to-primary-700"></div>
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
  </div>
</template>

<script setup>
import StoreImage from '~/components/store/StoreImage.vue'

definePageMeta({ layout: 'shop' })

useHead({
  title: 'Categorías — Tienda Boxly',
  meta: [
    { name: 'description', content: 'Compra por categoría en la Tienda Boxly: leggings, hoodies, botellas, bolsos y más.' },
  ],
})

// Categories come from the shared shop-menu composable — single SSR
// fetch, deduped across navbar / filter drawer / this page. The
// backend already backfills image_url with a representative product
// image for categories without an admin-uploaded cover, so no extra
// per-category fetches needed here anymore.
const { categories } = useShopMenuData()

// Categories with images first — keeps imageless ones at the bottom
// where their gradient placeholder won't fight the curated cover
// images visually.
const sortedCategories = computed(() =>
  [...categories.value].sort((a, b) => Number(!! b.image_url) - Number(!! a.image_url)),
)
</script>
