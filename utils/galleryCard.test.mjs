/**
 * The gallery card model, without Vue.
 *
 * Two producer families feed one carousel: legacy scalar shapes (show_products
 * enrichment, store feeds) and the engine's persisted ProductV1
 * (tool-live_results). A reloaded live result once rendered title-only —
 * current_price/list_price/availability were simply never read. These rows pin
 * both families, the precedence between them, and the money-safety rules.
 *
 *   node --experimental-strip-types utils/galleryCard.test.mjs
 */
import { galleryCardModel } from './galleryCard.ts'

let pass = 0
let fail = 0
const check = (name, cond, detail = '') => {
  if (cond) { pass++ } else { fail++; console.error(`FAIL ${name}${detail ? ` — ${detail}` : ''}`) }
}
const eq = (name, actual, expected) => check(name, JSON.stringify(actual) === JSON.stringify(expected), `got ${JSON.stringify(actual)}`)

// ── Legacy shapes stay byte-identical ───────────────────────────────────────
const legacy = galleryCardModel({ title: 'Hoodie', product_url: 'https://x.test/p', image: 'https://x.test/i.jpg', price: 25, store: 'YoungLA', reason: 'fits' })
eq('legacy scalar price', legacy.price, 25)
eq('legacy url precedence product_url', legacy.url, 'https://x.test/p')
eq('legacy note from reason', legacy.note, 'fits')
eq('legacy stock is null (never invented)', legacy.stock, null)
eq('legacy price_usd variant', galleryCardModel({ title: 't', price_usd: 9 }).price, 9)
const legacySale = galleryCardModel({ title: 't', price: 10, was: 20, on_sale: true })
eq('legacy on_sale flag respected', legacySale.onSale, true)
eq('legacy discount computed', legacySale.discount, 50)
eq('legacy was/price WITHOUT flag never grows a badge', galleryCardModel({ title: 't', price: 10, was: 20 }).onSale, false)
eq('legacy onSale camelCase variant', galleryCardModel({ title: 't', onSale: true }).onSale, true)
eq('images array filtered', galleryCardModel({ title: 't', images: ['https://a.test/1.jpg', 7, ''] }).images, ['https://a.test/1.jpg'])
eq('single image becomes images fallback', galleryCardModel({ title: 't', image: 'https://a.test/1.jpg' }).images, ['https://a.test/1.jpg'])
eq('name fallback for title', galleryCardModel({ name: 'Named' }).title, 'Named')
eq('missing url falls back to #', galleryCardModel({ title: 't' }).url, '#')
eq('source_url is last url fallback', galleryCardModel({ title: 't', source_url: 'https://s.test/p' }).url, 'https://s.test/p')

// ── ProductV1 mapping (the persisted tool-live_results shape) ───────────────
const v1 = galleryCardModel({
  store: 'New Balance', store_id: 'new-balance', title: 'FuelCell XC7 v5',
  url: 'https://www.newbalance.com/pd/fuelcell-xc7-v5/UXCS7V5-51876.html', image: null,
  current_price: { amount: 59.99, currency: 'USD' }, list_price: { amount: 74.99, currency: 'USD' },
  availability: 'in_stock', observed_at: '2026-09-01T01:31:58.787Z',
})
eq('v1 current_price maps to price', v1.price, 59.99)
eq('v1 list_price maps to was', v1.was, 74.99)
eq('v1 sale evidence derived from list>current', v1.onSale, true)
eq('v1 discount percent', v1.discount, 20)
eq('v1 proven in_stock maps to stock', v1.stock, 'in_stock')
eq('v1 url preserved', v1.url, 'https://www.newbalance.com/pd/fuelcell-xc7-v5/UXCS7V5-51876.html')
eq('v1 out_of_stock maps', galleryCardModel({ title: 't', availability: 'out_of_stock' }).stock, 'out_of_stock')
eq('v1 unknown availability stays silent', galleryCardModel({ title: 't', availability: 'unknown' }).stock, null)
eq('v1 equal prices are not a sale', galleryCardModel({ title: 't', current_price: { amount: 10, currency: 'USD' }, list_price: { amount: 10, currency: 'USD' } }).onSale, false)
eq('v1 null list_price: price only, no badge', galleryCardModel({ title: 't', current_price: { amount: 5, currency: 'USD' }, list_price: null }).was, null)

// ── Money safety: never mislabel, never NaN ─────────────────────────────────
eq('non-USD current_price never renders in the $-USD caption', galleryCardModel({ title: 't', current_price: { amount: 999, currency: 'MXN' } }).price, null)
eq('lenient currency casing accepted (read path mirrors Laravel money())', galleryCardModel({ title: 't', current_price: { amount: 5, currency: ' usd ' } }).price, 5)
eq('string amounts are never coerced', galleryCardModel({ title: 't', current_price: { amount: '12.50', currency: 'USD' } }).price, null)
eq('negative amounts rejected', galleryCardModel({ title: 't', current_price: { amount: -1, currency: 'USD' } }).price, null)
eq('non-finite amounts rejected', galleryCardModel({ title: 't', current_price: { amount: Infinity, currency: 'USD' } }).price, null)
eq('malformed money object rejected', galleryCardModel({ title: 't', current_price: 'cheap' }).price, null)
check('mixed non-USD sale pair yields no discount and no NaN', (() => {
  const m = galleryCardModel({ title: 't', current_price: { amount: 100, currency: 'MXN' }, list_price: { amount: 200, currency: 'MXN' } })
  return m.price === null && m.was === null && m.onSale === false && m.discount === null
})())

// ── Precedence: legacy scalars always beat ProductV1 objects ────────────────
const mixed = galleryCardModel({ title: 't', price: 11, current_price: { amount: 99, currency: 'USD' } })
eq('scalar price beats current_price', mixed.price, 11)
eq('mixed source derives no sale badge (legacy present)', galleryCardModel({ title: 't', price: 11, list_price: { amount: 99, currency: 'USD' } }).onSale, false)
eq('legacy on_sale false suppresses v1 derivation', galleryCardModel({ title: 't', on_sale: false, current_price: { amount: 5, currency: 'USD' }, list_price: { amount: 9, currency: 'USD' } }).onSale, false)

// ── Hostile/degenerate inputs ───────────────────────────────────────────────
eq('null input yields safe defaults', galleryCardModel(null).title, 'Producto')
eq('non-object input yields safe defaults', galleryCardModel('x').url, '#')

console.log(`${pass} passed, ${fail} failed`)
if (fail > 0) process.exit(1)
