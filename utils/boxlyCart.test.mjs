// Pure tests for utils/boxlyCart.ts — the Boxly cart's client helpers.
import { cartNeedsSyncPoll,
  normalizeVariants, cartPayloadFromChatProduct, cartPayloadFromCandidate, normalizeCart, groupCartItems,
  withQuantity, withoutItem, syncStatusLabel, variantsText, emptyCart, formatUsd,
} from './boxlyCart.ts'

let passed = 0, failed = 0
const check = (name, ok, detail = '') => { if (ok) { passed++; console.log(`  ✓ ${name}`) } else { failed++; console.log(`  ✗ ${name} ${detail}`) } }
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b)

// variants
check('variants: keys lower-cased, values trimmed, empties dropped', eq(normalizeVariants({ Size: ' M ', Color: 'Black', Fit: '' , x: null }), { size: 'M', color: 'Black' }))
check('variants: at most 6 keys', Object.keys(normalizeVariants({ a: '1', b: '2', c: '3', d: '4', e: '5', f: '6', g: '7' })).length === 6)
check('variants: numbers become strings', eq(normalizeVariants({ size: 9 }), { size: '9' }))
check('variants: arrays / non-objects → {}', eq(normalizeVariants(['M']), {}) && eq(normalizeVariants('M'), {}) && eq(normalizeVariants(null), {}))
check('variants: a duplicate key after lower-casing keeps the first', eq(normalizeVariants({ Size: 'M', size: 'L' }), { size: 'M' }))

// chat product → payload
const chatRow = { id: 'pabc', title: 'Alo Airlift Legging', url: 'https://www.aloyoga.com/products/airlift', store: 'Alo', store_id: 'alo', price: 128, image: 'https://cdn.alo.com/a.jpg' }
{
  const p = cartPayloadFromChatProduct({ ...chatRow, pick: { text: 'Quiero…', variants: { size: 'S', Color: 'Black' } } }, { conversationId: 42 })
  check('chat: full payload', eq(p, { store_id: 'alo', product_url: 'https://www.aloyoga.com/products/airlift', title: 'Alo Airlift Legging', source: 'chat', quantity: 1, store_name: 'Alo', image_url: 'https://cdn.alo.com/a.jpg', price: 128, variants: { size: 'S', color: 'Black' }, saved_id: 'pabc', conversation_id: 42 }), JSON.stringify(p))
}
check('chat: web row with no store_id → null (stays chat-only)', cartPayloadFromChatProduct({ ...chatRow, store_id: null }) === null)
check('chat: invalid slug → null', cartPayloadFromChatProduct({ ...chatRow, store_id: 'Best Buy' }) === null)
check('chat: no link → null', cartPayloadFromChatProduct({ ...chatRow, url: '', product_url: null }) === null)
check('chat: product_url preferred over url', cartPayloadFromChatProduct({ ...chatRow, product_url: 'https://x.com/p' }).product_url === 'https://x.com/p')
check('chat: missing price omitted, not 0', !('price' in cartPayloadFromChatProduct({ ...chatRow, price: null })))
check('chat: "$1,299.00" string price parsed', cartPayloadFromChatProduct({ ...chatRow, price: '$1,299.00' }).price === 1299)
check('chat: data: image dropped', !('image_url' in cartPayloadFromChatProduct({ ...chatRow, image: 'data:image/png;base64,xx' })))
check('chat: no conversation → no conversation_id', !('conversation_id' in cartPayloadFromChatProduct(chatRow)))
check('chat: explicit saved_id wins over id', cartPayloadFromChatProduct({ ...chatRow, saved_id: 'pzz' }).saved_id === 'pzz')

// live candidate → payload
const cand = { store: 'Best Buy', store_id: 'best-buy', title: 'Sony WH-1000XM5', url: 'https://www.bestbuy.com/site/123.p', image: 'https://pisces.bbystatic.com/x.jpg', current_price: { amount: 329.99, currency: 'USD' }, list_price: null, availability: 'in_stock', observed_at: '2026-09-23T00:00:00Z' }
check('live: full payload', eq(cartPayloadFromCandidate(cand, 'best-buy'), { store_id: 'best-buy', product_url: 'https://www.bestbuy.com/site/123.p', title: 'Sony WH-1000XM5', source: 'live', quantity: 1, store_name: 'Best Buy', image_url: 'https://pisces.bbystatic.com/x.jpg', price: 329.99 }))
check('live: route slug wins over candidate slug', cartPayloadFromCandidate(cand, 'bestbuy').store_id === 'bestbuy')
check('live: bad route slug falls back to candidate slug', cartPayloadFromCandidate(cand, '').store_id === 'best-buy')
check('live: no price read → price omitted', !('price' in cartPayloadFromCandidate({ ...cand, current_price: null }, 'best-buy')))
check('live: no slug anywhere → null', cartPayloadFromCandidate({ ...cand, store_id: 'X Y' }, null) === null)

