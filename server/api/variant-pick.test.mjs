// Did the shopper already say which variant they want?
//
// They write "talla 8.5"; Amazon calls it "8.5 Women". Requiring the store's whole value to
// appear in their sentence missed that, so someone who had given BOTH size and colour was
// asked for both again and the item stayed out of the box (Alex, On Cloudultra, 2026-09-15).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

let pass = 0;
const ok = (n, c) => { assert.ok(c, n); console.log('  ✓ ' + n); pass++; };

// Rebuild the matcher from the handler so the test exercises the real source.
const src = readFileSync(new URL('./assistant.post.ts', import.meta.url), 'utf8');
const norm = src.match(/const norm = \(v: any\) => [^\n]*/)[0].replace(/: any/g, '');
// From saidNorm onward — the block above it reads `said` off the message list, which the test supplies.
const body = src.match(/const saidNorm = norm\(said\)[\s\S]*?const fromWords = axes\.flatMap\(\(a: any\) => \(a\.values \|\| \[\]\)\.filter\(saidIt\)\)/)[0]
  .replace(/: any/g, '');

const run = (said, axes) => new Function('said', 'axes', `${norm}; ${body}; return fromWords;`)(said, axes);

const SIZE = { name: 'Size', values: ['7 Women', '8 Women', '8.5 Women', '9 Women'] };
const COLOR = { name: 'Color', values: ['Black/White-black', 'Frost/Cobalt'] };

{
  const got = run('Quiero los On Running Womens Cloudultra en color Black/White-black, talla 8.5 — agrégalos a mi caja', [SIZE, COLOR]);
  ok('a size stated the short way matches the store\'s longer value', got.includes('8.5 Women'));
  ok('and the colour they typed verbatim matches', got.includes('Black/White-black'));
  ok('only the size they said, not its neighbours', !got.includes('8 Women') && !got.includes('9 Women'));
}
{
  // The trap: a bare "8" must not satisfy "8.5".
  const got = run('talla 8 por favor', [SIZE]);
  ok('"talla 8" picks 8, not 8.5', got.includes('8 Women') && !got.includes('8.5 Women'));
}
{
  const got = run('no dije ninguna talla', [SIZE, COLOR]);
  ok('saying no size picks nothing', got.length === 0);
}
{
  // A single-word value still needs to be said outright — one letter must not match half the alphabet.
  const got = run('quiero el negro', [{ name: 'Size', values: ['S', 'M', 'L'] }]);
  ok('a one-letter size is not matched by unrelated words', got.length === 0);
  ok('but saying it outright works', run('talla M', [{ name: 'Size', values: ['S', 'M', 'L'] }]).includes('M'));
}
console.log(`\n${pass} checks passed`);
