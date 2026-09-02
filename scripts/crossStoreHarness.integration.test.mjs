import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
const root = process.cwd()
const wrapper = join(root, 'scripts/crossStoreHarness.mjs')
const fixture = join(root, 'scripts/crossStoreFakeProbe.mjs')
function run(mode) {
  const dir = mkdtempSync(join(tmpdir(), 'boxly-cross-store-test-'))
  const count = join(dir, 'count')
  const r = spawnSync(process.execPath, [wrapper], { encoding: 'utf8', env: { ...process.env, EXPECTED_STORE_HOST: 'target.com', BOXLY_GOLDEN_PROBE: fixture, SHOT_DIR: dir, PROBE_MODE: mode, PROBE_COUNT_FILE: count } })
  return { r, dir, invocations: Number(readFileSync(count, 'utf8')) }
}
const failed = run('failed')
assert.equal(failed.r.status, 2)
assert.equal(failed.invocations, 2)
assert.equal(existsSync(join(failed.dir, 'attempt-1')), true)
assert.equal(existsSync(join(failed.dir, 'attempt-2')), true)
const verified = run('verified')
assert.equal(verified.r.status, 0)
assert.equal(verified.invocations, 1)
assert.equal(existsSync(join(verified.dir, 'attempt-2')), false)
const loginFailed = run('login-failed')
assert.equal(loginFailed.r.status, 2)
assert.equal(loginFailed.invocations, 1)
assert.equal(existsSync(join(loginFailed.dir, 'attempt-2')), false)
const loginResult = JSON.parse(loginFailed.r.stdout)
assert.equal(loginResult.probe_attempt, 1)
assert.equal(loginResult.probe_attempts.length, 1)
assert.equal(loginResult.probe_attempts[0].result.login_success, false)
console.log('cross-store wrapper integration tests passed')
