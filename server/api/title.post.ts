import { generateText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'

/**
 * Generate a short ChatGPT-style thread title from the first exchange.
 * Uses a fast/cheap model; best-effort (returns '' on any failure so the
 * caller just keeps the first-message title).
 */
const TITLE_MODEL = process.env.ANTHROPIC_TITLE_MODEL || 'claude-haiku-4-5-20251001'

export default defineEventHandler(async (event) => {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return { title: '' }

  const body = await readBody(event)
  const user = String(body?.user || '').slice(0, 2000).trim()
  const assistant = String(body?.assistant || '').slice(0, 2000).trim()
  if (!user) return { title: '' }

  const anthropic = createAnthropic({ apiKey: key })

  try {
    const { text } = await generateText({
      model: anthropic(TITLE_MODEL),
      system:
        'You name a chat thread for a US-shopping assistant. Output ONLY a title: 3–6 words, no quotes, no trailing punctuation, in the same language as the user (default Spanish, es-MX). Capture what they want to buy (e.g. "Joggers YoungLA talla M", "Tenis para correr").',
      prompt: `Usuario: ${user}\n\nAsistente: ${assistant}\n\nTítulo:`,
    })
    const title = text
      .replace(/^["'\s]+/, '')
      .replace(/["'\s.]+$/, '')
      .replace(/\s+/g, ' ')
      .slice(0, 60)
    return { title }
  } catch {
    return { title: '' }
  }
})
