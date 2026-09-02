/**
 * The async announcement contract, without a browser.
 *
 * Pins: closed bounded vocabularies (failures ABSENT — visible role=alert
 * surfaces own them), initial-render silence, real-transition-only
 * announcements incl. A→B→A re-announcement, debounce collapse of rapid
 * chains, live lifecycle priority over candidate counts (the pinned race),
 * no token/caption-level spam, and — via source assertions — exactly one
 * hidden status announcer per surface, aria-atomic, no nested live regions,
 * aria-busy on every owner, and decorative loaders hidden from AT.
 *
 *   node --experimental-strip-types utils/asyncAnnouncements.test.mjs
 */
import { readFileSync } from 'node:fs'
import { assistantAnnouncement, collapseAnnouncements, createAnnouncementScheduler, createLiveAnnouncer, LIVE_COMPLETED_TEXT } from './asyncAnnouncements.ts'

let pass = 0
let fail = 0
const check = (name, cond, detail = '') => {
  if (cond) { pass++ } else { fail++; console.error(`FAIL ${name}${detail ? ` — ${detail}` : ''}`) }
}
const snap = (loading, chatStatus) => ({ loading, chatStatus })

// ── Assistant reducer: initial silence + real transitions only ──────────────
check('initial render announces NOTHING (idle)', assistantAnnouncement(null, snap(false, 'ready')) === null)
check('initial render announces NOTHING (even mid-load hydration)', assistantAnnouncement(null, snap(true, 'ready')) === null)
check('load start announces', assistantAnnouncement(snap(false, 'ready'), snap(true, 'ready'))?.text === 'Cargando conversación…')
check('load finish announces cargada', assistantAnnouncement(snap(true, 'ready'), snap(false, 'ready'))?.text === 'Conversación cargada')
check('load finishing INTO error stays silent here (visible alert owns it)', assistantAnnouncement(snap(true, 'ready'), snap(false, 'error')) === null)
check('older-message load start announces', assistantAnnouncement({ ...snap(false, 'ready'), loadingOlder: false }, { ...snap(false, 'ready'), loadingOlder: true })?.text === 'Cargando mensajes anteriores…')
check('older-message load completion announces', assistantAnnouncement({ ...snap(false, 'ready'), loadingOlder: true }, { ...snap(false, 'ready'), loadingOlder: false })?.text === 'Mensajes anteriores cargados')
check('older-message failure completion is silent here (visible alert owns it)', assistantAnnouncement({ ...snap(false, 'ready'), loadingOlder: true }, { ...snap(false, 'ready'), loadingOlder: false, alertVisible: true }) === null)
check('submitted announces procesando', assistantAnnouncement(snap(false, 'ready'), snap(false, 'submitted'))?.text === 'Procesando tu solicitud…')
check('streaming announces respondiendo', assistantAnnouncement(snap(false, 'submitted'), snap(false, 'streaming'))?.text === 'Respondiendo…')
check('streaming→ready announces respuesta lista', assistantAnnouncement(snap(false, 'streaming'), snap(false, 'ready'))?.text === 'Respuesta lista')
check('submitted→ready announces respuesta lista', assistantAnnouncement(snap(false, 'submitted'), snap(false, 'ready'))?.text === 'Respuesta lista')
check('ready→ready is silent (no idle re-announcement)', assistantAnnouncement(snap(false, 'ready'), snap(false, 'ready')) === null)
check('error→ready is silent (no false respuesta lista after a failure)', assistantAnnouncement(snap(false, 'error'), snap(false, 'ready')) === null)
check('chat error is silent here (visible role=alert owns failures)', assistantAnnouncement(snap(false, 'streaming'), snap(false, 'error')) === null)
check('streaming token deltas produce NO announcement (same state)', assistantAnnouncement(snap(false, 'streaming'), snap(false, 'streaming')) === null)
{
  // A→B→A re-announces A: the reducer keys transitions, not identities.
  const a1 = assistantAnnouncement(snap(false, 'ready'), snap(false, 'submitted'))
  const b = assistantAnnouncement(snap(false, 'submitted'), snap(false, 'streaming'))
  const a2 = assistantAnnouncement(snap(false, 'streaming'), snap(false, 'submitted'))
  check('A→B→A re-announces A', a1 && b && a2 && a1.key === a2.key && a1.text === a2.text)
}
{
  const vocab = ['Cargando conversación…', 'Conversación cargada', 'Cargando mensajes anteriores…', 'Mensajes anteriores cargados', 'Procesando tu solicitud…', 'Respondiendo…', 'Respuesta lista']
  check('assistant vocabulary is bounded', vocab.every((v) => v.length <= 40))
  check('assistant vocabulary contains no failure strings', vocab.every((v) => !/error|fall|no se pudo/i.test(v)))
}

