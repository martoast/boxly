import { generateObject } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'

/**
 * Smart gallery curation — ONE model pass that does all the JUDGMENT, wrapped in
 * deterministic guardrails that enforce the PROMISES.
 *
 * The model (Haiku) reads the shopper's natural-language query (often Spanish)
 * and the raw product list, then returns:
 *   - order: the items re-ranked best-first — genuine matches (right color,
 *     attribute, type) from trustworthy sellers up top, clear mismatches last.
 *   - store: the specific retailer/brand the shopper explicitly asked for
 *     ("el owala rosa DE TARGET" → "Target"), or "" if none.
 *
 * Code then GUARANTEES the things that must be certain (a model occasionally
 * drops or mis-orders): every item is kept exactly once, and if a store was
 * requested (by the model from the query, or passed in by the caller) its
 * listings are floated to the very top — that promise is never left to chance.
 *
 * Best-effort: any failure returns the original order, still honoring a
 * caller-supplied store float. Replaces the old rankProducts()/reorderByIntent()
 * + hardcoded retailer list.
 */
const CURATE_MODEL =
  process.env.ANTHROPIC_RANK_MODEL || process.env.ANTHROPIC_TITLE_MODEL || 'claude-haiku-4-5-20251001'

const SYSTEM = `You curate a US shopping gallery for a Boxly customer in Mexico. You are given the shopper's query and a numbered list of product results. Return how to present them.

1) order — every item index exactly once, best-first. Rank by, in priority:
   a) MATCH to the query's specifics, ESPECIALLY color and attributes. The query may be Spanish (rosa=pink, azul=blue, negro=black, verde=green, morado/lila=purple, gris=gray, blanco=white, rojo=red, amarillo=yellow, naranja=orange, café/marrón=brown). Decode marketing color names with product knowledge (e.g. "Misty Meadows"=teal/green, "Sugar Spice"=pink, "Blossom Bunny"=pink, "Rose Quartz"=pink). Items that clearly DON'T match (wrong color, wrong item type) go LAST — but NEVER omit them; include every index.
   b) TRUSTWORTHY seller — big-box/department retailers (Target, Walmart, Best Buy, Costco, Macy's, Nordstrom…) and recognized brand stores (Nike, Adidas, Lululemon, Stanley, Owala…) ABOVE tiny unknown niche resellers and random marketplace third-parties.
   c) a good price/deal — tiebreaker only, never the main factor.

2) store — if the shopper explicitly named a store/retailer/brand to buy FROM (e.g. "de Target", "from Walmart", "en Costco", "el de Nike"), return that store's name. Otherwise return "". Return the RETAILER they want to buy from, not the product's brand if they're different (in "owala rosa de Target", the store is "Target", not "Owala").`

const schema = z.object({
  store: z.string().describe('The store/retailer the shopper asked to buy from, or "" if none was named.'),
  order: z.array(z.number().int()).describe('Item indices, best-first, each index exactly once.'),
})

// Stable-float products whose store matches the requested one. Deterministic —
// the requested store always wins over a cheaper / "more trusted" competing seller.
export function floatRequestedStore(products: any[], requested?: string): any[] {
  const want = String(requested || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  if (!want || !Array.isArray(products)) return products
  const norm = (s: any) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const match: any[] = [], rest: any[] = []
  for (const p of products) {
    const ps = norm(p.store)
    ;(ps && ps.includes(want) ? match : rest).push(p)
  }
  return match.length ? [...match, ...rest] : products
}

// Apply a model-provided index order, keeping EVERY product exactly once
// (dedupe the model's indices, then append anything it dropped).
function applyOrder(products: any[], idx: number[]): any[] {
  const seen = new Set<number>()
  const order: number[] = []
  for (const n of idx) if (n >= 0 && n < products.length && !seen.has(n)) { seen.add(n); order.push(n) }
  for (let i = 0; i < products.length; i++) if (!seen.has(i)) order.push(i)
  return order.length === products.length ? order.map((i) => products[i]) : products
}

export async function curateProducts(
  query: string,
  products: any[],
  opts: { store?: string } = {},
): Promise<any[]> {
  if (!Array.isArray(products) || products.length === 0) return products
  // Too few to bother the model — just honor any caller-supplied store.
  if (products.length < 3 || !process.env.ANTHROPIC_API_KEY) {
    return floatRequestedStore(products, opts.store)
  }
  try {
    const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const list = products
      .map((p, i) => `${i}: ${(p.title || '').slice(0, 90)} — ${p.store || '?'}${p.price ? ` — $${p.price}` : ''}${p.on_sale ? ' (oferta)' : ''}`)
      .join('\n')
    const { object } = await generateObject({
      model: anthropic(CURATE_MODEL),
      schema,
      system: SYSTEM,
      prompt: `Query: "${query}"\n\nItems:\n${list}`,
    })
    const ordered = applyOrder(products, object?.order || [])
    // Code enforces the store promise: caller-supplied store (the chat tool's
    // explicit param) wins; otherwise use what the model extracted from the query.
    return floatRequestedStore(ordered, opts.store || object?.store)
  } catch {
    return floatRequestedStore(products, opts.store)
  }
}
