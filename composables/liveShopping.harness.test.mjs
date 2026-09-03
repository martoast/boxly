/**
 * Lifecycle harness for the live-shopping controllers — the hard-to-reach
 * behaviours, driven with injected fetch/timers/PeerConnection (no browser,
 * no Vue, no new deps) over REAL frozen EventV1 fixtures:
 *
 *   · terminal session.completed ⇒ full teardown ORDERING (WHEP DELETE before
 *     pc.close, terminal state shown, SSE-held candidates kept, zero timers)
 *   · unmount mid-reconnect ⇒ one abort cancels everything, zero timers left
 *   · stale generation ⇒ a late ticket/SDP completion from generation N is a
 *     no-op after generation N+1 (or a stop) — state never mutates
 *   · 401 mid-session ⇒ EXACTLY one re-mint, then the honest expired state
 *   · ICE failure ⇒ ONE full viewer reconnect (DELETE → close → re-mint →
 *     new PC → new offer), SINGLE-FLIGHT under concurrent callbacks, and a
 *     second failure ⇒ failed
 *   · seq GAP ⇒ reconnect + replay from the accepted cursor, with duplicate
 *     events and duplicate product URLs deduped; retention cap enforced
 *   · hostile cross-origin WHEP Location ⇒ refused, no DELETE/Bearer sent there
 *
 *   node --experimental-strip-types composables/liveShopping.harness.test.mjs
 */
import { AUTHORITY_RECOVERY_DELAYS_MS, createLiveSessionController, createWhepViewerController, MAX_CANDIDATES_RETAINED, MAX_RECONNECT_ATTEMPTS, terminalReasonText, createTerminalMemory, claimTerminalAnnouncement, pageTerminalMemory, rememberedTerminal, forgetLiveTerminals, isBrowserDocument, TERMINAL_MEMORY_MAX_CAP } from '../utils/liveShopping.ts'

let pass = 0
let fail = 0
const check = (name, cond, detail = '') => {
  if (cond) { console.log(`  ✓ ${name}`); pass++ }
  else { console.log(`  ✗ ${name}  ${detail}`); fail++ }
}
const flush = async (n = 25) => { for (let i = 0; i < n; i++) await new Promise((r) => setImmediate(r)) }

const SID = 'sess-1'

// ── fakes ────────────────────────────────────────────────────────────────────

function fakeTimers() {
  const pending = new Map()
  let next = 1
  return {
    set: (fn, ms) => { const id = next++; pending.set(id, { fn, ms }); return id },
    clear: (id) => pending.delete(id),
    count: () => pending.size,
    fireAll: () => { for (const [id, t] of [...pending]) { pending.delete(id); t.fn() } },
  }
}

function sseStream() {
  const queue = []
  let closed = false
  let notify = null
  return {
    push(text) { queue.push(new TextEncoder().encode(text)); notify?.(); notify = null },
    close() { closed = true; notify?.(); notify = null },
    response: {
      ok: true,
      status: 200,
      body: {
        getReader: () => ({
          read: async () => {
            while (queue.length === 0 && !closed) await new Promise((r) => { notify = r })
            if (queue.length) return { done: false, value: queue.shift() }
            return { done: true, value: undefined }
          },
          cancel: () => { closed = true; notify?.(); notify = null },
        }),
      },
    },
  }
}

// Frozen EventV1 fixture rendered as an SSE frame (SSE id === data.id).
const evSSE = (id, seq, type, payload) => {
  const body = { schema_version: 1, id, session_id: SID, seq, type, occurred_at: '2026-08-31T18:00:00Z' }
  if (payload !== undefined) body.payload = payload
  return `id: ${id}\ndata: ${JSON.stringify(body)}\n\n`
}
const candPayload = (...products) => ({ output: { products } })
// Full CANONICAL ProductV1 — all nine keys present (strict validation rejects
// the whole delivery otherwise; utils tests prove that — here every fixture
// must be valid so the lifecycle under test is reachable). observed_at is a
// strict-RFC3339 recent-past instant relative to the controller's real clock.
const prod = (n) => ({
  store: 'Store Example',
  store_id: 'store_example',
  title: `Producto ${n}`,
  url: `https://store.example/p/${n}`,
  image: null,
  current_price: { amount: n, currency: 'USD' },
  list_price: null,
  availability: 'in_stock',
  observed_at: new Date(Date.now() - 1000).toISOString(),
})

// What the Laravel ticket endpoint ACTUALLY returns (LiveShoppingController::
// ticket): the public envelope {success:true, data:{ticket…}} with an ISO
// expires_at — mintTicket deps hand this whole wrapper to the controller,
// which unwraps and validates it itself.
const rawTicket = (n = 1) => ({
  success: true,
  data: {
    ticket: `tk-${n}`,
    expires_at: new Date(Date.now() + 45_000).toISOString(),
    sse_url: 'https://engine.boxly.mx/sse',
    media_available: true,
    whep_url: 'https://engine.boxly.mx/whep',
    ice_servers: [{ urls: 'stun:stun.example.com' }],
  },
})
// The SAME envelope from an engine with no publisher: events, no media plane.
const rawTicketNoMedia = (n = 1) => ({
  success: true,
  data: {
    ticket: `tk-${n}`,
    expires_at: new Date(Date.now() + 45_000).toISOString(),
    sse_url: 'https://engine.boxly.mx/sse',
    media_available: false,
    whep_url: null,
    ice_servers: [],
  },
})
// Validated ViewerTicket shape — what getTicket/remintTicket deps hand the
// WHEP controller (the session controller validates before exposing).
const vTicket = (n = 1) => ({
  ticket: `tk-${n}`,
  expiresAtMs: Date.now() + 45_000,
  sseUrl: 'https://engine.boxly.mx/sse',
  whepUrl: 'https://engine.boxly.mx/whep',
  iceServers: [{ urls: 'stun:stun.example.com' }],
  mediaAvailable: true,
})
/** A validated ticket from an engine with no media plane. */
const vTicketNoMedia = (n = 1) => ({ ...vTicket(n), whepUrl: null, iceServers: [], mediaAvailable: false })

function fakePC(log, label) {
  return {
    label,
    ontrack: null,
    oniceconnectionstatechange: null,
    iceConnectionState: 'new',
    localDescription: null,
    addTransceiver: () => {},
    createOffer: async () => ({ type: 'offer', sdp: `v=0 offer ${label}` }),
    setLocalDescription: async function (o) { this.localDescription = o },
    setRemoteDescription: async function () { log.push(`setRemote:${label}`) },
    close: function () { log.push(`close:${label}`) },
  }
}

// whep fetch: POST → answer with Location; DELETE → logged
function whepFetch(log, opts = {}) {
  return async (url, init) => {
    if (init?.method === 'DELETE') {
      log.push(`delete:${url}`)
      return { ok: true, status: 200 }
    }
    log.push(`post:${url}`)
    return {
      ok: true,
      status: 201,
      headers: { get: (k) => (k.toLowerCase() === 'location' ? (opts.location ?? '/whep/res-1') : null) },
      text: async () => 'v=0\r\no=- fake answer 1 1',
    }
  }
}

// ── A. terminal event ⇒ full teardown ordering ───────────────────────────────
console.log('Terminal session.completed ⇒ teardown ordering')
{
  const timers = fakeTimers()
  const log = []
  const stream = sseStream()
  const statuses = []
  const candidates = []
  const eventTypes = []
  let mintCalls = 0

  const session = createLiveSessionController({
    engineSessionId: SID,
    mintTicket: async () => { mintCalls++; return rawTicket(mintCalls) },
    fetchImpl: async (url, init) => {
      check('SSE request carries Bearer header, ticket not in URL', init.headers.Authorization?.startsWith('Bearer tk-') && !url.includes('tk-'), url)
      return stream.response
    },
    setTimeoutImpl: timers.set,
    clearTimeoutImpl: timers.clear,
    onStatus: (s) => { statuses.push(s); if (['completed', 'failed', 'cancelled', 'expired'].includes(s)) viewer.stop() },
    onCandidate: (c) => candidates.push(c),
    onEvent: (ev) => eventTypes.push(ev.type),
  })
  const viewer = createWhepViewerController({
    getTicket: session.getTicket,
    remintTicket: session.remintTicket,
    fetchImpl: whepFetch(log),
    createPeerConnection: () => fakePC(log, 'pc1'),
  })

  session.start()
  await flush()
  check('SSE connects and streams', statuses.includes('streaming'))
  viewer.start()
  await flush()
  check('viewer playing after SDP answer', viewer.getState() === 'playing' && log.includes('setRemote:pc1'))

  stream.push(evSSE('e1', 1, 'worker.running'))
  stream.push(evSSE('e2', 2, 'candidate', candPayload(prod(1), prod(2))))
  await flush()
  check('worker/candidate events surfaced with honest types', eventTypes.includes('worker.running') && eventTypes.includes('candidate'))
  check('multi-product candidate lands as MULTIPLE candidates', candidates.length === 2 && candidates[0].title === 'Producto 1')

  stream.push(evSSE('e3', 3, 'session.completed'))
  await flush()

  check('terminal state reached', session.getStatus() === 'completed' && statuses[statuses.length - 1] === 'completed')
  const del = log.findIndex((l) => l.startsWith('delete:'))
  const close = log.findIndex((l) => l.startsWith('close:'))
  check('teardown DELETEs the WHEP resource BEFORE closing the PC', del !== -1 && close !== -1 && del < close, JSON.stringify(log))
  check('DELETE hit the same-origin resolved Location resource', log[del] === 'delete:https://engine.boxly.mx/whep/res-1')
  check('SSE-held candidates survive the terminal (panel keeps them)', candidates.length === 2)
  check('zero timers left after terminal', timers.count() === 0, `left=${timers.count()}`)
  check('cursor is the last ACCEPTED event id', session.getLastEventId() === 'e3')
}

