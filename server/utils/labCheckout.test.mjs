// Pure tests for server/utils/labCheckout.ts — the chat box → Boxly cart for the Lab finalize.
import { boxFromMessages, wantedFromBox, planCart, carriedStoreForTitle } from './labCheckout.ts'

let passed = 0, failed = 0
const check = (name, ok, detail = '') => { if (ok) { passed++; console.log(`  ✓ ${name}`) } else { failed++; console.log(`  ✗ ${name} ${detail}`) } }
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b)

const ship = (items, output = {}) => ({ role: 'assistant', parts: [{ type: 'tool-show_shipment', state: 'output-available', input: { items }, output }] })
const A = { saved_id: 'a', name: 'Gap Tee', size: 'M', color: 'Black' }
const B = { saved_id: 'b', name: 'YoungLA Joggers', quantity: 2 }
const W = { saved_id: 'w', name: 'Web Thing' }
const registry = [
  { id: 'a', title: 'Gap Tee', url: 'https://www.gap.com/p/1?vid=2', store: 'Gap', store_id: 'gap', price: 19.99, image: 'https://img/gap.jpg' },
  { id: 'b', title: 'YoungLA Joggers', url: 'http://www.youngla.com/p/j', store: 'YoungLA', store_id: 'youngla', price: 40 },
  { id: 'w', title: 'Web Thing', url: 'https://example.com/x', store: 'Example', store_id: null, price: 5 },
]

console.log('boxFromMessages')
check('no box → null', boxFromMessages([{ role: 'user', parts: [] }]) === null)
check('the newest card wins', eq(boxFromMessages([ship([A]), { role: 'user', parts: [] }, ship([A, B])]), [A, B]))
check('a held last item is not in the box', eq(boxFromMessages([ship([A, B], { hold: true })]), [A]))
check('a card still streaming is ignored', eq(boxFromMessages([ship([A]), { role: 'assistant', parts: [{ type: 'tool-show_shipment', state: 'input-available', input: { items: [B] } }] }]), [A]))

console.log('wantedFromBox')
const r = wantedFromBox([A, B, W], registry)
check('web rows are unsupported', eq(r.unsupported, ['Web Thing']))
check('two cart items', r.wanted.length === 2)
check('store + size/colour', r.wanted[0].store_id === 'gap' && eq(r.wanted[0].variants, { size: 'M', color: 'Black' }) && r.wanted[0].store_name === 'Gap')
check('http upgraded to https', r.wanted[1].product_url === 'https://www.youngla.com/p/j')
check('quantity kept', r.wanted[1].quantity === 2 && eq(r.wanted[1].variants, {}))
check('stale saved_id falls back to name', wantedFromBox([{ saved_id: 'gone', name: 'gap tee' }], registry).wanted[0]?.store_id === 'gap')

console.log('planCart')
const [gap, yla] = r.wanted
check('empty cart → add all', eq(planCart([], r.wanted).add.map((w) => w.store_id), ['gap', 'youngla']))
const tapped = { id: 7, product_url: gap.product_url, quantity: 1, variants: { size: 'm', color: 'black' } }
check('same item already tapped in → nothing', eq(planCart([tapped], [gap]), { add: [], update: [], remove: [] }))
check('quantity changed → patch quantity only', eq(planCart([{ ...tapped, quantity: 3 }], [gap]).update, [{ id: 7, body: { quantity: 1 } }]))
check('size changed in chat → patch variants', eq(planCart([{ ...tapped, variants: { size: 'L', color: 'Black' } }], [gap]).update, [{ id: 7, body: { variants: { size: 'M', color: 'Black' } } }]))
check('richer tapped variants kept', eq(planCart([{ ...tapped, variants: { 'talla': 'M', 'color': 'Black', 'fit': 'Tall' } }], [gap]).update, []))
check('removed from the box → removed from the cart', eq(planCart([tapped, { id: 9, product_url: 'https://www.gap.com/p/old', quantity: 1 }], [gap]).remove, [9]))
check('matches a cart url that differs only by query', planCart([{ id: 3, product_url: 'https://www.gap.com/p/1', quantity: 1, variants: { size: 'M', color: 'Black' } }], [gap]).add.length === 0)
check('same product twice (two sizes) → two lines', (() => { const p = planCart([tapped], [gap, { ...gap, variants: { size: 'L', color: 'Black' } }]); return p.add.length === 1 && p.update.length === 0 })())
check('youngla added', planCart([tapped], [gap, yla]).add[0]?.store_id === 'youngla')

