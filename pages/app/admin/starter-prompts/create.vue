<template>
  <section class="min-h-screen bg-gray-50 py-6">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center gap-3 mb-6">
        <NuxtLink to="/app/admin/starter-prompts" class="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        </NuxtLink>
        <h1 class="text-2xl font-extrabold text-gray-900">Nueva tarjeta</h1>
      </div>

      <AdminStarterPromptForm @submit="onSubmit" />
    </div>
  </section>
</template>

<script setup>
import AdminStarterPromptForm from '~/components/admin/AdminStarterPromptForm.vue'

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin'],
})

const { $customFetch } = useNuxtApp()
const toast = useToast()
const router = useRouter()

const onSubmit = async (form) => {
  try {
    await $customFetch('/admin/starter-prompts', { method: 'POST', body: form })
    toast.success('Tarjeta creada')
    router.push('/app/admin/starter-prompts')
  } catch (e) {
    console.error(e)
    toast.error(e?.data?.message ?? 'Error al crear tarjeta')
  }
}
</script>
