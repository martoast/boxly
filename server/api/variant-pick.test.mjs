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
// New Balance 9060 (Alex, 2026-09-28): "talla 9" in a message with a pasted link — the size is known, only the colour
// is asked, and the size opens pre-selected.
{
  const NB_SIZE = { name: 'Size', kind: 'size', values: ['M8.5 / W10 (8.5)', 'M9 / W10.5 (9)', 'M9.5 / W11 (9.5)', 'M7.5 / W9 (7.5)'] };
  const NB_COLOR = { name: 'Color', kind: 'color', values: ['BREAKFAST TEA with ANGORA', 'BLACK with CASTLEROCK'] };
  const got = run("Quiero los New Balance Men's 9060 en talla 9 — agrégalos a mi caja — https://www.newbalance.com/pd/9060/U9060V1_LI-FTW-825955-PMG-NA.html", [NB_SIZE, NB_COLOR]);
  ok('"talla 9" is the men\'s 9, not W9 or 9.5', got.length === 1 && got[0] === 'M9 / W10.5 (9)');
  ok('the link and model number pick no colour', !got.some((v) => NB_COLOR.values.includes(v)));
  ok('what was said rides into the picker pre-selected', /ship\.variants_for\.selected = \{/.test(src));
  ok('and the reply asks only for what is missing', /Elige \$\{askFor\} y lo agrego a tu caja/.test(src) && !/"Elige la talla y el color y lo agrego a tu caja 👇"\. Then STOP/.test(src));
}
console.log(`\n${pass} checks passed`);
