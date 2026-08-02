import { createHash } from 'node:crypto'
import {
  ageBracket,
  applyFilters,
  broadenQuery,
  cacheOff,
  cacheTtl,
  buildCompare,
  buildFacets,
  curateListings,
  dedupeListings,
  findOffers,
  hasRenderableImage,
  interleave,
  isTrustedSeller,
  slug,
  rankByTrust,
  loadThumbnails,
  pickPrice,
  priceVerdict,
  productQuery,
  sellerTier,
  stripBytes,
  toListing,
  verifyPrices,
  usdRate,
  withSavings,
  type Filters,
} from '../../utils/shopperPanel'
import { boxEconomics, loadBoxPrices } from '../../utils/boxMath'
import { ebayConfigured, ebaySearch } from '../../utils/ebay'

/**
 * ONE endpoint that renders the whole Boxly Shopper side panel.
 *
 * The Chrome extension detects a product page, sends what it read off the page
 * (title, brand, price, image, url) and gets back everything the panel shows:
 * the price verdict, this store's coupons, the trusted cheaper alternatives, and
 * the facets for the filter sheet. One request = one panel.
 *
 * Body:  { url, title, brand?, price?, image?, store?, filters? }
 * Returns { product, verdict, coupons, listings, facets, cached }
 *
 * Public (the shopper isn't necessarily logged in — the panel must work the
 * moment the extension is installed) and best-effort throughout: search, vision
 * curation and coupons all degrade to "less panel", never to an error.
 */

const API_BASE = (process.env.API_URL || 'https://api.boxly.mx').replace(/\/$/, '')

/**
 * Call the Laravel API. The 14s cap matters: SerpAPI has a long tail (a Target
 * lookup measured 24s against New Balance's 6.5s) and the retail and resale
 * passes run together, so an uncapped laggard sets the whole panel's latency.
 * A timeout degrades to "fewer listings", never to an error — the other pass
 * still lands.
 */
async function api(path: string, body: any, timeoutMs = 14000) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (!res.ok) return null
    const data = await res.json().catch(() => null)
    return data?.data ?? data
  } catch {
    return null
  }
}

/** Pretty store name from a URL host: "www.newbalance.com" → "newbalance.com". */
function storeFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, '')
  } catch {
    return ''
  }
}

