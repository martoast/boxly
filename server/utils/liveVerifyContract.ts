import { z } from 'zod'

/**
 * Objective guidance for the `live_verify` tool, extracted so a test can pin
 * it. This describe() string is the ONLY steering surface for what the model
 * writes into `objective`, and that text becomes the engine browser's actual
 * search input. The previous example here demonstrated a verb-first
 * verification sentence — the model copied it almost word for word and a real
 * session searched New Balance for "Verificar EN VIVO en New".
 *
 * The session always verifies current price and availability of exactly ONE
 * best-matching product, so none of that belongs in the objective either.
 */
export const LIVE_VERIFY_OBJECTIVE_GUIDANCE =
  'THE PRODUCT AND ITS HARD CONSTRAINTS ONLY: product type or name plus real constraints (size, color, capacity, material, on-sale). '
  + 'Do NOT include: action verbs (verificar, buscar, ver en vivo, check, verify), the store name (store_id already identifies the store), '
  + 'result counts ("hasta 3" — the session returns exactly ONE verified product), reporting instructions (current price and availability are ALWAYS verified), '
  + 'or tracking markers/codes from the conversation. '
  + 'Good: "zapatos para correr en oferta". Bad: "Verificar EN VIVO en New Balance ofertas de hasta 3 zapatos para correr, confirmando precio y disponibilidad actuales".'

/**
 * Frozen v1 `live_verify` input shape. The bounds mirror Laravel's
 * LiveShoppingController::store validation exactly (objective 4–500 trimmed,
 * store_id `^[a-z0-9][a-z0-9_-]{0,39}$`) — never change one side without the
 * other. Moving the object here changed no wire behavior; only the objective
 * guidance text was rewritten.
 */
export const liveVerifyInputSchema = z.object({
  objective: z.string().trim().min(4).max(500).describe(LIVE_VERIFY_OBJECTIVE_GUIDANCE),
  // Laravel's exact validation rule for this field (LiveShoppingController::store).
  store_id: z.string().regex(/^[a-z0-9][a-z0-9_-]{0,39}$/).describe('Flat engine store slug identifying exactly ONE store to open live. Preserve word separators: use "new-balance" (never "newbalance"), "best-buy" (never "bestbuy"), "dicks", "target", or "walmart". P1 is single-store.'),
})

/**
 * The allowlist for a `live_verify` failure log line. EXACTLY these keys, ever.
 *
 * This exists because the tool's original bare `catch {}` made a real outage
 * undiagnosable: a stale `active_slot` made Laravel answer 409 on every create,
 * and the only trace anywhere was a generic Spanish sentence shown to the
 * customer. Reconstructing the cause took a database query and an index
 * definition.
 *
 * The rule is allowlist, never denylist. Error objects from `$fetch` carry the
 * whole response — body, headers, sometimes the request — so ANY attempt to log
 * "the error" leaks the objective, the Sanctum token, or a viewer ticket the
 * moment an upstream shape changes. Nothing reaches a log line unless it is
 * named here and passed through a type check.
 */
export const LIVE_VERIFY_LOG_KEYS = ['event', 'reason', 'status', 'code', 'conversation_id', 'store_id'] as const

/** Stable reasons, so log greps keep working when prose changes. */
export const LIVE_VERIFY_LOG_REASONS = ['create_failed', 'contract_mismatch', 'store_unsupported', 'capability_unavailable'] as const

const MAX_CODE_CHARS = 64

/**
 * Build the ONLY object that may be logged for a live_verify failure.
 *
 * `status` is a plausible HTTP status or null — never a string, never an
 * upstream-controlled number outside 100–599. `code` is a bounded slug matched
 * against a conservative charset: upstream error codes are attacker-influencable
 * text, and a log line is a place where newlines forge entries.
 */
export function liveVerifyFailureLog(
  reason: (typeof LIVE_VERIFY_LOG_REASONS)[number],
  err: unknown,
  ctx: { conversationId?: number; storeId?: string },
) {
  const e = (err ?? {}) as Record<string, any>
  const rawStatus = e.statusCode ?? e.status ?? e.response?.status ?? null
  const status = typeof rawStatus === 'number' && Number.isInteger(rawStatus) && rawStatus >= 100 && rawStatus <= 599
    ? rawStatus
    : null

  // Only the stable code field, and only if it looks like a code. Message and
  // body are deliberately unreachable from here.
  // Non-2xx callApi responses are returned as a flat `{status, error}`
  // object; thrown $fetch errors commonly nest the response under `data`.
  // Accept both locations, but never message/body prose.
  const rawCode = e.data?.error ?? e.data?.code ?? e.error ?? e.code ?? null
  const code = typeof rawCode === 'string' && /^[A-Za-z0-9_.:-]{1,64}$/.test(rawCode.trim())
    ? rawCode.trim().slice(0, MAX_CODE_CHARS)
    : null

  return {
    event: 'live_verify_failure',
    reason,
    status,
    code,
    // Both are ours, not upstream: an integer row id and a slug already pinned
    // by liveVerifyInputSchema's regex.
    conversation_id: typeof ctx.conversationId === 'number' ? ctx.conversationId : null,
    store_id: typeof ctx.storeId === 'string' && /^[a-z0-9][a-z0-9_-]{0,39}$/.test(ctx.storeId) ? ctx.storeId : null,
  }
}

