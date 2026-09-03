/**
 * Pure tests for utils/liveShopping.ts — the live-shopping viewer logic.
 *
 * Everything here runs with zero I/O: the incremental SSE parser (fragmented
 * chunks, multi-line data, heartbeats, byte caps INCLUDING endless no-newline
 * streams, cursor resume), the frozen EventV1 envelope (all 12 types, id/seq
 * discipline), the STRICT ProductV1 validator (mirrors the API's
 * ProductV1::boundStrict — closed keys, required store/store_id, availability
 * enum, non-negative 3-letter money, whole-list rejection), the Laravel public
 * envelope ({success,data}) with fixtures copied from
 * LiveShoppingController::present, the dual-ID session handle, ticket
 * validation (TTL ≤60s, https/credential/fragment rules, ICE validation),
 * refresh scheduling, backoff, the state machine, and the WHEP builders
 * (same-origin Location, bounded SDP).
 *
 *   node --experimental-strip-types utils/liveShopping.test.mjs
 */
import { liveResultsCaveat, liveFailureCopy,
  createSSEParser,
  parseEventV1, extractCandidates, terminalStatusFromEvent, eventActivity, EVENT_TYPES,
  validateProduct, validateHttpsUrl, availabilityText,
  unwrapPublicEnvelope, parseSessionCreateResponse, validateSessionHandle,
  isTerminal, moneyField, validateMoney, formatMoney, candidatePriceText,
  nextState, SESSION_TERMINALS,
  validateTicket, validateIceServers, ticketRefreshDelayMs,
  parseSessionStateResponse, terminalReasonText,
  reconnectDelayMs, MAX_RECONNECT_ATTEMPTS, RECONNECT_CAP_MS,
  buildWhepRequest, whepResourceUrl, buildWhepDelete, validateSdpAnswer,
  MAX_PRODUCTS_PER_EVENT, MAX_SDP_CHARS, MAX_OBSERVED_AT_FUTURE_MS,
} from './liveShopping.ts'
// GOLDEN cross-repo fixtures — the same bytes live in the engine and Laravel
// suites; every validator must accept them exactly, evaluated at GOLDEN.now.
import GOLDEN from './liveShopping.golden.json' with { type: 'json' }

const NOW = Date.parse(GOLDEN.now)

let pass = 0
let fail = 0
const check = (name, cond, detail = '') => {
  if (cond) { console.log(`  ✓ ${name}`); pass++ }
  else { console.log(`  ✗ ${name}  ${detail}`); fail++ }
}

const SID = 'eng_sess-1'
// A frozen EventV1 fixture; `frameId` overrides the SSE frame id independently.
const evFrame = (over = {}) => {
  const body = {
    schema_version: over.schema_version ?? 1,
    id: over.id ?? 'ev-1',
    session_id: over.session_id ?? SID,
    seq: over.seq ?? 1,
    type: over.type ?? 'worker.running',
    occurred_at: over.occurred_at ?? '2026-08-31T18:00:00Z',
  }
  if ('payload' in over) body.payload = over.payload
  return { event: 'message', data: JSON.stringify(body), id: 'frameId' in over ? over.frameId : body.id }
}
// A fully-valid canonical ProductV1 — the GOLDEN fixture plus overrides.
const productV1 = (over = {}) => ({ ...GOLDEN.product_v1, ...over })
// All product validation is evaluated at the golden clock, deterministically.
const vp = (p) => validateProduct(p, NOW)

