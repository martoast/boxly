<template>
  <section id="brands" class="bg-white py-16 lg:py-24">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 class="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-6">Marcas</h2>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-6">
        <NuxtLink
          v-for="b in brandTiles"
          :key="b.id"
          :to="`/shop?store_id=${b.id}`"
          class="group block"
        >
          <div class="relative aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100 transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-xl">
            <img
              v-if="b.cover"
              :src="b.cover"
              :alt="b.name"
              class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          </div>
          <div class="mt-3 flex items-center gap-2.5">
            <div v-if="b.logo_url" class="h-8 w-8 rounded-full bg-white border border-gray-100 p-1 flex items-center justify-center shrink-0">
              <img :src="b.logo_url" :alt="b.name" class="max-w-full max-h-full object-contain" />
            </div>
            <h3 class="font-bold text-gray-900 tracking-tight text-base sm:text-lg">{{ b.name }}</h3>
          </div>
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
