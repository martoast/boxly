<template>
  <ShoppingAssistant :fullscreen-mobile="true" />
</template>

<script setup>
// In-app entry — authenticated customers reach the assistant from inside their
// account. Uses the full-screen 'assistant' layout so mobile shows a single
// top bar (the chat header) instead of stacking the site navbar on top.
//
// Optional [[id]] param: /app/assistant is the new-chat view, /app/assistant/<id>
// is a specific conversation. Same component for both (no remount on param
// change), so the live chat survives when a new conversation gets its id and the
// URL updates — and a refresh keeps you in the chat you're reading.
definePageMeta({
  layout: 'assistant',
  middleware: ['auth', 'customer'],
})
useHead({ title: 'Asistente de compras — Boxly' })
</script>
