import { generateObject } from 'ai'
import { z } from 'zod'
import { auxModel, providerOptions, hasModelKey } from './aiProvider'

// The web engines (Google Shopping, Amazon) index ENGLISH titles. The chat model is told to translate the
// shopper's words into English product terms, but the fast production models don't reliably do it —
// "tacos de americano" reached Amazon verbatim and came back as taco shells. So the web backbone translates
// its own query with one cheap aux-model call (~300ms), only when the text looks Spanish, and only on the
// paths that hit the web (a catalog miss, an uncarried store, find_on_google). Falls back to the input.
const SPANISH_HINT = /[áéíóúñ¿¡]|\b(de|para|con|en|del|los|las|una?|unos|unas|que|tenis|tacos|tele|sudadera|playera|pantal[oó]n|zapatos|bolsa|mochila|reloj|audífonos|celular|americano|fútbol|futbol|ni[ñn][oa]s?|hombre|mujer|talla|barat[oa]s?)\b/i
const schema = z.object({ terms: z.string() })

export function looksSpanish(q: string): boolean { return SPANISH_HINT.test(q) }

export async function toEnglishSearchTerms(query: string, { timeoutMs = 2500 } = {}): Promise<string> {
  const q = String(query || '').trim()
  if (!q || !hasModelKey() || !looksSpanish(q)) return q
  try {
    const { object } = await generateObject({
      model: auxModel(),
      schema,
      system: 'You turn a Mexican shopper\'s request into the short ENGLISH search query a US shopping site expects. Keep brand names, model names/numbers, sizes and colors. Translate product words (tacos de americano → football cleats; tenis → sneakers; tele → TV; sudadera → hoodie; playera → t-shirt; audífonos → headphones). Drop intent words (promociones, ofertas, quiero, busco, barato). Output 2–6 words, nothing else.',
      prompt: q,
      providerOptions: providerOptions(),
      abortSignal: AbortSignal.timeout(timeoutMs),
    })
    const t = String(object?.terms || '').replace(/["\n]/g, ' ').replace(/\s+/g, ' ').trim()
    return t && t.length <= 80 ? t : q
  } catch {
    return q
  }
}
