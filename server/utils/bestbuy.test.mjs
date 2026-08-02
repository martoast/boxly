/**
 * The Best Buy client, without a Best Buy key.
 *
 * Mocked fetch throughout, so it proves the contract now and still will when
 * the key lands. Cases are the ones that would put something wrong on a
 * shopper's screen.
 *
 *   node --experimental-strip-types server/utils/bestbuy.test.mjs
 */
import { bestBuyConfigured, looksElectronic, bestBuySearch } from './bestbuy.ts'

let pass = 0, fail = 0
const check = (n, c, d = '') => { if (c) { console.log(`  ✓ ${n}`); pass++ } else { console.log(`  ✗ ${n}  ${d}`); fail++ } }
const realFetch = globalThis.fetch
const withFetch = async (impl, fn) => { globalThis.fetch = impl; try { return await fn() } finally { globalThis.fetch = realFetch } }
const ok = (products) => async () => ({ ok: true, json: async () => ({ products }) })

const p = (over = {}) => ({
  name: 'Sony WH-1000XM5 Wireless Headphones',
  salePrice: 328, regularPrice: 399.99,
  url: 'https://www.bestbuy.com/site/x/123.p', image: 'https://pisces.bbystatic.com/x.jpg',
  onlineAvailability: true, ...over,
})

// ── Routing: don't spend a request on things Best Buy doesn't sell ─────────
check('routes electronics in (brand)', looksElectronic('WH-1000XM5 Headphones', 'Sony'))
check('routes electronics in (category word)', looksElectronic('55" 4K TV'))
check('routes Spanish category words in', looksElectronic('Audifonos inalambricos'))
check('keeps apparel OUT', !looksElectronic('Camiseta corta Timeless en Dune Grass', 'Alo'))
check('keeps footwear OUT', !looksElectronic('574 Core', 'New Balance'))

// ── Inert without a key ────────────────────────────────────────────────────
delete process.env.BESTBUY_API_KEY
check('unconfigured: reports not configured', bestBuyConfigured() === false)
check('unconfigured: search returns null so the caller falls back',
  (await bestBuySearch('Sony WH-1000XM5 Headphones', 'Sony')) === null)

process.env.BESTBUY_API_KEY = 'key'
check('configured once the key is set', bestBuyConfigured() === true)

// Even configured, an off-category product must not reach the API at all.
let called = false
await withFetch(async () => { called = true; return ok([])() }, async () => {
  await bestBuySearch('Camiseta corta Timeless', 'Alo')
  check('off-category never calls the API', called === false)
})

// ── Mapping ────────────────────────────────────────────────────────────────
await withFetch(ok([p()]), async () => {
  const [l] = await bestBuySearch('Sony WH-1000XM5 Headphones', 'Sony')
  check('uses salePrice, not regularPrice', l.price === 328, String(l.price))
  check('store is Best Buy', l.store === 'Best Buy')
  check('verified — the retailer answered about its own product', l.verified === true)
  check('condition is new', l.condition === 'new')
})

// ── The rules that keep nonsense off the screen ────────────────────────────
await withFetch(ok([p({ onlineAvailability: false })]), async () =>
  check('drops what cannot be bought online', (await bestBuySearch('Sony WH-1000XM5 Headphones', 'Sony')).length === 0))

await withFetch(ok([p({ name: 'Case for Sony Headphones', salePrice: 19.99 })]), async () => {
  const out = await bestBuySearch('Sony WH-1000XM5 Wireless Headphones', 'Sony')
  check('drops an accessory that merely shares a word', out.length === 0, JSON.stringify(out.map(x => x.title)))
})

await withFetch(ok([p({ salePrice: 0, regularPrice: 0 })]), async () =>
  check('drops a zero price', (await bestBuySearch('Sony WH-1000XM5 Headphones', 'Sony')).length === 0))

await withFetch(ok([p({ url: undefined })]), async () =>
  check('drops a listing with nowhere to send the shopper', (await bestBuySearch('Sony WH-1000XM5 Headphones', 'Sony')).length === 0))

await withFetch(async () => ({ ok: false, status: 403, text: async () => 'bad key' }), async () =>
  check('a failed search returns null, not an empty section',
    (await bestBuySearch('Sony WH-1000XM5 Headphones', 'Sony')) === null))

console.log(fail ? `\n${fail} Best Buy case(s) FAILED` : '\nall Best Buy cases pass')
process.exit(fail ? 1 : 0)
