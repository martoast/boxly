import { createProjectionRefresh, hasProjectedLiveResults, projectionRetryDelay, shouldRefreshOnTerminal, shouldRetryProjection } from './liveConversation.ts'
import { liveSessionIdFor } from './liveShopping.ts'

let pass = 0; let fail = 0
const check = (name, value) => { if (value) pass++; else { fail++; console.error(`FAIL ${name}`) } }
const missing = [{ parts: [{ type: 'tool-live_verify', state: 'output-available' }] }]
const present = [{ parts: [{ type: 'tool-live_results', state: 'output-available', output: { products: [] } }] }]
check('first response without projection is retryable', !hasProjectedLiveResults(missing) && shouldRetryProjection(0, 3, 3, missing))
check('later response with projection is accepted', hasProjectedLiveResults(present) && !shouldRetryProjection(0, 3, 3, present))
check('projection retry budget is finite', shouldRetryProjection(2, 3, 3, missing) && !shouldRetryProjection(3, 3, 3, missing))
check('projection retry backoff covers projector lag', [0, 1, 2].map(projectionRetryDelay).join(',') === '400,700,1400')
check('retimed cadence keeps the same 2.5 s horizon and three retries', [0, 1, 2].map(projectionRetryDelay).reduce((a, b) => a + b, 0) === 2500 && projectionRetryDelay(3) === 1400)
check('stale generation never retries', !shouldRetryProjection(0, 2, 3, missing))
check('stale navigation generation cannot retry', !shouldRetryProjection(0, 3, 4, missing))
// F1 — the remount loop stop (live: conversation 30). A terminal that arrives
// while the gallery is already projected must not start a refresh at all; the
// first terminal without projection still refreshes and retries normally.
check('projected results ⇒ zero refresh decision', !shouldRefreshOnTerminal(present))
check('missing results ⇒ refresh', shouldRefreshOnTerminal(missing))
check('empty / absent conversation ⇒ refresh (nothing projected yet)', shouldRefreshOnTerminal([]) && shouldRefreshOnTerminal(undefined))
const pendingPart = [{ parts: [{ type: 'tool-live_results', state: 'input-available' }] }]
check('a live_results part that is not output-available does not count as projected', shouldRefreshOnTerminal(pendingPart) && !hasProjectedLiveResults(pendingPart))
check('pending retry cannot fire once projected (retry predicate agrees with the refresh guard)', !shouldRetryProjection(1, 3, 3, present) && !shouldRefreshOnTerminal(present))
check('refresh guard is independent of generation/id logic (those stay in shouldRetryProjection)', shouldRefreshOnTerminal(missing) && !shouldRetryProjection(0, 2, 3, missing))

// ── The refresh chain itself (live regression 2026-09-02) ─────────────────
// The panel emits `terminal` WITH the status string; the inline handler once
// received it as `attempt`, and `'completed' < 3` is false: no retry was ever
// scheduled, the single reload ran ~2 s before Laravel committed the results,
// and the gallery stayed invisible until a manual reload.
check('the old binding shape — a status string as attempt — never retried', !shouldRetryProjection('completed', 3, 3, missing))

