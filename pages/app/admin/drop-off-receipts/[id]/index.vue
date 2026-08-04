<template>
  <AdminDropOffReceiptDetail />
</template>

<script setup>
import AdminDropOffReceiptDetail from '~/components/admin/AdminDropOffReceiptDetail.vue'

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin'],
})
</script>