/** "newbalance.com" → "New Balance"-ish, good enough to search and to label. */
function storeLabel(host: string): string {
  const base = host.split('.')[0] || host
  return base.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Is this listing from the same retailer the shopper is already looking at?
 *
 * Brands nobody else stocks — ALDO, and most DTC labels — return only their own
 * listings, which then appeared under "otras tiendas". Still worth showing (a
 * cheaper variant at the same store is a real find) but it must be labelled for
 * what it is.
 */
function isSameStore(listingStore: any, pageStore: string, host: string): boolean {
  const a = slug(listingStore)
  const b = slug(pageStore)
  const h = slug(host.split('.')[0])
  if (!a) return false
  return (!!b && (a.startsWith(b) || b.startsWith(a))) || (!!h && (a.startsWith(h) || h.startsWith(a)))
}

/** Same product page, ignoring tracking noise — so we never list the page itself. */
function sameProduct(a: string, b: string): boolean {
  const norm = (u: string) => {
    try {
      const x = new URL(u)
      return (x.hostname.replace(/^www\./, '') + x.pathname).replace(/\/$/, '').toLowerCase()
    } catch {
      return ''
    }
  }
  const na = norm(a)
  return !!na && na === norm(b)
}

export default defineEventHandler(async (event) => {
  // The extension calls this from its service worker (host permissions, so CORS
  // isn't enforced), but allow direct browser calls too — a content script or a
  // future web surface shouldn't need a second endpoint.
  setResponseHeaders(event, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  })

  const body = await readBody(event)
  const url = String(body?.url || '').trim()
  const title = String(body?.title || '').trim()
  const brand = body?.brand ? String(body.brand).trim() : null
  let pagePrice = typeof body?.price === 'number' && body.price > 0 ? body.price : null
  const filters: Filters = body?.filters || {}

  /**
   * Two-stage panel: the answer first, the shopping second.
   *
   * A cold panel took 16 SECONDS, and a shopper who isn't technical reads that
   * as broken rather than as "verifying prices at the retailer". The insult is
   * that we already had the answer: the peso price is on the page they're
   * standing on, the US price is one extract call (~5s), and those two plus FX
   * ARE the §1 argument. The other 11 seconds buy a cross-store listings table
   * most shoppers never scroll to.
   *
   * `stage: 'hero'` returns the comparison and the box and stops. The extension
   * fires it first, paints, then asks for the full panel — the same endpoint,
   * so the second call reuses the extract the first one warmed.
   */
  const heroOnly = body?.stage === 'hero'

  // The shopper is on a localized storefront (aloyoga.com/es-mx/...): we have
  // the peso price off the page, and `url` is already the US equivalent.
  const localized = !!body?.localized
  const localAmount = typeof body?.local_price === 'number' && body.local_price > 0 ? body.local_price : null
  let localCurrency = body?.local_currency ? String(body.local_currency).toUpperCase() : null
  const candidates: any[] = Array.isArray(body?.price_candidates) ? body.price_candidates : []
  /**
   * Marketplaces and used stock are now shown BY DEFAULT — in their own section.
   *
   * They used to be hidden behind a filter, because Boxly sells trust and a
   * cheap anonymous seller outranking Nordstrom on price alone is exactly the
   * recommendation that costs a customer their confidence.
   *
   * Alex's call (2026-08-01): separating them solves that without hiding them.
   * New retail is still the headline and still ranked by trust; used lives
   * underneath, labelled, as a second opportunity rather than a competitor.
   * A shopper can still switch them off in the filter sheet.
   *
   * POSHMARK REMAINS EXCLUDED (COMPASS §5) — confirmed with Alex in the same
   * decision. It is handled in `sellerTier`, not here.
   *
   * Cost: this runs the second ("used") shopping pass on every cold panel
   * rather than only when asked. One extra SerpAPI call per product per cache
   * window — deliberate, and worth watching in the credit burn.
   */
  const includeMarketplace = (filters as any)?.marketplace !== false
  const includeUsed = (filters as any)?.used !== false

  // Which number on the page is the price? The extension makes a heuristic pick,
  // but store layouts defeat heuristics — a free-shipping banner outranked the
  // real price tag on Alo's MX storefront. Ask the model to choose among the
  // snippets the page actually contained; it can only pick, never invent, and a
  // failure leaves the heuristic answer in place.
  let localAmountResolved = localAmount
  if (localized && candidates.length) {
    const picked = await pickPrice(candidates, { title, localeCurrency: localCurrency })
    if (picked && picked.currency !== 'USD') {
      localAmountResolved = picked.amount
      localCurrency = picked.currency
    } else if (picked && picked.currency === 'USD' && !pagePrice) {
      pagePrice = picked.amount
    }
  }
  const wantCompare = localized && !!localAmountResolved && !!localCurrency

  if (!url || !title) {
    return { error: 'missing_product', product: null, verdict: null, coupons: [], listings: [], facets: null }
  }

  const host = storeFromUrl(url)
  // The store label is derived from the URL host, NEVER from the request body.
  // It feeds the trusted-seller allowlist, and a body-supplied value let a
  // caller nominate any seller as trusted — defeating the one guarantee the
  // listing quality rests on. body.store is display-only, so we simply drop it.
  const store = storeLabel(host)

  const product = {
    url,
    title,
    brand,
    price: pagePrice,
    image: body?.image || null,
    store,
    host,
  }

  // The expensive half (search + vision curation + coupons) is cached per product
  // for 15 minutes; filters are applied per request on top of the cached set, so
  // opening the filter sheet is instant and free.
  const storage = useStorage('cache')
  // EVERY input that shapes the cached value belongs in the key. Keying on the
  // URL alone let anyone POST a popular product URL with a crafted title and
  // have their result served to every real shopper on that page for 15 minutes
  // — a public, unauthenticated cache-poisoning primitive.
  const key =
    'shopperpanel:' +
    createHash('md5')
      .update([url, title, brand || '', store].map((s) => String(s).toLowerCase()).join(' '))
      .digest('hex')
  // SHOPPER_CACHE_TTL=0 disables the cache outright — set it locally so a code
  // change is visible on the very next open instead of 15 minutes later.
  let base = cacheOff() ? null : await storage.getItem<any>(key)
  const cached = !!base

  // The US price is a stable property of the product, so it lives in the cache.
  // The COMPARISON is not — it depends on the peso price of whichever localized
  // page the shopper happens to be on, and on today's FX — so it is computed per
  // request below. Caching it produced a stale entry with no comparison at all.
  let usPrice: number | null = base?.us_price ?? null

  // Localized page: the hero is the MX-vs-US comparison, which needs the US
  // price and nothing else — so don't pay for the shopping pass to get it.
  //
  // On a US page there is no comparison to make (they are already looking at a
  // US price), and the hero is the RANKED MARKET instead: the same shopping
  // pass, minus verification. That path falls through to the pipeline below
  // with toVerify = 0.
  if (heroOnly && wantCompare && !base) {
    const usDetail = wantCompare ? await api('/products/extract', { url }, 25000) : null
    const heroUs = typeof usDetail?.price === 'number' && usDetail.price > 0 ? usDetail.price : null
    const heroCompare = wantCompare
      ? buildCompare(localAmountResolved, localCurrency, heroUs, await usdRate(localCurrency!))
      : null
    const heroPrices = await loadBoxPrices(() =>
      fetch(`${API_BASE}/products`, { signal: AbortSignal.timeout(8000) })
        .then((r) => r.json())
        .then((d: any) => d?.data ?? d),
    )
    return {
      // `partial` tells the panel the listings are still coming, so it shows a
      // skeleton there instead of "we found nothing" — which would be a lie
      // that resolves itself, the worst kind.
      partial: true,
      product: { ...product, price: pagePrice ?? heroUs },
      compare: heroCompare,
      box: heroCompare
        ? boxEconomics(heroCompare.us_local, heroCompare.savings_local, title, heroPrices)
        : null,
      verdict: null,
      offers: [],
      listings: [],
      total: 0,
      facets: null,
      cached: false,
    }
  }

  if (!base) {
    const t0 = Date.now()
    const query = productQuery(title, brand)

    // TWO shopping passes. The plain query returns retail only — Google Shopping
    // simply does not surface eBay/resale for it — and the whole point of the
    // panel is the 30%-off secondhand option. Appending "used" is what pulls the
    // resale market in. Both are cached 30 min by the API, and the merged panel
    // is cached again here, so this is two SerpAPI calls per product per window.
    // Coupons ride along in the same wave so the panel costs the slowest leg,
    // not the sum of all three.
    // Asymmetric timeouts, because the two passes are not equally important.
    // Retail is the panel's backbone — the price verdict is built from it — so a
    // cold SerpAPI query gets room to finish (a first-ever Lululemon lookup took
    // 14s and returned 40 products the moment it was warm). Resale is upside; if
    // it lags it's dropped and the shopper still gets a full retail comparison.
    // They run together, so the cold worst case is the retail cap, not the sum.
    // On a localized page we also fetch the product from its US page. ScraperAPI
    // exits in the US (country_code=us), so this is the real dollar price the
    // same retailer charges — the other half of the comparison that is Boxly's
    // whole pitch. Runs in the same wave, so it costs no extra wall-clock.
    const [search, resale, offers, usDetail] = await Promise.all([
      api('/products/search', { query, limit: 40 }, 20000),
      // The "used" pass exists purely to surface marketplaces. Skipping it when
      // they're off saves a SerpAPI call on every product.
      includeMarketplace
        ? api('/products/search', { query: `${query} used`, limit: 40 }, 12000)
        : Promise.resolve(null),
      findOffers(store, host, api),
      wantCompare ? api('/products/extract', { url }, 25000) : Promise.resolve(null),
    ])

    usPrice = typeof usDetail?.price === 'number' && usDetail.price > 0 ? usDetail.price : null

    // CODE GUARANTEES, before the model ever sees a listing: a seller we trust
    // (the store the shopper is already on always counts), a real image, a price,
    // and not the very page they're looking at.
    const trusted = [store, host.split('.')[0]]
    // A kids/grade-school version of an adult product is cheaper for the wrong
    // reason — it would top the list wearing a fake "53% menos" badge.
    const pageAge = ageBracket(title)
    const prep = (arr: any[] | undefined) =>
      (arr || [])
        .filter((p) => isTrustedSeller(p?.store, trusted))
        .filter(hasRenderableImage)
        .filter((p) => typeof p?.price === 'number' && p.price > 0)
        .filter((p) => !p?.url || !sameProduct(p.url, url))
        .filter((p) => ageBracket(p?.title || '') === pageAge)
        .map(toListing)
        .filter((l) => includeMarketplace || l.tier !== 4)
        .filter((l) => includeUsed || l.condition === 'new')
        .map((l) => ({ ...l, same_store: isSameStore(l.store, store, host) }))

    // 20, not 28. Every extra candidate costs a thumbnail fetch AND a vision
    // image, and the panel shows far fewer than this anyway — the tail was
    // buying latency nobody sees.
    let shortlist = dedupeListings(
      interleave(prep(search?.products), prep(resale?.products)),
    ).slice(0, 20)

    // Thin result? Try once more without the colourway. An apparel title like
    // "Cropped Timeless Tee - Dune Grass" is specific enough to match almost
    // nothing on Google Shopping, and one lonely listing is a poor comparison.
    // Bounded: this fires only when the precise query nearly missed.
    if (shortlist.length < 4) {
      const broad = broadenQuery(query)
      if (broad) {
        const more = await api('/products/search', { query: broad, limit: 40 }, 12000)
        shortlist = dedupeListings([...shortlist, ...prep(more?.products)]).slice(0, 20)
      }
    }

    const tSearch = Date.now()

    // Fetch every thumbnail once: drops listings whose image is dead (a blank
    // tile is exactly the "cheap looking" failure we're trying to avoid) and
    // gives the vision pass bytes instead of URLs it would have to re-download.
    // Retail first. Only if trusted retail found nothing do marketplaces get a
    // look — a shopper with no legitimate option is better served by an eBay
    // listing than by an empty panel.
    let pool = shortlist
    if (!pool.length && !includeMarketplace) {
      const fallback = dedupeListings(
        (search?.products || []).filter((x: any) => sellerTier(x?.store) === 4).map(toListing),
      ).slice(0, 12)
      pool = fallback
    }

    const candidates = await loadThumbnails(pool)
    const tThumbs = Date.now()

    // ONE model pass: same product? right age bracket? good enough photo? best order?
    const curated = await curateListings({ title, brand, price: pagePrice }, candidates)
    const tVision = Date.now()

    // Bytes must never reach the cache or the wire.
    // Trust order, then condition, then price — not price alone.
    const ranked = rankByTrust(stripBytes(curated))

    // Confirm the cheapest few at the retailer itself. Google Shopping's index
    // is often stale — it advertised a DICK'S listing at $56.23 that was really
    // $109.99 — and a saving we can't stand behind is worse than none.
    //
    // But verify only what we could actually CLAIM. A listing priced at or above
    // the page can never earn a "% menos" badge (withSavings) and can never be
    // the hero (panel.js bestListing skips anything unverified), so confirming
    // it changes nothing on screen while costing a details→extract chain —
    // ~8s measured against prod. On a brand nobody undercuts that chain WAS the
    // tail of the panel: 3 lookups to prove there was no saving to show.
    //
    // byPrice is ascending, so the cheaper-than-page listings are exactly its
    // prefix — the count is therefore the limit, and verifyPrices still returns
    // every listing (the rest simply come back unverified, as they already did).
    //
    // With no page price at all we can't reason about claims, but bestListing()
    // still surfaces the cheapest verified listing, so verification is still
    // doing real work — keep checking the top 3.
    const basePrice = pagePrice ?? usPrice
    const byPrice = [...ranked].sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity))
    const claimable = basePrice
      ? byPrice.filter((l) => typeof l.price === 'number' && l.price < basePrice).length
      : byPrice.length
    // Two, not three: verification is the whole latency budget on a US page
    // (67s measured on a New Balance PDP, where the cheapest listings sit at
    // protected retailers that need ScraperAPI's slow ultra-premium pool).
    // In the hero stage we verify NOTHING — the ranked list ships first and the
    // confirmed prices arrive with the full request.
    const toVerify = heroOnly ? 0 : Math.min(2, claimable)
    const verified = await verifyPrices(byPrice, api, toVerify)
    const listings = rankByTrust(verified)
    const tVerify = Date.now()

    // Latency breakdown for the cold path — this endpoint has four very
    // different upstreams and "the panel is slow" is unactionable without it.
    // verify= names how many were checked out of how many were even eligible:
    // an optimization that quietly stops verifying looks exactly like a bug.
    console.log(
      `[shopper] cold panel ${host} search=${tSearch - t0}ms thumbs=${tThumbs - tSearch}ms(${candidates.length}/${shortlist.length}) vision=${tVision - tThumbs}ms verify=${tVerify - tVision}ms(${toVerify}/${claimable} cheaper than ${basePrice ?? '?'}) total=${tVerify - t0}ms`,
    )

    // The US price is the honest basis for the verdict on a localized page —
    // comparing a peso figure against a dollar market would be meaningless.
    base = { listings, offers, query, us_price: usPrice }
    // Only cache a panel worth reusing — a failed search should retry, not stick.
    if (!cacheOff() && (listings.length || offers.length)) {
      await storage.setItem(key, base, { ttl: cacheTtl() })
    }
  }

  // A panel cached before the shopper hit a localized page has no US price yet.
  // Fetch it now and fold it into the existing entry rather than rebuilding the
  // whole panel.
  if (wantCompare && usPrice === null) {
    const d = await api('/products/extract', { url }, 25000)
    usPrice = typeof d?.price === 'number' && d.price > 0 ? d.price : null
    if (usPrice !== null && base && !cacheOff()) {
      base.us_price = usPrice
      await storage.setItem(key, base, { ttl: cacheTtl() })
    }
  }

  // Still no US price? Use one we already verified at a US retailer.
  //
  // The US URL is derived by keeping the path verbatim (detect.js:
  // '//www.' + us(host) + pathname), which only resolves where the Mexican and
  // US sites share slugs. Alo and SKIMS do — product codes — which is exactly
  // why they pass the coverage sweep. A storefront with Spanish slugs cannot,
  // and today that means NO comparison at all: the shopper sees nothing on a
  // page where a real gap exists, which is the product failing at §1.
  //
  // Meanwhile a verified US price is often already in hand. On the Alo Trail
  // case a verified ALO listing at $295 sat in `listings` while `compare` came
  // back null.
  //
  // The evidence standard does not move: `verified` means we re-fetched that
  // listing's own page and read the price there, which is the same bar
  // testbed/hero.mjs holds the headline saving to. An indexed price is not
  // evidence — Google Shopping skews stale-LOW, so it would overstate the gap
  // in the direction that costs the shopper money at the till.
  let usFrom: 'page' | 'listing' = 'page'
  if (wantCompare && usPrice === null) {
    const verified = (base?.listings || [])
      .filter((l: any) => l.verified && typeof l.price === 'number' && l.price > 0)
      .sort((a: any, b: any) => a.price - b.price)[0]
    if (verified) {
      usPrice = verified.price
      usFrom = 'listing'
      console.info('[shopper] US price from a verified listing:', verified.store, usPrice)
    }
  }

  const compare = wantCompare
    ? buildCompare(localAmountResolved, localCurrency, usPrice, await usdRate(localCurrency!))
    : null
  // Where the US side came from, so the panel can be specific about what it
  // checked rather than implying it read the brand's own US page.
  if (compare) (compare as any).us_from = usFrom

  // What this ACTUALLY costs to land in México.
  //
  // Without this the panel quoted the US price alone and called it a saving. On
  // the real Alo case that read "30% menos" while the shopper would have paid
  // MX$2,418 against MX$1,590 at home — 52% MORE, because a lone item ships in
  // an XS at MX$1,300. Half a price is not a price.
  const boxPrices = await loadBoxPrices(() =>
    fetch(`${API_BASE}/products`, { signal: AbortSignal.timeout(8000) })
      .then((r) => r.json())
      .then((d: any) => d?.data ?? d),
  )
  const box = compare
    ? boxEconomics(compare.us_local, compare.savings_local, title, boxPrices)
    : null

  // On a localized storefront the page price is in pesos, so the US price we
  // fetched is what the verdict AND the "% menos" badges must be measured
  // against. This has to happen before withSavings() below, or every listing
  // would compare against nothing and show no saving at all.
  if (!pagePrice && usPrice) pagePrice = usPrice

  // Savings are stamped per REQUEST, against the price on the page right now —
  // the listing set is cached but the page price isn't part of the cache key.
  const all: any[] = withSavings(base.listings || [], pagePrice)


  // Verdict and facets describe the WHOLE market for this product, not the
  // filtered slice — otherwise filtering to "used only" would redefine what a
  // typical price is, which is exactly backwards. A retail product page is new,
  // so the verdict is judged against other new listings (see priceVerdict).
  const verdict = priceVerdict(pagePrice, all, 'new')
  const facets = buildFacets(all)
  /**
   * Rank, don't list (COMPASS §2).
   *
   * A real Alo panel came back with nine rows, seven of them badged
   * `precio de referencia` — our own label for "we could not confirm this
   * price". Those are not nine options; they are two options and seven
   * shrugs, and they were most of the 207 words on screen.
   *
   * Unverified rows still earn their place when we have nothing better (the
   * documented rule: they stay visible as a reference, with no discount badge).
   * They stop earning it the moment confirmed prices exist — so once there are
   * verified listings, keep at most two unconfirmed ones behind them.
   */
  /**
   * Drop prices that cannot be dollars.
   *
   * A real Owala panel listed "owalacolombiatiendas.com" at $116,617.86 — a
   * COLOMBIAN PESO price read as USD. It became the top row, and it poisoned
   * the market band into "$29.99 – $116,617.86", which makes the whole panel
   * look broken in one glance.
   *
   * COMPASS already says this for the page we are standing on: "a price we
   * can't confirm is USD is treated as no price at all". The same rule has to
   * apply to listings, and nobody had applied it.
   *
   * A ratio, not a fixed ceiling: the same product at 8x the page price is not
   * the same product, or not the same currency, and either way we must not show
   * it. Compared against the MEDIAN when there is no page price, so one bad row
   * cannot drag the threshold up to cover itself.
   */
  const priced = all.filter((l: any) => typeof l.price === 'number' && l.price > 0)
  const sorted = priced.map((l: any) => l.price).sort((a: number, b: number) => a - b)
  const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : null
  const anchor = pagePrice ?? median
  const sane = (l: any) =>
    !anchor || typeof l.price !== 'number' || (l.price <= anchor * 8 && l.price >= anchor / 8)
  const dropped = all.length - all.filter(sane).length
  if (dropped) console.warn(`[shopper] dropped ${dropped} listing(s) outside 8x of ${anchor} — likely another currency`)

  const filtered = applyFilters(all.filter(sane), filters)
  const confirmed = filtered.filter((l: any) => l.verified)
  const unconfirmed = filtered.filter((l: any) => !l.verified)
  const ranked_ = confirmed.length ? [...confirmed, ...unconfirmed.slice(0, 2)] : filtered

  /**
   * Two sections, not one ranked blob.
   *
   * New retail is the answer to "what does this cost"; used is a second, cheaper
   * opportunity for a shopper willing to take it. Mixing them means a $52 eBay
   * listing outranks Foot Locker on price alone, which COMPASS §"retail
   * arbitrage" says is technically correct and exactly the recommendation that
   * costs a customer their confidence.
   *
   * Separated, both are honest: the headline stays trustworthy and the cheap
   * option is still one glance away.
   */
  const isUsed = (l: any) => l.condition && l.condition !== 'new'
  const listings = ranked_.filter((l: any) => !isUsed(l)).slice(0, 40)
  let used = ranked_.filter(isUsed).slice(0, 12)

  /**
   * Prefer eBay's own API for the used section.
   *
   * The SerpAPI resale pass gives us an INDEX of eBay: stale, unverifiable, and
   * occasionally another currency. eBay's Browse API gives the live listing —
   * so those rows can finally carry a real discount badge instead of
   * "precio de referencia", which is the whole reason this section felt weak.
   *
   * Falls back silently to the indexed rows when the API is unconfigured or
   * fails. Shipping this before the credentials arrive changes nothing.
   */
  if (ebayConfigured()) {
    const direct = await ebaySearch(productQuery(title, brand), 12)
    if (direct && direct.length) {
      const anchorPrice = pagePrice ?? usPrice
      used = direct
        // The same sanity rule as everything else: 8x the page price is not the
        // same product, whatever the feed says.
        .filter((l) => !anchorPrice || (l.price <= anchorPrice * 8 && l.price >= anchorPrice / 8))
        .map((l) => ({
          ...l,
          tier: 4,
          same_store: false,
          percent_less:
            anchorPrice && l.price < anchorPrice
              ? Math.round(((anchorPrice - l.price) / anchorPrice) * 100)
              : null,
        }))
        .slice(0, 12)
      console.info(`[shopper] used section from eBay API: ${used.length} listings`)
    }
  }

  return {
    product: { ...product, price: pagePrice },
    verdict,
    compare,
    box,
    offers: base.offers || [],
    listings,
    used,
    // The US-page hero ships the ranked market with nothing verified yet; the
    // panel keeps its skeleton for the confirmations still on the way.
    partial: heroOnly || undefined,
    total: all.length,
    facets,
    cached,
  }
})
