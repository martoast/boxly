<template>
  <!-- The real AI shopping assistant + search, inside the app. Reached from the
       dashboard's "Buscar y cotizar con IA" card. Keeps the app navbar so
       "Panel Principal" returns to the dashboard. Client-only like /search. -->
  <ClientOnly>
    <ShoppingAssistant fullscreen-mobile />
    <template #fallback>
      <div class="h-[60vh] flex items-center justify-center">
        <svg class="w-8 h-8 animate-spin text-primary-500" viewBox="0 0 24 24" fill="none" aria-label="Cargando">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    </template>
  </ClientOnly>
</template>

<script setup>
definePageMeta({
  layout: 'app',
  middleware: ['auth', 'customer', 'complete-profile'],
})
useHead({ title: 'Boxly — Buscar y cotizar' })
</script>
