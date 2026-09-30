<template><div /></template>

<script setup>
// Legacy Stripe cancel_url (/in-person/review?cancelled=1): /in-person shows the legacy "still waiting for the deposit" banner.
const route = useRoute()
await navigateTo({ path: '/in-person', query: { ...route.query, legacy: '1' } }, { replace: true })
</script>
