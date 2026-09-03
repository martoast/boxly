// Quiet-gap flush timing for the streamed store's typed text. The composable buffers printable keystrokes
// into one text.type (utils/liveBrowse.ts createTextBuffer); THIS decides WHEN that buffer is sent.
//
// The rule is a debounce, not an animation frame: an earlier rAF flush fired every ~16 ms, so a human typing
// at 25–150 ms per key had the buffer flushed after EVERY keystroke — one text.type per character, exactly what
// the persistent keyboard exists to survive but the page should not produce. Here the buffer is sent only after
// a bounded QUIET GAP with no further keystroke, or immediately on a non-text key / blur / click / stop.
//
// Timer functions are injected so the rule is testable with a fake clock (utils/typingFlush.test.ts); the
// composable wires the real setTimeout/clearTimeout.

// The quiet gap after the last keystroke before a typed word is sent. Long enough to hold a human's typing
// together (well above a ~150 ms inter-key gap), short enough that the word reaches the store promptly. The
// persistent virtual keyboard makes typing CORRECT regardless of this value; the gap only controls how few
// messages the page sends.
export const QUIET_GAP_MS = 250

export interface QuietFlusher {
  /** A printable keystroke arrived: (re)arm the quiet-gap timer, so the flush waits for typing to pause. */
  bump(): void
  /** Send now (a non-text key, blur, click, or stop): cancel any pending timer and flush immediately. */
  flushNow(): void
  /** Drop any pending timer without flushing (unbind). */
  cancel(): void
  /** True while a quiet-gap flush is armed. */
  readonly armed: boolean
}

export function createQuietFlusher(
  onFlush: () => void,
  { quietMs = QUIET_GAP_MS, setTimer = setTimeout, clearTimer = clearTimeout }: { quietMs?: number; setTimer?: (fn: () => void, ms: number) => any; clearTimer?: (t: any) => void } = {},
): QuietFlusher {
  let timer: any = null
  const clear = () => { if (timer !== null) { clearTimer(timer); timer = null } }
  return {
    bump() { clear(); timer = setTimer(() => { timer = null; onFlush() }, quietMs) },
    flushNow() { clear(); onFlush() },
    cancel() { clear() },
    get armed() { return timer !== null },
  }
}
