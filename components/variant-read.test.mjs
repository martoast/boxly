// The one decision: did the read WORK and find nothing, or could we not read it?
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const sfc = readFileSync(new URL('./ProductModal.vue', import.meta.url), 'utf8');
const setLine = sfc.match(/const READ_SUCCEEDED_EMPTY = new Set\(\[[^\]]*\]\)/)[0];
const READ_SUCCEEDED_EMPTY = new Function(`${setLine}; return READ_SUCCEEDED_EMPTY;`)();
const verdict = (merged) => (merged && (!merged.reason || READ_SUCCEEDED_EMPTY.has(merged.reason)) ? 'none' : 'failed');

let pass = 0; const ok = (n, c) => { assert.ok(c, n); console.log('  ✓ ' + n); pass++; };

ok('a single-SKU product has nothing to pick, not a failure', verdict({ reason: 'no_variants' }) === 'none');
ok('a clean answer with no reason is also nothing to pick', verdict({ reason: null }) === 'none');
ok('no url is not a failed read either', verdict({ reason: 'need_url' }) === 'none');
// The cases the warning exists for.
ok('a wall is a failure', verdict({ reason: 'blocked' }) === 'failed');
ok('a busy reader is a failure', verdict({ reason: 'busy' }) === 'failed');
ok('unreachable is a failure', verdict({ reason: 'unreachable' }) === 'failed');
ok('no merchant offer is a failure', verdict({ reason: 'no_merchant_offer' }) === 'failed');
ok('NO RESPONSE AT ALL is a failure, not "no options"', verdict(null) === 'failed');
ok('undefined likewise', verdict(undefined) === 'failed');
console.log(`\n${pass} checks passed`);
