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
      <video ref="video" class="absolute inset-0 w-full h-full object-cover" playsinline muted autoplay @click="focusAt" />
      <div v-if="ring" class="absolute w-20 h-20 -ml-10 -mt-10 rounded-xl border-2 border-yellow-300 pointer-events-none animate-ping" :style="{ left: `${ring.x}px`, top: `${ring.y}px` }" />
      <div class="absolute inset-6 rounded-3xl border-4 transition-colors duration-150 pointer-events-none" :class="frameClass" />
      <div v-if="flash" class="absolute inset-0 bg-green-400/40 pointer-events-none" />
      <div class="absolute top-4 inset-x-0 flex justify-center px-6 pointer-events-none">
        <span class="px-4 py-2 rounded-2xl text-sm font-semibold text-center backdrop-blur-sm" :class="pillClass">{{ statusText }}</span>
      </div>
      <p v-if="error" class="absolute inset-x-6 top-1/3 text-center text-base bg-black/70 rounded-2xl p-4">{{ error }}</p>
    </div>

    <!-- recent results + manual shutter -->
    <div class="px-4 pt-3 pb-4 space-y-3">
      <ul class="space-y-1 min-h-[4.5rem]">
        <li v-for="item in recent" :key="item.id" class="flex items-center gap-2 text-sm">
          <span v-if="item.status === 'done' && !item.result?.needs_check" class="text-green-400">✓</span>
          <span v-else-if="item.status === 'retake'" class="text-red-400">↻</span>
          <span v-else-if="item.status === 'duplicate'" class="text-sky-400">=</span>
          <span v-else-if="item.status === 'done' || item.status === 'failed'" class="text-amber-400">!</span>
          <span v-else class="inline-block w-3 h-3 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
          <span class="truncate">{{ item.status === 'retake' ? t.retakeShort : item.result?.name || item.name }}</span>
          <span class="ml-auto font-mono text-xs text-white/50 shrink-0">{{ item.result?.tracking || '' }}</span>
        </li>
      </ul>
      <div class="flex items-center justify-center gap-6">
        <button type="button" class="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center active:scale-95" :aria-label="t.shutter" @click="capture">
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
import { captureFrame } from '~/utils/labelPhoto'
import { trackingsFrom } from '~/utils/labelTracking'

/**
 * Label camera: Mau taps the label on screen to focus, then presses the shutter. No barcode
 * auto-capture (Alex, 2026-10-07: the AI reads the name and the PRINTED tracking number — the
 * barcode doesn't matter). The full-resolution frame goes to the parent, which reads and saves
 * it in the background while the next box is aimed at.
 *
 * The AI also judges each photo; when it was tilted / blurry / too far AND the read came back
 * incomplete, the parent doesn't save it and marks the item 'retake' — shown here as a red
 * prompt with a double buzz so Mau shoots that label again right away.
 */
const props = defineProps({
  items: { type: Array, default: () => [] }, // the parent's queue: shows the last few results coming back
  english: { type: Boolean, default: false },
})
const emit = defineEmits(['capture', 'close'])

const t = computed(() => (props.english
  ? {
      close: 'Close', scanned: 'scanned', sending: 'sending', torch: 'Flashlight', shutter: 'Take photo',
      aim: 'Tap the label on screen to focus, then take the photo', captured: 'Got it ✓', duplicate: 'Already scanned',
      retakeShort: 'Take it again',
      retake: {
        tilted: 'Photo tilted — hold the phone flat over the label and take another',
        blurry: 'Blurry — tap the label to focus and take another',
        far: 'Too far — get closer to the label and take another',
        glare: 'Glare on the label — tilt it away from the light and take another',
        cut_off: 'Label cut off — fit the whole label in the frame and take another',
        no_label: 'No label seen — take another',
        other: 'Couldn’t read it — take another',
      },
      hint: 'Label flat and filling the frame. Tap it on screen to focus.',
      noCamera: 'Camera not available. Allow camera access for this site and try again.',
    }
  : {
      close: 'Cerrar', scanned: 'escaneadas', sending: 'enviando', torch: 'Linterna', shutter: 'Tomar foto',
      aim: 'Toca la etiqueta en la pantalla para enfocar, luego toma la foto', captured: '¡Listo! ✓', duplicate: 'Ya escaneada',
      retakeShort: 'Toma otra foto',
      retake: {
        tilted: 'Foto inclinada — pon el teléfono de frente a la etiqueta y toma otra',
        blurry: 'Salió borrosa — toca la etiqueta para enfocar y toma otra',
        far: 'Muy lejos — acércate a la etiqueta y toma otra',
        glare: 'Reflejo en la etiqueta — gírala para quitar la luz y toma otra',
        cut_off: 'Etiqueta cortada — que salga completa en la foto y toma otra',
        no_label: 'No se ve la etiqueta — toma otra',
        other: 'No se pudo leer — toma otra',
      },
      hint: 'Etiqueta derecha y llenando el cuadro. Tócala en la pantalla para enfocar.',
      noCamera: 'No hay acceso a la cámara. Permite la cámara para este sitio e intenta de nuevo.',
    }))