// ── SSE parser ───────────────────────────────────────────────────────────────
// ── Authoritative session state + the 9th key (terminal-hydration boundary) ─
// Answers "what actually happened to this session?", which create's parser
// deliberately cannot: it insists on `running`. A real session ended
// store_blocked 599ms after the browser's stream closed, so the terminal frame
// never arrived and the panel blamed the connection. The DB held the reason all
// along; present() simply never presented it. error_code is that 9th key.
{
  const present = (over = {}) => ({
    id: 1003, status: 'failed', engine_session_id: 'dd25ac47-ebd0-4688-90c4-48ef9952d9b5',
    conversation_id: 6, store_id: 'new-balance', expires_at: null,
    created_at: '2026-09-01T06:45:46Z', updated_at: '2026-09-01T06:46:15Z',
    error_code: 'store_blocked', ...over,
  })
  const wrapped = (d) => ({ success: true, data: d })

  // GOLDEN: both branches of the shared fixture must validate exactly.
  const gCreate = parseSessionCreateResponse(GOLDEN.create_response)
  check('GOLDEN create still validates with the 9th key present as null', gCreate !== null && gCreate.status === 'running')
  const gFailed = parseSessionStateResponse(GOLDEN.session_state_response_failed)
  check('GOLDEN failed-session fixture yields status + reason', gFailed?.status === 'failed' && gFailed?.errorCode === 'store_blocked')

  check('terminal session parsed from the wrapped envelope', parseSessionStateResponse(wrapped(present()))?.status === 'failed')
  check('bare data accepted too', parseSessionStateResponse(present())?.status === 'failed')
  check('the reason reaches the caller', parseSessionStateResponse(present())?.errorCode === 'store_blocked')
  for (const st of ['completed', 'cancelled', 'failed', 'running', 'pending']) {
    check(`status ${st} round-trips (ANY status is legal here, unlike create)`, parseSessionStateResponse(present({ status: st, error_code: null }))?.status === st)
  }

  // Exact 9-key closed set — missing OR extra both reject.
  check('MISSING error_code rejected (it is now part of the contract)', (() => { const p = present(); delete p.error_code; return parseSessionStateResponse(p) === null })())
  check('missing any other key still rejected', (() => { const p = present(); delete p.store_id; return parseSessionStateResponse(p) === null })())
  check('extra 10th key rejected', parseSessionStateResponse(present({ debug: true })) === null)
  check('non-object rejected', parseSessionStateResponse(null) === null && parseSessionStateResponse([]) === null && parseSessionStateResponse('failed') === null)
  check('malformed status rejected', parseSessionStateResponse(present({ status: 'Failed!' })) === null && parseSessionStateResponse(present({ status: 42 })) === null)

  // The reason is server-controlled text that selects customer-facing copy.
  check('hostile code REJECTED to null, never rendered', parseSessionStateResponse(present({ error_code: 'store blocked <script>' }))?.errorCode === null)
  check('uppercase code rejected (sanitizer emits lowercase slugs)', parseSessionStateResponse(present({ error_code: 'STORE_BLOCKED' }))?.errorCode === null)
  check('overlong code rejected', parseSessionStateResponse(present({ error_code: 'x'.repeat(41) }))?.errorCode === null)
  check('non-string code rejected', parseSessionStateResponse(present({ error_code: 42 }))?.errorCode === null)
  check('null code tolerated', parseSessionStateResponse(present({ error_code: null }))?.errorCode === null)
  check("the sanitizer's own fallback literal passes through", parseSessionStateResponse(present({ error_code: 'failed' }))?.errorCode === 'failed')
  check('a reason on a NON-failed session is dropped, not narrated', parseSessionStateResponse(present({ status: 'completed', error_code: 'store_blocked' }))?.errorCode === null)
  // The ONE completed caveat survives the parser (live 2026-09-03: the outcome-hint
  // authority read committed the terminal with a nulled code and the remounted panel
  // lost its amber card); everything else on a non-failed session still drops.
  check('completed + partial_match keeps the caveat', parseSessionStateResponse(present({ status: 'completed', error_code: 'partial_match' }))?.errorCode === 'partial_match')
  check('completed + any other code drops it', parseSessionStateResponse(present({ status: 'completed', error_code: 'store_blocked' }))?.errorCode === null)
  check('completed + upper-case caveat drops (closed vocabulary, exact)', parseSessionStateResponse(present({ status: 'completed', error_code: 'PARTIAL_MATCH' }))?.errorCode === null)
  for (const st of ['cancelled', 'running', 'pending']) check(`${st} + partial_match drops`, parseSessionStateResponse(present({ status: st, error_code: 'partial_match' }))?.errorCode === null)
  check('failed + partial_match still passes as a failed reason (unchanged)', parseSessionStateResponse(present({ status: 'failed', error_code: 'partial_match' }))?.errorCode === 'partial_match')

  // Create's contract: running means no reason.
  check('create REFUSES a non-running session', parseSessionCreateResponse(wrapped(present({ status: 'failed' }))) === null)
  check('create accepts error_code null', parseSessionCreateResponse(wrapped(present({ status: 'running', error_code: null }))) !== null)
  check('create REFUSES a running session that also claims a reason', parseSessionCreateResponse(wrapped(present({ status: 'running', error_code: 'store_blocked' }))) === null)
  check('create REFUSES the 8-key legacy shape (lockstep, not tolerated drift)', (() => { const p = present({ status: 'running' }); delete p.error_code; return parseSessionCreateResponse(wrapped(p)) === null })())

  // Closed mapping — the raw code never reaches the customer.
  check('store_blocked maps to the store story', /bloqueó/.test(terminalReasonText('store_blocked')))
  check('timeout family maps to a timeout story', terminalReasonText('session_deadline_exceeded') === terminalReasonText('expired'))
  check('engine family maps to a service story', terminalReasonText('engine_restarted') === terminalReasonText('engine_unavailable'))
  check('worker_cancelled is its own story', /canceló/.test(terminalReasonText('worker_cancelled')))
  check('store_error tells the store-error story, never blocked', /mostró un error/.test(terminalReasonText('store_error')) && !/bloqueó/.test(terminalReasonText('store_error')))
  check('verification_incomplete is the neutral ending, never blocked', /terminó sin completar/.test(terminalReasonText('verification_incomplete')) && !/bloqueó/.test(terminalReasonText('verification_incomplete')))
  check('deployment-order fallback: the neutral ending equals the default an older frontend renders', terminalReasonText('verification_incomplete') === terminalReasonText('some_new_code_2027'))
  check('UNKNOWN code still says the session ended', /terminó sin completar/.test(terminalReasonText('some_new_code_2027')))
  check("the sanitizer's 'failed' literal reads honestly", /terminó sin completar/.test(terminalReasonText('failed')))
  check('null reason gets the same honest ending', /terminó sin completar/.test(terminalReasonText(null)))
  check('NO mapping ever blames the connection', ['store_blocked', 'store_error', 'verification_incomplete', 'expired', 'engine_unavailable', 'worker_error', 'worker_cancelled', 'failed', null, 'zzz'].every((c) => !/conexión/i.test(terminalReasonText(c))))
  check('raw server code is never echoed to the customer', ['store_blocked', 'engine_state_lost', 'worker_ready_timeout'].every((c) => !terminalReasonText(c).includes(c)))
}