// normalize
check('empty GET /cart shape normalizes', eq(normalizeCart({ id: null, status: 'open', items: [], stores: [], item_count: 0, subtotal: 0 }).items, []) && normalizeCart({}).item_count === 0)
check('normalize: garbage → empty cart', eq(normalizeCart(null), emptyCart()) && eq(normalizeCart('x'), emptyCart()))
check('normalize: unwraps a {data: cart} envelope', normalizeCart({ data: { id: 3, items: [], item_count: 0 } }).id === 3)
const item = (id, store_id, price, quantity = 1, extra = {}) => ({ id, store_id, store_name: store_id.toUpperCase(), product_url: `https://s.com/${id}`, title: `T${id}`, image_url: null, price, currency: 'USD', quantity, variants: {}, source: 'chat', saved_id: null, sync_status: 'pending', sync_note: null, ...extra })
{
  const c = normalizeCart({ id: 1, status: 'open', items: [item(1, 'alo', '10.50', 2), item(2, 'nike', null, 1, { sync_status: undefined })], stores: [], item_count: 3, subtotal: 21 })
  check('normalize: string price → number, missing sync_status → pending', c.items[0].price === 10.5 && c.items[1].sync_status === 'pending')
  check('normalize: has_unpriced derived when absent', c.has_unpriced === true)
}

// grouping
{
  const cart = normalizeCart({ items: [item(1, 'nike', 50), item(2, 'alo', 20, 2), item(3, 'nike', null)], stores: [{ store_id: 'alo', store_name: 'Alo Yoga', item_count: 2, subtotal: 40 }, { store_id: 'nike', store_name: 'Nike', item_count: 2, subtotal: 50, has_unpriced: true }], item_count: 4, subtotal: 90 })
  const g = groupCartItems(cart)
  check('group: follows the API store order', eq(g.map((x) => x.store_id), ['alo', 'nike']))
  check('group: uses server store name + subtotal', g[0].store_name === 'Alo Yoga' && g[0].subtotal === 40 && g[1].subtotal === 50)
  check('group: items land under their store', eq(g[1].items.map((i) => i.id), [1, 3]) && g[1].item_count === 2)
  check('group: has_unpriced per store', g[1].has_unpriced === true && g[0].has_unpriced === false)
  const g2 = groupCartItems({ items: [item(1, 'nike', 50, 2), item(2, 'nike', 1.25)], stores: [] })
  check('group: computes totals without server stores', g2.length === 1 && g2[0].subtotal === 101.25 && g2[0].store_name === 'NIKE')
  check('group: a store row with no items is not shown', groupCartItems({ items: [], stores: [{ store_id: 'alo', store_name: 'Alo', item_count: 0, subtotal: 0 }] }).length === 0)
}

// optimistic edits
{
  const cart = normalizeCart({ items: [item(1, 'alo', 10, 1), item(2, 'nike', 5, 1)], stores: [{ store_id: 'alo', subtotal: 10 }], item_count: 2, subtotal: 15 })
  const q = withQuantity(cart, 1, 3)
  check('withQuantity: count + subtotal recomputed', q.item_count === 4 && q.subtotal === 35 && q.items[0].quantity === 3)
  check('withQuantity: never below 1', withQuantity(cart, 1, 0).items[0].quantity === 1)
  check('withQuantity: does not mutate the input', cart.items[0].quantity === 1)
  const r = withoutItem(cart, 2)
  check('withoutItem: line removed, totals recomputed', r.items.length === 1 && r.item_count === 1 && r.subtotal === 10)
}

// labels
check('sync: pending label', syncStatusLabel('pending').label === 'Pendiente de agregar en la tienda')
check('sync: every status has a Spanish label', ['pending', 'syncing', 'in_store_cart', 'unavailable', 'failed'].every((s) => syncStatusLabel(s).label && syncStatusLabel(s).tone))
check('sync: unknown → pending', syncStatusLabel('weird').label === syncStatusLabel('pending').label)
check('variantsText: known keys in Spanish', variantsText({ size: 'M', color: 'Negro', inseam: '28' }) === 'Talla M · Color Negro · Inseam 28')
check('formatUsd', formatUsd(1299.5) === '$1,299.50 USD' && formatUsd(null) === '')

console.log(`\n${passed} passed, ${failed} failed`)
if (failed) process.exit(1)

// C3 polling rule
{
  const ok = (cond, msg) => { if (!cond) throw new Error(msg) }
  ok(cartNeedsSyncPoll({ sync_enabled: true, items: [{ sync_status: 'pending' }] }) === true, 'pending polls')
  ok(cartNeedsSyncPoll({ sync_enabled: true, items: [{ sync_status: 'syncing' }, { sync_status: 'in_store_cart' }] }) === true, 'syncing polls')
  ok(cartNeedsSyncPoll({ sync_enabled: false, items: [{ sync_status: 'pending' }] }) === false, 'sync off never polls')
  ok(cartNeedsSyncPoll({ items: [{ sync_status: 'pending' }] }) === false, 'unknown flag never polls')
  ok(cartNeedsSyncPoll({ items: [{ sync_status: 'in_store_cart' }, { sync_status: 'unavailable' }, { sync_status: 'failed' }] }) === false, 'settled stops')
  ok(cartNeedsSyncPoll(null) === false && cartNeedsSyncPoll({ items: [] }) === false, 'empty stops')
  console.log('cart sync poll rule: ok')
}