// ── Store routing contract ──────────────────────────────────────────────────
// The engine's catalog (Laravel GET /live-shopping/stores, itself the engine's
// signed GET /v1/catalog) is the ONLY list of stores a live session may be
// routed to. Live Boxly runs routed walmart/nike freely, the engine answered
// 404 unknown_store, and the customer saw a generic outage. With the list in
// hand the tool's store_id becomes an enum of exactly those slugs, the prompt
// names them, and a refusal for an unknown store is surfaced as its own state.
export const LIVE_STORE_ID_RE = /^[a-z0-9][a-z0-9_-]{0,39}$/
export const LIVE_STORES_MAX = 50
export type LiveStore = { id: string; name: string }

/** Validate Laravel's {success, stores:[{id,name}]} into a closed, deduped list; anything malformed is dropped. */
export function parseLiveStores(payload: unknown): LiveStore[] {
  const raw = (payload as any)?.stores
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const stores: LiveStore[] = []
  for (const entry of raw) {
    const id = typeof entry?.id === 'string' ? entry.id : ''
    const name = typeof entry?.name === 'string' ? entry.name.trim().slice(0, 120) : ''
    if (!LIVE_STORE_ID_RE.test(id) || !name || seen.has(id)) continue
    seen.add(id)
    stores.push({ id, name })
    if (stores.length >= LIVE_STORES_MAX) break
  }
  return stores
}

/** Live verification is exposed ONLY with a confirmed catalog: an empty list means the tool must not exist this turn. */
export function liveVerifyExposed(stores: LiveStore[]): boolean {
  return Array.isArray(stores) && stores.length > 0
}

/**
 * The tool input schema with store_id restricted to the live catalog. With no
 * confirmed catalog there is NO schema (null): the tool is not registered, so
 * an arbitrary slug can never reach the engine and recreate unknown_store.
 */
export function liveVerifyInputSchemaFor(stores: LiveStore[]) {
  const ids = stores.map((s) => s.id)
  if (!ids.length) return null
  return liveVerifyInputSchema.extend({
    store_id: z.enum(ids as [string, ...string[]]).describe(
      `Flat engine store slug identifying exactly ONE store to open live. ONLY these stores can be opened live: ${stores.map((s) => `${s.name} = "${s.id}"`).join(', ')}.`,
    ),
  })
}

/** One prompt sentence naming the supported stores, or the fail-closed note when the catalog could not be confirmed. */
export function liveStoreGuidance(stores: LiveStore[]): string {
  if (!stores.length) {
    return 'Live verification is TEMPORARILY UNAVAILABLE: the list of supported stores could not be confirmed, so live_verify will refuse to start a session. Tell the customer live verification is not available right now, do not promise it, and keep helping in every other way.'
  }
  return `Supported live stores: ${stores.map((s) => `${s.name} (${s.id})`).join(', ')}. If the customer names any other store, say Boxly cannot verify live in that store yet and offer one of the supported stores instead; never start a session for an unsupported store.`
}

/**
 * The honest tool result for a create that Laravel refused as store_unsupported
 * (engine unknown_store). null for anything else, so every other failure keeps
 * the existing generic path. Carries only our own bounded fields.
 */
export function liveVerifyRefusal(r: unknown, stores: LiveStore[], storeId: unknown) {
  const res = r as any
  if (!res || typeof res !== 'object' || res.ok !== false || res.code !== 'store_unsupported') return null
  return {
    ok: false as const,
    error: 'store_not_supported' as const,
    store_id: typeof storeId === 'string' && LIVE_STORE_ID_RE.test(storeId) ? storeId : null,
    supported: stores.map((s) => s.name),
    message: 'Boxly aún no puede verificar en vivo en esa tienda.',
  }
}

/**
 * FAIL-CLOSED capability state: when the store catalog could not be confirmed
 * the tool never creates a session (that would only recreate unknown_store
 * downstream). Ordinary assistant conversation continues; only live
 * verification is honestly reported unavailable.
 */
export function liveCapabilityUnavailable() {
  return {
    ok: false as const,
    error: 'live_capability_unavailable' as const,
    message: 'La verificación en vivo no está disponible en este momento.',
  }
}
