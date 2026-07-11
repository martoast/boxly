<template>
  <SearchResults />
</template>

<script setup>
// Dedicated results page. Query lives in the URL (?q=…&store=…&sale=…) and
// results are cached in sessionStorage per query, so a refresh restores them.
// NOTE: /buscar/** is redirected to the authed /app/search by a routeRule in
// nuxt.config (this legacy search-first flow is superseded by the concierge), so
// this page no longer renders for guests.
definePageMeta({ layout: 'default' })
useHead({ title: 'Resultados — Boxly' })
</script>