// ── B. unmount mid-reconnect ⇒ abort cancels everything ──────────────────────
console.log('Unmount mid-reconnect')
{
  const timers = fakeTimers()
  let fetches = 0
  const statuses = []
  const session = createLiveSessionController({
    engineSessionId: SID,
    mintTicket: async () => rawTicket(),
    fetchImpl: async () => { fetches++; throw new Error('network down') },
    setTimeoutImpl: timers.set,
    clearTimeoutImpl: timers.clear,
    onStatus: (s) => statuses.push(s),
  })
  session.start()
  await flush()
  check('drop enters reconnecting with a pending backoff timer', statuses.includes('reconnecting') && timers.count() > 0)
  const before = fetches
  session.stop() // the unmount
  await flush()
  check('stop clears EVERY pending timer', timers.count() === 0, `left=${timers.count()}`)
  timers.fireAll()
  await flush()
  check('no further fetches after unmount', fetches === before)
}

// ── C. stale generation ⇒ late completions are no-ops ────────────────────────
console.log('Stale-generation guards')
{
  const timers = fakeTimers()
  let resolveMint
  const events = []
  const session = createLiveSessionController({
    engineSessionId: SID,
    mintTicket: () => new Promise((r) => { resolveMint = r }),
    fetchImpl: async () => { events.push('fetch'); throw new Error('unreachable') },
    setTimeoutImpl: timers.set,
    clearTimeoutImpl: timers.clear,
    onStatus: (s) => events.push(`status:${s}`),
    onTicket: () => events.push('ticket'),
  })
  session.start()
  await flush()
  session.stop()
  resolveMint(rawTicket()) // generation N's mint lands after generation N+1 began
  await flush()
  check('late ticket mint is a no-op (no ticket/status/fetch)', !events.includes('ticket') && !events.includes('fetch') && events.filter((e) => e !== 'status:connecting').length === 0, JSON.stringify(events))
  check('no timers scheduled by the stale mint', timers.count() === 0)

  const log = []
  let resolvePost
  const viewer = createWhepViewerController({
    getTicket: () => null,
    remintTicket: async () => vTicket(),
    fetchImpl: (url, init) => (init?.method === 'DELETE' ? Promise.resolve({ ok: true }) : new Promise((r) => { resolvePost = r })),
    createPeerConnection: () => fakePC(log, 'pcX'),
  })
  viewer.start()
  await flush()
  viewer.stop()
  resolvePost({ ok: true, status: 201, headers: { get: () => null }, text: async () => 'v=0\r\nlate answer arrives' })
  await flush()
  check('late SDP answer never reaches the PC', !log.includes('setRemote:pcX'), JSON.stringify(log))
  check('viewer stays closed', viewer.getState() === 'closed')
}

// ── D. 401 mid-session ⇒ exactly one re-mint ─────────────────────────────────
console.log('401 ⇒ exactly one re-mint')
{
  const timers = fakeTimers()
  let mintCalls = 0
  const statuses = []
  const session = createLiveSessionController({
    engineSessionId: SID,
    mintTicket: async () => { mintCalls++; return rawTicket(mintCalls) },
    fetchImpl: async () => ({ ok: false, status: 401 }),
    setTimeoutImpl: timers.set,
    clearTimeoutImpl: timers.clear,
    onStatus: (s) => statuses.push(s),
  })
  session.start()
  await flush()
  check('exactly one re-mint after a 401', mintCalls === 2, `mints=${mintCalls}`)
  check('second auth failure ⇒ honest expired state', session.getStatus() === 'expired' && statuses.includes('expired'))
  check('expired session leaves zero timers', timers.count() === 0)
}

// ── D2. finite budget vs a 200-then-EOF peer ─────────────────────────────────
// A peer that answers 200 and closes the body without ONE accepted event must
// burn the reconnect budget and reach failed — headers are not progress, so
// this must never reconnect forever.
console.log('Repeated 200 + empty EOF ⇒ finite failure')
{
  const timers = fakeTimers()
  let fetches = 0
  const statuses = []
  const session = createLiveSessionController({
    engineSessionId: SID,
    mintTicket: async () => rawTicket(),
    fetchImpl: async () => {
      fetches++
      return {
        ok: true,
        status: 200,
        body: { getReader: () => ({ read: async () => ({ done: true, value: undefined }), cancel: () => {} }) },
      }
    },
    setTimeoutImpl: timers.set,
    clearTimeoutImpl: timers.clear,
    onStatus: (s) => statuses.push(s),
  })
  session.start()
  // Deterministic drive: elapse every pending backoff/refresh timer until the
  // controller settles (bounded loop — it must not need more than the budget).
  for (let i = 0; i < MAX_RECONNECT_ATTEMPTS + 3; i++) { await flush(); timers.fireAll() }
  await flush()
  check('reaches failed after the budget, never loops forever', session.getStatus() === 'failed' && statuses.includes('reconnecting'), `status=${session.getStatus()}`)
  check(`exactly initial + ${MAX_RECONNECT_ATTEMPTS} reconnect attempts`, fetches === MAX_RECONNECT_ATTEMPTS + 1, `fetches=${fetches}`)
  check('zero timers left after giving up', timers.count() === 0, `left=${timers.count()}`)
}

// ── E. ICE failure ⇒ ONE full reconnect, single-flight ───────────────────────
console.log('ICE failure ⇒ one full reconnect (single-flight)')
{
  const log = []
  let mintCalls = 0
  let pcCount = 0
  const pcs = []
  const states = []
  const viewer = createWhepViewerController({
    getTicket: () => (mintCalls === 0 ? vTicket(0) : null),
    remintTicket: async () => { mintCalls++; log.push('remint'); return vTicket(mintCalls) },
    fetchImpl: whepFetch(log),
    createPeerConnection: () => { pcCount++; const pc = fakePC(log, `pc${pcCount}`); pcs.push(pc); return pc },
    onState: (s) => states.push(s),
  })
  viewer.start()
  await flush()
  check('initial connect plays on pc1', viewer.getState() === 'playing' && log.includes('setRemote:pc1'))

  // ICE dies — and the browser fires the callback MULTIPLE times. Recovery
  // must be single-flight: one DELETE, one re-mint, one new PC.
  pcs[0].iceConnectionState = 'failed'
  pcs[0].oniceconnectionstatechange?.()
  pcs[0].oniceconnectionstatechange?.() // repeat dispatches — detached or guarded, never double-recover
  pcs[0].oniceconnectionstatechange?.()
  await flush()
  const remints = log.filter((l) => l === 'remint').length
  const deletes = log.filter((l) => l.startsWith('delete:')).length
  check('concurrent failure callbacks ⇒ ONE recovery (1 remint, 1 DELETE, 2 PCs)', remints === 1 && deletes === 1 && pcCount === 2, JSON.stringify(log))
  const remint = log.indexOf('remint')
  const del = log.findIndex((l) => l.startsWith('delete:'))
  const close1 = log.indexOf('close:pc1')
  const post2 = log.lastIndexOf('post:https://engine.boxly.mx/whep')
  check('reconnect order: DELETE resource → close PC → re-mint → NEW offer', del < close1 && close1 < remint && remint < post2, JSON.stringify(log))
  check('viewer playing again after the one reconnect', viewer.getState() === 'playing' && states.includes('reconnecting'))

  pcs[1].iceConnectionState = 'failed'
  pcs[1].oniceconnectionstatechange?.()
  await flush()
  check('second failure ⇒ failed state, PC closed', viewer.getState() === 'failed' && log.includes('close:pc2'))
}

// ── F. seq gap ⇒ resync from cursor; replay + duplicates deduped ─────────────
console.log('Seq gap ⇒ resync + replay dedupe')
{
  const timers = fakeTimers()
  const streams = [sseStream(), sseStream()]
  const sseHeaders = []
  let fetchCount = 0
  const candidates = []
  const statuses = []
  const session = createLiveSessionController({
    engineSessionId: SID,
    mintTicket: async () => rawTicket(),
    fetchImpl: async (url, init) => {
      sseHeaders.push(init.headers['Last-Event-ID'] || null)
      return streams[Math.min(fetchCount++, streams.length - 1)].response
    },
    setTimeoutImpl: timers.set,
    clearTimeoutImpl: timers.clear,
    onStatus: (s) => statuses.push(s),
    onCandidate: (c) => candidates.push(c),
  })
  session.start()
  await flush()
  // seq 1 accepted; seq 3 is a GAP — its data must NOT be applied silently.
  streams[0].push(evSSE('g1', 1, 'candidate', candPayload(prod(1))))
  streams[0].push(evSSE('g3', 3, 'candidate', candPayload(prod(99))))
  await flush()
  check('gap forces a reconnect instead of accepting reordered data', statuses.includes('reconnecting') && !candidates.some((c) => c.title === 'Producto 99'))
  timers.fireAll() // elapse the backoff
  await flush()
  check('resume request replays from the last ACCEPTED id', fetchCount === 2 && sseHeaders[0] === null && sseHeaders[1] === 'g1', JSON.stringify(sseHeaders))
  // Replay: seq1 again (duplicate event), then 2, 3 in order — seq3 re-sends
  // product 1's URL too (duplicate product across replay).
  streams[1].push(evSSE('g1', 1, 'candidate', candPayload(prod(1))))
  streams[1].push(evSSE('g2', 2, 'candidate', candPayload(prod(2))))
  streams[1].push(evSSE('g3', 3, 'candidate', candPayload(prod(99), prod(1))))
  streams[1].push(evSSE('g4', 4, 'session.completed'))
  await flush()
  const titles = candidates.map((c) => c.title)
  check('replayed duplicate event dropped, in-order events accepted', titles.includes('Producto 2') && titles.includes('Producto 99'))
  check('duplicate product URL across replay deduped', titles.filter((t) => t === 'Producto 1').length === 1, JSON.stringify(titles))
  check('terminal after resync, zero timers', session.getStatus() === 'completed' && timers.count() === 0)
}

