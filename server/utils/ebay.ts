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
 * Search eBay for a product.
 *
 * Returns null when unconfigured or on any failure, so the caller can fall back
 * rather than show an empty section — an empty "Usado" heading is worse than no
 * heading at all.
 */
export async function ebaySearch(query: string, limit = 12): Promise<EbayListing[] | null> {
  const t = await ebayToken()
  if (!t || !query.trim()) return null

  const url =
    `${host()}/buy/browse/v1/item_summary/search` +
    `?q=${encodeURIComponent(query)}` +
    `&limit=${Math.min(50, Math.max(1, limit))}` +
    // Fixed-price only: an auction's current bid is not a price the shopper can
    // pay, and showing it as one is the "false savings" §5 warns about.
    `&filter=${encodeURIComponent('buyingOptions:{FIXED_PRICE}')}` +
    `&sort=price`

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
        const url = it?.itemWebUrl
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
  } catch (e: any) {
    console.error('[ebay] search error', e?.message)
    return null
  }
}
