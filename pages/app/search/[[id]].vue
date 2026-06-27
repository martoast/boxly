<template>
  <ShoppingAssistant />
</template>

<script setup>
// BOXLY Concierge — PUBLIC page (guests can search; an account is required only
// to place an order, gated inside the chat). `auth-soft` populates `user` when a
// session exists but never redirects guests to /login. Under the standard app
// layout (CustomerNavbar, guest-tolerant). ONE static layout that never changes,
// so /app/search → /app/search/<id> never remounts (that remount wiped the chat).
definePageMeta({ layout: 'app', middleware: ['auth-soft'] })
useHead({ title: 'Asistente IA — Boxly' })
</script>
