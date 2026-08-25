<template>
  <ShoppingTripDetail api-base="/shopping" />
</template>

<script setup>
import ShoppingTripDetail from '~/components/admin/ShoppingTripDetail.vue'

definePageMeta({ layout: 'shopping', middleware: ['auth', 'shopping'] })
</script>
