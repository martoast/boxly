<template>
  <ShoppingAssistant />
</template>

<script setup>
// In-app entry — authenticated customers reach the assistant from inside their
// account (app shell + customer navbar), with their chat history sidebar.
definePageMeta({
  layout: 'app',
  middleware: ['auth', 'customer'],
})
useHead({ title: 'Asistente de compras — Boxly' })
</script>
