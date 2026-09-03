// Live shopping (P1) — ALL the pure logic for the viewer, in one dependency-free
// file so `node --experimental-strip-types` can test every branch without a
// browser or Vue. The composables (useLiveSession / useWhepViewer) are thin
// reactive wrappers over the two controllers at the bottom; nothing in here
// imports Vue or Nuxt.
//
// Transport rule (why this file exists at all): the viewer ticket must NEVER
// ride a URL — native EventSource can't send an Authorization header, so SSE is
// consumed via authenticated fetch streaming through the incremental parser
// below, and reconnects send the explicit `Last-Event-ID` header (the last
// ACCEPTED EventV1 id, not merely the last frame seen).

// ── Bounds (every external input is capped) ──────────────────────────────────

export const SSE_FRAME_BYTE_CAP = 64 * 1024
export const MAX_EVENT_ID_CHARS = 200
export const MAX_URL_CHARS = 2048
export const MAX_TICKET_CHARS = 4096
export const MAX_TICKET_TTL_MS = 60_000 // tickets are issued for ≤60s (voice-session discipline)
export const MAX_SDP_CHARS = 200_000
export const MAX_CANDIDATES_RETAINED = 24
export const MAX_PRODUCTS_PER_EVENT = 24
export const MAX_GAP_RESYNCS = 2
export const WHEP_POST_TIMEOUT_MS = 10_000
export const WHEP_DELETE_TIMEOUT_MS = 4_000

// ── SSE incremental frame parser ─────────────────────────────────────────────

export interface SSEFrame { event: string; data: string; id: string | null }

export function createSSEParser(opts: { frameByteCap?: number } = {}) {
  const cap = opts.frameByteCap ?? SSE_FRAME_BYTE_CAP
  const enc = new TextEncoder()
  let buf = ''
  let skippingLine = false // an endless line blew the cap — discard until its newline
  let dataLines: string[] = []
  let eventType = ''
  let frameId: string | null = null
  let frameBytes = 0
  let poisoned = false // frame went over the byte cap — swallow it whole, never crash
  let lastId: string | null = null
  let dropped = 0

  const resetFrame = () => { dataLines = []; eventType = ''; frameId = null; frameBytes = 0; poisoned = false }

  const dispatch = (out: SSEFrame[]) => {
    if (poisoned) { dropped++; resetFrame(); return }
    if (frameId !== null) lastId = frameId
    if (dataLines.length === 0) { resetFrame(); return } // heartbeat / comment-only frame
    out.push({ event: eventType || 'message', data: dataLines.join('\n'), id: frameId })
    resetFrame()
  }

  const field = (line: string) => {
    if (poisoned) return
    if (line.startsWith(':')) return // comment (server heartbeat)
    frameBytes += enc.encode(line).length + 1
    if (frameBytes > cap) { poisoned = true; return }
    let name = line
    let value = ''
    const i = line.indexOf(':')
    if (i !== -1) {
      name = line.slice(0, i)
      value = line.slice(i + 1)
      if (value.startsWith(' ')) value = value.slice(1)
    }
    if (name === 'data') dataLines.push(value)
    else if (name === 'event') { if (value.length <= 64) eventType = value }
    else if (name === 'id') { if (!value.includes('\u0000') && value.length <= MAX_EVENT_ID_CHARS) frameId = value }
    // 'retry' and unknown fields are ignored
  }

  return {
    /** Feed decoded text (any chunking); returns the frames completed by it.
     *  Memory is bounded even against a peer that never sends a newline: once
     *  the pending line exceeds the cap it is discarded as it streams (nothing
     *  oversized is retained) and the frame it belongs to is dropped whole. */
    feed(chunk: string): SSEFrame[] {
      const out: SSEFrame[] = []
      buf += chunk
      while (true) {
        if (skippingLine) {
          const nl = buf.indexOf('\n')
          if (nl === -1) { buf = '' ; break } // still mid-mega-line: retain NOTHING
          buf = buf.slice(nl + 1)
          skippingLine = false
          continue
        }
        const n = buf.indexOf('\n')
        const r = buf.indexOf('\r')
        if (n === -1 && r === -1) {
          // No terminator buffered — bound the pending line.
          if (buf.length > cap) { poisoned = true; skippingLine = true; buf = '' }
          break
        }
        let cut: number
        let skip = 1
        if (r !== -1 && (n === -1 || r < n)) {
          if (r === buf.length - 1) break // \r at chunk edge — may be half of \r\n
          cut = r
          skip = buf[r + 1] === '\n' ? 2 : 1
        } else {
          cut = n
        }
        const line = buf.slice(0, cut)
        buf = buf.slice(cut + skip)
        if (line === '') dispatch(out)
        else field(line)
      }
      return out
    },
    /** Last id seen on a COMPLETE, non-dropped frame (frame-level cursor). The
     *  controller resumes from its own last ACCEPTED EventV1 id instead. */
    lastEventId: () => lastId,
    droppedFrames: () => dropped,
  }
}

// ── URL / money validation (security boundary) ───────────────────────────────

/** https only (rejects javascript:, data:, http:, …), no embedded credentials,
 *  no control chars/whitespace, bounded length. Mirrors the API's
 *  ProductV1::httpsUrl (parsed, never prefix-matched). */
export function validateHttpsUrl(u: any, opts: { maxLen?: number; noHash?: boolean } = {}): string | null {
  const maxLen = opts.maxLen ?? MAX_URL_CHARS
  if (typeof u !== 'string' || !u || u.length > maxLen) return null
  if (/[\x00-\x1F\x7F\s]/.test(u)) return null
  let parsed: URL
  try { parsed = new URL(u) } catch { return null }
  if (parsed.protocol !== 'https:') return null
  if (parsed.username || parsed.password) return null
  if (opts.noHash && parsed.hash) return null
  return parsed.toString()
}

// A bounded, trimmed, control-char-free string (ProductV1::str).
function strictStr(v: any, max: number): string | null {
  if (typeof v !== 'string') return null
  const s = v.trim()
  if (!s || s.length > max) return null
  return /[\x00-\x1F\x7F]/.test(s) ? null : s
}

export interface Money { amount: number; currency: string }

/** ProductV1 money field: null (absent) | Money (valid) | 'invalid' (malformed).
 *  Frozen v1 money: exact {amount, currency} keys, numeric non-negative finite
 *  amount (numeric STRINGS rejected, not coerced), and an UPPERCASE 3-letter
 *  currency — lowercase is NOT coerced; "usd" and "USD" are different contracts
 *  and silently accepting both hides which one the engine actually sends. */
export function moneyField(m: any): Money | null | 'invalid' {
  if (m === null || m === undefined) return null
  if (typeof m !== 'object' || Array.isArray(m)) return 'invalid'
  if (Object.keys(m).some((k) => k !== 'amount' && k !== 'currency')) return 'invalid'
  if (typeof m.amount !== 'number' || !Number.isFinite(m.amount) || m.amount < 0) return 'invalid'
  if (typeof m.currency !== 'string' || !/^[A-Z]{3}$/.test(m.currency)) return 'invalid'
  return { amount: m.amount, currency: m.currency }
}

export function validateMoney(m: any): Money | null {
  const v = moneyField(m)
  return v === 'invalid' || v === null ? null : v
}

/** Render a money object as "<amount> <CURRENCY>" — its EXPLICIT currency, never an assumed $/USD. */
export function formatMoney(m: any): string | null {
  const v = validateMoney(m)
  return v ? `${v.amount} ${v.currency}` : null
}

/** The price line the panel shows: validated ProductV1 money ONLY (there is no
 *  scalar price in ProductV1); null when unknown. */
export function candidatePriceText(c: any): string | null {
  if (!c || typeof c !== 'object') return null
  return formatMoney(c.current_price) || formatMoney(c.list_price)
}

// ── ProductV1 candidates (frozen shape, mirrors API ProductV1::boundStrict) ──

export const PRODUCT_KEYS = ['store', 'store_id', 'title', 'url', 'image', 'current_price', 'list_price', 'availability', 'observed_at'] as const
export const PRODUCT_AVAILABILITY = ['in_stock', 'out_of_stock', 'preorder', 'backorder', 'unknown'] as const
export const STORE_SLUG_RE = /^[a-z0-9][a-z0-9_-]{0,39}$/

