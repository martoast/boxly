<template>
  <section id="brands" class="bg-white py-16 lg:py-24">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 class="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-6">Marcas</h2>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <NuxtLink
          v-for="b in brandTiles"
          :key="b.id"
          :to="`/shop?store_id=${b.id}`"
          class="group relative block aspect-[4/5] rounded-2xl overflow-hidden bg-gray-800 transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary-900/40"
        >
          <img
            v-if="b.cover"
            :src="b.cover"
            :alt="b.name"
            class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup>
const { $customFetch } = useNuxtApp()

// Fallback map for stores without a custom cover_image_url uploaded yet.
// As soon as a store has its own cover, that wins.
const COVER_MAP = {
  'alo yoga':   '/images/shop-brand-alo.png',
  'alo':        '/images/shop-brand-alo.png',
  'lululemon':  '/images/shop-brand-lululemon.png',
  'stanley':    '/images/shop-brand-stanley.png',
  'youngla':    '/images/shop-brand-youngla.png',
}
const coverFor = (s) => s.cover_image_url || COVER_MAP[(s.name || '').trim().toLowerCase()] || null

const { data } = await useAsyncData('shop-landing-brands', async () => {
  const res = await $customFetch('/store/stores').catch(() => null)
  return res?.data ?? []
})

const brandTiles = computed(() =>
  (data.value ?? []).map((s) => ({ ...s, cover: coverFor(s) }))
)
</script>