// Every observed transition enters the same delayed-write slot. A silent
// alert-owned transition deterministically cancels the earlier pending write.
{
  let nextId = 1
  const pending = new Map()
  const writes = []
  let clears = 0
  const scheduler = createAnnouncementScheduler({
    setTimer: (fn) => { const id = nextId++; pending.set(id, fn); return id },
    clearTimer: (id) => { pending.delete(id) },
    onClear: () => { clears++ },
    onAnnounce: (a) => { writes.push(a.text) },
  })
  scheduler.transition({ key: 'assistant_streaming', text: 'Respondiendo…' })
  check('assistant delayed status is pending before error', scheduler.pending && pending.size === 1)
  scheduler.transition(null)
  check('silent streaming→error transition cancels pending timer', !scheduler.pending && pending.size === 0)
  for (const fn of pending.values()) fn()
  check('cancelled status can never write after visible error', writes.length === 0)
  check('every transition clears the atomic region first', clears === 2)
  scheduler.cancel()
}

// ── Debounce collapse ───────────────────────────────────────────────────────
{
  const collapsed = collapseAnnouncements([
    { key: 'assistant_busy', text: 'Procesando tu solicitud…', at: 0 },
    { key: 'assistant_streaming', text: 'Respondiendo…', at: 50 },
  ])
  check('rapid submitted→streaming collapses to only streaming', collapsed.length === 1 && collapsed[0].key === 'assistant_streaming')
  const spaced = collapseAnnouncements([
    { key: 'assistant_busy', text: 'Procesando tu solicitud…', at: 0 },
    { key: 'assistant_streaming', text: 'Respondiendo…', at: 500 },
  ])
  check('spaced transitions both announce', spaced.length === 2)
  const aba = collapseAnnouncements([
    { key: 'a', text: 'A', at: 0 },
    { key: 'b', text: 'B', at: 1000 },
    { key: 'a', text: 'A', at: 2000 },
  ])
  check('A→B→A survives collapse (re-announced)', aba.length === 3)
  const dup = collapseAnnouncements([
    { key: 'a', text: 'A', at: 0 },
    { key: 'a', text: 'A', at: 1000 },
  ])
  check('identical consecutive keys collapse to one', dup.length === 1)
}

// ── Live announcer: lifecycle priority, count debounce, terminal race ───────
{
  const live = createLiveAnnouncer()
  check('genuine session start announces connecting', live.next({ lifecycle: 'connecting', now: 0 })?.text === 'Conectando con la tienda…')
  check('working announces agent state', live.next({ lifecycle: 'working', now: 100 })?.text === 'Agente navegando en la tienda')
  check('same lifecycle is silent', live.next({ lifecycle: 'working', now: 200 }) === null)
  check('count observation alone is silent until owned timer fires', live.next({ lifecycle: 'working', candidateCount: 2, now: 1500 }) === null)
  check('owned timer emits latest stable working count', live.candidate({ lifecycle: 'working', candidateCount: 2 })?.text === '2 productos encontrados')
  check('repeat count after timer is silent', live.candidate({ lifecycle: 'working', candidateCount: 2 }) === null)
  check('later owned timer emits newer stable count', live.candidate({ lifecycle: 'working', candidateCount: 3 })?.text === '3 productos encontrados')
  // THE PINNED RACE: a terminal transition arriving with a simultaneous count
  // change announces the TERMINAL, never the count.
  const terminal = live.next({ lifecycle: 'completed', candidateCount: 4, now: 2700 })
  check('terminal beats simultaneous count change', terminal?.key === 'live_completed')
  // The streamed count is only a lower bound on the authoritative gallery
  // (live: a dead stream observed 0 while the projected gallery showed 1), so
  // the completed text never speaks a number — for ANY count.
  check('completed text is count-free (4 streamed)', terminal?.text === LIVE_COMPLETED_TEXT)
  check('after terminal, counts never announce', live.next({ lifecycle: 'completed', candidateCount: 9, now: 9999 }) === null)
  check('candidate callback after terminal is rejected', live.candidate({ lifecycle: 'completed', candidateCount: 9 }) === null)
}
for (const count of [0, 1, 4]) {
  const live = createLiveAnnouncer()
  live.next({ lifecycle: 'connecting', now: 0 })
  live.next({ lifecycle: 'working', now: 1 })
  const done = live.next({ lifecycle: 'completed', candidateCount: count, now: 2 })
  check(`completed with ${count} streamed candidate(s) announces the same count-free text`, done?.key === 'live_completed' && done?.text === LIVE_COMPLETED_TEXT)
  check(`completed text with ${count} contains no numeric product count`, !/\d/.test(done?.text || '') && !/producto/.test(done?.text || ''))
}
check('count-free completed text is terminal-truthful wording', LIVE_COMPLETED_TEXT === 'Sesión completada — los resultados verificados están en la conversación')
{
  const live = createLiveAnnouncer()
  check('reconnect transition announces', (live.next({ lifecycle: 'connecting', now: 0 }), live.next({ lifecycle: 'working', now: 1 }), live.next({ lifecycle: 'reconnecting', now: 2 }))?.text === 'Reconectando…')
  check('media degradation is polite and truthful', live.next({ lifecycle: 'media_unavailable', now: 3 })?.text === 'El video no está disponible; la sesión continúa')
  check('recovery back to working re-announces (A→B→A)', live.next({ lifecycle: 'working', now: 4 })?.key === 'live_working')
}
{
  const history = createLiveAnnouncer()
  check('history-terminal mount announces NOTHING', history.next({ lifecycle: 'completed', candidateCount: 3, now: 0 }) === null)
  const failed = createLiveAnnouncer()
  failed.next({ lifecycle: 'connecting', now: 0 })
  check('failed is silent here (visible alert card owns it)', failed.next({ lifecycle: 'failed', now: 1 }) === null)
  const expired = createLiveAnnouncer()
  expired.next({ lifecycle: 'connecting', now: 0 })
  check('expired is silent here (visible alert card owns it)', expired.next({ lifecycle: 'expired', now: 1 }) === null)
  const cancelled = createLiveAnnouncer()
  cancelled.next({ lifecycle: 'connecting', now: 0 })
  check('cancelled announces politely', cancelled.next({ lifecycle: 'cancelled', now: 1 })?.text === 'Sesión cancelada')
  check('singular count grammar', createLiveAnnouncer().next({ lifecycle: 'completed', candidateCount: 1, now: 0 }) === null) // history mount silent even for singular
}

