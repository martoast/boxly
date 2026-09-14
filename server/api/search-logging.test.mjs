// searchFromSteps: the shape the assistant turn hands to analytics.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Extract the pure function + its PRODUCT_TOOLS dependency from the handler.
const src = readFileSync('server/api/assistant.post.ts', 'utf8');
const tools = src.match(/const PRODUCT_TOOLS = new Set\(\[[^\]]*\]\)/s)[0];
const fn = src.match(/\/\*\* The product tool this turn actually searched[\s\S]*?\n\}\n/)[0];
const dir = mkdtempSync(join(tmpdir(), 'sfs-'));
const f = join(dir, 'm.ts');
writeFileSync(f, tools + '\n' + fn.replace('export function', 'export function'));
const { searchFromSteps } = await import(f);

let pass = 0; const ok = (n, c) => { assert.ok(c, n); console.log('  ✓ ' + n); pass++; };

const step = (name, input, output) => ({
  toolCalls: [{ toolCallId: 'c1', toolName: name, input }],
  toolResults: [{ toolCallId: 'c1', output }],
});

{
  const s = searchFromSteps([step('search_products', { query: 'tenis Adidas' }, { products: [
    { store: 'adidas', title: 'Samba OG', price: 100 }, { store: 'Nike', title: 'Pegasus', price: 130 }] })]);
  ok('the shopper’s query is what gets logged', s.query === 'tenis Adidas');
  ok('with the number of rows served', s.results === 2);
  ok('and a sample of those rows', s.results_sample.length === 2 && s.results_sample[0].store === 'adidas');
  ok('not broadened when the catalog did not say so', s.broadened === false);
}
{
  // The row that matters most: demand we failed.
  const s = searchFromSteps([step('search_products', { query: 'Psycho Bunny' }, { products: [] })]);
  ok('a zero-result search is still reported', s !== null && s.results === 0);
  ok('with an empty sample, not a dropped event', Array.isArray(s.results_sample) && s.results_sample.length === 0);
}
{
  const s = searchFromSteps([step('curate_products', { store: 'Owala', sale: true }, { products: [{ store: 'Owala', title: 'Tumbler', price: 30 }], broadened: true, served_query: 'Owala' })]);
  ok('curate has no free text, so the store it was steered by is the query', s.query === 'Owala');
  ok('a broadened result is flagged, so filler cannot read as a hit', s.broadened === true);
  ok('and the query actually served is kept', s.served_query === 'Owala');
}
{
  const s = searchFromSteps([step('curate_products', { store: 'Gap' }, { products: [], relaxed: true })]);
  ok('the catalog’s own relaxed flag counts as broadened too', s.broadened === true);
}
{
  ok('a turn with no product tool reports nothing', searchFromSteps([step('suggest_followups', { suggestions: [] }, {})]) === null);
  ok('and neither does an empty turn', searchFromSteps([]) === null);
}
{
  // The FIRST product tool of the turn is the search; a follow-up fallback is not a second one.
  const s = searchFromSteps([
    step('search_products', { query: 'Hurley boxers' }, { products: [] }),
    { toolCalls: [{ toolCallId: 'c2', toolName: 'find_on_google', input: { query: 'Hurley boxer briefs' } }], toolResults: [{ toolCallId: 'c2', output: { products: [{ store: 'Amazon', title: 'x', price: 16 }] } }] },
  ]);
  ok('the shopper-facing search wins over its fallback', s.query === 'Hurley boxers' && s.results === 0);
}
{
  const s = searchFromSteps([step('search_products', { query: 'x' }, { products: Array.from({ length: 40 }, (_, i) => ({ store: 's', title: 't' + i, price: i })) })]);
  ok('all rows are counted', s.results === 40);
  ok('but the sample is capped at 12', s.results_sample.length === 12);
}

console.log(`\n${pass} checks passed`);
