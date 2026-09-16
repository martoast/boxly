// WHICH BOX THE SHIPMENT ACTUALLY NEEDS.
//
// A PlayStation 3 console and a BMX handlebar were both called "Mediano" and together read
// as 16% of a Caja Chica (Alex, 2026-09-15). The console matched "console" in the tier whose
// examples are bottles and tumblers; the handlebar matched nothing and fell to the generic
// medium default. A Caja Chica is 42x27x32 cm — a 74 cm handlebar does not go in it at all.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
let pass = 0; const ok = (n, c) => { assert.ok(c, n); console.log('  ✓ ' + n); pass++; };

const src = readFileSync(new URL('./assistant.post.ts', import.meta.url), 'utf8');
const pick = (re) => { const m = src.match(re); if (!m) throw new Error('missing ' + re); return m[0]; };
const mod = [
  pick(/const ARCHETYPE_VOL[\s\S]*?\n\}/),
  pick(/const DEFAULT_VOL = [^\n]*/),
  pick(/const BOXES = \[[\s\S]*?\n\]/),
  ...['RE_OVERSIZE_LONG', 'RE_SHOES', 'RE_FRAGILE', 'RE_RIGID_SMALL', 'RE_RIGID_LARGE', 'RE_BULKY', 'RE_MEDIUM', 'RE_RIGID_MEDIUM', 'RE_FLAT_SOFT']
    .map((n) => pick(new RegExp(`const ${n} = [^\\n]*`))),
  pick(/function archetypeFromName\([\s\S]*?\n\}/),
  'export { archetypeFromName, ARCHETYPE_VOL, DEFAULT_VOL, BOXES }',
].join('\n');
const f = join(mkdtempSync(join(tmpdir(), 'boxfit-')), 'm.ts');
writeFileSync(f, mod);
const { archetypeFromName, ARCHETYPE_VOL, DEFAULT_VOL, BOXES } = await import(f);

const vol = (name) => { const a = archetypeFromName(name); return a ? ARCHETYPE_VOL[a] : DEFAULT_VOL; };
const boxFor = (names) => {
  const total = names.reduce((s, n) => s + vol(n), 0);
  return (BOXES.find((b) => total <= b.usable * 1.15) || BOXES[BOXES.length - 1]).label;
};

// The exact shipment from the screenshot.
{
  const ps3 = 'Restored Sony PlayStation 3 Slim 120GB Black Console';
  const bar = 'Eastern Bikes Throttle BMX Chromoly Handlebar';
  ok('a console is not a tumbler', archetypeFromName(ps3) === 'rigid_large');
  ok('a BMX handlebar is a long rigid item', archetypeFromName(bar) === 'oversize_long');
  ok('and the two together no longer fit a Caja Chica', boxFor([ps3, bar]) !== 'Chica');
}
// Consoles by name.
for (const n of ['PlayStation 5 Digital', 'Xbox Series X', 'Nintendo Switch OLED', 'Ninja Air Fryer 8qt', 'Samsung 27" Monitor'])
  ok(`"${n}" is bulky rigid`, archetypeFromName(n) === 'rigid_large');

// The small-electronics tier must survive — a speaker is not a microwave.
ok('a bluetooth speaker is still rigid_medium', archetypeFromName('JBL Flip 6 Bluetooth Speaker') === 'rigid_medium');
ok('an Owala bottle is still rigid_medium', archetypeFromName('Owala FreeSip 32oz Bottle') === 'rigid_medium');
ok('a Stanley tumbler is still rigid_medium', archetypeFromName('Stanley Quencher H2.0 Tumbler') === 'rigid_medium');

// Clothing tiers untouched.
ok('a tee is still flat_soft', archetypeFromName('Puma Graphic Tee') === 'flat_soft');
ok('a hoodie is still medium_soft', archetypeFromName('Alo Accolade Hoodie') === 'medium_soft');
ok('sneakers are still shoes', archetypeFromName('Nike Pegasus 41 Running Shoes') === 'shoes');

// A realistic clothing box must not have moved.
ok('ten tees still fit a Chica', boxFor(Array(10).fill('Puma Graphic Tee')) === 'Chica');
console.log(`\n${pass} checks passed`);
