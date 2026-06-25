<template>
  <section class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900">Tarjetas de sugerencia</h1>
          <p class="text-sm text-gray-500 mt-1">Prompts premade que aparecen al abrir el chat de compras</p>
        </div>
        <NuxtLink to="/app/admin/starter-prompts/create" class="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/20 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Crear tarjeta
        </NuxtLink>
      </div>

      <div v-if="loading" class="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">Cargando...</div>
      <div v-else-if="prompts.length === 0" class="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <p class="text-gray-700 font-semibold">Sin tarjetas</p>
        <p class="text-gray-400 text-sm mt-1">Crea tu primera tarjeta de sugerencia.</p>
      </div>
      <div v-else class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr class="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th class="px-4 py-3">Tarjeta</th>
              <th class="px-4 py-3 hidden sm:table-cell">Prompt</th>
              <th class="px-4 py-3">Orden</th>
              <th class="px-4 py-3">Estado</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="p in prompts" :key="p.id" class="hover:bg-gray-50">
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center text-lg text-gray-400">
                    <img v-if="p.image_url" :src="p.image_url" :alt="p.title" class="w-full h-full object-cover" />
                    <span v-else>{{ p.emoji || '🖼️' }}</span>
                  </div>
                  <p class="font-medium text-gray-900">{{ p.title }}</p>
                </div>
              </td>
              <td class="px-4 py-3 text-gray-500 hidden sm:table-cell max-w-xs truncate">{{ p.prompt_text }}</td>
              <td class="px-4 py-3 text-gray-500">{{ p.sort_order }}</td>
              <td class="px-4 py-3">
                <span :class="p.is_active ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-50 text-gray-500 border-gray-100'" class="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border">
                  {{ p.is_active ? 'Activa' : 'Inactiva' }}
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <NuxtLink :to="`/app/admin/starter-prompts/${p.id}/edit`" class="text-primary-600 font-medium hover:text-primary-700 text-sm">Editar</NuxtLink>
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

const prompts = ref([])
const loading = ref(true)

const fetchPrompts = async () => {
  loading.value = true
  try {
    const res = await $customFetch('/admin/starter-prompts', { query: { per_page: 100 } })
    prompts.value = res.data?.data ?? []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(fetchPrompts)
</script>
