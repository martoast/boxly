<template>
  <!-- 4-step progress indicator for the /shop/in-person/* flow.
       Yellow accent ring on the active step gives it a "live" / concierge
       feel that distinguishes it from generic checkout steppers. -->
  <div class="flex items-center gap-2 sm:gap-3">
    <template v-for="(label, i) in steps" :key="i">
      <div class="flex items-center gap-2 min-w-0">
        <div
          :class="[
            'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all',
            i + 1 < current ? 'bg-boxly-blue text-white' :
            i + 1 === current ? 'bg-boxly-blue text-white ring-4 ring-boxly-yellow shadow-lg shadow-boxly-yellow/30' :
            'bg-gray-200 text-gray-500'
          ]"
        >
          <svg v-if="i + 1 < current" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
          </svg>
          <span v-else>{{ i + 1 }}</span>
        </div>
        <span
          :class="[
            'text-xs font-semibold hidden sm:block truncate',
            i + 1 === current ? 'text-boxly-blue-700' : 'text-gray-500'
          ]"
        >{{ label }}</span>
      </div>
      <div
        v-if="i < steps.length - 1"
        :class="[
          'flex-1 h-0.5 min-w-[16px] rounded-full transition-colors',
          i + 1 < current ? 'bg-boxly-blue' : 'bg-gray-200'
        ]"
      ></div>
    </template>
  </div>
</template>

<script setup>
defineProps({
  current: { type: Number, required: true },
  steps: { type: Array, required: true },
})
</script>
