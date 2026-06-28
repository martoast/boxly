import { generateText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { curateProducts } from '../utils/curate'

/**
 * Smart search backend for the search-first shopping flow.
 *
 * Accepts natural language, a link, or an image and returns ranked products.
 * The AI is an invisible "smart search" brain here, not a chat: vision turns a
 * photo into a query, and curateProducts() (server/utils/curate.ts) does one
 * pass over the raw results — relevance + color/attribute match + trust ranking,
 * and extracts any store the shopper named so we can float it to the top.
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

  // One smart pass: relevance + color/attribute match + trust ranking, plus the
  // model extracts any named store from the free-text query; code then floats it
  // (an explicit store filter, if set, wins over what the model inferred).
  const products = await curateProducts(q, r?.products || [], { store: filters.store })

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
