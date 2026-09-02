// Pure announcement reducers for the assistant surface and the live-shopping
// panel — dependency-free (root utils ship to the client) so every rule below
// is provable with `node --experimental-strip-types`.
//
// Contract (approved): ONE hidden role="status" aria-atomic announcer per
// surface, with DISJOINT vocabularies; failures are announced by the VISIBLE
// role="alert" surfaces and therefore never appear in these vocabularies (no
// duplicate announcements by construction). Initial render announces NOTHING.
// Announcements fire only on real state TRANSITIONS; identical consecutive
// states are silent; A→B→A legitimately re-announces A (the key changed).

export type ChatStatus = 'ready' | 'submitted' | 'streaming' | 'error'
export interface AssistantSnapshot {
  loading: boolean
  loadingOlder?: boolean
  alertVisible?: boolean
  chatStatus: ChatStatus
}
export interface Announcement { key: string; text: string }

/**
 * Assistant-surface reducer: previous+next snapshots → at most one polite
 * announcement. `prev === null` is the initial render and always yields null.
 * Failures (chatStatus 'error', load failure) yield null here — the visible
 * error toast / retry card carry role="alert" and own that announcement.
 */
export function assistantAnnouncement(prev: AssistantSnapshot | null, next: AssistantSnapshot): Announcement | null {
  if (!prev) return null // initial idle/render: silence
  // A visible alert has absolute ownership. The caller still feeds this silent
  // transition through its timer arbiter so any pending polite write is
  // cancelled before the alert is exposed.
  if (next.alertVisible) return null
  if (!prev.loading && next.loading) return { key: 'conversation_loading', text: 'Cargando conversación…' }
  // "cargada" only after a REAL load attempt finished without failing over to
  // the error toast (the caller routes failures to the visible alert instead).
  if (prev.loading && !next.loading && next.chatStatus !== 'error') return { key: 'conversation_loaded', text: 'Conversación cargada' }
  if (!prev.loadingOlder && next.loadingOlder) return { key: 'older_loading', text: 'Cargando mensajes anteriores…' }
  if (prev.loadingOlder && !next.loadingOlder) return { key: 'older_loaded', text: 'Mensajes anteriores cargados' }
  if (next.chatStatus !== prev.chatStatus) {
    if (next.chatStatus === 'submitted') return { key: 'assistant_busy', text: 'Procesando tu solicitud…' }
    if (next.chatStatus === 'streaming') return { key: 'assistant_streaming', text: 'Respondiendo…' }
    // "respuesta lista" only on a genuine busy→ready transition, never on
    // idle re-renders and never after an error (the alert already spoke).
    if (next.chatStatus === 'ready' && (prev.chatStatus === 'submitted' || prev.chatStatus === 'streaming')) {
      return { key: 'assistant_done', text: 'Respuesta lista' }
    }
  }
  return null
}

/**
 * One cancellable delayed-write slot for the assistant surface. Every observed
 * transition, including a null/alert-owned one, must call transition(). The
 * injected clock makes stale-write cancellation deterministic in unit tests.
 */
export function createAnnouncementScheduler({
  delayMs = 300,
  setTimer = setTimeout,
  clearTimer = clearTimeout,
  onClear,
  onAnnounce,
}: {
  delayMs?: number
  setTimer?: typeof setTimeout
  clearTimer?: typeof clearTimeout
  onClear: () => void
  onAnnounce: (announcement: Announcement) => void
}) {
  let timer: ReturnType<typeof setTimeout> | null = null
  function cancel() {
    if (timer !== null) clearTimer(timer)
    timer = null
    onClear()
  }
  return {
    transition(announcement: Announcement | null) {
      cancel()
      if (!announcement) return
      timer = setTimer(() => {
        timer = null
        onAnnounce(announcement)
      }, delayMs)
    },
    cancel,
    get pending() { return timer !== null },
  }
}

/**
 * Debounce-collapse for a sequence of {key, at} announcement events: an event
 * is dropped when a DIFFERENT-key event lands within debounceMs after it
 * (rapid submitted→streaming chains collapse to the latest), and when it
 * repeats the previously emitted key. This pure form is what the tests pin;
 * the component wires the identical rule through one timer.
 */
