/** Pure guards for the bounded post-terminal conversation refresh. */
export function hasProjectedLiveResults(messages: any[]): boolean {
  return (messages || []).some((m) => (m?.parts || []).some((p: any) =>
    p?.type === 'tool-live_results' && p.state === 'output-available'))
}

export function shouldRetryProjection(attempt: number, generation: number, currentGeneration: number, messages: any[]): boolean {
  return generation === currentGeneration && !hasProjectedLiveResults(messages) && attempt < 3
}

/**
 * Should a terminal signal start a conversation refresh at all? Only while the
 * verified gallery is NOT yet projected. Once tool-live_results is present,
 * reloading achieves nothing and is actively harmful: the thread is unmounted
 * and remounted, a fresh LiveShoppingPanel boots against the still-"running"
 * persisted handle, learns from the server that the session is over, emits
 * terminal again, and the loop repeats every few seconds (observed live:
 * conversation 30, gallery DOM recreated so often that no accessibility ref
 * survived a second). The first terminal without projection still refreshes
 * and retries normally.
 */
export function shouldRefreshOnTerminal(messages: any[]): boolean {
  return !hasProjectedLiveResults(messages)
}

/**
 * Bounded delays for the webhook projector race. The terminal event can reach
 * the browser roughly a second before Laravel commits tool-live_results, so a
 * single 250 ms retry is too short. These three retries cover that observed
 * window without turning conversation refresh into open-ended polling.
 */
// Retimed 2026-09-02 (conversation 36: the gallery landed ~3.5 s after the
// terminal because the projection arrived ~1-1.5 s after it and the reads sat
// at +250, +1000 and +2500 ms): the SAME three retries and the SAME 2.5 s
// horizon, now read at +400, +1100 and +2500 ms after the terminal.
export const PROJECTION_RETRY_DELAYS_MS = [400, 700, 1400] as const
export function projectionRetryDelay(attempt: number): number {
  return PROJECTION_RETRY_DELAYS_MS[Math.max(0, Math.min(attempt, 2))]
}

/**
 * The bounded post-terminal refresh chain, extracted from ShoppingAssistant so
 * it is deterministic under test and structurally immune to the live regression
 * of 2026-09-02: the panel emits `terminal` WITH the status string, and the
 * inline handler `@terminal="refreshActiveConversation"` received that string
 * as its first parameter — `attempt`. `'completed' < 3` is false, so the
 * 250/750/1500 ms retries were never scheduled; the single reload ran ~2 s
 * before Laravel committed tool-live_results and the gallery stayed invisible
 * until a manual reload. (The earlier remount storm had masked this: each
 * remounted panel re-emitted terminal, so one of ~9 reloads landed late enough.)
 *
 * `reload(id)` must drop any cached copy and reload the conversation in place
 * WITHOUT cancelling this chain. `activeId`/`messages` are read live.
 */
export interface ProjectionRefreshDeps {
  activeId: () => number | string | null | undefined
  messages: () => any[]
  reload: (id: number) => Promise<void>
  setTimeoutImpl?: (fn: () => void, ms: number) => any
  clearTimeoutImpl?: (id: any) => void
}
export function createProjectionRefresh(deps: ProjectionRefreshDeps) {
  const setT = deps.setTimeoutImpl || ((fn: () => void, ms: number) => setTimeout(fn, ms))
  const clearT = deps.clearTimeoutImpl || ((id: any) => clearTimeout(id))
  let timer: any = null // SINGLE slot — chains never stack
  let generation = 0
  const clearPending = () => { if (timer !== null) clearT(timer); timer = null }
  /** Navigation / new chat / unmount: drop the pending retry and retire every in-flight chain. */
  const cancel = () => { clearPending(); generation++ }

  async function run(attempt: number, expectedId: number | null, gen: number): Promise<void> {
    const id = Number(expectedId ?? deps.activeId())
    if (!id || (expectedId !== null && Number(deps.activeId()) !== id) || gen !== generation) return
    // A genuinely new chain supersedes any still-pending retry of the previous
    // one; its callback would only have returned on the generation check, but
    // it would first have spent a conversation load.
    clearPending()
    // Already projected ⇒ nothing to refresh (this is what breaks the remount
    // loop, see shouldRefreshOnTerminal). The pending chain was cleared above.
    if (!shouldRefreshOnTerminal(deps.messages())) return
    await deps.reload(id)
    if (gen !== generation || Number(deps.activeId()) !== id) return
    // A normal SSE terminal can beat the webhook projector by about a second
    // (measured live: ~2 s). Three bounded backoff reads cover that race; the
    // fixed budget forbids open-ended polling.
    if (shouldRetryProjection(attempt, gen, generation, deps.messages())) {
      timer = setT(() => { timer = null; void run(attempt + 1, id, gen) }, projectionRetryDelay(attempt))
    }
  }

  /** The panel's `terminal` handler. The emitted status is a SIGNAL and is
   *  deliberately ignored — it must never be read as the attempt counter. */
  const onTerminal = (_status?: unknown): Promise<void> => run(0, null, ++generation)
  return { onTerminal, cancel, hasPendingRetry: () => timer !== null }
}