console.log('SSE incremental parser')
{
  const p = createSSEParser()
  const frames = []
  for (const chunk of ['event: cand', 'idate\nda', 'ta: {"a"', ':1}\nid: 42\n', '\n']) frames.push(...p.feed(chunk))
  check('fragmented chunks reassemble into one frame', frames.length === 1 && frames[0].event === 'candidate' && frames[0].data === '{"a":1}' && frames[0].id === '42')
  check('frame-level cursor reports the id', p.lastEventId() === '42')
}
{
  const p = createSSEParser()
  const frames = p.feed('data: line1\r\ndata: line2\r\n\r\n')
  check('multi-line data fields join with newline (CRLF)', frames.length === 1 && frames[0].data === 'line1\nline2')
}
{
  const p = createSSEParser()
  const frames = p.feed(':heartbeat\n\n: another\ndata: x\n\n')
  check('comments/heartbeats are ignored', frames.length === 1 && frames[0].data === 'x')
}
{
  const p = createSSEParser({ frameByteCap: 64 })
  const big = 'data: ' + 'x'.repeat(200) + '\n\n'
  const after = [...p.feed(big), ...p.feed('id: 7\ndata: ok\n\n')]
  check('oversize frame dropped at the cap, counted', p.droppedFrames() === 1)
  check('stream survives the drop — next frame parses', after.length === 1 && after[0].data === 'ok' && after[0].id === '7')
}
{
  // ENDLESS LINE WITH NO NEWLINE: memory must stay bounded — nothing oversized
  // is retained while the hostile line streams, and the stream recovers after.
  const p = createSSEParser({ frameByteCap: 1024 })
  let emitted = []
  for (let i = 0; i < 50; i++) emitted.push(...p.feed('y'.repeat(4096))) // ~200KB, no newline ever
  check('no-newline flood emits nothing', emitted.length === 0)
  emitted = [...p.feed('tail-of-flood\n\n'), ...p.feed('id: n1\ndata: alive\n\n')]
  check('flood frame dropped at its boundary, stream recovers', p.droppedFrames() >= 1 && emitted.length === 1 && emitted[0].data === 'alive')
}
{
  // Multibyte content split across feeds (surrogate pair torn in half).
  const p = createSSEParser()
  const line = 'data: 😀ok\n\n'
  const cut = line.indexOf('😀') + 1 // splits the surrogate pair
  const frames = [...p.feed(line.slice(0, cut)), ...p.feed(line.slice(cut))]
  check('multibyte split across chunks reassembles', frames.length === 1 && frames[0].data === '😀ok')
}
{
  const p = createSSEParser()
  p.feed('id: 1\ndata: full\n\n')
  const frames = p.feed('id: 2\ndata: torn-off-mid')
  check('abort mid-frame emits nothing', frames.length === 0)
  check('mid-frame abort leaves the cursor at the last COMPLETE frame', p.lastEventId() === '1')
}
{
  const p = createSSEParser()
  const frames = [...p.feed('data: a\r'), ...p.feed('\ndata: b\n\n')]
  check('CR at chunk edge held until the LF arrives', frames.length === 1 && frames[0].data === 'a\nb')
}
{
  const p = createSSEParser()
  const frames = p.feed(`id: ${'z'.repeat(300)}\ndata: x\n\n`)
  check('overlong id line ignored (bounded)', frames.length === 1 && frames[0].id === null)
}

// ── EventV1 envelope ─────────────────────────────────────────────────────────
console.log('EventV1 envelope (frozen)')
{
  let allTypes = true
  EVENT_TYPES.forEach((type, i) => {
    const ev = parseEventV1(evFrame({ type, id: `e${i}`, seq: i + 1 }), SID)
    if (!ev || ev.type !== type || ev.seq !== i + 1 || ev.sessionId !== SID) allTypes = false
  })
  check('every closed type parses (all 12)', allTypes)
  check('unknown type rejected', parseEventV1(evFrame({ type: 'worker.exploded' }), SID) === null)
  check('wrong schema_version rejected', parseEventV1(evFrame({ schema_version: 2 }), SID) === null)
  check('wrong session_id rejected (engine id domain)', parseEventV1(evFrame({ session_id: 'eng_OTHER' }), SID) === null)
  check('SSE frame id must EXACTLY equal data.id', parseEventV1(evFrame({ frameId: 'different' }), SID) === null)
  check('missing SSE frame id rejected', parseEventV1(evFrame({ frameId: null }), SID) === null)
  check('non-integer seq rejected', parseEventV1(evFrame({ seq: 1.5 }), SID) === null && parseEventV1(evFrame({ seq: '2' }), SID) === null)
  check('non-positive seq rejected', parseEventV1(evFrame({ seq: 0 }), SID) === null && parseEventV1(evFrame({ seq: -3 }), SID) === null)
  check('bad occurred_at rejected', parseEventV1(evFrame({ occurred_at: 'not a date' }), SID) === null && parseEventV1(evFrame({ occurred_at: 123 }), SID) === null)
  check('array payload rejected', parseEventV1(evFrame({ payload: [1, 2] }), SID) === null)
  check('overlong event id rejected', parseEventV1(evFrame({ id: 'e'.repeat(250), frameId: 'e'.repeat(250) }), SID) === null)
  check('malformed JSON rejected', parseEventV1({ event: 'message', data: '{oops', id: 'x' }, SID) === null)
  const noPayload = parseEventV1(evFrame({ id: 'np', seq: 9 }), SID)
  check('absent payload normalizes to {}', noPayload !== null && typeof noPayload.payload === 'object')
}
{
  check('terminal mapping: session.completed/failed/cancelled', terminalStatusFromEvent('session.completed') === 'completed' && terminalStatusFromEvent('session.failed') === 'failed' && terminalStatusFromEvent('session.cancelled') === 'cancelled')
  check('non-terminals map to null', terminalStatusFromEvent('session.cancelling') === null && terminalStatusFromEvent('candidate') === null && terminalStatusFromEvent('media.failed') === null)
  check('activity mapping is honest', eventActivity('session.created') === 'starting' && eventActivity('worker.starting') === 'starting' && eventActivity('worker.running') === 'browsing' && eventActivity('worker.progress') === 'browsing' && eventActivity('candidate') === 'browsing' && eventActivity('session.cancelling') === 'cancelling' && eventActivity('media.publishing') === 'media_publishing' && eventActivity('media.ready') === 'media_ready' && eventActivity('media.failed') === 'media_failed')
}

