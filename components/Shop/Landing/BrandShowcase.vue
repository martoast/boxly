<template>
  <section v-if="brandTiles.length > 0" id="brands" class="bg-white py-16 lg:py-24">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-end justify-between mb-6">
        <h2 class="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Marcas</h2>
        <NuxtLink
          to="/shop/brands"
          class="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
        >
          Ver todas
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
        </NuxtLink>
      </div>

      <div :class="['grid gap-x-4 gap-y-6', gridColsClass]">
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

      <!-- Mobile-only "Ver todas" link below the grid (the header link
           is hidden on small screens to keep the heading row tight). -->
      <div class="mt-6 sm:hidden">
        <NuxtLink
          to="/shop/brands"
          class="inline-flex items-center gap-1 text-sm font-semibold text-gray-700"
        >
          Ver todas las marcas
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
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

// Server-side fetch of just the landing-curated brands (capped at 5
// — admin toggles `show_on_landing` per store via the edit form). The
// /shop/brands page is what users hit via "Ver todas" for the full
// list, so no need to over-fetch here.
const { data } = await useAsyncData('shop-landing-brands', async () => {
  const res = await $customFetch('/store/stores', {
    query: { on_landing: 1, limit: 5 },
  }).catch(() => null)
  return res?.data ?? []
})

const brandTiles = computed(() =>
  (data.value ?? []).map((s) => ({ ...s, cover: coverFor(s) }))
)

// Adapt the desktop column count to however many brands are actually
// flagged for the landing — 4 brands → 4 columns, not 5 with a hole.
// Tailwind needs full class strings to land in the build, so we use a
// static map (don't generate `lg:grid-cols-${n}` dynamically).
const gridColsClass = computed(() => {
  const n = brandTiles.value.length
  if (n <= 1) return 'grid-cols-1'
  if (n === 2) return 'grid-cols-2'
  if (n === 3) return 'grid-cols-2 sm:grid-cols-3'
  if (n === 4) return 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4'
  return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
})
</script>
