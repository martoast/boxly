import { generateObject } from 'ai'
import { z } from 'zod'
import { chatModel, providerOptions, hasModelKey } from '../../utils/aiProvider'

/**
 * AI campaign IDEAS — the research step.
 *
 * Grounds the ideas on what's actually happening RIGHT NOW so the first suggestions
 * are real, not generic: today's exact date + a MX/US retail calendar, live web
 * research (SerpAPI) for current deals at the stores customers shop, the Boxly
 * knowledge base, and the admin's past campaigns (voice + what got opens).
 *
 * The client (admin, already authed) passes past campaigns; this route fetches the
 * PUBLIC knowledge base and web-search endpoints itself, so no server-side admin
 * auth is needed.
 */

const API_BASE = (process.env.API_URL || 'https://api.boxly.mx').replace(/\/$/, '')
const AUDIENCES = ['all', 'has_orders', 'no_orders', 'active_orders', 'expat', 'business', 'shopper'] as const

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
// Rough MX + US retail calendar by month (1-12). The model reasons over the current
// + adjacent months; live web research confirms exact dates of the moving ones.
const CALENDAR: Record<number, string[]> = {
  1: ['Cuesta de enero (arranque de año, presupuestos ajustados)', 'rebajas de fin de temporada invierno en EE. UU.'],
  2: ['San Valentín (14 feb)', "Presidents' Day sales en EE. UU. (fin de feb)"],
  3: ['inicio de primavera', 'spring sales'],
  4: ['Semana Santa / Easter', 'ofertas de primavera'],
  5: ['Día de las Madres MX (10 may)', 'Hot Sale MX (venta online enorme, mediados/fin de mayo)', 'Memorial Day sales EE. UU. (fin de mayo)'],
  6: ["Día del Padre / Father's Day", 'inicio de verano, rebajas de temporada'],
  7: ['Amazon Prime Day (mediados de julio, la venta más grande del verano)', 'summer sales', 'arranca back-to-school'],
  8: ['Regreso a clases / back-to-school (pico de compras)', 'tax-free weekends en EE. UU.'],
  9: ['Fiestas Patrias MX (16 sep)', 'Labor Day sales EE. UU. (inicio de sep)'],
  10: ['Amazon Prime Big Deal Days (inicio de octubre)', 'Halloween', 'Día de Muertos'],
  11: ['El Buen Fin MX (mediados de nov, el más grande de México)', 'Black Friday y Cyber Monday (fin de nov)', 'Thanksgiving'],
  12: ['Navidad y compras decembrinas (pico del año)', 'Guadalupe-Reyes', 'cierre de año / últimas fechas para llegar a tiempo'],
}
async function getKnowledge(): Promise<string> {
  try {
    const res = await fetch(`${API_BASE}/knowledge`, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(6000) })
    const data = await res.json()
    const md = data?.data?.markdown
    return typeof md === 'string' ? md.slice(0, 6000) : ''
  } catch { return '' }
}

// Ask a fast model what to Google RIGHT NOW to catch the deal of the moment. It
// picks the stores (from the knowledge base + what it knows) and the timely events,
// so the queries are intelligent and current — never hardcoded.
async function planQueries(dateEn: string, nearMoments: string[], knowledge: string): Promise<string[]> {
  const fallback = [`best US online store deals right now ${dateEn}`]
  try {
    const { object } = await generateObject({
      model: chatModel(),
      providerOptions: providerOptions(),
      schema: z.object({ queries: z.array(z.string()).min(1).max(4) }),
      system: 'You plan Google searches to find the best US retail deals happening RIGHT NOW, for Boxly, a service that ships US purchases to customers in Mexico.',
      prompt: `Today is ${dateEn}. Based on the date, what's seasonally likely right now (${nearMoments.join('; ')}), and the stores/brands Boxly customers actually shop (infer them from the knowledge base below plus your own knowledge of the biggest US stores), write 2-4 SHORT, SPECIFIC Google search queries IN ENGLISH to surface the best current sales/deals to build an email campaign around. Name specific stores and live sale events (e.g. "Prime Day", "back to school") and include the current month + year. No generic filler.\n\nKNOWLEDGE BASE (Boxly's stores/policies):\n${knowledge.slice(0, 3000)}`,
      abortSignal: AbortSignal.timeout(15000),
    })
    const qs = (object.queries || []).map((s) => String(s).trim()).filter(Boolean).slice(0, 4)
    return qs.length ? qs : fallback
  } catch { return fallback }
}

