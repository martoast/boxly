<template>
  <InPersonAvailabilityManager api-base="/shopping" />
</template>

<script setup>
import InPersonAvailabilityManager from '~/components/admin/InPersonAvailabilityManager.vue'

definePageMeta({ layout: 'shopping', middleware: ['auth', 'shopping'] })
useHead({ title: 'Visitas en persona — Boxly' })
</script>
