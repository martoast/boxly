<template>
  <AiSearchDashboard api-base="/admin" />
</template>

<script setup>
import AiSearchDashboard from '~/components/admin/AiSearchDashboard.vue'

definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] })
useHead({ title: 'Asistente IA — Admin' })
</script>