// ── ProductV1 (canonical frozen v1 — golden fixture must pass byte-for-byte) ─
console.log('ProductV1 strict validation')
{
  const ok = vp(GOLDEN.product_v1)
  check('GOLDEN ProductV1 accepted exactly (all 9 keys, query URLs, fractional observed_at)', ok !== null && ok.store === 'Target' && ok.store_id === 'target' && ok.availability === 'in_stock' && ok.observed_at === '2026-08-31T18:04:30.250Z' && ok.image !== null && ok.current_price?.amount === 19.99)
  check('normalized COPY returned — golden references never preserved', ok !== null && ok.current_price !== GOLDEN.product_v1.current_price && vp(GOLDEN.product_v1) !== ok)
  check('unknown key invalidates the product', vp(productV1({ price: 9 })) === null && vp(productV1({ snippet: 'x' })) === null && vp(productV1({ id: 'p1' })) === null)
  const missing = (k) => { const p = productV1(); delete p[k]; return p }
  check('ALL nine keys required — dropping ANY one rejects', ['store', 'store_id', 'title', 'url', 'image', 'current_price', 'list_price', 'availability', 'observed_at'].every((k) => vp(missing(k)) === null))
  check('undefined-valued required key rejected too', vp({ ...productV1(), store: undefined }) === null && vp({ ...productV1(), store_id: undefined }) === null)
  check('store_id must match the engine slug rule', vp(productV1({ store_id: 'Bad Slug!' })) === null && vp(productV1({ store_id: 'x'.repeat(41) })) === null)
  check('title bounded at 300', vp(productV1({ title: 'x'.repeat(300) })) !== null && vp(productV1({ title: 'x'.repeat(301) })) === null)
  check('availability REQUIRED — null rejected', vp(productV1({ availability: null })) === null)
  check('availability outside the closed enum rejected', vp(productV1({ availability: 'plenty' })) === null)
  check('observed_at REQUIRED — null rejected', vp(productV1({ observed_at: null })) === null)
  check('observed_at must be STRICT UTC RFC3339 (Z only, ≤3 fraction digits)', vp(productV1({ observed_at: 'yesterday-ish' })) === null && vp(productV1({ observed_at: '2026-08-31T18:04:30+00:00' })) === null && vp(productV1({ observed_at: '2026-08-31T18:04:30.1234Z' })) === null && vp(productV1({ observed_at: '2026-08-31 18:04:30Z' })) === null)
  check('observed_at more than 5m in the future rejected; exactly 5m allowed', vp(productV1({ observed_at: new Date(NOW + MAX_OBSERVED_AT_FUTURE_MS + 1000).toISOString() })) === null && vp(productV1({ observed_at: new Date(NOW + MAX_OBSERVED_AT_FUTURE_MS).toISOString() })) !== null)
  check('javascript:/data:/http:/credential URLs all rejected', ['javascript:alert(1)', 'data:text/html,x', 'http://t.com/p', 'https://u:p@t.com/p'].every((u) => vp(productV1({ url: u })) === null))
  check('FRAGMENT in product url rejected (query stays allowed)', vp(productV1({ url: 'https://t.com/p#frag' })) === null && vp(productV1({ url: 'https://t.com/p?q=1' })) !== null)
  check('present-but-invalid image rejects the PRODUCT (no partial salvage)', vp(productV1({ image: 'javascript:alert(1)' })) === null && vp(productV1({ image: 'https://t.com/i.jpg#x' })) === null)
  check('image null OR valid https-with-query kept', vp(productV1({ image: null }))?.image === null && vp(productV1({ image: 'https://t.com/i.jpg?wid=800' }))?.image === 'https://t.com/i.jpg?wid=800')
  check('NEGATIVE money rejects the product', vp(productV1({ current_price: { amount: -5, currency: 'USD' } })) === null)
  check('money with extra keys rejects the product', vp(productV1({ list_price: { amount: 5, currency: 'USD', tax: 1 } })) === null)
  check('string-amount money rejected (no coercion)', vp(productV1({ current_price: { amount: '12.50', currency: 'USD' } })) === null)
  check('non-3-letter currency rejected', vp(productV1({ current_price: { amount: 5, currency: 'US' } })) === null && vp(productV1({ current_price: { amount: 5, currency: 'DOLLARS' } })) === null)
  check('lowercase currency rejected — NEVER coerced', vp(productV1({ current_price: { amount: 5, currency: 'usd' } })) === null)
  check('control chars in title rejected', vp(productV1({ title: 'bad\u0007title' })) === null) // BEL written as an escape: identical runtime string, no raw control byte in source
}
{
  // Whole-delivery strictness through extractCandidates.
  const ev = (products) => parseEventV1(evFrame({ type: 'candidate', payload: { output: { products } } }), SID)
  check('valid multi-product delivery extracts ALL', extractCandidates(ev([productV1(), productV1({ url: 'https://t.com/2', title: 'Otro' })])).length === 2)
  check('ONE malformed product rejects the WHOLE delivery', extractCandidates(ev([productV1(), { title: 'no url' }])).length === 0)
  check('over-cap delivery is a fault, not a slice', extractCandidates(ev(Array.from({ length: MAX_PRODUCTS_PER_EVENT + 1 }, (_, i) => productV1({ url: `https://t.com/${i}` })))).length === 0)
  check('non-candidate event extracts nothing', extractCandidates(parseEventV1(evFrame({ type: 'worker.progress' }), SID)).length === 0)
}
{
  check('moneyField: absent→null, valid→Money, lowercase/malformed→invalid', moneyField(null) === null && moneyField({ amount: 5, currency: 'USD' })?.currency === 'USD' && moneyField({ amount: 5, currency: 'usd' }) === 'invalid' && moneyField({ amount: -1, currency: 'USD' }) === 'invalid' && moneyField('x') === 'invalid')
  check('formatMoney renders amount + EXPLICIT currency', formatMoney({ amount: 129.99, currency: 'USD' }) === '129.99 USD')
  check('formatMoney never yields [object Object] or $', formatMoney({ nested: true }) === null && validateMoney(null) === null)
  check('candidatePriceText prefers current_price', candidatePriceText({ current_price: { amount: 10, currency: 'MXN' }, list_price: { amount: 12, currency: 'MXN' } }) === '10 MXN')
  check('candidatePriceText: NO legacy scalar fallback (not in ProductV1)', candidatePriceText({ price: 42.5 }) === null)
  check('unknown/null price renders nothing', candidatePriceText({}) === null && candidatePriceText({ current_price: null }) === null && candidatePriceText(null) === null)
  check('availability rendered honestly (closed labels, unknown = no claim)', availabilityText('in_stock') === 'En stock' && availabilityText('out_of_stock') === 'Agotado' && availabilityText('preorder') === 'Preventa' && availabilityText('backorder') === 'Por encargo' && availabilityText('unknown') === null && availabilityText(null) === null && availabilityText('plenty') === null)
}

