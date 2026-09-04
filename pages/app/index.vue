<template>
  <div class="h-[60vh] flex items-center justify-center">
    <svg class="w-8 h-8 animate-spin text-primary-500" viewBox="0 0 24 24" fill="none" aria-label="Cargando">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  </div>
</template>

<script setup>
// The AI search assistant that used to be the logged-in home is removed. The
// home now opens the live store browser (Tiendas en vivo) — the app's main
// surface — so "Panel Principal" and any /app link land there.
definePageMeta({
  layout: 'app',
  middleware: ['auth', 'customer', 'complete-profile'],
})
onMounted(() => navigateTo('/app/browse', { replace: true }))
</script>
