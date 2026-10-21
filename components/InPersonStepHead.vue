<template>
  <!-- Numbered step header for the in-person booking flow. -->
  <div class="flex items-start gap-3">
    <span class="grid place-items-center w-8 h-8 rounded-full bg-primary-600 text-white text-[14px] font-bold flex-shrink-0">{{ n }}</span>
    <div class="min-w-0 pt-0.5">
      <h2 class="text-[17px] font-bold text-gray-900 leading-tight">{{ title }} <span v-if="optional" class="font-normal text-gray-500">({{ optional }})</span></h2>
      <p v-if="sub" class="mt-0.5 text-[13.5px] text-gray-500">{{ sub }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  n: { type: Number, required: true },
  title: { type: String, required: true },
  sub: { type: String, default: '' },
  optional: { type: String, default: '' },
})
</script>
