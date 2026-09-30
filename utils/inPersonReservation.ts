// Pure helpers for the in-person reservation "event" pages (customer list/detail, team detail).
// Final billing rule: $30 x hours worked + 10% x amount spent - the $30 already paid.
export const HOURLY_USD = 30
export const COMMISSION_PERCENT = 10
export const RESERVE_USD = 30

type Lang = 'es' | 'en'
const L = (lang: string): Lang => (lang === 'es' ? 'es' : 'en')

export const money = (n: number | string | null | undefined) => `$${(Math.round(Number(n || 0) * 100) / 100).toFixed(2)}`

// What the team is about to bill, computed the same way the API does (cents rounded).
export function computeFinal(hoursWorked: number | string, amountSpent: number | string, credit: number = RESERVE_USD) {
  const hours = Number(hoursWorked) || 0
  const spent = Number(amountSpent) || 0
  const hoursFee = Math.round(hours * HOURLY_USD * 100) / 100
  const commission = Math.round(spent * COMMISSION_PERCENT) / 100
  const total = Math.max(0, Math.round((hoursFee + commission - credit) * 100) / 100)
  return { hours, spent, hoursFee, commission, credit, total }
}

const STATUS: Record<string, { es: string; en: string; tone: string }> = {
  pending_payment: { es: 'Pago pendiente', en: 'Payment pending', tone: 'bg-amber-100 text-amber-800' },
  confirmed: { es: 'Confirmada', en: 'Confirmed', tone: 'bg-green-100 text-green-800' },
  completed: { es: 'Completada', en: 'Completed', tone: 'bg-indigo-100 text-indigo-800' },
  cancelled: { es: 'Cancelada', en: 'Cancelled', tone: 'bg-red-100 text-red-800' },
  expired: { es: 'Expirada', en: 'Expired', tone: 'bg-gray-100 text-gray-700' },
  slot_taken: { es: 'Horario ocupado', en: 'Time taken', tone: 'bg-gray-100 text-gray-700' },
}
export const statusLabel = (s: string, lang: string) => STATUS[s]?.[L(lang)] ?? s
export const statusTone = (s: string) => STATUS[s]?.tone ?? 'bg-gray-100 text-gray-700'

const FINAL_STATUS: Record<string, { es: string; en: string }> = {
  pending: { es: 'Cobro final por enviar', en: 'Final invoice not sent yet' },
  sent: { es: 'Pago pendiente', en: 'Payment pending' },
  paid: { es: 'Pagado', en: 'Paid' },
  settled: { es: 'Pagado', en: 'Paid' },
}
export const finalStatusLabel = (s: string, lang: string) => FINAL_STATUS[s]?.[L(lang)] ?? s
export const finalIsPaid = (f: { status?: string } | null | undefined) => f?.status === 'paid' || f?.status === 'settled'

const EVENTS: Record<string, { es: string; en: string }> = {
  reserved: { es: 'Reserva creada', en: 'Reservation created' },
  paid: { es: 'Reserva pagada ($30)', en: 'Reservation paid ($30)' },
  refunded: { es: 'Reembolso', en: 'Refunded' },
  cancelled: { es: 'Reserva cancelada', en: 'Reservation cancelled' },
  completed: { es: 'Compra completada', en: 'Shopping completed' },
  final_invoice_sent: { es: 'Cobro final enviado', en: 'Final invoice sent' },
  final_invoice_paid: { es: 'Cobro final pagado', en: 'Final invoice paid' },
}
export const eventLabel = (type: string, lang: string) => EVENTS[type]?.[L(lang)] ?? type

// An ISO UTC instant shown in Pacific time ("hora de California"): '29 sep, 10:30'.
export function formatPacific(iso: string, lang: string): string {
  if (!iso) return ''
  return new Date(iso).toLocaleString(lang === 'es' ? 'es-MX' : 'en-US', {
    timeZone: 'America/Tijuana', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  })
}

// Customer list: what is still to pay for this reservation (null when nothing).
export function pendingTotal(r: { final?: { status: string; total_usd: number | string } | null }): number | null {
  return r.final && (r.final.status === 'pending' || r.final.status === 'sent') ? Number(r.final.total_usd) : null
}
