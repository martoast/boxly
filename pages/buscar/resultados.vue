<template>
  <SearchResults />
</template>

<script setup>
// Dedicated results page. Query lives in the URL (?q=…&store=…&sale=…) and
// results are cached in sessionStorage per query, so a refresh restores them.
// Public: guests can search and see results (the "wow" moment); auth is gated at
// the product page, which is the token-expensive step.
definePageMeta({ layout: 'default' })
useHead({ title: 'Resultados — Boxly' })
</script>
