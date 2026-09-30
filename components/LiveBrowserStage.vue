<template>
  <!-- One store browser the agent is running (C4, watch in chat). View-only for now: pause & take control
       comes next. Attaches to an EXISTING session (the cart's live_sessions), never creates one. -->
  <div class="relative bg-gray-900 overflow-hidden" :class="compact ? 'rounded-xl' : 'rounded-2xl'" style="aspect-ratio: 16 / 9">
    <!-- Interactive: touch-action none so a press-and-hold on a phone never scrolls or opens the callout menu. -->
    <video ref="videoEl" tabindex="0" autoplay playsinline muted class="w-full h-full object-contain outline-none" :class="interactive ? 'cursor-default ring-2 ring-primary-400 ring-inset touch-none select-none' : ''" :style="interactive ? '-webkit-touch-callout: none' : ''" />

    <!-- Finished: the store's LAST FRAME stays (Alex 2026-09-28: "it shouldn't close it — keep it there in case the
         user wants to go back to it"), with a small done badge, instead of a dark cover. -->
    <template v-if="phase === 'ended' && lastFrame">
      <img :src="lastFrame" alt="" class="absolute inset-0 w-full h-full object-contain bg-gray-900" />
      <span class="absolute left-2 bottom-2 inline-flex items-center gap-1 rounded-full bg-black/70 text-white px-2 py-0.5" :class="compact ? 'text-[10px]' : 'text-xs'">
        <svg class="w-3 h-3 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 13l4 4L19 7" /></svg>
        Listo en {{ storeName || 'la tienda' }}
      </span>
    </template>
    <div v-else-if="phase !== 'playing'" class="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white text-center px-4 bg-gray-900">
      <template v-if="phase === 'ended'">
        <svg class="w-6 h-6 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 13l4 4L19 7" /></svg>
        <p :class="compact ? 'text-[11px]' : 'text-sm'">El agente terminó en {{ storeName || 'la tienda' }}.</p>
      </template>
      <!-- WAITING FOR A FREE BROWSER (2026-09-28, simultaneous shoppers): the engine is serving other shoppers; the
           session waits in line (API LiveQueue) and this card connects the moment it starts. -->
      <template v-else-if="phase === 'queued'">
        <span class="w-6 h-6 rounded-full border-2 border-white/25 border-t-white animate-spin" aria-hidden="true" />
        <p :class="compact ? 'text-[11px]' : 'text-sm'">{{ queueCopy }}</p>
        <p v-if="!compact" class="text-xs text-white/60">Tu navegador se abre en cuanto se libere uno.</p>
      </template>
      <template v-else-if="phase === 'error'">
        <p :class="compact ? 'text-[11px]' : 'text-sm'">No pudimos mostrar el navegador en vivo.</p>
      </template>
      <template v-else>
        <span class="w-6 h-6 rounded-full border-2 border-white/25 border-t-white animate-spin" aria-hidden="true" />
        <p :class="compact ? 'text-[11px] text-white/80' : 'text-sm text-white/80'">{{ loadingCopy }}</p>
      </template>
    </div>
    <span class="sr-only" role="status" aria-atomic="true">{{ srStatus }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { parseSessionCreateResponse, isTerminal, parseControlChange } from '~/utils/liveShopping'
import { useLiveSession } from '~/composables/useLiveSession'
import { useWhepViewer } from '~/composables/useWhepViewer'
import { useInputRelay } from '~/composables/useInputRelay'

// interactive (C4 phase B): the customer holds the browser (paused agent) — their mouse and keyboard on the video
// are relayed to the store. Bound ONLY while interactive, so typing in the chat is never captured otherwise.
const props = defineProps<{ sessionId: number, storeName?: string | null, compact?: boolean, interactive?: boolean }>()
const emit = defineEmits<{ (e: 'ended'): void, (e: 'control', controller: string, reason: string | null, occurredAt: string | null): void, (e: 'refused', code: string): void }>()

const nuxtApp = useNuxtApp() as any
const { $customFetch } = nuxtApp
const videoEl = ref<HTMLVideoElement | null>(null)
const phase = ref<'connecting' | 'queued' | 'playing' | 'ended' | 'error'>('connecting')
// Its place in line while the engine is full (1 = next).
const queuePosition = ref<number | null>(null)
let queueTimer: ReturnType<typeof setTimeout> | null = null
const mediaState = ref('pending')
let live: any = null
let viewer: any = null
let stops: Array<() => void> = []
const relay = useInputRelay()
let relayBound = false

// The last frame of the store, kept when the agent finishes (a still image of where it left the store).
const lastFrame = ref<string | null>(null)
function captureLastFrame() {
  const v = videoEl.value
  if (!v || !v.videoWidth || !v.videoHeight) return
  try {
    const c = document.createElement('canvas')
    c.width = v.videoWidth; c.height = v.videoHeight
    c.getContext('2d')?.drawImage(v, 0, 0)
    lastFrame.value = c.toDataURL('image/jpeg', 0.85)
  } catch { /* a tainted or empty frame: the ended cover shows instead */ }
}

const queueCopy = computed(() => queuePosition.value && queuePosition.value > 1
  ? `En fila · ${queuePosition.value - 1} ${queuePosition.value - 1 === 1 ? 'persona' : 'personas'} antes que tú`
  : `Eres el siguiente en ${props.storeName || 'la tienda'}`)
const loadingCopy = computed(() => mediaState.value === 'failed' ? 'El video no está disponible.' : `Abriendo ${props.storeName || 'la tienda'}…`)
const srStatus = computed(() => phase.value === 'playing' ? `Viendo ${props.storeName || 'la tienda'} en vivo` : phase.value === 'ended' ? `El agente terminó en ${props.storeName || 'la tienda'}` : '')

async function attach() {
  let r: any
  try {
    r = await $customFetch(`/live-shopping/sessions/${props.sessionId}`)
  } catch { phase.value = 'error'; return }
  // In line for a free browser (queued), or just started and not yet given its engine session: ask again shortly.
  // (With the engine answering at acceptance, a started session is briefly `pending` WITH its engine id until the
  // browser is up — keep asking; it turns `running` within seconds.)
  const waiting = r?.data?.queued === true || r?.data?.status === 'pending'
  if (waiting) {
    if (r?.data?.queued) { phase.value = 'queued'; queuePosition.value = Number(r.data.queue_position) || null }
    queueTimer = setTimeout(() => { queueTimer = null; void attach() }, 3000)
    return
  }
  const h = parseSessionCreateResponse(r)
  if (!h) { phase.value = r?.data?.status && r.data.status !== 'running' ? 'ended' : 'error'; if (phase.value === 'ended') emit('ended'); return }
  if (phase.value === 'queued') phase.value = 'connecting'

  live = nuxtApp.runWithContext(() => useLiveSession(h, {
    onTerminal: () => { captureLastFrame(); viewer?.stop(); relay.stop(); phase.value = 'ended'; emit('ended') },
    // C4: who holds the browser (agent | pausing | customer), and why when the agent asked for the shopper's help
    // (reason 'challenge': a store's human check only a person may pass).
    onEvent: (ev: any) => { const c = parseControlChange(ev); if (c) emit('control', c.controller, c.reason, typeof ev?.occurredAt === 'string' ? ev.occurredAt : null) },
  }))
  viewer = nuxtApp.runWithContext(() => useWhepViewer({ getTicket: live.getTicket, remintTicket: live.remintTicket }))
  stops.push(watch(live.mediaState, (s: string) => { mediaState.value = s }, { immediate: true }))
  stops.push(watch(viewer.state, (s: string) => { if (s === 'playing') phase.value = 'playing'; else if (phase.value === 'playing' && s !== 'reconnecting') phase.value = 'connecting' }))
  stops.push(watch(viewer.stream, (s: MediaStream | null) => { if (videoEl.value && s) videoEl.value.srcObject = s }))
  // The ticket drives both planes: the video when it carries media, the customer's input when it carries an
  // input_url (only while they hold the browser, and only when this stage is interactive).
  stops.push(watch(live.ticket, (t: any) => {
    if (!t || isTerminal(live.status.value)) return
    const vs = viewer.state.value
    if (t.mediaAvailable && (vs === 'idle' || vs === 'closed' || vs === 'failed')) viewer.start()
    const rs = relay.state.value
    if (props.interactive && t.inputUrl && (rs === 'idle' || rs === 'closed' || rs === 'failed')) relay.start(t)
  }, { immediate: true }))
  stops.push(watch(relay.lastRefusal, (code: any) => { if (code) emit('refused', String(code)) }))
  live.start()
}

// Taking control: bind the input to the video and re-mint the ticket (the new one carries input_url). Handing
// back: close the input first, so nothing the customer does after that reaches the store.
watch(() => props.interactive, (on) => {
  if (on) {
    if (videoEl.value && !relayBound) { relay.bind(videoEl.value); relayBound = true; videoEl.value.focus() }
    live?.remintTicket?.()
  } else {
    relay.stop()
    if (relayBound) { relay.unbind(); relayBound = false }
  }
})

function teardown() {
  if (queueTimer) { clearTimeout(queueTimer); queueTimer = null }
  relay.stop()
  if (relayBound) { relay.unbind(); relayBound = false }
  for (const s of stops) s()
  stops = []
  viewer?.stop(); viewer = null
  live?.stop(); live = null
}

onMounted(attach)
onBeforeUnmount(teardown)
watch(() => props.sessionId, () => { teardown(); phase.value = 'connecting'; attach() })
</script>
