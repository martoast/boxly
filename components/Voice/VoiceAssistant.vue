<template>
  <div class="flex flex-col items-center gap-6">
    <!-- Big circular start/stop button -->
    <button
      @click="status === 'active' || status === 'connecting' ? stop() : start()"
      :disabled="status === 'connecting'"
      :class="[
        'relative w-40 h-40 sm:w-48 sm:h-48 rounded-full font-bold text-white shadow-xl transition-all duration-300',
        'flex items-center justify-center',
        'focus:outline-none focus:ring-4 focus:ring-primary-200',
        status === 'idle' && 'bg-primary-500 hover:bg-primary-600 hover:scale-105',
        status === 'connecting' && 'bg-primary-400 cursor-wait',
        status === 'active' && 'bg-red-500 hover:bg-red-600',
        status === 'error' && 'bg-gray-400 hover:bg-gray-500',
      ]"
      :aria-label="status === 'active' ? t.stop : t.start"
    >
      <!-- Pulsing ring when active -->
      <span
        v-if="status === 'active'"
        class="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-60"
      ></span>

      <!-- Icon + label -->
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
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
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

        <span class="text-sm font-semibold">
          {{
            status === 'idle' ? t.start
              : status === 'connecting' ? t.connecting
              : status === 'active' ? t.stop
              : t.retry
          }}
        </span>
      </span>
    </button>

    <!-- Status text -->
    <p
      class="text-base text-gray-600 text-center max-w-md min-h-[1.5rem]"
      :class="status === 'error' && 'text-red-600'"
    >
      {{
        status === 'idle' ? t.idleHint
          : status === 'connecting' ? t.connectingHint
          : status === 'active' ? t.activeHint
          : errorMessage || t.errorHint
      }}
    </p>

    <!-- Hidden audio element for the assistant's voice -->
    <audio ref="audioEl" autoplay class="hidden" />
  </div>
</template>

<script setup>
import { onBeforeUnmount, ref } from 'vue'

const { t: createTranslations } = useLanguage()

const translations = {
  start:           { es: 'Hablar', en: 'Talk' },
  stop:            { es: 'Terminar', en: 'Stop' },
  connecting:      { es: 'Conectando…', en: 'Connecting…' },
  retry:           { es: 'Reintentar', en: 'Retry' },
  idleHint:        { es: 'Toca para hablar con el asistente.', en: 'Tap to talk to the assistant.' },
  connectingHint:  { es: 'Estableciendo la conexión…', en: 'Establishing connection…' },
  activeHint:      { es: 'Te escucho. Habla cuando quieras.', en: 'Listening. Speak whenever you\'re ready.' },
  errorHint:       { es: 'Algo salió mal. Vuelve a intentar.', en: 'Something went wrong. Please try again.' },
  micDenied:       { es: 'Necesitamos acceso al micrófono para hablar contigo.', en: 'We need microphone access to talk with you.' },
}

const t = createTranslations(translations)

const status = ref('idle') // 'idle' | 'connecting' | 'active' | 'error'
const errorMessage = ref('')
const audioEl = ref(null)

// Hold non-reactive refs (closing/cleanup only)
let pc = null
let micStream = null
let dataChannel = null

async function start() {
  if (status.value === 'connecting' || status.value === 'active') return

  status.value = 'connecting'
  errorMessage.value = ''

  try {
    // 1. Mint an ephemeral OpenAI Realtime session token from our backend.
    //    GA response shape: `{ value: "ek_...", expires_at, session: {...} }`.
    //    Fall back to the old `client_secret.value` path defensively in case
    //    OpenAI ships a transitional response.
    const session = await $fetch('/api/voice/session', { method: 'POST' })
    const token = session?.value || session?.client_secret?.value
    if (!token) throw new Error('No ephemeral token in session response')

    // 2. Request the visitor's microphone.
    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (err) {
      errorMessage.value = t.value.micDenied
      throw err
    }
    micStream = stream

    // Log which mic the browser picked. On macOS the OS sometimes
    // promotes "Continuity Camera" (iPhone mic) to the system default
    // and the browser inherits it — if Continuity Camera is muted /
    // unavailable, the model just receives silence and the assistant
    // appears to "not hear" the visitor. Console label tells us fast.
    const micTrack = stream.getAudioTracks()[0]
    // eslint-disable-next-line no-console
    console.debug(
      '[voice] mic in use:',
      micTrack?.label || '(unlabeled)',
      'settings:',
      micTrack?.getSettings?.()
    )

    // 3. Create the RTCPeerConnection. Default ICE servers are fine for
    //    direct browser → OpenAI; OpenAI handles its side.
    pc = new RTCPeerConnection()

    // 4. Route the assistant's audio track into the page's <audio> element.
    pc.ontrack = (e) => {
      // eslint-disable-next-line no-console
      console.debug('[voice] remote track received:', e.track.kind, 'streams:', e.streams.length)
      if (audioEl.value && e.streams[0]) {
        audioEl.value.srcObject = e.streams[0]
      }
    }

    // 5. Send the visitor's mic upstream.
    pc.addTrack(stream.getAudioTracks()[0], stream)

    // 6. Open the data channel for Realtime events. Once open, kick off
    //    an initial assistant greeting so the visitor knows it's live —
    //    without this the model just waits silently until VAD picks up
    //    the visitor's voice, which feels broken.
    dataChannel = pc.createDataChannel('oai-events')
    dataChannel.addEventListener('open', () => {
      try {
        dataChannel.send(
          JSON.stringify({
            type: 'response.create',
            response: {
              instructions:
                'Saluda al visitante brevemente en español casual (una sola frase corta) y pregúntale en qué le puedes ayudar.',
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

    // 7. Generate the SDP offer.
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)

    // 8. Hand the SDP to OpenAI with the ephemeral token — direct.
    //    GA endpoint: /v1/realtime/calls (no `?model=` param — the model
    //    is locked into the session when the ephemeral key is minted).
    const sdpRes = await fetch(
      'https://api.openai.com/v1/realtime/calls',
      {
        method: 'POST',
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/sdp',
        },
      }
    )
    if (!sdpRes.ok) {
      const errText = await sdpRes.text().catch(() => '')
      throw new Error(`OpenAI SDP exchange failed (${sdpRes.status}): ${errText.slice(0, 200)}`)
    }

    const answerSdp = await sdpRes.text()
    await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp })

    // 9. Watch for the peer connection failing — flip to error so the
    //    visitor can retry without reloading the page.
    pc.onconnectionstatechange = () => {
      if (
        pc &&
        (pc.connectionState === 'failed' ||
         pc.connectionState === 'disconnected' ||
         pc.connectionState === 'closed')
      ) {
        if (status.value === 'active') {
          // Treat unexpected drops as errors
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
    if (!errorMessage.value) {
      errorMessage.value = err?.message || t.value.errorHint
    }
    cleanup()
    status.value = 'error'
  }
}

function stop() {
  cleanup()
  status.value = 'idle'
  errorMessage.value = ''
}

function cleanup() {
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
  if (audioEl.value) {
    audioEl.value.srcObject = null
  }
}

// Clean up if the user navigates away mid-call.
onBeforeUnmount(cleanup)
</script>
