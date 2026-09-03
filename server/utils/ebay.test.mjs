/**
 * The eBay client, without an eBay key.
 *
 * Everything here runs against a mocked `fetch`, so it proves the contract now
 * and will still prove it the day the real credentials land. The cases are the
 * ones that would embarrass us on a shopper's screen:
 *
 *   · a peso price shown as dollars      (a Colombian row once read $116,617.86)
 *   · an auction bid shown as a price    (not a price anyone can pay)
 *   · an empty "Usado" heading            (worse than no heading)
 *   · anything at all before the keys exist
 *
 *   node --experimental-strip-types server/utils/ebay.test.mjs
 */
import { ebayConfigured, ebayToken, ebaySearch } from './ebay.ts'

let pass = 0
let fail = 0
const check = (name, cond, detail = '') => {
  if (cond) {
    console.log(`  ✓ ${name}`)
    pass++
  } else {
    console.log(`  ✗ ${name}  ${detail}`)
    fail++
  }
}

const realFetch = globalThis.fetch
const withFetch = async (impl, fn) => {
  globalThis.fetch = impl
  try {
    return await fn()
  } finally {
    globalThis.fetch = realFetch
  }
}

const item = (over = {}) => ({
  title: 'New Balance 574 Core Grey',
  price: { value: '52.00', currency: 'USD' },
  image: { imageUrl: 'https://i.ebayimg.com/x.jpg' },
  itemWebUrl: 'https://www.ebay.com/itm/123',
  condition: 'Pre-owned',
  seller: { username: 'carlastuff' },
  ...over,
})

const okFetch = (items) => async (url) => {
  if (String(url).includes('/identity/v1/oauth2/token')) {
    return { ok: true, json: async () => ({ access_token: 'tok', expires_in: 7200 }) }
  }
  return { ok: true, json: async () => ({ itemSummaries: items }) }
}

// ── Before the keys arrive, this must be completely inert ──────────────────
delete process.env.EBAY_CLIENT_ID
delete process.env.EBAY_CLIENT_SECRET
check('unconfigured: reports not configured', ebayConfigured() === false)
check('unconfigured: no token', (await ebayToken()) === null)
check('unconfigured: search returns null, so the caller falls back', (await ebaySearch('x')) === null)

process.env.EBAY_CLIENT_ID = 'app-id'
process.env.EBAY_CLIENT_SECRET = 'cert-id'
check('configured once both keys are set', ebayConfigured() === true)

// ── Mapping ────────────────────────────────────────────────────────────────
await withFetch(okFetch([item()]), async () => {
  const [l] = await ebaySearch('New Balance 574')
  check('maps price', l.price === 52)
  check('names the SELLER, not just "eBay"', l.store === 'eBay - carlastuff', l.store)
  check('"Pre-owned" becomes used', l.condition === 'used', l.condition)
  check('keeps the real listing URL', l.url === 'https://www.ebay.com/itm/123')
  check('marked verified — it is eBay answering about its own listing', l.verified === true)
})

// ── The rules that keep nonsense off the screen ────────────────────────────
await withFetch(okFetch([item({ price: { value: '116617.86', currency: 'COP' } })]), async () => {
  const out = await ebaySearch('x')
  check('drops a non-USD price outright', out.length === 0, JSON.stringify(out))
})

await withFetch(okFetch([item({ price: { value: '0', currency: 'USD' } })]), async () => {
  check('drops a zero price', (await ebaySearch('x')).length === 0)
})

await withFetch(okFetch([item({ itemWebUrl: undefined })]), async () => {
  check('drops a listing with nowhere to send the shopper', (await ebaySearch('x')).length === 0)
})

// eBay's own itemWebUrl carries tracking params that serve an ERROR PAGE —
// reproduced live on /itm/227447664778. The canonical path is what works.
await withFetch(
  okFetch([item({ itemWebUrl: 'https://www.ebay.com/itm/227447664778?_skw=New+Balance&hash=item34f4eff08a:g:JwkA' })]),
  async () => {
    const [l] = await ebaySearch('New Balance')
    check('strips eBay\'s tracking query — with it the listing 404s', l.url === 'https://www.ebay.com/itm/227447664778', l.url)
  },
)

