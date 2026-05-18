<template>
  <div class="flex flex-col items-center gap-6">
    <!-- The orb (clickable button) -->
    <button
      @click="status === 'active' || status === 'connecting' ? stop() : start()"
      :disabled="status === 'connecting'"
      :class="[
        'relative w-40 h-40 sm:w-48 sm:h-48 rounded-full font-bold text-white shadow-xl transition-colors duration-300',
        'flex items-center justify-center',
        'focus:outline-none focus:ring-4 focus:ring-primary-200',
        orbColorClass,
        status === 'connecting' && 'cursor-wait',
        status === 'idle' && 'hover:scale-105 transition-transform duration-300',
      ]"
      :style="orbStyle"
      :aria-label="status === 'active' ? t.stop : t.start"
    >
      <!-- Soft glow halo — scales and intensifies with audio level -->
      <span
        v-if="status === 'active'"
        :class="['absolute inset-0 rounded-full transition-colors duration-300 pointer-events-none', haloColorClass]"
        :style="haloStyle"
      ></span>

      <!-- Idle gentle pulse — only when active and silent -->
      <span
        v-if="status === 'active' && !isUserSpeaking && !isAssistantSpeaking"
        class="absolute inset-0 rounded-full bg-primary-300 opacity-30 animate-ping pointer-events-none"
      ></span>

      <!-- Inner content (icon + label) -->
      <span class="relative z-10 flex flex-col items-center gap-2">
        <!-- Mic icon (idle / active) -->
        <svg
          v-if="status === 'idle' || status === 'active'"
          xmlns="http://www.w3.org/2000/svg"
          class="w-14 h-14"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z"
          />
        </svg>

        <!-- Spinner (connecting) -->
        <svg
          v-else-if="status === 'connecting'"
          class="animate-spin w-12 h-12"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>

        <!-- Error icon -->
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          class="w-12 h-12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
          />
        </svg>

        <span class="text-sm font-semibold">{{ buttonLabel }}</span>
      </span>
    </button>

    <!-- Status text -->
    <p
      class="text-base text-gray-600 text-center max-w-md min-h-[1.5rem]"
      :class="status === 'error' && 'text-red-600'"
    >
      {{ statusText }}
    </p>

    <!-- Hidden audio element for the assistant's voice -->
    <audio ref="audioEl" autoplay class="hidden" />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const { t: createTranslations } = useLanguage()

const translations = {
  start:           { es: 'Hablar', en: 'Talk' },
  stop:            { es: 'Terminar', en: 'Stop' },
  connecting:      { es: 'Conectando…', en: 'Connecting…' },
  retry:           { es: 'Reintentar', en: 'Retry' },
  // Sets expectation that the mic-permission prompt will appear, so the
  // first-visit prompt doesn't feel like an ambush.
  idleHint:        { es: 'Toca para hablar — te pediremos permiso al micrófono.', en: 'Tap to talk — we\'ll ask for microphone permission.' },
  connectingHint:  { es: 'Estableciendo la conexión…', en: 'Establishing connection…' },
  activeHint:      { es: 'Te escucho. Habla cuando quieras.', en: 'Listening. Speak whenever you\'re ready.' },
  speakingHint:    { es: 'Hablando…', en: 'Speaking…' },
  errorHint:       { es: 'Algo salió mal. Vuelve a intentar.', en: 'Something went wrong. Please try again.' },
  micDenied:       { es: 'Necesitamos acceso al micrófono para hablar contigo.', en: 'We need microphone access to talk with you.' },
}

const t = createTranslations(translations)

// Reactive UI state
const status = ref('idle') // 'idle' | 'connecting' | 'active' | 'error'
const errorMessage = ref('')
const audioEl = ref(null)
const micLevel = ref(0)       // 0..1, drives the orb when the visitor speaks
const assistantLevel = ref(0) // 0..1, drives the orb when the assistant speaks

// Non-reactive refs (held for closing/cleanup only)
let pc = null
let micStream = null
let dataChannel = null

// Ephemeral session prefetch (saves the 300–600ms token-mint RTT
// from the user-perceived time-to-first-audio).
let prefetchedSession = null
let prefetchedAt = 0
const PREFETCH_WINDOW_MS = 8 * 60 * 1000 // server mints with 10 min TTL; use 8 to leave slack

// Audio level analysis (drives the orb)
let audioCtx = null
let micSource = null
let micAnalyser = null
let assistantSource = null
let assistantAnalyser = null
let levelRafId = null

// — Derived UI state ———————————————————————————————————————————————————

const isAssistantSpeaking = computed(
  () => assistantLevel.value > 0.04 && assistantLevel.value >= micLevel.value
)
const isUserSpeaking = computed(
  () => micLevel.value > 0.04 && micLevel.value > assistantLevel.value
)
const peakLevel = computed(() => Math.max(micLevel.value, assistantLevel.value))

