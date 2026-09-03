/**
 * Turn a Google Shopping listing into the merchant's own product page.
 *
 * Google Shopping results carry NO seller URL — only a google.com/search?ibp=oshop
 * link and an `immersive_product_page_token`. Clicking a listing was therefore
 * dumping the shopper on Google instead of the store, which is useless: they
 * can't buy there, and Boxly can't quote from it.
 *
 * Resolution costs one SerpAPI call, so it happens HERE, on click — not for all
 * 20 listings when the panel opens. Cached both sides (an hour in the Laravel
 * API, 6h here) so re-opening the same listing is free.
 *
 * Body:  { token, store?, fallback? }
 * Returns { url }  — the merchant URL, or the fallback when resolution fails.
 */
import { createHash } from 'node:crypto'
import { cacheOff } from '../../utils/shopperPanel'

const API_BASE = (process.env.API_URL || 'https://api.boxly.mx').replace(/\/$/, '')

const isGoogle = (u: string) => /(^|\/\/)(www\.)?google\.[a-z.]+\//i.test(String(u || ''))

export default defineEventHandler(async (event) => {
  setResponseHeaders(event, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  })

  const body = await readBody(event)
  const token = String(body?.token || '').trim()
  const store = String(body?.store || '').trim()
  const fallback = String(body?.fallback || '').trim()

  if (!token) return { url: fallback || null }

  const storage = useStorage('cache')
  const key = 'shopperlink:' + createHash('md5').update(token + '|' + store.toLowerCase()).digest('hex')
  if (!cacheOff()) {
    const hit = await storage.getItem<string>(key)
    if (hit) return { url: hit, cached: true }
  }

  try {
    const res = await fetch(`${API_BASE}/products/details`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, store: store || undefined }),
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) return { url: fallback || null }

    const data = await res.json().catch(() => null)
    const link = data?.data?.link || data?.link || null

    // A Google link back is no better than what we started with.
    if (!link || isGoogle(link)) return { url: fallback || null }

    if (!cacheOff()) await storage.setItem(key, link, { ttl: 60 * 60 * 6 })
    return { url: link }
  } catch {
    return { url: fallback || null }
  }
})
