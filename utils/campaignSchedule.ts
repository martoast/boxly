// Scheduled email campaigns (2026-11-17): a draft with scheduled_at starts sending by itself then (boxly:campaigns-scheduled). The team
// thinks in central Mexico time (UTC-6, no daylight saving since 2022), so dates are shown and picked there. Pure; no Vue.

export const MX_TZ = 'America/Mexico_City'
const MX_OFFSET = '-06:00'

export interface ScheduledCampaignLike { status?: string | null, scheduled_at?: string | null }

/** A draft waiting for its scheduled time. */
export function isScheduled(c: ScheduledCampaignLike | null | undefined): boolean {
  return !!c && c.status === 'draft' && !!c.scheduled_at
}

/** "lun 23 nov, 9:00" in central Mexico time (or English). */
export function scheduleLabel(iso: string | null | undefined, lang: 'es' | 'en' = 'es'): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const day = new Intl.DateTimeFormat(lang === 'es' ? 'es-MX' : 'en-US', { timeZone: MX_TZ, weekday: 'short', day: 'numeric', month: 'short' }).format(d).replace(/\./g, '').replace(/ de /g, ' ')
  const time = lang === 'es' ? mxTime(iso).replace(/^0/, '') : new Intl.DateTimeFormat('en-US', { timeZone: MX_TZ, hour: 'numeric', minute: '2-digit' }).format(d)
  return `${day}, ${time}`
}

/** The central-Mexico calendar day (YYYY-MM-DD) of an instant. */
export function mxDay(iso: string | Date | null | undefined): string {
  if (!iso) return ''
  const d = iso instanceof Date ? iso : new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('en-CA', { timeZone: MX_TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
}

/** "HH:MM" in central Mexico time. */
export function mxTime(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : new Intl.DateTimeFormat('en-GB', { timeZone: MX_TZ, hour: '2-digit', minute: '2-digit', hour12: false }).format(d)
}

/** The instant for a central-Mexico day + time ("2026-11-23", "09:00") as ISO with its offset. */
export function mxInstant(day: string, time: string): string {
  return `${day}T${(time || '09:00').slice(0, 5)}:00${MX_OFFSET}`
}

/** The month grid (weeks of 7 days, Monday first) for a YYYY-MM month: each cell its YYYY-MM-DD, or null outside the month. */
export function monthGrid(year: number, month0: number): (string | null)[][] {
  const first = new Date(Date.UTC(year, month0, 1))
  const days = new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate()
  const lead = (first.getUTCDay() + 6) % 7
  const cells: (string | null)[] = Array(lead).fill(null)
  for (let d = 1; d <= days; d++) cells.push(`${year}-${String(month0 + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
  while (cells.length % 7) cells.push(null)
  const weeks: (string | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}
