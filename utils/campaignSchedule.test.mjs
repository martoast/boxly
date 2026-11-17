import assert from 'node:assert/strict'
import { isScheduled, scheduleLabel, mxDay, mxTime, mxInstant, monthGrid } from './campaignSchedule.ts'
assert.equal(isScheduled({ status: 'draft', scheduled_at: '2026-11-23T15:00:00Z' }), true)
assert.equal(isScheduled({ status: 'sending', scheduled_at: '2026-11-23T15:00:00Z' }), false)
assert.equal(isScheduled({ status: 'draft', scheduled_at: null }), false)
assert.equal(mxInstant('2026-11-23', '09:00'), '2026-11-23T09:00:00-06:00')
assert.equal(mxDay('2026-11-23T15:00:00Z'), '2026-11-23')
assert.equal(mxDay('2026-11-24T03:00:00Z'), '2026-11-23', 'late evening in Mexico is still that day')
assert.equal(mxTime('2026-11-23T15:00:00Z'), '09:00')
assert.match(scheduleLabel('2026-11-23T15:00:00Z'), /23 nov, 9:00/)
const g = monthGrid(2026, 10)
assert.equal(g[0].indexOf('2026-11-01'), 6, 'Nov 1 2026 is a Sunday: last column of a Monday-first week')
assert.ok(g.flat().includes('2026-11-30'))
console.log('PASS — campaign schedule helpers (central Mexico time)')