// ── Source assertions: structure of the wired surfaces ──────────────────────
{
  const sa = readFileSync(new URL('../components/ShoppingAssistant.vue', import.meta.url), 'utf8')
  const lsp = readFileSync(new URL('../components/LiveShoppingPanel.vue', import.meta.url), 'utf8')
  const loader = readFileSync(new URL('../components/SearchLoader.vue', import.meta.url), 'utf8')
  const statusCount = (s) => (s.match(/role="status"/g) || []).length
  check('exactly ONE hidden status announcer in ShoppingAssistant', statusCount(sa) === 1)
  check('exactly ONE hidden status announcer in LiveShoppingPanel', statusCount(lsp) === 1)
  check('both announcers are aria-atomic', (sa.match(/role="status" aria-atomic="true"/g) || []).length === 1 && (lsp.match(/role="status" aria-atomic="true"/g) || []).length === 1)
  check('no raw aria-live attributes anywhere (roles imply politeness; no stacking)', !sa.includes('aria-live') && !lsp.includes('aria-live') && !loader.includes('aria-live'))
  check('assistant failures are visible alerts', sa.includes('v-if="chatError" role="alert"') && sa.includes('toolFailed(m, part)" role="alert"'))
  check('live-verify malformed/error card is one visible alert', sa.includes('part.state === \'output-available\' || toolFailed(m, part)" role="alert"') && sa.includes("part.type !== 'tool-live_verify' && TOOLS_WITH_LOADER.has(part.type)"))
  check('panel failure/expired cards alert via cardRole', lsp.includes(':role="cardRole"') && lsp.includes("card.value.tone === 'red' || card.value.tone === 'amber'"))
  check('messages region is region, not log (streaming re-announce hazard)', sa.includes('role="region" aria-label="Conversación"') && !sa.includes('role="log"'))
  check('aria-busy owners: chat root (load), scroller (turns/older), video (viewer)', sa.includes(`:aria-busy="loadingChat ? 'true' : undefined"`) && sa.includes(`:aria-busy="isBusy || loadingOlder ? 'true' : undefined"`) && lsp.includes(`:aria-busy="overlay ? 'true' : undefined"`))
  check('decorative loaders hidden from AT', loader.includes('aria-hidden="true"') && sa.includes('v-if="showTyping" aria-hidden="true"'))
  check('older-message spinner is decorative (single announcer owns lifecycle)', sa.includes('v-if="loadingOlder" aria-hidden="true"'))
  check('LSP visual badge hidden (announcer speaks it)', lsp.includes('<span aria-hidden="true" class="absolute top-2 left-2'))
  check('swallowed load error now surfaces truthfully', sa.includes("chatError.value = 'No se pudo cargar la conversación.'"))
  check('retry buttons keep their independent accessible names', sa.includes('>Reintentar</button>') && lsp.includes('>Reintentar</button>'))
  check('assistant feeds every transition through cancellable scheduler', sa.includes('srScheduler.transition(a)') && sa.includes('onBeforeUnmount(() => { srScheduler.cancel() })'))
  check('live surface owns one real 1s candidate timer', lsp.includes('candidateTimer = setTimeout') && lsp.includes('}, 1000)') && lsp.includes("liveLifecycle.value !== 'working'") && lsp.includes('generation !== candidateGeneration'))
  check('live unmount invalidates candidate and delayed writes', lsp.includes('liveUnmounted = true') && lsp.includes('cancelCandidateTimer()') && lsp.includes('writeGeneration++'))
}

console.log(`${pass} passed, ${fail} failed`)
if (fail > 0) process.exit(1)
