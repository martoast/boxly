/**
 * The launcher's refusal contract.
 *
 * This exists because the outage happened TWICE: a restart brought the local
 * service up with no environment, and both times it looked like a product bug —
 * login 404s, chat 503s, a tool silently missing — rather than the config fault
 * it was. These tests pin that a half-configured environment is refused, that a
 * complete one is accepted, and above all that the refusal never leaks a value.
 *
 *   node --experimental-strip-types scripts/localEnvContract.test.mjs
 */
import { readFileSync } from 'node:fs'
import { verifyLocalEnv, refusalMessage, ALWAYS_REQUIRED, PROVIDER_KEYS } from './localEnvContract.ts'

let pass = 0
let fail = 0
const check = (name, cond, detail = '') => {
  if (cond) { pass++ } else { fail++; console.error(`FAIL ${name}${detail ? ` — ${detail}` : ''}`) }
}

const SECRET = 'sk-live-THIS-MUST-NEVER-APPEAR-IN-OUTPUT'
const complete = (over = {}) => ({
  API_URL: 'http://127.0.0.1:18001',
  NUXT_PUBLIC_API_URL: 'http://127.0.0.1:18001',
  LIVE_SHOPPING_ENABLED: '1',
  AI_PROVIDER: 'openai',
  OPENAI_API_KEY: SECRET,
  ...over,
})

// ── a complete environment is accepted ─────────────────────────────────────
{
  const v = verifyLocalEnv(complete())
  check('complete env is accepted', v.ok === true && v.missing.length === 0, JSON.stringify(v))
  check('the required credential is identified', v.providerKey === 'OPENAI_API_KEY')
  check('no invalid-provider complaint', v.invalidProvider === null)
}

// ── THE OUTAGE: an empty environment is refused, naming everything ─────────
{
  const v = verifyLocalEnv({})
  check('empty env is REFUSED', v.ok === false)
  for (const n of ALWAYS_REQUIRED) check(`empty env reports ${n} missing`, v.missing.includes(n), JSON.stringify(v.missing))
  check('no credential is GUESSED while AI_PROVIDER is unanswered',
    v.providerKey === null && !v.missing.some((m) => m.endsWith('_API_KEY')), JSON.stringify(v.missing))
}

// ── each individual variable is load-bearing ──────────────────────────────
for (const name of ALWAYS_REQUIRED) {
  const env = complete()
  delete env[name]
  const v = verifyLocalEnv(env)
  check(`missing ${name} alone is refused`, v.ok === false && v.missing.includes(name), JSON.stringify(v.missing))
}
{
  const env = complete()
  delete env.OPENAI_API_KEY
  const v = verifyLocalEnv(env)
  check('missing the selected provider credential is refused', v.ok === false && v.missing.includes('OPENAI_API_KEY'))
}

// ── blank is not present ──────────────────────────────────────────────────
// A whitespace-only secret is how a service comes up dead while looking configured.
for (const blank of ['', '   ', '\t', '\n']) {
  check(`blank credential (${JSON.stringify(blank)}) is treated as MISSING`,
    verifyLocalEnv(complete({ OPENAI_API_KEY: blank })).ok === false)
  check(`blank API_URL (${JSON.stringify(blank)}) is treated as MISSING`,
    verifyLocalEnv(complete({ API_URL: blank })).ok === false)
}
check('a non-string value is treated as missing', verifyLocalEnv(complete({ API_URL: 12345 })).ok === false)

// ── provider selection decides WHICH credential is required ───────────────
for (const [provider, key] of Object.entries(PROVIDER_KEYS)) {
  // Only the SELECTED provider's credential may be present — otherwise the
  // openai case would delete the very key it is meant to prove.
  const withKey = complete({ AI_PROVIDER: provider })
  for (const k of Object.values(PROVIDER_KEYS)) delete withKey[k]
  withKey[key] = SECRET
  const ok = verifyLocalEnv(withKey)
  check(`${provider} is satisfied by ${key}`, ok.ok === true && ok.providerKey === key, JSON.stringify(ok))

  const without = complete({ AI_PROVIDER: provider })
  for (const k of Object.values(PROVIDER_KEYS)) delete without[k]
  const bad = verifyLocalEnv(without)
  check(`${provider} without ${key} is refused`, bad.ok === false && bad.missing.includes(key), JSON.stringify(bad.missing))
}
check('provider name is case/space tolerant', verifyLocalEnv(complete({ AI_PROVIDER: '  OpenAI  ' })).ok === true)

// ── an unknown provider is refused rather than silently defaulted ─────────
{
  const v = verifyLocalEnv(complete({ AI_PROVIDER: 'llama' }))
  check('unknown provider is REFUSED', v.ok === false && v.invalidProvider === 'llama', JSON.stringify(v))
  check('unknown provider does not also demand a guessed credential',
    !v.missing.some((m) => m.endsWith('_API_KEY')), JSON.stringify(v.missing))
}

// ── THE SECURITY PROPERTY: the refusal leaks names, never values ──────────
{
  const partial = { API_URL: 'http://127.0.0.1:18001', AI_PROVIDER: 'openai', OPENAI_API_KEY: SECRET }
  const v = verifyLocalEnv(partial)
  const msg = refusalMessage(v)
  check('refusal names the missing variables', msg.includes('NUXT_PUBLIC_API_URL') && msg.includes('LIVE_SHOPPING_ENABLED'), msg)
  check('refusal NEVER contains the credential value', !msg.includes(SECRET), msg)
  check('refusal never contains any part of the credential', !msg.includes('sk-live') && !msg.includes(SECRET.slice(0, 8)), msg)
  check('the verdict object itself carries no values',
    !JSON.stringify(v).includes(SECRET) && !JSON.stringify(v).includes('sk-live'), JSON.stringify(v))
  check('refusal explains the SYMPTOMS so nobody debugs the app instead', /404|503/.test(msg))
  check('refusal is unambiguous about the outcome', /REFUSING TO START/.test(msg))
}

// ── the launcher actually enforces it ─────────────────────────────────────
// A contract nothing calls is decoration; pin the wiring.
{
  const launcher = readFileSync(new URL('./serve-local.mjs', import.meta.url), 'utf8')
  check('launcher verifies before importing the server',
    launcher.indexOf('verifyLocalEnv(process.env)') < launcher.indexOf('await import(ENTRY)'), 'ordering')
  check('launcher exits non-zero on a bad verdict', /process\.exit\(78\)/.test(launcher))
  check('launcher refuses when the build output is absent', /\.output\/server\/index\.mjs|ENTRY/.test(launcher) && /existsSync\(ENTRY\)/.test(launcher))
  check('launcher never overrides an already-set variable from .env',
    /if \(process\.env\[name\] !== undefined\) continue/.test(launcher))
  check('launcher logs no credential value', !/process\.env\[verdict\.providerKey\]|process\.env\.OPENAI_API_KEY/.test(launcher))
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
