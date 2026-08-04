<template>
  <AdminDropOffReceiptList />
</template>

<script setup>
import AdminDropOffReceiptList from '~/components/admin/AdminDropOffReceiptList.vue'

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin'],
})
</script>
