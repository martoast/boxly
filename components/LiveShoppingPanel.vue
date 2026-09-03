<script setup>
// Live shopping viewer panel (P1, VIEW-ONLY — no takeover CTA). Renders the
// tool-live_verify session handle {localSessionId, engineSessionId, status}:
// live WHEP video, honest
// status badges driven by the real EventV1 stream, the progressive candidate
// list, and terminal/error cards. It NEVER mutates or reloads the conversation —
// terminal candidates live here from SSE; the Laravel-persisted tool-live_results
// part renders as a gallery on the next authoritative conversation load.
const props = defineProps({
  session: { type: Object, required: true }, // {localSessionId, engineSessionId, status}
})
const emit = defineEmits(['terminal'])

// STRICT handle gate: never boot SSE/WHEP from a malformed history part. Both
// ID domains validated — localSessionId feeds the Laravel ticket route only,
// engineSessionId matches EventV1.session_id only.
const handle = validateSessionHandle(props.session)
// A session that was ALREADY terminal when this part came out of history:
// don't open SSE/WHEP for it — its results are the persisted gallery part.
// The persisted handle status can lag (the webhook does not update it), so a
// terminal this PAGE already observed for the exact engine session counts too:
// a panel remounted by the conversation refresh must not start a new stream,
// replay the terminal and announce it again (live: ~9 GETs in 2s, conv. 33).
const remembered = handle ? rememberedTerminal(handle.engineSessionId) : null
const historyTerminal = handle ? (isTerminal(handle.status) || !!remembered) : false

const activity = ref(null) // honest EventV1-driven activity (starting/browsing/…)
const live = useLiveSession(handle, {
  onTerminal: (s) => { viewer.stop(); emit('terminal', s) },
  onEvent: (ev) => { const a = eventActivity(ev.type); if (a) activity.value = a },
})
const viewer = useWhepViewer({ getTicket: live.getTicket, remintTicket: live.remintTicket })

const videoEl = ref(null)
const stalled = ref(false)
watch(viewer.stream, (s) => {
  if (videoEl.value && s) videoEl.value.srcObject = s
  stalled.value = false
  const track = s?.getVideoTracks?.()[0]
  if (track) {
    // Stalled video shows a spinner OVER the last frame, never a blank box.
    track.onmute = () => { stalled.value = true }
    track.onunmute = () => { stalled.value = false }
  }
})

// The viewer starts (or restarts after Reintentar) whenever a fresh ticket
// lands and the session isn't terminal. A ticket with media_available:false
// carries no media plane at all — the events stream is independent of it, so we
// simply never open a PeerConnection and the panel stays in its calm state.
watch(live.ticket, (t) => {
  if (!t || !t.mediaAvailable || isTerminal(live.status.value)) return
  const vs = viewer.state.value
  if (vs === 'idle' || vs === 'closed' || vs === 'failed') viewer.start()
})

onMounted(() => {
  if (handle && !historyTerminal) live.start()
})

// Availability is rendered honestly from the closed ProductV1 enum; null/unknown makes no claim.

// Reintentar re-mints a ticket for the SAME session — it never opens a new one.
function onRetry() {
  viewer.stop()
  live.retry()
}

// Price/availability text computed ONCE per candidate per list change, not per template read.
const displayCandidates = computed(() =>
  live.candidates.value.map((c) => ({ ...c, priceText: candidatePriceText(c), availabilityLabel: availabilityText(c.availability) }))
)

