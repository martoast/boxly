// Run: node --experimental-strip-types utils/inPersonSuccess.test.mjs
import { successView, viewCopy, loginUrl, showCancelledBanner, isReservationRef } from './inPersonSuccess.ts'

let bad = 0
const check = (label, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want)
  if (g !== w) { console.log(`FAIL ${label}: got ${g}, want ${w}`); bad++ }
}
const has = (label, text, ...parts) => { for (const p of parts) if (!text.includes(p)) { console.log(`FAIL ${label}: "${text}" lacks "${p}"`); bad++ } }
const hasNot = (label, text, ...parts) => { for (const p of parts) if (text.includes(p)) { console.log(`FAIL ${label}: "${text}" contains "${p}"`); bad++ } }
const V = (extra) => successView({ ref: 'RV-ABC123', fetched: true, ...extra })
const C = (v, lang = 'es', amt = 30) => viewCopy(v, lang, amt)

// refs
check('RV ref', isReservationRef('RV-ABC'), true)
check('PR ref is legacy', isReservationRef('PR-12345'), false)

// first render: fetch
check('RV before fetch', successView({ ref: 'RV-1' }), { kind: 'polling', reason: null, refundPending: false, fetch: true, poll: false, actions: [] })

// RV confirmed (webhook already in)
let v = V({ reservation: { status: 'confirmed' } })
check('confirmed', [v.kind, v.poll], ['confirmed', false])
has('confirmed es', C(v).title, 'Reservaste tu horario')
has('confirmed body', C(v).body, 'WhatsApp', '$30 USD')
check('completed also confirmed', V({ reservation: { status: 'completed' } }).kind, 'confirmed')

// pending_payment then confirmed on a later poll (late webhook)
v = V({ reservation: { status: 'pending_payment' }, tries: 0 })
check('pending polls', [v.kind, v.poll], ['polling', true])
has('pending copy', C(v).title, 'Confirmando')
check('late webhook arrives', V({ reservation: { status: 'confirmed' }, tries: 3 }).kind, 'confirmed')
v = V({ reservation: { status: 'pending_payment' }, tries: 10 })
check('pending forever -> delayed', [v.kind, v.poll], ['delayed', false])
has('delayed copy', C(v).body, 'No pagues de nuevo')
has('delayed copy en', C(v, 'en').body, 'do not pay again')

// slot_taken: refund done vs pending, reasons
v = V({ reservation: { status: 'slot_taken', slot_taken_reason: 'paid_first', refund_pending: false } })
check('taken paid_first', [v.kind, v.reason, v.refundPending], ['taken', 'paid_first', false])
has('paid_first es', C(v).title, 'Alguien reservó ese horario')
has('refund done es', C(v).body, 'fue reembolsado', '$30 USD')
hasNot('refund done no contact', C(v).body, 'te contactaremos')
has('paid_first en', C(v, 'en').title, 'Someone reserved')
v = V({ reservation: { status: 'slot_taken', slot_taken_reason: 'hour_unavailable', refund_pending: true } })
check('taken hour_unavailable pending', [v.kind, v.reason, v.refundPending], ['taken', 'hour_unavailable', true])
has('hour_unavailable es', C(v).title, 'ya no está disponible')
hasNot('hour_unavailable not paid-first wording', C(v).title + C(v).body, 'Alguien')
has('refund pending es', C(v).body, 'en proceso', 'te contactaremos')
has('refund pending en', C(v, 'en').body, 'being processed', 'contact you')
check('null reason defaults to paid_first', V({ reservation: { status: 'slot_taken', slot_taken_reason: null } }).reason, 'paid_first')
check('taken actions', v.actions, ['pick', 'whatsapp'])

// cancelled / expired
for (const s of ['cancelled', 'expired']) {
  v = V({ reservation: { status: s } })
  check(s, v.kind, 'inactive')
  has(s + ' copy', C(v).title, 'ya no está activa')
}
has('cancelled with pending refund', C(V({ reservation: { status: 'cancelled', refund_pending: true } })).body, 'reembolso', 'te contactaremos')

// Stripe cancel_url return: /in-person?cancelled=1 (and legacy /in-person/review?cancelled=1 redirect)
check('cancelled=1', showCancelledBanner('1'), true)
check('no query', showCancelledBanner(undefined), false)
check('cancelled=0', showCancelledBanner('0'), false)

// legacy refs: no reservation API call, "Payment received"
for (const ref of ['PR-2026-0042', 'TB-77', '12345']) {
  v = successView({ ref })
  check('legacy ' + ref, [v.kind, v.fetch, v.poll], ['legacy', false, false])
}
has('legacy es', C(v).title, 'Pago recibido')
has('legacy en', C(v, 'en').title, 'Payment received')
check('legacy links', v.actions, ['requests', 'whatsapp', 'home'])

// not logged in: API 401 -> login with return URL to the very same page
v = V({ errorStatus: 401 })
check('401 login', v.kind, 'login')
check('login url', loginUrl('/in-person/success?ref=RV-ABC123'), '/login?redirect=%2Fin-person%2Fsuccess%3Fref%3DRV-ABC123')

// unknown / foreign ref, missing ref, server errors
v = V({ errorStatus: 404 })
check('404', v.kind, 'notFound')
has('404 copy', C(v).title, 'No encontramos esta reserva')
check('404 whatsapp', v.actions.includes('whatsapp'), true)
check('403 foreign', V({ errorStatus: 403 }).kind, 'notFound')
check('no ref', successView({ ref: '' }).kind, 'notFound')
check('500', V({ errorStatus: 500 }).kind, 'error')
check('network', V({ errorStatus: 0 }).kind, 'error')
check('weird status', V({ reservation: { status: 'zzz' } }).kind, 'error')

console.log(bad ? `${bad} FAILED` : 'all in-person success checks passed')
process.exit(bad ? 1 : 0)
