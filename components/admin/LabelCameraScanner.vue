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
    <div ref="stage" class="relative flex-1 overflow-hidden">
      <video ref="video" class="absolute inset-0 w-full h-full object-cover" playsinline muted autoplay @click="focusAt" />
      <div v-if="ring" class="absolute w-20 h-20 -ml-10 -mt-10 rounded-xl border-2 border-yellow-300 pointer-events-none animate-ping" :style="{ left: `${ring.x}px`, top: `${ring.y}px` }" />
      <div v-if="!quad" class="absolute inset-6 rounded-3xl border-4 transition-colors duration-150 pointer-events-none" :class="frameClass" />
      <svg v-if="quad" class="absolute inset-0 w-full h-full pointer-events-none">
        <polygon :points="quad.map((p) => `${p.x},${p.y}`).join(' ')" :fill="quadOk ? 'rgba(34,197,94,0.25)' : 'rgba(249,115,22,0.25)'" :stroke="quadOk ? '#22c55e' : '#f97316'" stroke-width="4" stroke-linejoin="round" />
      </svg>
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
import { loadCv, findLabel } from '~/utils/labelQuad'

/**
 * Label camera that takes the photo BY ITSELF, like the iPhone Notes document scan
 * (Alex, 2026-10-07: "it needs to fast check and when it passes the check then it takes
 * the image"). ~9 times a second it finds the label's outline (utils/labelQuad), draws it
 * over the video, and checks, in order:
 *   whole label on screen → close enough → phone square to the label (corners ~90°,
 *   opposite sides ~equal) → in focus (sharp, and focus has settled) → held still.
 * All passing for STEADY_FRAMES frames in a row = capture. After a capture it waits for
 * the next label (this one leaves the frame, or the view moves to another) before arming.
 *
 * The shutter button always works (a label the finder can't see, or OpenCV failed to load).
 * The AI still judges every photo; a bad one whose read came back incomplete is marked
 * 'retake' by the parent — shown as a red prompt with a double buzz, and the finder re-arms
 * at once so the same label can be shot again.
 */
const props = defineProps({
  items: { type: Array, default: () => [] }, // the parent's queue: shows the last few results coming back
  english: { type: Boolean, default: false },
})
const emit = defineEmits(['capture', 'close'])

const t = computed(() => (props.english
  ? {
      close: 'Close', scanned: 'scanned', sending: 'sending', torch: 'Flashlight', shutter: 'Take photo',
      loading: 'Starting scanner…', manual: 'Take the photo with the button',
      find: 'Point at the label — the whole label on screen',
      backup: 'Back up a little — the label runs off the screen',
      closer: 'Get closer to the label',
      straighten: 'Straighten the phone — face the label head-on',
      focus: 'Focusing… tap the label if it stays blurry',
      hold: 'Hold still…',
      captured: 'Got it ✓', next: 'Got it ✓ — next label', duplicate: 'Already scanned',
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
      hint: 'Takes the photo by itself when the label is straight and sharp. Or use the button.',
      noCamera: 'Camera not available. Allow camera access for this site and try again.',
    }
  : {
      close: 'Cerrar', scanned: 'escaneadas', sending: 'enviando', torch: 'Linterna', shutter: 'Tomar foto',
      loading: 'Preparando escáner…', manual: 'Toma la foto con el botón',
      find: 'Apunta a la etiqueta — que se vea completa',
      backup: 'Aléjate un poco — la etiqueta se sale de la pantalla',
      closer: 'Acércate a la etiqueta',
      straighten: 'Endereza el teléfono — de frente a la etiqueta',
      focus: 'Enfocando… toca la etiqueta si no se aclara',
      hold: 'No te muevas…',
      captured: '¡Listo! ✓', next: 'Listo ✓ — siguiente etiqueta', duplicate: 'Ya escaneada',
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
      hint: 'Se toma sola cuando la etiqueta está derecha y enfocada. O usa el botón.',
      noCamera: 'No hay acceso a la cámara. Permite la cámara para este sitio e intenta de nuevo.',
    }))

// The checks (tuned on 54 real warehouse photos, 480 px analysis frames — see utils/labelQuad)
const FRAME = 480 // analysis frame, long side
const MAX_ANGLE_ERR = 12 // degrees off square, worst corner
const MIN_SIDE_RATIO = 0.85 // opposite sides: shorter / longer (a trapezoid = phone tilted)
const MIN_COVERAGE = 0.2 // label area / frame
const MIN_SHARP = 1400 // blurry photos scored < 1,400, sharp ones 2,000–7,000
const PEAK_SHARE = 0.75 // and within 75% of the sharpest frame of this label (focus settled)
const MAX_MOTION = 0.03 // corner movement between frames / label diagonal
const STEADY_FRAMES = 3

const video = ref(null)
const stage = ref(null)
const haptic = ref(null)
const status = ref('loading') // loading | manual | find | backup | closer | straighten | focus | hold | captured | next | retake | duplicate
const retakeIssue = ref('')
const quad = ref(null) // label outline in screen px
const quadOk = ref(false)
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
const GOOD = ['hold', 'captured', 'next']
const frameClass = computed(() => (status.value === 'retake' ? 'border-red-500' : status.value === 'duplicate' ? 'border-sky-400' : GOOD.includes(status.value) ? 'border-green-400' : 'border-white/70'))
const pillClass = computed(() => (status.value === 'retake' ? 'bg-red-600' : status.value === 'duplicate' ? 'bg-sky-500' : GOOD.includes(status.value) ? 'bg-green-500' : 'bg-black/60'))

