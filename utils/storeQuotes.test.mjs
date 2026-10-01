// Pure tests for utils/storeQuotes.ts — automatic checkout quotes per store (C5).
import { quoteInFlight, storeQuotesNeedPoll, formatCents, storeQuoteLabel, storeQuoteRows, currentQuote, storeStateLabel, nextStoreName, storeDoneMessage, summaryRows, summaryLineDetail, summaryTotal, lineUnavailable } from './storeQuotes.ts'

let passed = 0, failed = 0
const check = (name, ok, detail = '') => { if (ok) { passed++; console.log(`  ✓ ${name}`) } else { failed++; console.log(`  ✗ ${name} ${detail}`) } }
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const q = (over = {}) => ({ store_id: 'gap', store_name: 'Gap', status: 'verified', currency: 'USD', estimated: false, observed_at: null,
  merchandise_cents: 2900, discounts_cents: 0, shipping_cents: 0, tax_cents: 764, fees_cents: 0, total_cents: 3664, ...over })

check('in flight: pending and running only', quoteInFlight(q({ status: 'pending' })) && quoteInFlight(q({ status: 'running' })) && !quoteInFlight(q()) && !quoteInFlight(q({ status: 'failed' })))
check('poll while pending_review with a quote in flight', storeQuotesNeedPoll({ status: 'pending_review', store_quotes: [q(), q({ status: 'running' })] }))
check('no poll once every store settled', !storeQuotesNeedPoll({ status: 'pending_review', store_quotes: [q(), q({ status: 'failed' })] }))
check('no poll once quoted (invoice out)', !storeQuotesNeedPoll({ status: 'quoted', store_quotes: [q({ status: 'running' })] }))
check('no poll without quotes (manual flow)', !storeQuotesNeedPoll({ status: 'pending_review' }) && !storeQuotesNeedPoll(null))
check('cents → dollars', formatCents(3664) === '$36.64' && formatCents(107774) === '$1,077.74' && formatCents(null) === '')
check('labels in both languages', storeQuoteLabel(q({ status: 'running' })).startsWith('Calculando') && storeQuoteLabel(q({ status: 'failed' }), 'en').startsWith('Our team'))
const rows = storeQuoteRows(q())
check('rows skip zero discounts/fees; free shipping says so', eq(rows.map((r) => r.label), ['Productos', 'Envío a nuestra bodega', 'Impuestos']) && rows[1].value === 'Gratis')
check('estimated tax is labelled', storeQuoteRows(q({ estimated: true }))[2].label.includes('estimado'))
check('an undisclosed component is not shown', !storeQuoteRows(q({ tax_cents: null })).some((r) => r.label.startsWith('Impuestos')))
check('a discount shows as negative', storeQuoteRows(q({ discounts_cents: 500 })).some((r) => r.value === '-$5.00'))

// ---- sequential checkout ----
const gap = q({ shipping_cents: 599, tax_cents: 764 })
const nike = q({ store_id: 'nb', store_name: 'New Balance', status: 'pending', total_cents: null })
const old = q({ store_id: 'on', store_name: 'Old Navy', status: 'failed', total_cents: null, shipping_cents: null, tax_cents: null, error_code: 'out_of_stock' })
check('current store: running, else first pending', currentQuote([gap, q({ status: 'running' }), nike]).status === 'running' && currentQuote([gap, nike]).store_id === 'nb' && currentQuote([gap, old]) === null)
check('state labels', storeStateLabel(q({ status: 'running' })) === 'En curso' && storeStateLabel(nike) === 'En espera' && storeStateLabel(gap) === 'Listo' && storeStateLabel(old) === 'No cotizada')
check('next store is the following one in flight', nextStoreName([gap, nike], gap) === 'New Balance' && nextStoreName([nike, gap], gap) === 'New Balance' && nextStoreName([gap, old], gap) === null)
check('done message with next', storeDoneMessage(gap, 'New Balance') === '¡Listo con Gap! ✅ Total en la tienda $36.64 (envío $5.99, impuestos $7.64). Sigo con New Balance 👇')
check('done message omits null parts', storeDoneMessage(q({ shipping_cents: null }), 'X') === '¡Listo con Gap! ✅ Total en la tienda $36.64 (impuestos $7.64). Sigo con X 👇' && storeDoneMessage(q({ shipping_cents: null, tax_cents: null }), 'X') === '¡Listo con Gap! ✅ Total en la tienda $36.64. Sigo con X 👇')
check('dropped message with next', storeDoneMessage(old, 'Gap') === 'No pude cotizar Old Navy (sin existencias). Sigo con Gap 👇' && storeDoneMessage({ ...old, reason: 'el carrito no cargó' }, 'Gap') === 'No pude cotizar Old Navy (el carrito no cargó). Sigo con Gap 👇')
check('last store done', storeDoneMessage(gap, null) === '¡Listo con Gap! ✅ Total en la tienda $36.64 (envío $5.99, impuestos $7.64). ¡Listo! Ya tengo todos los totales ✅' && storeDoneMessage(old, null) === 'No pude cotizar Old Navy (sin existencias). ¡Listo! Ya tengo todos los totales ✅')
const sumStore = { store_id: 'gap', store_name: 'Gap', status: 'verified', included: true, reason: null, lines: [], merchandise_cents: 2900, discounts_cents: 0, shipping_cents: 0, tax_cents: 764, fees_cents: 0, total_cents: 3664 }
check('summary rows', eq(summaryRows(sumStore), [{ label: 'Subtotal', value: '$29.00' }, { label: 'Envío', value: 'Gratis' }, { label: 'Impuestos', value: '$7.64' }, { label: 'Total de la tienda', value: '$36.64', strong: true }]))
check('summary line detail', summaryLineDetail({ title: 'x', variants: { Talla: 'M', Color: 'Negro' }, quantity: 2, unit_price_cents: 2900 }) === 'M · Negro · 2 × $29.00' && summaryLineDetail({ title: 'x', variants: null, quantity: 1, unit_price_cents: null }) === '1')

