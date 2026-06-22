import { generateText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'

/**
 * Intent classifier for the "smart box that flips". The client decides obvious
 * cases with a heuristic (no network hop) and only calls this for AMBIGUOUS input.
 * Returns whether the message is a product SEARCH or a business QUESTION (chat).
 *
 * Body: { q }
 * Returns: { mode: 'search' | 'chat' }
 */
const PARSE_MODEL = process.env.ANTHROPIC_TITLE_MODEL || 'claude-haiku-4-5-20251001'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const q = String(body?.q || '').trim()

  // No text, or no key → default to search (today's behavior).
  if (!q || !process.env.ANTHROPIC_API_KEY) return { mode: 'search' }

  try {
    const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const { text } = await generateText({
      model: anthropic(PARSE_MODEL),
      system:
        'You classify a message typed into Boxly (a US→Mexico shopping/import service). Decide if it is a PRODUCT SEARCH (the user wants to find/buy a product or names a brand/item, e.g. "owala negro", "nike air force 1", "vestido rojo") or a QUESTION about the business/service (how it works, prices, shipping, account, casillero, payments, etc., e.g. "¿cuánto cobran?", "how long does shipping take?"). Reply with ONLY one word: SEARCH or CHAT.',
      prompt: q,
    })
    return { mode: /chat/i.test(text) ? 'chat' : 'search' }
  } catch {
    return { mode: 'search' }
  }
})