const status = computed(() => (historyTerminal ? (remembered?.status ?? handle.status) : live.status.value))
// Media is OPTIONAL. Until a ticket arrives we don't know, and rendering a black
// video box we may never fill would be a promise we can't keep — so the box
// appears only once a ticket actually reports a media plane.
const mediaAvailable = computed(() => live.ticket.value?.mediaAvailable === true)
const liveSession = computed(() => handle && !historyTerminal && !isTerminal(status.value))
const showVideo = computed(() => liveSession.value && mediaAvailable.value)
// The session is running normally, there is simply no video to show. This is a
// capability state, NOT a failure: no alert role, no red, and the agent's status
// badge and progressive candidates carry on exactly as they would with video.
const showNoMedia = computed(() => liveSession.value && live.ticket.value != null && !mediaAvailable.value)
const badge = computed(() => {
  if (viewer.state.value === 'reconnecting' || status.value === 'reconnecting') return 'Reconectando…'
  if (status.value === 'connecting') return 'Conectando…'
  if (activity.value === 'starting') return 'Preparando la tienda…'
  if (activity.value === 'cancelling') return 'Cancelando…'
  return 'Agente navegando'
})
const mediaFailed = computed(() => activity.value === 'media_failed' || viewer.state.value === 'failed')
const overlay = computed(() =>
  !mediaFailed.value && (
    status.value === 'connecting' || status.value === 'reconnecting' ||
    viewer.state.value === 'connecting' || viewer.state.value === 'reconnecting' ||
    activity.value === 'media_publishing' || stalled.value
  )
)
const card = computed(() => {
  if (!handle) return { tone: 'red', text: 'La sesión en vivo no está disponible.' }
  const s = status.value
  if (s === 'completed') {
    // partial_match: the engine verified a product that misses one requested
    // constraint (real price/availability, honest caveat) — say so, in amber.
    // History: the page memory is authoritative when it has this terminal; without
    // it the composable hydrates live.terminalReason from the API (A.1), so a
    // fresh page load of an old partial_match session is not painted green.
    const partial = (historyTerminal ? (remembered ? remembered.errorCode : live.terminalReason.value) : live.terminalReason.value) === 'partial_match'
    if (partial) return { tone: 'amber', text: terminalReasonText('partial_match') }
    return { tone: 'green', text: historyTerminal ? 'Esta sesión en vivo ya terminó — los resultados están en la conversación.' : 'Sesión completada — estos son los resultados verificados en la tienda.' }
  }
  if (s === 'expired') return { tone: 'amber', text: 'Sesión expirada.', retry: true }
  if (s === 'cancelled') return { tone: 'gray', text: 'Sesión cancelada.' }
  if (s === 'failed') {
    // `failed` is reached two ways and they are NOT the same story: the SESSION
    // failed (the server told us why), or we merely lost the transport. Blaming
    // the connection for a session the store actually refused is a plausible,
    // confident, wrong answer — the exact kind this panel exists to avoid.
    // Provenance, not the reason string, is what separates them: present()'s
    // error_code is NULLABLE, so a failed session that stored no reason would
    // fall straight back to the connection story if we branched on the string.
    if (live.terminalAuthoritative.value) return { tone: 'red', text: terminalReasonText(live.terminalReason.value) }
    return { tone: 'red', text: 'No pudimos mantener la conexión con la sesión en vivo.' }
  }
  if (historyTerminal) return { tone: 'gray', text: 'Esta sesión en vivo ya terminó.' }
  return null
})
const cardClass = {
  green: 'bg-green-50 border-green-200 text-green-800',
  amber: 'bg-amber-50 border-amber-200 text-amber-800',
  gray: 'bg-gray-50 border-gray-200 text-gray-600',
  red: 'bg-red-50 border-red-200 text-red-700',
}

// ── The panel's SINGLE hidden status announcer. Lifecycle transitions have
// absolute priority; the debounced candidate COUNT may speak only while the
// lifecycle is stably working; failed/expired stay silent here because the
// visible role=alert card announces them. History-terminal mounts are silent.
const srLive = ref('')
const liveAnnouncer = createLiveAnnouncer()
let observedLifecycle = null
let candidateTimer = null
let candidateGeneration = 0
let writeGeneration = 0
let liveUnmounted = false
function cancelCandidateTimer() {
  if (candidateTimer !== null) clearTimeout(candidateTimer)
  candidateTimer = null
  candidateGeneration++
}
function writeLiveAnnouncement(a) {
  const generation = ++writeGeneration
  srLive.value = ''
  if (!a) return
  nextTick(() => {
    if (!liveUnmounted && generation === writeGeneration) srLive.value = a.text
  })
}
const liveLifecycle = computed(() => {
  const s = status.value
  if (s === 'completed' || s === 'cancelled' || s === 'failed' || s === 'expired') return s
  if (mediaFailed.value) return 'media_unavailable'
  if (s === 'reconnecting' || viewer.state.value === 'reconnecting') return 'reconnecting'
  if (s === 'connecting' || viewer.state.value === 'connecting') return 'connecting'
  return 'working'
})
watch([liveLifecycle, () => live.candidates.value.length], ([lifecycle, count]) => {
  const lifecycleChanged = lifecycle !== observedLifecycle
  if (lifecycleChanged) {
    observedLifecycle = lifecycle
    cancelCandidateTimer()
    // `count` is what the SSE stream delivered, not the authoritative result:
    // a stream that never connected or dropped before the server-recovered
    // terminal observes 0 (or fewer) while Laravel projects the full verified
    // gallery. The announcer therefore never speaks a count on `completed`;
    // the count only feeds the working-state "N productos encontrados".
    writeLiveAnnouncement(liveAnnouncer.next({ lifecycle, candidateCount: count }))
    return
  }

  // A real trailing debounce: every count change replaces the single owned
  // timer. At fire time both generation and the live state/count are checked;
  // lifecycle/media/error/terminal transitions therefore always win.
  cancelCandidateTimer()
  if (lifecycle !== 'working') return
  const scheduledCount = count
  const generation = candidateGeneration
  candidateTimer = setTimeout(() => {
    candidateTimer = null
    if (liveUnmounted || generation !== candidateGeneration) return
    if (liveLifecycle.value !== 'working' || live.candidates.value.length !== scheduledCount) return
    writeLiveAnnouncement(liveAnnouncer.candidate({ lifecycle: 'working', candidateCount: scheduledCount }))
  }, 1000)
}, { flush: 'post', immediate: true })
onBeforeUnmount(() => {
  liveUnmounted = true
  cancelCandidateTimer()
  writeGeneration++
})
// Alert cards (visible) own failure announcements; green/gray stay non-live.
const cardRole = computed(() => (card.value && (card.value.tone === 'red' || card.value.tone === 'amber') ? 'alert' : undefined))
</script>