// ── G. candidate retention cap ───────────────────────────────────────────────
console.log('Candidate retention cap')
{
  const timers = fakeTimers()
  const stream = sseStream()
  const candidates = []
  const session = createLiveSessionController({
    engineSessionId: SID,
    mintTicket: async () => rawTicket(),
    fetchImpl: async () => stream.response,
    setTimeoutImpl: timers.set,
    clearTimeoutImpl: timers.clear,
    onCandidate: (c) => candidates.push(c),
  })
  session.start()
  await flush()
  stream.push(evSSE('c1', 1, 'candidate', candPayload(...Array.from({ length: 15 }, (_, i) => prod(i)))))
  stream.push(evSSE('c2', 2, 'candidate', candPayload(...Array.from({ length: 15 }, (_, i) => prod(100 + i)))))
  await flush()
  check(`retained candidates capped at ${MAX_CANDIDATES_RETAINED}, overflow counted`, candidates.length === MAX_CANDIDATES_RETAINED && session.getDroppedCandidates() === 6, `kept=${candidates.length} dropped=${session.getDroppedCandidates()}`)
  session.stop()
}

// ── H. hostile WHEP Location ⇒ refused, never DELETEd ────────────────────────
console.log('Hostile WHEP Location')
{
  const log = []
  let pcCount = 0
  const viewer = createWhepViewerController({
    getTicket: () => vTicket(),
    remintTicket: async () => { log.push('remint'); return vTicket() },
    fetchImpl: whepFetch(log, { location: 'https://evil.example/whep/res-1' }),
    createPeerConnection: () => { pcCount++; return fakePC(log, `pc${pcCount}`) },
  })
  viewer.start()
  await flush()
  check('cross-origin Location ⇒ connect refused, one recovery, then failed', viewer.getState() === 'failed')
  check('NO DELETE (and no Bearer) ever sent to the foreign origin', !log.some((l) => l.startsWith('delete:')), JSON.stringify(log))
  check('resource URL never adopted', viewer.getResourceUrl() === null)
}

// ── I. media_available:false ⇒ events flow, media plane never touched ────────
// The engine has no publisher in P1. The whole point of the decoupled ticket is
// that this costs the customer the VIDEO and nothing else: SSE still connects,
// candidates still arrive, and no PeerConnection is ever built — so there is
// also nothing to tear down at the end.
console.log('media_available:false ⇒ SSE runs, WHEP never attempted')
{
  const timers = fakeTimers()
  const log = []
  const stream = sseStream()
  const statuses = []
  const candidates = []
  let mintCalls = 0
  let pcCount = 0

  const session = createLiveSessionController({
    engineSessionId: SID,
    mintTicket: async () => { mintCalls++; return rawTicketNoMedia(mintCalls) },
    fetchImpl: async (url, init) => {
      check('no-media SSE still carries the Bearer, ticket not in URL', init.headers.Authorization?.startsWith('Bearer tk-') && !url.includes('tk-'), url)
      return stream.response
    },
    setTimeoutImpl: timers.set,
    clearTimeoutImpl: timers.clear,
    onStatus: (s) => { statuses.push(s); if (['completed', 'failed', 'cancelled', 'expired'].includes(s)) viewer.stop() },
    onCandidate: (c) => candidates.push(c),
  })
  const viewer = createWhepViewerController({
    getTicket: session.getTicket,
    remintTicket: session.remintTicket,
    fetchImpl: whepFetch(log),
    createPeerConnection: () => { pcCount++; return fakePC(log, `pc${pcCount}`) },
  })

  session.start()
  await flush()
  check('a media-unavailable ticket still opens the event stream', statuses.includes('streaming'))
  check('ticket validated and exposed with mediaAvailable:false', session.getTicket()?.mediaAvailable === false && session.getTicket()?.whepUrl === null)

  // Defence in depth: even if a caller ignores the panel's gate and starts the
  // viewer, no offer, no POST and no PeerConnection may result.
  viewer.start()
  await flush()
  check('viewer reports unavailable, NOT failed (nothing broke)', viewer.getState() === 'unavailable', viewer.getState())
  check('no PeerConnection constructed', pcCount === 0)
  check('no WHEP POST attempted', !log.some((l) => l.startsWith('post:')), JSON.stringify(log))

  stream.push(evSSE('e1', 1, 'worker.running'))
  stream.push(evSSE('e2', 2, 'candidate', candPayload(prod(1), prod(2))))
  await flush()
  check('progressive candidates arrive with no media plane', candidates.length === 2 && candidates[1].title === 'Producto 2')

  stream.push(evSSE('e3', 3, 'session.completed'))
  await flush()
  check('terminal reached normally', session.getStatus() === 'completed')
  check('nothing to tear down: no DELETE, no close', !log.some((l) => l.startsWith('delete:') || l.startsWith('close:')), JSON.stringify(log))
  session.stop()
  check('no timers left after a no-media session', timers.count() === 0, String(timers.count()))
}

// ── J. media promised then broken stays a FAILURE, not a capability state ────
// The calm "no video" rendering must never absorb a real breakage: a ticket
// that advertises media and then cannot connect has to end in 'failed'.
console.log('media promised then broken ⇒ still failed')
{
  const log = []
  let pcCount = 0
  const viewer = createWhepViewerController({
    getTicket: () => vTicket(),
    remintTicket: async () => vTicket(),
    fetchImpl: async () => ({ ok: false, status: 500, headers: { get: () => null }, text: async () => '' }),
    createPeerConnection: () => { pcCount++; return fakePC(log, `pc${pcCount}`) },
  })
  viewer.start()
  await flush()
  check('promised-then-broken media ends in failed (never unavailable)', viewer.getState() === 'failed', viewer.getState())
  check('media-unavailable ticket and broken media are DIFFERENT states', viewer.getState() !== 'unavailable')
}

// ── K. persisted terminal outranks a transport symptom ──────────────────────
// THE REAL INCIDENT, reproduced: a session ended `store_blocked` 599ms after the
// browser's SSE stream had already closed, so the terminal frame was never
// delivered here. On reload the panel re-minted, got a correct 409 "no longer
// live", and told the customer we had lost the CONNECTION. The session was not
// lost — it had finished, and the server knew why. These pin that the viewer
// asks the server before blaming the transport, and that it still blames the
// transport honestly when there is genuinely nothing to recover.
console.log('Persisted terminal outranks transport failure')

// The REAL present() shape: a CLOSED NINE-key set, `error_code` nullable — added
// in lockstep across Laravel, this repo and the golden fixture so a failed
// session can say WHY instead of the customer being told we lost the connection.
// null for every non-failed session.
const present9 = (status, error_code = null) => ({
  success: true,
  data: { id: 1003, status, engine_session_id: SID, conversation_id: 6, store_id: 'new-balance', expires_at: null, created_at: '2026-09-01T06:45:46Z', updated_at: '2026-09-01T06:46:15Z', error_code },
})

// K1. ticket mint 409 after the session already ended ⇒ hydrate the real reason.
{
  const timers = fakeTimers()
  let mints = 0, fetchSessions = 0
  const statuses = []
  let reason = 'UNSET'
  const session = createLiveSessionController({
    engineSessionId: SID,
    mintTicket: async () => { mints++; const e = new Error('409'); e.statusCode = 409; throw e },
    fetchSession: async () => { fetchSessions++; return present9('failed') },
    fetchImpl: async () => { throw new Error('SSE must never be attempted without a ticket') },
    setTimeoutImpl: timers.set,
    clearTimeoutImpl: timers.clear,
    onStatus: (s) => statuses.push(s),
    onTerminalReason: (c) => { reason = c },
  })
  session.start()
  await flush()
  check('409 mint ⇒ terminal failed, NOT a generic give_up path', session.getStatus() === 'failed', session.getStatus())
  check('authoritative session fetched EXACTLY once (no loop)', fetchSessions === 1, `fetches=${fetchSessions}`)
  check('no second mint after an authoritative terminal', mints === 1, `mints=${mints}`)
  check('zero timers left', timers.count() === 0, String(timers.count()))
}

