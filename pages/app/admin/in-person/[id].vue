<template>
  <InPersonReservationDetail api-base="/admin" :id="$route.params.id" />
</template>

<script setup>
import InPersonReservationDetail from '~/components/admin/InPersonReservationDetail.vue'

definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] })
useHead({ title: 'Reserva en persona — Boxly' })
</script>
