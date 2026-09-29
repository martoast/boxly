// searchFromSteps: the shape the assistant turn hands to analytics.
// Since 2026-09-28 the only product search is live_gallery: its products land AFTER the turn (the engine appends
// them), so the search is logged with results null — unknown, not the zero-result "demand we failed" signal.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Extract the pure function + its PRODUCT_TOOLS dependency from the handler.
const src = readFileSync('server/api/assistant.post.ts', 'utf8');
const tools = src.match(/const PRODUCT_TOOLS = new Set\(\[[^\]]*\]\)/s)[0];
const fn = src.match(/\/\*\*\n \* The product tool this turn actually searched[\s\S]*?\n\}\n/)[0];
const dir = mkdtempSync(join(tmpdir(), 'sfs-'));
const f = join(dir, 'm.ts');
writeFileSync(f, tools + '\n' + fn);
const { searchFromSteps } = await import(f);

let pass = 0; const ok = (n, c) => { assert.ok(c, n); console.log('  ✓ ' + n); pass++; };

const step = (name, input, output) => ({
  toolCalls: [{ toolCallId: 'c1', toolName: name, input }],
  toolResults: [{ toolCallId: 'c1', output }],
});

{
  const s = searchFromSteps([step('live_gallery', { query: 'running shoes', stores: ['On', 'Nike'] }, { ok: true, query: 'running shoes', stores: ['On', 'Nike'], live_session: { id: 7 } })]);
  ok('the words typed into the store search are what gets logged', s.query === 'running shoes');
  ok('results are unknown at the end of the turn, not zero', s.results === null);
  ok('the stores it opened are the served query', s.served_query === 'running shoes @ On, Nike');
  ok('with an empty sample, not a dropped event', Array.isArray(s.results_sample) && s.results_sample.length === 0);
  ok('never flagged as broadened', s.broadened === false);
}
{
  const s = searchFromSteps([step('live_gallery', { query: 'leggings', stores: ['Lululemon'] }, { ok: false, error: 'unknown_store' })]);
  ok('a search that could not start is still reported, with the stores asked for', s !== null && s.query === 'leggings' && s.served_query === 'leggings @ Lululemon');
}
{
  ok('a turn with no product tool reports nothing', searchFromSteps([step('show_shipment', { items: [] }, {})]) === null);
  ok('and neither does an empty turn', searchFromSteps([]) === null);
  ok('nor a live gallery with no words', searchFromSteps([step('live_gallery', { query: '  ', stores: ['On'] }, {})]) === null);
}
{
  // A re-shown registry set is not a search.
  ok('show_saved_products is not logged as a search', searchFromSteps([step('show_saved_products', { ids: ['p1'] }, { products: [{ title: 'x' }] })]) === null);
}
console.log(`\n${pass} checks passed`);
