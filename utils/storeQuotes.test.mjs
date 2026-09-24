// Pure tests for utils/storeQuotes.ts — automatic checkout quotes per store (C5).
import { quoteInFlight, storeQuotesNeedPoll, formatCents, storeQuoteLabel, storeQuoteRows } from './storeQuotes.ts'

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

console.log(`\n${passed} passed, ${failed} failed`)
if (failed) process.exit(1)
