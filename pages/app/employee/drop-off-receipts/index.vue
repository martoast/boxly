<template>
  <AdminDropOffReceiptList />
</template>

<script setup>
import AdminDropOffReceiptList from '~/components/admin/AdminDropOffReceiptList.vue'

definePageMeta({
  layout: 'employee',
  middleware: ['auth', 'employee'],
})
</script>
