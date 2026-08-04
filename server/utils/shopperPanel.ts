import { generateObject } from 'ai'
import { z } from 'zod'
import { auxModel, providerOptions, hasModelKey } from './aiProvider'

/**
 * Brains for the Boxly Shopper side panel (the Chrome extension that rides along
 * while a customer shops a US store).
 *
 * Same philosophy as ./curate.ts — MODEL FOR JUDGMENT, CODE FOR GUARANTEES:
 *
 *   - Code guarantees the things that must be certain: only sellers we trust,
 *     only listings that actually carry an image and a price, never an empty
 *     panel, and the price band math.
 *   - One model pass (vision) does the judgment code can't: is this listing
 *     actually the SAME product, and does its photo look good enough to sit in a
 *     premium gallery? A blurry phone snapshot of used sneakers is exactly what
 *     the allowlist can't catch and what makes the panel look cheap.
 *
 * Everything here is best-effort. A failed model call, a dead SerpAPI, a store
 * with no coupons — none of it may ever break the panel. The shopper still gets
 * the price comparison, the Boxly address and the "Boxly lo compra" button.
 */

/**
 * How long a shopper-panel result is cached, in seconds.
 *
 * `SHOPPER_CACHE_TTL=0` turns caching OFF entirely, which is what you want while
 * developing: a cached panel keeps serving the old shape after a code change, so
 * you edit something and the panel stubbornly shows the previous result for the
 * same product. In production it saves two SerpAPI calls plus a vision pass per
 * product per window, so don't leave it at 0 there.
 */
export function cacheTtl(): number {
  const raw = process.env.SHOPPER_CACHE_TTL
  if (raw === undefined || raw === '') return 60 * 15
  const n = Number(raw)
  return isFinite(n) && n >= 0 ? n : 60 * 15
}

/** True when caching is disabled (SHOPPER_CACHE_TTL=0). */
export const cacheOff = () => cacheTtl() === 0

// ─── Retail arbitrage tiers ──────────────────────────────────────────────────
//
// Boxly is not a marketplace search engine. Its customers already shop premium
// US retailers and want to pay less WITHOUT giving up trust — so the job is the
// best legitimate retail price, not the lowest number on the internet.
//
// The feeling to produce: "I was about to pay full price, and Boxly found it
// cheaper at another trusted retailer."
//
// Matching is by PREFIX on the slugified store name, because SerpAPI returns
// marketplace listings as "eBay - gius3187" — the platform always comes first,
// so a prefix match is accurate where a substring match would trust a fringe
// store called "targetfitness".

/** Tier 1 — the brand's own store. Highest priority: authentic, best photos. */
const TIER1_BRAND = [
  'nike', 'newbalance', 'adidas', 'aloyoga', 'lululemon', 'arcteryx', 'patagonia',
  'apple', 'dyson', 'coach', 'michaelkors', 'puma', 'reebok', 'asics', 'brooks',
  'hoka', 'saucony', 'onrunning', 'salomon', 'merrell', 'timberland', 'ugg',
  'crocs', 'birkenstock', 'vans', 'converse', 'underarmour', 'gymshark',
  'fabletics', 'athleta', 'thenorthface', 'carhartt', 'levis', 'wrangler',
  'dickies', 'ralphlauren', 'poloralphlauren', 'tommyhilfiger', 'calvinklein',
  'guess', 'katespade', 'toryburch', 'lacoste', 'champion', 'fila', 'skechers',
  'clarks', 'drmartens', 'stevemadden', 'aldo', 'ninewest', 'stanley', 'yeti',
  'hydroflask', 'owala', 'owalalife', 'contigo', 'camelbak', 'nalgene', 'shark',
  'ninja', 'instantpot', 'kitchenaid', 'cuisinart', 'lecreuset', 'lego',
  'mattel', 'hasbro', 'funko', 'nintendo', 'playstation', 'xbox', 'razer',
  'logitech', 'corsair', 'steelseries', 'hyperx', 'garmin', 'fitbit', 'gopro',
  'dji', 'canon', 'nikon', 'fujifilm', 'oakley', 'rayban', 'mauijim', 'goodr',
  'knix', 'skims', 'savagex', 'spanx', 'thirdlove', 'rhode', 'glossier',
  'drunkelephant', 'theordinary', 'cerave', 'larocheposay', 'olaplex', 'ghd',
  'revlon', 'maybelline', 'loreal', 'nyx', 'dfyne', 'youngla', 'buffbunny',
  'oneractive', 'halara', 'victoriassecret', 'samsung', 'sony', 'bose', 'jbl',
  'anker', 'columbia', 'llbean', 'eddiebauer', 'alo', 'oxo', 'elf', 'on',
]

/** Tier 2 — authorized retailers. The core of the arbitrage engine. */
const TIER2_AUTHORIZED = [
  // Department stores and big box
  'nordstrom', 'saksfifthavenue', 'bloomingdales', 'macys', 'neimanmarcus',
  'dillards', 'belk', 'jcpenney', 'target', 'walmart', 'bestbuy', 'costco',
  'samsclub', 'kohls', 'dickssportinggoods', 'dicks', 'rei', 'academy',
  'scheels', 'zappos',
  // Sneaker chains — sale price + promo code + rewards is the usual play
  'jdsports', 'finishline', 'footlocker', 'kidsfootlocker', 'champssports',
  'hibbett', 'dtlr', 'snipes', 'shoepalace', 'citygear', 'journeys', 'zumiez',
  'famousfootwear', 'shoecarnival', 'dsw',
  // Boutiques — deepest markdowns on colourways that didn't sell through
  'feature', 'sneakerpolitics', 'extrabutter', 'concepts', 'cncpts', 'bodega',
  'packershoes', 'packer', 'lapstoneandhammer', 'lapstonehammer', 'oneness',
  'onenessboutique', 'notreshop', 'notre', 'socialstatus', 'socialstatuspgh',
  'amamaniere', 'undefeated', 'kith', 'saintalfred', 'wishatl', 'wishatlanta',
  'renarts', 'sneakerroom', 'commonwealth', 'commonwealthftgg', 'properlbc',
  'proper', 'xhibition', 'atmos', 'bait', 'jimmyjazz', 'shoegallery',
  // Fashion — Sambas, Gazelles, Salomon, On, Veja, designer
  'ssense', 'endclothing', 'end', 'hbx', 'farfetch', 'lncc', 'yoox', 'asos',
  'urbanoutfitters', 'pacsun', 'revolve', 'shopbop', 'mrporter', 'matchesfashion',
  'net-a-porter', 'netaporter', 'luisaviaroma', 'mytheresa',
  // Everything else authorized
  'sephora', 'ulta', 'bathandbodyworks', 'homedepot', 'lowes', 'wayfair', 'ikea',
  'williamssonoma', 'crateandbarrel', 'potterybarn', 'containerstore', 'staples',
  'officedepot', 'petco', 'petsmart', 'chewy', 'gamestop', 'barnesandnoble',
  'michaels', 'joann', 'hobbylobby', 'tractorsupply', 'anthropologie',
  'freepeople', 'abercrombie', 'americaneagle', 'aeropostale', 'hollister',
  'express', 'gap', 'oldnavy', 'bananarepublic', 'jcrew', 'madewell', 'uniqlo',
  'zara', 'mango', 'backcountry', 'moosejaw', 'evo', 'cabelas', 'basspro',
  'sportsmanswarehouse', 'landsend', 'newegg', 'bhphotovideo', 'adorama',
  'microcenter', 'crutchfield', 'aerie', 'torrid', 'lanebryant', 'qvc', 'hsn',
  'walgreens', 'cvs',
]