check('a failed line of the item just picked is tried again', (() => { const p = planCart([{ ...tapped, sync_status: 'failed' }], [gap], { retryUrl: gap.product_url }); return eq(p.remove, [7]) && p.add.length === 1 })())
check('a failed line of another item is left alone', eq(planCart([{ ...tapped, sync_status: 'failed' }], [gap], { retryUrl: 'https://other' }), { add: [], update: [], remove: [] }))
check('an item already in the store cart is not re-run', eq(planCart([{ ...tapped, sync_status: 'in_store_cart' }], [gap], { retryUrl: gap.product_url }), { add: [], update: [], remove: [] }))

console.log('search to cart')
{
  const carried = [{ id: 'owala', name: 'Owala', host: 'owalalife.com' }, { id: 'coach', name: 'Coach', host: 'coach.com' }, { id: 'coach-outlet', name: 'Coach Outlet', host: 'coachoutlet.com' }]
  check('a title that starts with a carried store names it', carriedStoreForTitle('Owala FreeSip 24-oz. Stainless Steel', carried)?.id === 'owala')
  check('the longest store name wins', carriedStoreForTitle('Coach Outlet Tabby Bag', carried)?.id === 'coach-outlet')
  check('a store name mid-title claims nothing', carriedStoreForTitle('Water bottle like Owala FreeSip', carried) === null)
  check('a word that only begins like the name does not match', carriedStoreForTitle('Owalamania bottle', carried) === null)
  const reg = [{ id: 'x', title: 'Owala FreeSip 24-oz. Plaid and Simple', url: 'https://www.somewebshop.com/p/9', store: 'Some Web Shop', store_id: null, price: 34.99 }]
  const { wanted, unsupported } = wantedFromBox([{ saved_id: 'x', name: 'Owala FreeSip 24-oz. Plaid and Simple', size: '24oz' }], reg, carried)
  check('an outside seller\'s Owala becomes a find item at Owala', wanted.length === 1 && wanted[0].store_id === 'owala' && wanted[0].find === 'Owala FreeSip 24-oz. Plaid and Simple' && unsupported.length === 0, JSON.stringify(wanted))
  check('its link is the store\'s site, keyed by the search', /^https:\/\/owalalife\.com\/\?boxly_find=owala-freesip-24-oz-plaid/.test(wanted[0]?.product_url || ''), wanted[0]?.product_url)
  check('without the carried list it stays unsupported (old behaviour)', wantedFromBox([{ saved_id: 'x', name: 'Owala FreeSip 24-oz. Plaid and Simple' }], reg).unsupported.length === 1)
  // After the engine found it, the cart line carries the found page: the same product (saved_id) is kept, not re-added.
  const plan = planCart([{ id: 7, product_url: 'https://owalalife.com/products/freesip', quantity: 1, variants: { size: '24oz' }, saved_id: 'x', sync_status: 'in_store_cart' }], wanted)
  check('the found line is matched by saved_id, not removed and re-added', plan.add.length === 0 && plan.remove.length === 0, JSON.stringify(plan))
  // Live Lab: the box item had no saved_id and no url (a web row) — the found line is matched by store + title.
  const regNoId = [{ title: 'Owala FreeSip 24-oz. Plaid and Simple', url: 'https://www.somewebshop.com/p/9', store_id: null, price: 34.99 }]
  const w2 = wantedFromBox([{ name: 'Owala FreeSip 24-oz. Plaid and Simple', size: '24oz' }], regNoId, carried).wanted
  const plan2 = planCart([{ id: 14, product_url: 'https://owalalife.com/products/freesip?Color=Plaid', quantity: 1, variants: { size: '24oz' }, saved_id: null, title: 'Owala FreeSip 24-oz. Plaid and Simple', store_id: 'owala', sync_status: 'in_store_cart' }], w2)
  check('a found web-row line with no saved_id is matched by store + title', w2.length === 1 && plan2.add.length === 0 && plan2.remove.length === 0, JSON.stringify(plan2))
}

console.log(`\n${passed} passed, ${failed} failed`)
if (failed) process.exit(1)
