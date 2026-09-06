/**
 * The follow-up chips as UI-stream pieces (no model, no network — unit-tested in
 * chatContext.test.mjs). generateFollowups() in ./followups.ts produces the strings.
 */

/** The chips as a `tool-suggest_followups` UI part — the exact shape the chat UI renders (live and on resume). */
export function followupPart(suggestions: string[]) {
  return { type: 'tool-suggest_followups', toolCallId: 'followups-' + Date.now().toString(36), state: 'output-available', input: { suggestions }, output: { suggestions } }
}

/** Resolve the chips, but never wait longer than `ms` (the reply must not stall on them). */
export function followupsWithin(promise: Promise<string[]> | null, ms = 2500): Promise<string[]> {
  if (!promise) return Promise.resolve([])
  return Promise.race([promise.catch(() => [] as string[]), new Promise<string[]>((r) => setTimeout(() => r([]), ms))])
}

/**
 * Pipe a UI message stream and, right before its `finish` chunk, append the chips as
 * tool chunks (input-available + output-available inside their own step) so the
 * client attaches a `tool-suggest_followups` part to the SAME assistant message.
 */
export function attachFollowupChips<T = any>(stream: ReadableStream<T>, chips: () => Promise<string[]>): ReadableStream<T> {
  return stream.pipeThrough(new TransformStream<any, any>({
    async transform(chunk, controller) {
      if (chunk?.type === 'finish') {
        const suggestions = await chips()
        if (suggestions.length) {
          const part = followupPart(suggestions)
          controller.enqueue({ type: 'start-step' })
          controller.enqueue({ type: 'tool-input-available', toolCallId: part.toolCallId, toolName: 'suggest_followups', input: part.input })
          controller.enqueue({ type: 'tool-output-available', toolCallId: part.toolCallId, output: part.output })
          controller.enqueue({ type: 'finish-step' })
        }
      }
      controller.enqueue(chunk)
    },
  }))
}