// ── Laravel public envelope + dual-ID handle ─────────────────────────────────
console.log('Laravel envelope + session handle (two ID domains)')
{
  // GOLDEN create fixture — byte-for-byte the LiveShoppingController::present
  // 201 body (same bytes in the engine and Laravel suites).
  const createFixture = GOLDEN.create_response
  check('unwrapPublicEnvelope: success:true → data', unwrapPublicEnvelope(createFixture)?.id === 41)
  check('unwrapPublicEnvelope: success:false → null', unwrapPublicEnvelope({ success: false, message: 'You already have a live shopping session running.' }) === null)
  check('unwrapPublicEnvelope: missing data → null', unwrapPublicEnvelope({ success: true }) === null)
  check('unwrapPublicEnvelope: malformed data → null', unwrapPublicEnvelope({ success: true, data: 'oops' }) === null && unwrapPublicEnvelope(null) === null)

  const h = parseSessionCreateResponse(createFixture)
  check('create fixture → dual-ID handle', h !== null && h.localSessionId === '41' && h.engineSessionId === 'eng_8f2c1a' && h.status === 'running')
  const unwrapped = parseSessionCreateResponse(createFixture.data) // callApi collapses the envelope to data
  check('callApi-collapsed data object parses identically', unwrapped !== null && unwrapped.localSessionId === '41' && unwrapped.engineSessionId === 'eng_8f2c1a')
  check('error envelope → null (no guessing)', parseSessionCreateResponse({ success: false, message: 'nope' }) === null)
  check('missing engine_session_id → null (never fall back to local id)', parseSessionCreateResponse({ ...createFixture.data, engine_session_id: null }) === null)
  check('non-integer local id → null', parseSessionCreateResponse({ ...createFixture.data, id: 'forty-one' }) === null)
  check('old single-id shape → null', parseSessionCreateResponse({ session_id: 'x', status: 'running' }) === null)
  check('status must be EXACTLY "running" — pending/completed rejected', parseSessionCreateResponse({ ...createFixture.data, status: 'pending' }) === null && parseSessionCreateResponse({ ...createFixture.data, status: 'completed' }) === null)
  check('EXTRA create data key rejected (exact key set)', parseSessionCreateResponse({ ...createFixture.data, surprise: 1 }) === null)
  const droppedKey = (k) => { const d = { ...createFixture.data }; delete d[k]; return d }
  check('MISSING create data key rejected (exact key set)', parseSessionCreateResponse(droppedKey('conversation_id')) === null && parseSessionCreateResponse(droppedKey('expires_at')) === null)

  check('valid dual-ID handle accepted', validateSessionHandle({ localSessionId: '41', engineSessionId: 'eng_8f2c1a', status: 'running' }) !== null)
  check('local id must be numeric-string (Laravel domain)', validateSessionHandle({ localSessionId: 'eng_8f2c1a', engineSessionId: 'eng_8f2c1a', status: 'running' }) === null)
  // The engine-id bound is LARAVEL'S (boundedId(id, 200)): ≤200 chars, no
  // control chars, trimmed. What Laravel accepted must parse here — a stricter
  // frontend guess would turn a healthy session into "unavailable".
  check('engine id: Laravel-accepted 200-char id accepted', validateSessionHandle({ localSessionId: '41', engineSessionId: 'x'.repeat(200), status: 'running' }) !== null)
  check('engine id: interior spaces legal (Laravel domain)', validateSessionHandle({ localSessionId: '41', engineSessionId: 'has spaces', status: 'running' }) !== null)
  check('engine id: over 200 chars rejected', validateSessionHandle({ localSessionId: '41', engineSessionId: 'x'.repeat(201), status: 'running' }) === null)
  check('engine id: control chars rejected', validateSessionHandle({ localSessionId: '41', engineSessionId: 'eng\x00id', status: 'running' }) === null)
  check('engine id: untrimmed/empty rejected', validateSessionHandle({ localSessionId: '41', engineSessionId: ' padded ', status: 'running' }) === null && validateSessionHandle({ localSessionId: '41', engineSessionId: '', status: 'running' }) === null)
  check('old {sessionId} shape rejected', validateSessionHandle({ sessionId: '41', status: 'running' }) === null)
  check('create-failure shape {ok:false} rejected', validateSessionHandle({ ok: false, error: 'live_session_unavailable' }) === null && validateSessionHandle(null) === null)
}

