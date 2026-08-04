<template>
  <AdminDropOffReceiptEdit />
</template>

<script setup>
import AdminDropOffReceiptEdit from '~/components/admin/AdminDropOffReceiptEdit.vue'

definePageMeta({
  layout: 'employee',
  middleware: ['auth', 'employee'],
})
</script>