// One SerpAPI organic search via the public Boxly endpoint. Returns brief snippets.
async function webSearch(query: string): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE}/products/web-search`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query, num: 5 }), signal: AbortSignal.timeout(12000),
    })
    const data = await res.json()
    const results = data?.data?.results || data?.results || []
    return (Array.isArray(results) ? results : []).slice(0, 4)
      .map((r: any) => `• ${r.title || ''} — ${r.snippet || ''}`.trim()).filter((s: string) => s.length > 4)
  } catch { return [] }
}

export default defineEventHandler(async (event) => {
  if (!hasModelKey()) { setResponseStatus(event, 503); return { error: 'not_configured', message: 'Falta la clave de IA en el servidor.' } }

  const body = await readBody(event)
  const past = (Array.isArray(body?.pastCampaigns) ? body.pastCampaigns : []).slice(0, 20)
  const hint = String(body?.guidance || body?.hint || '').slice(0, 600).trim()

  const now = new Date()
  const m = now.getMonth() + 1
  const dateStr = now.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const dateEn = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const nearMoments = [...(CALENDAR[m] || []), ...(CALENDAR[(m % 12) + 1] || [])]
  const knowledge = await getKnowledge()

  // 1) Searches: use the admin's own queries if they steered them; otherwise the
  //    AI PLANS them (smart, current, store-aware — not hardcoded).
  const custom = Array.isArray(body?.queries) ? body.queries.map((s: any) => String(s).trim()).filter(Boolean).slice(0, 5) : []
  const queries = custom.length ? custom : await planQueries(dateEn, nearMoments, knowledge)
  // 2) Run them through Google (SerpAPI, cached).
  const researchArrays = await Promise.all(queries.map(webSearch))
  const research = Array.from(new Set(researchArrays.flat())).slice(0, 14).join('\n')

  const pastBlock = past.length
    ? past.map((c: any) => `- "${c.subject}" (audiencia: ${c.audience}; abrió ${c.open_rate ?? '?'}%, click ${c.click_rate ?? '?'}%)`).join('\n')
    : '(sin campañas pasadas)'

  const schema = z.object({
    moment: z.string().describe('El momento comercial que detectaste AHORA, con fecha si aplica. Ej: "Amazon Prime Day — 8-9 de julio" o "Regreso a clases + Hot Sale". 1 línea.'),
    ideas: z.array(z.object({
      hook: z.string().describe('Etiqueta corta del gancho temporal, 2-4 palabras. Ej: "Prime Day", "Regreso a clases", "Buen Fin".'),
      subject: z.string().describe('Asunto del correo, MÁXIMO 50 caracteres, español de México, minúsculas ok, sin MAYÚSCULAS gritadas ni emojis.'),
      angle: z.string().describe('El concepto de la campaña en 1-2 frases: qué comunica y por qué conecta.'),
      why_now: z.string().describe('Por qué es oportuno HOY — cita el dato real (una venta activa, la fecha, la temporada). Aterrizado en la investigación, no genérico.'),
      audience: z.enum(AUDIENCES).describe('Segmento sugerido.'),
      cta_text: z.string().describe('Texto del botón, 2-4 palabras. Ej: "Ver ofertas".'),
    })).min(4).max(6),
  })

  const system = `Eres el estratega de email marketing de Boxly. Boxly le da a clientes en México una dirección en EE. UU. para comprar en tiendas gringas y se los enviamos a su casa consolidado en una caja; también compramos por ellos (compra asistida). Tu trabajo: proponer ideas de campañas de correo que aprovechen lo que está pasando AHORA.

REGLAS DE ESTILO (obligatorias):
- Español de México, informal ("tú"), sin "usted".
- Asunto ≤ 50 caracteres, sin MAYÚSCULAS gritadas, sin emojis, sin "no te lo pierdas" / "haz clic aquí".
- Cada idea debe estar ATERRIZADA en algo real y oportuno: una venta activa (Prime Day, Hot Sale, Buen Fin, Black Friday…), la temporada, o una fecha próxima. Usa la fecha de hoy, el calendario y la investigación web. NADA genérico.
- Varía los ángulos y los segmentos de audiencia entre ideas.`

  const prompt = `HOY ES: ${dateStr}.

MOMENTOS DEL CALENDARIO CERCA DE HOY:
${nearMoments.map((s) => '- ' + s).join('\n')}

INVESTIGACIÓN WEB (ofertas/eventos reales de este momento):
${research || '(sin resultados de investigación)'}

CAMPAÑAS PASADAS DE BOXLY (voz + qué funcionó):
${pastBlock}

BASE DE CONOCIMIENTO (qué es Boxly, políticas, tiendas):
${knowledge ? knowledge.slice(0, 4000) : '(no disponible)'}
${hint ? `\nENFOQUE PEDIDO POR EL ADMIN: ${hint}` : ''}

Genera de 4 a 6 ideas de campaña, aterrizadas en lo que está pasando AHORA.`

  try {
    const { object } = await generateObject({
      model: chatModel(),
      schema,
      system,
      prompt,
      providerOptions: providerOptions(),
      abortSignal: AbortSignal.timeout(50000),
    })
    return {
      moment: object.moment,
      ideas: (object.ideas || []).map((i) => ({ ...i, subject: (i.subject || '').slice(0, 60) })),
      researched: research.split('\n').filter(Boolean).length,
      queries, // the AI-planned searches it actually ran (for transparency in the UI)
      date: dateStr,
    }
  } catch (e: any) {
    setResponseStatus(event, 502)
    return { error: 'generation_failed', message: 'No se pudieron generar ideas. Intenta de nuevo.' }
  }
})
