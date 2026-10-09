<template>
  <CustomerMapScreen endpoint="/employee/map" :tabs="tabs" current="/app/employee/map" />
</template>

<script setup>
import CustomerMapScreen from '~/components/admin/CustomerMapScreen.vue'

// The warehouse operator's customer map: full screen, its three sections floating over it.
definePageMeta({
  layout: 'empty',
  middleware: ['auth', 'employee'],
})

const tabs = useOperatorTabs()
</script>