// ── State machine ────────────────────────────────────────────────────────────
console.log('Session state machine')
{
  check('connecting --open--> streaming', nextState('connecting', { type: 'open' }) === 'streaming')
  check('streaming --drop--> reconnecting', nextState('streaming', { type: 'drop' }) === 'reconnecting')
  check('reconnecting --open--> streaming', nextState('reconnecting', { type: 'open' }) === 'streaming')
  check('reconnecting --give_up--> failed', nextState('reconnecting', { type: 'give_up' }) === 'failed')
  check('connecting --expired--> expired', nextState('connecting', { type: 'expired' }) === 'expired')
  let all = true
  for (const t of SESSION_TERMINALS) {
    if (nextState('streaming', { type: 'terminal', status: t }) !== t) all = false
    for (const ev of [{ type: 'open' }, { type: 'drop' }, { type: 'give_up' }, { type: 'terminal', status: 'failed' }]) {
      if (nextState(t, ev) !== t) all = false
    }
  }
  check('all four terminals reachable and absorbing', all)
  check('non-terminal "terminal" event is ignored', nextState('streaming', { type: 'terminal', status: 'running' }) === 'streaming')
  check('isTerminal matches the enum', isTerminal('completed') && isTerminal('expired') && !isTerminal('running'))
}

// ── Ticket + refresh scheduling ──────────────────────────────────────────────
console.log('Ticket + refresh scheduling')
{
  const NOW = Date.parse('2026-08-31T18:00:00Z')
  const raw = (over = {}) => ({
    ticket: 'tk-abc',
    expires_at: new Date(NOW + 45_000).toISOString(),
    sse_url: 'https://engine.boxly.mx/sse',
    media_available: true,
    whep_url: 'https://engine.boxly.mx/whep',
    ice_servers: [{ urls: 'stun:stun.example.com' }],
    ...over,
  })
  const t = validateTicket(raw(), NOW)
  check('valid ticket accepted (ISO, 45s TTL)', t !== null && t.expiresAtMs === NOW + 45_000 && t.iceServers.length === 1)
  // GOLDEN ticket fixture: the browser transport is the WRAPPED envelope; the
  // controller unwraps then validates. Golden expires_at is NOW+45s.
  const gt = validateTicket(unwrapPublicEnvelope(GOLDEN.ticket_response), Date.parse(GOLDEN.now))
  check('GOLDEN wrapped ticket unwraps + validates exactly', gt !== null && gt.ticket === 'vt_9a41c0ffee' && gt.sseUrl.startsWith('https://engine.boxly.mx/') && gt.iceServers.length === 2 && gt.iceServers[1].username === 'u1')
  check('EXTRA ticket key rejected (exact key set)', validateTicket(raw({ debug: true }), NOW) === null)
  check('missing ice_servers key rejected (exact key set)', (() => { const r = raw(); delete r.ice_servers; return validateTicket(r, NOW) === null })())
  check('non-array ice_servers rejected', validateTicket(raw({ ice_servers: 'stun:x' }), NOW) === null)
  check('exactly 60s TTL accepted', validateTicket(raw({ expires_at: new Date(NOW + 60_000).toISOString() }), NOW) !== null)
  check('TTL over 60s REJECTED (issue discipline)', validateTicket(raw({ expires_at: new Date(NOW + 61_000).toISOString() }), NOW) === null)
  check('expired ticket rejected', validateTicket(raw({ expires_at: new Date(NOW - 1).toISOString() }), NOW) === null)
  const secs = Math.floor((NOW + 30_000) / 1000)
  check('epoch-seconds expiry normalized', validateTicket(raw({ expires_at: secs }), NOW)?.expiresAtMs === secs * 1000)
  check('http sse_url rejected', validateTicket(raw({ sse_url: 'http://engine.boxly.mx/sse' }), NOW) === null)
  check('credentials in whep_url rejected', validateTicket(raw({ whep_url: 'https://u:p@engine.boxly.mx/whep' }), NOW) === null)
  check('fragment in sse_url rejected', validateTicket(raw({ sse_url: 'https://engine.boxly.mx/sse#x' }), NOW) === null)
  check('overlong ticket rejected', validateTicket(raw({ ticket: 'x'.repeat(5000) }), NOW) === null)
  check('missing fields rejected', validateTicket({ ticket: 'tk', sse_url: 'https://e/s' }, NOW) === null && validateTicket(null, NOW) === null)

  // ── media_available: the events plane must not depend on the media plane ──
  // The engine has no publisher in P1, so a ticket that could not be minted
  // without media would cost the customer the PROGRESS stream too, not just the
  // video. The flag is a biconditional and every mixed combination is refused:
  // we will not guess which half of a self-contradicting ticket to believe.
  const noMedia = (over = {}) => raw({ media_available: false, whep_url: null, ice_servers: [], ...over })
  const nm = validateTicket(noMedia(), NOW)
  check('media-unavailable ticket ACCEPTED (events still work)', nm !== null && nm.mediaAvailable === false)
  check('media-unavailable ticket keeps a usable sse_url', nm?.sseUrl === 'https://engine.boxly.mx/sse')
  check('media-unavailable ticket exposes whepUrl null, no ICE', nm?.whepUrl === null && nm?.iceServers.length === 0)
  check('media-available ticket exposes the flag as true', t?.mediaAvailable === true)
  const gnm = validateTicket(unwrapPublicEnvelope(GOLDEN.ticket_response_no_media), Date.parse(GOLDEN.now))
  check('GOLDEN media-unavailable ticket validates exactly', gnm !== null && gnm.mediaAvailable === false && gnm.whepUrl === null && gnm.iceServers.length === 0)
  check('GOLDEN media-available ticket reports the flag', gt?.mediaAvailable === true)
  check('non-boolean media_available rejected', validateTicket(raw({ media_available: 'true' }), NOW) === null)
  check('missing media_available rejected (exact key set)', (() => { const r = raw(); delete r.media_available; return validateTicket(r, NOW) === null })())
  check('true + null whep_url REJECTED (claims media it cannot serve)', validateTicket(raw({ whep_url: null }), NOW) === null)
  check('true + empty ice_servers REJECTED (unreachable media plane)', validateTicket(raw({ ice_servers: [] }), NOW) === null)
  check('true + only malformed ice_servers REJECTED', validateTicket(raw({ ice_servers: [{ urls: 'https://not-ice' }] }), NOW) === null)
  check('false + whep_url present REJECTED', validateTicket(noMedia({ whep_url: 'https://engine.boxly.mx/whep' }), NOW) === null)
  check('false + non-empty ice_servers REJECTED', validateTicket(noMedia({ ice_servers: [{ urls: 'stun:x.example' }] }), NOW) === null)
  check('false + undefined whep_url REJECTED (absent is not null)', validateTicket(noMedia({ whep_url: undefined }), NOW) === null)
  check('false + empty-string whep_url REJECTED', validateTicket(noMedia({ whep_url: '' }), NOW) === null)
  check('media-unavailable ticket still bound by the 60s TTL', validateTicket(noMedia({ expires_at: new Date(NOW + 61_000).toISOString() }), NOW) === null)
  const ice = validateIceServers([
    { urls: 'stun:ok.example' },
    { urls: ['turn:ok.example', 'ftp://evil'] },
    { urls: 'https://not-ice.example' },
    'not-an-object',
    { urls: 'turns:ok.example', username: 'u', credential: 'c' },
    { urls: 'turn:overlong.example', username: 'u'.repeat(600) },
  ])
  check('ICE: known schemes kept, junk dropped', ice.length === 4 && ice[1].urls.length === 1 && ice[2].username === 'u')
  check('ICE: creds bounded (overlong username dropped)', ice[3].username === undefined)
  check('ICE: non-array → empty', validateIceServers('x').length === 0)

  let never = true
  for (const remaining of [1, 100, 499, 500, 1000, 60000]) {
    const d = ticketRefreshDelayMs(remaining, 0)
    if (d !== null && d >= remaining) never = false
  }
  check('refresh never schedules past expiry', never)
  check('refresh at half TTL', ticketRefreshDelayMs(60000, 0) === 30000)
  check('expired/too-close: no refresh', ticketRefreshDelayMs(0, 0) === null && ticketRefreshDelayMs(400, 0) === null)
}

