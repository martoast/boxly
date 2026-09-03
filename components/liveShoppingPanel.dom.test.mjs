/**
 * MOUNTED LiveShoppingPanel — what the customer actually reads.
 *
 * Every other test in this feature proves logic in isolation. None of them
 * proves the rendered copy, and the whole incident was about a panel telling a
 * customer we had lost the connection when the store had actually refused the
 * session. So this compiles the REAL .vue single-file component and renders it,
 * asserting on the resulting DOM string.
 *
 * No new dependencies and no browser: `vue`, `@vue/compiler-sfc` and
 * `@vue/server-renderer` are already installed, so the component's own `card`
 * computed and its own template do the work here. Only `useLiveSession` and
 * `useWhepViewer` are stubbed — that is the point, since the controller state is
 * exactly the input under test. `terminalReasonText`, `validateSessionHandle`,
 * `isTerminal` and the rest are the real implementations.
 *
 *   node --experimental-strip-types components/liveShoppingPanel.dom.test.mjs
 */
import { readFileSync } from 'node:fs'
import * as Vue from 'vue'
import { renderToString } from 'vue/server-renderer'
import { parse, compileScript } from '@vue/compiler-sfc'
import {
  validateSessionHandle, isTerminal, eventActivity,
  candidatePriceText, availabilityText, terminalReasonText,
  rememberedTerminal, pageTerminalMemory, forgetLiveTerminals,
} from '../utils/liveShopping.ts'
import { createLiveAnnouncer } from '../utils/asyncAnnouncements.ts'

let pass = 0
let fail = 0
const check = (name, cond, detail = '') => {
  if (cond) { pass++ } else { fail++; console.error(`FAIL ${name}${detail ? ` — ${detail}` : ''}`) }
}

// ── compile the real SFC ────────────────────────────────────────────────────
const file = new URL('./LiveShoppingPanel.vue', import.meta.url)
const src = readFileSync(file, 'utf8')
const { descriptor } = parse(src, { filename: 'LiveShoppingPanel.vue' })
const compiled = compileScript(descriptor, { id: 'lsp-dom-test', inlineTemplate: true, genDefaultAs: '__sfc__' })

// The compiler imports its render helpers from 'vue'; Nuxt auto-imports
// (ref/computed/watch/…) and this repo's utils stay FREE identifiers, so they
// are injected below. Rewriting the imports is what lets the component run
// outside Nuxt without altering a line of its own source.
let code = compiled.content
const vuePreamble = []
for (const m of code.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]vue['"];?/g)) {
  for (const spec of m[1].split(',')) {
    const [orig, alias] = spec.trim().split(/\s+as\s+/)
    if (orig) vuePreamble.push(`const ${(alias || orig).trim()} = __VUE__[${JSON.stringify(orig.trim())}];`)
  }
}
code = code.replace(/^\s*import[^\n]*\n/gm, '')

const INJECTED = {
  __VUE__: Vue,
  // Nuxt auto-imports the component relies on.
  ref: Vue.ref, computed: Vue.computed, watch: Vue.watch, onMounted: Vue.onMounted,
  onBeforeUnmount: Vue.onBeforeUnmount, nextTick: Vue.nextTick, shallowRef: Vue.shallowRef,
  // REAL implementations — these are under test, not stubbed.
  validateSessionHandle, isTerminal, eventActivity, candidatePriceText, availabilityText,
  terminalReasonText, createLiveAnnouncer, rememberedTerminal,
  // Stubbed seams: the controller state is the INPUT to this test.
  useLiveSession: null, useWhepViewer: null,
}

function buildComponent(sessionState) {
  const live = {
    status: Vue.ref(sessionState.status),
    candidates: Vue.ref(sessionState.candidates || []),
    ticket: Vue.ref(sessionState.ticket ?? null),
    mediaState: Vue.ref(sessionState.mediaState ?? 'pending'),
    terminalReason: Vue.ref(sessionState.terminalReason ?? null),
    terminalAuthoritative: Vue.ref(!!sessionState.terminalAuthoritative),
    start() {}, stop() {}, retry() {}, getTicket: () => null, remintTicket: async () => null,
  }
  const viewer = { state: Vue.ref('idle'), stream: Vue.ref(null), start() {}, stop() {} }
  const injected = { ...INJECTED, useLiveSession: () => live, useWhepViewer: () => viewer }
  const names = Object.keys(injected)
  const factory = new Function(...names, `${vuePreamble.join('\n')}\n${code}\nreturn __sfc__;`)
  return factory(...names.map((n) => injected[n]))
}

