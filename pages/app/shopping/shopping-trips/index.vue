<template>
  <ShoppingTripsManager api-base="/shopping" />
</template>

<script setup>
// The same trip calendar the admins see, mounted for the shopping team.
// Velonie is the one who actually runs the Las Américas visits, so this is
// full CRUD, not a read-only view — the /shopping API namespace exposes the
// identical five endpoints behind the shopping gate.
import ShoppingTripsManager from '~/components/admin/ShoppingTripsManager.vue'

definePageMeta({ layout: 'shopping', middleware: ['auth', 'shopping'] })
useHead({ title: 'Visitas en persona — Boxly' })
</script>