let stream = null
let running = false
let wakeLock = null
let audio = null // AudioContext; resumed on any tap inside (iOS starts it suspended)
let cv = null
let capturing = false
let holdUntil = 0 // a message (captured / retake / duplicate) stays up until then
const work = document.createElement('canvas')

// finder state
let prev = null // last frame's quad (analysis px)
let steady = 0
let peak = 0 // sharpest score seen for the label in view
let lost = 0 // frames in a row with no label
let armed = true // false right after a capture, until the next label shows up
let shotCenter = null // where the captured label was (analysis px)

function show(s, ms = 0) {
  status.value = s
  holdUntil = ms ? Date.now() + ms : 0
}
function say(s) { // finder guidance; never overrides a message still on hold
  if (Date.now() >= holdUntil) status.value = s
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
      show('retake', 5000)
      retakeFeedback()
      armed = true // shoot the same label again
      steady = 0
    } else {
      show('duplicate', 2500)
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
    armed = false
    shotCenter = prev ? center(prev) : null
    steady = 0
    show('captured', 1200)
    feedback()
    emit('capture', { ...shot, label: main ? `${main.carrier.toUpperCase()} ${main.tracking}` : '📷' })
  } finally {
    capturing = false
  }
}

const center = (q) => ({ x: (q[0].x + q[1].x + q[2].x + q[3].x) / 4, y: (q[0].y + q[1].y + q[2].y + q[3].y) / 4 })
const diag = (q) => Math.hypot(q[0].x - q[2].x, q[0].y - q[2].y)

/** One analysis pass: find the label, draw it, run the checks, capture when they all pass. */
function analyse() {
  const v = video.value
  const box = stage.value?.getBoundingClientRect()
  if (!v || !box?.width || v.readyState < 2 || !v.videoWidth) return
  const vw = v.videoWidth, vh = v.videoHeight
  const k = Math.min(1, FRAME / Math.max(vw, vh))
  work.width = Math.round(vw * k)
  work.height = Math.round(vh * k)
  const ctx = work.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(v, 0, 0, work.width, work.height)
  // the video is object-cover: Mau sees only the middle of the frame
  const s = Math.max(box.width / vw, box.height / vh)
  const view = { x: ((vw - box.width / s) / 2) * k, y: ((vh - box.height / s) / 2) * k, w: (box.width / s) * k, h: (box.height / s) * k }
  const r = findLabel(cv, ctx.getImageData(0, 0, work.width, work.height), view)

  if (!r) {
    quad.value = null
    prev = null
    steady = 0
    if (++lost >= 3) { armed = true; peak = 0 } // the captured label has left: ready for the next
    say(armed ? 'find' : 'next')
    return
  }
  lost = 0
  quad.value = r.quad.map((p) => ({ x: (p.x - view.x) / k * s, y: (p.y - view.y) / k * s }))
  const motion = prev ? Math.max(...r.quad.map((p, i) => Math.hypot(p.x - prev[i].x, p.y - prev[i].y))) / diag(r.quad) : 1
  prev = r.quad
  if (!armed && shotCenter && Math.hypot(center(r.quad).x - shotCenter.x, center(r.quad).y - shotCenter.y) > 0.35 * diag(r.quad)) {
    armed = true // the view moved on to another label
    peak = 0
  }
  peak = Math.max(peak * 0.995, r.sharp)

  let verdict = 'hold'
  if (!armed) verdict = 'next'
  else if (r.touchesEdge) verdict = 'backup'
  else if (r.coverage < MIN_COVERAGE) verdict = 'closer'
  else if (r.maxAngleErr > MAX_ANGLE_ERR || r.sideRatio < MIN_SIDE_RATIO) verdict = 'straighten'
  else if (r.sharp < MIN_SHARP || r.sharp < PEAK_SHARE * peak) verdict = 'focus'
  else if (motion > MAX_MOTION) verdict = 'hold'
  quadOk.value = verdict === 'hold' || verdict === 'next'
  steady = verdict === 'hold' && motion <= MAX_MOTION ? steady + 1 : 0
  say(verdict)
  if (steady >= STEADY_FRAMES) capture()
}

async function tick() {
  if (!running) return
  if (cv && !capturing) {
    try { analyse() } catch (e) { console.warn('[scanner]', e) }
  }
  setTimeout(tick, 110)
}

/** Tap to focus. Where the browser exposes it (Chrome/Android), focus on the tapped point; iPhone
 * Safari keeps continuous autofocus on its own, so the tap there just shows the ring. */
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
    running = true
    tick()
  } catch (e) {
    console.error('[scanner]', e)
    error.value = t.value.noCamera
    return
  }
  try {
    cv = await loadCv()
    if (status.value === 'loading') status.value = 'find'
  } catch (e) {
    console.error('[scanner] opencv', e)
    status.value = 'manual' // the shutter still works
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
  loadCv().catch(() => {}) // start the download while the camera permission prompt is up
  start()
})
onBeforeUnmount(stop)
</script>
