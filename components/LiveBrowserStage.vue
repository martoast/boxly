<template>
  <!-- One store browser the agent is running (C4, watch in chat). View-only for now: pause & take control
       comes next. Attaches to an EXISTING session (the cart's live_sessions), never creates one. -->
  <div class="relative bg-gray-900 overflow-hidden" :class="compact ? 'rounded-xl' : 'rounded-2xl'" style="aspect-ratio: 16 / 9">
    <video ref="videoEl" autoplay playsinline muted class="w-full h-full object-contain" />

    <div v-if="phase !== 'playing'" class="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white text-center px-4 bg-gray-900">
      <template v-if="phase === 'ended'">
        <svg class="w-6 h-6 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 13l4 4L19 7" /></svg>
        <p :class="compact ? 'text-[11px]' : 'text-sm'">El agente terminó en {{ storeName || 'la tienda' }}.</p>
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
import { parseSessionCreateResponse, isTerminal } from '~/utils/liveShopping'
import { useLiveSession } from '~/composables/useLiveSession'
import { useWhepViewer } from '~/composables/useWhepViewer'

const props = defineProps<{ sessionId: number, storeName?: string | null, compact?: boolean }>()
const emit = defineEmits<{ (e: 'ended'): void }>()

const nuxtApp = useNuxtApp() as any
const { $customFetch } = nuxtApp
const videoEl = ref<HTMLVideoElement | null>(null)
const phase = ref<'connecting' | 'playing' | 'ended' | 'error'>('connecting')
const mediaState = ref('pending')
let live: any = null
let viewer: any = null
let stops: Array<() => void> = []

const loadingCopy = computed(() => mediaState.value === 'failed' ? 'El video no está disponible.' : `Abriendo ${props.storeName || 'la tienda'}…`)
const srStatus = computed(() => phase.value === 'playing' ? `Viendo ${props.storeName || 'la tienda'} en vivo` : phase.value === 'ended' ? 'El agente terminó' : '')

async function attach() {
  let r: any
  try {
    r = await $customFetch(`/live-shopping/sessions/${props.sessionId}`)
  } catch { phase.value = 'error'; return }
  const h = parseSessionCreateResponse(r)
  if (!h) { phase.value = r?.data?.status && r.data.status !== 'running' ? 'ended' : 'error'; if (phase.value === 'ended') emit('ended'); return }
  live = nuxtApp.runWithContext(() => useLiveSession(h, {
    onTerminal: () => { viewer?.stop(); phase.value = 'ended'; emit('ended') },
  }))
  viewer = nuxtApp.runWithContext(() => useWhepViewer({ getTicket: live.getTicket, remintTicket: live.remintTicket }))
  stops.push(watch(live.mediaState, (s: string) => { mediaState.value = s }, { immediate: true }))
  stops.push(watch(viewer.state, (s: string) => { if (s === 'playing') phase.value = 'playing'; else if (phase.value === 'playing' && s !== 'reconnecting') phase.value = 'connecting' }))
  stops.push(watch(viewer.stream, (s: MediaStream | null) => { if (videoEl.value && s) videoEl.value.srcObject = s }))
  // View-only: the ticket carries media (never input) for a cart session; start the video when it does.
  stops.push(watch(live.ticket, (t: any) => {
    if (!t || isTerminal(live.status.value)) return
    const vs = viewer.state.value
    if (t.mediaAvailable && (vs === 'idle' || vs === 'closed' || vs === 'failed')) viewer.start()
  }, { immediate: true }))
  live.start()
}

function teardown() {
  for (const s of stops) s()
  stops = []
  viewer?.stop(); viewer = null
  live?.stop(); live = null
}

onMounted(attach)
onBeforeUnmount(teardown)
watch(() => props.sessionId, () => { teardown(); phase.value = 'connecting'; attach() })
</script>
