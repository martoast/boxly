// Run: node --experimental-strip-types utils/inPersonSlots.test.mjs
import {
  addDays, mondayOf, weekDates, pacificNow, isPast, cellStates, cellKey, toggleCell, toggleDay,
  slotsPayload, hoursRange, hourOptions, nextMondays, formatTime, whatsappDigits, endTime, HOURS,
} from './inPersonSlots.ts'

let bad = 0
const check = (label, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want)
  if (g !== w) { console.log(`FAIL ${label}: got ${g}, want ${w}`); bad++ }
}

// dates
check('monday of a saturday', mondayOf('2026-10-03'), '2026-09-28')
check('monday of a monday', mondayOf('2026-09-28'), '2026-09-28')
check('monday of a sunday', mondayOf('2026-10-04'), '2026-09-28')
check('addDays over month', addDays('2026-09-30', 2), '2026-10-02')
check('week dates', weekDates('2026-09-28')[6], '2026-10-04')
check('next mondays', nextMondays('2026-09-28', 2), ['2026-10-05', '2026-10-12'])
check('hours 6..22', [HOURS[0], HOURS.at(-1)], [6, 22])

// Pacific now: 2026-10-01T06:30Z is 23:30 on Sep 30 in Tijuana (PDT, UTC-7)
check('pacific late evening', pacificNow(new Date('2026-10-01T06:30:00Z')), { date: '2026-09-30', hour: 23, minute: 30 })
check('pacific after midnight', pacificNow(new Date('2026-10-01T07:30:00Z')).date, '2026-10-01')
const now = new Date('2026-10-03T19:10:00Z') // 12:10 Pacific on Oct 3
check('earlier hour is past', isPast('2026-10-03', 11, now), true)
check('current hour is past', isPast('2026-10-03', 12, now), true)
check('later hour is not past', isPast('2026-10-03', 13, now), false)
check('yesterday is past', isPast('2026-10-02', 20, now), true)

// grid
const slots = [
  { date: '2026-10-05', start_time: '10:00:00', status: 'open', reservation: null },
  { date: '2026-10-05', start_time: '11:00', status: 'booked', reservation: { id: 1 } },
  { date: '2026-10-03', start_time: '09:00', status: 'open', reservation: null },
]
const dates = weekDates('2026-09-28')
const st = cellStates(slots, dates.concat(weekDates('2026-10-05')), now)
check('open', st[cellKey('2026-10-05', '10:00')], 'open')
check('booked', st[cellKey('2026-10-05', '11:00')], 'booked')
check('empty', st[cellKey('2026-10-05', '12:00')], 'empty')
check('past beats open', st[cellKey('2026-10-03', '09:00')], 'past')
check('cells per week', Object.keys(cellStates([], dates, now)).length, 7 * HOURS.length)

// toggle + payload
let ch = new Set()
ch = toggleCell(ch, st, cellKey('2026-10-05', '12:00'))
ch = toggleCell(ch, st, cellKey('2026-10-05', '10:00'))
ch = toggleCell(ch, st, cellKey('2026-10-05', '11:00')) // booked: ignored
ch = toggleCell(ch, st, cellKey('2026-10-03', '09:00')) // past: ignored
check('payload', slotsPayload(ch, st), { add: [{ date: '2026-10-05', start_time: '12:00' }], remove: [{ date: '2026-10-05', start_time: '10:00' }] })
ch = toggleCell(ch, st, cellKey('2026-10-05', '12:00'))
check('toggle twice cancels', slotsPayload(ch, st).add, [])

// day header: opens all editable, then closes all; booked hour untouched
let day = toggleDay(new Set(), st, '2026-10-06')
check('day opens every hour', slotsPayload(day, st).add.length, HOURS.length)
check('day again closes (back to nothing)', toggleDay(day, st, '2026-10-06').size, 0)
const d5 = toggleDay(new Set(), st, '2026-10-05')
check('monday 5: booked skipped, 10:00 already open', slotsPayload(d5, st).add.length, HOURS.length - 2)
check('range 10-12', slotsPayload(toggleDay(new Set(), st, '2026-10-06', [10, 12]), st).add.map((x) => x.start_time), ['10:00', '11:00', '12:00'])

// reservation helpers
check('hours range', hoursRange('11:00:00', 2), '2 h: 11:00–13:00')
check('end time', endTime('22:00', 1), '23:00')
check('options capped at 6', hourOptions(9), [1, 2, 3, 4, 5, 6])
check('options by consecutive', hourOptions(3), [1, 2, 3])
check('options missing', hourOptions(undefined), [1])
check('format es', formatTime('13:00', 'es'), '13:00')
check('format en', formatTime('13:00', 'en'), '1 PM')
check('format en noon', formatTime('12:00', 'en'), '12 PM')
check('whatsapp digits', whatsappDigits('+52 (664) 123-4567'), '526641234567')

console.log(bad ? `${bad} FAILED` : 'all in-person slot checks passed')
process.exit(bad ? 1 : 0)