export interface Candidate {
  store: string
  store_id: string
  title: string
  url: string
  image: string | null
  current_price: Money | null
  list_price: Money | null
  availability: string | null
  observed_at: string | null
}

// Canonical frozen ProductV1 (P1, cross-repo — engine, Laravel, Nuxt agree on
// this EXACT boundary; see utils/liveShopping.golden.json for the golden
// fixtures every suite must accept):
//   · ALL nine keys present, no extras
//   · store nonblank/control-free ≤120; store_id engine slug; title ≤300
//   · url/image absolute https ≤2048, no whitespace/control/userinfo/FRAGMENT
//     (query allowed — CDN image queries are legitimate); image may be null
//   · money null OR exact {amount, currency}: finite non-negative number +
//     UPPERCASE 3-letter currency (never coerced)
//   · availability REQUIRED from the closed enum
//   · observed_at REQUIRED: strict UTC RFC3339 (optional .1-3 digit fraction,
//     Z only), parseable, and at most 5 minutes in the future
export const OBSERVED_AT_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/
export const MAX_OBSERVED_AT_FUTURE_MS = 5 * 60_000

/** STRICT canonical ProductV1. An invalid ProductV1 is NEVER salvaged into a
 *  partial candidate — it returns null. The returned object is a fresh copy of
 *  normalized values; no caller-owned reference survives into it. */
export function validateProduct(p: any, nowMs: number = Date.now()): Candidate | null {
  if (!p || typeof p !== 'object' || Array.isArray(p)) return null
  const keys = Object.keys(p)
  if (keys.length !== PRODUCT_KEYS.length) return null
  for (const k of PRODUCT_KEYS) if (!(k in p)) return null
  const url = validateHttpsUrl(p.url, { maxLen: MAX_URL_CHARS, noHash: true })
  const title = strictStr(p.title, 300)
  const store = strictStr(p.store, 120)
  const storeId = strictStr(p.store_id, 40)
  if (!url || !title || !store || !storeId || !STORE_SLUG_RE.test(storeId)) return null
  const availability = p.availability
  if (typeof availability !== 'string' || !(PRODUCT_AVAILABILITY as readonly string[]).includes(availability)) return null
  const observedAt = p.observed_at
  if (typeof observedAt !== 'string' || !OBSERVED_AT_RE.test(observedAt)) return null
  const observedMs = Date.parse(observedAt)
  if (!Number.isFinite(observedMs) || observedMs > nowMs + MAX_OBSERVED_AT_FUTURE_MS) return null
  let image: string | null = null
  if (p.image !== null) {
    image = validateHttpsUrl(p.image, { maxLen: MAX_URL_CHARS, noHash: true })
    if (!image) return null // an image key that is not null or a usable https url
  }
  const current = moneyField(p.current_price)
  const list = moneyField(p.list_price)
  if (current === 'invalid' || list === 'invalid') return null
  return { store, store_id: storeId, title, url, image, current_price: current, list_price: list, availability, observed_at: observedAt }
}

/**
 * Customer-facing text for a server-reported terminal reason.
 *
 * CLOSED mapping, never the raw code. `error_code` is server-controlled text;
 * echoing it would leak internals and read as gibberish to a shopper. Every
 * value that can reach here today is a bounded machine slug from a closed
 * vocabulary — the engine plane (store_blocked, worker_error, …), Laravel's own
 * writers (expired, engine_unavailable), and the literal 'failed' that Laravel's
 * present() sanitizer emits for anything it does not recognise.
 *
 * An UNKNOWN code still gets an honest "the session ended without finishing" —
 * which is true — rather than a connection story we cannot support. That
 * distinction is the whole point: a session the store refused and a connection
 * we dropped are different facts, and the customer was previously told the
 * wrong one.
 */
export function terminalReasonText(code: string | null | undefined): string {
  switch (code) {
    case 'store_blocked':
      return 'La tienda bloqueó la sesión en vivo, así que no pudimos verificar el producto.'
    case 'expired':
    case 'session_deadline_exceeded':
    case 'worker_ready_timeout':
      return 'La sesión en vivo se agotó antes de terminar.'
    case 'engine_unavailable':
    case 'engine_restarted':
    case 'engine_shutdown':
    case 'engine_state_lost':
    case 'worker_start_failed':
      return 'El servicio de sesiones en vivo no está disponible en este momento.'
    case 'worker_cancelled':
      return 'La sesión en vivo se canceló antes de terminar.'
    // The engine OBSERVED the retailer's own application/server error page
    // (rev 11). That is not the store blocking us, and saying so was the
    // wrong claim the old store_blocked mapping made for every failure.
    case 'store_error':
      return 'La tienda mostró un error al cargar la página, así que no pudimos verificar el producto.'
    // No evidence either way: the same honest ending as the default, made
    // explicit so the neutral code never drifts into a story we cannot support.
    case 'verification_incomplete':
      return 'La sesión en vivo terminó sin completar la verificación.'
    // A COMPLETED session whose only results missed one requested constraint
    // (engine partial_match): the products are real and verified, the caveat
    // is the point. Rendered by the completed card, not as a failure.
    case 'partial_match':
      return 'Verificamos un producto, pero no cumple todo lo que pediste; revisa los detalles antes de decidir.'
    // 'worker_error', 'failed' (the sanitizer's fallback) and anything new land
    // here deliberately: honest, and never a claim we cannot support.
    default:
      return 'La sesión en vivo terminó sin completar la verificación.'
  }
}

/** Honest es-MX availability label; null = we make no claim. */
export function availabilityText(a: any): string | null {
  switch (a) {
    case 'in_stock': return 'En stock'
    case 'out_of_stock': return 'Agotado'
    case 'preorder': return 'Preventa'
    case 'backorder': return 'Por encargo'
    default: return null
  }
}

// ── EventV1 envelope (frozen) ────────────────────────────────────────────────
// {schema_version:1, id, session_id, seq, type, occurred_at, payload}

export const EVENT_TYPES = [
  'session.created', 'worker.starting', 'worker.running', 'worker.progress',
  'candidate', 'media.publishing', 'media.ready', 'media.failed',
  'session.completed', 'session.failed', 'session.cancelling', 'session.cancelled',
] as const

export interface EventV1 {
  schemaVersion: 1
  id: string
  sessionId: string
  seq: number
  type: string
  occurredAt: string
  payload: any
}

export function parseEventV1(frame: SSEFrame, expectedSessionId: string): EventV1 | null {
  let raw: any
  try { raw = JSON.parse(frame.data) } catch { return null }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  if (raw.schema_version !== 1) return null
  const id = raw.id
  if (typeof id !== 'string' || !id || id.length > MAX_EVENT_ID_CHARS) return null
  if (frame.id !== id) return null // the SSE frame id must EXACTLY equal data.id
  if (typeof raw.session_id !== 'string' || raw.session_id !== expectedSessionId) return null
  const seq = raw.seq
  if (!Number.isInteger(seq) || seq <= 0) return null
  if (typeof raw.type !== 'string' || !(EVENT_TYPES as readonly string[]).includes(raw.type)) return null
  if (typeof raw.occurred_at !== 'string' || raw.occurred_at.length > 64 || !Number.isFinite(Date.parse(raw.occurred_at))) return null
  const payload = raw.payload
  if (payload !== undefined && (payload === null || typeof payload !== 'object' || Array.isArray(payload))) return null
  return { schemaVersion: 1, id, sessionId: raw.session_id, seq, type: raw.type, occurredAt: raw.occurred_at, payload: payload ?? {} }
}

/** candidate.payload is {output:{products:ProductV1[]}} — possibly MANY products.
 *  STRICT like the API's boundStrict: an over-cap list is a contract fault and
 *  ANY malformed product invalidates the whole delivery (returns []) — a list
 *  we cannot fully parse is not quietly shrunk into a partial one. */
export function extractCandidates(ev: EventV1, nowMs: number = Date.now()): Candidate[] {
  if (ev.type !== 'candidate') return []
  const products = ev.payload?.output?.products
  if (!Array.isArray(products) || products.length > MAX_PRODUCTS_PER_EVENT) return []
  const out: Candidate[] = []
  for (const p of products) {
    const v = validateProduct(p, nowMs)
    if (!v) return []
    out.push(v)
  }
  return out
}