export function collapseAnnouncements(events: Array<Announcement & { at: number }>, debounceMs = 300): Array<Announcement & { at: number }> {
  const out: Array<Announcement & { at: number }> = []
  for (let i = 0; i < events.length; i++) {
    const e = events[i]
    const next = events[i + 1]
    if (next && next.key !== e.key && next.at - e.at < debounceMs) continue // superseded inside the window
    if (out.length && out[out.length - 1].key === e.key) continue // identical consecutive key: silent
    out.push(e)
  }
  return out
}

// ── Live-shopping panel ─────────────────────────────────────────────────────

export type LiveLifecycle =
  | 'connecting' | 'working' | 'reconnecting' | 'media_unavailable'
  | 'completed' | 'cancelled'
  // failed/expired exist in the session but are announced by the VISIBLE
  // role="alert" cards — the hidden announcer stays silent for them.
  | 'failed' | 'expired'

const LIVE_TERMINAL = new Set<LiveLifecycle>(['completed', 'cancelled', 'failed', 'expired'])
const LIVE_ALERT_OWNED = new Set<LiveLifecycle>(['failed', 'expired'])

// The COMPLETED announcement is deliberately count-free. The candidate count
// the panel holds is what the SSE stream happened to deliver, and that is only
// a lower bound on the authoritative result: a stream that never connected or
// dropped mid-session (live: conversations 29-31, terminal recovered from the
// server) observes 0 — or some — while Laravel projects the full verified
// gallery from the same terminal. A hidden announcer that says "0 productos
// verificados" next to a gallery of 1 is a false claim to a screen-reader
// user; the count-free text is true in every case. Working-state counts
// ("N productos encontrados") are unaffected — they describe what was seen.
export const LIVE_COMPLETED_TEXT = 'Sesión completada — los resultados verificados están en la conversación'

function liveLifecycleText(next: LiveLifecycle, _candidateCount: number): string | null {
  switch (next) {
    case 'connecting': return 'Conectando con la tienda…'
    case 'working': return 'Agente navegando en la tienda'
    case 'reconnecting': return 'Reconectando…'
    case 'media_unavailable': return 'El video no está disponible; la sesión continúa'
    case 'completed': return LIVE_COMPLETED_TEXT
    case 'cancelled': return 'Sesión cancelada'
    default: return null // failed/expired: visible alert owns the announcement
  }
}

/**
 * The live surface's ONE announcer, with the approved arbitration pinned:
 * a lifecycle/error transition always has priority and DROPS any pending
 * candidate-count announcement in the same step; the debounced count may
 * announce only while the lifecycle is stably 'working'. Initial mount is
 * silent unless the session genuinely starts ('connecting'); a panel that
 * mounts already-terminal (history) announces nothing.
 */
export function createLiveAnnouncer() {
  let lastLifecycle: LiveLifecycle | null = null
  let lastCount = 0
  return {
    next({ lifecycle, candidateCount = 0 }: { lifecycle: LiveLifecycle; candidateCount?: number }): Announcement | null {
      if (lifecycle !== lastLifecycle) {
        const initial = lastLifecycle === null
        lastLifecycle = lifecycle
        lastCount = candidateCount // lifecycle transition absorbs any simultaneous progress-count change
        if (initial && lifecycle !== 'connecting') return null // history/terminal mount: silence
        if (LIVE_ALERT_OWNED.has(lifecycle)) return null // visible alert card owns it
        const text = liveLifecycleText(lifecycle, candidateCount)
        return text ? { key: `live_${lifecycle}`, text } : null
      }
      return null
    },
    // Called only when the panel's owned 1s timer fires. Re-checking the
    // lifecycle here prevents a delayed count from crossing a terminal/error.
    candidate({ lifecycle, candidateCount = 0 }: { lifecycle: LiveLifecycle; candidateCount?: number }): Announcement | null {
      if (lifecycle === 'working' && lifecycle === lastLifecycle && candidateCount !== lastCount) {
        lastCount = candidateCount
        return { key: `live_candidates_${candidateCount}`, text: `${candidateCount} producto${candidateCount === 1 ? '' : 's'} encontrado${candidateCount === 1 ? '' : 's'}` }
      }
      return null
    },
    get terminal() { return lastLifecycle !== null && LIVE_TERMINAL.has(lastLifecycle) },
  }
}
