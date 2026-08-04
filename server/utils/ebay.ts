/**
 * eBay Browse API — real secondhand prices, from the source.
 *
 * Why this exists at all: our used listings come from Google Shopping's index
 * via SerpAPI, which is stale, occasionally another currency (a Colombian peso
 * price once landed as "$116,617.86"), and impossible to verify — every row
 * reads "precio de referencia" because we cannot stand behind it.
 *
 * eBay publishes the same data through an official API: live price, real
 * condition, the seller's own URL. No scraping, no bot wall, nothing to
 * re-check. That is how Phia shows confirmed used prices on a New Balance page
 * while we show none — they are not defeating the wall, they are not hitting it.
 *
 * ── Not enabled until the keys exist ────────────────────────────────────────
 *
 * Every function here returns null when EBAY_CLIENT_ID / EBAY_CLIENT_SECRET are
 * unset, and every caller falls back to the SerpAPI resale pass. Shipping this
 * before the credentials arrive must change nothing for a shopper.
 *
 * ── Credentials ────────────────────────────────────────────────────────────
 *
 *   EBAY_CLIENT_ID      the keyset's "App ID"
 *   EBAY_CLIENT_SECRET  the keyset's "Cert ID"   ← the secret
 *   EBAY_ENV            'production' (default) | 'sandbox'
 *
 * Server-side only. The extension never sees them; it only ever talks to
 * boxly.mx, exactly as it does for every other key we hold.
 */

const HOSTS = {
  production: 'https://api.ebay.com',
  sandbox: 'https://api.sandbox.ebay.com',
}

/** The scope an application token needs for Browse. */
const SCOPE = 'https://api.ebay.com/oauth/api_scope'

function host(): string {
  return process.env.EBAY_ENV === 'sandbox' ? HOSTS.sandbox : HOSTS.production
}

export function ebayConfigured(): boolean {
  return !!(process.env.EBAY_CLIENT_ID && process.env.EBAY_CLIENT_SECRET)
}

/**
 * Application access token (client credentials grant).
 *
 * Cached until shortly before it expires. eBay issues these for ~2 hours and
 * rate-limits the token endpoint, so minting one per panel would be both slow
 * and rude.
 */
let token: { value: string; until: number; keyed: string } | null = null

export async function ebayToken(): Promise<string | null> {
  if (!ebayConfigured()) return null

  // Bind the cache to the credentials that produced it. Rotating a key should
  // take effect on the next request, not whenever the old token happens to
  // expire — otherwise a revoked secret keeps working for up to two hours and
  // nobody can tell why.
  const keyed = `${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`
  if (token && token.keyed === keyed && Date.now() < token.until) return token.value

  const basic = Buffer.from(
    `${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`,
  ).toString('base64')

  try {
    const res = await fetch(`${host()}/identity/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basic}`,
      },
      body: `grant_type=client_credentials&scope=${encodeURIComponent(SCOPE)}`,
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) {
      // Name it. A scope or approval problem here is invisible otherwise, and
      // "no used listings" would look like a search miss rather than a config
      // error nobody can see.
      console.error('[ebay] token request failed', res.status, (await res.text()).slice(0, 200))
      return null
    }
    const data: any = await res.json()
    if (!data?.access_token) return null
    // 60s of headroom: a token that expires mid-request is a failed panel.
    token = {
      value: data.access_token,
      until: Date.now() + Math.max(0, (Number(data.expires_in) || 7200) - 60) * 1000,
      keyed,
    }
    return token.value
  } catch (e: any) {
    console.error('[ebay] token error', e?.message)
    return null
  }
}

/** eBay's condition vocabulary → ours. */
function condition(raw: any): string {
  const c = String(raw || '').toLowerCase()
  if (!c) return 'unknown'
  if (c.includes('new')) return 'new'
  if (c.includes('refurb')) return 'refurbished'
  // "Pre-owned", "Used", "For parts or not working"
  return 'used'
}

export type EbayListing = {
  title: string
  store: string
  price: number
  currency: string
  image: string | null
  url: string
  condition: string
  verified: boolean
  source: 'ebay'
}

/**
 * The model designations in a query — "574", "990v4", "XT-6".
 *
 * A token carrying a digit is what separates one shoe from another; the words
 * around it ("new", "balance", "shoes") are shared by the entire catalogue.
 */
function modelTokens(s: string): string[] {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(/\s+/)
    .filter((w) => /\d/.test(w) && w.length >= 2)
}

/**
 * Is this listing the SAME product, or just something the search engine liked?
 *
 * Best match is generous: "New Balance 2010" returns a "Jamie Foy x Numeric 306"
 * — same brand, different shoe, and it sorted to the top on price. Presenting
 * that as the used version of what the shopper is looking at is precisely the
 * merely-similar comparison COMPASS §5 rules out, and it would arrive wearing a
 * discount badge because eBay rows are `verified`.
 *
 * So: every model designation in the query must appear in the title. A word
 * overlap test (what the Best Buy client uses) is too weak here, because "new"
 * and "balance" alone already clear it.
 *
 * Queries with no model number at all — plain apparel — keep everything, since
 * there is nothing distinctive to match on and dropping the section entirely
 * would be worse than a loose one.
 */
