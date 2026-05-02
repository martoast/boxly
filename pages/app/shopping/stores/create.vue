<template>
  <section class="min-h-screen bg-gray-50 py-6">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center gap-3 mb-6">
        <NuxtLink :to="listPath" class="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        </NuxtLink>
        <h1 class="text-2xl font-extrabold text-gray-900">Nueva tienda</h1>
      </div>

      <AdminStoreForm @submit="onSubmit" />
    </div>
  </section>
</template>

<script setup>
import AdminStoreForm from '~/components/admin/AdminStoreForm.vue'

definePageMeta({
  layout: 'shopping',
  middleware: ['auth', 'shopping'],
})

const { $customFetch, $toast } = useNuxtApp()
const route = useRoute()
const router = useRouter()

const apiNs = computed(() => route.path.includes('/shopping/') ? '/shopping' : '/admin')
const listPath = computed(() => route.path.includes('/shopping/') ? '/app/shopping/stores' : '/app/admin/stores')

const onSubmit = async (form) => {
  try {
    const res = await $customFetch(`${apiNs.value}/stores`, { method: 'POST', body: form })
    $toast?.success?.('Tienda creada')
    router.push(`${listPath.value}/${res.data.id}/edit`)
  } catch (e) {
    console.error(e)
    $toast?.error?.(e?.data?.message ?? 'Error al crear tienda')
  }
}
</script>
