/**
 * Per-chat context assembly for the assistant (phase 1 — server only, no schema change).
 *
 * WHY: the client sends the whole useChat history every turn and the server used to
 * replay ALL of it to the model — with every past product gallery at full size and
 * the growing per-shopper block sitting BETWEEN the static system prompt and the
 * history (which shifts every byte after it, so Gemini's implicit prefix cache only
 * ever covered the system prompt). Prompt size — and cost and time-to-first-token —
 * grew linearly with the length of the chat.
 *
 * WHAT (pure functions, unit-tested in chatContext.test.mjs):
 *   ageGalleries()      old galleries → a one-line marker (query + count + first
 *                       titles + registry ids); the products still live in the
 *                       in-chat registry, so "el segundo que vimos" keeps working.
 *   windowMessages()    hysteresis window: trim only when the history exceeds
 *                       MAX messages or MAX_TOKENS, and then cut down to KEEP in one
 *                       go — so between trims the prompt is append-only and the
 *                       implicit cache also covers the recent history.
 *   withContextOnLastUser()  the dynamic per-shopper block (profile + registry) is
 *                       prepended to the NEWEST user message, so nothing before it
 *                       changes turn to turn.
 *   estimateTokens()    cheap size estimate (~4 chars/token) for the budget checks.
 *
 * Phase 2 (running summary stored per conversation) plugs in where windowMessages
 * drops turns; until then dropped turns are simply gone from the prompt (the
 * registry keeps the products and the shopping profile keeps durable preferences).
 */

export interface WindowOptions {
  /** Trim once the history has more UI messages than this. */
  max?: number
  /** After a trim, keep this many trailing UI messages. */
  keep?: number
  /** Trim once the estimated history size exceeds this many tokens. */
  maxTokens?: number
  /** Keep dropping oldest turns (down to `min`) while the window still exceeds this. */
  hardTokens?: number
  /** Never trim below this many messages. */
  min?: number
}

export const WINDOW_DEFAULTS: Required<WindowOptions> = { max: 14, keep: 8, maxTokens: 6000, hardTokens: 9000, min: 2 }

/** Rough token estimate: JSON length / 4. Deliberately cheap; only drives budget checks. */
export function estimateTokens(x: any): number {
  if (x == null) return 0
  const s = typeof x === 'string' ? x : JSON.stringify(x)
  return Math.ceil(s.length / 4)
}

function partTitle(p: any): string {
  return String(p?.title || p?.name || '').replace(/\s+/g, ' ').trim().slice(0, 60)
}

/**
 * The compact marker that replaces an old gallery's product list. Keeps what the
 * model needs to talk about it later: what was searched, how many came back, the
 * first titles, and the registry ids so it can re-display with show_saved_products.
 */
export function galleryMarker(part: any, productId?: (p: any) => string | null): any {
  const input = part?.input && typeof part.input === 'object' ? part.input : {}
  const products: any[] = Array.isArray(part?.output?.products) ? part.output.products : []
  const q = [input.query, input.category, input.store || (Array.isArray(input.brands) ? input.brands.join('/') : null)].filter(Boolean).join(' · ')
  const titles = products.slice(0, 3).map(partTitle).filter(Boolean)
  const ids = productId ? products.map(productId).filter(Boolean) : []
  const head = `Galería anterior: ${products.length} producto${products.length === 1 ? '' : 's'}${q ? ` para «${q}»` : ''}`
  const detail = titles.length ? ` — ${titles.join('; ')}${products.length > 3 ? '; …' : ''}` : ''
  const reg = ids.length ? ` (ids en el registro: ${ids.slice(0, 16).join(', ')}${ids.length > 16 ? ', …' : ''})` : ''
  return { gallery_marker: `${head}${detail}${reg}. Los productos siguen en PRODUCTS ALREADY SHOWN IN THIS CHAT; re-muéstralos con show_saved_products.` }
}

/**
 * Replace the product lists of galleries that are older than the last `keepLast`
 * assistant messages with a one-line marker (and compact the recent ones). Returns new message objects; the
 * input is never mutated (the same array is also persisted/rendered elsewhere).
 */
