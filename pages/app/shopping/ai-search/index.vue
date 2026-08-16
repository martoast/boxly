<template>
  <AiSearchDashboard api-base="/shopping" />
</template>

<script setup>
// Same dashboard the admins see, mounted for the shopping team so Velonie can
// read what customers are asking the concierge for. Read-only — the /shopping
// API namespace exposes only the four GET endpoints this page calls.
import AiSearchDashboard from '~/components/admin/AiSearchDashboard.vue'

definePageMeta({ layout: 'shopping', middleware: ['auth', 'shopping'] })
useHead({ title: 'Asistente IA — Boxly' })
</script>
