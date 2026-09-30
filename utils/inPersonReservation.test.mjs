// Run: node --experimental-strip-types utils/inPersonReservation.test.mjs
import { computeFinal, money, statusLabel, eventLabel, finalIsPaid, pendingTotal, formatPacific } from './inPersonReservation.ts'

let bad = 0
const check = (label, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want)
  if (g !== w) { console.log(`FAIL ${label}: got ${g}, want ${w}`); bad++ }
}

check('2h $250', computeFinal(2, 250), { hours: 2, spent: 250, hoursFee: 60, commission: 25, credit: 30, total: 55 })
check('decimals', computeFinal('1.5', '99.99').total, 45 + 10 - 30)
check('never negative', computeFinal(1, 0).total, 0)
check('empty', computeFinal('', '').total, 0)
check('money', money('55'), '$55.00')
check('money null', money(null), '$0.00')
check('status es', statusLabel('confirmed', 'es'), 'Confirmada')
check('status unknown', statusLabel('zzz', 'en'), 'zzz')
check('event en', eventLabel('final_invoice_sent', 'en'), 'Final invoice sent')
check('paid', [finalIsPaid({ status: 'paid' }), finalIsPaid({ status: 'settled' }), finalIsPaid({ status: 'sent' }), finalIsPaid(null)], [true, true, false, false])
check('pending total', [pendingTotal({ final: null }), pendingTotal({ final: { status: 'sent', total_usd: '55' } }), pendingTotal({ final: { status: 'paid', total_usd: 55 } })], [null, 55, null])
check('pacific', formatPacific('2026-09-29T17:30:00Z', 'en'), 'Sep 29, 10:30') // PDT = UTC-7

console.log(bad ? `${bad} failed` : 'inPersonReservation: all ok')
process.exit(bad ? 1 : 0)