export function ageGalleries(messages: any[], galleryTools: string[], opts: { keepLast?: number; productId?: (p: any) => string | null; compactProduct?: (p: any) => any } = {}): any[] {
  const keepLast = opts.keepLast ?? 2
  const set = new Set(galleryTools.map((t) => 'tool-' + t))
  // Indices of assistant messages, newest first; the last `keepLast` stay verbatim.
  const assistantIdx = messages.map((m, i) => (m?.role === 'assistant' ? i : -1)).filter((i) => i >= 0)
  const protect = new Set(assistantIdx.slice(-keepLast))
  return messages.map((m, i) => {
    if (m?.role !== 'assistant' || !Array.isArray(m.parts)) return m
    let changed = false
    const parts = m.parts.map((p: any) => {
      if (!set.has(p?.type) || p?.state !== 'output-available' || !Array.isArray(p?.output?.products)) return p
      changed = true
      // Protected (recent) galleries keep their products, but in the MODEL's compact
      // shape when a compactor is given — so the token estimate that drives the
      // window matches what is actually sent (the full objects carry image URLs and
      // page tokens the model never reads).
      if (protect.has(i)) return opts.compactProduct ? { ...p, output: { ...p.output, products: p.output.products.map(opts.compactProduct) } } : p
      return { ...p, output: galleryMarker(p, opts.productId) }
    })
    return changed ? { ...m, parts } : m
  })
}

/** Index of the earliest message we can start a window at (a user message) at or after `from`. */
function alignToUser(messages: any[], from: number): number {
  for (let i = from; i < messages.length; i++) if (messages[i]?.role === 'user') return i
  return messages.length - 1
}

/**
 * Hysteresis window over UI messages. Returns the trailing window plus how many
 * messages were dropped. The window always starts at a user message (a model
 * conversation must open with the user; tool calls and their results live inside a
 * single assistant UI message, so cutting at UI-message boundaries never orphans
 * a tool result).
 */
export function windowMessages(messages: any[], options: WindowOptions = {}): { messages: any[]; dropped: number; tokens: number; trimmed: boolean } {
  const o = { ...WINDOW_DEFAULTS, ...options }
  const total = estimateTokens(messages)
  if (messages.length <= o.max && total <= o.maxTokens) return { messages, dropped: 0, tokens: total, trimmed: false }
  let start = alignToUser(messages, Math.max(0, messages.length - o.keep))
  let win = messages.slice(start)
  let tokens = estimateTokens(win)
  // Hard cap: a huge pasted PDF or a very chatty window can still be too big — keep
  // dropping the oldest turn (user + its reply) until it fits or only `min` remain.
  while (tokens > o.hardTokens && win.length > o.min) {
    const next = alignToUser(win, 1)
    if (next <= 0 || next >= win.length) break
    win = win.slice(next)
    tokens = estimateTokens(win)
  }
  return { messages: win, dropped: messages.length - win.length, tokens, trimmed: true }
}

/**
 * Prepend the dynamic context block as a text part of the NEWEST user message.
 * Everything before it stays byte-identical across turns (prefix-cache friendly),
 * and the block sits right next to the question it should inform.
 */
export function withContextOnLastUser(messages: any[], context: string): any[] {
  const ctx = String(context || '').trim()
  if (!ctx) return messages
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]
    if (m?.role !== 'user') continue
    const raw = Array.isArray(m.parts) ? m.parts : (typeof m.content === 'string' ? [{ type: 'text', text: m.content }] : [])
    const parts = [{ type: 'text', text: `[Contexto de esta conversación — úsalo, no lo repitas al cliente]\n${ctx}\n[Fin del contexto]` }, ...raw]
    const copy = { ...m, parts }
    if ('content' in copy) delete (copy as any).content
    return [...messages.slice(0, i), copy, ...messages.slice(i + 1)]
  }
  return messages
}

/**
 * Remove tool parts that exist only for the UI (e.g. the follow-up chips) before the
 * history is replayed: they carry nothing the model needs, and since the tool is no
 * longer declared to the model, replaying a call to it would be an undeclared
 * function in the transcript.
 */
export function dropToolParts(messages: any[], toolNames: string[]): any[] {
  const set = new Set(toolNames.map((t) => 'tool-' + t))
  return messages.map((m) => {
    if (!Array.isArray(m?.parts) || !m.parts.some((p: any) => set.has(p?.type))) return m
    return { ...m, parts: m.parts.filter((p: any) => !set.has(p?.type)) }
  })
}

/** One-line prompt-size report for the usage log. */
export function contextStats(input: any[], windowed: any[], dropped: number) {
  return { messages_in: input.length, messages_sent: windowed.length, dropped, est_tokens: estimateTokens(windowed) }
}
