<template>
  <ShoppingAssistant :fullscreen-mobile="true" />
</template>

<script setup>
// In-app entry — authenticated customers reach the assistant from inside their
// account. Uses the full-screen 'assistant' layout so mobile shows a single
// top bar (the chat header) instead of stacking the site navbar on top.
definePageMeta({
  layout: 'assistant',
  middleware: ['auth', 'customer'],
})
useHead({ title: 'Asistente de compras — Boxly' })
</script>
