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
            class="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
            loading="lazy"
          />
          <!-- Dark gradient overlay so the white logo + name read cleanly -->
          <div class="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/85"></div>

          <!-- Logo + name in lower left -->
          <div class="absolute inset-x-0 bottom-0 p-5 sm:p-6">
            <div v-if="b.logo_url" class="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-white/95 p-1.5 mb-3 flex items-center justify-center shadow-lg">
              <img :src="b.logo_url" :alt="b.name" class="max-w-full max-h-full object-contain" />
            </div>
            <h3 class="text-white font-extrabold text-2xl sm:text-3xl tracking-tight">{{ b.name }}</h3>
            <p class="text-white/70 text-sm font-medium mt-1 inline-flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
              Comprar
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
            </p>
          </div>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup>
const { $customFetch } = useNuxtApp()

// Map a store's slug/name to the matching shop-brand-*.png we generated.
// Falls back to null (which renders the dark plate) for stores we don't
// have a custom image for yet — the layout still looks clean.
const COVER_MAP = {
  'alo yoga':   '/images/shop-brand-alo.png',
  'alo':        '/images/shop-brand-alo.png',
  'lululemon':  '/images/shop-brand-lululemon.png',
  'stanley':    '/images/shop-brand-stanley.png',
  'youngla':    '/images/shop-brand-youngla.png',
}
const coverFor = (s) => COVER_MAP[(s.name || '').trim().toLowerCase()] || null

const { data } = await useAsyncData('shop-landing-brands', async () => {
  const res = await $customFetch('/store/stores').catch(() => null)
  return res?.data ?? []
})

const brandTiles = computed(() =>
  (data.value ?? []).map((s) => ({ ...s, cover: coverFor(s) }))
)
</script>