/** Terminal session.* events are the ONLY terminals the stream can declare. */
export function terminalStatusFromEvent(type: string): 'completed' | 'failed' | 'cancelled' | null {
  if (type === 'session.completed') return 'completed'
  if (type === 'session.failed') return 'failed'
  if (type === 'session.cancelled') return 'cancelled'
  return null
}

export type LiveActivity = 'starting' | 'browsing' | 'cancelling' | 'media_publishing' | 'media_ready' | 'media_failed'

/** Honest UI activity per non-terminal event type (terminals go through the
 *  state machine instead). */
export function eventActivity(type: string): LiveActivity | null {
  switch (type) {
    case 'session.created':
    case 'worker.starting': return 'starting'
    case 'worker.running':
    case 'worker.progress':
    case 'candidate': return 'browsing'
    case 'session.cancelling': return 'cancelling'
    case 'media.publishing': return 'media_publishing'
    case 'media.ready': return 'media_ready'
    case 'media.failed': return 'media_failed'
    default: return null
  }
}

// ── Session state machine ────────────────────────────────────────────────────

export const SESSION_TERMINALS = ['completed', 'failed', 'cancelled', 'expired'] as const

export function isTerminal(s: unknown): boolean {
  return typeof s === 'string' && (SESSION_TERMINALS as readonly string[]).includes(s)
}

export type ViewerSessionState =
  | 'connecting' | 'streaming' | 'reconnecting'
  | 'completed' | 'failed' | 'cancelled' | 'expired'

export type SessionEvent =
  | { type: 'open' }
  | { type: 'drop' }
  | { type: 'terminal'; status: string }
  | { type: 'give_up' }   // reconnect budget exhausted
  | { type: 'expired' }   // second auth failure after the one allowed re-mint

export function nextState(current: ViewerSessionState, ev: SessionEvent): ViewerSessionState {
  if (isTerminal(current)) return current // terminals absorb everything
  switch (ev.type) {
    case 'open': return 'streaming'
    case 'drop': return 'reconnecting'
    case 'terminal': return isTerminal(ev.status) ? (ev.status as ViewerSessionState) : current
    case 'give_up': return 'failed'
    case 'expired': return 'expired'
    default: return current
  }
}

// ── Laravel public envelope + session handle (two ID domains) ────────────────

/** The Laravel public envelope, exactly: {success:true, data:{…}} → data;
 *  success:false, missing data, or any other shape → null. */
export function unwrapPublicEnvelope(raw: any): any | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  if (raw.success !== true) return null
  const data = raw.data
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null
  return data
}

// TWO ID DOMAINS — never guessed, never substituted for one another:
//  · localSessionId  — the Laravel row id; ONLY for /live-shopping/sessions/{id}/ticket
//  · engineSessionId — the engine's id; ONLY for EventV1 session_id matching
const LOCAL_ID_RE = /^[0-9]{1,18}$/
// The engine-id domain bound is Laravel's, exactly (LiveShoppingEngine::
// boundedId($id, 200)): a trimmed, non-empty string of at most 200 chars with
// no control characters. Interior spaces are legal there so they are legal
// here — this repo only ever compares the id (EventV1.session_id) or sends it
// as JSON; it never composes it into a URL. Stricter shape guesses would
// reject sessions Laravel already accepted.
const ENGINE_ID_RE = /^[^\s\x00-\x1F\x7F](?:[^\x00-\x1F\x7F]{0,198}[^\s\x00-\x1F\x7F])?$/

export interface SessionHandle { localSessionId: string; engineSessionId: string; status: string }

// The EXACT key set LiveShoppingController::present emits — nothing missing,
// nothing extra. A drifted key set means we are not speaking the contract we
// think we are, so it is rejected rather than partially read.
// The EXACT present() key set, shared by create-201 and GET show. `error_code`
// is the 9th, added in lockstep with Laravel and the engine fixtures: the DB
// held the terminal reason all along and the API simply never presented it, so
// a session that ended `store_blocked` was indistinguishable from a dropped
// connection. Nullable, and null for every non-failed session.
const CREATE_DATA_KEYS = ['id', 'status', 'engine_session_id', 'conversation_id', 'store_id', 'expires_at', 'created_at', 'updated_at', 'error_code'] as const
// L2 (multi-store, 2026-09-03): present() gains a tenth key, `stores` — one entry per
// requested store. Optional here so the parser accepts the API before and after
// that landing; any OTHER extra key is still a contract drift and is rejected.
const CREATE_DATA_OPTIONAL_KEYS = ['stores'] as const

/** Laravel's present() sanitizer emits this shape or the literal 'failed'. */
const ERROR_CODE_RE = /^[a-z0-9_]{1,40}$/

function hasExactKeys(o: any, expected: readonly string[], optional: readonly string[] = []): boolean {
  const keys = Object.keys(o)
  for (const k of expected) if (!(k in o)) return false
  for (const k of keys) if (!expected.includes(k) && !optional.includes(k)) return false
  return true
}

/** The create response, matched against LiveShoppingController::present exactly
 *  (EXACT key set; status must be "running" — the engine/API create contract
 *  accepts only running). callApi collapses {success:true,data:X} to X and
 *  returns an error envelope (no data key) whole — accept exactly those two
 *  deterministic transport forms, reject everything else. */
export function parseSessionCreateResponse(raw: any): SessionHandle | null {
  const data = raw && typeof raw === 'object' && 'success' in raw ? unwrapPublicEnvelope(raw) : raw
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null
  if (!hasExactKeys(data, CREATE_DATA_KEYS, CREATE_DATA_OPTIONAL_KEYS)) return null
  const id = data.id
  if (!Number.isInteger(id) || id <= 0) return null
  const engineId = data.engine_session_id
  if (typeof engineId !== 'string' || !ENGINE_ID_RE.test(engineId)) return null
  if (data.status !== 'running') return null
  // A session that is running has not failed, so it has no reason. A non-null
  // code here means the server is telling us two contradictory things.
  if (data.error_code !== null) return null
  return { localSessionId: String(id), engineSessionId: engineId, status: 'running' }
}

/**
 * The AUTHORITATIVE session state, from `GET /live-shopping/sessions/{id}`.
 *
 * Same 9-key `present()` shape as create, but ANY status is legal here — that is
 * the entire point. `parseSessionCreateResponse` insists on `running` because a
 * create that is not running has not started; this parser exists to answer the
 * opposite question: "what actually happened to this session?"
 *
 * Why it exists: the viewer's only terminal signals were an SSE frame or a
 * reconnect. A real session ended `store_blocked` 599ms after the browser's
 * stream had already closed, so the terminal frame was never delivered — and on
 * reload the panel re-minted, got a correct 409 "no longer live", and told the
 * customer we had lost the CONNECTION. The session had not been lost; it had
 * finished, for a reason the server knew all along. Transport trouble and a
 * finished session are different stories and the customer deserves the true one.
 */
export function parseSessionStateResponse(raw: any): { status: string; errorCode: string | null } | null {
  const data = raw && typeof raw === 'object' && 'success' in raw ? unwrapPublicEnvelope(raw) : raw
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null
  if (!hasExactKeys(data, CREATE_DATA_KEYS, CREATE_DATA_OPTIONAL_KEYS)) return null
  const status = data.status
  // Only the closed status vocabulary; never a server string rendered verbatim.
  if (typeof status !== 'string' || !/^[a-z][a-z_]{0,31}$/.test(status)) return null
  // Laravel sanitizes at the boundary (slug, or the literal 'failed'). We do NOT
  // trust that and re-gate here: this string selects customer-facing text, and a
  // value outside the closed shape falls back to null — which still renders an
  // honest "the session ended" via provenance, never a connection story.
  const rawCode = data.error_code
  const errorCode = typeof rawCode === 'string' && ERROR_CODE_RE.test(rawCode) ? rawCode : null
  // A FAILED session has a reason. A COMPLETED session may carry exactly ONE
  // caveat — partial_match (the engine verified a product that misses a
  // requested constraint) — which the panel and the gallery must still show
  // after a remount. Any other reason on a non-failed session is a
  // contradiction; drop it rather than narrate it. This is the same closed
  // vocabulary Laravel's presenter applies; both hops must keep it, because
  // four of the controller's five terminal commits come through this parser.
  return { status, errorCode: status === 'failed' ? errorCode : (status === 'completed' && errorCode === 'partial_match' ? 'partial_match' : null) }
}

