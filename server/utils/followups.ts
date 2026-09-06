import { generateObject } from 'ai'
import { z } from 'zod'
import { auxModel, providerOptions, hasModelKey } from './aiProvider'
export { followupPart, followupsWithin, attachFollowupChips } from './followupChips'

/**
 * Follow-up chips ("Búscame un sports bra que combine…") generated OFF the main
 * agent loop.
 *
 * WHY: the normal product turn used to be three model round-trips — the gallery
 * tool, then `suggest_followups` as its own step, then the closing text. The chips
 * only need the question and the gallery that just rendered, so they are produced
 * here by the cheap aux model IN PARALLEL with the model's recommendation text, and
 * attached to the same assistant message (as a `tool-suggest_followups` part, the
 * exact shape the UI already renders) right before the stream finishes. The main
 * answer is now two round-trips; the chips' UX is unchanged.
 *
 * Fails soft: any error/timeout → no chips this turn (never blocks the reply).
 */

const schema = z.object({
  suggestions: z.array(z.string().min(3).max(90)).min(1).max(3),
})

// Mirrors the FOLLOW-UPS rule of the concierge prompt (cross-sell / build the set).
const SYSTEM = `Eres el asistente de compras de Boxly (México compra en EE. UU.). Acabas de mostrar una galería de productos. Escribe de 1 a 3 mensajes CORTOS, en primera persona, listos para que el cliente los toque y envíe (español de México, tuteo, sin comillas, sin emojis, máximo 9 palabras).
PRIORIZA piezas COMPLEMENTARIAS a lo mostrado (tenis para correr → calcetines/short/playera; leggings → sports bra a juego, luego top o hoodie; vestido → bolsa o chamarra). También puedes ofrecer otro color/variante, un filtro más preciso ("Solo talla M", "Solo Nike") o UNA marca cercana con buenas ofertas (gym → YoungLA, Gymshark, Alo, Lululemon; casual → American Eagle, Hollister, Abercrombie; tenis → New Balance, Adidas, Hoka, On; outdoor → Patagonia, The North Face, Columbia; hidratación → Owala, Stanley, Hydro Flask).
Sé específico a lo que se pidió y a lo que se mostró; nunca genérico como "ver más". Ejemplos: "Búscame calcetines deportivos que combinen", "Muéstrame un top que haga juego", "Ver más opciones en negro".`

export interface FollowupInput {
  question: string
  products: any[]
  store?: string
  timeoutMs?: number
}

export async function generateFollowups({ question, products, store, timeoutMs = 2500 }: FollowupInput): Promise<string[]> {
  if (!hasModelKey() || !Array.isArray(products) || products.length === 0) return []
  try {
    const list = products.slice(0, 8)
      .map((p: any, i: number) => `${i + 1}. ${String(p?.title || '').slice(0, 80)}${p?.store ? ` — ${p.store}` : ''}${p?.on_sale ? ' (oferta)' : ''}`)
      .join('\n')
    const { object } = await generateObject({
      model: auxModel(),
      schema,
      system: SYSTEM,
      prompt: `Lo que pidió el cliente: "${String(question || '').slice(0, 300)}"${store ? `\nTienda/marca en foco: ${store}` : ''}\n\nGalería mostrada:\n${list}`,
      providerOptions: providerOptions(),
      abortSignal: AbortSignal.timeout(timeoutMs),
    })
    return (object?.suggestions || []).map((s) => String(s).trim()).filter(Boolean).slice(0, 3)
  } catch {
    return []
  }
}
