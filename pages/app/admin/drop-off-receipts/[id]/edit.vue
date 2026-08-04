<template>
  <AdminDropOffReceiptEdit />
</template>

<script setup>
import AdminDropOffReceiptEdit from '~/components/admin/AdminDropOffReceiptEdit.vue'

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin'],
})
</script>
