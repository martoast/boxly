<template>
  <!-- Compact mobile-first card for the in-person store picker.
       Monochrome logo placeholder (no rainbow), clean selected state
       with primary ring + check, generous tap target. -->
  <button
    type="button"
    @click="$emit('click')"
    :class="[
      'relative bg-white rounded-xl border p-3 text-left transition-all flex items-center gap-3',
      selected
        ? 'border-primary-600 ring-2 ring-primary-100'
        : 'border-gray-200 hover:border-primary-300 active:scale-[0.99]',
    ]"
  >
    <div class="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
      <img v-if="store.logo_url" :src="store.logo_url" :alt="store.name" class="w-full h-full object-contain p-1">
      <span v-else class="text-gray-600 font-semibold text-base">{{ store.name.charAt(0).toUpperCase() }}</span>
    </div>
    <div class="font-medium text-gray-900 text-[13px] leading-tight min-w-0 flex-1">
      <span class="line-clamp-2">{{ store.name }}</span>
    </div>
    <div
      v-if="selected"
      class="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary-600 text-white flex items-center justify-center flex-shrink-0"
    >
      <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
    </div>
  </button>
</template>

<script setup>
defineProps({
  store: { type: Object, required: true },
  selected: { type: Boolean, default: false },
})
defineEmits(['click'])
</script>