const onQ = q({ store_id: 'on', store_name: 'On', status: 'verified' })
const gapP = q({ store_id: 'gap', store_name: 'Gap', status: 'pending', total_cents: null })
check('non-alphabetical order: on finishes, Gap is next, not the final line', nextStoreName([onQ, gapP], onQ) === 'Gap' && !storeDoneMessage(onQ, nextStoreName([onQ, gapP], onQ)).includes('todos los totales') && storeDoneMessage(onQ, 'Gap').includes('Sigo con Gap'))
check('never skips a pending store before the finished one', nextStoreName([gapP, onQ], onQ) === 'Gap')
check('skips terminal stores after; null only when all terminal', nextStoreName([onQ, gap, nike], onQ) === 'New Balance' && nextStoreName([onQ, gap], onQ) === null)
check('not-final line has no all-totals text', storeDoneMessage(gap, null, false) === '¡Listo con Gap! ✅ Total en la tienda $36.64 (envío $5.99, impuestos $7.64).' && !storeDoneMessage(gap, null).includes('👇'))
const sum = (o = {}) => ({ stores: [sumStore], stores_total_cents: 3664, commission_percent: 10, commission_cents: 366, total_cents: 4030, invoice_total_cents: null, invoiced: false, invoice_mode: 'auto', manual_reason: null, ...o })
check('summary: auto + invoice total → Total a pagar with Pagar', eq(summaryTotal(sum({ invoice_total_cents: 4100, invoiced: true })), { kind: 'pay', label: 'Total a pagar', cents: 4100, note: '', canPay: true }))
check('summary: auto not invoiced → preparing, no Pagar', (() => { const t = summaryTotal(sum()); return t.kind === 'preparing' && t.label === 'Total a pagar' && t.note === 'Preparando tu factura…' && !t.canPay })())
check('summary: manual → Total estimado, reason, no Pagar', (() => { const t = summaryTotal(sum({ invoice_mode: 'manual', manual_reason: 'Falta confirmar envío' })); return t.kind === 'estimated' && t.label === 'Total estimado' && t.note === 'Falta confirmar envío' && !t.canPay && t.cents === 4030 })())
check('summary: every store excluded but the team invoiced by hand → Pagar shows', (() => { const base = sum({ invoice_total_cents: 5200, invoiced: true }); const t = summaryTotal({ ...base, stores: base.stores.map((x) => ({ ...x, included: false })) }); return t.kind === 'pay' && t.canPay && t.cents === 5200 })())
check('summary: manual default reason', summaryTotal(sum({ invoice_mode: 'manual' })).note === 'Nuestro equipo te confirmará el total y te enviará la factura')
check('summary: manual but invoiced pays', summaryTotal(sum({ invoice_mode: 'manual', invoiced: true, invoice_total_cents: 4100 })).canPay)
check('summary: every store failed hides the total', summaryTotal(sum({ stores: [{ ...sumStore, included: false }], total_cents: 0 })).kind === 'hidden' && !summaryTotal(sum({ stores: [{ ...sumStore, included: false }], invoice_mode: 'manual' })).canPay)
check('unavailable lines', lineUnavailable({ state: 'unavailable' }) && !lineUnavailable({ state: 'ok' }) && !lineUnavailable({}))

console.log(`\n${passed} passed, ${failed} failed`)
if (failed) process.exit(1)
