// C5 — a purchase request's automatic checkout quotes, one per store (API: store_quotes on
// GET /purchase-requests/{id}). Pure helpers for the customer and team views.

export type StoreQuoteStatus = 'pending' | 'running' | 'verified' | 'partial' | 'failed'

export interface StoreQuote {
  store_id: string
  store_name: string | null
  status: StoreQuoteStatus
  currency: string | null
  estimated: boolean
  observed_at: string | null
  merchandise_cents: number | null
  discounts_cents: number | null
  shipping_cents: number | null
  tax_cents: number | null
  fees_cents: number | null
  total_cents: number | null
  /** The store browser taking this quote while it runs (watchable in the chat). */
  live_session_id?: number | null
  // team only
  evidence?: string[]
  error_code?: string | null
  attempts?: number
  destination_verified?: boolean
  checkout_stage?: string | null
}

const IN_FLIGHT: StoreQuoteStatus[] = ['pending', 'running']

export function quoteInFlight(q: Pick<StoreQuote, 'status'>): boolean {
  return IN_FLIGHT.includes(q.status)
}

/** Keep polling while the request still waits for its automatic quote. */
export function storeQuotesNeedPoll(request: { status?: string, store_quotes?: StoreQuote[] } | null | undefined): boolean {
  if (!request || request.status !== 'pending_review') return false
  return (request.store_quotes ?? []).some(quoteInFlight)
}

