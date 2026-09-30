<template>
  <InPersonAvailabilityManager api-base="/admin" />
</template>

<script setup>
import InPersonAvailabilityManager from '~/components/admin/InPersonAvailabilityManager.vue'

definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] })
useHead({ title: 'Visitas en persona — Admin' })
</script>
