<template>
  <div>
    <!-- attached file thumbnails (images) + PDF chips -->
    <div v-if="previews.length" class="flex flex-wrap gap-2 mb-2 px-1">
      <div v-for="(p, i) in previews" :key="p.key" class="relative group">
        <img v-if="!p.isPdf" :src="p.url" class="w-16 h-16 rounded-xl object-cover border border-gray-200" />
        <!-- PDF: a compact file card with its name -->
        <div v-else class="w-40 h-16 rounded-xl border border-gray-200 bg-gray-50 flex items-center gap-2 px-2.5">
          <span class="shrink-0 grid place-items-center w-9 h-9 rounded-lg bg-red-50 text-red-500">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M14 3v5h5"/></svg>
          </span>
          <span class="min-w-0">
            <span class="block text-[11px] font-semibold text-gray-700 truncate">{{ p.name }}</span>
            <span class="block text-[10px] font-medium uppercase tracking-wide text-gray-400">PDF</span>
          </span>
        </div>
        <button type="button" @click="removeAt(i)" class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-900/80 text-white grid place-items-center text-xs hover:bg-gray-900" aria-label="Quitar">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
    </div>

    <!-- composer pill -->
    <div
      :class="['flex items-center gap-1 bg-white border rounded-[1.7rem] shadow-sm transition-all', large ? 'pl-2.5 pr-2.5 py-3' : 'pl-2 pr-2 py-2', dragOver ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-200 focus-within:border-primary-400 focus-within:shadow-md']"
      @dragover.prevent="dragOver = true"
      @dragleave.prevent="dragOver = false"
      @drop.prevent="onDrop"
    >
      <!-- take photo (camera) — hidden while recording/transcribing -->
      <button v-if="!micRecording && !micTranscribing" type="button" @click="shoot" class="shrink-0 grid place-items-center w-9 h-9 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 active:scale-90 transition-all" aria-label="Tomar foto">
        <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
      </button>
      <!-- attach image or PDF from library (hidden while recording/transcribing) -->
      <button v-if="!micRecording && !micTranscribing" type="button" @click="pick" class="shrink-0 grid place-items-center w-9 h-9 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 active:scale-90 transition-all" aria-label="Subir foto o PDF">
        <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
      </button>
      <input ref="fileInput" type="file" accept="image/*,application/pdf" multiple class="hidden" @change="onFiles" />
      <!-- capture="environment" opens the rear camera directly on mobile -->
      <input ref="cameraInput" type="file" accept="image/*" capture="environment" class="hidden" @change="onFiles" />

      <!-- RECORDING: live waveform -->
      <div v-if="micRecording" class="flex-1 flex items-center gap-2 pl-1 h-9">
        <span class="shrink-0 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <div class="flex-1 flex items-center justify-start gap-[3px] h-full overflow-hidden">
          <span v-for="(lvl, i) in (micLevels || [])" :key="i" class="w-[3px] rounded-full bg-red-400/90" :style="{ height: barHeight(lvl) }" />
        </div>
        <span class="shrink-0 text-[11px] font-medium text-gray-400 pr-1">Toca para detener</span>
      </div>

      <!-- TRANSCRIBING -->
      <div v-else-if="micTranscribing" class="flex-1 flex items-center gap-2 pl-2 h-9 text-sm text-gray-500">
        <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
        Transcribiendo…
      </div>

      <!-- NORMAL: text input -->
      <textarea
        v-else
        ref="ta"
        :value="text"
        @input="$emit('update:text', $event.target.value)"
        @keydown.enter.exact.prevent="doSend"
        @paste="onPaste"
        rows="1"
        :placeholder="placeholder"
        style="field-sizing:content"
        :class="['flex-1 resize-none border-0 bg-transparent px-1.5 py-1 text-gray-900 placeholder:text-gray-400 placeholder:whitespace-nowrap placeholder:overflow-hidden placeholder:text-ellipsis focus:outline-none focus:ring-0 max-h-40', large ? 'text-[18px] leading-8' : 'text-[16px] leading-6']"
      ></textarea>

      <!-- mic / stop -->
      <button type="button" @click="$emit('mic')" :disabled="micTranscribing" :class="micBtnClass" :aria-label="micRecording ? 'Detener' : 'Hablar'">
        <span v-if="micRecording" class="absolute inset-0 rounded-full bg-red-500/40 animate-ping" />
        <svg v-if="micTranscribing" class="w-4 h-4 animate-spin relative" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
        <!-- stop icon while recording, mic icon otherwise -->
        <svg v-else-if="micRecording" class="w-[16px] h-[16px] relative" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2.5"/></svg>
        <svg v-else class="w-[18px] h-[18px] relative" viewBox="0 0 24 24" fill="currentColor"><path d="M12 15a3 3 0 003-3V6a3 3 0 10-6 0v6a3 3 0 003 3z"/><path d="M6.75 10.5a.75.75 0 011.5 0 3.75 3.75 0 007.5 0 .75.75 0 011.5 0 5.25 5.25 0 01-4.5 5.2V18a.75.75 0 01-1.5 0v-2.3a5.25 5.25 0 01-4.5-5.2z"/></svg>
      </button>

      <!-- send (hidden while recording/transcribing) -->
      <button v-if="!micRecording && !micTranscribing" type="button" @click="doSend" :disabled="!canSend" class="shrink-0 grid place-items-center w-9 h-9 rounded-full bg-primary-500 text-white hover:bg-primary-600 active:scale-90 disabled:bg-gray-200 disabled:text-gray-400 disabled:active:scale-100 transition-all" aria-label="Enviar">
        <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.3" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
      </button>
    </div>

    <p v-if="micError" class="text-xs text-red-500 mt-1.5 px-3">{{ micError }}</p>
  </div>
