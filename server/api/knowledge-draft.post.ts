import { generateObject } from 'ai'
import { z } from 'zod'
import { auxModel, providerOptions, hasModelKey } from '../utils/aiProvider'

/**
 * Admin knowledge-base authoring assistant.
 *
 * The admin types a plain-language IDEA ("explica cuánto tarda el cruce a México
 * y que mandamos foto") and this returns a clean, ready-to-save wiki article
 * { title, section, content } that the admin reviews and saves through the normal
 * CRUD. It is a WRITING assistant, not a fact source: it may only use facts that
 * already live in the knowledge base or that the admin gave in the idea — for any
 * missing specific (a price, a date, an address) it inserts a visible
 * [por confirmar] placeholder instead of inventing one, because this base IS the
 * AI assistant's brain and a hallucinated number would be served to customers.
 *
 * We feed it the current knowledge base so it matches the house style, reuses the
 * REAL facts already documented (warehouse address, box prices, timeframes), picks
 * an existing section when one fits, and doesn't contradict what's already there.
 */

const API_BASE = (process.env.API_URL || 'https://api.boxly.mx').replace(/\/$/, '')

const schema = z.object({
  title: z.string().describe('Título corto y claro del artículo, en español (es-MX), redactado como lo buscaría un cliente. Ej: "¿Cuánto tarda el envío a México?". Sin markdown, sin comillas.'),
  section: z.string().describe('La sección a la que pertenece. REUTILIZA una de las secciones existentes cuando encaje (te las damos); si de verdad ninguna aplica, propón una corta. Solo el nombre, ej: "Envíos", "Precios", "General".'),
  content: z.string().describe('El CUERPO del artículo en Markdown (español es-MX). NO incluyas el título como encabezado (# o ##) — el sistema ya lo agrega. Empieza directo con la explicación. Usa párrafos cortos, subtítulos con ###, listas con viñetas y **negritas** en los datos clave. Sé concreto y completo pero sin relleno.'),
})

// Pull the current assembled knowledge base for context (style + real facts +
// existing sections). Best-effort and capped so the prompt stays cheap.
async function currentKnowledge(): Promise<string> {
  try {
    const res = await fetch(`${API_BASE}/knowledge`, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(5000) })
    const data = await res.json()
    const md = data?.data?.markdown
    return typeof md === 'string' ? md.slice(0, 8000) : ''
  } catch {
    return ''
  }
}

const SYSTEM = `Eres el editor de la BASE DE CONOCIMIENTO de Boxly — el "cerebro" del asistente de IA que atiende a clientes en México. Boxly reenvía y consolida paquetes de tiendas de Estados Unidos a México, y también compra por el cliente (compra asistida).

Tu trabajo: a partir de una IDEA que te da el administrador, redactar UN artículo de la base de conocimiento, limpio y listo para publicar.

REGLAS INQUEBRANTABLES:
- NO INVENTES datos específicos. Precios, plazos exactos, direcciones, comisiones, porcentajes, requisitos legales: úsalos SOLO si aparecen en la base de conocimiento actual (te la doy abajo) o en la idea del administrador. Si falta un dato específico, escribe un marcador visible como **[por confirmar]** en su lugar. Un número inventado se le diría a un cliente real — nunca lo hagas.
- Reutiliza los HECHOS que ya están documentados (dirección de bodega, precios de cajas, tiempos) y no los contradigas.
- Escribe en español claro de México (es-MX), tono cercano y profesional, en segunda persona ("tú").
- Markdown: empieza directo con el contenido (sin encabezado de título). Usa ### para subtítulos, viñetas y **negritas** en los datos clave. Conciso, sin relleno de marketing.
- Elige una SECCIÓN reutilizando las existentes cuando encaje.

Si el administrador te da un artículo existente para mejorar, consérvalo y expándelo/púlelo con la idea como guía, sin perder los hechos que ya tenía.`

export default defineEventHandler(async (event) => {
  if (!hasModelKey()) {
    setResponseStatus(event, 503)
    return { error: 'not_configured', message: 'Falta la clave del proveedor de IA en el servidor.' }
  }

  const body = await readBody(event)
  const idea = String(body?.idea || '').slice(0, 4000).trim()
  const currentTitle = String(body?.currentTitle || '').slice(0, 200).trim()
  const currentContent = String(body?.currentContent || '').slice(0, 8000).trim()
  const sections: string[] = Array.isArray(body?.sections)
    ? body.sections.map((s: any) => String(s)).filter(Boolean).slice(0, 40)
    : []

  if (!idea) {
    setResponseStatus(event, 400)
    return { error: 'missing_idea', message: 'Escribe una idea para generar el artículo.' }
  }

  const knowledge = await currentKnowledge()

  const existing = currentContent
    ? `\n\nARTÍCULO EXISTENTE A MEJORAR:\nTítulo: ${currentTitle || '(sin título)'}\nContenido:\n${currentContent}`
    : ''
  const sectionsBlock = sections.length ? `\n\nSECCIONES EXISTENTES (reutiliza una si encaja): ${sections.join(', ')}` : ''
  const kbBlock = knowledge
    ? `\n\n=== BASE DE CONOCIMIENTO ACTUAL (para estilo y HECHOS reales; no la contradigas) ===\n${knowledge}\n=== FIN ===`
    : ''

  try {
    const { object } = await generateObject({
      model: auxModel(),
      schema,
      system: SYSTEM,
      prompt: `IDEA DEL ADMINISTRADOR:\n${idea}${existing}${sectionsBlock}${kbBlock}\n\nRedacta el artículo.`,
      providerOptions: providerOptions(),
      abortSignal: AbortSignal.timeout(30000),
    })
    return {
      title: (object?.title || '').trim().slice(0, 200),
      section: (object?.section || '').trim().slice(0, 120),
      content: (object?.content || '').trim(),
    }
  } catch (e: any) {
    setResponseStatus(event, 502)
    return { error: 'generation_failed', message: 'La IA no pudo generar el artículo. Intenta de nuevo.' }
  }
})