const render = async (sessionState, session) => {
  const Component = buildComponent(sessionState)
  const app = Vue.createSSRApp(Component, {
    session: session || { localSessionId: '1003', engineSessionId: 'dd25ac47-ebd0-4688-90c4-48ef9952d9b5', status: 'running' },
  })
  return await renderToString(app)
}

// Sanity: the harness itself must be real, or every assertion below is theatre.
{
  const html = await render({ status: 'connecting' })
  check('the REAL SFC compiles and renders', typeof html === 'string' && html.length > 50, String(html).slice(0, 120))
}

// ── 1. authoritative terminal WITH the engine's reason ─────────────────────
{
  const html = await render({ status: 'failed', terminalAuthoritative: true, terminalReason: 'store_blocked' })
  check('renders the exact store-blocked copy',
    html.includes('La tienda bloqueó la sesión en vivo, así que no pudimos verificar el producto.'), html.slice(-400))
  check('does NOT blame the connection', !/conexión/i.test(html), html.slice(-400))
  check('the failure card is an alert', /role="alert"/.test(html))
}

// ── 1b. rev 11 attribution codes: store error vs neutral, never "bloqueó" ───
{
  const html = await render({ status: 'failed', terminalAuthoritative: true, terminalReason: 'store_error' })
  check('store_error renders the store-error copy',
    html.includes('La tienda mostró un error al cargar la página, así que no pudimos verificar el producto.'), html.slice(-400))
  check('store_error never says the store blocked us', !/bloqueó/.test(html) && !/conexión/i.test(html), html.slice(-400))
  const neutral = await render({ status: 'failed', terminalAuthoritative: true, terminalReason: 'verification_incomplete' })
  check('verification_incomplete renders the neutral ending',
    neutral.includes('La sesión en vivo terminó sin completar la verificación.'), neutral.slice(-400))
  check('verification_incomplete never blames the store or the connection', !/bloqueó/.test(neutral) && !/conexión/i.test(neutral), neutral.slice(-400))
}

// ── 2. authoritative terminal, NO reason (present() error_code is nullable) ─
{
  const html = await render({ status: 'failed', terminalAuthoritative: true, terminalReason: null })
  check('null reason renders the generic terminal ending',
    html.includes('La sesión en vivo terminó sin completar la verificación.'), html.slice(-400))
  check('null reason still does NOT blame the connection', !/conexión/i.test(html))
}

// ── 3. authoritative terminal, HOSTILE code already gated to null ──────────
// The controller gates the code; if a bad value ever reached the panel it must
// still never be echoed to the customer.
{
  const html = await render({ status: 'failed', terminalAuthoritative: true, terminalReason: '<script>alert(1)</script>' })
  check('a hostile reason is never echoed into the DOM', !html.includes('alert(1)'), html.slice(-400))
  check('hostile reason falls back to the generic ending',
    html.includes('La sesión en vivo terminó sin completar la verificación.'), html.slice(-400))
  check('hostile reason does NOT blame the connection', !/conexión/i.test(html))
}

// ── 4. NON-authoritative give_up: the connection story must SURVIVE ────────
// Losing the transport is a real thing that happens, and saying so is honest.
{
  const html = await render({ status: 'failed', terminalAuthoritative: false, terminalReason: null })
  check('a genuine transport give-up DOES tell the connection story',
    html.includes('No pudimos mantener la conexión con la sesión en vivo.'), html.slice(-400))
  check('and it does not claim the session ended',
    !html.includes('terminó sin completar') && !html.includes('bloqueó'), html.slice(-400))
}

