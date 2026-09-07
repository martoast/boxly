/**
 * Per-chat rolling memory (phase 2 of the bounded-context work) — the model-free core.
 * The aux-model generator lives in ./chatSummary.ts so this file (and its tests) never
 * import the provider.
 *
 * The prompt keeps only the last few turns verbatim (server/utils/chatContext.ts).
 * Everything older is folded into ONE running summary per conversation, stored on
 * the conversation row in the Boxly API (running_summary / summary_upto_message_id /
 * summary_version) and prepended to the newest user message next turn.
 *
 *   readSummary()   — the per-turn read; LRU-cached per process, GET on a miss.
 *   summarize()     — after a reply is persisted: GET the rows to fold (the API picks
 *                     them by DB id), ask the cheap aux model for the updated summary,
 *                     PATCH it back with optimistic versioning. Fire-and-forget; every
 *                     failure keeps the previous summary.
 *
 * Gated by CHAT_SUMMARY (env): unset/"0" → off (no reads, no writes). Ships OFF; it is
 * flipped on in prod once the endpoints and the summarizer have been verified.
 */

export const summaryEnabled = () => /^(1|true|on|yes)$/i.test(String(process.env.CHAT_SUMMARY || ''))

/** Hard cut when READING into the prompt (the API also caps writes at 2,500 chars). */
export const SUMMARY_MAX_CHARS = 2000

export interface SummaryState { running_summary: string | null; summary_version: number; summary_upto_message_id: number | null; unsummarized: number }

// ── per-process cache ────────────────────────────────────────────────────────
const TTL_MS = 15 * 60 * 1000
const MAX_ENTRIES = 500
const cache = new Map<number, { state: SummaryState; at: number }>()
const inFlight = new Set<number>()

function cacheGet(id: number): SummaryState | null {
  const hit = cache.get(id)
  if (!hit) return null
  if (Date.now() - hit.at > TTL_MS) { cache.delete(id); return null }
  cache.delete(id); cache.set(id, hit) // LRU bump
  return hit.state
}
function cacheSet(id: number, state: SummaryState) {
  cache.delete(id); cache.set(id, { state, at: Date.now() })
  if (cache.size > MAX_ENTRIES) cache.delete(cache.keys().next().value as number)
}
/** Test hook. */
export function _resetSummaryCache() { cache.clear(); inFlight.clear() }

// ── API access (injected so it is testable without the network) ─────────────
export type ApiCall = (path: string, opts?: { method?: string; body?: any; token?: string; timeoutMs?: number }) => Promise<any>

function toState(d: any): SummaryState {
  return {
    running_summary: typeof d?.running_summary === 'string' && d.running_summary.trim() ? d.running_summary : null,
    summary_version: Number(d?.summary_version) || 0,
    summary_upto_message_id: d?.summary_upto_message_id != null ? Number(d.summary_upto_message_id) : null,
    unsummarized: Number(d?.unsummarized) || 0,
  }
}

/** The summary for THIS turn's prompt (null when off / guest / none yet). Never throws. */
export async function readSummary(api: ApiCall, conversationId: number | undefined, token: string | undefined): Promise<SummaryState | null> {
  if (!summaryEnabled() || !conversationId || !token) return null
  const cached = cacheGet(conversationId)
  if (cached) return cached
  try {
    const d: any = await api(`/conversations/${conversationId}/context`, { token, timeoutMs: 4000 })
    if (!d || d.ok === false) return null
    const state = toState(d)
    cacheSet(conversationId, state)
    return state
  } catch {
    return null
  }
}

/** The block that goes into the prompt's context part (above the registry). */
export function summaryBlock(state: SummaryState | null): string {
  const s = state?.running_summary
  if (!s) return ''
  return `RESUMEN DE LO QUE VA DE ESTA CONVERSACIÓN (turnos anteriores que ya no ves completos — trátalo como cierto, no lo repitas al cliente):\n${s.slice(0, SUMMARY_MAX_CHARS)}`
}

// ── transcript rendering (what the summarizer reads) ────────────────────────
const GALLERY = new Set(['search_products', 'curate_products', 'find_live_product', 'browse_store', 'browse_stores', 'show_products', 'show_saved_products'])
const short = (s: any, n = 220) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n)