const RUNNING = [{ parts: [{ type: 'tool-live_verify', state: 'output-available', output: { localSessionId: '1003', engineSessionId: 'dd25ac47-ebd0-4688-90c4-48ef9952d9b5', status: 'running' } }] }]
const PROJECTED = [...RUNNING, { parts: [{ type: 'tool-live_results', state: 'output-available', output: { products: [{ title: 'x' }] } }] }]
const flush = async () => { for (let i = 0; i < 8; i++) await new Promise((r) => setImmediate(r)) }
function fakeTimers() {
  let now = 0, seq = 0
  const pending = new Map()
  return {
    now: () => now,
    set: (fn, ms) => { const id = ++seq; pending.set(id, { at: now + ms, fn }); return id },
    clear: (id) => { pending.delete(id) },
    count: () => pending.size,
    // Fire the earliest timer, advancing the clock to it.
    async step() {
      if (!pending.size) return false
      const [id, t] = [...pending.entries()].sort((a, b) => a[1].at - b[1].at)[0]
      pending.delete(id); now = t.at; t.fn(); await flush(); return true
    },
  }
}
// A world: the server projects tool-live_results at `projectAt` ms after the terminal (Infinity = never).
function world({ projectAt = 2000, activeId = 42, reconcile = null } = {}) {
  const timers = fakeTimers()
  const state = { activeId, messages: RUNNING, reloads: [], cacheDrops: 0, reconciles: [], logs: [] }
  const chain = createProjectionRefresh({
    activeId: () => state.activeId,
    messages: () => state.messages,
    reload: async (id) => {
      state.cacheDrops++
      state.reloads.push({ id, at: timers.now() })
      await Promise.resolve()
      state.messages = timers.now() >= projectAt || state.projectedByReconcile ? PROJECTED : RUNNING
    },
    ...(reconcile ? { reconcile: async (sid) => { state.reconciles.push({ sid, at: timers.now(), reloadsBefore: state.reloads.length }); await reconcile(state) } } : {}),
    sessionIdFor: liveSessionIdFor,
    log: (line) => state.logs.push(line),
    now: timers.now,
    setTimeoutImpl: timers.set, clearTimeoutImpl: timers.clear,
  })
  return { timers, state, chain }
}
{
  // (a)+(b) your live timeline: terminal at 0, projection committed ~2 s later.
  const w = world({ projectAt: 2000 })
  void w.chain.onTerminal('completed') // the panel's exact emit shape
  await flush()
  check('terminal ⇒ immediate reload #1 for the active conversation', w.state.reloads.length === 1 && w.state.reloads[0].id === 42 && w.state.reloads[0].at === 0)
  check('reload #1 saw only the running handle, so a retry IS armed (the regression)', !hasProjectedLiveResults(w.state.messages) && w.chain.hasPendingRetry() && w.timers.count() === 1)
  await w.timers.step()
  check('retry #1 at +400 still running ⇒ next retry armed', w.state.reloads[1]?.at === 400 && w.chain.hasPendingRetry())
  await w.timers.step()
  check('retry #2 at +1100 still running ⇒ next retry armed', w.state.reloads[2]?.at === 1100 && w.chain.hasPendingRetry())
  await w.timers.step()
  check('retry #3 at +2500 lands after the 2 s projection and renders tool-live_results', w.state.reloads[3]?.at === 2500 && hasProjectedLiveResults(w.state.messages))
  check('chain stops: exactly 4 reloads, no pending timer', w.state.reloads.length === 4 && !w.chain.hasPendingRetry() && w.timers.count() === 0)
  // (c) no loop: a later terminal signal (e.g. a remount) with the gallery projected reloads nothing.
  void w.chain.onTerminal('completed'); await flush(); await w.timers.step()
  check('terminal after projection ⇒ zero reloads (no remount loop)', w.state.reloads.length === 4 && w.timers.count() === 0)
}
{
  // Conversation-36 shape: the projection lands ~1 s after the terminal. The
  // retimed cadence reads it at +1100 ms with three reloads, where the old
  // 0/250/1000/2500 cadence only caught it at +2500 ms.
  const w = world({ projectAt: 1000 })
  void w.chain.onTerminal('completed'); await flush()
  await w.timers.step(); await w.timers.step()
  check('a ~1 s projection is rendered by the +1100 ms read with exactly three reloads', hasProjectedLiveResults(w.state.messages) && w.state.reloads.map((r) => r.at).join(',') === '0,400,1100' && w.timers.count() === 0)
}
{
  // Projection already present at the first reload ⇒ one reload, no retries.
  const w = world({ projectAt: 0 })
  void w.chain.onTerminal('completed'); await flush()
  check('projected on the first reload ⇒ exactly one reload and no timer', w.state.reloads.length === 1 && w.timers.count() === 0)
}
{
  // (e) never projected ⇒ the budget is finite: 1 + 3 reloads, then silence.
  const w = world({ projectAt: Infinity })
  void w.chain.onTerminal('completed'); await flush()
  while (await w.timers.step()) { /* drain */ }
  check('never projected ⇒ 4 reloads total then no open-ended polling', w.state.reloads.length === 4 && w.timers.count() === 0 && w.state.reloads.map((r) => r.at).join(',') === '0,400,1100,2500')
}
{
  // (d) cancel() (new chat / unmount) drops the pending retry; a navigation to another chat stops the chain.
  const w = world({ projectAt: 2000 })
  void w.chain.onTerminal('completed'); await flush()
  check('retry pending before cancel', w.chain.hasPendingRetry())
  w.chain.cancel()
  await w.timers.step()
  check('cancel ⇒ no further reload', w.state.reloads.length === 1 && !w.chain.hasPendingRetry() && w.timers.count() === 0)
  const v = world({ projectAt: 2000 })
  void v.chain.onTerminal('completed'); await flush()
  v.state.activeId = 43 // user opened another conversation
  await v.timers.step()
  check('active conversation changed ⇒ the pending retry does not reload the old one', v.state.reloads.length === 1 && v.timers.count() === 0)
  const u = world({ projectAt: 2000, activeId: null })
  void u.chain.onTerminal('completed'); await flush()
  check('no active conversation ⇒ nothing to reload', u.state.reloads.length === 0 && u.timers.count() === 0)
}
{
  // Two terminal signals in quick succession share ONE timer slot (latest chain wins, no stacking).
  const w = world({ projectAt: 2000 })
  void w.chain.onTerminal('completed'); await flush()
  void w.chain.onTerminal('completed'); await flush()
  check('a second terminal supersedes the first chain: one pending timer, two reloads', w.timers.count() === 1 && w.state.reloads.length === 2)
  while (await w.timers.step()) { /* drain */ }
  check('and the superseding chain still reaches the projection with its own budget', hasProjectedLiveResults(w.state.messages) && w.timers.count() === 0 && w.state.reloads.length === 5)
}
// ── Item 3 (2026-09-03): ONE reconcile GET before reload #0 ─────────────────
check('liveSessionIdFor: the last valid tool-live_verify handle', liveSessionIdFor(RUNNING) === '1003' && liveSessionIdFor(PROJECTED) === '1003')
check('liveSessionIdFor: nothing valid ⇒ null', liveSessionIdFor([]) === null && liveSessionIdFor(undefined) === null && liveSessionIdFor([{ parts: [{ type: 'tool-live_verify', state: 'output-available', output: { localSessionId: 'x!', engineSessionId: 'nope', status: 'running' } }] }]) === null)
check('liveSessionIdFor: a pending handle part does not count', liveSessionIdFor([{ parts: [{ type: 'tool-live_verify', state: 'input-available', output: { localSessionId: '1003', engineSessionId: 'dd25ac47-ebd0-4688-90c4-48ef9952d9b5', status: 'running' } }] }]) === null)
{
  // (r1) the reconcile persists the part (the API's show() runs the result job inline): reload #0 shows it, no retry, one GET.
  const w = world({ projectAt: Infinity, reconcile: async (state) => { state.projectedByReconcile = true } })
  void w.chain.onTerminal('completed')
  await flush()
  check('reconcile called exactly once, with the session id, BEFORE reload #0', w.state.reconciles.length === 1 && w.state.reconciles[0].sid === '1003' && w.state.reconciles[0].reloadsBefore === 0)
  check('reload #0 already carries the gallery ⇒ no retry armed', w.state.reloads.length === 1 && hasProjectedLiveResults(w.state.messages) && !w.chain.hasPendingRetry() && w.timers.count() === 0)
  check('the two timing lines', w.state.logs.length === 2 && w.state.logs[0] === '[live] terminal received; conversation 42; session 1003' && w.state.logs[1] === '[live] results projected on reload #0 at +0ms')
}
{
  // (r2) the reconcile rejects: today's chain, byte for byte (reload #0, retries at +400/+1100/+2500), reconcile never repeated.
  const w = world({ projectAt: 2000, reconcile: async () => { throw new Error('503') } })
  void w.chain.onTerminal('completed')
  await flush()
  while (await w.timers.step()) { /* run the whole chain */ }
  check('a rejected reconcile leaves the reload + retry chain unchanged', w.state.reloads.map((r) => r.at).join(',') === '0,400,1100,2500' && hasProjectedLiveResults(w.state.messages))
  check('reconcile is never retried on the retries', w.state.reconciles.length === 1)
  check('the projection line names the reload that showed the part', w.state.logs.at(-1) === '[live] results projected on reload #3 at +2500ms')
}
{
  // (r3) cancel() while the reconcile is in flight: no reload afterwards.
  let release
  const w = world({ projectAt: Infinity, reconcile: () => new Promise((r) => { release = r }) })
  void w.chain.onTerminal('completed')
  await flush()
  w.chain.cancel()
  release(); await flush()
  check('cancel() during the reconcile drops the chain before any reload', w.state.reconciles.length === 1 && w.state.reloads.length === 0 && w.timers.count() === 0)
}
{
  // (r4) no valid handle in the conversation ⇒ no reconcile, the chain as today.
  const w = world({ projectAt: 2000, reconcile: async () => {} })
  w.state.messages = [{ parts: [{ type: 'text', text: 'hola' }] }]
  void w.chain.onTerminal('completed')
  await flush()
  check('without a session id the reconcile is skipped and reload #0 still runs', w.state.reconciles.length === 0 && w.state.reloads.length === 1 && w.state.logs[0].endsWith('session unknown'))
}
{
  // (r5) no reconcile dep at all (older callers): exactly today's behaviour.
  const w = world({ projectAt: 2000 })
  void w.chain.onTerminal('completed')
  await flush()
  while (await w.timers.step()) { /* run */ }
  check('no reconcile dep ⇒ the unchanged chain', w.state.reconciles.length === 0 && w.state.reloads.map((r) => r.at).join(',') === '0,400,1100,2500')
}

console.log(`${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
