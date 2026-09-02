// Thin reactive wrapper over createLiveSessionController (utils/liveShopping.ts,
// where ALL the logic lives and is tested). Ticket minting goes through the
// existing $customFetch plugin — Sanctum cookie auth against api.boxly.mx; the
// ticket then rides ONLY in Authorization headers, never in a URL.
//
// TWO ID DOMAINS, never interchanged: handle.localSessionId (the Laravel row
// id) addresses ONLY the ticket route; handle.engineSessionId matches ONLY
// EventV1.session_id inside the controller.
import { ref, onBeforeUnmount, getCurrentInstance } from 'vue'
import {
  createLiveSessionController,
  claimTerminalAnnouncement,
  isTerminal,
  pageTerminalMemory,
  type Candidate,
  type EventV1,
  type SessionHandle,
  type ViewerSessionState,
  type ViewerTicket,
} from '../utils/liveShopping'

export function useLiveSession(
  handle: SessionHandle | null,
  opts: {
    mintTicket?: () => Promise<any>
    fetchSession?: () => Promise<any>
    onTerminal?: (s: string) => void
    onEvent?: (ev: EventV1) => void
  } = {}
) {
  const { $customFetch } = useNuxtApp() as any
  // POST, not GET: minting is a state-changing engine round-trip issuing a
  // short-lived credential — never cacheable/prefetchable (frozen boundary).
  const mintTicket = opts.mintTicket
    || (() => $customFetch(`/live-shopping/sessions/${handle?.localSessionId}/ticket`, { method: 'POST' }))
  // Authoritative session state. Read-only GET, used ONLY when the viewer is
  // already about to give up, so the customer is told what actually happened
  // instead of being blamed on the connection.
  const fetchSession = opts.fetchSession
    || (() => $customFetch(`/live-shopping/sessions/${handle?.localSessionId}`))

  const status = ref<ViewerSessionState>('connecting')
  const candidates = ref<Candidate[]>([])
  const ticket = ref<ViewerTicket | null>(null)
  const terminalReason = ref<string | null>(null)
  // The session genuinely ENDED (server-confirmed), as opposed to us losing the
  // transport. Tracked separately because the server's terminal carries no
  // reason code today — the fact of it is the load-bearing part.
  const terminalAuthoritative = ref(false)

  // A terminal this browser document already observed for this exact engine
  // session (a remounted panel after the conversation refresh). The controller
  // then starts terminal and silent — no mint, no stream — and the external
  // onTerminal is NOT re-fired: it was announced once when it happened. On the
  // server the page memory is inert (always null, never claims), so SSR
  // requests cannot see each other's terminals.
  const memory = pageTerminalMemory()
  const remembered = handle ? memory.get(handle.engineSessionId) : null

  const controller = createLiveSessionController({
    engineSessionId: handle?.engineSessionId || '',
    mintTicket,
    fetchSession,
    rememberedTerminal: remembered,
    onTerminalReason: (code) => { terminalReason.value = code; terminalAuthoritative.value = true },
    onStatus: (s) => {
      status.value = s
      // Only a NON-authoritative terminal (transport give-up) is announced
      // from here; an authoritative one goes through onTerminalCommitted so
      // it is announced once per session per page, never once per consumer.
      if (isTerminal(s) && !controller.isTerminalAuthoritative()) opts.onTerminal?.(s)
    },
    onTerminalCommitted: ({ status: s, errorCode }) => {
      if (!handle) return
      if (claimTerminalAnnouncement(memory, handle.engineSessionId, s, errorCode)) opts.onTerminal?.(s)
    },
    onCandidate: (c) => { candidates.value = [...candidates.value, c] },
    onTicket: (t) => { ticket.value = t },
    onEvent: opts.onEvent,
  })
  if (remembered) {
    status.value = controller.getStatus()
    terminalReason.value = controller.getTerminalReason()
    terminalAuthoritative.value = controller.isTerminalAuthoritative()
  }

  if (getCurrentInstance()) onBeforeUnmount(() => controller.stop())

  return {
    status,
    candidates,
    ticket,
    terminalReason,
    terminalAuthoritative,
    /** True when this page had already seen this session end before mount. */
    remembered: !!remembered,
    start: controller.start,
    stop: controller.stop,
    retry: controller.retry,
    getTicket: controller.getTicket,
    remintTicket: controller.remintTicket,
  }
}
