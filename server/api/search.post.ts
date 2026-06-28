import { generateText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'

/**
 * Smart search backend for the search-first shopping flow.
 *
 * Accepts natural language, a link, or an image and returns ranked products
 * (deals-first — the Laravel layer already prioritizes on-sale items). The AI is
 * an invisible "smart search" brain here, not a chat: it only turns an image
 * (vision) or a vague phrase into a clean US-store query.
 *
 * Body: { q?, image?, filters?: { store, min_price, max_price, sale }, shoppingProfile? }
 * Returns: { type: 'results', query, products, price_range, filters }
 *       or { type: 'product', product: { url } }   // a pasted product link
 */
const API_BASE = (process.env.API_URL || 'https://api.boxly.mx').replace(/\/$/, '')
const PARSE_MODEL = process.env.ANTHROPIC_TITLE_MODEL || 'claude-haiku-4-5-20251001'

async function api(path: string, body: any) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(55000),
    })
    const text = await res.text()
    let data: any
    try { data = JSON.parse(text) } catch { data = null }
    if (!res.ok) return null
    return data?.data ?? data
  } catch {
    return null
  }
}

const isUrl = (s: string) => /^https?:\/\//i.test((s || '').trim())
const isProductUrl = (u: string) =>
  /\/products?\/|\/p\/|\/dp\/|\/itm\/|\/gp\/product\//i.test(u)

async function describeImage(dataUrl: string): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) return ''
  try {
    const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const { text } = await generateText({
      model: anthropic(PARSE_MODEL),
      system:
        'You convert a product photo into a concise US-store search query. Include the brand if visible, the item type, color and any standout attribute. Output ONLY the query (2–7 words), in English, no quotes.',
      messages: [{
        role: 'user',
        content: [
          { type: 'image', image: dataUrl },
          { type: 'text', text: 'Search query for this product:' },
        ],
      }],
    })
    return (text || '').replace(/\s+/g, ' ').trim().slice(0, 120)
  } catch {
    return ''
  }
}

// AI intent filter: titles often hide the real color (a Spanish query like
// "owala rosa", or marketing names like "Misty Meadows" = teal), so plain text
// matching can't tell. Use the model's knowledge to keep results that match the
// query's color/attribute on top — preserving the cheapest-first order within
// the matches. Falls back to the original order on any failure.
async function reorderByIntent(query: string, products: any[]): Promise<any[]> {
  const words = query.trim().split(/\s+/).filter((w) => w.length >= 2)
  if (words.length < 2 || products.length < 4 || !process.env.ANTHROPIC_API_KEY) return products
  try {
    const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const list = products.map((p, i) => `${i}: ${p.title || ''}`).join('\n')
    const { text } = await generateText({
      model: anthropic(PARSE_MODEL),
      system:
        'You filter US-shopping results to those matching the shopper\'s intent — ESPECIALLY color. The query may be Spanish (rosa=pink, azul=blue, negro=black, verde=green, morado/lila=purple, gris=gray, blanco=white, rojo=red, amarillo=yellow, naranja=orange, café/marrón=brown). Map marketing color names to real colors using product knowledge (e.g. "Misty Meadows"=teal/green, "Sugar Spice"=pink, "Blossom Bunny"=pink). Return ONLY the item numbers that MATCH the query, comma-separated, no prose. If a title has NO color/attribute info, INCLUDE it (unknown could match). Exclude only clear mismatches.',
      prompt: `Query: "${query}"\n\nItems:\n${list}\n\nMatching item numbers:`,
    })
    const idx = (text.match(/\d+/g) || []).map(Number).filter((n) => n >= 0 && n < products.length)
    if (!idx.length || idx.length === products.length) return products
    const matchSet = new Set(idx)
    const matched = products.filter((_, i) => matchSet.has(i)) // keep backend (cheapest) order
    const rest = products.filter((_, i) => !matchSet.has(i))
    return [...matched, ...rest]
  } catch {
    return products
  }
}

// Big-box US retailers people name in a query ("owala rosa DE TARGET"). When one
// is detected (or passed as a filter), we float that store's listings to the top.
const RETAILERS = [
  'target', 'walmart', 'amazon', 'costco', 'best buy', 'macy', "macy's", 'nordstrom',
  'kohl', "kohl's", 'sephora', 'ulta', 'dick', "dick's", 'rei', 'gamestop', 'lowes',
  "lowe's", 'home depot', 'cvs', 'walgreens', 'petco', 'petsmart', 'nike', 'adidas',
  'lululemon', 'gap', 'old navy', 'american eagle', 'urban outfitters', 'tjmaxx',
]
function detectRequestedStore(query: string, filterStore?: string): string {
  if (filterStore) return filterStore
  const q = ` ${(query || '').toLowerCase()} `
  for (const r of RETAILERS) if (q.includes(` ${r} `) || q.includes(` ${r},`) || q.includes(`de ${r}`) || q.includes(`from ${r}`)) return r
  return ''
}
// Stable-float products whose store matches the requested one (deterministic — the
// requested store always wins over a cheaper/“more trusted” competing seller).
function floatRequestedStore(products: any[], requested: string): any[] {
  const want = requested.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (!want || !Array.isArray(products)) return products
  const norm = (s: any) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const match: any[] = [], rest: any[] = []
  for (const p of products) {
    const ps = norm(p.store)
    ;(ps && ps.includes(want) ? match : rest).push(p)
  }
  return match.length ? [...match, ...rest] : products
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const filters = body?.filters || {}
  let q = String(body?.q || '').trim()
  const image = body?.image
  const start = Number(body?.start) || 0 // pagination offset for "Cargar más"

  // Image search → vision turns the photo into a query.
  if (!q && image) q = await describeImage(image)

  // A pasted link: a product page → hand off to the product detail page; a store
  // homepage → show that store's catalog (deals first).
  const link = isUrl(q) ? q.trim() : (body?.link ? String(body.link).trim() : null)
  if (link) {
    if (isProductUrl(link)) {
      return { type: 'product', product: { url: link } }
    }
    const feed = await api('/products/store-feed', {
      url: link,
      sale: filters.sale || undefined,
      limit: 24,
    })
    return {
      type: 'results',
      query: link,
      products: feed?.products || [],
      price_range: feed?.price_range || null,
      filters,
    }
  }

  if (!q) return { type: 'results', query: '', products: [], price_range: null, filters }

  const r = await api('/products/search', {
    query: q,
    store: filters.store || undefined,
    min_price: filters.min_price ?? undefined,
    max_price: filters.max_price ?? undefined,
    sale: filters.sale || undefined,
    limit: 40,
    start,
  })

  let products = await reorderByIntent(q, r?.products || [])
  // If the shopper named a specific store, put that store's listings first.
  products = floatRequestedStore(products, detectRequestedStore(q, filters.store))

  return {
    type: 'results',
    query: q,
    products,
    price_range: r?.price_range || null,
    has_more: !!r?.has_more,
    start,
    filters,
  }
})
