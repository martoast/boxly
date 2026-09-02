// Pure submit-gating logic for the chat composer — dependency-free (root utils
// ship to the client bundle) and extracted so `node --experimental-strip-types`
// can prove the input → value → submit-payload chain without a browser.
//
// Why this exists: a real computer-use E2E typed a Spanish sentence into the
// composer and the harness refused to submit (read-back mismatch). The submit
// path must never race the last input event, never fire mid-IME-composition,
// and the bytes submitted must be exactly the bytes visible in the textarea.

export interface ComposerGate {
  /** compositionstart / compositionend wiring. */
  compositionStart(): void
  compositionEnd(): void
  /** True while an IME composition is open (dead keys, mobile IMEs, CJK). */
  readonly composing: boolean
  /**
   * The Enter-key decision. `eventComposing` is KeyboardEvent.isComposing —
   * checked ALONGSIDE the tracked state because some browsers (Safari's final
   * confirm-Enter) clear one before the other; either signal blocks the send.
   * Shift+Enter is a newline (native textarea behavior, never intercepted).
   */
  decide(input: { shiftKey?: boolean; eventComposing?: boolean; busy?: boolean; value?: string; hasAttachments?: boolean }): 'send' | 'newline' | 'ignore'
  /**
   * The submit payload rule: the DOM snapshot is the single source of truth.
   * Returns the exact string to submit — byte-for-byte what the user sees —
   * regardless of any stale model/prop value still in flight.
   */
  payloadText(domValue: unknown, modelValue: unknown): string
}

export function createComposerGate(): ComposerGate {
  let composing = false
  return {
    compositionStart() { composing = true },
    compositionEnd() { composing = false },
    get composing() { return composing },
    decide({ shiftKey = false, eventComposing = false, busy = false, value = '', hasAttachments = false } = {}) {
      if (shiftKey) return 'newline'
      if (eventComposing || composing) return 'ignore' // uncommitted IME text must never submit
      if (busy) return 'ignore'
      if (!(typeof value === 'string' && value.trim().length > 0) && !hasAttachments) return 'ignore'
      return 'send'
    },
    payloadText(domValue, modelValue) {
      if (typeof domValue === 'string') return domValue // visible bytes win, always
      return typeof modelValue === 'string' ? modelValue : ''
    },
  }
}
