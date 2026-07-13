<template>
  <CampaignStudio />
</template>

<script setup>
import CampaignStudio from '~/components/CampaignStudio.vue'
definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] })
useHead({ title: 'Estudio de campañas — IA' })
</script>
