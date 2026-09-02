#!/usr/bin/env node
/**
 * Fail-fast launcher for the LOCAL Nuxt service.
 *
 *   node scripts/serve-local.mjs      (or: npm run start:local)
 *
 * Two jobs, in this order:
 *   1. Load `.env` into the environment WITHOUT overriding anything already
 *      set. The nitro node-server preset does not read .env at runtime — only
 *      `nuxt dev`/`preview` do — which is why a bare `node .output/server/index.mjs`
 *      comes up with whatever the shell happened to export, and why a restart
 *      that lost its shell lost the whole configuration.
 *   2. Verify the required NAMES are present and refuse to listen if not.
 *
 * It never prints, copies, or logs a value: the verdict is names only.
 *
 * This does not change how the app behaves once running — it only refuses to
 * run half-configured.
 */
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { verifyLocalEnv, refusalMessage } from './localEnvContract.ts'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ENTRY = path.join(ROOT, '.output/server/index.mjs')

/**
 * Minimal .env reader — deliberately not a dependency.
 *
 * Existing process env ALWAYS wins: the shell/service is the source of truth,
 * and a stale .env must never silently override a deliberately-set variable.
 */
function loadDotEnv(file) {
  if (!existsSync(file)) return 0
  let applied = 0
  for (const raw of readFileSync(file, 'utf8').split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq <= 0) continue
    const name = line.slice(0, eq).trim()
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) continue
    if (process.env[name] !== undefined) continue // already set — never override
    let value = line.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    process.env[name] = value
    applied++
  }
  return applied
}

const applied = loadDotEnv(path.join(ROOT, '.env'))

const verdict = verifyLocalEnv(process.env)
if (!verdict.ok) {
  console.error(refusalMessage(verdict))
  process.exit(78) // EX_CONFIG — a configuration fault, not a crash
}

if (!existsSync(ENTRY)) {
  console.error(`REFUSING TO START: ${path.relative(ROOT, ENTRY)} is missing. Run \`npm run build\` first.`)
  process.exit(78)
}

// Names only. The whole point of this file is that a value never reaches a log.
console.log(
  `[serve-local] configuration verified: ${verdict.providerKey}(set) ` +
  `AI_PROVIDER=${String(process.env.AI_PROVIDER).trim().toLowerCase()} ` +
  `LIVE_SHOPPING_ENABLED=${process.env.LIVE_SHOPPING_ENABLED} ` +
  `API_URL=${process.env.API_URL} NUXT_PUBLIC_API_URL=${process.env.NUXT_PUBLIC_API_URL}` +
  (applied ? ` (+${applied} name(s) from .env)` : ''),
)

// Hand the process over. Importing rather than spawning keeps ONE process, so
// the supervisor's pid is the server's pid and signals need no forwarding.
await import(ENTRY)
