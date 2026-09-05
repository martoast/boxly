// Model speed benchmark for the Boxly chat. Runs the SAME agentic shape the real
// assistant uses — a sizeable system prompt + a search_products tool (stubbed to
// return instantly, so we measure the MODEL, not the catalog) + a Spanish product
// query — across every provider whose key is set, and reports time-to-first-token
// and total time. Goal: find a model that lands near ~2s.
//
//   node --env-file=.env bench_models.mjs
import { streamText, tool, stepCountIs } from 'ai'
import { z } from 'zod'
import { createOpenAI } from '@ai-sdk/openai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createAnthropic } from '@ai-sdk/anthropic'

// A representative system prompt — trimmed from the real one but instruction-dense,
// so relative model speeds are meaningful. (Prod's is larger; absolute numbers there
// run a touch higher, but the RANKING between models holds.)
const SYSTEM = `You are the BOXLY CONCIERGE — a warm, expert shopping assistant helping customers in Mexico buy from US stores. The conversation is the product: help like a great sales rep, find the right thing, and drive to a purchase request.
When the customer wants products, SEARCH IMMEDIATELY: open with ONE short friendly line, then call search_products in the SAME turn. Put the product TYPE in category, the brand in store, budget in min_price/max_price, deal depth in min_discount, ordering in sort; leave only color/fit/material in query. Deals lead automatically. After the gallery, write one short line inviting the next step and keep them adding items to their Boxly box. Never dump JSON or a product list as text — the gallery renders itself. Answer in es-MX, concise and friendly.`.repeat(3)

const TOOL = {
  search_products: tool({
    description: 'Search the Boxly catalog. category, store, min_price, max_price, min_discount, sort, query.',
    inputSchema: z.object({
      query: z.string().optional(), store: z.string().optional(), category: z.string().optional(),
      min_price: z.number().optional(), max_price: z.number().optional(), min_discount: z.number().optional(),
      sort: z.enum(['best_deal', 'discount', 'price_low', 'price_high', 'newest']).optional(),
    }),
    // Stub: instant, fixed catalog-shaped result — isolates MODEL latency.
    execute: async () => ({ products: Array.from({ length: 6 }, (_, i) => ({ title: `Tenis para correr ${i + 1}`, price: 39.99 + i, was: 79.99, store: 'Target', on_sale: true })) }),
  }),
}

const openai = process.env.OPENAI_API_KEY && createOpenAI({ apiKey: process.env.OPENAI_API_KEY })
const google = process.env.GEMINI_API_KEY && createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY })
const anthropic = process.env.ANTHROPIC_API_KEY && createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// The candidates — only those whose provider key is present get run.
const CANDIDATES = [
  openai && { label: 'openai/gpt-4o-mini', model: openai('gpt-4o-mini') },
  openai && { label: 'openai/gpt-4.1-mini', model: openai('gpt-4.1-mini') },
  openai && { label: 'openai/gpt-4.1-nano', model: openai('gpt-4.1-nano') },
  google && { label: 'google/gemini-3.8-flash', model: google('gemini-3.8-flash'), opts: { google: { thinkingConfig: { thinkingBudget: 0 } } } },
  google && { label: 'google/gemini-2.5-flash-lite', model: google('gemini-2.5-flash-lite'), opts: { google: { thinkingConfig: { thinkingBudget: 0 } } } },
  anthropic && { label: 'anthropic/claude-haiku-4-5', model: anthropic('claude-haiku-4-5-20251001') },
].filter(Boolean)

const QUERY = 'Busco tenis de correr en descuento'

async function timeRun(c) {
  const t0 = performance.now()
  let ttft = null, text = '', steps = 0, toolCalls = 0
  try {
    const res = streamText({
      model: c.model,
      system: SYSTEM,
      messages: [{ role: 'user', content: QUERY }],
      tools: TOOL,
      stopWhen: [stepCountIs(6)],
      ...(c.opts ? { providerOptions: c.opts } : {}),
      onStepFinish: () => { steps++ },
    })
    for await (const part of res.fullStream) {
      if (part.type === 'text-delta') { if (ttft == null) ttft = performance.now() - t0; text += part.text || '' }
      if (part.type === 'tool-call') toolCalls++
    }
    await res.finishReason
    const total = performance.now() - t0
    return { ...c, ttft, total, steps, toolCalls, chars: text.length, ok: true }
  } catch (e) {
    return { ...c, ok: false, err: String(e?.message || e).slice(0, 120) }
  }
}

console.log(`\nBenchmark: "${QUERY}" — ${CANDIDATES.length} model(s), 2 runs each (warm)\n`)
const rows = []
for (const c of CANDIDATES) {
  await timeRun(c)                 // warm-up (ignore)
  const r = await timeRun(c)       // measured
  rows.push(r)
  if (r.ok) console.log(`  ${r.label.padEnd(30)} total ${(r.total / 1000).toFixed(2)}s  · first-token ${(r.ttft / 1000).toFixed(2)}s  · ${r.steps} steps · ${r.toolCalls} tool-call(s) · ${r.chars} chars`)
  else console.log(`  ${r.label.padEnd(30)} ERROR: ${r.err}`)
}
const ok = rows.filter((r) => r.ok).sort((a, b) => a.total - b.total)
if (ok.length) console.log(`\n🏆 Fastest: ${ok[0].label} at ${(ok[0].total / 1000).toFixed(2)}s total (${(ok[0].ttft / 1000).toFixed(2)}s to first token)\n`)
