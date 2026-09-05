import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'

/**
 * ONE place that decides which LLM provider/model every server route uses, so we
 * can switch the whole app between Anthropic (Claude) and Google (Gemini) — and
 * back — with env vars alone, no code changes.
 *
 * WHY: Claude Haiku is excellent but expensive at our volume. Gemini Flash-Lite
 * is ~10x cheaper per token (and has a generous free tier for dev/testing). This
 * helper lets us flip providers safely and reversibly.
 *
 *   - Default is ANTHROPIC unless GEMINI_API_KEY is present, so simply *deploying*
 *     this code never changes prod's behavior — prod keeps using Claude until we
 *     add GEMINI_API_KEY (and optionally AI_PROVIDER=google) to its env.
 *   - AI_PROVIDER ('google' | 'anthropic') force-overrides the choice either way
 *     (set AI_PROVIDER=anthropic to instantly revert even with a Gemini key set).
 *
 * Models (override per env):
 *   - chat (the agentic concierge): Gemini 3.1 Flash-Lite  / Claude Haiku 4.5
 *   - aux  (curate, intent, title…): Gemini 2.5 Flash-Lite / Claude Haiku 4.5
 *
 * Gemini "thinking" is disabled (thinkingBudget: 0) everywhere — we don't need it
 * for these tasks and it bills as (expensive) output tokens and adds latency.
 */

export type ProviderName = 'google' | 'anthropic' | 'openai'

export function aiProvider(): ProviderName {
  const forced = (process.env.AI_PROVIDER || '').toLowerCase()
  if (forced === 'google' || forced === 'anthropic' || forced === 'openai') return forced
  // No explicit choice: prefer whichever key is present (prod has GEMINI → unchanged).
  if (process.env.GEMINI_API_KEY) return 'google'
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic'
  if (process.env.OPENAI_API_KEY) return 'openai'
  return 'anthropic'
}

export function isGoogle(): boolean { return aiProvider() === 'google' }
export function isAnthropic(): boolean { return aiProvider() === 'anthropic' }
export function isOpenAI(): boolean { return aiProvider() === 'openai' }

/** True when the active provider has its API key configured. */
export function hasModelKey(): boolean {
  const p = aiProvider()
  if (p === 'google') return !!process.env.GEMINI_API_KEY
  if (p === 'openai') return !!process.env.OPENAI_API_KEY
  return !!process.env.ANTHROPIC_API_KEY
}

// gemini-3.8-flash (GA): far better instruction adherence than 3.1-flash-lite —
// it stops dumping raw JSON galleries into the reply and stops firing a second
// (empty) gallery tool. Override per env with GOOGLE_CHAT_MODEL.
const GOOGLE_CHAT_MODEL = process.env.GOOGLE_CHAT_MODEL || 'gemini-3.8-flash'
const GOOGLE_AUX_MODEL = process.env.GOOGLE_AUX_MODEL || 'gemini-2.5-flash-lite'
const ANTHROPIC_CHAT_MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001'
const ANTHROPIC_AUX_MODEL =
  process.env.ANTHROPIC_RANK_MODEL || process.env.ANTHROPIC_TITLE_MODEL || 'claude-haiku-4-5-20251001'
// OpenAI: gpt-4o-mini / gpt-4.1-mini are the fast+cheap tier — good candidates for the
// ~2s target. Override with OPENAI_CHAT_MODEL / OPENAI_AUX_MODEL.
const OPENAI_CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini'
const OPENAI_AUX_MODEL = process.env.OPENAI_AUX_MODEL || 'gpt-4o-mini'

function google() { return createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY }) }
function anthropic() { return createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) }
function openai() { return createOpenAI({ apiKey: process.env.OPENAI_API_KEY }) }

/** The model for the main agentic chat (assistant.post.ts). */
export function chatModel() {
  const p = aiProvider()
  if (p === 'google') return google()(GOOGLE_CHAT_MODEL)
  if (p === 'openai') return openai()(OPENAI_CHAT_MODEL)
  return anthropic()(ANTHROPIC_CHAT_MODEL)
}

/** The model for cheap auxiliary calls (curate, intent, title, search parse, ask). */
export function auxModel() {
  const p = aiProvider()
  if (p === 'google') return google()(GOOGLE_AUX_MODEL)
  if (p === 'openai') return openai()(OPENAI_AUX_MODEL)
  return anthropic()(ANTHROPIC_AUX_MODEL)
}

/**
 * providerOptions for generateText / generateObject / streamText calls. On Gemini
 * this disables thinking.
 * Pass-through merge for any extra per-call options (e.g. Anthropic cacheControl
 * lives on the system message, not here, so callers add that themselves).
 */
export function providerOptions(extra: Record<string, any> = {}): Record<string, any> {
  if (isGoogle()) {
    return { google: { thinkingConfig: { thinkingBudget: 0 } }, ...extra }
  }
  return { ...extra }
}
