import { generateObject } from 'ai'
import { z } from 'zod'
import { auxModel, providerOptions, hasModelKey } from '../utils/aiProvider'

/**
 * AI "intent map" for the admin dashboard. Takes the query corpus (product
 * searches + business questions) and clusters it into INTENT themes — like
 * understanding what people actually want, not just matching keywords. Shopping
 * themes (by brand/category) vs learning themes (pricing, shipping, casillero…).
 *
 * Returns nodes the dashboard renders as a nodal graph. Admin-only: we forward
 * the caller's cookie so the corpus endpoint (/admin/ai-search/queries) gates it.
 *
 * Body: { days }
 */
const API_BASE = (process.env.API_URL || 'https://api.boxly.mx').replace(/\/$/, '')

// Small in-memory cache so re-opening the dashboard doesn't re-cluster.
const cache = new Map<string, { at: number; data: any }>()
const TTL_MS = 10 * 60_000

const ClusterSchema = z.object({
  clusters: z.array(z.object({
    label: z.string().describe('Short Spanish theme name, e.g. "Botellas Owala", "Precios y comisiones".'),
    intent: z.enum(['shopping', 'learning']),
    emoji: z.string().describe('One emoji for the theme.'),
    queries: z.array(z.string()).describe('The exact query strings from the input that belong to this theme.'),
  })),
})

function hash(s: string): string {
  let h = 0
  for (let i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0 }
  return String(h)
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const days = Number(body?.days) || 30

  // Fetch the corpus, forwarding the admin's identity (cookie/origin/bearer).
  let queries: Array<{ query: string; type: string; c: number }> = []
  try {
    const headers: Record<string, string> = { Accept: 'application/json' }
    const cookie = getHeader(event, 'cookie'); if (cookie) headers.Cookie = cookie
    const origin = getHeader(event, 'origin'); if (origin) headers.Origin = origin
    const authz = getHeader(event, 'authorization'); if (authz) headers.Authorization = authz
    const res = await fetch(`${API_BASE}/admin/ai-search/queries?days=${days}`, { headers, signal: AbortSignal.timeout(12000) })
    const data = await res.json()
    if (res.ok) queries = data?.data?.queries ?? []
  } catch { /* leave empty */ }

  if (!queries.length || !hasModelKey()) {
    return { clusters: [], total: 0, days }
  }

  // Count lookup so the model can't fabricate volumes — it only groups.
  const countOf = new Map(queries.map((q) => [q.query, q.c]))
  const typeOf = new Map(queries.map((q) => [q.query, q.type]))

  // Tolerant resolver: the model often echoes a query back with the "[B] "/"[P] "
  // prefix and/or the " (N)" frequency we showed it (Gemini does this; Claude
  // didn't), so an exact match dropped every query → empty clusters. Normalize
  // both sides (strip tag prefix + trailing count, trim, lowercase) and map back
  // to the canonical query.
  const norm = (s: string) => String(s || '')
    .replace(/^\s*\[[bp]\]\s*/i, '')
    .replace(/\s*\(\d+\)\s*$/, '')
    .trim()
    .toLowerCase()
  const byNorm = new Map(queries.map((q) => [norm(q.query), q]))

  const key = hash(days + '|' + queries.map((q) => `${q.type}:${q.query}:${q.c}`).join('|'))
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data

  try {
    const list = queries.map((q) => `[${q.type === 'question' ? 'P' : 'B'}] ${q.query} (${q.c})`).join('\n')
    const { object } = await generateObject({
      model: auxModel(),
      providerOptions: providerOptions(),
      schema: ClusterSchema,
      system:
        'You organize a US→Mexico shopping assistant\'s query log into an INTENT MAP, the way a search engine understands intent. Each line is tagged [B]=product search or [P]=question, with a frequency. Group them into clear intent themes. [B] searches cluster by WHAT they want to buy (brand or category). [P] questions cluster by TOPIC (precios/comisiones, envíos/tiempos, casillero, pagos, cómo funciona, confianza/seguridad, devoluciones, compras presenciales…). intent="shopping" for buy themes, "learning" for question themes. Use the exact input query strings in each theme\'s queries[]. Aim for 4–9 meaningful themes total; merge tiny ones. Labels and emojis in Spanish/universal.',
      prompt: `Organiza estas consultas en temas de intención:\n\n${list}`,
    })

    const clusters = (object.clusters || [])
      .map((c) => {
        const seen = new Set<string>()
        const items = (c.queries || [])
          .map((raw) => byNorm.get(norm(raw)))            // resolve to the canonical query
          .filter((q): q is { query: string; type: string; c: number } => !!q)
          .filter((q) => !seen.has(q.query) && seen.add(q.query)) // dedupe repeats
          .map((q) => ({ q: q.query, c: q.c, type: q.type }))
          .sort((a, b) => b.c - a.c)
        return { label: c.label, intent: c.intent, emoji: c.emoji || '•', total: items.reduce((s, i) => s + i.c, 0), queries: items }
      })
      .filter((c) => c.queries.length)
      .sort((a, b) => b.total - a.total)

    const total = clusters.reduce((s, c) => s + c.total, 0)
    const out = { clusters, total, days }
    cache.set(key, { at: Date.now(), data: out })
    return out
  } catch (e) {
    console.error('[intent-map] error:', e instanceof Error ? e.message : e)
    return { clusters: [], total: 0, days }
  }
})