/** The persisted part output the panel is allowed to boot from — both ID
 *  domains validated with their own bounds. */
export function validateSessionHandle(h: any): SessionHandle | null {
  if (!h || typeof h !== 'object') return null
  const local = h.localSessionId
  if (typeof local !== 'string' || !LOCAL_ID_RE.test(local)) return null
  const engine = h.engineSessionId
  if (typeof engine !== 'string' || !ENGINE_ID_RE.test(engine)) return null
  const status = h.status
  if (typeof status !== 'string' || !/^[a-z][a-z_.]{0,31}$/.test(status)) return null
  return { localSessionId: local, engineSessionId: engine, status }
}

/**
 * Item 3 (2026-09-03): the Laravel session id of the LAST live session in a
 * conversation (the persisted tool-live_verify handle, validated), so the
 * post-terminal refresh chain can ask the API to reconcile that session before
 * its first reload. Null when no valid handle is present.
 */
export function liveSessionIdFor(messages: any[]): string | null {
  let found: string | null = null
  for (const m of messages || []) for (const p of m?.parts || []) {
    if (p?.type !== 'tool-live_verify' || p.state !== 'output-available') continue
    const handle = validateSessionHandle(p.output)
    if (handle) found = handle.localSessionId
  }
  return found
}

// ── Viewer ticket ────────────────────────────────────────────────────────────

export interface ViewerTicket {
  ticket: string
  expiresAtMs: number
  sseUrl: string
  /** null exactly when the engine reports no media capability. */
  whepUrl: string | null
  iceServers: any[]
  /** Whether a viewer media plane exists for this session at all. */
  mediaAvailable: boolean
}

const ICE_URL_RE = /^(stun|stuns|turn|turns):/i

/** Keep only well-formed ICE entries: object, known scheme, bounded strings. */
export function validateIceServers(list: any): any[] {
  if (!Array.isArray(list)) return []
  const out: any[] = []
  for (const s of list.slice(0, 8)) {
    if (!s || typeof s !== 'object' || Array.isArray(s)) continue
    const urls = (Array.isArray(s.urls) ? s.urls : [s.urls])
      .filter((u: any) => typeof u === 'string' && u.length > 0 && u.length <= 512 && ICE_URL_RE.test(u))
    if (!urls.length) continue
    const entry: any = { urls }
    if (typeof s.username === 'string' && s.username.length <= 512) entry.username = s.username
    if (typeof s.credential === 'string' && s.credential.length <= 512) entry.credential = s.credential
    out.push(entry)
  }
  return out
}

const TICKET_DATA_KEYS = ['ticket', 'expires_at', 'sse_url', 'media_available', 'whep_url', 'ice_servers'] as const

/** Frozen v1 ticket contract: EXACTLY {ticket, expires_at, sse_url,
 *  media_available, whep_url, ice_servers} — no missing keys, no extras.
 *  Expiry must be in the future and within the ≤60s issue TTL; sse_url must be
 *  https with no credentials and no fragment.
 *
 *  media_available is a BICONDITIONAL, not a hint, and every inconsistent
 *  combination is refused rather than coerced — a ticket that claims media and
 *  carries no URL (or denies media and carries one) is a boundary we do not
 *  understand, and guessing which half to believe is how a viewer ends up
 *  connecting to nothing:
 *    true  ⇒ whep_url is a valid https URL AND ice_servers yields 1..8 entries
 *    false ⇒ whep_url is exactly null AND ice_servers is exactly []
 *
 *  false is a CAPABILITY STATE, not an error: the events stream is independent
 *  of the media plane, so the panel still runs SSE and still shows progress. */
export function validateTicket(raw: any, nowMs: number = Date.now()): ViewerTicket | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  if (!hasExactKeys(raw, TICKET_DATA_KEYS)) return null
  if (!Array.isArray(raw.ice_servers)) return null
  const { ticket, sse_url, whep_url, expires_at, media_available: mediaAvailable } = raw
  if (typeof mediaAvailable !== 'boolean') return null
  if (typeof ticket !== 'string' || !ticket || ticket.length > MAX_TICKET_CHARS) return null
  const sseUrl = validateHttpsUrl(sse_url, { noHash: true })
  if (!sseUrl) return null

  let whepUrl: string | null = null
  let iceServers: any[] = []
  if (mediaAvailable) {
    whepUrl = validateHttpsUrl(whep_url, { noHash: true })
    if (!whepUrl) return null
    iceServers = validateIceServers(raw.ice_servers)
    // A media plane with no usable ICE server cannot be reached; claiming it is
    // available would render a video box that never fills.
    if (!iceServers.length) return null
  } else {
    // Strictly null, never undefined/''/0 — "absent" and "empty" are different
    // statements about the engine, and only one of them is in the contract.
    if (whep_url !== null || raw.ice_servers.length !== 0) return null
  }

  const exp = typeof expires_at === 'number' ? expires_at : Date.parse(expires_at)
  if (!Number.isFinite(exp)) return null
  const expiresAtMs = exp < 1e12 ? exp * 1000 : exp // accept epoch-seconds or epoch-ms/ISO
  const ttl = expiresAtMs - nowMs
  if (ttl <= 0 || ttl > MAX_TICKET_TTL_MS) return null
  return { ticket, expiresAtMs, sseUrl, whepUrl, iceServers, mediaAvailable }
}

/** Refresh at half the remaining TTL; null when expired or too close to bother. */
export function ticketRefreshDelayMs(expiresAtMs: number, nowMs: number): number | null {
  const remaining = expiresAtMs - nowMs
  if (!Number.isFinite(remaining) || remaining <= 0) return null
  const d = Math.floor(remaining / 2)
  return d < 250 ? null : d
}

// ── Reconnect backoff ────────────────────────────────────────────────────────

export const MAX_RECONNECT_ATTEMPTS = 6
export const RECONNECT_CAP_MS = 15000

// ── Post-transport authority recovery ────────────────────────────────────────
// A session legitimately outlives its event stream. Two real Target runs
// (conversations 26 and 27, 2026-09-02) lasted 93-116s while the reconnect
// budget above spans ~45s: the stream gave up, the authority reads found the
// session still running, the panel blamed the connection — and the server
// completed the session and projected the verified gallery 30-60s later with
// nothing in the page ever asking again. This FINITE schedule keeps asking the
// authority after the transport gives up, then lets the honest transport story
// stand. It is not polling: four fixed reads, generation-guarded, every wait in
// the tracked timer set, cleared by stop() and by any terminal.
export const AUTHORITY_RECOVERY_DELAYS_MS: readonly number[] = Object.freeze([5000, 15000, 30000, 60000])

export function reconnectDelayMs(attempt: number): number {
  const a = Math.max(1, Math.floor(attempt))
  return Math.min(1000 * 2 ** (a - 1), RECONNECT_CAP_MS)
}

// ── WHEP request builders ────────────────────────────────────────────────────

export function buildWhepRequest(whepUrl: string, ticket: string, sdp: string) {
  return {
    url: whepUrl,
    method: 'POST' as const,
    headers: { 'Content-Type': 'application/sdp', Authorization: `Bearer ${ticket}` },
    body: sdp,
  }
}

/** Resolve the answer's Location header against the WHEP URL. The resource must
 *  land on the SAME https origin as whep_url — anything else is refused (null)
 *  and never receives a DELETE or a Bearer token. */
export function whepResourceUrl(whepUrl: string, location: string | null | undefined): string | null {
  if (!location || typeof location !== 'string' || location.length > MAX_URL_CHARS) return null
  let base: URL
  let resolved: URL
  try {
    base = new URL(whepUrl)
    resolved = new URL(location, whepUrl)
  } catch { return null }
  if (resolved.protocol !== 'https:' || resolved.origin !== base.origin) return null
  if (resolved.username || resolved.password) return null
  return resolved.toString()
}

export function buildWhepDelete(resourceUrl: string, ticket: string) {
  return { url: resourceUrl, method: 'DELETE' as const, headers: { Authorization: `Bearer ${ticket}` } }
}

/** Bounded, minimally-sane SDP answer. */
export function validateSdpAnswer(sdp: any): string | null {
  if (typeof sdp !== 'string' || sdp.length < 10 || sdp.length > MAX_SDP_CHARS) return null
  if (!sdp.startsWith('v=')) return null
  return sdp
}

