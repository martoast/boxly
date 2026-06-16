<template>
  <ShoppingAssistant />
</template>

<script setup>
// Public entry — usable without an account. Guests can chat, discover, and
// create their account inline; if they're already signed in, they get their
// history sidebar too (same component).
definePageMeta({ layout: 'default' })
useHead({ title: 'Asistente de compras — Boxly' })
</script>
