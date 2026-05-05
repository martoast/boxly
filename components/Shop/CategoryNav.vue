<template>
  <nav class="sticky top-16 sm:top-20 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-100">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center gap-1 overflow-x-auto py-3 scrollbar-none">
        <NuxtLink
          to="/shop"
          :class="[
            !route.query.category_id && !route.query.store_id && !route.query.view
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400',
            'shrink-0 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-colors whitespace-nowrap',
          ]"
        >
          Inicio
        </NuxtLink>
        <NuxtLink
          to="/shop?view=all"
          :class="[
            route.query.view === 'all' && !route.query.category_id && !route.query.store_id
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400',
            'shrink-0 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-colors whitespace-nowrap',
          ]"
        >
          Todos
        </NuxtLink>
        <span class="shrink-0 mx-1 h-5 w-px bg-gray-200"></span>
        <NuxtLink
          v-for="cat in (categories ?? [])"
          :key="cat.id"
          :to="`/shop?category_id=${cat.id}`"
          :class="[
            String(route.query.category_id) === String(cat.id)
              ? 'bg-primary-500 text-white border-primary-500'
              : 'bg-white text-gray-700 border-gray-200 hover:border-primary-300 hover:text-primary-700',
            'shrink-0 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-colors whitespace-nowrap',
          ]"
        >
          {{ cat.name }}
        </NuxtLink>
      </div>
    </div>
  </nav>
</template>

<script setup>
defineProps({ categories: { type: Array, default: () => [] } })
const route = useRoute()
</script>

<style scoped>
.scrollbar-none::-webkit-scrollbar { display: none; }
.scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
</style>
