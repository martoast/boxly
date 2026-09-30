<template>
  <InPersonReservationDetail api-base="/shopping" :id="$route.params.id" />
</template>

<script setup>
import InPersonReservationDetail from '~/components/admin/InPersonReservationDetail.vue'

definePageMeta({ layout: 'shopping', middleware: ['auth', 'shopping'] })
useHead({ title: 'Reserva en persona — Boxly' })
</script>