// ── Backoff ──────────────────────────────────────────────────────────────────
console.log('Reconnect backoff')
{
  const seq = [1, 2, 3, 4, 5, 6, 7, 20].map(reconnectDelayMs)
  check('backoff doubles from 1s', seq[0] === 1000 && seq[1] === 2000 && seq[2] === 4000 && seq[3] === 8000)
  check('backoff is capped', seq.every((d) => d <= RECONNECT_CAP_MS) && seq[7] === RECONNECT_CAP_MS)
  check('attempt budget is finite', Number.isInteger(MAX_RECONNECT_ATTEMPTS) && MAX_RECONNECT_ATTEMPTS > 0)
}

// ── WHEP builders ────────────────────────────────────────────────────────────
console.log('WHEP request builders')
{
  const req = buildWhepRequest('https://engine.boxly.mx/whep', 'tk-123', 'v=0 offer')
  check('POST with application/sdp + Bearer header', req.method === 'POST' && req.headers['Content-Type'] === 'application/sdp' && req.headers.Authorization === 'Bearer tk-123' && req.body === 'v=0 offer')
  check('ticket is in the header, NEVER the URL', !req.url.includes('tk-123'))
  check('relative Location resolves same-origin', whepResourceUrl('https://engine.boxly.mx/whep', '/whep/res/9') === 'https://engine.boxly.mx/whep/res/9')
  check('same-origin absolute Location accepted', whepResourceUrl('https://engine.boxly.mx/whep', 'https://engine.boxly.mx/whep/res/9') !== null)
  check('CROSS-ORIGIN Location refused', whepResourceUrl('https://engine.boxly.mx/whep', 'https://evil.example/whep/res/9') === null)
  check('http Location refused', whepResourceUrl('https://engine.boxly.mx/whep', 'http://engine.boxly.mx/whep/res/9') === null)
  check('credentialed Location refused', whepResourceUrl('https://engine.boxly.mx/whep', 'https://u:p@engine.boxly.mx/r') === null)
  check('overlong Location refused', whepResourceUrl('https://engine.boxly.mx/whep', '/r/' + 'a'.repeat(3000)) === null)
  check('missing Location → null', whepResourceUrl('https://engine.boxly.mx/whep', null) === null)
  const del = buildWhepDelete('https://engine.boxly.mx/whep/res/9', 'tk-123')
  check('DELETE carries the Bearer header only', del.method === 'DELETE' && del.headers.Authorization === 'Bearer tk-123' && !del.url.includes('tk-123'))
  check('SDP answer: sane accepted, junk/oversize refused', validateSdpAnswer('v=0\r\no=- 1 1 IN IP4 0.0.0.0') !== null && validateSdpAnswer('<html>nope</html>') === null && validateSdpAnswer('v=' + 'x'.repeat(MAX_SDP_CHARS + 10)) === null && validateSdpAnswer('v=0') === null)
}

