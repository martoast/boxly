<template>
  <!-- The shopping team's API page (Alex 2026-10-01): the routes their key can call, generated from the live API.
       Creating keys is admin-only for now, so a shopping manager asks an admin for one. -->
  <section class="min-h-screen bg-gray-50">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900">{{ t.title }}</h1>
        <p class="text-sm text-gray-500 mt-1">{{ t.subtitle }}</p>
      </div>
      <ApiKeysCard v-if="isAdmin" />
      <p v-else class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{{ t.askAdmin }}</p>
      <ApiDocsCard />
    </div>
  </section>
</template>

<script setup>
definePageMeta({ layout: 'shopping', middleware: ['auth', 'shopping'] })
useHead({ title: 'API — Boxly' })

const user = useState('user')
const isAdmin = computed(() => user.value?.role === 'admin')
const { t: createTranslations } = useLanguage()
const t = createTranslations({
  title: { es: 'API y documentación', en: 'API & docs' },
  subtitle: { es: 'Conecta tu IA a Boxly: estas son las rutas que puede usar con tu llave.', en: 'Connect your AI to Boxly: these are the routes it can call with your key.' },
  askAdmin: { es: 'Para obtener tu llave de API, pídesela a un administrador de Boxly. Con ella, tu IA puede usar todas las rutas de abajo.', en: 'To get your API key, ask a Boxly admin. With it, your AI can call every route below.' },
})
</script>