// Best match is generous: "New Balance 2010" returns a Numeric 306. Same brand,
// different shoe — the merely-similar comparison COMPASS §5 rules out.
await withFetch(
  okFetch([
    item({ title: 'New Balance 2010 Casual Black Shadow Grey' }),
    item({ title: 'New Balance Jamie Foy x Numeric 306 Skate Shoes' }),
  ]),
  async () => {
    const out = await ebaySearch('New Balance 2010')
    check('drops a different model that merely shares the brand', out.length === 1, JSON.stringify(out.map((l) => l.title)))
  },
)

// Electronics: every row eBay returned for an Apple Watch was a band or a
// repair part, priced like an 87% discount on a $429 watch.
await withFetch(
  okFetch([
    item({ title: 'Apple Watch Series 10 A3003 46mm GPS Jet Black Aluminum' }),
    item({ title: 'Repair Part - OEM Pull Housing for Apple Watch 10 GPS (46mm, A2999)' }),
    item({ title: 'For Apple Watch 11 10 Stainless Steel Mod Kit Case Band Strap Cover 46mm' }),
    item({ title: '46mm Stainless Steel Strap Case For Apple Watch Series 10 Band' }),
  ]),
  async () => {
    const out = await ebaySearch('Apple Watch Series 10 46mm')
    check('drops bands, cases and repair parts — they carry the model number too',
      out.length === 1 && /A3003/.test(out[0].title), JSON.stringify(out.map((l) => l.title)))
  },
)

await withFetch(
  okFetch([item({ title: 'OEM Genuine Nintendo Switch OLED Logic Board Motherboard HEG-CPU-01' })]),
  async () => {
    check('drops a motherboard sold as a console', (await ebaySearch('Nintendo Switch OLED')).length === 0)
  },
)

// Right brand, right family, wrong category — and a $280 gap.
await withFetch(
  okFetch([
    item({ title: 'Bose QuietComfort Ultra Over-Ear Headphones - Black' }),
    item({ title: 'Bose Ultra Open Bluetooth Ear Clip Purple New Sealed' }),
  ]),
  async () => {
    const out = await ebaySearch('Bose QuietComfort Ultra Headphones')
    check('earbuds are not over-ear headphones', out.length === 1 && /Over-Ear/.test(out[0].title),
      JSON.stringify(out.map((l) => l.title)))
  },
)

// The exception that keeps the guard honest.
await withFetch(okFetch([item({ title: 'Apple AirPods Pro Charging Case Replacement' })]), async () => {
  check('keeps an accessory when the accessory IS what was asked for',
    (await ebaySearch('AirPods Pro charging case')).length === 1)
})

// Nothing distinctive to match on — a loose section beats no section.
await withFetch(okFetch([item({ title: 'Cropped Timeless Tee Dune Grass' })]), async () => {
  check('keeps everything when the query has no model number', (await ebaySearch('Alo Cropped Timeless Tee')).length === 1)
})

// Cheapest first, decided by us — eBay is asked for RELEVANCE, not price order.
await withFetch(
  okFetch([
    item({ title: 'New Balance 574 A', price: { value: '80', currency: 'USD' } }),
    item({ title: 'New Balance 574 B', price: { value: '30', currency: 'USD' } }),
  ]),
  async () => {
    const out = await ebaySearch('New Balance 574')
    check('sorts cheapest first in code', out.map((l) => l.price).join(',') === '30,80', out.map((l) => l.price).join(','))
  },
)

await withFetch(okFetch([item({ condition: 'New' }), item({ condition: 'Refurbished' })]), async () => {
  const out = await ebaySearch('x')
  check('keeps eBay\'s own condition vocabulary', out[0].condition === 'new' && out[1].condition === 'refurbished')
})

// ── Failure must be silent and fall back, never half-render ────────────────
await withFetch(
  async (url) =>
    String(url).includes('/oauth2/token')
      ? { ok: true, json: async () => ({ access_token: 'tok', expires_in: 7200 }) }
      : { ok: false, status: 500, text: async () => 'boom' },
  async () => check('a failed search returns null, not an empty section', (await ebaySearch('x')) === null),
)

await withFetch(
  async () => ({ ok: false, status: 401, text: async () => 'invalid_scope' }),
  async () => {
    // Force a fresh token attempt rather than reusing the cached one.
    process.env.EBAY_CLIENT_SECRET = 'rotated'
    check('a rejected token returns null', (await ebayToken()) === null)
  },
)

console.log(fail ? `\n${fail} eBay case(s) FAILED` : '\nall eBay cases pass')
process.exit(fail ? 1 : 0)