// liveFailureCopy: a store the engine does not support is actionable copy; everything else stays generic.
check('unsupported store copy lists the supported stores', liveFailureCopy({ ok: false, error: 'store_not_supported', supported: ['Target', ' Walmart '] }) === 'Boxly aún no puede verificar en vivo en esa tienda. Puedo intentarlo en: Target, Walmart.')
check('unsupported store copy without a list stays honest', liveFailureCopy({ ok: false, error: 'store_not_supported', supported: [] }) === 'Boxly aún no puede verificar en vivo en esa tienda.')
check('unsupported store copy bounds and sanitises names', liveFailureCopy({ error: 'store_not_supported', supported: [1, '', 'x'.repeat(100), 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'] }).length < 160)
check('generic failures keep the outage line', liveFailureCopy({ ok: false, error: 'live_session_unavailable' }) === 'La sesión en vivo no está disponible en este momento. Intenta de nuevo en un rato.' && liveFailureCopy(null) === 'La sesión en vivo no está disponible en este momento. Intenta de nuevo en un rato.')

check('partial_match reason copy is the honest caveat', terminalReasonText('partial_match') === 'Verificamos un producto, pero no cumple todo lo que pediste; revisa los detalles antes de decidir.')

check('capability-unavailable copy is honest and keeps the conversation going', liveFailureCopy({ ok: false, error: 'live_capability_unavailable' }) === 'La verificación en vivo no está disponible en este momento; puedo seguir ayudándote de otra forma.')
check('a partial_match gallery carries the visible constraint-missing label', liveResultsCaveat({ products: [{}], caveat: 'partial_match' }) === 'Verificado en la tienda, pero no cumple todo lo que pediste — revisa los detalles antes de decidir.')
check('a full-match gallery carries no label', liveResultsCaveat({ products: [{}] }) === '' && liveResultsCaveat(null) === '' && liveResultsCaveat({ caveat: 'other' }) === '')

// L2 (multi-store): present() may carry a tenth key `stores`; the parsers accept it and still reject any other extra.
{
  const { parseSessionCreateResponse, parseSessionStateResponse } = await import('./liveShopping.ts')
  const nine = { id: 1073, status: 'running', engine_session_id: 'dd25ac47-ebd0-4688-90c4-48ef9952d9b5', conversation_id: 78, store_id: 'target', expires_at: null, created_at: '2026-09-03T00:00:00Z', updated_at: '2026-09-03T00:00:00Z', error_code: null }
  const ten = { ...nine, stores: [{ id: 'target', status: 'running', error_code: null }, { id: 'walmart', status: 'running', error_code: null }] }
  check('create: the nine-key present() still parses', parseSessionCreateResponse({ success: true, data: nine })?.localSessionId === '1073')
  check('create: the ten-key present() (with stores) parses to the same handle', parseSessionCreateResponse({ success: true, data: ten })?.localSessionId === '1073')
  check('create: any other extra key is still rejected', parseSessionCreateResponse({ success: true, data: { ...nine, extra: 1 } }) === null)
  check('state: ten keys with stores parse; nine keys still parse', parseSessionStateResponse({ success: true, data: { ...ten, status: 'completed', error_code: 'partial_match' } })?.errorCode === 'partial_match' && parseSessionStateResponse({ success: true, data: nine })?.status === 'running')
  check('state: a missing required key is still rejected even with stores present', parseSessionStateResponse({ success: true, data: (({ error_code, ...rest }) => rest)(ten) }) === null)
}

// Item 3: liveSessionIdFor — the last valid tool-live_verify handle in a conversation.
{
  const { liveSessionIdFor } = await import('./liveShopping.ts')
  const handle = (localSessionId, status = 'running') => ({ type: 'tool-live_verify', state: 'output-available', output: { localSessionId, engineSessionId: 'dd25ac47-ebd0-4688-90c4-48ef9952d9b5', status } })
  check('liveSessionIdFor: the last valid handle wins', liveSessionIdFor([{ parts: [handle('1001')] }, { parts: [{ type: 'text', text: 'x' }, handle('1003')] }]) === '1003')
  check('liveSessionIdFor: nothing valid ⇒ null', liveSessionIdFor([]) === null && liveSessionIdFor(undefined) === null && liveSessionIdFor([{ parts: [{ ...handle('x!'), output: { localSessionId: 'x!', engineSessionId: 'nope', status: 'running' } }] }]) === null)
  check('liveSessionIdFor: a pending handle part does not count', liveSessionIdFor([{ parts: [{ ...handle('1003'), state: 'input-available' }] }]) === null)
}

// A.1: readHistoryTerminal — hydrate a history-terminal panel's reason from the authority, and nothing else.
{
  const { readHistoryTerminal } = await import('./liveShopping.ts')
  const handle = { localSessionId: '1073', engineSessionId: 'dd25ac47-ebd0-4688-90c4-48ef9952d9b5', status: 'completed' }
  const present = (status, error_code) => ({ id: 1073, status, engine_session_id: handle.engineSessionId, conversation_id: 78, store_id: 'best-buy', expires_at: null, created_at: null, updated_at: null, error_code })
  let fetches = 0
  const fetchSession = (r) => async () => { fetches++; return r }
  check('history-terminal + no memory + authority completed/partial_match → the caveat', JSON.stringify(await readHistoryTerminal(fetchSession(present('completed', 'partial_match')), handle, null)) === JSON.stringify({ status: 'completed', errorCode: 'partial_match' }))
  check('authority completed without a code → completed, null', JSON.stringify(await readHistoryTerminal(fetchSession(present('completed', null)), handle, null)) === JSON.stringify({ status: 'completed', errorCode: null }))
  check('a live handle never reads the authority', (fetches = 0, await readHistoryTerminal(fetchSession(present('completed', 'partial_match')), { ...handle, status: 'running' }, null)) === null && fetches === 0)
  check('a remembered terminal never reads the authority', (fetches = 0, await readHistoryTerminal(fetchSession(present('completed', 'partial_match')), handle, { status: 'completed', errorCode: null })) === null && fetches === 0)
  check('a non-terminal or malformed authority answer → null', await readHistoryTerminal(fetchSession(present('running', null)), handle, null) === null && await readHistoryTerminal(fetchSession({ nope: true }), handle, null) === null)
  check('a failed fetch → null, never a throw', await readHistoryTerminal(async () => { throw new Error('offline') }, handle, null) === null)
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