// K2. the incident's exact reason survives to the UI text.
{
  const timers = fakeTimers()
  let reason = 'UNSET'
  const session = createLiveSessionController({
    engineSessionId: SID,
    mintTicket: async () => { throw new Error('409') },
    fetchSession: async () => present9('failed', 'store_blocked'),
    setTimeoutImpl: timers.set,
    clearTimeoutImpl: timers.clear,
    onTerminalReason: (c) => { reason = c },
  })
  session.start()
  await flush()
  // THE POINT OF THE WHOLE LOCKSTEP: the customer now learns the store refused
  // the session, instead of being told we lost the connection.
  check('store_blocked survives the boundary to the caller', reason === 'store_blocked', `reason=${reason}`)
  check('terminal adopted from authority', session.getStatus() === 'failed' && session.isTerminalAuthoritative() === true)
  check('and it renders the store story, never a connection one', /bloqueó/.test(terminalReasonText(reason)) && !/conexión/i.test(terminalReasonText(reason)))
}

// K3. missed terminal after the EOF budget ⇒ recovered, not blamed on transport.
{
  const timers = fakeTimers()
  let fetchSessions = 0
  const session = createLiveSessionController({
    engineSessionId: SID,
    mintTicket: async () => rawTicket(),
    fetchSession: async () => { fetchSessions++; return present9('failed') },
    fetchImpl: async () => ({ ok: true, status: 200, body: { getReader: () => ({ read: async () => ({ done: true, value: undefined }), cancel: () => {} }) } }),
    setTimeoutImpl: timers.set,
    clearTimeoutImpl: timers.clear,
  })
  session.start()
  for (let i = 0; i < MAX_RECONNECT_ATTEMPTS + 3; i++) { await flush(); timers.fireAll() }
  await flush()
  check('budget exhausted ⇒ authoritative terminal adopted', session.getStatus() === 'failed')
  check('server asked exactly once, after the budget — not per attempt', fetchSessions === 1, `fetches=${fetchSessions}`)
  check('zero timers left after recovery', timers.count() === 0, String(timers.count()))
}

// K4. a GENUINE transport failure must still say so — no invented terminal.
// Since the post-transport recovery schedule (below), "genuine" means the
// authority stayed non-terminal through the give-up read AND all four
// scheduled reads; only then does the honest transport story stand.
const eofBody = () => ({ ok: true, status: 200, body: { getReader: () => ({ read: async () => ({ done: true, value: undefined }), cancel: () => {} }) } })
// Drive fake timers round by round until `until()` holds or `max` rounds pass.
const drive = async (timers, until, max = 24) => {
  for (let i = 0; i < max; i++) { await flush(); if (until()) return true; timers.fireAll() }
  await flush()
  return until()
}
{
  const timers = fakeTimers()
  const delays = []
  let fetchSessions = 0
  const statuses = []
  const session = createLiveSessionController({
    engineSessionId: SID,
    mintTicket: async () => rawTicket(),
    // Server says the session is STILL RUNNING — every time: nothing terminal to
    // recover, so the honest answer really is "we lost the connection".
    fetchSession: async () => { fetchSessions++; return present9('running') },
    fetchImpl: eofBody,
    setTimeoutImpl: (fn, ms) => { delays.push(ms); return timers.set(fn, ms) },
    clearTimeoutImpl: timers.clear,
    onStatus: (s) => statuses.push(s),
  })
  session.start()
  await drive(timers, () => session.getStatus() === 'failed')
  check('non-terminal server state ⇒ honest transport failure preserved', session.getStatus() === 'failed')
  check('no terminal reason invented', session.getTerminalReason() === null, String(session.getTerminalReason()))
  check('and it is NOT presented as authoritative', session.isTerminalAuthoritative() === false)
  check('give-up read + exactly the four scheduled reads, then silence', fetchSessions === 1 + AUTHORITY_RECOVERY_DELAYS_MS.length, `fetches=${fetchSessions}`)
  // The last four timers ever armed are the recovery waits — the ticket refresh
  // was cancelled on entering recovery and nothing else arms afterwards.
  check('the schedule is the fixed 5s/15s/30s/60s series, armed once, last', JSON.stringify(delays.slice(-AUTHORITY_RECOVERY_DELAYS_MS.length)) === JSON.stringify([...AUTHORITY_RECOVERY_DELAYS_MS]), JSON.stringify(delays))
  check('the panel stays "reconnecting" while it keeps asking, never a premature failed', statuses.filter((s) => s === 'failed').length === 1 && statuses.indexOf('failed') === statuses.length - 1)
  check('zero timers left after the exhausted schedule', timers.count() === 0, String(timers.count()))
  timers.fireAll()
  await flush()
  check('nothing re-arms after exhaustion (no polling)', fetchSessions === 1 + AUTHORITY_RECOVERY_DELAYS_MS.length && timers.count() === 0)
}

// K4b. THE LIVE INCIDENT (conversations 26/27): the stream drops for good while
// the worker is still running; the reconnect budget and the give-up read find
// "running"; the server completes the session a minute later. The scheduled
// reads must recover that terminal — once, authoritatively — so the panel's
// @terminal consumer (the conversation refresh) fires exactly as for an SSE
// terminal, instead of the customer being told the connection was lost.
{
  const timers = fakeTimers()
  let fetchSessions = 0
  let reasonCalls = 0
  const statuses = []
  const session = createLiveSessionController({
    engineSessionId: SID,
    mintTicket: async () => rawTicket(),
    // give-up read #1 and scheduled read #2 say running; scheduled read #3 says completed.
    fetchSession: async () => { fetchSessions++; return present9(fetchSessions >= 3 ? 'completed' : 'running') },
    fetchImpl: eofBody,
    setTimeoutImpl: timers.set,
    clearTimeoutImpl: timers.clear,
    onStatus: (s) => statuses.push(s),
    onTerminalReason: () => { reasonCalls++ },
  })
  session.start()
  await drive(timers, () => session.getStatus() === 'completed')
  check('late terminal recovered from the authority after the transport gave up', session.getStatus() === 'completed', session.getStatus())
  check('recovered terminal is authoritative', session.isTerminalAuthoritative() === true)
  check('terminal committed exactly once (one onTerminalReason)', reasonCalls === 1, `calls=${reasonCalls}`)
  check('the transport story was never shown', !statuses.includes('failed'), JSON.stringify(statuses))
  check('stopped asking as soon as the terminal was found', fetchSessions === 3, `fetches=${fetchSessions}`)
  check('zero timers left after the recovered terminal', timers.count() === 0, String(timers.count()))
  timers.fireAll()
  await flush()
  check('no read or callback after the terminal', fetchSessions === 3 && reasonCalls === 1)
}

// K4c. stop() (unmount / new chat) during the recovery schedule cancels it:
// no later authority read, no later callback, no timer left behind.
{
  const timers = fakeTimers()
  let fetchSessions = 0
  let reasonCalls = 0
  let statusCalls = 0
  const session = createLiveSessionController({
    engineSessionId: SID,
    mintTicket: async () => rawTicket(),
    fetchSession: async () => { fetchSessions++; return present9(fetchSessions >= 2 ? 'completed' : 'running') },
    fetchImpl: eofBody,
    setTimeoutImpl: timers.set,
    clearTimeoutImpl: timers.clear,
    onStatus: () => { statusCalls++ },
    onTerminalReason: () => { reasonCalls++ },
  })
  session.start()
  // Reach the give-up read (fetchSessions === 1) with the FIRST recovery wait pending.
  await drive(timers, () => fetchSessions === 1)
  check('give-up read happened and one recovery wait is pending', fetchSessions === 1 && timers.count() === 1, `fetches=${fetchSessions} timers=${timers.count()}`)
  const before = statusCalls
  session.stop()
  await flush()
  check('stop clears the pending recovery wait', timers.count() === 0, String(timers.count()))
  timers.fireAll()
  await flush(40)
  check('no authority read after stop', fetchSessions === 1, `fetches=${fetchSessions}`)
  check('no terminal callback or status change after stop', reasonCalls === 0 && statusCalls === before && session.isTerminalAuthoritative() === false)
}

// K5. a fetchSession that THROWS must not mask the transport error or hang.
{
  const timers = fakeTimers()
  const session = createLiveSessionController({
    engineSessionId: SID,
    mintTicket: async () => { throw new Error('409') },
    fetchSession: async () => { throw new Error('network down') },
    setTimeoutImpl: timers.set,
    clearTimeoutImpl: timers.clear,
  })
  session.start()
  await flush()
  check('a throwing session fetch still ends in the honest fallback', session.getStatus() === 'failed')
  check('no reason invented from a failed lookup', session.getTerminalReason() === null)
  check('zero timers left', timers.count() === 0)
}

// K6. omitting fetchSession entirely = exactly the previous behaviour.
{
  const timers = fakeTimers()
  const session = createLiveSessionController({
    engineSessionId: SID,
    mintTicket: async () => { throw new Error('409') },
    setTimeoutImpl: timers.set,
    clearTimeoutImpl: timers.clear,
  })
  session.start()
  await flush()
  check('without the dep the viewer behaves exactly as before', session.getStatus() === 'failed' && session.getTerminalReason() === null)
}