function toolLine(name: string, input: any, output: any): string {
  if (GALLERY.has(name)) {
    const prods: any[] = Array.isArray(output?.products) ? output.products : []
    const q = [input?.query, input?.category, input?.store || (Array.isArray(input?.brands) ? input.brands.join('/') : null)].filter(Boolean).join(' · ')
    const titles = prods.slice(0, 4).map((p) => short(p?.title, 60)).filter(Boolean).join('; ')
    return `[galería: ${prods.length} productos${q ? ` para «${q}»` : ''}${titles ? ` — ${titles}${prods.length > 4 ? '; …' : ''}` : ''}]`
  }
  if (name === 'show_shipment') {
    const items: any[] = Array.isArray(output?.items) ? output.items : (Array.isArray(input?.items) ? input.items : [])
    return `[carrito: ${items.map((i) => `${i?.quantity && i.quantity > 1 ? i.quantity + '× ' : ''}${short(i?.name, 50)}`).join(', ') || 'vacío'}${output?.box_label ? ` — caja ${output.box_label}` : ''}]`
  }
  if (name === 'show_assisted_summary') {
    const items: any[] = Array.isArray(output?.items) ? output.items : (Array.isArray(input?.items) ? input.items : [])
    return `[solicitud de compra asistida enviada con: ${items.map((i) => short(i?.name, 50)).join(', ')}]`
  }
  if (name === 'update_shopping_profile') return `[guardó en el perfil: ${short(JSON.stringify(input?.profile ?? input), 200)}]`
  if (name === 'create_self_order') return `[registró compra propia (casillero): ${short(JSON.stringify(input?.items ?? input), 160)}]`
  if (name === 'show_orders') return `[consultó sus pedidos${input?.order_id ? ` (${input.order_id})` : ''}]`
  if (name === 'cancel_order') return `[pidió cancelar el pedido ${input?.order_number || input?.order_id || ''}]`
  if (name === 'show_box_guide') return '[vio la tabla de cajas/envío]'
  if (name === 'plan_in_person') return '[abrió el planificador de compras presenciales]'
  if (name === 'create_account') return '[se le pidió crear cuenta]'
  if (name === 'suggest_followups' || name === 'feature_products') return ''
  return `[${name}${input ? ': ' + short(JSON.stringify(input), 120) : ''}]`
}

/** Persisted rows ({id, role, content:{parts}}) → a compact transcript the aux model reads. */
export function renderTranscript(rows: any[]): string {
  const lines: string[] = []
  for (const r of rows || []) {
    const parts: any[] = Array.isArray(r?.content?.parts) ? r.content.parts : (typeof r?.content === 'string' ? [{ type: 'text', text: r.content }] : [])
    const who = r?.role === 'user' ? 'Cliente' : 'Asistente'
    const bits: string[] = []
    for (const p of parts) {
      if (p?.type === 'text') { const t = short(p.text, 400); if (t) bits.push(t) }
      else if (typeof p?.type === 'string' && p.type.startsWith('tool-')) { const l = toolLine(p.type.slice(5), p.input, p.output); if (l) bits.push(l) }
      else if (p?.type === 'file') bits.push('[adjuntó un archivo]')
    }
    if (bits.length) lines.push(`${who}: ${bits.join(' ')}`)
  }
  return lines.join('\n')
}

