import { generateObject } from 'ai'
import { z } from 'zod'
import { chatModel, providerOptions, hasModelKey } from '../../utils/aiProvider'

/**
 * AI campaign DRAFT — the narrowing/refinement step.
 *   mode 'expand'     : an idea → one full email draft
 *   mode 'variations' : an idea/draft → 3 distinct variations
 *   mode 'refine'     : a draft + a plain-language comment → the tweaked draft
 * Enforces the boxly-campaigns house style (plain text, es-MX informal, ≤50-char
 * subject, single CTA, no fluff/emojis).
 */

const API_BASE = (process.env.API_URL || 'https://api.boxly.mx').replace(/\/$/, '')
const AUDIENCES = ['all', 'has_orders', 'no_orders', 'active_orders', 'expat', 'business', 'shopper'] as const

const draftSchema = z.object({
  name: z.string().describe('Nombre interno corto de la campaña (para el admin, no se envía). Ej: "Prime Day — envío a México".'),
  subject: z.string().describe('Asunto del correo, MÁXIMO 50 caracteres, español de México, sin MAYÚSCULAS gritadas ni emojis.'),
  body: z.string().describe('Cuerpo en TEXTO PLANO, español de México informal ("tú"). 3-5 frases, menos de ~80 palabras. Directo y con gancho. Máximo 2-3 productos o beneficios. SIN saludo largo, SIN firma ni footer (se agregan solos), SIN "haz clic aquí" ni relleno.'),
  cta_text: z.string().describe('Texto del botón, 2-4 palabras. Ej: "Ver ofertas", "Empezar ahora".'),
  cta_url: z.string().describe('UNA sola URL primaria. Usa https://boxly.mx o una ruta relevante (p. ej. https://boxly.mx/app).'),
  audience: z.enum(AUDIENCES).describe('Segmento de audiencia.'),
})

async function getKnowledge(): Promise<string> {
  try {
    const res = await fetch(`${API_BASE}/knowledge`, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(6000) })
    const data = await res.json()
    const md = data?.data?.markdown
    return typeof md === 'string' ? md.slice(0, 4000) : ''
  } catch { return '' }
}

const STYLE = `REGLAS DE ESTILO (obligatorias):
- Español de México, informal ("tú"), nunca "usted".
- Asunto ≤ 50 caracteres, sin MAYÚSCULAS gritadas, sin emojis.
- Cuerpo en texto plano: 3-5 frases, < 80 palabras, con gancho claro. Máximo 2-3 productos/beneficios.
- Un solo CTA. Nada de "no te lo pierdas", "haz clic aquí" ni relleno de marketing.
- No incluyas firma, footer ni "cancelar suscripción" (se agregan automáticamente).`

export default defineEventHandler(async (event) => {
  if (!hasModelKey()) { setResponseStatus(event, 503); return { error: 'not_configured', message: 'Falta la clave de IA en el servidor.' } }

  const body = await readBody(event)
  const mode = ['expand', 'variations', 'refine'].includes(body?.mode) ? body.mode : 'expand'
  const idea = body?.idea || null
  const draft = body?.draft || null
  const comment = String(body?.comment || '').slice(0, 500).trim()
  const guidance = String(body?.guidance || '').slice(0, 600).trim()
  const knowledge = await getKnowledge()

  const kbBlock = knowledge ? `\n\nBASE DE CONOCIMIENTO (datos reales de Boxly — precios, políticas, tiendas):\n${knowledge}` : ''
  const guidanceBlock = guidance ? `\n\nINSTRUCCIONES DE ESTILO DEL ADMIN (síguelas al escribir, sin romper las reglas de estilo): ${guidance}` : ''
  const ideaBlock = idea ? `\nIDEA:\n- Gancho: ${idea.hook}\n- Asunto propuesto: ${idea.subject}\n- Ángulo: ${idea.angle}\n- Por qué ahora: ${idea.why_now}\n- Audiencia: ${idea.audience}` : ''
  const draftBlock = draft ? `\nBORRADOR ACTUAL:\nNombre: ${draft.name}\nAsunto: ${draft.subject}\nCuerpo: ${draft.body}\nCTA: ${draft.cta_text} → ${draft.cta_url}\nAudiencia: ${draft.audience}` : ''

  const system = `Eres el redactor de email marketing de Boxly. Boxly le da a clientes en México una dirección en EE. UU. para comprar en tiendas gringas y se los envía consolidado a su casa; también compra por ellos. Escribes correos que se abren y se leen.\n\n${STYLE}`

  try {
    if (mode === 'variations') {
      const { object } = await generateObject({
        model: chatModel(), providerOptions: providerOptions(),
        schema: z.object({ variations: z.array(draftSchema).min(3).max(3) }),
        system,
        prompt: `Genera 3 VARIACIONES distintas del mismo correo — cada una con un asunto y un ángulo diferente (p. ej. urgencia, beneficio, curiosidad), pero el mismo objetivo.${ideaBlock}${draftBlock}${guidanceBlock}${kbBlock}`,
        abortSignal: AbortSignal.timeout(45000),
      })
      return { variations: object.variations.map(clamp) }
    }

    const instruction = mode === 'refine'
      ? `Aplica este cambio al borrador, manteniendo TODO lo demás igual y respetando el estilo:\n"${comment}"${draftBlock}${guidanceBlock}${kbBlock}`
      : `Escribe el correo completo a partir de esta idea.${ideaBlock}${guidanceBlock}${kbBlock}`
    const { object } = await generateObject({
      model: chatModel(), providerOptions: providerOptions(), schema: draftSchema, system, prompt: instruction,
      abortSignal: AbortSignal.timeout(45000),
    })
    return { draft: clamp(object) }
  } catch (e: any) {
    setResponseStatus(event, 502)
    return { error: 'generation_failed', message: 'No se pudo generar el borrador. Intenta de nuevo.' }
  }
})

function clamp(d: any) {
  return { ...d, subject: (d.subject || '').slice(0, 60), name: (d.name || 'Campaña').slice(0, 120) }
}
