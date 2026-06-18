<template>
  <div>
    <label class="block text-xs font-semibold text-gray-500 uppercase mb-1.5">{{ label }}</label>
    <div class="flex flex-wrap gap-1.5 mb-2" v-if="modelValue.length">
      <span v-for="(tag, i) in modelValue" :key="tag + i" :class="['inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium', toneClass]">
        {{ tag }}
        <button @click="remove(i)" class="hover:opacity-70" :aria-label="`${addLabel} ${tag}`">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </span>
    </div>
    <div class="flex items-center gap-2">
      <input
        v-model="draft"
        :placeholder="placeholder"
        @keydown.enter.prevent="add"
        @keydown="onComma"
        class="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
      <button @click="add" class="shrink-0 px-3 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-semibold">{{ addLabel }}</button>
    </div>
  </div>
</template>

<script setup>
// Lightweight chip/tag editor. v-model is a flat array of strings. Add via
// Enter, comma, or the button; remove via the × on each chip. De-dupes
// case-insensitively.
const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  addLabel: { type: String, default: 'Add' },
  tone: { type: String, default: 'gray' }, // gray | primary | red
})
const emit = defineEmits(['update:modelValue'])

const draft = ref('')
const toneClass = computed(() => ({
  primary: 'bg-primary-50 text-primary-700',
  red: 'bg-red-50 text-red-600',
  gray: 'bg-gray-100 text-gray-700',
}[props.tone] || 'bg-gray-100 text-gray-700'))

function add() {
  const v = draft.value.trim().replace(/,$/, '').trim()
  draft.value = ''
  if (!v) return
  if (props.modelValue.some((t) => t.toLowerCase() === v.toLowerCase())) return
  emit('update:modelValue', [...props.modelValue, v])
}
function onComma(e) { if (e.key === ',') { e.preventDefault(); add() } }
function remove(i) { emit('update:modelValue', props.modelValue.filter((_, idx) => idx !== i)) }
</script>
