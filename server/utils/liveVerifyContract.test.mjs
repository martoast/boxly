/**
 * The live_verify objective contract, without a model or a browser.
 *
 * The objective guidance string is the model's ONLY steering surface, and what
 * the model writes there becomes the engine browser's literal search input — a
 * bad example here once sent a real session to New Balance searching for
 * "Verificar EN VIVO en New". These tests pin (1) that the guidance forbids
 * every boilerplate class that run exhibited, and (2) that the wire validation
 * bounds still mirror Laravel's LiveShoppingController::store exactly.
 *
 *   node --experimental-strip-types server/utils/liveVerifyContract.test.mjs
 */
import { LIVE_VERIFY_OBJECTIVE_GUIDANCE, liveVerifyInputSchema, liveVerifyFailureLog, LIVE_VERIFY_LOG_KEYS, LIVE_VERIFY_LOG_REASONS, parseLiveStores, liveVerifyInputSchemaFor, liveStoreGuidance, liveVerifyRefusal, liveCapabilityUnavailable, liveVerifyExposed } from './liveVerifyContract.ts'
import { readFileSync } from 'node:fs'

let pass = 0
let fail = 0
const check = (name, cond, detail = '') => {
  if (cond) { pass++ } else { fail++; console.error(`FAIL ${name}${detail ? ` — ${detail}` : ''}`) }
}

// ── Guidance pins every forbidden boilerplate class ─────────────────────────
const g = LIVE_VERIFY_OBJECTIVE_GUIDANCE
check('guidance leads with constraints-only', g.startsWith('THE PRODUCT AND ITS HARD CONSTRAINTS ONLY'))
check('guidance forbids action verbs', /action verbs \(verificar, buscar, ver en vivo, check, verify\)/.test(g))
check('guidance forbids store repetition via store_id', g.includes('store_id already identifies the store'))
check('guidance forbids result counts and states the one-product contract', g.includes('exactly ONE verified product'))
check('guidance forbids report prose', g.includes('current price and availability are ALWAYS verified'))
check('guidance forbids tracking markers', g.includes('tracking markers/codes'))
check('guidance shows a good constraints-only example', g.includes('"zapatos para correr en oferta"'))
check('guidance shows the observed bad example verbatim enough to deter it', g.includes('Verificar EN VIVO en New Balance'))
check('schema carries the guidance as the objective description', liveVerifyInputSchema.shape.objective.description === g)

// ── Wire validation unchanged (mirrors Laravel bounds) ──────────────────────
const ok = (input) => liveVerifyInputSchema.safeParse(input).success
check('valid constraints-only input passes', ok({ objective: 'zapatos para correr en oferta', store_id: 'new-balance' }))
check('objective is trimmed before the 4-char minimum', !ok({ objective: '  abc  ', store_id: 'new-balance' }))
check('4-char objective passes after trim', ok({ objective: ' talla ', store_id: 'new-balance' }))
check('501-char objective fails', !ok({ objective: 'x'.repeat(501), store_id: 'new-balance' }))
check('500-char objective passes', ok({ objective: 'x'.repeat(500), store_id: 'new-balance' }))
check('uppercase store_id fails', !ok({ objective: 'running shoes', store_id: 'New-Balance' }))
check('dotted store_id fails', !ok({ objective: 'running shoes', store_id: 'new.balance' }))
check('40-char store_id passes', ok({ objective: 'running shoes', store_id: 'a'.repeat(40) }))
check('41-char store_id fails', !ok({ objective: 'running shoes', store_id: 'a'.repeat(41) }))
check('underscore slug passes', ok({ objective: 'running shoes', store_id: 'best_buy' }))
check('missing objective fails', !ok({ store_id: 'new-balance' }))
check('missing store_id fails', !ok({ objective: 'running shoes' }))