// ── 4b. terminal memory: SSR-isolated, browser-shared ─────────────────────
// Live conversation 33: the persisted verify part still said "running", so
// every remount opened a new stream, replayed the terminal and re-announced
// it. The memory that stops that is BROWSER-ONLY: this module is also loaded
// by Nitro, where module state is process-wide, so on the server the memory is
// inert and two SSR requests cannot observe each other's terminals. SSR never
// runs onMounted, so "no live.start()" is pinned at the controller level
// (harness N5); the observable here is the rendered card.
{
  const sid = 'dd25ac47-ebd0-4688-90c4-48ef9952d9b5'
  const running = { localSessionId: '1003', engineSessionId: sid, status: 'running' }
  const HISTORY = 'Esta sesión en vivo ya terminó — los resultados están en la conversación.'
  // Two simulated SSR requests (no document): request A "commits" a terminal, request B renders.
  check('SSR request A cannot store a terminal in the page memory', pageTerminalMemory().remember(sid, 'completed', null) === false && rememberedTerminal(sid) === null)
  const ssrB = await render({ status: 'connecting' }, running)
  check('SSR request B renders the session live — nothing leaked from request A', !ssrB.includes(HISTORY) && !/ya terminó/.test(ssrB), ssrB.slice(-400))
  // The same code in a browser document: remounts share the exact-session terminal.
  globalThis.window = {}; globalThis.document = {}
  try {
    check('browser memory accepts the terminal', pageTerminalMemory().remember(sid, 'completed', null) === true)
    const mount1 = await render({ status: 'connecting' }, running)
    const mount2 = await render({ status: 'connecting' }, running)
    check('a remounted panel renders the history copy although the persisted status is still running',
      mount1.includes(HISTORY) && mount2.includes(HISTORY), mount2.slice(-400))
    const other = await render({ status: 'connecting' }, { localSessionId: '1004', engineSessionId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', status: 'running' })
    check('a DIFFERENT engine session is unaffected by the memory', !other.includes(HISTORY) && !/ya terminó/.test(other), other.slice(-400))
    forgetLiveTerminals()
    const cleared = await render({ status: 'connecting' }, running)
    check('after the logout hook the same session renders live again', !cleared.includes(HISTORY) && !/ya terminó/.test(cleared), cleared.slice(-400))
  } finally {
    delete globalThis.window; delete globalThis.document
  }
}

// ── 4d (A.1). history-terminal handle, NO page memory: the reason comes from the authority ──
// The persisted handle can already be terminal on a fresh page load. Without a
// remembered terminal the panel never starts a stream, so the composable reads
// the authority once and surfaces it as terminalReason; the history branch must
// read it instead of painting the plain green card.
{
  const terminalHandle = { localSessionId: '1073', engineSessionId: 'bb25ac47-ebd0-4688-90c4-48ef9952d9b5', status: 'completed' }
  const hydrated = await render({ status: 'completed', terminalAuthoritative: true, terminalReason: 'partial_match' }, terminalHandle)
  check('history-terminal without memory + hydrated partial_match renders the caveat', hydrated.includes('no cumple todo lo que pediste'), hydrated.slice(-400))
  check('…and not the plain "ya terminó" green copy', !/ya terminó — los resultados/.test(hydrated))
  const plainHistory = await render({ status: 'completed', terminalAuthoritative: true, terminalReason: null }, terminalHandle)
  check('history-terminal without memory and no code keeps the green history copy', /ya terminó — los resultados están en la conversación/.test(plainHistory) && !plainHistory.includes('no cumple todo'))
  const notYet = await render({ status: 'connecting', terminalAuthoritative: false, terminalReason: null }, terminalHandle)
  check('before the authority answers the history card is the plain green one, never a failure', /ya terminó — los resultados están en la conversación/.test(notYet) && !/conexión/i.test(notYet))
  const sid = terminalHandle.engineSessionId
  globalThis.window = {}; globalThis.document = {}
  try {
    pageTerminalMemory().remember(sid, 'completed', null)
    const remembered = await render({ status: 'completed', terminalAuthoritative: true, terminalReason: 'partial_match' }, terminalHandle)
    check('a remembered terminal (no caveat) wins over a stale live reason', !remembered.includes('no cumple todo') && /ya terminó/.test(remembered), remembered.slice(-400))
    forgetLiveTerminals()
  } finally {
    delete globalThis.window; delete globalThis.document
  }
}

// ── 4c. completed + partial_match: real products, honest caveat, not a failure ──
{
  const html = await render({ status: 'completed', terminalAuthoritative: true, terminalReason: 'partial_match' })
  check('completed with partial_match renders the caveat copy', html.includes('Verificamos un producto, pero no cumple todo lo que pediste'), html.slice(-400))
  check('partial_match is a caveat, never a failure story: no connection or store-blocked copy', !/conexión/i.test(html) && !/bloqueó/.test(html) && !/terminó sin completar/.test(html))
  const plain = await render({ status: 'completed', terminalAuthoritative: true, terminalReason: null })
  check('completed without a code keeps the plain completed copy', /Sesión completada/.test(plain) && !plain.includes('no cumple todo'))
  const sid = 'dd25ac47-ebd0-4688-90c4-48ef9952d9b5'
  globalThis.window = {}; globalThis.document = {}
  try {
    pageTerminalMemory().remember(sid, 'completed', 'partial_match')
    const remounted = await render({ status: 'connecting' }, { localSessionId: '1003', engineSessionId: sid, status: 'running' })
    check('a remounted panel keeps the partial_match caveat from memory', remounted.includes('no cumple todo lo que pediste'), remounted.slice(-400))
    forgetLiveTerminals()
  } finally {
    delete globalThis.window; delete globalThis.document
  }
}

// ── 5. the other terminals still read correctly ────────────────────────────
{
  const completed = await render({ status: 'completed', terminalAuthoritative: true, terminalReason: null })
  check('completed renders its own copy, not a failure', /Sesión completada|ya terminó/.test(completed) && !/conexión/i.test(completed), completed.slice(-300))
  const cancelled = await render({ status: 'cancelled', terminalAuthoritative: true, terminalReason: 'worker_cancelled' })
  check('cancelled renders its own copy', /Sesión cancelada/.test(cancelled), cancelled.slice(-300))
}

// ── 6. a working session shows the calm no-media state, no failure copy ────
{
  const html = await render({
    status: 'streaming',
    ticket: { ticket: 't', expiresAtMs: Date.now() + 50_000, sseUrl: 'https://e/x', whepUrl: null, iceServers: [], mediaAvailable: false },
  })
  check('working session with a no-media ticket and no media verdict yet shows the PENDING copy, not the no-video row (Task C)', html.includes('Preparando el video en vivo…') && !html.includes('Sin video en esta sesión'), html.slice(-400))
  const failed = await render({ status: 'streaming', mediaState: 'failed', ticket: { ticket: 't', expiresAtMs: Date.now() + 50_000, sseUrl: 'https://e/x', whepUrl: null, iceServers: [], mediaAvailable: false } })
  check('after media.failed the calm no-video row is shown', failed.includes('Sin video en esta sesión') && !failed.includes('Preparando el video'), failed.slice(-400))
  const noTicket = await render({ status: 'connecting', ticket: null })
  check('no ticket yet: the pending copy, never "Sin video"', noTicket.includes('Preparando el video en vivo…') && !noTicket.includes('Sin video en esta sesión'), noTicket.slice(-400))
  const withMedia = await render({ status: 'streaming', mediaState: 'ready', ticket: { ticket: 't', expiresAtMs: Date.now() + 50_000, sseUrl: 'https://e/x', whepUrl: 'https://cf.cloudflarestream.com/li/webRTC/play', iceServers: [{ urls: ['stun:stun.cloudflare.com:3478'] }], mediaAvailable: true } })
  check('a ticket with the media plane renders the video element, no copy row', withMedia.includes('<video') && !withMedia.includes('Preparando el video') && !withMedia.includes('Sin video'), withMedia.slice(0, 300))
  check('working session shows no failure copy at all',
    !/conexión|bloqueó|terminó sin completar/i.test(html), html.slice(-400))
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
