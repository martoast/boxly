<template>
  <div class="fixed inset-0 z-[100] bg-black text-white flex flex-col select-none" style="padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom)" @pointerdown="audio?.resume?.()">
    <!-- top bar -->
    <div class="flex items-center justify-between px-4 py-3">
      <button type="button" class="p-2 -ml-2 rounded-full bg-white/10" :aria-label="t.close" @click="close">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
      <p class="text-sm font-semibold">{{ capturedCount }} {{ t.scanned }}<span v-if="sending" class="text-white/60"> · {{ sending }} {{ t.sending }}</span></p>
      <button v-if="torchSupported" type="button" class="p-2 -mr-2 rounded-full" :class="torchOn ? 'bg-yellow-400 text-black' : 'bg-white/10'" :aria-label="t.torch" @click="toggleTorch">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
      </button>
      <span v-else class="w-10" />
    </div>

    <!-- camera + guide frame -->
    <div class="relative flex-1 overflow-hidden">
      <video ref="video" class="absolute inset-0 w-full h-full object-cover" playsinline muted autoplay />
      <div class="absolute inset-6 rounded-3xl border-4 transition-colors duration-150" :class="frameClass" />
      <div v-if="flash" class="absolute inset-0 bg-green-400/40 pointer-events-none" />
      <div class="absolute top-4 inset-x-0 flex justify-center px-6">
        <span class="px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-sm" :class="pillClass">{{ statusText }}</span>
      </div>
      <p v-if="error" class="absolute inset-x-6 top-1/3 text-center text-base bg-black/70 rounded-2xl p-4">{{ error }}</p>
    </div>

    <!-- recent results + manual shutter -->
    <div class="px-4 pt-3 pb-4 space-y-3">
      <ul class="space-y-1 min-h-[4.5rem]">
        <li v-for="item in recent" :key="item.id" class="flex items-center gap-2 text-sm">
          <span v-if="item.status === 'done' && !item.result?.needs_check" class="text-green-400">✓</span>
          <span v-else-if="item.status === 'done' || item.status === 'failed'" class="text-amber-400">!</span>
          <span v-else class="inline-block w-3 h-3 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
          <span class="truncate">{{ item.result?.name || item.name }}</span>
          <span class="ml-auto font-mono text-xs text-white/50 shrink-0">{{ item.result?.tracking || '' }}</span>
        </li>
      </ul>
      <div class="flex items-center justify-center gap-6">
        <button type="button" class="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center active:scale-95" :aria-label="t.shutter" @click="capture(true)">
          <span class="w-12 h-12 rounded-full bg-white" />
        </button>
      </div>
      <p class="text-center text-xs text-white/50">{{ t.hint }}</p>
    </div>

    <!-- iOS haptic: Safari has no vibrate(); toggling an iOS 18 switch input fires the system haptic -->
    <label ref="haptic" class="absolute w-px h-px overflow-hidden opacity-0 pointer-events-none" aria-hidden="true"><input type="checkbox" switch tabindex="-1"></label>
  </div>
</template>

<script setup>
import { decodeFrame, captureFrame } from '~/utils/labelPhoto'
import { trackingsFrom } from '~/utils/labelTracking'

/**
 * Live label scanner: the rear camera reads barcodes several times a second; once the same tracking
 * number is read on consecutive frames the label is sharp and in frame, so the full-resolution frame
 * is captured on its own (green flash + haptic + beep) and handed to the parent, which reads the name
 * and saves it in the background while the next box is aimed at.
 */
const props = defineProps({
  items: { type: Array, default: () => [] }, // the parent's queue: shows the last few results coming back
  known: { type: Object, default: () => new Set() }, // tracking numbers already saved: not captured again
  english: { type: Boolean, default: false },
})
const emit = defineEmits(['capture', 'close'])

const t = computed(() => (props.english
  ? { close: 'Close', scanned: 'scanned', sending: 'sending', torch: 'Flashlight', shutter: 'Take photo', searching: 'Point at the label barcode', steady: 'Hold steady…', captured: 'Got it ✓', duplicate: 'Already scanned', hint: 'Captures by itself when the barcode reads. Tap the button for a label without one.', noCamera: 'Camera not available. Allow camera access for this site and try again.' }
  : { close: 'Cerrar', scanned: 'escaneadas', sending: 'enviando', torch: 'Linterna', shutter: 'Tomar foto', searching: 'Apunta al código de barras de la etiqueta', steady: 'No te muevas…', captured: '¡Listo! ✓', duplicate: 'Ya escaneada', hint: 'Captura sola cuando lee el código. Usa el botón si la etiqueta no tiene código.', noCamera: 'No hay acceso a la cámara. Permite la cámara para este sitio e intenta de nuevo.' }))

const video = ref(null)
const haptic = ref(null)
const status = ref('searching') // searching | steady | captured | duplicate
const flash = ref(false)
const error = ref('')
const torchSupported = ref(false)
const torchOn = ref(false)
const capturedCount = ref(0)

