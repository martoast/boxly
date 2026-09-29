// BOXLY LAB — the live store gallery's pure helpers (utils/liveGallery.ts), 2026-09-28.
import assert from 'node:assert/strict'
import { resolveLiveStores, liveGalleryQuery, liveGalleryRows, withLiveRows, liveResultsAsText, newLiveResultMessages, storeKey, LIVE_RESULTS_PART } from './liveGallery.ts'

let pass = 0
const ok = (name, fn) => { fn(); console.log('  ✓ ' + name); pass++ }

const ENGINE = [
  { id: 'gymshark', name: 'Gymshark' }, { id: 'new-balance', name: 'New Balance' }, { id: 'on', name: 'On' },
  { id: 'nike', name: 'Nike' }, { id: 'bath-body-works', name: 'Bath & Body Works' }, { id: 'old-navy', name: 'Old Navy' },
]

ok('store names and ids match however they are spelled', () => {
  assert.equal(storeKey('New Balance'), storeKey('new-balance'))
  assert.equal(storeKey('Bath & Body Works'), storeKey('bath and body works'))
  const r = resolveLiveStores(['newbalance', 'ON', 'Bath and Body Works', 'nike.com'], ENGINE, 4)
  assert.deepEqual(r.stores.map((s) => s.id), ['new-balance', 'on', 'bath-body-works', 'nike'])
  assert.deepEqual(r.unknown, [])
})

ok('a store the engine cannot open is reported, never guessed', () => {
  const r = resolveLiveStores(['Gymshark', 'Lululemon', 'Amazon'], ENGINE, 4)
  assert.deepEqual(r.stores.map((s) => s.id), ['gymshark'])
  assert.deepEqual(r.unknown, ['Lululemon', 'Amazon'])
})

ok('distinct, in request order, capped at the engine\'s stores per session', () => {
  const r = resolveLiveStores(['Nike', 'nike', 'On', 'New Balance', 'Gymshark'], ENGINE, 2)
  assert.deepEqual(r.stores.map((s) => s.id), ['nike', 'on'])
  assert.equal(resolveLiveStores(['Nike', 'On'], ENGINE, 0).stores.length, 1, 'a missing cap means one store')
  assert.equal(resolveLiveStores(['Nike', 'On', 'Gymshark', 'Old Navy', 'New Balance'], ENGINE, 9).stores.length, 4, 'never more than four')
  assert.deepEqual(resolveLiveStores('Nike', ENGINE, 2), { stores: [], unknown: [] })
})

ok('the search-box query is one short clean line', () => {
  assert.equal(liveGalleryQuery('  running\nshoes \t '), 'running shoes')
  assert.equal(liveGalleryQuery('x'.repeat(300)).length, 120)
  assert.equal(liveGalleryQuery(null), '')
})

const v1 = (over = {}) => ({
  store: 'On', store_id: 'on', title: 'Cloudrunner 3', url: 'https://www.on.com/en-us/products/cr3', image: 'https://images.on.com/cr3.jpg',
  current_price: { amount: 160, currency: 'USD' }, list_price: { amount: 180, currency: 'USD' }, availability: 'unknown', observed_at: '2026-09-28T12:00:00Z', ...over,
})

ok('ProductV1 becomes the gallery row the registry, the picker and the Boxly cart read', () => {
  const [row] = liveGalleryRows([v1()])
  assert.deepEqual(row, { title: 'Cloudrunner 3', url: 'https://www.on.com/en-us/products/cr3', image: 'https://images.on.com/cr3.jpg', price: 160, was: 180, on_sale: true, store: 'On', store_id: 'on', availability: 'unknown', source: 'live' })
  assert.equal(liveGalleryRows([v1({ list_price: null })])[0].was, null)
  assert.equal(liveGalleryRows([v1({ list_price: { amount: 150, currency: 'USD' } })])[0].on_sale, false, 'a list price below the price is no discount')
  assert.equal(liveGalleryRows([v1({ current_price: { amount: 2999, currency: 'MXN' } })])[0].price, null, 'never a peso figure shown as dollars')
  assert.equal(liveGalleryRows([v1({ image: null })])[0].image, null)
  const legacy = { title: 'x', price: 10, url: 'https://a.example/p' }
  assert.equal(liveGalleryRows([legacy])[0], legacy, 'a row already in gallery shape passes through')
  assert.deepEqual(liveGalleryRows(null), [])
})

ok('a message\'s live-results parts are normalized in place; other parts untouched', () => {
  const text = { type: 'text', text: 'hola' }
  const parts = withLiveRows([text, { type: LIVE_RESULTS_PART, state: 'output-available', output: { products: [v1()] } }])
  assert.equal(parts[0], text)
  assert.equal(parts[1].output.products[0].price, 160)
  assert.equal(parts[1].state, 'output-available')
  assert.deepEqual(withLiveRows(undefined), [])
})

ok('for the model a live gallery is one line of text, never a tool call it did not make', () => {
  const msgs = [
    { role: 'user', parts: [{ type: 'text', text: 'tenis para correr' }] },
    { role: 'assistant', parts: [{ type: LIVE_RESULTS_PART, state: 'output-available', output: { products: [v1(), v1({ url: 'https://www.on.com/p/2', title: 'Cloudsurfer', list_price: null, current_price: null })] } }] },
    { role: 'assistant', parts: [{ type: LIVE_RESULTS_PART, state: 'output-available', output: { products: [] } }] },
  ]
  const out = liveResultsAsText(msgs)
  assert.equal(out[0], msgs[0])
  assert.equal(out[1].parts[0].type, 'text')
  assert.match(out[1].parts[0].text, /2 productos/)
  assert.match(out[1].parts[0].text, /Cloudrunner 3 \(On, \$160\)/)
  assert.match(out[1].parts[0].text, /Cloudsurfer \(On\)/)
  assert.match(out[2].parts[0].text, /no devolvió productos/)
  assert.ok(out.every((m) => m.parts.every((p) => p.type !== LIVE_RESULTS_PART)))
})

ok('only live-results messages the chat does not show yet are fetched in', () => {
  const server = [
    { id: 11, role: 'user', content: { parts: [{ type: 'text', text: 'x' }] } },
    { id: 12, role: 'assistant', content: { parts: [{ type: LIVE_RESULTS_PART, output: { products: [] } }] } },
    { id: 13, role: 'assistant', content: { parts: [{ type: LIVE_RESULTS_PART, output: { products: [v1()] } }] } },
    { id: 14, role: 'assistant', content: { parts: [{ type: 'text', text: 'y' }] } },
  ]
  assert.deepEqual(newLiveResultMessages(server, new Set(['12'])).map((m) => m.id), [13])
  assert.deepEqual(newLiveResultMessages(null, new Set()), [])
})

console.log(`\n${pass} checks passed`)
