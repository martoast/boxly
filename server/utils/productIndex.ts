/**
 * The product index — remember what the panel already resolved.
 *
 * Every panel open runs a shopping search, a vision pass and a verification
 * chain, lands on an answer in 17–26 seconds, holds it in memory for 15 minutes
 * and throws it away. This is the layer behind that: the same answer, kept in
 * the database, so the second shopper on a product pays nothing for what the
 * first one waited for.
 *
 * Stage 2 of app/tasks/product-index.md. A CACHE, never a source of truth —
 * every function fails to null and the caller falls through to the live path.
 *
 * Config:
 *   PRODUCT_INDEX_SECRET   shared with the Laravel API. Unset → index off.
 */

const API_BASE = (process.env.API_URL || 'https://api.boxly.mx').replace(/\/$/, '')

export function productIndexConfigured(): boolean {
  return !!process.env.PRODUCT_INDEX_SECRET
}

export type ProductIds = Record<string, string> | null

/**
 * How a product is recognised across stores. First that exists wins:
 *
 *   1. gtin  — globally unique, so two shoppers on two different retailers
 *              resolve to the same row. The whole point of an index.
 *   2. brand + mpn/sku — the manufacturer's own code. sneakerpolitics publishes
 *              "U20107PT|13"; U20107PT is the style code eBay sellers put in
 *              their titles, and the "|13" is a Shopify size suffix, so we cut
 *              at the pipe.
 *   3. brand + title + variant — the fallback, and effectively what we match on
 *              today. Weaker (two stores word a title differently) but it still
 *              collapses repeat opens of the SAME page, which is most of the win.
 *
 * Returns '' when there is nothing stable to key on, and the caller skips the
 * index rather than writing a row nothing will ever match.
 */
export function canonicalKey(opts: {
  ids?: ProductIds
  brand?: string | null
  title?: string | null
  variant?: string | null
}): string {
  const norm = (s: any) =>
    String(s || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

  const ids = opts.ids || {}
  const gtin = ids.gtin13 || ids.gtin12 || ids.gtin14 || ids.gtin || ids.gtin8
  if (gtin && /^\d{8,14}$/.test(String(gtin).trim())) return `gtin:${String(gtin).trim()}`

  const brand = norm(opts.brand)
  // Cut the Shopify size suffix: "U20107PT|13" is one style in one size, and
  // indexing per size would give us a row nobody hits twice.
  const code = String(ids.mpn || ids.sku || ids.productid || '').split('|')[0].trim()
  if (brand && code.length >= 4) return `mpn:${brand}:${norm(code)}`

  const title = norm(opts.title)
  if (!title) return ''
  const variant = norm(opts.variant)
  return `t:${[brand, title, variant].filter(Boolean).join(':')}`.slice(0, 180)
}

async function call(path: string, body: any, timeoutMs: number): Promise<any | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Boxly-Index-Secret': String(process.env.PRODUCT_INDEX_SECRET || ''),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (!res.ok) return null
    return await res.json().catch(() => null)
  } catch {
    return null
  }
}

/**
 * A previously resolved product, or null.
 *
 * `maxAgeSeconds` is the caller's call, not ours: only the panel knows whether
 * it is about to put a discount badge on these prices. Staleness is the new way
 * an index lets you lie, and `verified` is the one thing this panel sells.
 *
 * Short timeout on purpose — this sits in front of the live path, so a slow
 * index must cost a fraction of a second, not add to the 17 we already spend.
 */
export async function indexGet(key: string, maxAgeSeconds: number): Promise<any | null> {
  if (!productIndexConfigured() || !key) return null
  const data = await call('/products/index/get', { key }, 2500)
  if (!data?.hit || !data.payload) return null
  const age = Number(data.age_seconds)
  if (Number.isFinite(age) && age > maxAgeSeconds) return null
  return data.payload
}

/** Remember a resolved product. Fire and forget — never make a shopper wait. */
export async function indexPut(
  key: string,
  payload: any,
  meta: { ids?: ProductIds; title?: string | null; brand?: string | null; variant?: string | null; image?: string | null; store?: string | null; sourceUrl?: string | null },
): Promise<void> {
  if (!productIndexConfigured() || !key || !payload) return
  await call(
    '/products/index/put',
    {
      key,
      payload,
      identifiers: meta.ids || null,
      title: meta.title || null,
      brand: meta.brand || null,
      variant: meta.variant || null,
      image: meta.image || null,
      store: meta.store || null,
      // The page this was resolved FROM — stage 4 needs it to resolve again.
      source_url: meta.sourceUrl || null,
    },
    4000,
  ).catch(() => null)
}
