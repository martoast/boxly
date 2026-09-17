// WHICH BOX THE SHIPMENT ACTUALLY NEEDS.
//
// A PlayStation 3 console and a BMX handlebar were both called "Mediano" and together read
// as 16% of a Caja Chica (Alex, 2026-09-15). The console matched "console" in the tier whose
// examples are bottles and tumblers; the handlebar matched nothing and fell to the generic
// medium default. A Caja Chica is 42x27x32 cm — a 74 cm handlebar does not go in it at all.
//
// Then a bowling ball and an Intex above-ground pool read as 23% of a Caja Chica, with
// "te queda 77%" and an invitation to add more (Alex, 2026-09-16). Two more holes: no box
// takes a pool at ALL, and weight — the other lid on every box — was never modelled.
//
// This used to cut the model out of assistant.post.ts with regexes, because the model lived
// there in a copy. It lives in boxMath.ts now, alone, so the test just imports it.
import assert from 'node:assert/strict';
import {
  archetypeFromName, archetypeOf, isUnboxable, itemUnits, itemKg, fitTier, boxForLoad, ARCH_LABEL,
} from '../utils/boxMath.ts';
let pass = 0; const ok = (n, c) => { assert.ok(c, n); console.log('  ✓ ' + n); pass++; };

// THE REAL buildShipment, not a copy of it.
//
// This test used to re-implement the box maths beside the code it was testing, which is
// precisely the mistake that produced the bug: two copies of one model, drifting. So it
// lifts the actual function out of assistant.post.ts and runs THAT. The temp module sits
// next to the source so its `../utils/boxMath` import still resolves.
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
const src = readFileSync(new URL('./assistant.post.ts', import.meta.url), 'utf8');
const cut = (re) => { const m = src.match(re); if (!m) throw new Error('missing ' + re); return m[0]; };
const tmp = new URL('./__box-fit.tmp.ts', import.meta.url);
writeFileSync(tmp, [
  "import { itemUnits, itemKg, isUnboxable, archetypeOf, fitTier, ARCH_LABEL } from '../utils/boxMath.ts'",
  cut(/const BOXES = \[[\s\S]*?\n\]/),
  cut(/function buildShipment\(items: any\[\]\) \{[\s\S]*?\n\}/),
  'export { buildShipment }',
].join('\n'));
let buildShipment;
try { ({ buildShipment } = await import(tmp.href)); } finally { unlinkSync(tmp); }

/** A shipment of plain product names, exactly as show_shipment would build it. */
const ship = (names) => {
  const r = buildShipment(names.map((name) => ({ name })));
  return { label: r.box_label, used: r.capacity_used_pct, limited_by: r.limited_by, unboxable: r.unboxable };
};

// ── The exact shipment from the 2026-09-16 screenshot ────────────────────────
{
  const ball = 'Hammer Black Widow 3.0 Solid Bowling Ball';
  const pool = 'Intex Rectangular Frame Above Ground Outdoor Pool';
  ok('an above-ground pool fits in no box at all', isUnboxable(pool));
  ok('…and the model calling it a pillow does not change that', isUnboxable(pool, 'bulky_soft'));
  ok('a bowling ball still goes in a box', !isUnboxable(ball));
  ok('…and weighs 7 kg, not the 0.8 its shape suggests', itemKg(ball) === 7);

  const s = ship([ball, pool]);
  ok('the pool is reported as not in the box', s.unboxable.length === 1 && s.unboxable[0] === pool);
  ok('the bar is no longer 23%', s.used !== 23);
  ok('it reads about half a Caja Chica, because 7 of 15 kg is', s.used >= 40 && s.used <= 55);
  ok('and it says so: the limit is weight, not space', s.limited_by === 'weight');
}

