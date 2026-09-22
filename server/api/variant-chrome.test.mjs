// PAGE FURNITURE IS NOT A VARIANT.
//
// Erick Martos, 2026-09-22, three products in a row he could not add to his box:
//
//   "…en color Black"  → axes: Style ["Additional details", "here", "Measurements"]
//   (tapped Add)       → axes: Style ["Return details", "Measurements", "Sponsored", …]
//   "…en color Blue"   → axes: Color ["3+", "Green", "Blue"] + Style ["here", "User guide"]
//
// Amazon's own links and section headings, read off the page as choices. One is enough
// to trap a shopper for good: the hold gate needs EVERY multi-value axis answered, so on
// the third the Color axis WAS satisfied — he said Blue, Blue was there — and the junk
// Style axis held it anyway. He was asked to re-pick what he had picked, from options
// that meant nothing, and replied "?".
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
let pass = 0; const ok = (n, c) => { assert.ok(c, n); console.log('  ✓ ' + n); pass++; };

const src = readFileSync(new URL('./assistant.post.ts', import.meta.url), 'utf8');
const pick = (re) => { const m = src.match(re); if (!m) throw new Error('not found: ' + re); return m[0]; };
const f = join(mkdtempSync(join(tmpdir(), 'chrome-')), 'm.ts');
writeFileSync(f, [
  pick(/const CHROME_VALUE = [^\n]*\n/),
  pick(/function cleanValues\([\s\S]*?\n\}/),
  pick(/export function cleanAxes\([\s\S]*?\n\}/),
  pick(/export function cleanVariants\([\s\S]*?\n\}/),
].join('\n'));
const { cleanAxes, cleanVariants } = await import(f);

// ── The three reads, verbatim from the thread ───────────────────────────────
ok('an all-chrome Style axis disappears entirely',
  cleanAxes([{ name: 'Style', values: ['Additional details', 'here', 'Measurements'] }]).length === 0);
ok('…so does one full of Amazon furniture',
  cleanAxes([{ name: 'Style', values: ['Return details', 'Measurements', 'Additional details', 'Sponsored'] }]).length === 0);
{
  const axes = cleanAxes([
    { name: 'Color', values: ['3+', 'Green', 'Blue'] },
    { name: 'Style', values: ['here', 'User guide'] },
  ]);
  ok('the real Color axis survives', axes.length === 1 && axes[0].name === 'Color');
  ok('…with the facet count "3+" gone', !axes[0].values.includes('3+'));
  ok('…and the colours he could actually pick still there', axes[0].values.join() === 'Green,Blue');
  // This is the whole bug: one unanswerable axis outvoted the one he answered.
  const multi = axes.filter((a) => a.values.length > 1);
  ok('only an axis he can answer is left to hold him', multi.length === 1 && multi[0].name === 'Color');
}

// ── Real variants must not be touched ───────────────────────────────────────
for (const v of ['Black', 'Blue', 'Harbor Blue/Wood Crepe', '8.5 Women', 'M', 'XL', 'Rose Quartz Pink',
  '500 Piece', 'Floral Details', 'Detailed Lace', '32 oz', 'Left Handed'])
  ok(`"${v}" is a real choice and stays`, cleanAxes([{ name: 'x', values: [v, 'other'] }])[0].values.includes(v));

// ── Chrome by every shape we saw, plus its obvious cousins ──────────────────
for (const v of ['here', 'Sponsored', '3+', '12+', 'Additional details', 'Return details', 'Product details',
  'Measurements', 'User guide', 'Size Chart', 'See more', 'Learn more', 'Report an issue', 'Customer reviews',
  'About this item', 'Shipping & Returns', 'Warranty', 'Videos', 'Add to List', 'Q&A', 'Description'])
  ok(`"${v}" is page furniture`, cleanAxes([{ name: 'Style', values: [v, 'also chrome? no'] }])[0].values.length === 1);

// ── The flat chip list gets the same cut ────────────────────────────────────
{
  const vs = cleanVariants([
    { key: 'Color:Blue', color: 'Blue', size: null },
    { key: 'Style:here', color: 'here', size: null },
    { key: 'Color:Green', color: 'Green', size: null },
    { key: 'one size', color: null, size: null },
  ]);
  ok('junk chips are not drawn', vs.length === 3 && !vs.some((v) => v.color === 'here'));
  ok('a variant with no size or colour is left alone', vs.some((v) => v.key === 'one size'));
}

// ── Wired where BOTH readers pass through ───────────────────────────────────
ok('the axes are cleaned at the single read point', /axes: cleanAxes\(data\?\.axes\)/.test(src));
ok('and the reason is judged on what survived', /const variants: any\[\] = cleanVariants\(/.test(src));

console.log(`\n${pass} checks passed`);
