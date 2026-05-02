<template>
  <section class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900">Categorías</h1>
          <p class="text-sm text-gray-500 mt-1">Organiza el catálogo (un producto puede estar en varias).</p>
        </div>
        <NuxtLink :to="createPath" class="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/20 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Crear categoría
        </NuxtLink>
      </div>

      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
        <input v-model="search" placeholder="Buscar por nombre..." class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
      </div>

      <div v-if="loading" class="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">Cargando...</div>
      <div v-else-if="categories.length === 0" class="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <p class="text-gray-700 font-semibold">Sin categorías</p>
        <p class="text-gray-400 text-sm mt-1">Crea la primera categoría para empezar.</p>
      </div>
      <div v-else class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr class="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th class="px-4 py-3">Categoría</th>
              <th class="px-4 py-3">Slug</th>
              <th class="px-4 py-3 text-right">Productos</th>
              <th class="px-4 py-3">Estado</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="c in categories" :key="c.id" class="hover:bg-gray-50">
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center text-xs text-gray-400">
                    <img v-if="c.image_url" :src="c.image_url" :alt="c.name" class="w-full h-full object-cover" />
                    <span v-else>{{ c.name.charAt(0) }}</span>
                  </div>
                  <div>
                    <p class="font-medium text-gray-900">{{ c.name }}</p>
                    <p v-if="c.description" class="text-xs text-gray-400 line-clamp-1">{{ c.description }}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3 text-gray-500 font-mono text-xs">{{ c.slug }}</td>
              <td class="px-4 py-3 text-right text-gray-700">{{ c.products_count ?? 0 }}</td>
              <td class="px-4 py-3">
                <span :class="c.is_active ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-50 text-gray-500 border-gray-100'" class="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border">
                  {{ c.is_active ? 'Activa' : 'Inactiva' }}
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <NuxtLink :to="`${editBasePath}/${c.id}/edit`" class="text-primary-600 font-medium hover:text-primary-700 text-sm">Editar</NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<script setup>
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin'],
})

const { $customFetch } = useNuxtApp()
const route = useRoute()

const apiNs = computed(() => route.path.includes('/shopping/') ? '/shopping' : '/admin')
const editBasePath = computed(() => route.path.includes('/shopping/') ? '/app/shopping/categories' : '/app/admin/categories')
const createPath = computed(() => `${editBasePath.value}/create`)

const categories = ref([])
const loading = ref(true)
const search = ref('')
let searchTimer = null

const fetchCategories = async () => {
  loading.value = true
  try {
    const res = await $customFetch(`${apiNs.value}/categories`, {
      query: { search: search.value || undefined, per_page: 100 },
    })
    categories.value = res.data?.data ?? []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(fetchCategories, 300)
})

onMounted(fetchCategories)
</script>