const orbColorClass = computed(() => {
  if (status.value === 'error') return 'bg-gray-400 hover:bg-gray-500'
  if (status.value === 'connecting') return 'bg-primary-400'
  if (status.value === 'idle') return 'bg-primary-500 hover:bg-primary-600'
  if (isAssistantSpeaking.value) return 'bg-amber-500'
  if (isUserSpeaking.value) return 'bg-primary-600'
  return 'bg-primary-500'
})

const haloColorClass = computed(() =>
  isAssistantSpeaking.value ? 'bg-amber-400' : 'bg-primary-400'
)

const orbStyle = computed(() => {
  if (status.value !== 'active') return {}
  const scale = 1 + peakLevel.value * 0.18
  return { transform: `scale(${scale})`, transition: 'transform 80ms ease-out' }
})

const haloStyle = computed(() => {
  if (status.value !== 'active') return {}
  return {
    opacity: 0.35 + peakLevel.value * 0.45,
    transform: `scale(${1.15 + peakLevel.value * 0.35})`,
    filter: 'blur(18px)',
  }
})

const buttonLabel = computed(() => {
  if (status.value === 'idle') return t.value.start
  if (status.value === 'connecting') return t.value.connecting
  if (status.value === 'active') return t.value.stop
  return t.value.retry
})

const statusText = computed(() => {
  if (status.value === 'idle') return t.value.idleHint
  if (status.value === 'connecting') return t.value.connectingHint
  if (status.value === 'active') {
    return isAssistantSpeaking.value ? t.value.speakingHint : t.value.activeHint
  }
  return errorMessage.value || t.value.errorHint
})

// — Prefetch on mount ———————————————————————————————————————————————————
//
// Mint the ephemeral OpenAI Realtime token as soon as the page mounts.
// By the time the visitor reads the intro and clicks "Hablar", the
// token is already in memory — start() skips the entire server
// round-trip. Silent failure falls back to live-mint inside start().

onMounted(() => {
  $fetch('/api/voice/session', { method: 'POST' })
    .then((s) => {
      prefetchedSession = s
      prefetchedAt = Date.now()
    })
    .catch(() => {
      /* silent — start() will live-mint */
    })
})

// — Main start / stop ——————————————————————————————————————————————————

async function start() {
  if (status.value === 'connecting' || status.value === 'active') return

  status.value = 'connecting'
  errorMessage.value = ''

  try {
    // 1. Use the prefetched token if fresh; else mint live.
    let session
    if (prefetchedSession && Date.now() - prefetchedAt < PREFETCH_WINDOW_MS) {
      session = prefetchedSession
      prefetchedSession = null // consume it; a new prefetch fires on next mount
    } else {
      session = await $fetch('/api/voice/session', { method: 'POST' })
    }
    const token = session?.value || session?.client_secret?.value
    if (!token) throw new Error('No ephemeral token in session response')

    // 2. Request the mic with explicit constraints. `audio: true`
    //    defaults vary by browser/device; explicit mono + 24kHz hint +
    //    AEC/NS/AGC stabilize input quality, which directly improves
    //    VAD accuracy. (Safari may ignore the sampleRate hint silently.)
    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 24000,
        },
      })
    } catch (err) {
      errorMessage.value = t.value.micDenied
      throw err
    }
    micStream = stream

    // Log selected mic device — on macOS the OS sometimes promotes
    // Continuity Camera (iPhone mic) to system default; if Continuity
    // Camera is muted/unavailable the model receives silence.
    const micTrack = stream.getAudioTracks()[0]
    // eslint-disable-next-line no-console
    console.debug(
      '[voice] mic in use:',
      micTrack?.label || '(unlabeled)',
      'settings:',
      micTrack?.getSettings?.()
    )

    // 3. Create the RTCPeerConnection.
    pc = new RTCPeerConnection()

    // 4. Route the assistant's audio into both the page's <audio>
    //    element AND an analyser node for orb visualization.
    pc.ontrack = (e) => {
      // eslint-disable-next-line no-console
      console.debug('[voice] remote track received:', e.track.kind, 'streams:', e.streams.length)
      if (e.streams[0]) {
        if (audioEl.value) audioEl.value.srcObject = e.streams[0]
        attachAnalyser('assistant', e.streams[0])
      }
    }

    // 5. Send the visitor's mic upstream + start the orb level loop.
    pc.addTrack(stream.getAudioTracks()[0], stream)
    attachAnalyser('mic', stream)
    startLevelLoop()

    // 6. Data channel for Realtime events. On open, kick off an
    //    initial assistant greeting so the visitor knows the path is
    //    live — without this the model just waits silently for VAD,
    //    which feels broken. Cap output tokens so the greeting can't
    //    drag on.
    dataChannel = pc.createDataChannel('oai-events')
    dataChannel.addEventListener('open', () => {
      try {
        dataChannel.send(
          JSON.stringify({
            type: 'response.create',
            response: {
              instructions:
                'Saluda al visitante en una sola frase corta en español casual y pregúntale en qué le puedes ayudar. Máximo doce palabras.',
              max_output_tokens: 60,
            },
          })
        )
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[voice] failed to send initial greeting:', err)
      }
    })
    dataChannel.addEventListener('message', (ev) => {
      try {
        const evt = JSON.parse(ev.data)
        if (evt?.type === 'error') {
          // eslint-disable-next-line no-console
          console.error('[voice] OpenAI error event:', evt)
        }
      } catch {}
    })

    // 7. SDP offer → POST to OpenAI's GA WebRTC endpoint. The model is
    //    locked into the session when the ephemeral key is minted, so
    //    no ?model= query param here.
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)

    const sdpRes = await fetch('https://api.openai.com/v1/realtime/calls', {
      method: 'POST',
      body: offer.sdp,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/sdp',
      },
    })
    if (!sdpRes.ok) {
      const errText = await sdpRes.text().catch(() => '')
      throw new Error(`OpenAI SDP exchange failed (${sdpRes.status}): ${errText.slice(0, 200)}`)
    }

    const answerSdp = await sdpRes.text()
    await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp })

    // 8. Treat unexpected drops as errors so the visitor can retry
    //    without reloading the page.
    pc.onconnectionstatechange = () => {
      if (
        pc &&
        (pc.connectionState === 'failed' ||
          pc.connectionState === 'disconnected' ||
          pc.connectionState === 'closed')
      ) {
        if (status.value === 'active') {
          errorMessage.value = t.value.errorHint
          cleanup()
          status.value = 'error'
        }
      }
    }

    status.value = 'active'
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[voice] start failed:', err)
    if (!errorMessage.value) errorMessage.value = err?.message || t.value.errorHint
    cleanup()
    status.value = 'error'
  }
}