/** Tier 3 — outlet and clearance. Still legitimate retail channels. */
const TIER3_OUTLET = [
  'nordstromrack', 'joesnewbalanceoutlet', 'joesnewbalance', 'sixpm', '6pm',
  'shoppremiumoutlets', 'saksoff5th', 'saksoff', 'off5th',
  'macysbackstage', 'macyslastact', 'nikeclearance', 'nikefactory',
  'adidasoutlet', 'sierra', 'sierratradingpost', 'jcrewfactory', 'gapfactory',
  'tjmaxx', 'marshalls', 'homegoods', 'ross', 'burlington', 'overstock',
  'shein', 'boohoo', 'forever21', 'lastcall',
]

/**
 * Tier 4 — marketplaces. OFF by default.
 *
 * Anonymous sellers, no returns worth the name, and authenticity you can't
 * vouch for. Surfacing these alongside Nordstrom teaches the shopper that Boxly
 * is a bargain aggregator, which is the opposite of the position we want. They
 * appear only when the shopper opts in, or when retail found nothing at all.
 */
// NOTE: Poshmark is deliberately absent — Alex excluded that market explicitly.
// Don't add it back without asking; it has now been reintroduced by accident once.
const TIER4_MARKETPLACE = [
  'ebay', 'mercari', 'grailed', 'vestiairecollective', 'depop',
  'facebookmarketplace', 'offerup', 'whatnot', 'stockx', 'goat', 'thredup',
  'therealreal', 'kixify', 'flightclub', 'stadiumgoods', 'curtsy', 'kashew',
  'etsy', 'aliexpress', 'wish', 'temu', 'tiktokshop', 'tiktok',
]

/**
 * Store name → comparable key.
 *
 * Diacritics are FOLDED, not dropped: stripping non-ASCII turned
 * "A Ma Maniére" into "amamanire", which matched nothing. Any accented
 * retailer name would have failed the same way.
 */
export const slug = (s: any) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')

/** Under 4 chars must match exactly, or "on" trusts every "Online…" store. */
const MIN_PREFIX_LEN = 4

/**
 * How long a match this list gives, or 0.
 *
 * LONGEST match wins across tiers, not first-tier-wins. "nordstromrack" starts
 * with "nordstrom", so checking tier 2 first classified Nordstrom Rack — an
 * outlet — as a full-price authorized retailer. Same for Macy's Backstage and
 * Nike Clearance. Those are exactly the channels where the margin is, so
 * getting their tier wrong matters.
 */
function matchLen(s: string, list: string[]): number {
  let best = 0
  for (const t of list) {
    const hit = t.length < MIN_PREFIX_LEN ? s === t : s.startsWith(t)
    if (hit && t.length > best) best = t.length
  }
  return best
}

/** 1-4, or null when we don't recognise the seller at all. */
export function sellerTier(store: any, extraTrusted: string[] = []): number | null {
  const s = slug(store)
  if (!s) return null
  // The store the shopper is already on counts as the brand itself.
  for (const t of extraTrusted) {
    const e = slug(t)
    if (e && e.length >= MIN_PREFIX_LEN && (s.startsWith(e) || e.startsWith(s))) return 1
  }
  // Amazon is authorized ONLY when Amazon itself (or the brand) is the seller.
  // SerpAPI renders third-party listings as "Amazon.com - SellerName", and those
  // carry the same counterfeit exposure as any marketplace.
  if (s.startsWith('amazon')) return s === 'amazon' || s === 'amazoncom' ? 2 : 4

  const scores: Array<[number, number]> = [
    [1, matchLen(s, TIER1_BRAND)],
    [2, matchLen(s, TIER2_AUTHORIZED)],
    [3, matchLen(s, TIER3_OUTLET)],
    [4, matchLen(s, TIER4_MARKETPLACE)],
  ]
  let tier: number | null = null
  let best = 0
  for (const [t, len] of scores) {
    if (len > best) {
      best = len
      tier = t
    }
  }
  return tier
}

export function isMarketplace(store: any): boolean {
  return sellerTier(store) === 4
}

/** Legacy name kept for callers: any recognised seller. */
export function isTrustedSeller(store: any, extraTrusted: string[] = []): boolean {
  return sellerTier(store, extraTrusted) !== null
}

/** True when the seller is an anonymous-seller resale platform (badge it). */
export function isResaleSeller(store: any): boolean {
  return isMarketplace(store)
}

// ─── Listing hygiene ─────────────────────────────────────────────────────────

/**
 * A listing may only appear if it can be rendered beautifully: a real http image
 * (base64 thumbnails from Google are low-res placeholders and look terrible on a
 * retina tile), a price to compare against, and a title.
 */
export function hasRenderableImage(p: any): boolean {
  const img = String(p?.image || '')
  return /^https?:\/\//i.test(img)
}

/** Smallest byte count we'll accept — below this it's a spacer or an error page. */
const MIN_IMAGE_BYTES = 1024

/**
 * We only ever want the small representative thumbnail — the one already in the
 * search result — never a full-size product photo. Real ones land at 5-20KB, so
 * 512KB is generous; anything past it is a store serving us a 4000px hero we'd
 * render into a 62px tile. Enforced against Content-Length BEFORE reading the
 * body, so an oversized image costs us headers, not megabytes.
 */
const MAX_IMAGE_BYTES = 512 * 1024

/**
 * Fetch every thumbnail ONCE and keep only the listings whose image really
 * loads, attaching the bytes for the vision pass.
 *
 * This solves two problems with one round of requests:
 *
 *   1. A URL that 404s renders as a blank grey tile in the panel. "Only high
 *      quality pictures" has to mean the picture actually exists, and no amount
 *      of URL-shape checking can tell you that.
 *   2. The AI SDK downloads image URLs itself, and a SINGLE failed download
 *      rejects the whole generateObject call — so one dead SerpAPI thumbnail was
 *      silently disabling curation for the entire product and letting every junk
 *      listing through. Handing the model bytes we already hold removes that
 *      failure mode completely.
 *
 * Bytes are attached under `_bytes` and MUST be stripped before caching or
 * returning (see stripBytes) — they're megabytes of noise in a JSON payload.
 */
export async function loadThumbnails(listings: any[]): Promise<any[]> {
  const out = await Promise.all(
    listings.map(async (l) => {
      try {
        const res = await fetch(l.image, { signal: AbortSignal.timeout(6000) })
        if (!res.ok) return null
        const type = res.headers.get('content-type') || ''
        if (!type.startsWith('image/')) return null
        // Bail on the header when the server tells us it's oversized, so we never
        // pull the body down just to throw it away.
        const declared = Number(res.headers.get('content-length') || 0)
        if (declared > MAX_IMAGE_BYTES) return null
        const buf = new Uint8Array(await res.arrayBuffer())
        if (buf.byteLength < MIN_IMAGE_BYTES || buf.byteLength > MAX_IMAGE_BYTES) return null
        return { ...l, _bytes: buf, _mime: type.split(';')[0] }
      } catch {
        return null
      }
    }),
  )
  return out.filter(Boolean) as any[]
}

