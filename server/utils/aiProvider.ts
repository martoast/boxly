import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'

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

export type ProviderName = 'google' | 'anthropic'

export function aiProvider(): ProviderName {
  const forced = (process.env.AI_PROVIDER || '').toLowerCase()
  if (forced === 'google') return 'google'
  if (forced === 'anthropic') return 'anthropic'
  return process.env.GEMINI_API_KEY ? 'google' : 'anthropic'
}

export function isGoogle(): boolean {
  return aiProvider() === 'google'
}

/** True when the active provider has its API key configured. */
export function hasModelKey(): boolean {
  return isGoogle() ? !!process.env.GEMINI_API_KEY : !!process.env.ANTHROPIC_API_KEY
}

const GOOGLE_CHAT_MODEL = process.env.GOOGLE_CHAT_MODEL || 'gemini-3.1-flash-lite-preview'
const GOOGLE_AUX_MODEL = process.env.GOOGLE_AUX_MODEL || 'gemini-2.5-flash-lite'
const ANTHROPIC_CHAT_MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001'
const ANTHROPIC_AUX_MODEL =
  process.env.ANTHROPIC_RANK_MODEL || process.env.ANTHROPIC_TITLE_MODEL || 'claude-haiku-4-5-20251001'

function google() {
  return createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY })
}
function anthropic() {
  return createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

/** The model for the main agentic chat (assistant.post.ts). */
export function chatModel() {
  return isGoogle() ? google()(GOOGLE_CHAT_MODEL) : anthropic()(ANTHROPIC_CHAT_MODEL)
}

/** The model for cheap auxiliary calls (curate, intent, title, search parse, ask). */
export function auxModel() {
  return isGoogle() ? google()(GOOGLE_AUX_MODEL) : anthropic()(ANTHROPIC_AUX_MODEL)
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
