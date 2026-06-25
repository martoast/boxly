<template>
  <ShoppingAssistant />
</template>

<script setup>
// BOXLY Concierge — authenticated-only, under the standard app layout
// (CustomerNavbar). ONE static layout that never changes, so navigating
// /app/search → /app/search/<id> never remounts the page (that remount was
// wiping the in-flight chat). Public/guest access is a later concern.
definePageMeta({ layout: 'app', middleware: ['auth'] })
useHead({ title: 'Asistente IA — Boxly' })
</script>