function stop() {
  cleanup()
  status.value = 'idle'
  errorMessage.value = ''
}

// — Audio level analysis (drives the orb) —————————————————————————————

function attachAnalyser(kind, stream) {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  // iOS Safari sometimes starts the context suspended even after a
  // user gesture — explicit resume() is safe and idempotent elsewhere.
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {})
  }

  const source = audioCtx.createMediaStreamSource(stream)
  const analyser = audioCtx.createAnalyser()
  analyser.fftSize = 256
  analyser.smoothingTimeConstant = 0.7
  source.connect(analyser)

  if (kind === 'mic') {
    micSource = source
    micAnalyser = analyser
  } else {
    assistantSource = source
    assistantAnalyser = analyser
  }
}

function startLevelLoop() {
  const micBuf = new Uint8Array(256)
  const asstBuf = new Uint8Array(256)

  const peakFrom = (buf) => {
    let peak = 0
    for (let i = 0; i < buf.length; i++) {
      const v = Math.abs(buf[i] - 128)
      if (v > peak) peak = v
    }
    // Normalize to a healthy 0..1 with some headroom. The /60 divisor
    // (instead of /128) gives the orb a more visible response on
    // typical speech amplitudes.
    return Math.min(1, peak / 60)
  }

  const tick = () => {
    if (micAnalyser) {
      micAnalyser.getByteTimeDomainData(micBuf)
      micLevel.value = peakFrom(micBuf)
    }
    if (assistantAnalyser) {
      assistantAnalyser.getByteTimeDomainData(asstBuf)
      assistantLevel.value = peakFrom(asstBuf)
    }
    levelRafId = requestAnimationFrame(tick)
  }
  tick()
}

// — Cleanup ——————————————————————————————————————————————————————————————

function cleanup() {
  if (levelRafId) {
    cancelAnimationFrame(levelRafId)
    levelRafId = null
  }
  try {
    if (micSource) micSource.disconnect()
    if (assistantSource) assistantSource.disconnect()
  } catch {}
  micSource = null
  assistantSource = null
  micAnalyser = null
  assistantAnalyser = null
  micLevel.value = 0
  assistantLevel.value = 0

  try {
    if (audioCtx && audioCtx.state !== 'closed') audioCtx.close().catch(() => {})
  } catch {}
  audioCtx = null

  try {
    if (dataChannel) {
      dataChannel.close()
      dataChannel = null
    }
  } catch {}
  try {
    if (pc) {
      pc.getSenders().forEach((s) => s.track && s.track.stop())
      pc.close()
      pc = null
    }
  } catch {}
  try {
    if (micStream) {
      micStream.getTracks().forEach((t) => t.stop())
      micStream = null
    }
  } catch {}
  if (audioEl.value) audioEl.value.srcObject = null
}

// Clean up if the user navigates away mid-call.
onBeforeUnmount(cleanup)
</script>