/** Drop the image bytes before anything is cached or serialized to the client. */
export function stripBytes(listings: any[]): any[] {
  return listings.map(({ _bytes, _mime, ...rest }) => rest)
}

/** Normalize a raw search result into the panel's listing shape. */
export function toListing(p: any) {
  const price = typeof p?.price === 'number' ? p.price : null
  return {
    title: String(p?.title || '').trim(),
    price,
    was: p?.was ?? null,
    on_sale: !!p?.on_sale,
    store: p?.store || null,
    image: p?.image || null,
    url: p?.url || null,
    rating: p?.rating ?? null,
    reviews: p?.reviews ?? null,
    condition: normalizeCondition(p),
    resale: isResaleSeller(p?.store),
    tier: sellerTier(p?.store),
    /**
     * Is this the very store the shopper is already on?
     *
     * sameProduct() compares URLs, but Google Shopping hands us a google.com
     * link, so it never matched — and an ALDO listing showed up under "Mejor
     * precio en otras tiendas" while the shopper was standing on aldoshoes.com.
     * A cheaper listing at the same retailer is still useful; it just isn't
     * another store, and saying it is reads as misdirection.
     */
    same_store: false,
    // Google Shopping never returns a merchant URL — only its own product page
    // and this token. Carried through so a click can resolve the real store link
    // on demand (see /api/shopper/resolve); resolving all 20 up front would mean
    // 20 extra SerpAPI calls for listings nobody opens.
    token: p?.token || null,
  }
}

/**
 * Stamp "X% menos" onto listings, against the price on the page RIGHT NOW.
 *
 * Deliberately NOT part of toListing(): the listing set is cached for 15 minutes
 * and the page price is not part of the cache key, so a saving computed at cache
 * time would still be on screen after the store dropped the item into a sale —
 * telling the shopper they save 30% when they no longer do.
 *
 * A rounded 0% (from $159.99 vs $160) is dropped: it isn't a saving, it's noise.
 */
export function withSavings(listings: any[], pagePrice: number | null): any[] {
  return listings.map((l) => {
    const raw =
      pagePrice && typeof l.price === 'number' && l.price < pagePrice
        ? Math.round(((pagePrice - l.price) / pagePrice) * 100)
        : 0
    return { ...l, percent_less: raw >= 1 ? raw : null }
  })
}

/**
 * Condition: Google's own `second_hand_condition` when present, otherwise read it
 * off the title.
 *
 * The default depends on WHO is selling. A retailer listing with no marker is
 * new — that's what retailers sell. An anonymous resale listing with no marker
 * is genuinely UNKNOWN, and calling it "new" is a lie the shopper pays for: a
 * $45 eBay pair badged "Nuevo, 72% menos" next to a $160 retail page is exactly
 * the kind of thing that gets someone burned.
 */
export function normalizeCondition(p: any): 'new' | 'used' | 'refurbished' | 'unknown' {
  const raw = String(p?.condition || '').toLowerCase()
  if (raw.includes('refurb')) return 'refurbished'
  if (raw) return 'used'
  const t = String(p?.title || '').toLowerCase()
  if (/\bbrand new\b|\bnew with (box|tags?)\b|\bnwt\b|\bnib\b|\bdeadstock\b|\bds\b/.test(t)) return 'new'
  if (/\brefurb(ished)?\b|\brenewed\b/.test(t)) return 'refurbished'
  // "Pre Owned" / "pre-owned" / "preowned" all appear in the wild — the space
  // variant is the common one on eBay and was slipping through as "new".
  if (/\bused\b|\bpre[\s-]?owned\b|\bpre[\s-]?loved\b|\bsecond[\s-]?hand\b|\bworn\b|\bvtg\b|\bvintage\b|\bgently\b/.test(t)) {
    return 'used'
  }
  return isResaleSeller(p?.store) ? 'unknown' : 'new'
}

/**
 * Adult or kids? A grade-school / youth version of a sneaker is a genuinely
 * DIFFERENT, smaller product that happens to share a model name — and it's
 * always cheaper, so it lands at the top of a "cheaper alternatives" list
 * wearing a fake "53% menos" badge. That's a lie we can't ship.
 *
 * This is a code GUARANTEE, not a judgment call: the signals are unambiguous
 * keywords, and asking a cheap vision model to catch them proved unreliable.
 */
export function ageBracket(title: string): 'kids' | 'adult' {
  const t = ` ${String(title || '').toLowerCase()} `
  const kids =
    /\bkids?\b|\bgrade[\s-]?school\b|\bpre[\s-]?school\b|\btoddler\b|\binfant\b|\byouth\b|\bjunior\b|\bjuniors\b|\bboys?'?s?\b|\bgirls?'?s?\b|\bbig kid\b|\blittle kid\b|\bbaby\b|\(gs\)|\(ps\)|\(td\)|\bgs\b|\bsize \d{1,2}(\.5)?y\b|\b\d{1,2}(\.5)?y\b/
  return kids.test(t) ? 'kids' : 'adult'
}

/**
 * Drop repeats across the two search passes. Same URL is the same listing; when
 * a marketplace gives us no usable URL, fall back to title+store+price so a
 * duplicate row can't slip through.
 */
export function dedupeListings(listings: any[]): any[] {
  const seen = new Set<string>()
  const out: any[] = []
  for (const l of listings) {
    const key = l.url ? `u:${String(l.url).toLowerCase()}` : `t:${slug(l.title)}|${slug(l.store)}|${l.price}`
    if (seen.has(key)) continue

    // Also collapse same store + same price, whatever the URL says.
    //
    // Google Shopping hands us a distinct token per row, so keying on URL alone
    // let the SAME offer appear repeatedly: a real New Balance panel showed
    // Zappos twice and New Balance Reconsidered in pairs at 56, 80 and 90.
    // To a shopper those are not four options, they are two — and a list that
    // repeats itself reads as broken before it reads as thorough.
    const offer = `s:${slug(l.store)}|${l.price}|${l.condition || 'new'}`
    if (seen.has(offer)) continue

    seen.add(key)
    seen.add(offer)
    out.push(l)
  }
  return out
}

/**
 * Weave the retail pass and the resale pass together, 2 retail : 1 resale.
 *
 * Retail leads because that's the honest baseline for "is this price fair", but
 * resale has to be well represented in what the model sees — those are the
 * listings that actually save the shopper 30%, and sending the model 24 retail
 * rows would starve them out before curation ever ran.
 */
export function interleave(primary: any[], secondary: any[]): any[] {
  const out: any[] = []
  let i = 0
  let j = 0
  while (i < primary.length || j < secondary.length) {
    for (let k = 0; k < 2 && i < primary.length; k++) out.push(primary[i++])
    if (j < secondary.length) out.push(secondary[j++])
  }
  return out
}

