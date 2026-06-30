/**
 * "Intent map" for the admin dashboard — a SIMPLE, code-only grouping of the
 * query corpus (no AI, no tokens). This is just a visualization; the real
 * sentiment/intent analysis is a separate offline job, not this screen.
 *
 *  - Product searches ([B]) cluster by their dominant brand/category keyword
 *    (uni- and bi-grams, ranked by total frequency).
 *  - Questions ([P]) cluster by topic via a small keyword map (precios, envíos,
 *    casillero, pagos, aduana, devoluciones, presencial, cómo funciona…).
 *
 * Admin-only: we forward the caller's cookie so the corpus endpoint
 * (/admin/ai-search/queries) gates it.
 *
 * Body: { days }
 */
const API_BASE = (process.env.API_URL || 'https://api.boxly.mx').replace(/\/$/, '')

type Q = { query: string; type: string; c: number }

// Strip accents/punctuation, lowercase, collapse whitespace.
const normTxt = (s: string) => String(s || '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

// Generic shopping words that make poor cluster labels — drop them as keywords
// (we want brand/category nouns like "nike", "leggings", "hiking", not "busco").
const SHOP_STOP = new Set([
  'busco', 'buscar', 'quiero', 'ver', 'comprar', 'compra', 'necesito', 'dame', 'muestra', 'enseñame', 'ensename',
  'para', 'con', 'sin', 'del', 'las', 'los', 'una', 'unos', 'unas', 'que', 'por', 'mas', 'muy',
  'and', 'the', 'for', 'with', 'new', 'best', 'top', 'cheap', 'good', 'size', 'talla', 'color',
  'hombre', 'mujer', 'men', 'women', 'mens', 'womens', 'unisex', 'dama', 'caballero', 'nino', 'nina', 'kids', 'baby',
  'barato', 'barata', 'original', 'originales', 'nuevo', 'nueva', 'marca', 'tipo', 'estilo',
  'sport', 'sports', 'deportivo', 'deportiva', 'deportivos', 'deportivas',
])

const tokensOf = (q: string) => normTxt(q).split(' ').filter((t) => t.length >= 3 && !/^\d/.test(t) && !SHOP_STOP.has(t))

const titleCase = (s: string) => s.replace(/\b\w/g, (m) => m.toUpperCase())

// Tiny keyword → emoji palette so shopping clusters read at a glance. Falls back
// to the shopping bag. Purely cosmetic.
const SHOP_EMOJI: Array<[RegExp, string]> = [
  [/zapat|tenis|shoe|sneaker|calzado|boot|bota/, '👟'],
  [/hiking|senderismo|trail|outdoor|camping/, '🥾'],
  [/legging|ropa|shirt|hoodie|playera|camis|polo|pant|short|jacket|chamarra|sudader|set/, '👕'],
  [/bolsa|bag|mochila|backpack|cartera|purse|wallet/, '👜'],
  [/termo|botella|bottle|owala|stanley|cup|vaso/, '💧'],
  [/reloj|watch|smartwatch/, '⌚'],
  [/audifon|headphone|airpod|earbud|bocina|speaker/, '🎧'],
  [/perfum|fragran|colonia/, '🧴'],
  [/maquillaje|makeup|beauty|skincare|cosmet/, '💄'],
]
const shopEmoji = (label: string) => {
  const l = normTxt(label)
  for (const [re, e] of SHOP_EMOJI) if (re.test(l)) return e
  return '🛍️'
}

// Question topics — first match wins; keywords are accent-insensitive substrings.
const TOPICS: Array<{ label: string; emoji: string; kw: string[] }> = [
  { label: 'Precios y comisiones', emoji: '💲', kw: ['precio', 'cuesta', 'costo', 'comision', 'cobran', 'tarifa', 'cargo', 'cuanto vale', 'price', 'fee'] },
  { label: 'Envíos y tiempos', emoji: '🚚', kw: ['envio', 'enviar', 'tarda', 'llega', 'llegar', 'tiempo', 'dias', 'entrega', 'rastreo', 'tracking', 'shipping'] },
  { label: 'Casillero / dirección US', emoji: '📦', kw: ['casillero', 'direccion', 'address', 'bodega', 'almacen', 'suite', 'locker'] },
  { label: 'Pagos y métodos', emoji: '💳', kw: ['pago', 'pagar', 'tarjeta', 'transferencia', 'oxxo', 'paypal', 'deposito', 'card', 'spei'] },
  { label: 'Aduana e impuestos', emoji: '🛂', kw: ['aduana', 'impuesto', 'iva', 'arancel', 'customs', 'tax', 'declarar'] },
  { label: 'Devoluciones y garantía', emoji: '↩️', kw: ['devol', 'reembolso', 'return', 'garantia', 'cambio'] },
  { label: 'Compras presenciales', emoji: '🏬', kw: ['presencial', 'las americas', 'outlet', 'en persona', 'tienda fisica'] },
  { label: 'Cómo funciona / confianza', emoji: '❓', kw: ['como funciona', 'seguro', 'confiab', 'legit', 'es real', 'estafa', 'funciona', 'how'] },
]

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const days = Number(body?.days) || 30

  // Fetch the corpus, forwarding the admin's identity (cookie/origin/bearer).
  let queries: Q[] = []
  try {
    const headers: Record<string, string> = { Accept: 'application/json' }
    const cookie = getHeader(event, 'cookie'); if (cookie) headers.Cookie = cookie
    const origin = getHeader(event, 'origin'); if (origin) headers.Origin = origin
    const authz = getHeader(event, 'authorization'); if (authz) headers.Authorization = authz
    const res = await fetch(`${API_BASE}/admin/ai-search/queries?days=${days}`, { headers, signal: AbortSignal.timeout(12000) })
    const data = await res.json()
    if (res.ok) queries = data?.data?.queries ?? []
  } catch { /* leave empty */ }

  if (!queries.length) return { clusters: [], total: 0, days }

  const searches = queries.filter((q) => q.type !== 'question')
  const questions = queries.filter((q) => q.type === 'question')

  // ---- Shopping clusters: dominant keyword (uni/bi-gram) by frequency ----
  // Build candidate keywords with the set of search indices they appear in and
  // their total weight (sum of frequencies). Bigrams get a small bonus so brand
  // phrases ("new balance", "air max") beat their component words.
  type Cand = { key: string; bigram: boolean; docs: Set<number>; w: number }
  const cands = new Map<string, Cand>()
  const add = (key: string, idx: number, c: number, bigram: boolean) => {
    let e = cands.get(key)
    if (!e) { e = { key, bigram, docs: new Set(), w: 0 }; cands.set(key, e) }
    e.docs.add(idx); e.w += c
  }
  searches.forEach((q, idx) => {
    const ts = tokensOf(q.query)
    for (const t of new Set(ts)) add(t, idx, q.c, false)
    for (let k = 0; k < ts.length - 1; k++) add(`${ts[k]} ${ts[k + 1]}`, idx, q.c, true)
  })
  const score = (e: Cand) => e.w * (e.bigram ? 1.4 : 1)
  const seeds = [...cands.values()]
    .filter((e) => e.docs.size >= 2) // a theme needs at least 2 distinct queries
    .sort((a, b) => score(b) - score(a) || b.docs.size - a.docs.size)

  const assigned = new Set<number>()
  const shopGroups: Array<{ label: string; emoji: string; items: Q[] }> = []
  for (const e of seeds) {
    if (shopGroups.length >= 8) break
    const idxs = [...e.docs].filter((i) => !assigned.has(i))
    if (idxs.length < 2) continue
    idxs.forEach((i) => assigned.add(i))
    shopGroups.push({ label: titleCase(e.key), emoji: shopEmoji(e.key), items: idxs.map((i) => searches[i]) })
  }
  const leftoverShop = searches.filter((_, i) => !assigned.has(i))
  if (leftoverShop.length) shopGroups.push({ label: 'Otros productos', emoji: '🛍️', items: leftoverShop })

  // ---- Question clusters: topic keyword map ----
  const qGroups = new Map<string, { label: string; emoji: string; items: Q[] }>()
  const other = { label: 'Otras preguntas', emoji: '💬', items: [] as Q[] }
  for (const q of questions) {
    const n = normTxt(q.query)
    const topic = TOPICS.find((t) => t.kw.some((k) => n.includes(k)))
    if (!topic) { other.items.push(q); continue }
    let g = qGroups.get(topic.label)
    if (!g) { g = { label: topic.label, emoji: topic.emoji, items: [] }; qGroups.set(topic.label, g) }
    g.items.push(q)
  }
  const questionGroups = [...qGroups.values()]
  if (other.items.length) questionGroups.push(other)

  // ---- Assemble ----
  const build = (g: { label: string; emoji: string; items: Q[] }, intent: 'shopping' | 'learning') => ({
    label: g.label,
    intent,
    emoji: g.emoji,
    total: g.items.reduce((s, i) => s + i.c, 0),
    queries: g.items.map((i) => ({ q: i.query, c: i.c, type: i.type })).sort((a, b) => b.c - a.c),
  })

  const clusters = [
    ...shopGroups.map((g) => build(g, 'shopping')),
    ...questionGroups.map((g) => build(g, 'learning')),
  ]
    .filter((c) => c.queries.length)
    .sort((a, b) => b.total - a.total)

  const total = clusters.reduce((s, c) => s + c.total, 0)
  return { clusters, total, days }
})