// Compose the generation signal with a timeout when the platform supports it.
function composeSignal(signal: any, ms: number): any {
  try {
    const t = (AbortSignal as any).timeout?.(ms)
    if (!t) return signal
    if (!signal) return t
    const any = (AbortSignal as any).any
    return typeof any === 'function' ? any([signal, t]) : signal
  } catch { return signal }
}

// ── Live session controller (ticket + SSE lifecycle) ─────────────────────────
//
// One AbortController per viewer GENERATION owns the SSE fetch, the ticket
// refresh timer and every retry timer; stop()/start() bump the generation so
// every async completion no-ops if it belongs to a superseded generation.

export interface LiveSessionDeps {
  /** The ENGINE session id — matched against EventV1.session_id. (The Laravel
   *  localSessionId lives only inside mintTicket's URL; never here.) */
  engineSessionId: string
  /** Returns the RAW Laravel response ({success:true, data:{ticket…}}) — the
   *  controller unwraps and validates the exact public envelope itself. */
  mintTicket: () => Promise<any>
  fetchImpl?: (url: string, init: any) => Promise<any>
  setTimeoutImpl?: (fn: () => void, ms: number) => any
  clearTimeoutImpl?: (id: any) => void
  now?: () => number
  onStatus?: (s: ViewerSessionState) => void
  /** Authoritative session state, GET /live-shopping/sessions/{id}. Optional:
   *  without it the viewer behaves exactly as before. */
  fetchSession?: () => Promise<any>
  /** Fires when a terminal was recovered FROM THE SERVER rather than observed on
   *  the stream. `code` is the server's sanitized reason (present()'s nullable
   *  `error_code`) when there is one, and null when the row stored none or the
   *  value failed our re-gate. The SIGNAL is the call itself: it means "the
   *  session really did end", which is what stops the UI blaming the connection
   *  even when no reason is available. */
  onTerminalReason?: (code: string | null) => void
  /** Fires exactly once per controller when an AUTHORITATIVE terminal is
   *  committed (stream-delivered or server-recovered), after onStatus. The
   *  consumer decides whether it is the first announcement in this page
   *  (see claimTerminalAnnouncement) — a remounted or concurrent consumer
   *  must not re-trigger conversation refreshes for a terminal already seen. */
  onTerminalCommitted?: (info: { status: ViewerSessionState; errorCode: string | null }) => void
  /** A terminal this page ALREADY observed for this exact engine session
   *  (from pageTerminalMemory(), browser-only). The controller then starts in that terminal state,
   *  authoritative, and start()/retry() are no-ops: no mint, no stream. */
  rememberedTerminal?: RememberedTerminal | null
  onCandidate?: (c: Candidate) => void
  onTicket?: (t: ViewerTicket) => void
  onEvent?: (ev: EventV1) => void
}

// ── Page-lifetime terminal memory ────────────────────────────────────────────
// Live Boxly Target conversation 33 (2026-09-02): after the terminal event the
// proxy logged ~9 GET …/events within two seconds. One controller never
// reconnects after a terminal (harness L5), so those were ~9 NEW controllers:
// every terminal → conversation refresh → thread remount → a fresh panel read
// the persisted verify part (still "running"), started a stream, replayed the
// terminal and emitted it again, until the gallery was projected. This memory
// lets a remounted panel know the session already ended in this page: no
// mint, no stream, no re-announced terminal. Only the three authoritative
// engine terminals are stored, keyed by the exact engine session id, with a
// bounded, re-gated error code — never tickets, URLs, products or user data.
export interface RememberedTerminal { status: 'completed' | 'failed' | 'cancelled'; errorCode: string | null }
export const TERMINAL_MEMORY_CAP = 64
export const TERMINAL_MEMORY_MAX_CAP = 1024
export function createTerminalMemory(cap: number = TERMINAL_MEMORY_CAP) {
  // A non-integer or out-of-range cap is a programming error, never a runtime
  // input: cap=-1 would spin `while (size > cap)` forever on an empty Map and
  // cap=0 would "remember" while retaining nothing.
  if (typeof cap !== 'number' || !Number.isInteger(cap)) throw new TypeError(`terminal memory cap must be an integer, got ${String(cap)}`)
  if (cap < 1 || cap > TERMINAL_MEMORY_MAX_CAP) throw new RangeError(`terminal memory cap must be within 1..${TERMINAL_MEMORY_MAX_CAP}, got ${cap}`)
  const entries = new Map<string, RememberedTerminal>()
  const validId = (id: unknown): id is string => typeof id === 'string' && id.length > 0 && id.length <= 200
  return {
    remember(id: string, status: string, errorCode: unknown = null): boolean {
      if (!validId(id) || !isTerminal(status)) return false // transport_error/reconnecting/stopped are never terminals
      const code = typeof errorCode === 'string' && ERROR_CODE_RE.test(errorCode) ? errorCode : null
      entries.delete(id)
      // The re-gated code is kept for EVERY terminal: a completed session can
      // carry partial_match, which the remounted card must still show.
      entries.set(id, { status: status as RememberedTerminal['status'], errorCode: code })
      while (entries.size > cap) entries.delete(entries.keys().next().value as string)
      return true
    },
    get(id: unknown): RememberedTerminal | null { return validId(id) ? (entries.get(id) ?? null) : null },
    has(id: unknown): boolean { return validId(id) && entries.has(id) },
    clear(id?: unknown): void { if (id === undefined) entries.clear(); else if (validId(id)) entries.delete(id) },
    get size(): number { return entries.size },
  }
}
export type TerminalMemory = ReturnType<typeof createTerminalMemory>

// BROWSER-ONLY scope. This module is also loaded by Nitro (server/api/
// assistant.post.ts imports parseSessionCreateResponse), where module state is
// process-lifetime and shared across every request — the opposite of
// "this page". So the shared instance exists only in a browser document; on the
// server (or in plain Node) the page memory is an INERT stand-in that stores
// nothing, remembers nothing and never claims an announcement, so two SSR
// requests can never observe each other's terminals. The browser instance is
// created lazily on first use and lives exactly as long as the document does;
// forgetLiveTerminals() empties it on logout/session teardown.
const INERT_TERMINAL_MEMORY: TerminalMemory = Object.freeze({
  remember: () => false,
  get: () => null,
  has: () => false,
  clear: () => {},
  get size() { return 0 },
}) as TerminalMemory
export function isBrowserDocument(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}
let browserTerminalMemory: TerminalMemory | null = null
/** The memory the composable and the panel share IN THIS BROWSER DOCUMENT; inert anywhere else. */
export function pageTerminalMemory(): TerminalMemory {
  if (!isBrowserDocument()) return INERT_TERMINAL_MEMORY
  if (!browserTerminalMemory) browserTerminalMemory = createTerminalMemory()
  return browserTerminalMemory
}
export function rememberedTerminal(engineSessionId: unknown): RememberedTerminal | null { return pageTerminalMemory().get(engineSessionId) }
/** Session teardown hook (logout, user switch): forget every remembered terminal in this document. */
export function forgetLiveTerminals(): void { pageTerminalMemory().clear() }
/**
 * Record a terminal and say whether THIS call was the first announcement of
 * it in this page. Two consumers (a remount, or two simultaneous panels for the
 * same session) that both commit the same terminal get `true` exactly once, so
 * the external onTerminal callback — which starts conversation refreshes —
 * fires once per session per page, never once per consumer.
 */
/**
 * A.1 (2026-09-03): a panel that comes out of history ALREADY terminal by its
 * persisted handle status, with no terminal in this page's memory, has nothing
 * that says WHY it ended — the handle carries no error_code, only the API does.
 * One read-only GET of the authority (present(): status + public error_code)
 * hydrates the terminal reason so a completed partial_match session shows its
 * caveat instead of the plain green card. Null in every other case (a live or
 * remembered session, a non-terminal or malformed authority answer, a failed
 * fetch): the caller then keeps exactly what it had.
 */
export async function readHistoryTerminal(
  fetchSession: () => Promise<any>,
  handle: SessionHandle | null,
  remembered: RememberedTerminal | null,
): Promise<{ status: string; errorCode: string | null } | null> {
  if (!handle || !isTerminal(handle.status) || remembered) return null
  let raw: any
  try { raw = await fetchSession() } catch { return null }
  const state = parseSessionStateResponse(raw)
  if (!state || !isTerminal(state.status)) return null
  return { status: state.status, errorCode: state.errorCode }
}

