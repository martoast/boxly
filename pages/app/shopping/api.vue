<template>
  <!-- The shopping team's API page (Alex 2026-10-01): the routes their key can call, generated from the live API.
       Shopping managers create their own keys here; a key reaches the shopping routes only. -->
  <section class="min-h-screen bg-gray-50">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900">{{ t.title }}</h1>
        <p class="text-sm text-gray-500 mt-1">{{ t.subtitle }}</p>
      </div>
      <ApiKeysCard />
      <ApiDocsCard />
    </div>
  </section>
</template>

<script setup>
definePageMeta({ layout: 'shopping', middleware: ['auth', 'shopping'] })
useHead({ title: 'API — Boxly' })

const { t: createTranslations } = useLanguage()
const t = createTranslations({
  title: { es: 'API y documentación', en: 'API & docs' },
  subtitle: { es: 'Conecta tu IA a Boxly: estas son las rutas que puede usar con tu llave.', en: 'Connect your AI to Boxly: these are the routes it can call with your key.' },
})
</script>
