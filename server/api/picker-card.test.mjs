// The picker card is saved server-side by /api/product-variants (chat-picker-card, 2026-09-29), and a reloaded chat
// keeps it: the read handler runs with its Nuxt globals stubbed (no network).
import assert from 'node:assert/strict'
// Object.assign, not `globalThis.x =`: the type check reads this file, and a plain assignment would redeclare the globals.
const stub = (o) => Object.assign(globalThis, o)
stub({ defineEventHandler: (f) => f })
stub({ readBody: async (e) => e.body })
stub({ $fetch: async (url, opts) => { return { variants: [{ options: { Size: 'M' }, available: true }, { options: { Size: 'L' }, available: true }], axes: [{ name: 'Size', kind: 'size', values: ['M', 'L'] }], product: { title: 'T', url: opts.body.url } } } })
const posted = []
stub({ fetch: async (url, opts) => { posted.push({ url, opts }); return { ok: true, status: 200 } } })
process.env.API_URL = 'http://api.local'
const h = (await import('./product-variants.post.ts')).default
let r = await h({ body: { url: 'https://s.com/p?c=1', conversation_id: 7, token: 'tk', product: { url: 'https://s.com/p', title: 'Tee', store_id: 's', store_name: 'S', price: 20, was: 30, image: 'https://i/x.jpg' } } })
assert.equal(r.variants.length, 2)
assert.equal(posted.length, 1)
assert.equal(posted[0].url, 'http://api.local/conversations/7/messages')
assert.equal(posted[0].opts.headers.Authorization, 'Bearer tk')
const msg = JSON.parse(posted[0].opts.body).messages[0]
assert.equal(msg.role, 'assistant')
const part = msg.content.parts[0]
assert.equal(part.type, 'tool-product_picker'); assert.equal(part.state, 'output-available')
assert.equal(part.output.product.url, 'https://s.com/p'); assert.equal(part.output.read_url, 'https://s.com/p?c=1'); assert.equal(part.output.read.axes[0].name, 'Size'); assert.ok(part.output.read_at)
console.log('persisted with conversation_id ✓')
await h({ body: { url: 'https://s.com/p' } })
assert.equal(posted.length, 1); console.log('no conversation_id → not persisted ✓')
stub({ fetch: async () => { throw new Error('api down') } })
r = await h({ body: { url: 'https://s.com/p', conversation_id: 7, token: 'tk' } })
assert.equal(r.variants.length, 2); console.log('persist failure still returns the read ✓')
stub({ $fetch: async () => ({ busy: true, variants: [] }) })
stub({ fetch: async (url, opts) => { posted.push({ url, opts }); return { ok: true } } })
r = await h({ body: { url: 'https://s.com/p', conversation_id: 7, token: 'tk' } })
assert.equal(r.reason, 'busy'); assert.equal(posted.length, 1); console.log('failed read (busy) → not persisted ✓')
stub({ $fetch: async () => ({ variants: [{ options: { Size: 'M' }, available: true }], axes: [], colorways: [] }) })
r = await h({ body: { url: 'https://s.com/p2', skip_colorways: true, colorways: [{ name: 'A', url: 'https://s.com/p' }, { name: 'B', url: 'https://s.com/p2' }], conversation_id: 7, token: 'tk' } })
assert.equal(r.colorways.length, 2); assert.equal(JSON.parse(posted[1].opts.body).messages[0].content.parts[0].output.read.colorways.length, 2); console.log('colourway re-read keeps the colourway set ✓')
const { withLiveRows } = await import('../../utils/liveGallery.ts')
const kept = withLiveRows([part])
assert.deepEqual(kept[0], part); console.log('reload: the history mapping keeps the picker part as saved ✓')
