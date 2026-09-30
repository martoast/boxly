<template>
  <ol class="relative border-l-2 border-gray-200 ml-2 space-y-4">
    <li v-for="(e, i) in events" :key="i" class="pl-5 relative">
      <span class="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full ring-4 ring-white"
        :class="i === events.length - 1 ? 'bg-primary-600' : 'bg-gray-300'"></span>
      <p class="text-sm font-semibold text-gray-900">{{ eventLabel(e.type, language) }}</p>
      <p class="text-xs text-gray-500">{{ formatPacific(e.at, language) }} · {{ tz }}</p>
    </li>
  </ol>
</template>

<script setup>
import { computed } from 'vue'
import { eventLabel, formatPacific } from '~/utils/inPersonReservation'

defineProps({ events: { type: Array, default: () => [] } })
const { language } = useLanguage()
const tz = computed(() => (language.value === 'es' ? 'hora de California' : 'California time'))
</script>
