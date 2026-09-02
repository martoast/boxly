import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'

/**
 * ONE place that decides which LLM provider/model every server route uses, so we
 * can switch the whole app between OpenAI, Google, and Anthropic with env vars.
 * OpenAI is the default; Google and Anthropic remain explicit rollback choices.
 *
 * Models (override per env):
 *   - OpenAI: GPT-5.6 Luna for chat and aux unless OPENAI_AUX_MODEL is set
 *   - Google: Gemini 3.1 Flash-Lite chat / Gemini 2.5 Flash-Lite aux
 *   - Anthropic: Claude Haiku 4.5
 *
 * Gemini "thinking" is disabled (thinkingBudget: 0) everywhere — we don't need it
 * for these tasks and it bills as (expensive) output tokens and adds latency.
 */

export type ProviderName = 'openai' | 'google' | 'anthropic'

export function aiProvider(): ProviderName {
  const forced = (process.env.AI_PROVIDER || '').trim().toLowerCase()
  if (!forced || forced === 'openai') return 'openai'
  if (forced === 'google') return 'google'
  if (forced === 'anthropic') return 'anthropic'
  throw new Error('Invalid AI_PROVIDER. Expected openai, google, or anthropic.')
}

export function isGoogle(): boolean {
  return aiProvider() === 'google'
}

export function isAnthropic(): boolean {
  return aiProvider() === 'anthropic'
}

/** Anthropic-native tools and message options must never cross provider boundaries. */
export function assistantProviderFeatures() {
  const anthropicNative = isAnthropic()
  return {
    anthropicNativeWebSearch: anthropicNative,
    anthropicCacheControl: anthropicNative,
  }
}

export function requiredModelKey(): 'OPENAI_API_KEY' | 'GEMINI_API_KEY' | 'ANTHROPIC_API_KEY' {
  if (isGoogle()) return 'GEMINI_API_KEY'
  if (isAnthropic()) return 'ANTHROPIC_API_KEY'
  return 'OPENAI_API_KEY'
}

/** True when the active provider has its API key configured. */
export function hasModelKey(): boolean {
  try {
    return !!process.env[requiredModelKey()]?.trim()
  } catch {
    return false
  }
}

/** Safe to return/log: identifies only the missing variable, never its value. */
export function modelConfigurationError(): string {
  try {
    return `AI_PROVIDER=${aiProvider()} requires ${requiredModelKey()} on the server.`
  } catch {
    return 'Invalid AI_PROVIDER. Expected openai, google, or anthropic.'
  }
}

export function chatModelName(): string {
  if (isGoogle()) return process.env.GOOGLE_CHAT_MODEL || 'gemini-3.1-flash-lite-preview'
  if (isAnthropic()) return process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001'
  return process.env.OPENAI_CHAT_MODEL || 'gpt-5.6-luna'
}

export function auxModelName(): string {
  if (isGoogle()) return process.env.GOOGLE_AUX_MODEL || 'gemini-2.5-flash-lite'
  if (isAnthropic()) {
    return process.env.ANTHROPIC_RANK_MODEL || process.env.ANTHROPIC_TITLE_MODEL || 'claude-haiku-4-5-20251001'
  }
  return process.env.OPENAI_AUX_MODEL || chatModelName()
}

function google() {
  return createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY })
}
function anthropic() {
  return createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}
function openai() {
  return createOpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

/** The model for the main agentic chat (assistant.post.ts). */
export function chatModel() {
  if (isGoogle()) return google()(chatModelName())
  if (isAnthropic()) return anthropic()(chatModelName())
  return openai()(chatModelName())
}

/** The model for cheap auxiliary calls (curate, intent, title, search parse, ask). */
export function auxModel() {
  if (isGoogle()) return google()(auxModelName())
  if (isAnthropic()) return anthropic()(auxModelName())
  return openai()(auxModelName())
}

/**
 * providerOptions for generateText / generateObject / streamText calls. On Gemini
 * this disables thinking.
 */
export function providerOptions(): Record<string, any> {
  if (isGoogle()) {
    return { google: { thinkingConfig: { thinkingBudget: 0 } } }
  }
  return {}
}