<template>
  <div class="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm w-full max-w-md">
    <!-- The panel's single hidden announcer (role=status, atomic): lifecycle
         first, debounced candidate counts only while stably working. -->
    <span class="sr-only" role="status" aria-atomic="true">{{ srLive }}</span>
    <div v-if="showVideo" :aria-busy="overlay ? 'true' : undefined" class="relative aspect-video bg-gray-900 rounded-xl overflow-hidden">
      <video ref="videoEl" autoplay playsinline muted class="w-full h-full object-contain" />
      <!-- Visual badge is decorative: the hidden announcer speaks this state. -->
      <span aria-hidden="true" class="absolute top-2 left-2 inline-flex items-center gap-1.5 bg-black/60 text-white text-[11px] font-medium px-2 py-1 rounded-full">
        <span class="w-1.5 h-1.5 rounded-full" :class="badge === 'Agente navegando' ? 'bg-green-400' : 'bg-amber-400 animate-pulse'" />
        {{ badge }}
      </span>
      <div v-if="overlay" class="absolute inset-0 flex items-center justify-center bg-black/30">
        <svg class="w-6 h-6 animate-spin text-white" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
      </div>
      <div v-else-if="mediaFailed" class="absolute inset-0 flex items-center justify-center bg-black/50">
        <p class="text-white text-xs">No se pudo cargar el video en vivo.</p>
      </div>
    </div>

    <!-- No media plane for this session. Deliberately calm and NOT an alert: the
         agent is working and its candidates keep arriving below — only the video
         is missing. The badge lives here too, so losing the video never costs the
         customer the status it was drawn on top of. -->
    <div v-else-if="showNoMedia" class="flex items-center gap-2 rounded-xl bg-gray-50 border border-gray-100 px-3 py-2">
      <span aria-hidden="true" class="inline-flex items-center gap-1.5 text-gray-700 text-[11px] font-medium">
        <span class="w-1.5 h-1.5 rounded-full" :class="badge === 'Agente navegando' ? 'bg-green-400' : 'bg-amber-400 animate-pulse'" />
        {{ badge }}
      </span>
      <span class="text-xs text-gray-500">· Sin video en esta sesión</span>
    </div>

    <!-- Progressive candidates from SSE — deduped and capped by the controller,
         kept visible through drops and terminals. Only validated https URLs
         ever reach these hrefs. -->
    <div v-if="displayCandidates.length" class="mt-3 space-y-2">
      <a v-for="(c, i) in displayCandidates" :key="c.url" :href="c.url" target="_blank" rel="noopener" class="flex items-center gap-2.5 border border-gray-100 rounded-xl p-2 hover:bg-gray-50 active:scale-[0.99] transition">
        <img v-if="c.image" :src="c.image" alt="" class="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
        <div class="min-w-0">
          <p class="text-sm text-gray-800 truncate">{{ c.title }}</p>
          <!-- priceText renders the ProductV1 money amount WITH its explicit
               currency ("129.99 USD") — never an assumed $/USD, never a raw
               object; unknown/null price renders nothing. -->
          <p class="text-xs text-gray-500 truncate">
            <span>{{ c.store }}</span><span v-if="c.priceText"> · {{ c.priceText }}</span><span v-if="c.availabilityLabel"> · {{ c.availabilityLabel }}</span>
          </p>
        </div>
      </a>
    </div>

    <div v-if="card" :role="cardRole" class="mt-3 border rounded-xl px-3 py-2.5 text-xs flex items-center justify-between gap-2" :class="cardClass[card.tone]">
      <span>{{ card.text }}</span>
      <button v-if="card.retry" class="flex-shrink-0 text-xs font-semibold underline active:scale-95 transition-transform" @click="onRetry">Reintentar</button>
    </div>
  </div>
</template>