// ── Weight is a real lid ─────────────────────────────────────────────────────
ok('two bowling balls no longer fit a Chica (14 kg + the ball already there)', ship(Array(3).fill('Hammer Black Widow Bowling Ball')).label !== 'Chica');
{ // 15 kg exactly is the Chica's published limit — it fits, and it fills it.
  const b = ship(['Optima RedTop Car Battery']);
  ok('a car battery alone fills a Chica to its weight limit', b.label === 'Chica' && b.used === 100 && b.limited_by === 'weight');
  ok('and a second one needs a bigger box', ship(['Optima RedTop Car Battery', 'Optima RedTop Car Battery']).label !== 'Chica');
}
ok('a pair of dumbbells is weight-limited, not volume-limited', ship(['Bowflex Adjustable Dumbbell']).limited_by === 'weight');
ok('ten tees are still volume-limited', ship(Array(10).fill('Puma Graphic Tee')).limited_by === 'volume');

// ── Freight, by name ─────────────────────────────────────────────────────────
for (const n of ['Intex 15ft Above Ground Pool Set', 'Zinus 12" Queen Mattress', 'Alberca estructural rectangular',
  'Samsung 27 cu ft Refrigerator', 'LG Front Load Washer', 'Modway Loveseat Sofa', 'NordicTrack Treadmill',
  'TCL 65" Class QLED 4K Smart TV', 'Weber Spirit II Gas Grill', 'Intex Explorer K2 Kayak'])
  ok(`"${n}" needs a human, not a box`, isUnboxable(n));
ok('the label says as much', ARCH_LABEL.oversize_freight === 'No cabe en caja');

// Freight must not eat ordinary products.
for (const n of ['Intex Pool Float Lounger', 'Nike Pool Slide Sandal', 'Yeti Roadie 24 Cooler',
  'Sony 55 Inch Headphones Stand', 'JBL Flip 6 Bluetooth Speaker', 'Alo Yoga Mat'])
  ok(`"${n}" is still an ordinary box item`, !isUnboxable(n));

// ── The 2026-09-15 shipment must stay fixed ──────────────────────────────────
{
  const ps3 = 'Restored Sony PlayStation 3 Slim 120GB Black Console';
  const bar = 'Eastern Bikes Throttle BMX Chromoly Handlebar';
  ok('a console is not a tumbler', archetypeFromName(ps3) === 'rigid_large');
  ok('a BMX handlebar is a long rigid item', archetypeFromName(bar) === 'oversize_long');
  ok('and the two together no longer fit a Caja Chica', ship([ps3, bar]).label !== 'Chica');
  // The drift this fix closed: boxMath had no rigid_large, so the cost card sized
  // the same console at the 0.40 default while the box card said 2.20.
  ok('the pricing ladder agrees about the console', itemUnits(ps3) === 2.20);
  ok('…and about the handlebar', boxForLoad(itemUnits(bar), itemKg(bar)).key === 'XL');
}
for (const n of ['PlayStation 5 Digital', 'Xbox Series X', 'Nintendo Switch OLED', 'Ninja Air Fryer 8qt', 'Samsung 27" Monitor'])
  ok(`"${n}" is bulky rigid`, archetypeFromName(n) === 'rigid_large');

// ── The small-electronics tier must survive — a speaker is not a microwave ──
ok('a bluetooth speaker is still rigid_medium', archetypeFromName('JBL Flip 6 Bluetooth Speaker') === 'rigid_medium');
ok('an Owala bottle is still rigid_medium', archetypeFromName('Owala FreeSip 32oz Bottle') === 'rigid_medium');
ok('a Stanley tumbler is still rigid_medium', archetypeFromName('Stanley Quencher H2.0 Tumbler') === 'rigid_medium');

// ── Clothing tiers untouched ────────────────────────────────────────────────
ok('a tee is still flat_soft', archetypeFromName('Puma Graphic Tee') === 'flat_soft');
ok('a hoodie is still medium_soft', archetypeFromName('Alo Accolade Hoodie') === 'medium_soft');
ok('sneakers are still shoes', archetypeFromName('Nike Pegasus 41 Running Shoes') === 'shoes');
ok('ten tees still fit a Chica', ship(Array(10).fill('Puma Graphic Tee')).label === 'Chica');
ok('a model-supplied type still wins for ordinary items', archetypeOf('Mystery Thing', 'flat_soft') === 'flat_soft');

console.log(`\n${pass} checks passed`);
