<template>
  <SearchLanding />
</template>

<script setup>
// In-app entry — the Google-style centered search landing. Submitting navigates
// to the dedicated /buscar results page (its own URL, refresh-safe).
definePageMeta({
  layout: 'assistant',
  middleware: ['auth', 'customer'],
})
useHead({ title: 'Comprar de USA — Boxly' })
</script>
