// What the model is TOLD after a variant read — the shopper is stuck whenever this lies.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
let pass = 0; const ok = (n, c) => { assert.ok(c, n); console.log('  ✓ ' + n); pass++; };

const src = readFileSync(new URL('./assistant.post.ts', import.meta.url), 'utf8');
const block = src.match(/const realChoice = \(r\.axes[\s\S]*?carrying size, color and quantity\.`/)[0].replace(/: any/g, '');
const noteFor = (r) => new Function('r', `const avail = r.variants.filter((v) => v.available); ${block}; return note;`)(r);

{
  // One size = the picker shows nothing, because there is nothing to pick.
  const n = noteFor({ variants: [{ available: true }], axes: [{ name: 'Size', values: ['One Size'] }], reason: null });
  ok('a one-size product never tells the shopper to pick', !/elige la talla/i.test(n));
  ok('it says there is nothing to choose', /NOTHING TO CHOOSE/.test(n));
  ok('and names what it comes as', /One Size/.test(n));
  ok('and says to add it now', /show_shipment/.test(n));
}
{
  // A real choice: chips are on screen, ask for the pick.
  const n = noteFor({ variants: [{ available: true }, { available: true }], axes: [{ name: 'Size', values: ['M', 'L'] }], reason: null });
  ok('a real choice still asks for the pick', /Elige la talla/.test(n));
  ok('and still forbids claiming it is in the box', /FORBIDDEN/.test(n));
}
{
  // A colour axis with several values is a real choice even if size has one.
  const n = noteFor({ variants: [{ available: true }], axes: [{ name: 'Size', values: ['One Size'] }, { name: 'Color', values: ['Black', 'Grey'] }], reason: null });
  ok('one size but several colours is still a choice', /Elige la talla/.test(n));
}
{
  const n = noteFor({ variants: [], axes: [], reason: 'blocked' });
  ok('an unread product does not stall the sale', /Do not stall/.test(n));
}
console.log(`\n${pass} checks passed`);
