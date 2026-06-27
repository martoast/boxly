<template>
  <ShoppingAssistant standalone />
</template>

<script setup>
// BOXLY Concierge — fully PUBLIC, standalone page at /search (no app navbar).
// Guests can search; an account is only required to place an order (gated inside
// the chat). The signed-in profile + login/logout live in the sidebar's bottom-
// left (ChatGPT-style), not a top nav — this page is heading toward the landing
// page. `auth-soft` populates `user` when a session exists but never redirects.
// `empty` layout = no chrome. [[id]] keeps deep-links from remounting the page.
definePageMeta({ layout: 'empty', middleware: ['auth-soft'] })
useHead({ title: 'Boxly — Compra en Estados Unidos' })
</script>