export function claimTerminalAnnouncement(memory: TerminalMemory, engineSessionId: unknown, status: string, errorCode: unknown = null): boolean {
  if (memory.has(engineSessionId)) return false
  return memory.remember(engineSessionId as string, status, errorCode)
}

export function createLiveSessionController(deps: LiveSessionDeps) {
  const fetchImpl = deps.fetchImpl || ((url: string, init: any) => (globalThis.fetch as any)(url, init))
  const setT = deps.setTimeoutImpl || ((fn: () => void, ms: number) => setTimeout(fn, ms))
  const clearT = deps.clearTimeoutImpl || ((id: any) => clearTimeout(id))
  const now = deps.now || (() => Date.now())

  let generation = 0
  let abort: AbortController | null = null
  const timers = new Set<any>()
  let refreshTimer: any = null // SINGLE slot — overlapping mint/remint never stack schedules
  let state: ViewerSessionState = 'connecting'
  let ticket: ViewerTicket | null = null
  const candidates: Candidate[] = []
  const seenProductUrls = new Set<string>()
  const parser = createSSEParser()
  // EventV1 ordering state — survives retry() so replays dedupe and resumes are exact.
  let cursor: string | null = null // last ACCEPTED event id → Last-Event-ID header
  let lastSeq = 0
  let gapResyncs = 0
  let candidatesDropped = 0
  let terminalReason: string | null = null
  let terminalAuthoritative = false
  // TERMINAL LATCH: once an authoritative terminal is committed, every async
  // continuation (reconnect loop, backoff waits, authority recovery, a late
  // timer, retry()/start()) is dead for good — a terminal is final, whatever
  // the transport does afterwards, and a replayed terminal frame changes nothing.
  let terminalCommitted = false
  // A terminal this page already observed for this exact session: begin there.
  const remembered = deps.rememberedTerminal && isTerminal(deps.rememberedTerminal.status) ? deps.rememberedTerminal : null
  if (remembered) {
    state = remembered.status
    terminalAuthoritative = true
    terminalReason = typeof remembered.errorCode === 'string' && ERROR_CODE_RE.test(remembered.errorCode) ? remembered.errorCode : null
    terminalCommitted = true
  }

  const alive = (gen: number) => gen === generation && !terminalCommitted
  const clearTimers = () => { for (const id of timers) clearT(id); timers.clear(); refreshTimer = null }

  const setState = (gen: number, ev: SessionEvent) => {
    if (!alive(gen)) return
    const next = nextState(state, ev)
    if (next === state) return
    state = next
    deps.onStatus?.(next)
  }

  const wait = (ms: number, signal: AbortSignal) => new Promise<boolean>((resolve) => {
    const id = setT(() => { timers.delete(id); resolve(true) }, ms)
    timers.add(id)
    signal.addEventListener('abort', () => { clearT(id); timers.delete(id); resolve(false) }, { once: true })
  })

  const mint = async (gen: number): Promise<ViewerTicket | null> => {
    let raw: any
    try { raw = await deps.mintTicket() } catch { return null }
    if (!alive(gen)) return null
    // Exact public envelope: {success:true, data:{ticket…}}. success:false,
    // missing data, or malformed data all fail here — no fallbacks.
    const t = validateTicket(unwrapPublicEnvelope(raw), now())
    if (!t) return null
    ticket = t
    deps.onTicket?.(t)
    scheduleRefresh(gen, t)
    return t
  }

  const scheduleRefresh = (gen: number, t: ViewerTicket) => {
    if (refreshTimer != null) { clearT(refreshTimer); timers.delete(refreshTimer); refreshTimer = null }
    const d = ticketRefreshDelayMs(t.expiresAtMs, now())
    if (d == null) return
    const id = setT(() => {
      timers.delete(id)
      if (refreshTimer === id) refreshTimer = null
      if (!alive(gen)) return
      void mint(gen) // proactive refresh; a failure is tolerated — the SSE 401 path recovers
    }, d)
    timers.add(id)
    refreshTimer = id
  }

  /**
   * Apply an engine-delivered terminal ATOMICALLY, then notify.
   *
   * Ordering is the fix, not a weakened guard. Previously `deps.onEvent(ev)` ran
   * BEFORE `die({terminal})`, so a consumer that synchronously called `stop()`
   * inside the terminal event's own dispatch bumped the generation — and the
   * `alive(gen)` check that exists to suppress STALE runs then suppressed the
   * terminal that had already arrived on the CURRENT one. A terminal lost to its
   * own delivery.
   *
   * So the internal commit — timers cleared, state moved, provenance recorded —
   * happens first, in one uninterrupted block under the accepting generation,
   * before any external code can run. Afterwards the state machine's
   * terminals-absorb-everything rule makes a reentrant stop()/start() harmless.
   * Stale-generation safety is untouched: a terminal from a dead generation is
   * still refused at the door.
   *
   * The engine ships the reason in the event itself (payload.error_code:
   * 'store_blocked', 'worker_error', …), so an SSE terminal is as authoritative
   * as the hydrated one — and the panel can tell the customer what actually
   * happened instead of blaming the connection.
   */
  const commitTerminal = (gen: number, status: string, rawCode: any) => {
    if (!alive(gen)) return

    clearTimers()
    const next = nextState(state, { type: 'terminal', status })
    const changed = next !== state
    state = next
    terminalAuthoritative = true
    terminalCommitted = true
    // Re-gated with the SAME bound as the hydration path: this string selects
    // customer-facing copy and arrives from outside.
    terminalReason = typeof rawCode === 'string' && ERROR_CODE_RE.test(rawCode) ? rawCode : null

    // Only now does anything external run.
    deps.onTerminalReason?.(terminalReason)
    if (changed) deps.onStatus?.(state)
    deps.onTerminalCommitted?.({ status: state, errorCode: terminalReason })
  }

  const acceptEvent = (ev: EventV1): 'accept' | 'duplicate' | 'gap' => {
    if (lastSeq > 0 && ev.seq <= lastSeq) return 'duplicate' // replayed / reordered — never re-applied
    if (lastSeq > 0 && ev.seq > lastSeq + 1) {
      if (gapResyncs < MAX_GAP_RESYNCS) { gapResyncs++; return 'gap' }
      // Resync budget exhausted: accept the jump rather than looping forever.
    }
    lastSeq = ev.seq
    cursor = ev.id
    gapResyncs = 0
    return 'accept'
  }

  const run = async (gen: number, ac: AbortController) => {
    // ANY terminal exit clears the generation's timers — a dead session must
    // leave no pending ticket refresh behind.
    const die = (ev: SessionEvent) => { clearTimers(); setState(gen, ev) }

    // Before blaming the transport, ASK THE SERVER what happened.
    //
    // A real session ended `store_blocked` 599ms after this browser's stream had
    // already closed, so the terminal frame was never delivered here. On reload
    // the panel re-minted, got a correct 409 "no longer live", and told the
    // customer the CONNECTION had failed. It had not: the session was over, and
    // the server knew why. A persisted terminal outranks a transport symptom
    // every time — the transport story is only honest when nothing authoritative
    // can be recovered.
    //
    // Bounded by construction: ONE request, no retry, no loop, and it runs only
    // on a path that was already about to end the session.
    let authorityFetch: Promise<{ status: string; errorCode: string | null } | null> | null = null
    let authorityFetches = 0
    let outcomeHintReconciled = false
    let outcomeHintWasNonterminal = false
    const fetchAuthority = () => {
      if (authorityFetch) return authorityFetch
      if (authorityFetches >= 2) return Promise.resolve(null)
      authorityFetches++
      {
        authorityFetch = (async () => {
          try { return parseSessionStateResponse(await deps.fetchSession!()) } catch { return null }
        })()
      }
      return authorityFetch
    }
    const reconcileOutcome = async () => {
      if (!deps.fetchSession || outcomeHintReconciled) return
      outcomeHintReconciled = true
      const recovered = await fetchAuthority()
      if (!alive(gen)) return
      if (recovered && isTerminal(recovered.status)) commitTerminal(gen, recovered.status, recovered.errorCode)
      else { outcomeHintWasNonterminal = true; authorityFetch = null }
    }
    const reconcileTransport = async (): Promise<boolean> => {
      if (!deps.fetchSession) return false
      const recovered = await fetchAuthority()
      if (!alive(gen)) return true
      if (recovered && isTerminal(recovered.status)) {
        commitTerminal(gen, recovered.status, recovered.errorCode)
        return true
      }
      // A reconnecting transport is another bounded reconciliation boundary:
      // permit the one remaining read to observe a terminal persisted just
      // after the first read, but never create a polling loop.
      authorityFetch = null
      return false
    }
    // One UNCAPPED authority read for the recovery schedule below. The cap on
    // fetchAuthority protects the reconnect loop from re-asking per attempt;
    // the schedule has its own fixed bound (AUTHORITY_RECOVERY_DELAYS_MS).
    const readAuthority = async () => {
      try { return parseSessionStateResponse(await deps.fetchSession!()) } catch { return null }
    }
    const dieWithAuthority = async (fallback: SessionEvent, { recover = false }: { recover?: boolean } = {}) => {
      if (deps.fetchSession) {
        let recovered = await fetchAuthority()
        // An outcome hint may race persistence of the terminal row. If its
        // first authority read was nonterminal, spend the one remaining GET
        // only when transport later gives up; never let that early answer
        // poison terminal recovery indefinitely.
        if (outcomeHintWasNonterminal && alive(gen)) recovered = await fetchAuthority()
        if (!alive(gen)) return
        if (recovered && isTerminal(recovered.status)) {
          // Same atomic commit as the SSE path. Setting the reason and calling
          // onTerminalReason BEFORE the state transition reintroduced W3 here:
          // a consumer that synchronously stop()s inside that callback bumps the
          // generation, setState is suppressed, and the session records a reason
          // while its STATUS never becomes terminal. One commit discipline, both
          // paths — the errorCode re-gate is idempotent with the one
          // parseSessionStateResponse already applied.
          commitTerminal(gen, recovered.status, recovered.errorCode)
          return
        }
        if (recover) {
          // The transport is abandoned but the session may still be RUNNING
          // (real runs outlive the reconnect budget by a minute). Keep asking
          // the authority on the fixed schedule; a terminal found here commits
          // through the SAME path as an SSE terminal, so consumers see exactly
          // one terminal and the conversation refresh they already wire to it.
          // The viewer ticket exists only to stream, so its refresh stops now;
          // these reads use the app's own auth and may outlive any ticket.
          if (refreshTimer != null) { clearT(refreshTimer); timers.delete(refreshTimer); refreshTimer = null }
          for (const delayMs of AUTHORITY_RECOVERY_DELAYS_MS) {
            const fired = await wait(delayMs, ac.signal)
            if (!fired || !alive(gen)) return
            const late = await readAuthority()
            if (!alive(gen)) return
            if (late && isTerminal(late.status)) { commitTerminal(gen, late.status, late.errorCode); return }
          }
        }
      }
      die(fallback) // nothing authoritative to recover ⇒ the honest transport error stands
    }
    let t = ticket || await mint(gen)
    if (!alive(gen)) return
    if (!t) { await dieWithAuthority({ type: 'give_up' }); return }
    let attempts = 0
    let reminted = false
    while (alive(gen)) {
      t = ticket || t // reconnects always use the freshest ticket
      try {
        const headers: Record<string, string> = { Accept: 'text/event-stream', Authorization: `Bearer ${t.ticket}` }
        if (cursor) headers['Last-Event-ID'] = cursor // resume from the last ACCEPTED event
        const res = await fetchImpl(t.sseUrl, { headers, signal: ac.signal })
        if (!alive(gen)) return
        if (res.status === 401) {
          // ONE re-mint + retry; a second auth failure is an honest "Sesión expirada".
          if (reminted) { await dieWithAuthority({ type: 'expired' }); return }
          reminted = true
          const nt = await mint(gen)
          if (!alive(gen)) return
          if (!nt) { await dieWithAuthority({ type: 'expired' }); return }
          t = nt
          continue
        }
        if (!res.ok || !res.body) throw new Error(`sse http ${res.status}`)
        setState(gen, { type: 'open' })
        // NOTE: attempts is NOT reset here. A 200 that closes without any
        // accepted event must burn the finite budget — resetting on headers
        // would let a 200-then-EOF peer reconnect forever. The budget resets
        // only on accepted forward progress (below).
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let resync = false
        while (true) {
          const { done, value } = await reader.read()
          if (!alive(gen)) { try { reader.cancel() } catch {} return }
          const text = decoder.decode(value || new Uint8Array(), { stream: !done })
          for (const frame of parser.feed(text)) {
            const ev = parseEventV1(frame, deps.engineSessionId)
            if (!ev) continue // schema violation ⇒ dropped, never applied
            const verdict = acceptEvent(ev)
            if (verdict === 'duplicate') continue
            if (verdict === 'gap') { resync = true; break } // reconnect + replay from cursor — never accept reordered data silently
            attempts = 0 // accepted forward progress — the instability budget resets HERE, not on headers
            reminted = false
            const term = terminalStatusFromEvent(ev.type)
            if (term) {
              // Commit BEFORE notifying: see commitTerminal. A consumer that
              // stop()s inside this dispatch can no longer suppress it.
              commitTerminal(gen, term, ev.payload?.error_code)
              try { reader.cancel() } catch {}
              deps.onEvent?.(ev)
              return
            }
            if (ev.type === 'worker.progress' && ev.payload?.phase === 'outcome'
              && (ev.payload?.outcome === 'blocked' || ev.payload?.outcome === 'error')) {
              // Worker outcome is a terminal hint; Laravel remains the
              // authority that can declare the session terminal.
              void reconcileOutcome()
            }
            deps.onEvent?.(ev)
            if (ev.type === 'candidate') {
              for (const p of extractCandidates(ev, now())) {
                const url = String(p.url)
                if (seenProductUrls.has(url)) continue // dedupe by product URL across replays
                if (candidates.length >= MAX_CANDIDATES_RETAINED) { candidatesDropped++; continue }
                seenProductUrls.add(url)
                candidates.push(p)
                deps.onCandidate?.(p)
              }
            }
          }
          if (resync) { try { reader.cancel() } catch {} break }
          if (done) break
        }
        // Server closed the stream without a terminal event (or we forced a
        // gap resync) ⇒ fall through to the reconnect path.
      } catch {
        if (ac.signal.aborted || !alive(gen)) return
      }
      // A worker outcome is the signal that persistence may be racing us. In
      // that case, refresh at the first subsequent transport boundary so the
      // panel need not wait through the full reconnect budget. Ordinary
      // transport failures retain the single give-up authority read.
      if (outcomeHintWasNonterminal && await reconcileTransport()) return
      attempts++
      if (attempts > MAX_RECONNECT_ATTEMPTS) { await dieWithAuthority({ type: 'give_up' }, { recover: true }); return }
      setState(gen, { type: 'drop' })
      const fired = await wait(reconnectDelayMs(attempts), ac.signal)
      if (!fired || !alive(gen)) return
    }
  }

  const stop = () => {
    generation++
    clearTimers()
    try { abort?.abort() } catch {}
    abort = null
  }

  const start = () => {
    if (terminalCommitted) return // a terminal is final: no re-mint, no new stream
    stop()
    const gen = ++generation
    abort = new AbortController()
    state = 'connecting'
    deps.onStatus?.('connecting')
    void run(gen, abort)
  }

  return {
    start,
    stop,
    /** Reintentar: fresh ticket + SSE for the SAME session; candidates, the seq
     *  baseline and the accepted-event cursor are kept, so nothing duplicates. */
    retry: () => { ticket = null; start() },
    getStatus: () => state,
    getTerminalReason: () => terminalReason,
    /** True when the terminal state came from the server, not from giving up. */
    isTerminalAuthoritative: () => terminalAuthoritative,
    getCandidates: () => candidates.slice(),
    getTicket: () => ticket,
    getLastEventId: () => cursor,
    getDroppedCandidates: () => candidatesDropped,
    /** For the WHEP viewer's full-reconnect cycle. Throws if minting fails. */
    remintTicket: async (): Promise<ViewerTicket> => {
      const t = await mint(generation)
      if (!t) throw new Error('ticket_mint_failed')
      return t
    },
  }
}