function sameProduct(query: string, title: string): boolean {
  const want = modelTokens(query)
  if (!want.length) return true
  const got = new Set(modelTokens(title))
  return want.every((w) => got.has(w))
}

/**
 * The listing URL, minus eBay's own tracking query.
 *
 * `itemWebUrl` comes back carrying whatever eBay felt like attaching — `amdata`,
 * or `_skw` + `hash` echoing the search keywords — and **that query string
 * serves an error page**. Reproduced in a real browser on a live listing:
 *
 *   /itm/227447664778?_skw=…&hash=item34f4eff08a:g:…  → "Error Page | eBay"
 *   /itm/227447664778                                 → the listing
 *
 * The item was fine both times; only the parameters differed. Since every row
 * here exists to be clicked, a link that 404s to the shopper is worse than no
 * row at all — so we keep the canonical `/itm/<id>` and drop the rest. Nothing
 * of ours rides in that query (we have no eBay affiliate program), so there is
 * nothing to lose by stripping it.
 */
function cleanItemUrl(raw: any): string | null {
  const s = String(raw || '')
  if (!s) return null
  try {
    const u = new URL(s)
    return `${u.origin}${u.pathname}`
  } catch {
    // Not parseable — better to drop the row than to ship a link we can't read.
    return null
  }
}

/**
 * Search eBay for a product.
 *
 * Returns null when unconfigured or on any failure, so the caller can fall back
 * rather than show an empty section — an empty "Usado" heading is worse than no
 * heading at all.
 */
export async function ebaySearch(query: string, limit = 12): Promise<EbayListing[] | null> {
  const t = await ebayToken()
  if (!t || !query.trim()) return null

  /**
   * Ask for RELEVANCE, then sort by price ourselves.
   *
   * `sort=price` looks like the obvious choice for a "cheapest used" section and
   * is a trap: eBay returns the cheapest things MATCHING the words, which for
   * "New Balance 2010" is laces, insoles and single photos. Measured live — all
   * 12 rows came back under $18 against a $145 shoe, the caller's 8x sanity
   * filter deleted every one, and the Usado section rendered empty.
   *
   * Best match (the default, so no sort param) returns the shoe. We over-fetch
   * so there is still material after the caller drops the out-of-band prices,
   * and do the cheap-first ordering in code below, where it costs nothing.
   */
  const want = Math.min(50, Math.max(1, limit))
  const url =
    `${host()}/buy/browse/v1/item_summary/search` +
    `?q=${encodeURIComponent(query)}` +
    `&limit=${Math.min(50, want * 3)}` +
    // Fixed-price only: an auction's current bid is not a price the shopper can
    // pay, and showing it as one is the "false savings" §5 warns about.
    `&filter=${encodeURIComponent('buyingOptions:{FIXED_PRICE}')}`

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${t}`,
        // Without this eBay defaults to a marketplace we don't want and prices
        // arrive in the wrong currency.
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
      },
      signal: AbortSignal.timeout(12000),
    })
    if (!res.ok) {
      console.error('[ebay] search failed', res.status, (await res.text()).slice(0, 200))
      return null
    }
    const data: any = await res.json()
    const items: any[] = Array.isArray(data?.itemSummaries) ? data.itemSummaries : []

    return items
      .map((it): EbayListing | null => {
        const amount = Number(it?.price?.value)
        const currency = String(it?.price?.currency || '').toUpperCase()
        // USD only. The rule that already governs the page price now governs
        // these: a price we can't confirm is dollars is treated as no price.
        if (!Number.isFinite(amount) || amount <= 0 || currency !== 'USD') return null

        const image = it?.image?.imageUrl || it?.thumbnailImages?.[0]?.imageUrl || null
        const url = cleanItemUrl(it?.itemWebUrl)
        if (!url) return null

        return {
          title: String(it?.title || '').slice(0, 200),
          // The seller, not just "eBay" — "eBay · carlastuff" is what the
          // shopper is actually buying from, and tiering already treats
          // seller-suffixed names as marketplace.
          store: it?.seller?.username ? `eBay - ${it.seller.username}` : 'eBay',
          price: amount,
          currency,
          image,
          url,
          condition: condition(it?.condition),
          // TRUE, and this is the point of the whole exercise. `verified`
          // elsewhere means "we re-fetched the retailer's page and read the
          // price". This is stronger: it IS the retailer's own API answering
          // about its own listing. These rows can carry a discount badge.
          verified: true,
          source: 'ebay',
        }
      })
      .filter((x): x is EbayListing => x !== null)
      .filter((l) => sameProduct(query, l.title))
      // Cheapest first — the ordering the panel wants, applied after eBay has
      // already decided what is actually the product (see the note above).
      .sort((a, b) => a.price - b.price)
      .slice(0, want)
  } catch (e: any) {
    console.error('[ebay] search error', e?.message)
    return null
  }
}
