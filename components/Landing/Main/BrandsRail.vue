<template>
  <!-- Brands showcase — clickable store cards pulled live from the Boxly
       Store catalog (/store/stores). Each card deep-links into the shop
       filtered to that store. Hides itself if there are no stores. Uses
       a clean letter monogram when a store has no logo_url yet (most do
       today). "Ver todas las tiendas" links to the full brands page. -->
  <section v-if="!loading && stores.length > 0" class="bg-white py-12 sm:py-16 lg:py-20">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
        <p class="text-xs sm:text-sm font-semibold text-primary-600 uppercase tracking-wider mb-2">{{ t.eyebrow }}</p>
        <h2 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight">{{ t.title }}</h2>
        <p class="text-sm sm:text-base text-gray-600 mt-3 leading-relaxed">{{ t.subtitle }}</p>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        <NuxtLink
          v-for="store in stores"
          :key="store.id"
          :to="`/shop?store_id=${store.id}`"
          class="group flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-gray-200/80 hover:border-primary-300 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] p-6"
        >
          <div class="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center overflow-hidden mb-3 group-hover:bg-primary-50 transition-colors">
            <img
              v-if="store.logo_url"
              :src="store.logo_url"
              :alt="store.name"
              loading="lazy"
              class="w-full h-full object-contain p-2"
            >
            <span v-else class="text-2xl font-extrabold text-gray-400 group-hover:text-primary-600 transition-colors">
              {{ store.name.charAt(0).toUpperCase() }}
            </span>
          </div>
          <span class="text-sm font-semibold text-gray-900 truncate w-full">{{ store.name }}</span>
        </NuxtLink>
      </div>

      <div class="mt-7 sm:mt-9 text-center">
        <NuxtLink
          to="/shop/brands"
          class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 hover:border-primary-300 rounded-full text-sm font-semibold text-primary-600 hover:text-primary-700 transition-all shadow-sm hover:shadow-md"
        >
          {{ t.viewAll }}
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const { $customFetch } = useNuxtApp()
const { t: createTranslations } = useLanguage()

const t = createTranslations({
  eyebrow:  { es: 'Marcas que puedes comprar', en: 'Brands you can shop' },
  title:    { es: 'Tus tiendas favoritas de USA', en: 'Your favorite US stores' },
  subtitle: { es: 'Compra de estas marcas y ahorra en el envío a México. ¿No ves la tuya? Igual te la conseguimos.', en: 'Shop these brands and save on shipping to Mexico. Don\'t see yours? We\'ll still get it for you.' },
  viewAll:  { es: 'Ver todas las tiendas', en: 'See all stores' },
})

const stores = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    // limit keeps the landing rail tight; the full set lives on /shop/brands
    const res = await $customFetch('/store/stores', { query: { limit: 12 } })
    stores.value = res?.data ?? []
  } catch (e) {
    console.error('Brands rail load failed', e)
  } finally {
    loading.value = false
  }
})
</script>
