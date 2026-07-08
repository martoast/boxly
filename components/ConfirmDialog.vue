<template>
  <div class="rounded-2xl border border-gray-200 bg-white p-4 max-w-sm shadow-lg ring-1 ring-black/5">
    <p class="text-[14px] font-bold text-gray-900">{{ title }}</p>
    <p v-if="message" class="text-[12.5px] text-gray-500 mt-1">{{ message }}</p>
    <p v-if="error" class="text-[12px] text-red-600 mt-2">{{ error }}</p>
    <div class="flex items-center gap-2 mt-3">
      <button type="button" @click="$emit('cancel')" :disabled="loading" class="flex-1 px-3 py-2.5 text-gray-600 hover:bg-gray-100 text-[13px] font-semibold rounded-xl transition">{{ cancelLabel }}</button>
      <button type="button" @click="$emit('confirm')" :disabled="loading" :class="['flex-1 px-4 py-2.5 text-white text-[13px] font-bold rounded-xl transition-all active:scale-[.98] disabled:opacity-60', danger ? 'bg-red-500 hover:bg-red-600' : 'bg-primary-500 hover:bg-primary-600']">
        {{ loading ? 'Procesando…' : confirmLabel }}
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, default: '¿Confirmar?' },
  message: { type: String, default: '' },
  confirmLabel: { type: String, default: 'Confirmar' },
  cancelLabel: { type: String, default: 'Cancelar' },
  danger: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
})
defineEmits(['confirm', 'cancel'])
</script>
