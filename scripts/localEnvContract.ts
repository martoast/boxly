/**
 * The environment the LOCAL Nuxt service must have before it is allowed to
 * listen.
 *
 * This exists because the same outage happened twice. A restart brought the
 * service up with none of its variables, and both times it presented as a
 * product bug rather than a config one: with no API base the browser resolved
 * `/csrf-cookie` and `/auth/login` against the Nuxt origin and got 404s, so
 * nobody could log in; with no provider key every chat turn answered 503; with
 * LIVE_SHOPPING_ENABLED unset the `live_verify` tool silently vanished from the
 * belt. Each symptom sends you looking at the application. None of them names
 * the actual cause.
 *
 * A half-configured service is worse than a stopped one, because a stopped
 * service is obviously stopped. So the launcher refuses to listen and says
 * exactly which NAMES are missing.
 *
 * Pure and dependency-free so it can be tested without starting anything.
 * It reads NOTHING from the ambient process: every function takes an env object.
 */

/** Names required no matter how the app is configured. */
export const ALWAYS_REQUIRED = [
  // Server-side base for callApi(); without it Nuxt's own server cannot reach Laravel.
  'API_URL',
  // Browser-side base for $customFetch; without it the client calls its OWN
  // origin and login 404s — the exact failure seen twice.
  'NUXT_PUBLIC_API_URL',
  // Absent means the live_verify tool is silently dropped from the tool belt,
  // which reads as "the feature is broken" rather than "the flag is unset".
  'LIVE_SHOPPING_ENABLED',
  // Deliberately required even though the app defaults to openai: an unset
  // provider is a question nobody answered, and the answer decides which
  // credential below is mandatory.
  'AI_PROVIDER',
] as const

/** The provider→credential mapping, mirroring server/utils/aiProvider.ts::requiredModelKey. */
export const PROVIDER_KEYS: Record<string, string> = {
  openai: 'OPENAI_API_KEY',
  google: 'GEMINI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
}

export const VALID_PROVIDERS = Object.keys(PROVIDER_KEYS)

/** Present means: defined, a string, and not blank. A whitespace-only secret is
 *  not a secret — treating it as present is how a service comes up dead. */
function present(env: Record<string, any>, name: string): boolean {
  const v = env?.[name]
  return typeof v === 'string' && v.trim() !== ''
}

export interface EnvVerdict {
  ok: boolean
  /** Missing NAMES only — never values. */
  missing: string[]
  /** Set when AI_PROVIDER is present but not one this app understands. */
  invalidProvider: string | null
  /** The credential name the selected provider requires, when determinable. */
  providerKey: string | null
}

/**
 * Verdict on an environment. Returns names and nothing else — no value, no
 * length, no prefix, no redacted echo. There is no diagnostic worth leaking a
 * credential for, and "helpful" partial echoes are how secrets reach logs.
 */
export function verifyLocalEnv(env: Record<string, any>): EnvVerdict {
  const missing = ALWAYS_REQUIRED.filter((n) => !present(env, n))

  let invalidProvider: string | null = null
  let providerKey: string | null = null

  if (present(env, 'AI_PROVIDER')) {
    const p = String(env.AI_PROVIDER).trim().toLowerCase()
    if (!VALID_PROVIDERS.includes(p)) {
      invalidProvider = p
    } else {
      providerKey = PROVIDER_KEYS[p]
      if (!present(env, providerKey)) missing.push(providerKey)
    }
  }
  // AI_PROVIDER missing: it is already in `missing`, and which credential is
  // required cannot be known until it is answered. Reporting a guessed
  // credential would send someone to set the wrong one.

  return { ok: missing.length === 0 && !invalidProvider, missing, invalidProvider, providerKey }
}

/** The operator-facing refusal. Names only, and it says what to do. */
export function refusalMessage(v: EnvVerdict): string {
  const lines = ['REFUSING TO START: the local Nuxt service is not fully configured.', '']
  if (v.invalidProvider) {
    lines.push(`  AI_PROVIDER is "${v.invalidProvider}" — expected one of: ${VALID_PROVIDERS.join(', ')}`)
  }
  if (v.missing.length) {
    lines.push('  Missing (or blank):')
    for (const n of v.missing) lines.push(`    - ${n}`)
  }
  lines.push(
    '',
    'Starting without these does not fail loudly — it fails as a PRODUCT bug:',
    '  no API base   -> the browser calls its own origin, /auth/login 404s, nobody can log in',
    '  no provider key -> every chat turn answers 503',
    '  no live flag  -> the live_verify tool silently disappears from the tool belt',
    '',
    'Set them in the service environment (or .env) and start again.',
  )
  return lines.join('\n')
}