// K7. A FAILED SESSION WITH NO STORED REASON. present() now carries error_code,
// but it is nullable and plenty of rows have none. Keying the UI on the reason
// STRING alone would send exactly these sessions back to the connection story —
// the original bug. PROVENANCE is what the card keys on: the server said it
// ended, so we say it ended, reason or no reason.
{
  const timers = fakeTimers()
  let reasonCalls = 0
  let reasonValue = 'UNSET'
  const session = createLiveSessionController({
    engineSessionId: SID,
    mintTicket: async () => { const e = new Error('409'); e.statusCode = 409; throw e },
    fetchSession: async () => present9('failed'),
    setTimeoutImpl: timers.set,
    clearTimeoutImpl: timers.clear,
    onTerminalReason: (c) => { reasonCalls++; reasonValue = c },
  })
  session.start()
  await flush()
  check('real present() shape ⇒ terminal adopted', session.getStatus() === 'failed')
  check('a failed session with NO stored reason yields null', reasonValue === null, String(reasonValue))
  check('provenance is still recorded — the card falls back to it, not to the connection story', session.isTerminalAuthoritative() === true)
  check('provenance signalled exactly once', reasonCalls === 1, `calls=${reasonCalls}`)
}

// K8. Giving up on transport must NEVER be mistaken for the session ending.
{
  const timers = fakeTimers()
  const session = createLiveSessionController({
    engineSessionId: SID,
    mintTicket: async () => rawTicket(),
    fetchSession: async () => present9('running'),
    fetchImpl: async () => ({ ok: true, status: 200, body: { getReader: () => ({ read: async () => ({ done: true, value: undefined }), cancel: () => {} }) } }),
    setTimeoutImpl: timers.set,
    clearTimeoutImpl: timers.clear,
  })
  session.start()
  // Drives through the reconnect budget AND the post-transport recovery
  // schedule (the authority keeps saying running) — only then is it a give-up.
  await drive(timers, () => session.getStatus() === 'failed')
  check('transport give-up is NOT authoritative', session.getStatus() === 'failed' && session.isTerminalAuthoritative() === false)
}

// K9. A hostile stored reason must never reach customer-facing text. Laravel
// sanitizes at its boundary; we re-gate here because this string SELECTS copy.
{
  const timers = fakeTimers()
  let reason = 'UNSET'
  const session = createLiveSessionController({
    engineSessionId: SID,
    mintTicket: async () => { throw new Error('409') },
    fetchSession: async () => present9('failed', '<script>alert(1)</script>'),
    setTimeoutImpl: timers.set,
    clearTimeoutImpl: timers.clear,
    onTerminalReason: (c) => { reason = c },
  })
  session.start()
  await flush()
  check('hostile code gated to null', reason === null, String(reason))
  check('still authoritative — the session DID end', session.isTerminalAuthoritative() === true)
  check('falls back to the honest ending, not the connection story', /terminó sin completar/.test(terminalReasonText(reason)))
}

// ── L. engine-delivered terminal: authoritative, with its reason ────────────
// The engine ships the reason IN the terminal event (payload.error_code), and
// the panel previously threw it away — so a session the store refused rendered
// as "we lost the connection". These pin that an SSE terminal is as
// authoritative as a hydrated one, and that a reentrant stop() can no longer
// suppress a terminal that already arrived.
console.log('SSE terminal ⇒ authoritative + reason')

// L0. A worker outcome can arrive before its session.failed event (or while
// that terminal frame is lost). Reconcile once, but commit only authority.
{
  const stream = sseStream(); let fetches = 0; let reason = 'UNSET'
  const session = createLiveSessionController({
    engineSessionId: SID, mintTicket: async () => rawTicket(), fetchImpl: async () => stream.response,
    fetchSession: async () => { fetches++; return present9('failed', 'store_blocked') },
    setTimeoutImpl: fakeTimers().set, clearTimeoutImpl: () => {}, onTerminalReason: (c) => { reason = c },
  })
  session.start(); await flush(); stream.push(evSSE(`${SID}:1`, 1, 'worker.progress', { phase: 'outcome', outcome: 'blocked' })); await flush()
  stream.push(evSSE(`${SID}:1`, 1, 'worker.progress', { phase: 'outcome', outcome: 'blocked' })); await flush()
  check('outcome progress reconciles to authoritative terminal', session.getStatus() === 'failed' && session.isTerminalAuthoritative() && reason === 'store_blocked')
  check('duplicate outcome is deduped to one authority GET', fetches === 1, String(fetches))
}

// L0b. The live 2026-09-03 shape (sessions ace8d110 / 80cb048b): a COMPLETED
// session whose row carries the partial_match caveat, and a terminal committed
// from an AUTHORITY READ (here: the transport ended before the terminal frame,
// so the give-up path asks the server). The parser used to null every
// non-failed code, so the terminal was committed with null, the memory
// remembered null, and the remounted history panel lost its amber card. The
// caveat must survive the parser, the commit, the callback and the memory.
{
  const timers = fakeTimers()
  let fetches = 0; let reason = 'UNSET'; let committed = null
  const memory = createTerminalMemory()
  const session = createLiveSessionController({
    engineSessionId: SID,
    mintTicket: async () => rawTicket(),
    fetchSession: async () => { fetches++; return present9('completed', 'partial_match') },
    fetchImpl: eofBody,
    setTimeoutImpl: timers.set,
    clearTimeoutImpl: timers.clear,
    onTerminalReason: (c) => { reason = c },
    onTerminalCommitted: (info) => { committed = info; claimTerminalAnnouncement(memory, SID, info.status, info.errorCode) },
  })
  session.start()
  await drive(timers, () => session.getStatus() === 'completed')
  check('completed + partial_match: the authority read commits the CAVEAT as the terminal reason', session.getStatus() === 'completed' && session.isTerminalAuthoritative() && reason === 'partial_match' && session.getTerminalReason() === 'partial_match', `${session.getStatus()} ${reason}`)
  check('onTerminalCommitted carries it', committed?.status === 'completed' && committed?.errorCode === 'partial_match', JSON.stringify(committed))
  check('and the page memory keeps it for a remounted panel', JSON.stringify(memory.get(SID)) === JSON.stringify({ status: 'completed', errorCode: 'partial_match' }), JSON.stringify(memory.get(SID)))
  check('exactly one authority GET', fetches === 1, String(fetches))
}
{
  // Control: any OTHER code on a completed session is still dropped (closed vocabulary); memory remembers null.
  const timers = fakeTimers()
  let reason = 'UNSET'
  const memory = createTerminalMemory()
  const session = createLiveSessionController({
    engineSessionId: SID,
    mintTicket: async () => rawTicket(),
    fetchSession: async () => present9('completed', 'store_blocked'),
    fetchImpl: eofBody,
    setTimeoutImpl: timers.set,
    clearTimeoutImpl: timers.clear,
    onTerminalReason: (c) => { reason = c },
    onTerminalCommitted: (info) => { claimTerminalAnnouncement(memory, SID, info.status, info.errorCode) },
  })
  session.start()
  await drive(timers, () => session.getStatus() === 'completed')
  check('completed + a non-caveat code commits null (not narrated)', session.getStatus() === 'completed' && reason === null, `${session.getStatus()} ${reason}`)
  check('memory remembers the completed terminal without a code', JSON.stringify(memory.get(SID)) === JSON.stringify({ status: 'completed', errorCode: null }), JSON.stringify(memory.get(SID)))
}

{
  const stream = sseStream(); let resolveFetch; let fetches = 0
  const session = createLiveSessionController({
    engineSessionId: SID, mintTicket: async () => rawTicket(), fetchImpl: async () => stream.response,
    fetchSession: async () => { fetches++; return new Promise((resolve) => { resolveFetch = resolve }) },
    setTimeoutImpl: fakeTimers().set, clearTimeoutImpl: () => {},
  })
  session.start(); await flush(); stream.push(evSSE(`${SID}:1`, 1, 'worker.progress', { phase: 'outcome', outcome: 'error' })); await flush(); session.stop()
  resolveFetch(present9('failed', 'store_blocked')); await flush()
  check('stale generation cannot commit reconciliation', session.getStatus() !== 'failed' && fetches === 1)
}

{
  const stream = sseStream(); let fetches = 0
  const session = createLiveSessionController({
    engineSessionId: SID, mintTicket: async () => rawTicket(), fetchImpl: async () => stream.response,
    fetchSession: async () => { fetches++; return present9('running', null) },
    setTimeoutImpl: fakeTimers().set, clearTimeoutImpl: () => {},
  })
  session.start(); await flush(); stream.push(evSSE(`${SID}:1`, 1, 'worker.progress', { phase: 'outcome', outcome: 'blocked' })); await flush()
  check('nonterminal authority response does not falsely terminalize', session.getStatus() !== 'failed' && fetches === 1)
  session.stop()
}

// Persistence can lag the worker outcome hint. A later transport give-up is
// allowed one bounded refresh and must recover the terminal row.
{
  const timers = fakeTimers(); const stream = sseStream(); let fetches = 0; let reason = 'UNSET'
  const session = createLiveSessionController({
    engineSessionId: SID, mintTicket: async () => rawTicket(), fetchImpl: async () => stream.response,
    fetchSession: async () => { fetches++; return present9(fetches === 1 ? 'running' : 'failed', fetches === 1 ? null : 'store_blocked') },
    setTimeoutImpl: timers.set, clearTimeoutImpl: timers.clear, onTerminalReason: (c) => { reason = c },
  })
  session.start(); await flush(); stream.push(evSSE(`${SID}:1`, 1, 'worker.progress', { phase: 'outcome', outcome: 'blocked' })); await flush()
  stream.close(); await flush()
  for (let i = 0; i < MAX_RECONNECT_ATTEMPTS + 1; i++) { timers.fireAll(); await flush() }
  check('later authority refresh recovers persisted terminal', session.getStatus() === 'failed' && session.isTerminalAuthoritative() && reason === 'store_blocked')
  check('nonterminal race is bounded to two authority GETs', fetches === 2, String(fetches))
}

