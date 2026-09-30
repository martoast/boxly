<template><div /></template>

<script setup>
// Legacy Stripe cancel_url (/in-person/review?cancelled=1): /in-person shows the "you were not charged" banner.
const route = useRoute()
await navigateTo({ path: '/in-person', query: route.query }, { replace: true })
</script>
