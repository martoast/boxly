import { generateObject } from 'ai'
import { z } from 'zod'
import { auxModel, providerOptions, hasModelKey } from './aiProvider'
import { summarize as summarizeCore, SUMMARY_SYSTEM, type SummarizeResult, type ApiCall } from './chatSummaryCore'

/**
 * Per-chat rolling memory — the model-bound entry points. All the logic (cache,
 * transcript rendering, price guard, versioned write) is in ./chatSummaryCore.ts;
 * this file only supplies the aux-model generator.
 */
export { readSummary, summaryBlock, shouldSummarize, summaryEnabled, SUMMARY_MAX_CHARS } from './chatSummaryCore'

const schema = z.object({ summary: z.string().min(1).max(2400) })

/** (previousSummary, transcript) → updated summary, on the cheap aux model (thinking off, 8 s cap). */
export async function generateSummary(previous: string | null, transcript: string): Promise<string> {
  const { object } = await generateObject({
    model: auxModel(),
    schema,
    system: SUMMARY_SYSTEM,
    prompt: `${previous ? `RESUMEN ANTERIOR:\n${previous}\n\n` : 'RESUMEN ANTERIOR: (ninguno)\n\n'}MENSAJES NUEVOS A INTEGRAR:\n${transcript}`,
    providerOptions: providerOptions(),
    abortSignal: AbortSignal.timeout(8000),
  })
  return String(object?.summary || '')
}

/** Fold the next unsummarized turns of a chat into its running summary (fire-and-forget from onFinish). */
export function summarize(conversationId: number, token: string, window: number, api: ApiCall, log?: (line: string) => void): Promise<SummarizeResult> {
  if (!hasModelKey()) return Promise.resolve({ ran: false, folded: 0, chars: 0, reason: 'no_model' })
  return summarizeCore(conversationId, token, window, { api, generate: generateSummary, log })
}
