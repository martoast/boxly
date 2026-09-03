import { broadenQuery, productQuery } from '../../utils/shopperPanel'

/**
 * The searches the panel is about to make, for a given product.
 *
 * Exists for one reason: the scheduler has to warm the upstream BEFORE it asks
 * the panel to resolve, and only this codebase knows what "the query" is.
 *
 * Measured 2026-08-04 in production — `/products/search` on the Laravel API:
 *
 *     Owala FreeSip 24 oz    0.68s   (warm — Laravel caches per query)
 *     Nike Air Force 1      18.20s   (cold)
 *     New Balance 2010      24.73s   (cold)
 *
 * The panel allows that call 20s and Netlify kills the whole function at 30s,
 * so a cold product could not resolve at all: every search timed out, `api()`
 * turned the timeout into `null`, and the panel spent 26 seconds to return an
 * empty list. Warm the same queries first and the identical panel request
 * finishes in single digits.
 *
 * The alternative was porting `productQuery`/`broadenQuery` to PHP, which would
 * give us two definitions of what a product's query is, drifting apart — the
 * exact thing WarmProductIndex was written to avoid. So the scheduler asks.
 *
 * Secret-gated: it is cheap and read-only, but it describes our search strategy
 * and there is no reason for it to be public.
 */
export default defineEventHandler(async (event) => {
  const secret = process.env.PRODUCT_INDEX_SECRET
  // No secret configured means the index feature is off — not open. Same stance
  // the Laravel side takes for /products/index/*.
  if (!secret) throw createError({ statusCode: 503, statusMessage: 'index disabled' })
  if (getHeader(event, 'x-boxly-index-secret') !== secret) {
    throw createError({ statusCode: 403, statusMessage: 'forbidden' })
  }

  const body = await readBody(event)
  const title = String(body?.title || '').trim()
  if (!title) throw createError({ statusCode: 400, statusMessage: 'title required' })

  const brand = body?.brand ? String(body.brand).trim() : null
  const variant = body?.variant ? String(body.variant).trim().slice(0, 80) : null

  // Mirrors panel.post.ts exactly: retail searches on the base query (no
  // variant — measured worse), the feeds search on the specific one.
  const base = productQuery(title, brand)
  const feed = productQuery(title, brand, variant)
  const broader = broadenQuery(base) || ''

  /**
   * Deduped, and in the order the panel needs them.
   *
   * `${base} used` is the resale pass and it is a SEPARATE SerpAPI query with
   * its own cache entry — warming only the retail one left the panel still
   * racing a cold 18s call, which is how you fix a timeout and measure no
   * change at all.
   */
  const warm = [base, `${base} used`, broader ? `${broader}` : ''].filter(Boolean)

  return { retail: base, feed, broader: broader || null, warm: [...new Set(warm)] }
})
