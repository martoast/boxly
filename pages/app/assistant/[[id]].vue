<template>
  <SmartSearch />
</template>

<script setup>
// In-app entry to Boxly's U.S. shopping & import search. Search-first (no chat):
// search → results gallery → product page → add to cart → one Purchase Request.
definePageMeta({
  layout: 'assistant',
  middleware: ['auth', 'customer'],
})
useHead({ title: 'Comprar de USA — Boxly' })
</script>
