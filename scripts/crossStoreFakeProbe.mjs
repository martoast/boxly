#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs'
mkdirSync(process.env.SHOT_DIR, { recursive: true })
const countFile = process.env.PROBE_COUNT_FILE
let count = 0
try { count = Number((await import('node:fs')).readFileSync(countFile, 'utf8')) || 0 } catch {}
writeFileSync(countFile, String(count + 1))
if (process.env.PROBE_MODE === 'login-failed') console.log(JSON.stringify({ login_success: false, error: 'login failed' }))
else console.log(JSON.stringify({ composer_readback_verified: process.env.PROBE_MODE === 'verified' }))