</template>

<script setup>
const props = defineProps({
  text: { type: String, default: '' },
  micRecording: { type: Boolean, default: false },
  micTranscribing: { type: Boolean, default: false },
  micLevels: { type: Array, default: () => [] },
  micError: { type: String, default: null },
  busy: { type: Boolean, default: false },
  placeholder: { type: String, default: 'Describe lo que buscas o pega un link…' },
  large: { type: Boolean, default: false },
})
const emit = defineEmits(['update:text', 'send', 'mic'])

// Let the parent focus the input (e.g. after tapping a suggestion card).
const ta = ref(null)
defineExpose({ focus: () => ta.value?.focus() })

// Map a 0..1 audio level to a bar height (px) for the recording waveform.
function barHeight(lvl) {
  const v = Math.max(0, Math.min(1, Number(lvl) || 0))
  return `${Math.round(4 + v * 26)}px`
}

const fileInput = ref(null)
const cameraInput = ref(null)
const attachments = ref([]) // File[]
const dragOver = ref(false)

// Images render as thumbnails; PDFs render as a named file chip (no object URL).
const previews = computed(() => attachments.value.map((f, i) => {
  const isPdf = f.type === 'application/pdf'
  return { key: `${i}-${f.name}`, isPdf, name: f.name, url: isPdf ? null : URL.createObjectURL(f) }
}))

const canSend = computed(() => !props.busy && (props.text.trim().length > 0 || attachments.value.length > 0))

const micBtnClass = computed(() => [
  'relative shrink-0 grid place-items-center w-9 h-9 rounded-full transition-colors',
  props.micRecording ? 'bg-red-500 text-white' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 active:scale-90',
])

function pick() { fileInput.value?.click() }
function shoot() { cameraInput.value?.click() }

// Accept images AND PDFs (e.g. a receipt/invoice the customer got from the store).
function isAllowed(f) { return !!f && (f.type.startsWith('image/') || f.type === 'application/pdf') }
function addFiles(files) {
  for (const f of files) {
    if (isAllowed(f)) attachments.value.push(f)
  }
}
function onFiles(e) { addFiles(e.target.files || []); e.target.value = '' }
function onDrop(e) { dragOver.value = false; addFiles(e.dataTransfer?.files || []) }
function onPaste(e) {
  const items = e.clipboardData?.items || []
  const files = []
  for (const it of items) { if (it.type?.startsWith('image/') || it.type === 'application/pdf') { const f = it.getAsFile(); if (f) files.push(f) } }
  if (files.length) { e.preventDefault(); addFiles(files) }
}
function removeAt(i) { attachments.value.splice(i, 1) }

function buildFileList() {
  if (!attachments.value.length) return null
  const dt = new DataTransfer()
  attachments.value.forEach((f) => dt.items.add(f))
  return dt.files
}

function doSend() {
  if (!canSend.value) return
  const files = buildFileList()
  emit('send', { files })
  attachments.value = []
}
</script>
