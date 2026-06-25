// Resolve a representative product image for a starter card (e.g. "YoungLA",
// "leggings", "Nike running shoes"). Reuses the universal product search and
// returns the first REAL product image. Only successful lookups are cached (so a
// transient API failure retries instead of sticking as "no image"). The client
// also caches the resolved URL in localStorage.
export default defineEventHandler(async (event) => {
  const q = String(getQuery(event).q || '').trim()
  if (!q) return { image: null }

  const key = 'cardimg:' + q.toLowerCase()
  const storage = useStorage('cache')
  const hit = await storage.getItem(key)
  if (hit) return { image: hit }

  const API_BASE = (process.env.API_URL || 'https://api.boxly.mx').replace(/\/$/, '')
  try {
    const r: any = await $fetch('/products/search', {
      baseURL: API_BASE,
      method: 'POST',
      body: { query: q },
      headers: { Accept: 'application/json' },
    })
    const image = (r?.data?.products || []).find((p: any) => p?.image)?.image || null
    if (image) await storage.setItem(key, image, { ttl: 60 * 60 * 24 }) // cache successes 24h
    return { image }
  } catch (e: any) {
    console.error('[card-image] fetch failed:', e?.message || e)
    return { image: null }
  }
})
