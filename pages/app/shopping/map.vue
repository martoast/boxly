<template>
  <CustomerMapScreen endpoint="/shopping/map" back-to="/app/shopping/dashboard" />
</template>

<script setup>
import CustomerMapScreen from '~/components/admin/CustomerMapScreen.vue'

// The shopping manager's customer map — the same one the warehouse operator has (Alex, 2026-10-08):
// full screen, counts only, a back button to her dashboard.
definePageMeta({
  layout: 'empty',
  middleware: ['auth', 'shopping'],
})
</script>
