<template>
  <PurchasedProductsList base-path="/app/admin/purchased-products" />
</template>

<script setup>
import PurchasedProductsList from '~/components/admin/PurchasedProductsList.vue'

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin'],
})
</script>