const video = ref(null)
const haptic = ref(null)
const status = ref('aim') // aim | captured | retake | duplicate
const retakeIssue = ref('')
const flash = ref(false)
const ring = ref(null)
const error = ref('')
const torchSupported = ref(false)
const torchOn = ref(false)
const capturedCount = ref(0)

const recent = computed(() => props.items.slice(-4).reverse())
const sending = computed(() => props.items.filter((i) => i.status === 'waiting' || i.status === 'working').length)
const statusText = computed(() => (status.value === 'retake'
  ? t.value.retake[retakeIssue.value] || t.value.retake.other
  : t.value[status.value]))
const frameClass = computed(() => ({ aim: 'border-white/70', captured: 'border-green-400', retake: 'border-red-500', duplicate: 'border-sky-400' }[status.value]))
const pillClass = computed(() => ({ aim: 'bg-black/60', captured: 'bg-green-500', retake: 'bg-red-600', duplicate: 'bg-sky-500' }[status.value]))

let stream = null
let wakeLock = null
let audio = null // AudioContext; resumed on any tap inside (iOS starts it suspended)
let capturing = false
let statusTimer = null

function setStatus(s, ms) {
  status.value = s
  clearTimeout(statusTimer)
  if (ms) statusTimer = setTimeout(() => { status.value = 'aim' }, ms)
}

function beep(freq, at = 0) {
  if (!audio) return
  const o = audio.createOscillator()
  const g = audio.createGain()
  o.frequency.value = freq
  g.gain.setValueAtTime(0.15, audio.currentTime + at)
  g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + at + 0.12)
  o.connect(g).connect(audio.destination)
  o.start(audio.currentTime + at)
  o.stop(audio.currentTime + at + 0.13)
}

function buzz() {
  try { navigator.vibrate?.(80) } catch {}
  try { haptic.value?.click() } catch {}
}

function feedback() {
  flash.value = true
  setTimeout(() => { flash.value = false }, 250)
  buzz()
  try { beep(1200) } catch {}
}

function retakeFeedback() { // low double beep + double buzz: unmistakably "not saved"
  buzz()
  setTimeout(buzz, 180)
  try { beep(330); beep(330, 0.18) } catch {}
}

// The parent marks an item 'retake' / 'duplicate' once its read comes back: tell Mau right away.
const announced = new Set()
watch(() => props.items.map((i) => `${i.id}:${i.status}`).join(), () => {
  for (const i of props.items) {
    if ((i.status !== 'retake' && i.status !== 'duplicate') || announced.has(i.id)) continue
    announced.add(i.id)
    if (i.status === 'retake') {
      retakeIssue.value = i.issue || ''
      setStatus('retake', 6000)
      retakeFeedback()
    } else {
      setStatus('duplicate', 2500)
    }
  }
})

async function capture() {
  if (capturing || !video.value?.videoWidth) return
  capturing = true
  try {
    const shot = await captureFrame(video.value)
    const codes = trackingsFrom(shot.barcodes)
    const main = codes.find((c) => c.carrier === 'ups') || codes[0]
    capturedCount.value++
    setStatus('captured', 1200)
    feedback()
    emit('capture', { ...shot, label: main ? `${main.carrier.toUpperCase()} ${main.tracking}` : '📷' })
  } finally {
    capturing = false
  }
}

/** Tap to focus. Where the browser exposes it (Chrome/Android), focus on the tapped point; iPhone
 * Safari keeps continuous autofocus on its own, so the tap there just shows the ring — the hint is
 * what makes Mau pause on the label long enough for it to settle. */
async function focusAt(e) {
  const v = video.value
  if (!v) return
  const box = v.getBoundingClientRect()
  ring.value = { x: e.clientX - box.left, y: e.clientY - box.top }
  setTimeout(() => { ring.value = null }, 700)
  const track = stream?.getVideoTracks()[0]
  const caps = track?.getCapabilities?.() || {}
  const adv = {}
  if (caps.pointsOfInterest !== undefined || 'pointsOfInterest' in (track?.getSettings?.() || {})) {
    adv.pointsOfInterest = [{ x: ring.value.x / box.width, y: ring.value.y / box.height }]
  }
  const modes = caps.focusMode || []
  if (modes.includes('single-shot')) adv.focusMode = 'single-shot'
  else if (modes.includes('continuous')) adv.focusMode = 'continuous'
  if (Object.keys(adv).length) {
    try { await track.applyConstraints({ advanced: [adv] }) } catch {}
  }
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
  clearTimeout(statusTimer)
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
