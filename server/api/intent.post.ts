import { generateText } from 'ai'
import { auxModel, providerOptions, hasModelKey } from '../utils/aiProvider'

/**
 * Intent classifier for the "smart box that flips". The client decides obvious
 * cases with a heuristic (no network hop) and only calls this for AMBIGUOUS input.
 * Returns whether the message is a product SEARCH or a business QUESTION (chat).
 *
 * Body: { q }
 * Returns: { mode: 'search' | 'chat' }
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const q = String(body?.q || '').trim()

  // No text, or no key → default to search (today's behavior).
  if (!q || !hasModelKey()) return { mode: 'search' }

  try {
    const { text } = await generateText({
      model: auxModel(),
      providerOptions: providerOptions(),
      system:
        'You classify a message typed into Boxly (a US→Mexico shopping/import service). Decide if it is a PRODUCT SEARCH (the user wants to find/buy a product or names a brand/item, e.g. "owala negro", "nike air force 1", "vestido rojo") or a QUESTION about the business/service (how it works, prices, shipping, account, casillero, payments, etc., e.g. "¿cuánto cobran?", "how long does shipping take?"). Reply with ONLY one word: SEARCH or CHAT.',
      prompt: q,
    })
    return { mode: /chat/i.test(text) ? 'chat' : 'search' }
  } catch {
    return { mode: 'search' }
  }
})
