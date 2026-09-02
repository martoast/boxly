#!/usr/bin/env node
// Reusable wrapper for the real AT-SPI golden probe. It adds store-aware link
// detection and separates progressive vs terminal/reload evidence without
// weakening the underlying probe's verified-composer gate.
import { spawn } from 'node:child_process'
import { readFileSync, writeFileSync, mkdirSync, accessSync, constants, statSync } from 'node:fs'
import { join } from 'node:path'
import { storeLinks, shouldRetryProbe } from './crossStoreHarness.ts'

const host = process.env.EXPECTED_STORE_HOST
if (!host) throw new Error('EXPECTED_STORE_HOST is required (for example target.com)')
const probe = process.env.BOXLY_GOLDEN_PROBE
if (!probe || !probe.startsWith('/') ) throw new Error('BOXLY_GOLDEN_PROBE must be an absolute readable probe path')
try { accessSync(probe, constants.R_OK); if (!statSync(probe).isFile()) throw new Error('not a regular file') } catch { throw new Error(`BOXLY_GOLDEN_PROBE must be a readable regular file: ${probe}`) }
const shotDir = process.env.SHOT_DIR || `/tmp/boxly-cross-store-${host.replace(/\W+/g, '-')}`
mkdirSync(shotDir, { recursive: true })
const runProbe = (attempt) => new Promise((resolve) => {
  const attemptDir = join(shotDir, `attempt-${attempt + 1}`)
  mkdirSync(attemptDir, { recursive: true })
  const child = spawn(process.execPath, [probe], { stdio: ['ignore', 'pipe', 'inherit'], env: { ...process.env, SHOT_DIR: attemptDir } })
  let output = ''
  child.stdout.on('data', (chunk) => { output += chunk })
  child.on('close', (code) => resolve({ code, output, attempt, shotDir: attemptDir }))
})
const attempts = []
let run = await runProbe(0)
let jsonStart = run.output.indexOf('{')
if (jsonStart < 0) throw new Error('probe emitted no JSON result')
let result = JSON.parse(run.output.slice(jsonStart))
attempts.push({ attempt: 1, code: run.code, result: structuredClone(result) })
// A failed readback is never submitted. Retry once as a full fresh probe;
// a second failure remains a hard stop. This keeps the safety gate
// while recovering transient stale-focus/ref errors in AT-SPI.
if (shouldRetryProbe(result, run.attempt)) {
  run = await runProbe(1)
  jsonStart = run.output.indexOf('{')
  if (jsonStart < 0) throw new Error('retry probe emitted no JSON result')
  result = JSON.parse(run.output.slice(jsonStart))
  attempts.push({ attempt: 2, code: run.code, result: structuredClone(result) })
}
const read = (name) => { try { return readFileSync(join(run.shotDir, name), 'utf8') } catch { return '' } }
const progressive = storeLinks(read('03-after-observation.txt'), host)
const terminal = storeLinks(read('03-final-page.txt'), host)
const reload = storeLinks(read('04-reload-persistence.txt'), host)
result.store_host = host
result.probe_attempt = run.attempt + 1
result.probe_attempts = attempts
result.store_links = { progressive, terminal, reload }
result.composer_gate = result.composer_readback_verified ? 'verified' : 'failed_or_unverified'
writeFileSync(join(shotDir, 'cross-store-analysis.json'), JSON.stringify(result, null, 2))
console.log(JSON.stringify(result, null, 2))
if (!result.composer_readback_verified) process.exitCode = 2
else if (run.code !== 0) process.exitCode = run.code
