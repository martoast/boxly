<template>
  <SearchResults />
</template>

<script setup>
// Dedicated results page. Query lives in the URL (?q=…&store=…&sale=…) and
// results are cached in sessionStorage per query, so a refresh restores them.
definePageMeta({ layout: 'default' })
useHead({ title: () => `Resultados — Boxly` })
</script>