// ── Failure diagnostics: what may be logged, and what may NEVER be ──────────
// The bare `catch {}` this replaces turned a real 409 outage (a stale
// active_slot holding the customer's one session) into a generic Spanish
// sentence with no trace anywhere. These tests pin that the fix says enough to
// diagnose and never more than that.
{
  // A realistic $fetch error: the whole response hangs off it, including the
  // objective we sent, the Sanctum token, and an issued viewer ticket.
  const SECRETS = {
    objective: 'zapatos para correr en oferta',
    token: 'sanctum-9f3c-SECRET-TOKEN',
    ticket: 'vt_LIVE_TICKET_VALUE',
    email: 'margarett.waelchi@example.net',
  }
  const hostileError = {
    statusCode: 409,
    message: `Request failed for objective "${SECRETS.objective}"`,
    stack: `Error: boom\n  at callApi (token=${SECRETS.token})`,
    data: { error: 'session_active', message: 'You already have a live shopping session running.', ticket: SECRETS.ticket },
    request: `http://127.0.0.1:18001/live-shopping/sessions?token=${SECRETS.token}`,
    response: { status: 409, _data: { ticket: SECRETS.ticket, user: SECRETS.email } },
    options: { headers: { Authorization: `Bearer ${SECRETS.token}` }, body: { objective: SECRETS.objective } },
  }
  const line = liveVerifyFailureLog('create_failed', hostileError, { conversationId: 5, storeId: 'new-balance' })
  const serialized = JSON.stringify(line)

  check('log has EXACTLY the allowlisted keys', JSON.stringify(Object.keys(line).sort()) === JSON.stringify([...LIVE_VERIFY_LOG_KEYS].sort()), Object.keys(line).join(','))
  check('status extracted from statusCode', line.status === 409)
  check('stable upstream code extracted', line.code === 'session_active')
  check('our own context passes through', line.conversation_id === 5 && line.store_id === 'new-balance')
  check('reason is the stable slug', line.reason === 'create_failed' && line.event === 'live_verify_failure')
  for (const [name, secret] of Object.entries(SECRETS)) {
    check(`NEVER leaks ${name}`, !serialized.includes(secret), serialized)
  }
  check('never leaks the upstream prose message', !serialized.includes('You already have a live shopping session running'))
  check('never leaks a stack trace', !serialized.includes('at callApi'))

  // The two failures look identical to the customer and need opposite fixes:
  // one is "Laravel refused", the other is "Laravel answered a shape we reject".
  const mismatch = liveVerifyFailureLog('contract_mismatch', null, { conversationId: 5, storeId: 'new-balance' })
  check('contract_mismatch is a DISTINCT reason', mismatch.reason === 'contract_mismatch' && mismatch.reason !== line.reason)
  check('contract_mismatch carries no invented status/code', mismatch.status === null && mismatch.code === null)
  const unknownStore = liveVerifyFailureLog('contract_mismatch', {
    ok: false,
    status: 404,
    error: 'unknown_store',
    message: 'Internal catalog details must not be logged',
  }, { conversationId: 12, storeId: 'best-buy' })
  check('structured unknown_store refusal keeps upstream status/code', unknownStore.status === 404 && unknownStore.code === 'unknown_store')
  check('structured unknown_store refusal keeps customer-safe context only', !JSON.stringify(unknownStore).includes('Internal catalog details'))
  const malformedSuccess = liveVerifyFailureLog('contract_mismatch', { ok: true, data: { unexpected: true } }, { conversationId: 12, storeId: 'target' })
  check('malformed 2xx mismatch has no invented upstream status/code', malformedSuccess.status === null && malformedSuccess.code === null)
  check('both reasons are declared stable', LIVE_VERIFY_LOG_REASONS.includes('create_failed') && LIVE_VERIFY_LOG_REASONS.includes('contract_mismatch'))

  // Upstream-controlled fields are attacker-influencable; a log line is exactly
  // where a newline forges an entry.
  const forged = liveVerifyFailureLog('create_failed', { statusCode: 500, data: { error: 'ok\n[live_verify] {"reason":"create_failed","status":200}' } }, {})
  check('newline-forging code REJECTED, not escaped', forged.code === null)
  check('overlong code rejected', liveVerifyFailureLog('create_failed', { data: { error: 'x'.repeat(65) } }, {}).code === null)
  check('code with spaces/prose rejected', liveVerifyFailureLog('create_failed', { data: { error: 'not a code, a sentence' } }, {}).code === null)
  check('code falls back to data.code', liveVerifyFailureLog('create_failed', { data: { code: 'engine_unavailable' } }, {}).code === 'engine_unavailable')

  // Status must be a plausible HTTP status or null — never a string, never
  // something upstream made up.
  check('string status rejected', liveVerifyFailureLog('create_failed', { statusCode: '409' }, {}).status === null)
  check('out-of-range status rejected', liveVerifyFailureLog('create_failed', { statusCode: 99 }, {}).status === null && liveVerifyFailureLog('create_failed', { statusCode: 600 }, {}).status === null)
  check('non-integer status rejected', liveVerifyFailureLog('create_failed', { statusCode: 409.5 }, {}).status === null)
  check('status read from response.status when present', liveVerifyFailureLog('create_failed', { response: { status: 503 } }, {}).status === 503)
  check('a network error with no status logs null, not a guess', liveVerifyFailureLog('create_failed', new Error('fetch failed'), {}).status === null)
  check('undefined/null error tolerated', liveVerifyFailureLog('create_failed', undefined, {}).status === null && liveVerifyFailureLog('create_failed', null, {}).code === null)

  // Context is ours, but still type-checked: a malformed slug never reaches a log.
  check('non-numeric conversationId nulled', liveVerifyFailureLog('create_failed', {}, { conversationId: '5' }).conversation_id === null)
  check('malformed store slug nulled', liveVerifyFailureLog('create_failed', {}, { storeId: 'New Balance!' }).store_id === null)

  // The wiring itself: both call sites must exist and pass the sanitizer.
  const src = readFileSync(new URL('../api/assistant.post.ts', import.meta.url), 'utf8')
  check('catch logs via the sanitizer', /catch \(e\)[\s\S]{0,400}liveVerifyFailureLog\('create_failed', e,/.test(src))
  check('!handle branch logs contract_mismatch with safe response diagnostics', /liveVerifyFailureLog\('contract_mismatch', r,/.test(src))
  check('no bare `} catch {` left in live_verify', !/live_verify[\s\S]{0,3000}\} catch \{\s*\n\s*return \{ ok: false, error: 'live_session_unavailable'/.test(src))
  check('customer-facing response unchanged', (src.match(/error: 'live_session_unavailable', message: 'No pude iniciar la sesión en vivo en este momento\.'/g) || []).length === 2)
  // Scoped to live_verify's own block: an unrelated pre-existing logger
  // elsewhere in this file is not this slice's business, and asserting over the
  // whole file would fail on code we were told not to touch.
  const block = src.slice(src.indexOf('live_verify: tool('), src.indexOf('show_saved_products: tool('))
  check('live_verify block located for scoped assertions', block.length > 200 && block.includes('liveVerifyFailureLog'))
  check('live_verify logs ONLY through the sanitizer', (block.match(/console\.error\(/g) || []).length === (block.match(/liveVerifyFailureLog\(/g) || []).length)
  check('no console call in live_verify takes the raw error', !/console\.[a-z]+\((?:(?!liveVerifyFailureLog)[^\n])*\be\b[^\n]*\)/.test(block))
}

// ── Store routing contract: the engine catalog is the only routable list ────
{
  const stores = parseLiveStores({ success: true, stores: [
    { id: 'target', name: ' Target ' }, { id: 'walmart', name: 'Walmart' }, { id: 'target', name: 'dupe' },
    { id: 'Bad Store', name: 'x' }, { id: 'nike', name: '' }, { id: 'best-buy' }, 'junk', null, { id: 'acme-outlet', name: 'Acme Outlet' },
  ] })
  check('parseLiveStores keeps only well-formed, deduped {id,name} — including a store this repo never names', JSON.stringify(stores) === JSON.stringify([{ id: 'target', name: 'Target' }, { id: 'walmart', name: 'Walmart' }, { id: 'acme-outlet', name: 'Acme Outlet' }]), JSON.stringify(stores))
  check('parseLiveStores tolerates garbage payloads', parseLiveStores(null).length === 0 && parseLiveStores({ stores: 'x' }).length === 0 && parseLiveStores({ ok: false, status: 503 }).length === 0)
  const schema = liveVerifyInputSchemaFor(stores)
  check('with a catalog the tool only accepts catalog slugs', schema.safeParse({ objective: 'running shoes', store_id: 'walmart' }).success && schema.safeParse({ objective: 'widgets', store_id: 'acme-outlet' }).success && !schema.safeParse({ objective: 'running shoes', store_id: 'nike' }).success)
  check('the enum description names every supported store', /Target = "target", Walmart = "walmart", Acme Outlet = "acme-outlet"/.test(schema.shape.store_id.description || ''))
  check('without a catalog there is NO schema: the tool cannot be registered, so no slug can reach the engine', liveVerifyInputSchemaFor([]) === null && liveVerifyExposed([]) === false && liveVerifyExposed(stores) === true)
  {
    // Discovery failure ⇒ no engine create is ever attempted: model the exact registration gate.
    let creates = 0
    const register = (list) => (liveVerifyExposed(list) ? { live_verify: { execute: () => { creates++ } } } : {})
    const tools = register(parseLiveStores({ ok: false, status: 503 }))
    check('discovery failure registers no live_verify tool', !('live_verify' in tools))
    check('and therefore attempts no create', creates === 0)
    const okTools = register(stores)
    okTools.live_verify.execute()
    check('a confirmed catalog registers the tool normally', creates === 1)
  }
  check('guidance names supported stores and forbids unsupported routing', /Supported live stores: Target \(target\), Walmart \(walmart\), Acme Outlet \(acme-outlet\)/.test(liveStoreGuidance(stores)) && /never start a session for an unsupported store/.test(liveStoreGuidance(stores)))
  check('guidance fails closed when the list is unknown', /TEMPORARILY UNAVAILABLE/.test(liveStoreGuidance([])) && /live_verify will refuse to start a session/.test(liveStoreGuidance([])))
  const unavailable = liveCapabilityUnavailable()
  check('the fail-closed tool state is honest and bounded', JSON.stringify(unavailable) === JSON.stringify({ ok: false, error: 'live_capability_unavailable', message: 'La verificación en vivo no está disponible en este momento.' }))
  check('capability_unavailable is a loggable reason', LIVE_VERIFY_LOG_REASONS.includes('capability_unavailable'))
  const refusal = liveVerifyRefusal({ ok: false, status: 422, success: false, code: 'store_unsupported', message: 'x' }, stores, 'nike')
  check('a store_unsupported refusal becomes the store_not_supported tool state', JSON.stringify(refusal) === JSON.stringify({ ok: false, error: 'store_not_supported', store_id: 'nike', supported: ['Target', 'Walmart', 'Acme Outlet'], message: 'Boxly aún no puede verificar en vivo en esa tienda.' }), JSON.stringify(refusal))
  check('an ill-formed slug never leaks into the refusal', liveVerifyRefusal({ ok: false, code: 'store_unsupported' }, stores, 'Bad Store').store_id === null)
  check('every other failure keeps the generic path', liveVerifyRefusal({ ok: false, status: 503, code: 'engine_unavailable' }, stores, 'nike') === null && liveVerifyRefusal({ localSessionId: '1' }, stores, 'nike') === null && liveVerifyRefusal(null, stores, 'nike') === null)
  check('store_unsupported is a loggable reason', LIVE_VERIFY_LOG_REASONS.includes('store_unsupported'))
  const line = liveVerifyFailureLog('store_unsupported', { ok: false, status: 422, code: 'store_unsupported' }, { conversationId: 38, storeId: 'nike' })
  check('the refusal log line carries only the allowlisted keys', JSON.stringify(Object.keys(line)) === JSON.stringify([...LIVE_VERIFY_LOG_KEYS]) && line.code === 'store_unsupported' && line.status === 422)
}

console.log(`${pass} passed, ${fail} failed`)
if (fail > 0) process.exit(1)