// ── WHEP viewer controller ───────────────────────────────────────────────────
//
// Recovery on ICE failed/closed is ONE FULL viewer reconnect — restartIce()
// alone is not recovery without WHEP renegotiation support: DELETE the WHEP
// resource (when a same-origin Location was provided), close the PC, re-mint
// the ticket, create a NEW PC, POST a NEW offer. Recovery is SINGLE-FLIGHT —
// overlapping failed/closed callbacks in one generation cannot double-recover.
// Teardown always DELETEs the resource when known, then closes the PC.

// 'unavailable' is distinct from 'failed' on purpose: no media plane was ever
// offered (media_available:false), so nothing broke and nothing will retry.
// 'failed' stays reserved for media that WAS promised and then did not work.
export type WhepState = 'idle' | 'connecting' | 'playing' | 'reconnecting' | 'failed' | 'closed' | 'unavailable'

export interface WhepDeps {
  getTicket: () => ViewerTicket | null
  remintTicket: () => Promise<ViewerTicket>
  fetchImpl?: (url: string, init: any) => Promise<any>
  createPeerConnection?: (cfg: any) => any
  onTrack?: (stream: any) => void
  onState?: (s: WhepState) => void
}

export function createWhepViewerController(deps: WhepDeps) {
  const fetchImpl = deps.fetchImpl || ((url: string, init: any) => (globalThis.fetch as any)(url, init))
  const createPC = deps.createPeerConnection || ((cfg: any) => new (globalThis as any).RTCPeerConnection(cfg))

  let generation = 0
  let abort: AbortController | null = null
  let pc: any = null
  let resourceUrl: string | null = null
  let resourceTicket: string | null = null
  let reconnected = false
  let recovering = false // single-flight guard
  let state: WhepState = 'idle'

  const alive = (g: number) => g === generation
  const setState = (g: number, s: WhepState) => {
    if (!alive(g) || state === s) return
    state = s
    deps.onState?.(s)
  }

  const deleteResource = async (signal: any) => {
    if (!resourceUrl || !resourceTicket) return
    const req = buildWhepDelete(resourceUrl, resourceTicket)
    resourceUrl = null
    try { await fetchImpl(req.url, { method: req.method, headers: req.headers, signal }) } catch {}
  }

  const teardownPeer = async () => {
    if (pc) pc.oniceconnectionstatechange = null // closing fires 'closed' — don't self-recover
    // DELETE first (frees the server-side viewer slot), then close; the DELETE
    // rides the generation signal plus its own bounded timeout.
    await deleteResource(composeSignal(abort?.signal, WHEP_DELETE_TIMEOUT_MS))
    try { pc?.close() } catch {}
    pc = null
  }

  const connect = async (g: number, ticketOverride?: ViewerTicket) => {
    let t = ticketOverride || deps.getTicket()
    if (!t) t = await deps.remintTicket()
    if (!alive(g)) return
    // No media plane on this ticket ⇒ there is nothing to connect to. The panel
    // already gates on mediaAvailable; this is the second lock, so a null URL
    // can never reach buildWhepRequest no matter what a caller does. Not an
    // error state: media is optional, and the events stream is unaffected.
    if (!t.whepUrl) { setState(g, 'unavailable'); return }
    setState(g, 'connecting')
    pc = createPC({ iceServers: t.iceServers })
    pc.ontrack = (e: any) => { if (alive(g) && e?.streams?.[0]) deps.onTrack?.(e.streams[0]) }
    pc.oniceconnectionstatechange = () => {
      if (!alive(g) || !pc) return
      const s = pc.iceConnectionState
      if (s === 'failed' || s === 'closed') void recover(g)
    }
    pc.addTransceiver('video', { direction: 'recvonly' })
    const offer = await pc.createOffer()
    if (!alive(g)) return
    await pc.setLocalDescription(offer)
    if (!alive(g)) return
    const req = buildWhepRequest(t.whepUrl, t.ticket, offer.sdp)
    const res = await fetchImpl(req.url, { method: req.method, headers: req.headers, body: req.body, signal: composeSignal(abort?.signal, WHEP_POST_TIMEOUT_MS) })
    if (!alive(g)) return
    if (!res.ok) throw new Error(`whep http ${res.status}`)
    const location = res.headers?.get?.('Location') || res.headers?.get?.('location')
    if (location) {
      // A Location that is not same-origin https is a protocol violation: refuse
      // the whole exchange — we will not manage (or Bearer-authenticate) a
      // resource on an origin the ticket never named.
      const ru = whepResourceUrl(t.whepUrl, location)
      if (!ru) throw new Error('whep_location_rejected')
      resourceUrl = ru
      resourceTicket = t.ticket
    } else {
      resourceUrl = null
      resourceTicket = null
    }
    const answer = validateSdpAnswer(await res.text())
    if (!alive(g)) return
    if (!answer) throw new Error('whep_bad_answer')
    await pc.setRemoteDescription({ type: 'answer', sdp: answer })
    if (!alive(g)) return
    setState(g, 'playing')
  }

  const recover = async (g: number) => {
    if (!alive(g) || recovering) return // single-flight
    recovering = true
    try {
      if (reconnected) { setState(g, 'failed'); await teardownPeer(); return }
      reconnected = true
      setState(g, 'reconnecting')
      await teardownPeer()
      if (!alive(g)) return
      try {
        const t = await deps.remintTicket()
        if (!alive(g)) return
        await connect(g, t)
      } catch {
        if (alive(g)) { setState(g, 'failed'); await teardownPeer() }
      }
    } finally {
      recovering = false
    }
  }

  const stop = () => {
    generation++
    try { abort?.abort() } catch {}
    abort = null
    const oldPc = pc
    if (oldPc) oldPc.oniceconnectionstatechange = null
    pc = null
    const url = resourceUrl
    const tk = resourceTicket
    resourceUrl = null
    resourceTicket = null
    // Same discipline as live teardown: DELETE the resource, THEN close the PC.
    // The generation signal is already aborted, so this DELETE deterministically
    // retires on its own bounded timeout instead.
    const close = () => { try { oldPc?.close() } catch {} }
    if (url && tk) {
      const req = buildWhepDelete(url, tk)
      let p: any = null
      try { p = fetchImpl(req.url, { method: req.method, headers: req.headers, signal: composeSignal(null, WHEP_DELETE_TIMEOUT_MS) }) } catch {}
      Promise.resolve(p).then(close, close)
    } else {
      close()
    }
    state = 'closed'
    deps.onState?.('closed')
  }

  const start = () => {
    if (pc || abort) stop()
    const g = ++generation
    abort = new AbortController()
    reconnected = false
    recovering = false
    void connect(g).catch(() => { if (alive(g)) void recover(g) })
  }

  return { start, stop, getState: () => state, getResourceUrl: () => resourceUrl }
}

