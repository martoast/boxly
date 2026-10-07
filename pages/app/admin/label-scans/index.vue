<template>
  <AdminLabelScans />
</template>

<script setup>
import AdminLabelScans from '~/components/admin/AdminLabelScans.vue'

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin'],
})
</script>
