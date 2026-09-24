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
    rows.push({ label: names[key] + (key === 'tax' && q.estimated ? (lang === 'en' ? ' (estimated by the store)' : ' (estimado por la tienda)') : ''), value })
  }
  return rows
}
