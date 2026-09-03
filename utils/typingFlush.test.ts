import assert from 'node:assert/strict'
// Pure tests for utils/typingFlush.ts — WHEN the streamed store's buffered text is sent.
import { createQuietFlusher, QUIET_GAP_MS } from './typingFlush.ts'
import { createTextBuffer } from './liveBrowse.ts'

let passed = 0, failed = 0
const check = (name: string, ok: boolean, detail = '') => { if (ok) { passed++; console.log(`  ✓ ${name}`) } else { failed++; console.log(`  ✗ ${name} ${detail}`) } }

// A fake clock: setTimer/clearTimer queue callbacks by absolute fire time; advance(ms) fires the due ones.
function fakeClock() {
  let now = 0, id = 0
  const timers = new Map<number, { at: number; fn: () => void }>()
  return {
    setTimer: (fn: () => void, ms: number) => { const t = ++id; timers.set(t, { at: now + ms, fn }); return t },
    clearTimer: (t: number) => { timers.delete(t) },
    advance(ms: number) {
      now += ms
      for (const [t, { at, fn }] of [...timers].sort((a, b) => a[1].at - b[1].at)) if (at <= now) { timers.delete(t); fn() }
    },
  }
}

// A whole word typed at a HUMAN cadence (both 25 ms and 150 ms per key, all below the quiet gap) is sent ONCE.
for (const cadence of [25, 150]) {
  const clock = fakeClock()
  const buf = createTextBuffer()
  const flushes: any[] = []
  const f = createQuietFlusher(() => { const out = buf.flush(); if (out.length) flushes.push(out) }, { setTimer: clock.setTimer, clearTimer: clock.clearTimer })
  for (const ch of 'running shoes') { buf.push({ type: 'text.type', value: ch }); f.bump(); clock.advance(cadence) }
  check(`${cadence} ms cadence: nothing flushed while typing continues`, flushes.length === 0 && f.armed === true)
  clock.advance(QUIET_GAP_MS) // the quiet gap after the last keystroke
  check(`${cadence} ms cadence: exactly one text.type after the quiet gap`, flushes.length === 1 && JSON.stringify(flushes[0]) === JSON.stringify([{ type: 'text.type', value: 'running shoes' }]), JSON.stringify(flushes))
  check(`${cadence} ms cadence: no longer armed after the flush`, f.armed === false)
}

// A short gap (below the quiet gap) never flushes; the timer keeps resetting.
{
  const clock = fakeClock()
  let flushed = 0
  const f = createQuietFlusher(() => flushed++, { setTimer: clock.setTimer, clearTimer: clock.clearTimer })
  f.bump(); clock.advance(200); f.bump(); clock.advance(200); f.bump(); clock.advance(200)
  check('a keystroke within the quiet gap resets the timer — no flush yet', flushed === 0 && f.armed === true)
  clock.advance(QUIET_GAP_MS)
  check('flush fires once the gap finally elapses', flushed === 1)
}

// flushNow() sends immediately (a non-text key / blur / click / stop) and disarms.
{
  const clock = fakeClock()
  const buf = createTextBuffer()
  const flushes: any[] = []
  const f = createQuietFlusher(() => { const out = buf.flush(); if (out.length) flushes.push(out) }, { setTimer: clock.setTimer, clearTimer: clock.clearTimer })
  buf.push({ type: 'text.type', value: 'hi' }); f.bump()
  f.flushNow()
  check('flushNow sends the buffered word immediately, before the gap', flushes.length === 1 && JSON.stringify(flushes[0]) === JSON.stringify([{ type: 'text.type', value: 'hi' }]) && f.armed === false)
  clock.advance(QUIET_GAP_MS * 2)
  check('the cancelled timer never fires a second flush', flushes.length === 1)
}

// cancel() drops a pending flush without sending (unbind).
{
  const clock = fakeClock()
  let flushed = 0
  const f = createQuietFlusher(() => flushed++, { setTimer: clock.setTimer, clearTimer: clock.clearTimer })
  f.bump(); f.cancel(); clock.advance(QUIET_GAP_MS * 2)
  check('cancel drops the pending flush', flushed === 0 && f.armed === false)
}

assert.equal(QUIET_GAP_MS, 250)
console.log(failed ? `FAIL — ${passed} passed, ${failed} failed` : `PASS — ${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