/**
 * Order results the way a personal shopper would, not the way a price scraper
 * would: the brand's own store, then authorized retailers, then outlets, then
 * (only if allowed) marketplaces. New before used. Price decides between peers.
 *
 * Ranking purely by lowest dollar amount is what put an anonymous eBay seller
 * above Nordstrom — technically correct, and exactly the recommendation that
 * costs a customer their confidence in the purchase.
 */
export function rankByTrust(listings: any[]): any[] {
  const conditionRank = (c: string) => (c === 'new' ? 0 : c === 'unknown' ? 1 : 2)
  return [...listings].sort((a, b) => {
    // NEW outranks tier. "New Balance Reconsidered" is the brand's own
    // refurbished channel — tier 1 — and sorting by tier first put a used pair
    // above new stock at Nordstrom. Never lead with used.
    const ca = conditionRank(a.condition)
    const cb = conditionRank(b.condition)
    if (ca !== cb) return ca - cb
    const ta = a.tier ?? 9
    const tb = b.tier ?? 9
    if (ta !== tb) return ta - tb
    // A price we confirmed at the retailer outranks a cheaper one we couldn't.
    // Otherwise the most eye-catching row is the one we trust least — which is
    // precisely how a stale $56.23 ended up at the top of the list.
    const va = a.verified ? 0 : 1
    const vb = b.verified ? 0 : 1
    if (va !== vb) return va - vb
    return (a.price ?? Infinity) - (b.price ?? Infinity)
  })
}

/**
 * Confirm a listing's price at the retailer before we claim a saving on it.
 *
 * Google Shopping's index goes stale and its links sometimes land on a
 * different colourway. Measured on New Balance 530: SerpAPI reported DICK'S at
 * $56.23 with "48% OFF" while the live page was $109.99 — the panel advertised
 * a 49% saving that did not exist. That is the failure mode that costs a
 * customer's trust permanently, and no amount of ranking fixes it.
 *
 * Two upstream calls per listing (resolve the merchant URL, then read the live
 * price), so only the few listings actually making a claim are checked. A
 * listing we cannot verify keeps its place but loses the right to advertise a
 * discount.
 */
export async function verifyPrices(
  listings: any[],
  api: (path: string, body: any, timeoutMs?: number) => Promise<any>,
  limit = 3,
): Promise<any[]> {
  const targets = listings.slice(0, limit)

  const checked = await Promise.all(
    targets.map(async (l) => {
      if (!l.token) return { ...l, verified: false }
      try {
        const detail = await api('/products/details', { token: l.token, store: l.store }, 20000)
        const link = detail?.link
        if (!link) return { ...l, verified: false }

        // 35s, not 25s. The retailers worth verifying (Foot Locker, Nordstrom)
        // refuse the standard proxy pool, so the API retries them on ultra
        // premium — which answered Nordstrom in 23.9s where the cheap pool 403s
        // instantly. A 25s cap aborted the retry just before it succeeded.
        // Affordable now only because verification runs solely when there IS a
        // cheaper price to confirm; see panel.post.ts.
        const live = await api('/products/extract', { url: link }, 35000)
        const price = typeof live?.price === 'number' && live.price > 0 ? live.price : null
        // No price on the page — DICK'S and others hide it behind "See Price In
        // Cart". Unknown is not the same as confirmed.
        if (price === null) return { ...l, url: link, verified: false }

        return { ...l, url: link, price, verified: true, indexed_price: l.price }
      } catch {
        return { ...l, verified: false }
      }
    }),
  )

  return [...checked, ...listings.slice(limit).map((l) => ({ ...l, verified: false }))]
}

// ─── Price verdict ───────────────────────────────────────────────────────────

export type Verdict = {
  label: 'good' | 'typical' | 'high'
  page_price: number | null
  band: { min: number; max: number } | null
  /** Condition of the cheapest / most expensive comparison listing, for copy. */
  min_condition: string | null
  max_condition: string | null
  sample: number
}

/**
 * Where this page's price sits against everything else on the market.
 *
 * Two different questions, deliberately answered from two different sets:
 *
 *   - The VERDICT ("is $160 fair?") compares against listings in the SAME
 *     condition. Judging a brand-new retail page against $45 beaten-up eBay
 *     pairs would mark every MSRP in the world as "caro", which is useless
 *     advice — of course secondhand is cheaper.
 *   - The BAND ("what else is out there?") spans EVERYTHING, so the shopper
 *     still sees the secondhand floor. That's the whole point of the panel.
 *
 * Median-relative rather than min-relative: one absurd "for parts" listing
 * shouldn't drag the verdict. ±10% around the median is "typical" — tight
 * enough to be useful, wide enough that normal price scatter isn't a verdict.
 */
export function priceVerdict(
  pagePrice: number | null,
  listings: any[],
  pageCondition: 'new' | 'used' | 'refurbished' = 'new',
): Verdict {
  const priced = listings.filter((l) => typeof l.price === 'number' && l.price > 0)
  const prices = priced.map((l) => l.price as number).sort((a, b) => a - b)

  if (!prices.length) {
    return { label: 'typical', page_price: pagePrice, band: null, min_condition: null, max_condition: null, sample: 0 }
  }

  // Same-condition comparison set for the verdict; fall back to everything when
  // there aren't enough peers to say anything meaningful.
  const peers = priced.filter((l) => l.condition === pageCondition).map((l) => l.price as number).sort((a, b) => a - b)
  const judgeSet = peers.length >= 3 ? peers : prices

  const median = judgeSet[Math.floor(judgeSet.length / 2)]
  const min = prices[0]
  const max = prices[prices.length - 1]

  // The band must contain the page price, or the marker renders off-scale.
  const band = {
    min: pagePrice ? Math.min(min, pagePrice) : min,
    max: pagePrice ? Math.max(max, pagePrice) : max,
  }

  let label: Verdict['label'] = 'typical'
  if (pagePrice) {
    if (pagePrice < median * 0.9) label = 'good'
    else if (pagePrice > median * 1.1) label = 'high'
  }

  const cheapest = priced.find((l) => l.price === min)
  const dearest = priced.find((l) => l.price === max)

  return {
    label,
    page_price: pagePrice,
    band,
    min_condition: cheapest?.condition || null,
    max_condition: dearest?.condition || null,
    sample: prices.length,
  }
}

// ─── Facets (filters) ────────────────────────────────────────────────────────
//
// Only facets we can back with REAL data from the listing set. We deliberately do
// NOT invent a "Material" filter or split sizes into Women/Men — Google Shopping
// titles don't carry that reliably, and a filter that silently matches nothing is
// worse than no filter at all.

const COLOR_WORDS: Record<string, string> = {
  black: 'Negro', white: 'Blanco', grey: 'Gris', gray: 'Gris', silver: 'Plata',
  brown: 'Café', tan: 'Beige', beige: 'Beige', cream: 'Crema', ivory: 'Marfil',
  blue: 'Azul', navy: 'Azul marino', teal: 'Turquesa', green: 'Verde',
  olive: 'Verde olivo', red: 'Rojo', burgundy: 'Vino', maroon: 'Vino',
  pink: 'Rosa', purple: 'Morado', lilac: 'Lila', violet: 'Violeta',
  yellow: 'Amarillo', gold: 'Dorado', orange: 'Naranja', multicolor: 'Multicolor',
}

