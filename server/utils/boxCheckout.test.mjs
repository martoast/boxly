// Pure tests for server/utils/boxCheckout.ts — the chat box → the Boxly cart, for cart sync and Finalizar.
import { boxFromMessages, wantedFromBox, planCart, carriedStoreForTitle, storeOptionFixes, withStoreOptions } from './boxCheckout.ts'

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
  { id: 'w', title: 'Web Thing', url: 'https://www.amazon.com/dp/x', store: 'Amazon', store_id: null, price: 5 },
]

console.log('boxFromMessages')
check('no box → null', boxFromMessages([{ role: 'user', parts: [] }]) === null)
check('the newest card wins', eq(boxFromMessages([ship([A]), { role: 'user', parts: [] }, ship([A, B])]), [A, B]))
check('a held last item is not in the box', eq(boxFromMessages([ship([A, B], { hold: true })]), [A]))
check('a card still streaming is ignored', eq(boxFromMessages([ship([A]), { role: 'assistant', parts: [{ type: 'tool-show_shipment', state: 'input-available', input: { items: [B] } }] }]), [A]))
{
  // Live Gymshark 2026-09-28: the model said "negro" for a page that IS the black colourway (sizes only).
  const G = { saved_id: 'g', name: 'Everyday Seamless Leggings', size: 'S', color: 'negro' }
  const fixedBox = boxFromMessages([ship([G], { store_options: [{ key: 'g', size: 'S (4-6)', color: null }] }), { role: 'user', parts: [] }, ship([A, G])])
  check('the store\'s option values replace the model\'s words, from an earlier card', eq(fixedBox[1], { saved_id: 'g', name: 'Everyday Seamless Leggings', size: 'S (4-6)' }))
  check('other items untouched', eq(fixedBox[0], A))
}

{
  const fx = storeOptionFixes([], [{ key: 'g', size: 'S (4-6)', color: null }])
  const fw = storeOptionFixes([], [{ key: 'nb', size: '9 (9)', color: 'BLACK with WHITE', options: { width: 'Standard (D)' } }])
  const nbItem = withStoreOptions({ saved_id: 'nb', name: 'Fresh Foam X 860v15', size: '9' }, fw)
  check('a width picked on the chips rides on the box item', eq(nbItem.options, { width: 'Standard (D)' }))
  check('…and reaches the cart line', eq(wantedFromBox([nbItem], [{ id: 'nb', title: 'Fresh Foam X 860v15', url: 'https://www.newbalance.com/pd/x.html', store_id: 'new-balance', store: 'New Balance' }]).wanted[0].variants, { size: '9 (9)', color: 'BLACK with WHITE', width: 'Standard (D)' }))
  check('the card being built can fix its own item (cart sync uses it too)', eq(withStoreOptions({ saved_id: 'g', name: 'L', size: 'S', color: 'negro' }, fx), { saved_id: 'g', name: 'L', size: 'S (4-6)' }))
}

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
  const noList = wantedFromBox([{ saved_id: 'x', name: 'Owala FreeSip 24-oz. Plaid and Simple' }], reg).wanted[0]
  check('without the carried list it goes to the outside seller\'s own shop (any store)', noList?.store_id === 'somewebshop-com' && !noList?.find, JSON.stringify(noList))
  // After the engine found it, the cart line carries the found page: the same product (saved_id) is kept, not re-added.
  const plan = planCart([{ id: 7, product_url: 'https://owalalife.com/products/freesip', quantity: 1, variants: { size: '24oz' }, saved_id: 'x', sync_status: 'in_store_cart' }], wanted)
  check('the found line is matched by saved_id, not removed and re-added', plan.add.length === 0 && plan.remove.length === 0, JSON.stringify(plan))
  // Live Lab: the box item had no saved_id and no url (a web row) — the found line is matched by store + title.
  const regNoId = [{ title: 'Owala FreeSip 24-oz. Plaid and Simple', url: 'https://www.somewebshop.com/p/9', store_id: null, price: 34.99 }]
  const w2 = wantedFromBox([{ name: 'Owala FreeSip 24-oz. Plaid and Simple', size: '24oz' }], regNoId, carried).wanted
  const plan2 = planCart([{ id: 14, product_url: 'https://owalalife.com/products/freesip?Color=Plaid', quantity: 1, variants: { size: '24oz' }, saved_id: null, title: 'Owala FreeSip 24-oz. Plaid and Simple', store_id: 'owala', sync_status: 'in_store_cart' }], w2)
  check('a found web-row line with no saved_id is matched by store + title', w2.length === 1 && plan2.add.length === 0 && plan2.remove.length === 0, JSON.stringify(plan2))
}

