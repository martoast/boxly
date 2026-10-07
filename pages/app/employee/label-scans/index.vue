<template>
  <AdminLabelScans />
</template>

<script setup>
import AdminLabelScans from '~/components/admin/AdminLabelScans.vue'

definePageMeta({
  layout: 'employee',
  middleware: ['auth', 'employee'],
})
</script>