/** Sizes as they actually appear in marketplace titles: "Size 10.5", "US 9", "M". */
function sizesFromTitle(title: string): string[] {
  const out = new Set<string>()
  const t = ` ${title} `
  for (const m of t.matchAll(/\b(?:size|talla|us)\s*[:#]?\s*(\d{1,2}(?:\.5)?)\b/gi)) {
    // "Size 07" and "Size 7" are the same shoe — normalize or the facet shows both.
    out.add(String(parseFloat(m[1])))
  }
  for (const m of t.matchAll(/\b(XS|S|M|L|XL|XXL|XXXL|2XL|3XL)\b/g)) out.add(m[1].toUpperCase())
  return [...out]
}

function colorsFromTitle(title: string): string[] {
  const t = title.toLowerCase()
  const out = new Set<string>()
  for (const [en, es] of Object.entries(COLOR_WORDS)) {
    if (new RegExp(`\\b${en}\\b`).test(t)) out.add(es)
  }
  return [...out]
}

export type Facets = {
  price: { min: number; max: number } | null
  stores: string[]
  conditions: string[]
  sizes: string[]
  colors: string[]
}

export function buildFacets(listings: any[]): Facets {
  const prices = listings.map((l) => l.price).filter((p: any) => typeof p === 'number') as number[]
  const stores = new Map<string, number>()
  const conditions = new Set<string>()
  const sizes = new Set<string>()
  const colors = new Set<string>()

  for (const l of listings) {
    // Collapse "eBay - gius3187" down to the platform so the filter is usable.
    const store = String(l.store || '').split(/\s+[-–—]\s+/)[0].trim()
    if (store) stores.set(store, (stores.get(store) || 0) + 1)
    if (l.condition) conditions.add(l.condition)
    for (const s of sizesFromTitle(l.title || '')) sizes.add(s)
    for (const c of colorsFromTitle(l.title || '')) colors.add(c)
  }

  const sortSizes = (a: string, b: string) => {
    const na = parseFloat(a), nb = parseFloat(b)
    if (!isNaN(na) && !isNaN(nb)) return na - nb
    if (!isNaN(na)) return -1
    if (!isNaN(nb)) return 1
    const order = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', 'XXXL']
    return order.indexOf(a) - order.indexOf(b)
  }

  // A facet with a single value can't filter anything — don't offer it.
  const multi = (arr: string[]) => (arr.length > 1 ? arr : [])

  // Sizes are the one facet that can actively mislead: most Shopping titles don't
  // carry a size, so filtering by "7.5" would hide 20 perfectly good listings
  // whose title simply never mentioned a size. Only offer it when enough of the
  // set actually exposes one.
  const withSize = listings.filter((l) => sizesFromTitle(l.title || '').length).length
  const sizesUsable = listings.length > 0 && withSize / listings.length >= 0.4 && sizes.size > 1

  return {
    price: prices.length ? { min: Math.min(...prices), max: Math.max(...prices) } : null,
    stores: multi([...stores.entries()].sort((a, b) => b[1] - a[1]).map(([s]) => s)),
    conditions: multi([...conditions]),
    sizes: sizesUsable ? [...sizes].sort(sortSizes).slice(0, 24) : [],
    colors: multi([...colors]),
  }
}

export type Filters = {
  min_price?: number | null
  max_price?: number | null
  stores?: string[]
  conditions?: string[]
  sizes?: string[]
  colors?: string[]
}

export function applyFilters(listings: any[], f: Filters = {}): any[] {
  const wantStores = (f.stores || []).map(slug).filter(Boolean)
  const wantConds = (f.conditions || []).filter(Boolean)
  const wantSizes = (f.sizes || []).map((s) => s.toUpperCase()).filter(Boolean)
  const wantColors = (f.colors || []).filter(Boolean)

  return listings.filter((l) => {
    if (typeof f.min_price === 'number' && (l.price === null || l.price < f.min_price)) return false
    if (typeof f.max_price === 'number' && (l.price === null || l.price > f.max_price)) return false
    if (wantStores.length) {
      const s = slug(l.store)
      if (!wantStores.some((w) => s.startsWith(w))) return false
    }
    if (wantConds.length && !wantConds.includes(l.condition)) return false
    if (wantSizes.length) {
      const have = sizesFromTitle(l.title || '').map((s) => s.toUpperCase())
      if (!have.some((s) => wantSizes.includes(s))) return false
    }
    if (wantColors.length) {
      const have = colorsFromTitle(l.title || '')
      if (!have.some((c) => wantColors.includes(c))) return false
    }
    return true
  })
}

// ─── The one model pass: same-product check + photo quality + ranking ────────

// Per-item verdicts, not a bare keep-list. A cheap model handed "return the good
// indices" rubber-stamps the whole batch; forcing a decision AND a reason for
// every single item is what makes it actually look at each photo.
const curateSchema = z.object({
  items: z.array(
    z.object({
      i: z.number().int().describe('The candidate index being judged.'),
      same_product: z.boolean().describe('Is this the same product (any colorway), same age bracket?'),
      photo_ok: z.boolean().describe('Is the photo clean enough for a premium gallery?'),
      reason: z.string().describe('Max 8 words. Why you rejected it, or "ok".'),
      rank: z.number().int().describe('1 = show first. Only meaningful when kept.'),
    }),
  ),
})

const CURATE_SYSTEM = `You are a luxury personal shopper, not a coupon site. You curate alternative places to buy THE SAME product for a customer who already shops premium US retailers and wants to pay less without giving up trust.

You get the product they are looking at, then numbered candidate listings — title, seller, price, condition, and PHOTO.

Judge EVERY candidate and return one entry per index. Be a strict gatekeeper: in a typical batch several genuinely fail.

REJECT (same_product: false) when:
- It is NOT the same product — a different model or silhouette, an accessory, a case, a single shoelace, a bundle of something unrelated. A different COLOURWAY of the same model is fine and welcome.
- It is a DIFFERENT AGE BRACKET. A kids / grade-school / preschool / toddler / youth / "GS" / "PS" / "TD" version is a smaller, cheaper, different product, and showing it as "50% less" is a lie. Men's vs women's cuts of the same model ARE valid alternatives.
- The seller is a random dropshipper, an unknown storefront, or anything you would not send a friend to. Prefer no result over a doubtful one.
- The title is spam: keyword soup, ALL CAPS, stuffed with unrelated brands.

REJECT (photo_ok: false) when the photo isn't fit for a premium gallery: blurry, dark, shot on a carpet or bed, a hand holding the item, cluttered background, a screenshot, a photo of the box instead of the product, heavy watermarks, a collage, or a placeholder. One ugly photo makes the whole panel look cheap.

ORDER the survivors by TRUST FIRST, price second:
1. The brand's own store.
2. Authorized retailers — Nordstrom, Saks, Macy's, Dick's, REI, Zappos, SSENSE, END., Foot Locker, Nordstrom Rack and the like.
3. Outlet and clearance arms of legitimate retailers.
4. Anything else.
Within a tier: new condition first, then clean presentation, then lower price.

A cheaper listing from a seller the customer wouldn't trust is NOT a better result. If showing it would reduce their confidence in the purchase, rank the trusted retailer above it. Six excellent options beat twenty mediocre ones.`


/**
 * ONE vision pass that decides same-product + photo quality + order. Replaces
 * both a text-only relevance rank and a separate image screen; it's the only way
 * to catch "right product, terrible photo", which is exactly what makes a panel
 * look cheap and what no allowlist can detect.
 *
 * Code guarantees around it: we never return an empty gallery when we had
 * candidates (a model that rejects everything falls back to the deterministic
 * order), and every returned index is real.
 */
/** How many listings one vision call judges. See curateListings(). */
const VISION_BATCH = 9

export async function curateListings(
  pageProduct: { title: string; brand?: string | null; price?: number | null },
  candidates: any[],
): Promise<any[]> {
  if (!candidates.length) return candidates
  if (!hasModelKey() || process.env.SHOPPER_VISION_SCREEN === '0') return candidates

  // SPLIT AND RUN IN PARALLEL. Vision latency scales with the number of images
  // in the call — one 20-image pass measured ~11s and was the single biggest
  // component of a cold panel. Two or three 9-image passes cost the same tokens
  // but finish in roughly the time of the slowest one.
  //
  // The tradeoff is that ranking is batch-local rather than global. That's fine:
  // the batches are interleaved back together, so the best of each still surfaces
  // near the top, and the REJECT decisions — which are what protect quality —
  // are per-item and completely unaffected by batching.
  const batches: any[][] = []
  for (let i = 0; i < candidates.length; i += VISION_BATCH) {
    batches.push(candidates.slice(i, i + VISION_BATCH))
  }

  const results = await Promise.all(batches.map((b) => curateBatch(pageProduct, b)))

  // A batch that failed returns null — fall back to its own candidates so one
  // bad call degrades that slice only, never the whole gallery.
  const kept = results.map((r, i) => r ?? batches[i])

  // Round-robin the batches back together.
  const merged: any[] = []
  for (let i = 0; ; i++) {
    let added = false
    for (const list of kept) {
      if (i < list.length) {
        merged.push(list[i])
        added = true
      }
    }
    if (!added) break
  }
  return merged.length ? merged : candidates
}

/** One vision call. Returns the kept items best-first, or null if it failed. */
async function curateBatch(
  pageProduct: { title: string; brand?: string | null; price?: number | null },
  batch: any[],
): Promise<any[] | null> {
  try {
    const content: any[] = [
      {
        type: 'text',
        text:
          `Product the shopper is viewing: ${pageProduct.brand ? pageProduct.brand + ' ' : ''}${pageProduct.title}` +
          (pageProduct.price ? ` — listed at $${pageProduct.price}` : '') +
          `\n\nCandidates:`,
      },
    ]
    batch.forEach((c, i) => {
      content.push({
        type: 'text',
        text: `\n[${i}] ${String(c.title || '').slice(0, 120)} — ${c.store || '?'}${c.price ? ` — $${c.price}` : ''} — ${c.condition}`,
      })
      // Bytes we already fetched (see loadThumbnails), not the URL: letting the
      // SDK re-download means one dead thumbnail rejects the whole call.
      content.push({ type: 'image', image: c._bytes || c.image, mimeType: c._mime })
    })

    const { object } = await generateObject({
      model: auxModel(),
      schema: curateSchema,
      system: CURATE_SYSTEM,
      messages: [{ role: 'user', content }],
      providerOptions: providerOptions(),
      // The batches run in PARALLEL, so this ceiling costs wall-clock only in
      // the bad case — and the bad case matters: a timed-out batch falls back to
      // its raw candidates, dumping nine unfiltered listings into the gallery.
      // Waiting a few more seconds beats shipping the junk we built this pass to
      // remove. Typical completion is ~5-6s.
      abortSignal: AbortSignal.timeout(20000),
    })

    const seen = new Set<number>()
    const kept: { item: any; rank: number }[] = []
    for (const v of object?.items || []) {
      const i = v?.i
      if (typeof i !== 'number' || i < 0 || i >= batch.length || seen.has(i)) continue
      seen.add(i)
      if (v.same_product === false || v.photo_ok === false) continue
      kept.push({ item: batch[i], rank: typeof v.rank === 'number' ? v.rank : 999 })
    }
    kept.sort((a, b) => a.rank - b.rank)

    // An empty batch is a legitimate verdict — those nine really were all junk.
    // The caller decides what to do when EVERY batch comes back empty.
    return kept.map((k) => k.item)
  } catch (e: any) {
    // Loud on purpose: this pass is what keeps junk listings and ugly photos out,
    // and its failure mode (show everything) looks like "the filter doesn't work"
    // rather than like an error. Silence here cost us a debugging session once.
    console.warn('[shopper] vision batch failed:', e?.message || e)
    return null // caller substitutes this batch's raw candidates
  }
}

// ─── Store offers ────────────────────────────────────────────────────────────

const offerSchema = z.object({
  offers: z.array(
    z.object({
      description: z
        .string()
        .describe('The promotion in Mexican Spanish, MAX 7 WORDS, keeping who qualifies: "15% para estudiantes", "envío gratis desde $50".'),
    }),
  ),
})

const OFFER_SYSTEM = `You extract the promotions a store publishes ON ITS OWN WEBSITE.

Everything you are given comes from the retailer's own pages, so it is first-party and current. Return each distinct promotion as a short Spanish (Mexican) phrase, 7 words maximum, KEEPING who qualifies — "15% para estudiantes", not "15% de descuento".

Include: newsletter or signup offers, first-order discounts, free-shipping thresholds, seasonal sales, and loyalty or member pricing that is free to join.

NEVER include discounts that require US credentials — student, military, veteran, first responder, nurse, medical or teacher. Our customers shop from Mexico and cannot pass the US verification these require (a .edu address, a US military ID, SheerID). Listing them is noise at best and a false promise at worst.

Skip: anything expired or seasonal that has clearly passed, vague ceiling marketing ("hasta 40%"), and promo codes — we do not show codes.`

/** One promotion the retailer publishes itself. No code — see findOffers. */
export type StoreOffer = { description: string }

/**
 * Does this offer say WHO qualifies, or WHAT unlocks it?
 *
 * A bare "30% de descuento sitewide" is the least trustworthy claim in the set
 * and the least actionable. It comes from coupon-aggregator headlines ("Alo Yoga
 * Promo Codes - 40% Off"), whose bodies then say "save UP TO 40%" — the model
 * drops the ceiling and reports it as a flat discount nobody will get. And if an
 * unconditional sitewide sale were genuinely running, the shopper would already
 * see it on the page they're looking at.
 *
 * Offers with a condition are the opposite: "15% para estudiantes", "10% al
 * suscribirte", "30% extra en rebajas" are specific, verifiable, and something
 * the shopper can actually go and claim.
 *
 * Tried and rejected first: checking whether the percentage appears only in
 * "up to" phrasing. The aggregator TITLE states it flat, so the check never
 * fired.
 */
const OFFER_CONDITION =
  /estudiante|maestro|militar|enfermer|m[ée]dico|primera compra|primer pedido|app\b|suscrib|registr|newsletter|correo|referi|amigo|rebaj|liquidaci[óo]n|outlet|sale\b|m[íi]nimo|desde \$|cumplea[ñn]|socio|miembro|estudiantil|cashback|env[íi]o gratis/i

/**
 * Discounts gated behind US credentials. A Boxly customer shops from Mexico and
 * cannot verify as a US student, teacher, nurse or service member — these need a
 * .edu address, a US military ID or a SheerID check. Surfacing them is a promise
 * the shopper can't collect on.
 */
const US_CREDENTIAL_ONLY =
  /estudiante|student|militar|military|veterano|veteran|maestro|teacher|educador|docente|enfermer|nurse|m[ée]dic|medical|healthcare|primeros? respondientes?|first responder|socorrista|gobierno|government employee/i

function hasCondition(description: string): boolean {
  return OFFER_CONDITION.test(description)
}


/**
 * Promo codes for a store, mined from Google organic results and cached PER STORE
 * for 6 hours — one lookup serves every product page on that store, which is what
 * keeps this affordable.
 *
 * Codes scraped from coupon sites go stale; the panel labels them as "puede que ya
 * no funcione" rather than promising savings.
 */
/**
 * The offers a store is currently running, mined from Google organic results and
 * cached per store for 6 hours.
 *
 * NO CODES. We used to extract promo codes here and they were fabricated: coupon
 * sites hide the real string behind a "Claim" button, so the snippets contain no
 * codes at all, and the model — asked for codes — invented plausible ones
 * (NB20, WELCOME10). A code that fails at checkout costs more trust than an
 * absent one. Until there's a reliable source, we show the offer and let the
 * shopper look for it at the till.
 */
export async function findOffers(
  storeName: string,
  host: string,
  apiPost: (path: string, body: any) => Promise<any>,
): Promise<StoreOffer[]> {
  const name = String(storeName || '').trim()
  if (!name || !hasModelKey()) return []

  const storage = useStorage('cache')
  const key = 'offers:' + slug(host || name)
  if (!cacheOff()) {
    const hit = await storage.getItem<StoreOffer[]>(key)
    if (hit) return hit
  }

  try {
    // FIRST-PARTY ONLY. Everything a coupon aggregator publishes is unverified —
    // scraped, stale, or gated behind a "Claim" button — and we have no way to
    // test a code at checkout. A promotion on the retailer's own site is
    // current by construction, so that's the only source we accept.
    const [generic, own] = await Promise.all([
      apiPost('/products/web-search', { query: `${name} discounts promotions`, num: 10 }),
      apiPost('/products/web-search', { query: `site:${host} discount OR promotions OR students`, num: 10 }),
    ])

    const all: any[] = [...(generic?.results || []), ...(own?.results || [])]
    const firstParty = all.filter((r) => {
      try {
        return new URL(r.url).hostname.replace(/^www\./, '').endsWith(host)
      } catch {
        return false
      }
    })
    if (!firstParty.length) return []

    const digest = firstParty.map((r) => `${r.title}\n${r.snippet}`).join('\n---\n').slice(0, 8000)

    const { object } = await generateObject({
      model: auxModel(),
      schema: offerSchema,
      system: OFFER_SYSTEM,
      prompt: `Store: ${name}\n\nSearch results:\n${digest}`,
      providerOptions: providerOptions(),
      // Runs in parallel with the shopping searches, so anything under those
      // costs no wall-clock.
      abortSignal: AbortSignal.timeout(12000),
    })

    const seen = new Set<string>()
    const offers: StoreOffer[] = []
    for (const o of object?.offers || []) {
      const description = String(o?.description || '').trim().slice(0, 60)
      if (!description || !hasCondition(description)) continue
      if (US_CREDENTIAL_ONLY.test(description)) {
        console.warn('[shopper] dropped US-credential offer:', description)
        continue
      }
      const key = description.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      offers.push({ description })
      if (offers.length >= 6) break
    }

    // Cache successes 6h; an empty result only 30 min, so a store that had a bad
    // search moment self-heals instead of looking offer-less all day.
    if (!cacheOff()) {
      await storage.setItem(key, offers, { ttl: offers.length ? 60 * 60 * 6 : 60 * 30 })
    }
    return offers
  } catch (e: any) {
    // Silent here meant "this store has no offers", which is a different and much
    // less alarming statement than "the extraction threw".
    console.warn('[shopper] offer extraction failed for', name, '-', e?.message || e)
    return []
  }
}

// ─── Which number on the page is the price? ──────────────────────────────────

const pickPriceSchema = z.object({
  index: z.number().int().describe('Index of the product\'s current price, or -1 if none of them is.'),
  currency: z.string().describe('ISO code of that price, e.g. MXN, USD, EUR.'),
  reason: z.string().describe('Max 8 words.'),
})

const PICK_PRICE_SYSTEM = `You are given text snippets scraped from ONE product page, each with the copy surrounding it. Exactly one of them is usually the price the shopper pays for THIS product right now.

Pick that one and return its index.

Do NOT pick:
- a free-shipping threshold ("ENVÍO GRATUITO POR MXN1575", "free shipping over $50")
- an instalment or financing amount ("12 meses sin intereses", "4 pagos de $X")
- a crossed-out or "before" price — we want what they pay TODAY
- a cart total, subtotal, tax, or a loyalty/points value
- the price of a recommended or related product
- a price range for other variants when a single current price exists

Return the ISO currency code for the price you picked. Judge it from the symbol and the language of the surrounding copy: on a Mexican storefront a bare "$" is MXN, not USD.

If none of the snippets is this product's current price, return index -1.`

/**
 * Let the model decide which snippet is the price.
 *
 * Heuristics kept picking the wrong number — a shipping-threshold banner beat
 * the real price tag on Alo's Mexican storefront — and every store lays this out
 * differently, so the rules would never stop growing. This is judgment work, so
 * it goes to the model, exactly like ranking listings does.
 *
 * Code still guarantees the outcome: the model may only CHOOSE from candidates
 * the page actually contained (it can't invent a number), the amount comes from
 * our own parse of that candidate, and any failure falls back to the heuristic
 * pick the extension already made.
 */
export async function pickPrice(
  candidates: any[],
  ctx: { title: string; localeCurrency?: string | null },
): Promise<{ amount: number; currency: string } | null> {
  if (!Array.isArray(candidates) || !candidates.length) return null
  if (!hasModelKey()) return null

  const list = candidates
    .slice(0, 24)
    .map((c, i) => `${i}: "${String(c.text || '').slice(0, 40)}"  — context: "${String(c.context || '').slice(0, 120)}"`)
    .join('\n')

  try {
    const { object } = await generateObject({
      model: auxModel(),
      schema: pickPriceSchema,
      system: PICK_PRICE_SYSTEM,
      prompt:
        `Product: ${ctx.title}\n` +
        (ctx.localeCurrency ? `Storefront currency (from its locale): ${ctx.localeCurrency}\n` : '') +
        `\nSnippets:\n${list}`,
      providerOptions: providerOptions(),
      abortSignal: AbortSignal.timeout(8000),
    })

    const i = object?.index
    if (typeof i !== 'number' || i < 0 || i >= candidates.length) return null

    // The AMOUNT is ours, not the model's — it only chose which snippet.
    const chosen = candidates[i]
    const amount = Number(chosen?.amount)
    if (!isFinite(amount) || amount <= 0) return null

    const currency = String(object?.currency || chosen?.currency || ctx.localeCurrency || '').toUpperCase()
    if (!/^[A-Z]{3}$/.test(currency)) return null

    return { amount, currency }
  } catch {
    return null
  }
}

// ─── Mexico-vs-US price comparison ───────────────────────────────────────────

/**
 * How many units of `currency` one US dollar buys. Cached 12h — FX moves far
 * too slowly to matter here, and this runs on every localized product view.
 * Returns null on failure so the caller shows no comparison rather than a wrong
 * one.
 */
export async function usdRate(currency: string): Promise<number | null> {
  const code = String(currency || '').toUpperCase()
  if (!code || code === 'USD') return 1

  const storage = useStorage('cache')
  const key = 'fx:' + code
  const hit = await storage.getItem<number>(key)
  if (hit) return hit

  // Two providers. Without a rate there is no comparison and the shopper loses
  // the single most valuable thing the panel tells them, so one cold-DNS
  // timeout must not be enough to lose it (measured: a first call timed out at
  // 6s, the retry answered in 200ms).
  const sources = [
    `https://api.frankfurter.dev/v1/latest?base=USD&symbols=${code}`,
    'https://open.er-api.com/v6/latest/USD',
  ]

  for (const src of sources) {
    try {
      const res = await fetch(src, { signal: AbortSignal.timeout(8000) })
      if (!res.ok) continue
      const data: any = await res.json()
      const rate = Number(data?.rates?.[code])
      if (!isFinite(rate) || rate <= 0) continue
      await storage.setItem(key, rate, { ttl: 60 * 60 * 12 })
      return rate
    } catch {
      // try the next provider
    }
  }
  console.warn('[shopper] no FX rate for', code, '— price comparison suppressed')
  return null
}

export type PriceCompare = {
  local_amount: number
  local_currency: string
  local_usd: number
  us_amount: number
  /** The US price expressed in the shopper's own currency, at today's rate. */
  us_local: number
  savings_usd: number
  /** The saving in the shopper's own currency — the number that lands. */
  savings_local: number
  savings_percent: number
  fx: number
}

/**
 * The core Boxly argument, made concrete: what this exact product costs on the
 * store's Mexican site versus its US site.
 *
 * Both numbers are real — the local one read off the page the shopper is
 * looking at, the US one fetched through ScraperAPI's US exit node — so this is
 * the same product at the same retailer, not an approximation.
 *
 * Returns null unless there is a genuine saving worth acting on; a 2% gap is
 * noise once shipping is involved, and overstating it would be dishonest.
 */
export function buildCompare(
  localAmount: number | null,
  localCurrency: string | null,
  usAmount: number | null,
  fx: number | null,
): PriceCompare | null {
  if (!localAmount || !localCurrency || !usAmount || !fx || fx <= 0) return null
  // A "local" price already in dollars means the page was never foreign — the
  // comparison would be the US price against itself, scaled by an exchange rate.
  if (localCurrency === 'USD') return null

  const localUsd = localAmount / fx
  const savings = localUsd - usAmount
  const percent = Math.round((savings / localUsd) * 100)

  // Below ~5% it isn't a story, and it could just be FX drift or a rounding rule.
  if (savings <= 0 || percent < 5) return null

  return {
    local_amount: localAmount,
    local_currency: localCurrency,
    local_usd: Math.round(localUsd * 100) / 100,
    us_amount: usAmount,
    // Both sides in pesos as well as dollars: a shopper comparing MX$1,590 to
    // "$64" has to do the conversion in their head to see the gap. Doing it for
    // them is the difference between a number and an argument.
    us_local: Math.round(usAmount * fx),
    savings_usd: Math.round(savings * 100) / 100,
    savings_local: Math.round(savings * fx),
    savings_percent: percent,
    fx,
  }
}

// ─── Query building ──────────────────────────────────────────────────────────

/**
 * Turn a messy PDP title into the query Google Shopping answers best: brand +
 * model, without the marketing tail ("| Free Shipping", "- Shop Now", SKUs).
 */
export function productQuery(title: string, brand?: string | null, variant?: string | null): string {
  let t = String(title || '')
    .split(/\s*[|]\s*/)[0]              // "…9060 | New Balance" → "…9060"
    .replace(/\s*[-–—]\s*(shop|buy|official|free shipping|new arrivals?).*/i, '')
    .replace(/\b(sku|item|style|model)\s*[:#]?\s*[A-Z0-9-]{4,}\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()

  const b = String(brand || '').trim()
  // Only prepend the brand when the title doesn't already carry it.
  if (b && !t.toLowerCase().includes(b.toLowerCase())) t = `${b} ${t}`

  /**
   * Append the selected variant — the size and colour the shopper is looking at.
   *
   * Without it, "FreeSip®" matched every Owala ever made: the panel offered an
   * orange Sway and a green bottle to someone looking at a blue 24oz, and
   * eBay's cheapest was a PINK SKIES. With "24oz Out of the Blue" appended,
   * eBay returns 24oz bottles.
   *
   * Word by word, skipping anything the title already says, so a store that
   * repeats the colourway in its title doesn't spend the 12-word budget saying
   * it twice. Over-specificity is survivable here — `broadenQuery()` strips
   * this tail back off when a search comes home nearly empty — but a wasted
   * budget is not, because the words that get cut are the distinctive ones.
   */
  const v = String(variant || '').trim()
  if (v) {
    const have = new Set(t.toLowerCase().split(/\s+/))
    const add = v.split(/\s+/).filter((w) => w && !have.has(w.toLowerCase()))
    if (add.length) t = `${t} ${add.join(' ')}`
  }

  return t.split(/\s+/).slice(0, 12).join(' ').slice(0, 160)
}

/**
 * A looser version of the query, for when the specific one came back nearly
 * empty.
 *
 * Apparel titles carry a colourway ("Cropped Timeless Tee - Dune Grass") that
 * makes the search so narrow it returns one listing or none. Dropping the tail
 * after the dash — and any parenthetical — finds the same garment in other
 * colours at other stores, which is still a useful comparison.
 *
 * Returns '' when there's nothing to broaden, so the caller can skip the call.
 */
export function broadenQuery(query: string): string {
  const t = String(query || '')
    .replace(/\s*\(.*?\)\s*/g, ' ')     // "(Women's)"
    .split(/\s+[-–—]\s+/)[0]            // "… Tee - Dune Grass" → "… Tee"
    .replace(/\s+/g, ' ')
    .trim()
  const broad = t.split(/\s+/).slice(0, 8).join(' ')
  return broad && broad.toLowerCase() !== String(query || '').trim().toLowerCase() ? broad : ''
}