console.log('any store')
{
  const reg = [
    { id: 'h', title: 'Hydro Flask 32 oz Wide Mouth', url: 'https://www.hydroflask.com/32-oz-wide-mouth?color=Black', store: null, store_id: null, price: 49.95 },
    { id: 'a', title: 'Some Amazon Thing', url: 'https://www.amazon.com/dp/B0X', store: 'Amazon', store_id: null, price: 9 },
    { id: 'g', title: 'A Google Shopping row', url: 'https://www.google.com/shopping/product/1', store: 'Google', store_id: null, price: 9 },
  ]
  const { wanted, unsupported } = wantedFromBox([{ saved_id: 'h', name: 'Hydro Flask 32 oz Wide Mouth', color: 'Black' }, { saved_id: 'a', name: 'Some Amazon Thing' }, { saved_id: 'g', name: 'A Google Shopping row' }], reg, [])
  check('a product on any shop goes to that shop (a web store)', wanted.length === 1 && wanted[0].store_id === 'hydroflask-com' && wanted[0].product_url.startsWith('https://www.hydroflask.com/32-oz-wide-mouth') && !wanted[0].find && wanted[0].store_name === 'hydroflask.com', JSON.stringify(wanted))
  check('marketplaces and Google result pages stay unsupported', eq(unsupported, ['Some Amazon Thing', 'A Google Shopping row']), JSON.stringify(unsupported))
  // A carried store's name at the start of the title still wins: its own site is searched.
  const r2 = wantedFromBox([{ saved_id: 'x', name: 'Owala FreeSip 24oz' }], [{ id: 'x', title: 'Owala FreeSip 24oz', url: 'https://www.somewebshop.com/p/9', store_id: null }], [{ id: 'owala', name: 'Owala', host: 'owalalife.com' }]).wanted[0]
  check('a carried brand still wins over the outside seller', r2?.store_id === 'owala' && !!r2?.find)
  // A pasted link on a carried store's own site is THAT store (not a made-up web store, not a marketplace refusal), even
  // when its title starts with a carried brand.
  const liveCarried = [{ id: 'dicks', name: "Dick's Sporting Goods", host: 'dickssportinggoods.com' }, { id: 'walmart', name: 'Walmart', host: 'walmart.com' }, { id: 'brooks', name: 'Brooks', host: 'brooksrunning.com' }]
  const d = wantedFromBox([{ name: "Brooks Men's Ghost 18 Running Shoes", url: 'https://www.dickssportinggoods.com/p/brooks-ghost-18/26bro', size: '7.5' }], [], liveCarried).wanted[0]
  check("a pasted Dick's link goes to the carried store dicks", d?.store_id === 'dicks' && d?.store_name === "Dick's Sporting Goods" && !d?.find && d?.product_url.includes('dickssportinggoods.com'), JSON.stringify(d))
  const wm = wantedFromBox([{ name: 'Cheerios 18 oz', url: 'https://www.walmart.com/ip/Cheerios/363183524' }], [], liveCarried)
  check('a pasted Walmart link is the carried store, not a marketplace refusal', wm.wanted[0]?.store_id === 'walmart' && !wm.unsupported.length, JSON.stringify(wm))
}

console.log('pinned style link (VS family page)')
{
  const vs = [{ id: 'vs', title: 'No-Show Cotton Cheeky Panty', url: 'https://www.victoriassecret.com/us/vs/panties-catalog/5000005331', store_id: 'victorias-secret', store: "Victoria's Secret" }]
  const pin = 'https://www.victoriassecret.com/us/vs/panties-catalog/5000005331?choice=54A2&genericId=11273598'
  check('the item\'s pinned link on the same page wins over the registry\'s family link', wantedFromBox([{ saved_id: 'vs', name: 'x', url: pin }], vs).wanted[0]?.product_url === pin)
  check('no item link → the registry link', wantedFromBox([{ saved_id: 'vs', name: 'x' }], vs).wanted[0]?.product_url === vs[0].url)
  check('a link to ANOTHER page never replaces the registry product', wantedFromBox([{ saved_id: 'vs', name: 'x', url: 'https://www.victoriassecret.com/us/vs/bras/1111?genericId=2' }], vs).wanted[0]?.product_url === vs[0].url)
  const line = { id: 9, product_url: pin, quantity: 1, variants: { size: 'S', color: 'Black' }, saved_id: null, title: 'No-Show Cotton Cheeky Panty', store_id: 'victorias-secret' }
  const later = planCart([line], wantedFromBox([{ saved_id: 'vs', name: 'x', size: 'S', color: 'Black' }], vs).wanted)
  check('a later card without the pin keeps the pinned line (no remove + re-add)', !later.add.length && !later.remove.length, JSON.stringify(later))
}

console.log('a line the store is taking')
{
  const line = { id: 7, product_url: 'https://www.gap.com/p/1?vid=2', quantity: 1, variants: { size: 'M', color: 'Black' }, sync_status: 'syncing', saved_id: 'a', title: 'Gap Tee', store_id: 'gap' }
  const p = planCart([line], wantedFromBox([{ ...A, quantity: 2, size: 'L' }], registry).wanted)
  check('mid-add: no update, no remove, no add', !p.update.length && !p.remove.length && !p.add.length, JSON.stringify(p))
  const done = planCart([{ ...line, sync_status: 'in_store_cart' }], wantedFromBox([{ ...A, quantity: 2, size: 'L' }], registry).wanted)
  check('after the add: the change goes through', done.update.length === 1, JSON.stringify(done))
}

// A clean slate after Finalizar (Alex 2026-10-03): box cards before a successful finalize_order are an order already placed.
{
  const fin = (ok) => ({ role: 'assistant', parts: [{ type: 'tool-finalize_order', state: 'output-available', input: {}, output: { ok } }] })
  check('after a finalize the box is empty', boxFromMessages([ship([A, B]), fin(true)]) === null)
  check('a box after the finalize is the new order only', eq(boxFromMessages([ship([A, B]), fin(true), ship([W])]).map((i) => i.saved_id), ['w']))
  check('a FAILED finalize keeps the box', eq(boxFromMessages([ship([A, B]), fin(false)]).map((i) => i.saved_id), ['a', 'b']))
  const sameMsg = { role: 'assistant', parts: [...ship([A]).parts, ...fin(true).parts] }
  check('box then finalize in one message → empty', boxFromMessages([sameMsg]) === null)
}

console.log(`\n${passed} passed, ${failed} failed`)
if (failed) process.exit(1)
