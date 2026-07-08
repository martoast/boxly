<template>
  <div
    :class="['rounded-2xl border-2 border-dashed transition-colors cursor-pointer text-center px-4 py-6', dragOver ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400 bg-white']"
    @click="pick"
    @dragover.prevent="dragOver = true"
    @dragleave.prevent="dragOver = false"
    @drop.prevent="onDrop"
  >
    <input ref="fileInput" type="file" accept="image/*,application/pdf" class="hidden" @change="onFiles" />
    <div v-if="busy" class="flex flex-col items-center gap-2 text-gray-500">
      <svg class="w-6 h-6 animate-spin text-primary-500" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
      <span class="text-[13px] font-medium">Leyendo tu recibo…</span>
    </div>
    <div v-else class="flex flex-col items-center gap-1.5">
      <span class="grid place-items-center w-11 h-11 rounded-full bg-primary-50 text-primary-500 mb-0.5">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.9A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
      </span>
      <span class="text-[14px] font-bold text-gray-800">Sube tu recibo o confirmación</span>
      <span class="text-[12px] text-gray-400">Foto o captura de tu compra — la leo y te armo el pedido</span>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({ busy: { type: Boolean, default: false } })
const emit = defineEmits(['file'])
const fileInput = ref(null)
const dragOver = ref(false)

function pick() { if (!props.busy) fileInput.value?.click() }
function emitFirst(files) {
  const f = (files || [])[0]
  if (f) emit('file', f)
}
function onFiles(e) { emitFirst(e.target.files); e.target.value = '' }
function onDrop(e) { dragOver.value = false; emitFirst(e.dataTransfer?.files) }
</script>