/** "$57.28" from cents; '' when unknown. */
export function formatCents(cents: number | null | undefined, currency: string | null = 'USD'): string {
  if (typeof cents !== 'number' || !Number.isFinite(cents)) return ''
  const amount = (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return currency && currency !== 'USD' ? `${amount} ${currency}` : `$${amount}`
}

export function storeQuoteLabel(q: Pick<StoreQuote, 'status' | 'store_name' | 'store_id'>, lang: 'es' | 'en' = 'es'): string {
  const es: Record<StoreQuoteStatus, string> = {
    pending: 'En espera',
    running: 'Calculando el total real en la tienda…',
    verified: 'Total verificado en la tienda',
    partial: 'Total verificado (algunos productos no disponibles)',
    failed: 'Nuestro equipo te enviará este total',
  }
  const en: Record<StoreQuoteStatus, string> = {
    pending: 'Waiting',
    running: 'Getting the real total from the store…',
    verified: 'Total verified at the store',
    partial: 'Total verified (some items unavailable)',
    failed: 'Our team will send you this total',
  }
  return (lang === 'en' ? en : es)[q.status] ?? ''
}

/** The breakdown rows a verified quote shows, skipping what the store did not disclose and zero discounts/fees. */
export function storeQuoteRows(q: StoreQuote, lang: 'es' | 'en' = 'es'): Array<{ label: string, value: string }> {
  const names = lang === 'en'
    ? { merchandise: 'Products', discounts: 'Discounts', shipping: 'Shipping to our warehouse', tax: 'Sales tax', fees: 'Store fees' }
    : { merchandise: 'Productos', discounts: 'Descuentos', shipping: 'Envío a nuestra bodega', tax: 'Impuestos', fees: 'Cargos de la tienda' }
  const rows: Array<{ label: string, value: string }> = []
  for (const key of ['merchandise', 'discounts', 'shipping', 'tax', 'fees'] as const) {
    const cents = q[`${key}_cents`]
    if (typeof cents !== 'number') continue
    if ((key === 'discounts' || key === 'fees') && cents === 0) continue
    const value = key === 'discounts' ? `-${formatCents(Math.abs(cents), q.currency)}` : key === 'shipping' && cents === 0 ? (lang === 'en' ? 'Free' : 'Gratis') : formatCents(cents, q.currency)
    rows.push({ label: names[key] + (key === 'tax' && q.estimated ? (lang === 'en' ? ' (estimated)' : ' (estimado)') : ''), value })
  }
  return rows
}

// ---- Sequential checkout: one store at a time, a chat line per finished store, one final summary. ----

/** The store the agent is on: the running one, else the first waiting one (about to start). */
export function currentQuote<T extends Pick<StoreQuote, 'status'>>(quotes: T[]): T | null {
  return quotes.find((q) => q.status === 'running') ?? quotes.find((q) => q.status === 'pending') ?? null
}

export const quoteTerminal = (q: Pick<StoreQuote, 'status'>): boolean => !quoteInFlight(q)

/** A quote that counts toward the invoice: verified (or partial) with a total. */
export function quoteDone(q: Pick<StoreQuote, 'status' | 'total_cents'>): boolean {
  return (q.status === 'verified' || q.status === 'partial') && typeof q.total_cents === 'number'
}

/** The row label: En curso / En espera / Listo / No cotizada. */
export function storeStateLabel(q: Pick<StoreQuote, 'status' | 'total_cents'>): string {
  if (q.status === 'running') return 'En curso'
  if (q.status === 'pending') return 'En espera'
  return quoteDone(q) ? 'Listo' : 'No cotizada'
}

const quoteName = (q: Pick<StoreQuote, 'store_name' | 'store_id'>) => q.store_name || q.store_id

/** The store that follows `quote` in the API's order (the order stores were added): the first one still waiting or
 *  running after it, else any earlier one still waiting (never skip a pending store); null when none is left. */
export function nextStoreName(quotes: StoreQuote[], quote: Pick<StoreQuote, 'store_id'>): string | null {
  const i = quotes.findIndex((q) => q.store_id === quote.store_id)
  const open = (q: StoreQuote) => q.store_id !== quote.store_id && quoteInFlight(q)
  const next = quotes.slice(i + 1).find(open) ?? quotes.find(open)
  return next ? quoteName(next) : null
}
const SHORT_REASONS: Record<string, string> = {
  no_quotable_items: 'no hay productos disponibles',
  out_of_stock: 'sin existencias',
  unavailable: 'no disponible',
  timeout: 'tardó demasiado',
}

/** A short Spanish reason for a dropped store: the API's `reason`, else mapped from `error_code`. */
export function dropReason(q: { reason?: string | null, error_code?: string | null }): string {
  return (q.reason && q.reason.trim()) || (q.error_code && SHORT_REASONS[q.error_code]) || 'no disponible'
}

/** The deterministic chat line when a store finishes — built only from the API numbers. */
export function storeDoneMessage(quote: StoreQuote & { reason?: string | null }, next: string | null, final = true): string {
  const name = quoteName(quote)
  const own = quoteDone(quote)
    ? (() => {
        const parts = [
          typeof quote.shipping_cents === 'number' ? `envío ${formatCents(quote.shipping_cents, quote.currency)}` : '',
          typeof quote.tax_cents === 'number' ? `impuestos ${formatCents(quote.tax_cents, quote.currency)}` : '',
        ].filter(Boolean)
        return `¡Listo con ${name}! ✅ Total en la tienda ${formatCents(quote.total_cents, quote.currency)}${parts.length ? ` (${parts.join(', ')})` : ''}.`
      })()
    : `No pude cotizar ${name} (${dropReason(quote)}).`
  if (next) return `${own} Sigo con ${next} 👇`
  // The "all totals" line only when every store is terminal and this is the last one announced.
  return final ? `${own} ¡Listo! Ya tengo todos los totales ✅` : own
}

// ---- The final summary (checkout_summary on GET /purchase-requests/{id}) ----

export interface SummaryLine { title: string, variants?: unknown, quantity: number, unit_price_cents: number | null, state?: 'unavailable' | string, image_url?: string | null }
export interface SummaryStore {
  store_id: string, store_name: string | null, status: StoreQuoteStatus, included: boolean, reason: string | null
  lines: SummaryLine[]
  merchandise_cents: number | null, discounts_cents: number | null, shipping_cents: number | null
  tax_cents: number | null, fees_cents: number | null, total_cents: number | null
}
export interface CheckoutSummary {
  stores: SummaryStore[], stores_total_cents: number, commission_percent: number, commission_cents: number
  total_cents: number, invoice_total_cents: number | null, invoiced: boolean
  invoice_mode?: 'auto' | 'manual', manual_reason?: string | null
}

/** A line's chosen options as text, whatever shape the API sends (string, list or name→value map). */
export function variantsText(v: unknown): string {
  const parts = typeof v === 'string' ? [v] : Array.isArray(v) ? v : v && typeof v === 'object' ? Object.values(v) : []
  return parts.filter((x) => typeof x === 'string' && x.trim()).join(' · ')
}

/** "Talla M · ×2 · $29.00" style line detail: options, then quantity x unit price. */
export function summaryLineDetail(l: SummaryLine, currency: string | null = 'USD'): string {
  const qty = Math.max(1, Number(l.quantity) || 1)
  const price = formatCents(l.unit_price_cents, currency)
  return [variantsText(l.variants), price ? `${qty} × ${price}` : `${qty}`].filter(Boolean).join(' · ')
}

/** One store's totals rows: subtotal, discounts/fees only when non-zero, envío, impuestos, total de la tienda. */
export function summaryRows(s: SummaryStore): Array<{ label: string, value: string, strong?: boolean }> {
  const rows: Array<{ label: string, value: string, strong?: boolean }> = []
  const add = (label: string, cents: number | null, opts: { skipZero?: boolean, free?: boolean, minus?: boolean, strong?: boolean } = {}) => {
    if (typeof cents !== 'number' || (cents === 0 && opts.skipZero)) return
    rows.push({ label, value: cents === 0 && opts.free ? 'Gratis' : (opts.minus ? '−' : '') + formatCents(Math.abs(cents)), strong: opts.strong })
  }
  add('Subtotal', s.merchandise_cents)
  add('Descuentos', s.discounts_cents, { skipZero: true, minus: true })
  add('Envío', s.shipping_cents, { free: true })
  add('Impuestos', s.tax_cents)
  add('Cargos de la tienda', s.fees_cents, { skipZero: true })
  add('Total de la tienda', s.total_cents, { strong: true })
  return rows
}

/** A summary line that could not be bought: "No disponible", struck, no price counted. */
export const lineUnavailable = (l: Pick<SummaryLine, 'state'>): boolean => l.state === 'unavailable'

export interface SummaryTotal { kind: 'hidden' | 'estimated' | 'pay' | 'preparing', label: string, cents: number | null, note: string, canPay: boolean }

/** What the final card's total block shows: a payable total only when an automatic invoice exists. */
export function summaryTotal(s: CheckoutSummary): SummaryTotal {
  // An invoice that exists is always payable, whoever made it: every store can fail and the team still invoice by hand.
  if (typeof s.invoice_total_cents === 'number') return { kind: 'pay', label: 'Total a pagar', cents: s.invoice_total_cents, note: '', canPay: true }
  if (s.stores.length > 0 && s.stores.every((x) => !x.included)) return { kind: 'hidden', label: '', cents: null, note: '', canPay: false }
  if (s.invoice_mode === 'manual' && !s.invoiced) {
    return { kind: 'estimated', label: 'Total estimado', cents: s.total_cents, note: s.manual_reason?.trim() || 'Nuestro equipo te confirmará el total y te enviará la factura', canPay: false }
  }
  return { kind: 'preparing', label: 'Total a pagar', cents: s.total_cents, note: 'Preparando tu factura…', canPay: false }
}