// A reconnecting/media-stalled viewer must surface a terminal persisted just
// after the first authority read, without waiting for the full backoff budget.
{
  const timers = fakeTimers(); const stream = sseStream(); let fetches = 0
  const session = createLiveSessionController({
    engineSessionId: SID, mintTicket: async () => rawTicket(), fetchImpl: async () => stream.response,
    fetchSession: async () => { fetches++; return present9(fetches === 1 ? 'running' : 'completed') },
    setTimeoutImpl: timers.set, clearTimeoutImpl: timers.clear,
  })
  session.start(); await flush();
  stream.push(evSSE(`${SID}:1`, 1, 'worker.progress', { phase: 'outcome', outcome: 'blocked' })); await flush()
  stream.close(); await flush()
  check('terminal becomes visible during reconnecting without reload', session.getStatus() === 'completed')
  check('prompt visibility refresh remains bounded', fetches === 2 && timers.count() === 0, `fetches=${fetches}`)
}

// The real incident coalesced seq9+seq10 into ONE chunk (they were appended
// 51ms apart), so every case here feeds the terminal BEHIND a progress frame in
// the SAME feed() call — proving ordering holds when the terminal is not the
// first frame dispatched.
const coalesced = (seqA, seqB, code) =>
  evSSE(`${SID}:${seqA}`, seqA, 'worker.progress', { note: 'blocked' }) +
  evSSE(`${SID}:${seqB}`, seqB, 'session.failed', code === undefined ? undefined : { error_code: code })

// L1. reason survives to the caller, from a coalesced chunk.
{
  const timers = fakeTimers()
  const stream = sseStream()
  let reason = 'UNSET'
  const statuses = []
  const session = createLiveSessionController({
    engineSessionId: SID,
    mintTicket: async () => rawTicket(),
    fetchImpl: async () => stream.response,
    setTimeoutImpl: timers.set,
    clearTimeoutImpl: timers.clear,
    onStatus: (s) => statuses.push(s),
    onTerminalReason: (c) => { reason = c },
  })
  session.start()
  await flush()
  stream.push(coalesced(9, 10, 'store_blocked'))
  await flush()
  check('coalesced progress+terminal ⇒ terminal reached', session.getStatus() === 'failed', session.getStatus())
  check('reason extracted from the EVENT payload', reason === 'store_blocked', String(reason))
  check('terminal from the engine is AUTHORITATIVE', session.isTerminalAuthoritative() === true)
  check('and it renders the store story, never a connection one', /bloqueó/.test(terminalReasonText(reason)) && !/conexión/i.test(terminalReasonText(reason)))
  check('zero timers left', timers.count() === 0, String(timers.count()))
}

// L1b (rev 32c, 2026-09-03). With the engine answering the create at durable
// acceptance (BOXLY_ENGINE_CREATE_ACK=accepted), a worker that fails to start
// arrives as worker.starting → session.failed{worker_start_failed} with NO
// worker.running in between. That is an AUTHORITATIVE failed terminal with the
// "service unavailable" story — never a connection story, never a hang.
{
  const timers = fakeTimers()
  const stream = sseStream()
  let reason = 'UNSET'
  const statuses = []
  const session = createLiveSessionController({
    engineSessionId: SID,
    mintTicket: async () => rawTicket(),
    fetchImpl: async () => stream.response,
    setTimeoutImpl: timers.set,
    clearTimeoutImpl: timers.clear,
    onStatus: (s) => statuses.push(s),
    onTerminalReason: (c) => { reason = c },
  })
  session.start()
  await flush()
  stream.push(evSSE(`${SID}:1`, 1, 'worker.starting', {}))
  await flush()
  check('a starting worker is not terminal and not running', !['failed', 'completed', 'cancelled'].includes(session.getStatus()) && !statuses.includes('running'), session.getStatus())
  stream.push(evSSE(`${SID}:2`, 2, 'session.failed', { error_code: 'worker_start_failed' }))
  await flush()
  check('pre-ready failure ⇒ failed terminal without any running state', session.getStatus() === 'failed' && !statuses.includes('running'), `${session.getStatus()} ${statuses.join(',')}`)
  check('the reason is the closed code from the event', reason === 'worker_start_failed', String(reason))
  check('the terminal is AUTHORITATIVE (the engine said so)', session.isTerminalAuthoritative() === true)
  check('it renders the service story, never a connection one', /no está disponible/.test(terminalReasonText(reason)) && !/conexión/i.test(terminalReasonText(reason)))
  check('zero timers left', timers.count() === 0, String(timers.count()))
}

// L2. terminal with no error_code: still authoritative, honest fallback text.
{
  const timers = fakeTimers()
  const stream = sseStream()
  let reason = 'UNSET'
  const session = createLiveSessionController({
    engineSessionId: SID, mintTicket: async () => rawTicket(), fetchImpl: async () => stream.response,
    setTimeoutImpl: timers.set, clearTimeoutImpl: timers.clear, onTerminalReason: (c) => { reason = c },
  })
  session.start(); await flush()
  stream.push(coalesced(9, 10, undefined))
  await flush()
  check('terminal without a reason still terminal', session.getStatus() === 'failed')
  check('reason null, provenance TRUE (the card falls back on provenance)', reason === null && session.isTerminalAuthoritative() === true)
  check('fallback text says the session ended, not that we lost the link', /terminó sin completar/.test(terminalReasonText(reason)) && !/conexión/i.test(terminalReasonText(reason)))
}

// L3. hostile error_code in the event is gated, provenance survives.
{
  const stream = sseStream()
  let reason = 'UNSET'
  const session = createLiveSessionController({
    engineSessionId: SID, mintTicket: async () => rawTicket(), fetchImpl: async () => stream.response,
    setTimeoutImpl: fakeTimers().set, clearTimeoutImpl: () => {}, onTerminalReason: (c) => { reason = c },
  })
  session.start(); await flush()
  stream.push(coalesced(9, 10, '<script>alert(1)</script>'))
  await flush()
  check('hostile event reason gated to null', reason === null, String(reason))
  check('still authoritative — the session DID end', session.isTerminalAuthoritative() === true)
}

// L4. W3 — a consumer that synchronously stop()s inside the terminal's OWN
// dispatch must not be able to suppress it. This is the reentrancy race.
{
  const timers = fakeTimers()
  const stream = sseStream()
  const statuses = []
  let reason = 'UNSET'
  let session
  session = createLiveSessionController({
    engineSessionId: SID,
    mintTicket: async () => rawTicket(),
    fetchImpl: async () => stream.response,
    setTimeoutImpl: timers.set,
    clearTimeoutImpl: timers.clear,
    onStatus: (s) => statuses.push(s),
    onTerminalReason: (c) => { reason = c },
    // The panel legitimately tears down on terminal; doing it synchronously
    // inside the event dispatch used to bump the generation and swallow the
    // terminal state via the very guard meant to protect against stale runs.
    onEvent: (ev) => { if (ev.type === 'session.failed') session.stop() },
  })
  session.start(); await flush()
  stream.push(coalesced(9, 10, 'store_blocked'))
  await flush()
  check('REENTRANT stop() during the terminal dispatch cannot suppress it', session.getStatus() === 'failed', session.getStatus())
  check('provenance and reason survive the reentrancy', session.isTerminalAuthoritative() === true && reason === 'store_blocked', String(reason))
  check('terminal status was actually announced', statuses.includes('failed'), JSON.stringify(statuses))
  check('no timers left after a reentrant stop', timers.count() === 0, String(timers.count()))
}

// L5. after an SSE terminal: no reconnect, no re-mint — the production shape.
{
  const timers = fakeTimers()
  const stream = sseStream()
  let fetches = 0, mints = 0
  const session = createLiveSessionController({
    engineSessionId: SID,
    mintTicket: async () => { mints++; return rawTicket(mints) },
    fetchImpl: async () => { fetches++; return stream.response },
    setTimeoutImpl: timers.set, clearTimeoutImpl: timers.clear,
  })
  session.start(); await flush()
  stream.push(coalesced(9, 10, 'store_blocked'))
  await flush()
  stream.close()
  for (let i = 0; i < 3; i++) { await flush(); timers.fireAll() }
  await flush()
  check('exactly ONE SSE fetch — no reconnect after a terminal', fetches === 1, `fetches=${fetches}`)
  check('exactly ONE mint — the refresh timer was cancelled by the commit', mints === 1, `mints=${mints}`)
  check('still terminal, still authoritative', session.getStatus() === 'failed' && session.isTerminalAuthoritative() === true)
  check('zero timers left', timers.count() === 0, String(timers.count()))
}

// L6. a GENUINE transport give-up must NOT be dressed up as a session ending.
{
  const timers = fakeTimers()
  const session = createLiveSessionController({
    engineSessionId: SID,
    mintTicket: async () => rawTicket(),
    fetchImpl: async () => ({ ok: true, status: 200, body: { getReader: () => ({ read: async () => ({ done: true, value: undefined }), cancel: () => {} }) } }),
    fetchSession: async () => present9('running'),
    setTimeoutImpl: timers.set, clearTimeoutImpl: timers.clear,
  })
  session.start()
  await drive(timers, () => session.getStatus() === 'failed') // budget + recovery schedule, authority always running
  check('give-up stays NON-authoritative — the connection story is preserved', session.getStatus() === 'failed' && session.isTerminalAuthoritative() === false)
}

