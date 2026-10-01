// Pure helpers for the in-person availability grid and the customer hour picker.
// All dates are 'YYYY-MM-DD' and all times 'HH:MM' in Pacific (America/Tijuana) local time,
// exactly as the API sends them: nothing here is ever converted to UTC.
export const TZ = 'America/Tijuana'
export const FIRST_HOUR = 6
export const LAST_HOUR = 22 // last bookable hour starts 22:00 and ends 23:00

export const hourLabel = (h: number) => String(h).padStart(2, '0') + ':00'
export const HOURS: number[] = Array.from({ length: LAST_HOUR - FIRST_HOUR + 1 }, (_, i) => FIRST_HOUR + i)

// The T12:00 trick: a date-only string never shifts a day by timezone.
export const parseDate = (d: string) => new Date(String(d).substring(0, 10) + 'T12:00')

export function addDays(date: string, n: number): string {
  const d = parseDate(date)
  d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function mondayOf(date: string): string {
  const dow = (parseDate(date).getDay() + 6) % 7 // Monday = 0
  return addDays(date, -dow)
}

export const weekDates = (monday: string): string[] => Array.from({ length: 7 }, (_, i) => addDays(monday, i))

// "Now" as Pacific local { date, hour }, whatever the browser's own timezone is.
export function pacificNow(now: Date = new Date()): { date: string; hour: number; minute: number } {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
      .formatToParts(now).map((x) => [x.type, x.value]),
  )
  return { date: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour), minute: Number(p.minute) }
}

// An hour is past once its start has passed (same-day later hours are still offered).
export function isPast(date: string, hour: number, now: Date = new Date()): boolean {
  const n = pacificNow(now)
  return date < n.date || (date === n.date && hour <= n.hour)
}

export const hourOf = (time: string) => Number(String(time).substring(0, 2))
export const cellKey = (date: string, time: string) => `${date}|${String(time).substring(0, 5)}`

export type CellState = 'empty' | 'open' | 'booked' | 'past'

// slots: the API's slot rows ({date,start_time,status,reservation}). Returns { key: state }.
export function cellStates(slots: any[], dates: string[], now: Date = new Date()): Record<string, CellState> {
  const byKey: Record<string, any> = {}
  for (const s of slots) byKey[cellKey(s.date, s.start_time)] = s
  const out: Record<string, CellState> = {}
  for (const date of dates) {
    for (const h of HOURS) {
      const k = cellKey(date, hourLabel(h))
      const s = byKey[k]
      out[k] = s?.status === 'booked' ? 'booked' : isPast(date, h, now) ? 'past' : s ? 'open' : 'empty'
    }
  }
  return out
}

// `changed` is the set of keys the manager toggled since the last save.
export function effectiveOpen(state: CellState, key: string, changed: Set<string>): boolean {
  return (state === 'open') !== changed.has(key)
}

export function toggleCell(changed: Set<string>, states: Record<string, CellState>, key: string): Set<string> {
  const s = states[key]
  if (s !== 'open' && s !== 'empty') return changed // booked and past cells cannot be toggled
  const next = new Set(changed)
  if (!next.delete(key)) next.add(key)
  return next
}

// Tap on a day header: if every editable hour of the day is open, close them all; otherwise open them all.
// `range` = [fromHour, toHour] inclusive, defaults to the whole day.
export function toggleDay(changed: Set<string>, states: Record<string, CellState>, date: string, range: [number, number] = [FIRST_HOUR, LAST_HOUR]): Set<string> {
  const keys = HOURS.filter((h) => h >= range[0] && h <= range[1]).map((h) => cellKey(date, hourLabel(h)))
    .filter((k) => states[k] === 'open' || states[k] === 'empty')
  if (!keys.length) return changed
  const target = !keys.every((k) => effectiveOpen(states[k], k, changed))
  const next = new Set(changed)
  for (const k of keys) if (effectiveOpen(states[k], k, changed) !== target) (next.has(k) ? next.delete(k) : next.add(k))
  return next
}

// Body of PUT /in-person/slots: toggled empty cells are added, toggled open cells removed.
export function slotsPayload(changed: Set<string>, states: Record<string, CellState>) {
  const add: { date: string; start_time: string }[] = []
  const remove: { date: string; start_time: string }[] = []
  for (const k of [...changed].sort()) {
    const [date, start_time] = k.split('|')
    if (states[k] === 'empty') add.push({ date, start_time })
    else if (states[k] === 'open') remove.push({ date, start_time })
  }
  return { add, remove }
}

export const endTime = (start: string, hours: number) => hourLabel(hourOf(start) + hours)

// '2 h: 11:00–13:00'
export function hoursRange(start: string, hours: number): string {
  return `${hours} h: ${String(start).substring(0, 5)}–${endTime(start, hours)}`
}

// Stepper options 1..min(cap, consecutive free hours of the chosen slot); `cap` = max_hours from the availability API.
export function hourOptions(maxConsecutive: number | null | undefined, cap: number | null | undefined): number[] {
  const max = Math.max(1, Math.min(Number(cap) || 1, Number(maxConsecutive) || 1))
  return Array.from({ length: max }, (_, i) => i + 1)
}

// Next N Mondays after `monday` (copy-week targets).
export const nextMondays = (monday: string, weeks: number): string[] => Array.from({ length: weeks }, (_, i) => addDays(monday, 7 * (i + 1)))

// 12h in English, 24h in Spanish: '13:00' -> '1 PM' / '13:00'
export function formatTime(t: string, lang: string): string {
  const h = hourOf(t); const m = String(t).substring(3, 5) || '00'
  if (lang === 'es') return `${String(h).padStart(2, '0')}:${m}`
  return `${h % 12 || 12}${m === '00' ? '' : ':' + m} ${h < 12 ? 'AM' : 'PM'}`
}

export const whatsappDigits = (phone: string | null | undefined) => String(phone ?? '').replace(/\D/g, '')

// hourly_rate_usd / max_hours as sent by GET /in-person/availability (beside `data`; also tolerated inside `meta`/`data`).
export function readLimits(res: any): { rate: number | null; maxHours: number } {
  const pick = (k: string) => res?.[k] ?? res?.meta?.[k] ?? (Array.isArray(res?.data) ? undefined : res?.data?.[k])
  const rate = Number(pick('hourly_rate_usd')); const max = Number(pick('max_hours'))
  return { rate: rate > 0 ? rate : null, maxHours: max >= 1 ? Math.floor(max) : 1 }
}

// Quick schedule (Alex 2026-10-01: the manager sets hours from a phone): every hour from `fromHour` up to `toHour`
// (end, exclusive — 10 to 18 opens 10:00…17:00) on the chosen weekdays (0 = Monday … 6 = Sunday), from `today` for
// `weeks` weeks. Past hours are skipped (the API refuses them). The body's `add` for PUT /in-person/slots.
export function quickScheduleHours(days: number[], fromHour: number, toHour: number, weeks: number, now: Date = new Date()): { date: string; start_time: string }[] {
  const today = pacificNow(now).date
  const out: { date: string; start_time: string }[] = []
  for (let i = 0; i < 7 * weeks; i++) {
    const date = addDays(today, i)
    if (!days.includes((parseDate(date).getDay() + 6) % 7)) continue
    for (const h of HOURS) if (h >= fromHour && h < toHour && !isPast(date, h, now)) out.push({ date, start_time: hourLabel(h) })
  }
  return out
}
