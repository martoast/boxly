/**
 * Days, weeks and months as the San Diego warehouse counts them (America/Los_Angeles),
 * whatever the phone's own clock says — "today" for Mau is today in San Diego.
 * Days are 'YYYY-MM-DD' strings; weeks run Monday–Sunday.
 */
export const WAREHOUSE_TZ = 'America/Los_Angeles'

export type PeriodKind = 'day' | 'week' | 'month' | 'year'
export type Period = { kind: PeriodKind; from: string; to: string; since: Date; until: Date; days: string[] }

/** 'YYYY-MM-DD' of `date` in the warehouse timezone. */
export function warehouseDay(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: WAREHOUSE_TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
}

export function addDays(ymd: string, n: number): string {
  const d = new Date(`${ymd}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** The instant 00:00 of warehouse day `ymd` begins (DST-safe: the offset is read for that instant). */
export function startOfWarehouseDay(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number)
  let t = Date.UTC(y, m - 1, d)
  for (let i = 0; i < 2; i++) {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
      timeZone: WAREHOUSE_TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(new Date(t)).map((x) => [x.type, x.value]))
    t += Date.UTC(y, m - 1, d) - Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second)
  }
  return new Date(t)
}

/** The day / week (Mon–Sun) / month / year containing warehouse day `anchor`. */
export function periodOf(kind: PeriodKind, anchor: string): Period {
  let from = anchor, to = anchor
  if (kind === 'week') {
    const dow = (new Date(`${anchor}T12:00:00Z`).getUTCDay() + 6) % 7 // Monday = 0
    from = addDays(anchor, -dow)
    to = addDays(from, 6)
  } else if (kind === 'year') {
    from = `${anchor.slice(0, 4)}-01-01`
    to = `${anchor.slice(0, 4)}-12-31`
  } else if (kind === 'month') {
    from = `${anchor.slice(0, 7)}-01`
    const [y, m] = from.split('-').map(Number)
    to = new Date(Date.UTC(y, m, 0, 12)).toISOString().slice(0, 10) // last day of the month
  }
  const days: string[] = []
  for (let d = from; d <= to; d = addDays(d, 1)) days.push(d)
  return { kind, from, to, since: startOfWarehouseDay(from), until: startOfWarehouseDay(addDays(to, 1)), days }
}

/** The period before / after (`step` = -1 / +1). */
export function shiftPeriod(p: Period, step: number): Period {
  if (p.kind === 'day') return periodOf('day', addDays(p.from, step))
  if (p.kind === 'week') return periodOf('week', addDays(p.from, 7 * step))
  if (p.kind === 'year') return periodOf('year', `${Number(p.from.slice(0, 4)) + step}-01-01`)
  const [y, m] = p.from.split('-').map(Number)
  return periodOf('month', new Date(Date.UTC(y, m - 1 + step, 1, 12)).toISOString().slice(0, 10))
}

/** A day formatted for people (noon UTC, so the date never slips across a timezone). */
export function formatDay(ymd: string, locale: string, opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(locale, { timeZone: 'UTC', ...opts }).format(new Date(`${ymd}T12:00:00Z`))
}