// ── M. W3 on the HYDRATION path: recovered terminal must survive reentrancy ──
// The SSE terminal was made atomic; the recovered branch of dieWithAuthority
// still set the reason and fired onTerminalReason BEFORE the state transition.
// A consumer that synchronously stop()s inside that callback bumped the
// generation and setState was suppressed — the session recorded a reason while
// its STATUS never became terminal. Same defect, other path.
console.log('Recovered terminal survives a reentrant stop()')
{
  const timers = fakeTimers()
  const statuses = []
  let reason = 'UNSET'
  let session
  session = createLiveSessionController({
    engineSessionId: SID,
    // 409 "no longer live": the mint fails, so the viewer asks the server what
    // actually happened — the exact production sequence after a reload.
    mintTicket: async () => { const e = new Error('409'); e.statusCode = 409; throw e },
    fetchSession: async () => present9('failed', 'store_blocked'),
    setTimeoutImpl: timers.set,
    clearTimeoutImpl: timers.clear,
    onStatus: (s) => statuses.push(s),
    // The panel legitimately tears down when it learns the session ended; doing
    // it synchronously inside this very callback is the race.
    onTerminalReason: (c) => { reason = c; session.stop() },
  })
  session.start()
  await flush()
  check('recovered terminal status SURVIVES a reentrant stop()', session.getStatus() === 'failed', session.getStatus())
  check('recovered reason survives', reason === 'store_blocked', String(reason))
  check('provenance survives — the card must not fall back to the connection story', session.isTerminalAuthoritative() === true)
  check('terminal status was actually announced', statuses.includes('failed'), JSON.stringify(statuses))
  check('zero timers left', timers.count() === 0, String(timers.count()))
}

// M2. the same path with NO stored reason still commits terminal + provenance.
{
  const timers = fakeTimers()
  let reason = 'UNSET'
  let session
  session = createLiveSessionController({
    engineSessionId: SID,
    mintTicket: async () => { throw new Error('409') },
    fetchSession: async () => present9('cancelled'),
    setTimeoutImpl: timers.set,
    clearTimeoutImpl: timers.clear,
    onTerminalReason: (c) => { reason = c; session.stop() },
  })
  session.start()
  await flush()
  check('recovered non-failed terminal also survives reentrancy', session.getStatus() === 'cancelled', session.getStatus())
  check('null reason, provenance still true', reason === null && session.isTerminalAuthoritative() === true)
}