/**
 * Copy for a live_verify part that is NOT a session handle. A store the engine
 * does not support is an actionable state (offer the supported stores); every
 * other failure keeps the generic "not available right now" line. Names are
 * bounded and only ever come from our own catalog result.
 */
export function liveFailureCopy(output: unknown): string {
  const o = output as any
  if (o && typeof o === 'object' && o.error === 'store_not_supported') {
    const names = Array.isArray(o.supported)
      ? o.supported.filter((n: unknown) => typeof n === 'string' && (n as string).trim()).map((n: string) => n.trim().slice(0, 60)).slice(0, 8)
      : []
    return names.length
      ? `Boxly aún no puede verificar en vivo en esa tienda. Puedo intentarlo en: ${names.join(', ')}.`
      : 'Boxly aún no puede verificar en vivo en esa tienda.'
  }
  if (o && typeof o === 'object' && o.error === 'live_capability_unavailable') {
    return 'La verificación en vivo no está disponible en este momento; puedo seguir ayudándote de otra forma.'
  }
  return 'La sesión en vivo no está disponible en este momento. Intenta de nuevo en un rato.'
}

/**
 * Visible label for a persisted live-results gallery whose products missed a
 * requested constraint (engine caveat partial_match, carried on the part by
 * Laravel). Empty for a full match, so the gallery renders exactly as today.
 */
export function liveResultsCaveat(output: unknown): string {
  const o = output as any
  return o && typeof o === 'object' && o.caveat === 'partial_match'
    ? 'Verificado en la tienda, pero no cumple todo lo que pediste — revisa los detalles antes de decidir.'
    : ''
}