// ── evergreen guard ──────────────────────────────────────────────────────────
// Prices and discounts change between turns and harvests; a number frozen in the
// summary would be stated as fact later. Same rule as the catalog prose.
export function stripPrices(s: string): string {
  return String(s || '')
    .replace(/(?:USD|US\$|MXN|\$)\s?\d[\d.,]*(?:\s?(?:USD|MXN|dólares|pesos)\b)?/gi, '[precio]')
    .replace(/\d[\d.,]*\s?(?:USD|MXN|dólares|pesos)\b/gi, '[precio]')
    .replace(/\d[\d.,]*\s?%(?:\s?(?:de\s)?(?:descuento|off|dto\.?))?/gi, '[descuento]')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

// ── the summarizer ───────────────────────────────────────────────────────────
/** Prompt for the aux model (used by ./chatSummary.ts). */

export const SUMMARY_SYSTEM = `Eres la memoria de una conversación entre un cliente en México y el asistente de compras de Boxly (Boxly compra productos en EE. UU. y los importa). Actualiza el RESUMEN de la conversación: conserva lo vigente del resumen anterior, integra los mensajes nuevos, elimina lo ya resuelto. Español de México, máximo 150 palabras, con estas secciones fijas (omite las vacías):
1) Qué busca y para quién.
2) Preferencias y restricciones dichas en ESTE chat (tallas, colores, presupuesto en términos relativos, marcas sí/no, tienda en foco).
3) Productos que le interesaron o descartó (usa los ids del registro pNNN cuando aparezcan).
4) Carrito / pedido: estado y pasos pendientes.
5) Preguntas abiertas.
NUNCA incluyas precios, montos ni porcentajes de descuento (cambian con el tiempo). No inventes nada que no esté en los mensajes. Devuelve solo el resumen.`

export interface SummarizeDeps { api: ApiCall; generate: SummaryGenerator; log?: (line: string) => void }

export interface SummarizeResult { ran: boolean; folded: number; chars: number; reason?: string }

/**
 * Fold the next unsummarized rows into the running summary. Safe to call every turn:
 * it no-ops when nothing is ready, when a run is already in flight for the chat, or
 * when the feature is off. `window` must match the verbatim window the prompt keeps.
 */
export async function summarize(conversationId: number, token: string, window: number, deps: SummarizeDeps): Promise<SummarizeResult> {
  if (!summaryEnabled() || !conversationId || !token) return { ran: false, folded: 0, chars: 0, reason: 'off' }
  if (inFlight.has(conversationId)) return { ran: false, folded: 0, chars: 0, reason: 'in_flight' }
  inFlight.add(conversationId)
  try {
    const d: any = await deps.api(`/conversations/${conversationId}/context?window=${window}`, { token, timeoutMs: 6000 })
    if (!d || d.ok === false) return { ran: false, folded: 0, chars: 0, reason: 'context_unavailable' }
    const state = toState(d)
    cacheSet(conversationId, state)
    const rows: any[] = Array.isArray(d.to_fold) ? d.to_fold : []
    if (!rows.length) return { ran: false, folded: 0, chars: 0, reason: 'nothing_to_fold' }
    const transcript = renderTranscript(rows)
    if (!transcript.trim()) return { ran: false, folded: 0, chars: 0, reason: 'empty_transcript' }

    const raw = await deps.generate(state.running_summary, transcript)
    const summary = stripPrices(raw).slice(0, 2400)
    if (!summary) return { ran: false, folded: 0, chars: 0, reason: 'empty_summary' }

    const upto = Number(rows[rows.length - 1]?.id)
    const res: any = await deps.api(`/conversations/${conversationId}/summary`, {
      method: 'PATCH', token, timeoutMs: 6000,
      body: { running_summary: summary, summary_upto_message_id: upto, base_version: state.summary_version },
    })
    if (!res || res.ok === false) {
      // 409 = a concurrent turn already advanced the summary; drop ours, the next turn re-folds.
      cache.delete(conversationId)
      return { ran: true, folded: 0, chars: 0, reason: res?.status === 409 ? 'version_conflict' : 'write_failed' }
    }
    cacheSet(conversationId, { running_summary: summary, summary_version: Number(res?.summary_version) || state.summary_version + 1, summary_upto_message_id: upto, unsummarized: Math.max(0, state.unsummarized - rows.length) })
    return { ran: true, folded: rows.length, chars: summary.length }
  } catch (e) {
    deps.log?.(`[assistant] summarize failed: ${e instanceof Error ? e.message : e}`)
    return { ran: true, folded: 0, chars: 0, reason: 'error' }
  } finally {
    inFlight.delete(conversationId)
  }
}

/** Should this turn kick off a fold? (cheap, no I/O) */
export function shouldSummarize(dropped: number, state: SummaryState | null, window: number): boolean {
  if (!summaryEnabled()) return false
  if (dropped > 0) return true
  return !!state && state.unsummarized > window
}