// ── N. terminal-final lifecycle + page-lifetime terminal memory ─────────────
// Live Boxly Target conversation 33: ~9 GET …/events within 2s AFTER the
// terminal. One controller never reconnects after a terminal (L5); the storm
// was ~9 remounted panels each starting a fresh stream, replaying the terminal
// and announcing it again. These pin: terminal closes ⇒ one GET; transient EOF
// ⇒ bounded reconnect with the accepted cursor; terminal replay on reconnect ⇒
// stop; stop() ⇒ nothing later; retry()/start() after terminal ⇒ no-op; and the
// memory that lets a later consumer for the SAME session stay silent.
console.log('Terminal-final lifecycle + terminal memory')
{
  // N1. terminal closes the stream ⇒ exactly one GET, nothing re-arms.
  const timers = fakeTimers()
  const stream = sseStream()
  let fetches = 0, mints = 0, committed = 0
  const statuses = []
  const session = createLiveSessionController({
    engineSessionId: SID,
    mintTicket: async () => { mints++; return rawTicket(mints) },
    fetchImpl: async () => { fetches++; return stream.response },
    setTimeoutImpl: timers.set, clearTimeoutImpl: timers.clear,
    onStatus: (s) => statuses.push(s),
    onTerminalCommitted: () => { committed++ },
  })
  session.start()
  await flush()
  stream.push(evSSE('e1', 1, 'worker.running'))
  stream.push(evSSE('e2', 2, 'session.completed'))
  await flush()
  check('terminal committed once and is authoritative', committed === 1 && session.getStatus() === 'completed' && session.isTerminalAuthoritative())
  for (let i = 0; i < 4; i++) { timers.fireAll(); await flush() }
  stream.close()
  await flush()
  check('terminal closes ⇒ exactly ONE GET and ONE mint, no reconnect', fetches === 1 && mints === 1, `fetches=${fetches} mints=${mints}`)
  check('zero timers after terminal', timers.count() === 0)
  session.retry(); session.start()
  await flush(); timers.fireAll(); await flush()
  check('retry()/start() after a committed terminal are no-ops', fetches === 1 && mints === 1 && session.getStatus() === 'completed' && committed === 1)
  check('statuses never left the terminal', statuses.filter((s) => s === 'connecting').length === 1, JSON.stringify(statuses))
}
{
  // N2. transient EOF BEFORE the terminal ⇒ reconnect with Last-Event-ID and resume.
  const timers = fakeTimers()
  const streams = [sseStream(), sseStream()]
  const seenHeaders = []
  let fetches = 0, committed = 0
  const session = createLiveSessionController({
    engineSessionId: SID,
    mintTicket: async () => rawTicket(),
    fetchImpl: async (_url, init) => { seenHeaders.push(init.headers); return streams[fetches++].response },
    setTimeoutImpl: timers.set, clearTimeoutImpl: timers.clear,
    onTerminalCommitted: () => { committed++ },
  })
  session.start()
  await flush()
  streams[0].push(evSSE('e1', 1, 'worker.running'))
  await flush()
  streams[0].close() // transient EOF, no terminal
  await flush(); timers.fireAll(); await flush()
  check('transient EOF ⇒ ONE reconnect with the accepted cursor', fetches === 2 && seenHeaders[1]['Last-Event-ID'] === 'e1', `fetches=${fetches} lei=${seenHeaders[1]?.['Last-Event-ID']}`)
  streams[1].push(evSSE('e2', 2, 'session.completed'))
  await flush()
  check('stream resumes and reaches the terminal once', session.getStatus() === 'completed' && committed === 1)
  for (let i = 0; i < 4; i++) { timers.fireAll(); await flush() }
  check('no third fetch after the terminal', fetches === 2 && timers.count() === 0, `fetches=${fetches}`)
}
{
  // N3. terminal REPLAYED on the reconnect (server resends seq 1 then the terminal) ⇒ stop, announced once.
  const timers = fakeTimers()
  const streams = [sseStream(), sseStream()]
  let fetches = 0, committed = 0
  const terminalStatuses = []
  const session = createLiveSessionController({
    engineSessionId: SID,
    mintTicket: async () => rawTicket(),
    fetchImpl: async () => streams[fetches++].response,
    setTimeoutImpl: timers.set, clearTimeoutImpl: timers.clear,
    onStatus: (s) => { if (['completed', 'failed', 'cancelled'].includes(s)) terminalStatuses.push(s) },
    onTerminalCommitted: () => { committed++ },
  })
  session.start()
  await flush()
  streams[0].push(evSSE('e1', 1, 'worker.running'))
  await flush()
  streams[0].close()
  await flush(); timers.fireAll(); await flush()
  streams[1].push(evSSE('e1', 1, 'worker.running')) // replayed duplicate
  streams[1].push(evSSE('e2', 2, 'session.completed'))
  streams[1].push(evSSE('e2', 2, 'session.completed')) // duplicate terminal frame
  await flush()
  for (let i = 0; i < 4; i++) { timers.fireAll(); await flush() }
  check('terminal replay on reconnect ⇒ terminal, exactly 2 fetches, no third', session.getStatus() === 'completed' && fetches === 2, `fetches=${fetches}`)
  check('terminal announced exactly once despite the duplicate frame', committed === 1 && terminalStatuses.length === 1, `committed=${committed} statuses=${JSON.stringify(terminalStatuses)}`)
}
{
  // N4. stop() during backoff ⇒ no later fetch, no terminal ever announced.
  const timers = fakeTimers()
  let fetches = 0, committed = 0
  const statuses = []
  const session = createLiveSessionController({
    engineSessionId: SID,
    mintTicket: async () => rawTicket(),
    fetchImpl: async () => { fetches++; throw new Error('network down') },
    setTimeoutImpl: timers.set, clearTimeoutImpl: timers.clear,
    onStatus: (s) => statuses.push(s),
    onTerminalCommitted: () => { committed++ },
  })
  session.start()
  await flush()
  check('in backoff with a pending timer', statuses.includes('reconnecting') && timers.count() > 0)
  const before = fetches
  session.stop()
  await flush(); timers.fireAll(); await flush(40)
  check('stop() ⇒ no later fetch, no terminal announced', fetches === before && committed === 0 && timers.count() === 0)
}
{
  // N5. memory: a later consumer for the SAME session starts terminal and silent.
  const memory = createTerminalMemory()
  check('memory refuses non-terminal and bogus states', !memory.remember(SID, 'reconnecting') && !memory.remember(SID, 'transport_error') && !memory.remember('', 'completed') && memory.size === 0)
  check('first announcement wins, the second consumer is silenced', claimTerminalAnnouncement(memory, SID, 'completed') === true && claimTerminalAnnouncement(memory, SID, 'completed') === false)
  check('every terminal keeps its re-gated reason (completed may carry partial_match); a hostile code is dropped', (memory.remember('sess-f', 'failed', 'store_blocked'), memory.get('sess-f')?.errorCode === 'store_blocked') && (memory.remember('sess-h', 'failed', '<script>'), memory.get('sess-h')?.errorCode === null) && (memory.remember('sess-c', 'completed', 'partial_match'), memory.get('sess-c')?.errorCode === 'partial_match') && (memory.remember('sess-n', 'completed', null), memory.get('sess-n')?.errorCode === null))
  check('exact id only', memory.get(SID)?.status === 'completed' && memory.get('sess-2') === null && !memory.has('sess-2'))
  const timers = fakeTimers()
  let fetches = 0, mints = 0, statusCalls = 0, committed = 0
  const later = createLiveSessionController({
    engineSessionId: SID,
    rememberedTerminal: memory.get(SID),
    mintTicket: async () => { mints++; return rawTicket() },
    fetchImpl: async () => { fetches++; return sseStream().response },
    setTimeoutImpl: timers.set, clearTimeoutImpl: timers.clear,
    onStatus: () => { statusCalls++ },
    onTerminalCommitted: () => { committed++ },
  })
  check('remembered consumer begins terminal + authoritative, silently', later.getStatus() === 'completed' && later.isTerminalAuthoritative() && statusCalls === 0 && committed === 0)
  later.start(); later.retry()
  await flush(); timers.fireAll(); await flush()
  check('remembered consumer performs zero mints/fetches and fires no callbacks', mints === 0 && fetches === 0 && statusCalls === 0 && committed === 0 && timers.count() === 0)
  let otherFetches = 0
  const other = createLiveSessionController({
    engineSessionId: 'sess-2',
    rememberedTerminal: memory.get('sess-2'),
    mintTicket: async () => rawTicket(),
    fetchImpl: async () => { otherFetches++; return sseStream().response },
    setTimeoutImpl: timers.set, clearTimeoutImpl: timers.clear,
  })
  other.start()
  await flush()
  check('a different engine session starts normally', otherFetches === 1 && other.getStatus() === 'streaming', `fetches=${otherFetches} status=${other.getStatus()}`)
  other.stop()
  memory.clear(SID)
  check('explicit cleanup forgets exactly that session', !memory.has(SID) && memory.has('sess-f'))
  memory.clear()
  check('clear() with no id empties the memory', memory.size === 0)
  const small = createTerminalMemory(2)
  small.remember('a', 'completed'); small.remember('b', 'completed'); small.remember('c', 'cancelled')
  check('memory is bounded: oldest entry evicted at the cap', !small.has('a') && small.has('b') && small.has('c') && small.size === 2)
}
{
  // N6. two SIMULTANEOUS consumers see the same terminal: the external announcement happens once.
  const memory = createTerminalMemory()
  let announced = 0
  const consumer = () => {
    const timers = fakeTimers()
    const stream = sseStream()
    const session = createLiveSessionController({
      engineSessionId: SID,
      rememberedTerminal: memory.get(SID),
      mintTicket: async () => rawTicket(),
      fetchImpl: async () => stream.response,
      setTimeoutImpl: timers.set, clearTimeoutImpl: timers.clear,
      onTerminalCommitted: ({ status, errorCode }) => { if (claimTerminalAnnouncement(memory, SID, status, errorCode)) announced++ },
    })
    session.start()
    return { session, stream, timers }
  }
  const a = consumer(), b = consumer()
  await flush()
  a.stream.push(evSSE('e1', 1, 'session.completed'))
  b.stream.push(evSSE('e1', 1, 'session.completed'))
  await flush()
  check('both consumers reach the terminal', a.session.getStatus() === 'completed' && b.session.getStatus() === 'completed')
  check('but the external announcement fires exactly once', announced === 1, `announced=${announced}`)
  const c = consumer() // a remount after both — remembered
  await flush()
  check('a consumer created afterwards is silent and terminal', c.session.getStatus() === 'completed' && announced === 1)
}
{
  // N7. capacity is validated: a bad cap is a programming error, thrown deterministically.
  const throwsWith = (cap, ctor) => { try { createTerminalMemory(cap); return false } catch (e) { return e instanceof ctor } }
  check('cap 0 / negative / huge throw RangeError', throwsWith(0, RangeError) && throwsWith(-1, RangeError) && throwsWith(TERMINAL_MEMORY_MAX_CAP + 1, RangeError) && throwsWith(1e9, RangeError))
  check('cap fractional / NaN / Infinity / string throw TypeError', throwsWith(1.5, TypeError) && throwsWith(NaN, TypeError) && throwsWith(Infinity, TypeError) && throwsWith('8', TypeError))
  check('cap 1 and the max are accepted', createTerminalMemory(1).size === 0 && createTerminalMemory(TERMINAL_MEMORY_MAX_CAP).size === 0)
  const one = createTerminalMemory(1)
  one.remember('a', 'completed'); one.remember('b', 'completed')
  check('cap 1 retains exactly the newest entry', !one.has('a') && one.has('b') && one.size === 1)
}
{
  // N8. the shared memory is BROWSER-ONLY. Without a document (Nitro SSR, plain
  // Node) it is inert: two simulated server requests can neither store nor see
  // a terminal. With a document, remounts share the exact-session terminal.
  const hadWindow = typeof globalThis.window !== 'undefined', hadDocument = typeof globalThis.document !== 'undefined'
  check('this process has no browser document', !isBrowserDocument() && !hadWindow && !hadDocument)
  const serverA = pageTerminalMemory()
  check('server request A cannot store a terminal', serverA.remember(SID, 'completed') === false && claimTerminalAnnouncement(serverA, SID, 'completed') === false && serverA.size === 0)
  const serverB = pageTerminalMemory()
  check('server request B sees nothing from A', serverB.get(SID) === null && !serverB.has(SID) && rememberedTerminal(SID) === null)
  check('server memory clear is a harmless no-op', (serverB.clear(), serverB.clear(SID), forgetLiveTerminals(), true))
  // Simulated browser document.
  globalThis.window = {}; globalThis.document = {}
  try {
    check('a document makes the memory live', isBrowserDocument())
    const first = pageTerminalMemory()
    check('first browser consumer claims the announcement', claimTerminalAnnouncement(first, SID, 'completed') === true)
    const remount = pageTerminalMemory()
    check('a remounted consumer shares the SAME instance and the exact-session terminal', remount === first && rememberedTerminal(SID)?.status === 'completed' && claimTerminalAnnouncement(remount, SID, 'completed') === false)
    check('a different session is not remembered in the browser either', rememberedTerminal('sess-2') === null)
    forgetLiveTerminals()
    check('forgetLiveTerminals() (logout hook) empties the browser memory', rememberedTerminal(SID) === null && first.size === 0)
    first.remember(SID, 'failed', 'store_blocked')
  } finally {
    delete globalThis.window; delete globalThis.document
  }
  check('after the document is gone the memory is inert again', !isBrowserDocument() && rememberedTerminal(SID) === null && pageTerminalMemory().size === 0)
}

// ── (iv) Bearer scoping: the engine ticket goes to the engine's origin only ───
console.log('WHEP Bearer scoping by origin')
{
  const runViewer = async (whepUrl, location) => {
    const log = []
    const requests = []
    const fetchImpl = async (url, init) => {
      requests.push({ url, method: init?.method, headers: { ...(init?.headers || {}) } })
      if (init?.method === 'DELETE') return { ok: true, status: 200 }
      return { ok: true, status: 201, headers: { get: (k) => (k.toLowerCase() === 'location' ? location : null) }, text: async () => 'v=0\r\no=- fake answer 1 1' }
    }
    const ticket = { ...vTicket(), whepUrl }
    const viewer = createWhepViewerController({ getTicket: () => ticket, remintTicket: async () => ticket, fetchImpl, createPeerConnection: () => fakePC(log, 'pc') })
    viewer.start()
    await flush()
    const playing = viewer.getState() === 'playing'
    viewer.stop()
    await flush()
    return { playing, requests }
  }
  const third = await runViewer('https://customer-x.cloudflarestream.com/li/webRTC/play', '/li/webRTC/play/res-1')
  const post = third.requests.find((r) => r.method === 'POST'), del = third.requests.find((r) => r.method === 'DELETE')
  check('third-party WHEP edge: the exchange plays', third.playing)
  check('third-party WHEP edge: the offer carries exactly Content-Type, no Authorization', post && JSON.stringify(Object.keys(post.headers)) === '["Content-Type"]', JSON.stringify(post))
  check('third-party WHEP edge: the DELETE goes to the same-origin resource with no headers at all', del && del.url === 'https://customer-x.cloudflarestream.com/li/webRTC/play/res-1' && JSON.stringify(del.headers) === '{}', JSON.stringify(del))
  const own = await runViewer('https://engine.boxly.mx/whep', '/whep/res-1')
  const ownPost = own.requests.find((r) => r.method === 'POST'), ownDel = own.requests.find((r) => r.method === 'DELETE')
  check('engine WHEP: the offer still carries the Bearer ticket', own.playing && ownPost?.headers.Authorization === 'Bearer tk-1')
  check('engine WHEP: the DELETE still carries the Bearer ticket', ownDel?.headers.Authorization === 'Bearer tk-1' && ownDel.url === 'https://engine.boxly.mx/whep/res-1')
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
