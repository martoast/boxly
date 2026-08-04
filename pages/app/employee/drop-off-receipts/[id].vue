<template>
  <AdminDropOffReceiptDetail />
</template>

<script setup>
import AdminDropOffReceiptDetail from '~/components/admin/AdminDropOffReceiptDetail.vue'

definePageMeta({
  layout: 'employee',
  middleware: ['auth', 'employee'],
})
</script>
