import assert from 'node:assert/strict'
import test from 'node:test'

import {
  aiProvider,
  assistantProviderFeatures,
  auxModel,
  auxModelName,
  chatModel,
  chatModelName,
  hasModelKey,
  modelConfigurationError,
  providerOptions,
  requiredModelKey,
} from './aiProvider.ts'

const ENV_NAMES = [
  'AI_PROVIDER', 'OPENAI_API_KEY', 'OPENAI_CHAT_MODEL', 'OPENAI_AUX_MODEL',
  'GEMINI_API_KEY', 'GOOGLE_CHAT_MODEL', 'GOOGLE_AUX_MODEL',
  'ANTHROPIC_API_KEY', 'ANTHROPIC_MODEL', 'ANTHROPIC_RANK_MODEL', 'ANTHROPIC_TITLE_MODEL',
]
const originalEnv = Object.fromEntries(ENV_NAMES.map((name) => [name, process.env[name]]))

function resetEnv() {
  for (const name of ENV_NAMES) delete process.env[name]
}

test.afterEach(resetEnv)
test.after(() => {
  for (const name of ENV_NAMES) {
    const value = originalEnv[name]
    if (value === undefined) delete process.env[name]
    else process.env[name] = value
  }
})

test('defaults to OpenAI and the exact GPT-5.6 Luna model', () => {
  resetEnv()
  assert.equal(aiProvider(), 'openai')
  assert.equal(requiredModelKey(), 'OPENAI_API_KEY')
  assert.equal(chatModelName(), 'gpt-5.6-luna')
  assert.equal(auxModelName(), 'gpt-5.6-luna')
  assert.equal(chatModel().modelId, 'gpt-5.6-luna')
  assert.equal(auxModel().modelId, 'gpt-5.6-luna')
  assert.equal(chatModel().provider, 'openai.responses')
})

test('accepts explicit OpenAI provider selection', () => {
  resetEnv()
  process.env.AI_PROVIDER = 'openai'
  assert.equal(aiProvider(), 'openai')
  assert.equal(requiredModelKey(), 'OPENAI_API_KEY')
  assert.equal(chatModelName(), 'gpt-5.6-luna')
})

test('rejects an invalid nonblank provider instead of silently routing', () => {
  resetEnv()
  process.env.AI_PROVIDER = 'opneai'
  assert.throws(() => aiProvider(), /Invalid AI_PROVIDER/)
  assert.equal(hasModelKey(), false)
  assert.equal(modelConfigurationError(), 'Invalid AI_PROVIDER. Expected openai, google, or anthropic.')
})

test('honors OpenAI chat and optional aux model overrides', () => {
  resetEnv()
  process.env.OPENAI_CHAT_MODEL = 'openai-chat-override'
  assert.equal(chatModelName(), 'openai-chat-override')
  assert.equal(auxModelName(), 'openai-chat-override')
  process.env.OPENAI_AUX_MODEL = 'openai-aux-override'
  assert.equal(auxModelName(), 'openai-aux-override')
})

test('fails closed on the selected provider key with a useful safe error', () => {
  resetEnv()
  assert.equal(hasModelKey(), false)
  assert.equal(modelConfigurationError(), 'AI_PROVIDER=openai requires OPENAI_API_KEY on the server.')
  process.env.ANTHROPIC_API_KEY = 'not-the-selected-key'
  assert.equal(hasModelKey(), false)
  process.env.OPENAI_API_KEY = 'configured'
  assert.equal(hasModelKey(), true)
})

test('treats a whitespace-only selected API key as missing', () => {
  resetEnv()
  process.env.AI_PROVIDER = 'openai'
  process.env.OPENAI_API_KEY = '   \n\t'
  assert.equal(hasModelKey(), false)
  assert.equal(modelConfigurationError(), 'AI_PROVIDER=openai requires OPENAI_API_KEY on the server.')
})

test('preserves explicit Google rollback routing and options', () => {
  resetEnv()
  process.env.AI_PROVIDER = 'google'
  assert.equal(aiProvider(), 'google')
  assert.equal(requiredModelKey(), 'GEMINI_API_KEY')
  assert.equal(chatModelName(), 'gemini-3.1-flash-lite-preview')
  assert.deepEqual(providerOptions(), { google: { thinkingConfig: { thinkingBudget: 0 } } })
  assert.deepEqual(assistantProviderFeatures(), {
    anthropicNativeWebSearch: false,
    anthropicCacheControl: false,
  })
})

test('isolates Anthropic-native web search and cache control to Anthropic', () => {
  resetEnv()
  assert.deepEqual(providerOptions(), {})
  assert.deepEqual(assistantProviderFeatures(), {
    anthropicNativeWebSearch: false,
    anthropicCacheControl: false,
  })

  process.env.AI_PROVIDER = 'anthropic'
  assert.equal(requiredModelKey(), 'ANTHROPIC_API_KEY')
  assert.equal(chatModelName(), 'claude-haiku-4-5-20251001')
  assert.deepEqual(providerOptions(), {})
  assert.deepEqual(assistantProviderFeatures(), {
    anthropicNativeWebSearch: true,
    anthropicCacheControl: true,
  })
})
