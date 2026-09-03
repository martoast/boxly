/**
 * Best Buy Products API — a real retail price, from the retailer.
 *
 * The first feed in the product, and the reason it is first: Best Buy publishes
 * an open API with a free key and no approval queue, so it proves the whole
 * pattern while DICK'S (Skimlinks) and eBay sit in review.
 *
 * Why this matters more than another data source: everything else we show on a
 * US page says "precio de referencia", because confirming a price means
 * scraping the retailer and DICK'S refuses us outright ("Could not reach the
 * product page", 57s). A feed price comes FROM the retailer — so it is verified
 * in the strongest sense available, it can carry a real discount badge, and it
 * costs no ScraperAPI credits and no waiting.
 *
 * ── Electronics only, deliberately ─────────────────────────────────────────
 *
 * Best Buy does not sell Alo leggings. Querying it for every product would
 * spend a request per panel to return noise, and noise that LOOKS like a
 * comparison is worse than nothing. `looksElectronic()` gates the call, and a
 * token overlap check throws away anything that comes back unrelated anyway.
 *
 * ── Not enabled until the key exists ───────────────────────────────────────
 *
 *   BESTBUY_API_KEY   from developer.bestbuy.com (free, instant)
 *
 * Unset → every function returns null and the panel behaves exactly as today.
 */

const HOST = 'https://api.bestbuy.com/v1'

export function bestBuyConfigured(): boolean {
  return !!process.env.BESTBUY_API_KEY
}

/**
 * Is this the kind of thing Best Buy sells?
 *
 * A routing decision, not extraction — this only chooses whether to spend a
 * request, and a wrong guess costs nothing but a miss. Kept deliberately broad
 * on the brand side (a brand name is the strongest signal) and narrow on
 * category words, so "Camiseta corta Timeless" never reaches it.
 */
const ELECTRONIC_BRANDS = [
  'apple', 'samsung', 'sony', 'bose', 'lg', 'dell', 'hp', 'lenovo', 'asus', 'acer',
  'microsoft', 'google', 'nintendo', 'playstation', 'xbox', 'jbl', 'sonos', 'anker',
  'logitech', 'razer', 'canon', 'nikon', 'gopro', 'dyson', 'ninja', 'keurig',
  'instant pot', 'roomba', 'irobot', 'garmin', 'fitbit', 'beats', 'sennheiser',
  'steelseries', 'corsair', 'seagate', 'western digital', 'sandisk', 'tp-link', 'roku',
]

const ELECTRONIC_WORDS = [
  'laptop', 'macbook', 'ipad', 'iphone', 'tablet', 'monitor', 'tv', 'television',
  'headphone', 'earbud', 'airpod', 'speaker', 'soundbar', 'console', 'controller',
  'camera', 'lens', 'drone', 'smartwatch', 'router', 'ssd', 'hard drive', 'keyboard',
  'mouse', 'printer', 'projector', 'vacuum', 'blender', 'air fryer', 'coffee maker',
  'microwave', 'refrigerator', 'washer', 'dryer', 'charger', 'power bank', 'gpu',
  'graphics card', 'processor', 'motherboard', 'audifonos', 'bocina', 'pantalla',
  'laptop', 'consola', 'camara', 'aspiradora', 'licuadora',
]

export function looksElectronic(title: string, brand?: string | null): boolean {
  const hay = `${brand || ''} ${title || ''}`.toLowerCase()
  if (!hay.trim()) return false
  if (ELECTRONIC_BRANDS.some((b) => hay.includes(b))) return true
  return ELECTRONIC_WORDS.some((w) => hay.includes(w))
}

export type BestBuyListing = {
  title: string
  store: string
  price: number
  currency: string
  image: string | null
  url: string
  condition: string
  verified: boolean
  source: 'bestbuy'
}

/** Words worth matching on — drops noise like "the", "with", sizes and colours. */
function tokens(s: string): string[] {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2)
}

/**
 * Search Best Buy for a product.
 *
 * Returns null when unconfigured, off-category, or on any failure — so the
 * caller falls back rather than rendering an empty or irrelevant section.
 */
export async function bestBuySearch(
  query: string,
  brand?: string | null,
  limit = 6,
): Promise<BestBuyListing[] | null> {
  if (!bestBuyConfigured() || !query.trim()) return null
  if (!looksElectronic(query, brand)) return null

  // Best Buy's search syntax: ((search=a&search=b)). Each term must appear.
  const terms = tokens(query).slice(0, 6)
  if (!terms.length) return null
  const search = terms.map((t) => `search=${encodeURIComponent(t)}`).join('&')

  const url =
    `${HOST}/products((${search}))` +
    `?format=json&pageSize=${Math.min(20, Math.max(1, limit))}` +
    `&show=name,salePrice,regularPrice,url,image,sku,onlineAvailability` +
    `&apiKey=${encodeURIComponent(process.env.BESTBUY_API_KEY || '')}`

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) {
      // Name it: a bad key or a rate limit is otherwise indistinguishable from
      // "this product isn't sold at Best Buy", and one of those is our fault.
      console.error('[bestbuy] search failed', res.status, (await res.text()).slice(0, 200))
      return null
    }
    const data: any = await res.json()
    const items: any[] = Array.isArray(data?.products) ? data.products : []
    const want = new Set(tokens(query))

    return items
      .map((p): BestBuyListing | null => {
        // salePrice, not regularPrice: what the shopper actually pays. Quoting
        // the pre-sale price is the bug that made a New Balance page read
        // $99.99 when it was selling for $74.99.
        const price = Number(p?.salePrice ?? p?.regularPrice)
        if (!Number.isFinite(price) || price <= 0) return null
        if (p?.onlineAvailability === false) return null
        if (!p?.url) return null

        // Best Buy's search is loose — it surfaces cases, bands and cables
        // alongside the thing itself. Two shared words is not enough: "Case for
        // Sony Headphones" shares "sony" and "headphones" with "Sony WH-1000XM5
        // Wireless Headphones" and is a $20 accessory, not a $328 product.
        //
        // A FRACTION of the query, so the distinctive tokens (the model number)
        // have to be there. COMPASS §5 forbids comparing against merely similar
        // products; an accessory is the cheapest possible version of that
        // mistake and would top the list wearing a fake discount.
        const got = new Set(tokens(p?.name))
        const overlap = [...want].filter((w) => got.has(w)).length
        if (overlap < Math.max(2, Math.ceil(want.size * 0.6))) return null

        return {
          title: String(p.name || '').slice(0, 200),
          store: 'Best Buy',
          price,
          // Best Buy's API is US-only and quotes USD. Stated rather than
          // assumed, because a currency we didn't check is how a Colombian
          // peso price once rendered as "$116,617.86".
          currency: 'USD',
          image: p?.image || null,
          url: String(p.url),
          condition: 'new',
          // The retailer answering about its own product. Stronger than our
          // scrape-and-reread definition of verified, so these rows may carry
          // a discount badge.
          verified: true,
          source: 'bestbuy',
        }
      })
      .filter((x): x is BestBuyListing => x !== null)
  } catch (e: any) {
    console.error('[bestbuy] search error', e?.message)
    return null
  }
}
