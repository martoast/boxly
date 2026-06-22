<template>
  <SearchResults />
</template>

<script setup>
// Dedicated results page. Query lives in the URL (?q=…&store=…&sale=…) and
// results are cached in sessionStorage per query, so a refresh restores them.
// Auth-gated: a guest is sent to /login?redirect=<this url>, so after signing in
// they land right back on their results (query carried through).
definePageMeta({ layout: 'default', middleware: ['auth'] })
useHead({ title: 'Resultados — Boxly' })
</script>
