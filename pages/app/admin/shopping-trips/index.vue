<template>
  <ShoppingTripsManager api-base="/admin" />
</template>

<script setup>
import ShoppingTripsManager from '~/components/admin/ShoppingTripsManager.vue'

definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] })
useHead({ title: 'Visitas en persona — Admin' })
</script>