const recent = computed(() => props.items.slice(-4).reverse())
const sending = computed(() => props.items.filter((i) => i.status === 'waiting' || i.status === 'working').length)
const statusText = computed(() => t.value[status.value])
const frameClass = computed(() => ({ searching: 'border-white/70', steady: 'border-yellow-400', captured: 'border-green-400', duplicate: 'border-sky-400' }[status.value]))
const pillClass = computed(() => ({ searching: 'bg-black/60', steady: 'bg-yellow-400 text-black', captured: 'bg-green-500', duplicate: 'bg-sky-500' }[status.value]))

let stream = null
let running = false
let wakeLock = null
let audio = null // AudioContext; resumed on any tap inside (iOS starts it suspended)
const work = document.createElement('canvas')
const scanned = new Set() // this session's captures
let streakKey = ''
let streak = 0
let capturing = false

// Needs this many consecutive frames with the same tracking number. A USPS-only read waits longer:
// UPS SurePost labels also carry a UPS number, which the closer capture pass usually finds.
const STEADY_FRAMES = 2
const USPS_ONLY_FRAMES = 4

function feedback() {
  flash.value = true
  setTimeout(() => { flash.value = false }, 250)
  try { navigator.vibrate?.(80) } catch {}
  try { haptic.value?.click() } catch {}
  try {
    if (audio) {
      const o = audio.createOscillator()
      const g = audio.createGain()
      o.frequency.value = 1200
      g.gain.setValueAtTime(0.15, audio.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.12)
      o.connect(g).connect(audio.destination)
      o.start()
      o.stop(audio.currentTime + 0.13)
    }
  } catch {}
}

async function capture(manual = false) {
  if (capturing || !video.value?.videoWidth) return
  capturing = true
  try {
    const shot = await captureFrame(video.value)
    const codes = trackingsFrom(shot.barcodes)
    const main = codes.find((c) => c.carrier === 'ups') || codes[0]
    if (main) scanned.add(main.tracking)
    capturedCount.value++
    status.value = 'captured'
    feedback()
    emit('capture', { ...shot, label: main ? `${main.carrier.toUpperCase()} ${main.tracking}` : (manual ? '📷' : '') })
  } finally {
    capturing = false
  }
}

async function tick() {
  if (!running) return
  const v = video.value
  if (v && v.readyState >= 2 && v.videoWidth && !capturing) {
    // 1280 px is plenty for a label filling the frame and keeps each pass short on a phone
    const s = Math.min(1, 1280 / Math.max(v.videoWidth, v.videoHeight))
    work.width = Math.round(v.videoWidth * s)
    work.height = Math.round(v.videoHeight * s)
    const ctx = work.getContext('2d', { willReadFrequently: true })
    ctx.drawImage(v, 0, 0, work.width, work.height)
    let codes = []
    try { codes = trackingsFrom(await decodeFrame(ctx.getImageData(0, 0, work.width, work.height))) } catch {}
    const main = codes.find((c) => c.carrier !== 'usps') || codes[0]
    if (!main) {
      streak = 0
      streakKey = ''
      if (status.value !== 'captured') status.value = 'searching'
    } else if (scanned.has(main.tracking) || props.known.has(main.tracking) || codes.some((c) => scanned.has(c.tracking) || props.known.has(c.tracking))) {
      streak = 0
      status.value = status.value === 'captured' && scanned.has(main.tracking) ? 'captured' : 'duplicate'
    } else {
      streak = main.tracking === streakKey ? streak + 1 : 1
      streakKey = main.tracking
      status.value = 'steady'
      if (streak >= (main.carrier === 'usps' ? USPS_ONLY_FRAMES : STEADY_FRAMES)) {
        streak = 0
        await capture()
      }
    }
  }
  setTimeout(tick, 80)
}

async function start() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 3840 }, height: { ideal: 2160 } },
    })
    video.value.srcObject = stream
    await video.value.play()
    const track = stream.getVideoTracks()[0]
    torchSupported.value = !!track.getCapabilities?.().torch
    try { wakeLock = await navigator.wakeLock?.request('screen') } catch {}
    running = true
    tick()
  } catch (e) {
    console.error('[scanner]', e)
    error.value = t.value.noCamera
  }
}

async function toggleTorch() {
  const track = stream?.getVideoTracks()[0]
  if (!track) return
  try {
    await track.applyConstraints({ advanced: [{ torch: !torchOn.value }] })
    torchOn.value = !torchOn.value
  } catch {}
}

function stop() {
  running = false
  stream?.getTracks().forEach((tr) => tr.stop())
  stream = null
  try { wakeLock?.release() } catch {}
  wakeLock = null
  try { audio?.close() } catch {}
  audio = null
}

function close() {
  stop()
  emit('close')
}

onMounted(() => {
  // opened by a tap, so sound may start now (iOS only allows audio after a user gesture)
  try { audio = new (window.AudioContext || window.webkitAudioContext)() } catch {}
  start()
})
onBeforeUnmount(stop)
</script>
