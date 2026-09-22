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

// ── The 2026-09-21 shipment: 90 packs of face wipes ─────────────────────────
//
// A REAL CUSTOMER was told "llenarías la caja Chica con aproximadamente 85 a 90
// paquetes (100% de la capacidad, ~13.5 kg, dentro del límite de 15 kg)". Ninety of
// those is 1.9x that box's ENTIRE volume and ~27 kg. About 35 fit.
{
  const wipes = 'Neutrogena Makeup Remover Face Wipes, 25 count';
  ok('a tub of makeup-remover wipes is not a lipstick', archetypeFromName(wipes) === 'toiletry');
  ok('…and is about twice a perfume carton', itemUnits(wipes) === 0.10 && itemUnits('Dior Sauvage perfume') === 0.05);
  ok('…and weighs what wet goods weigh', itemKg(wipes) === 0.35);

  const r = buildShipment([{ name: wipes, quantity: 90 }]);
  ok('90 of them are no longer a Caja Chica', r.box_label !== 'Chica');
  ok('they are a Caja Grande', r.box_label === 'Grande');
  ok('and the weight is the lid, at ~31 kg not 13.5', r.limited_by === 'weight' && r.weight_kg > 25);

  // The guard that outlives this one product.
  ok('a 90-piece line is flagged as bulk', r.bulk === true);
  ok('three of something is not', buildShipment([{ name: wipes, quantity: 3 }]).bulk === false);
  ok('and the boundary is the line, not the total', buildShipment([{ name: wipes, quantity: 12 }, { name: wipes, quantity: 12 }]).bulk === false);
}

// Toiletries must not swallow the genuinely tiny things beside them.
for (const n of ['Dior Sauvage Eau de Parfum', 'Touchland Power Mist Sanitizer', 'Fenty Gloss Bomb Lip Luminizer', 'The Ordinary Niacinamide Serum 30ml'])
  ok(`"${n}" is still rigid_small`, archetypeFromName(n) === 'rigid_small');

// ── A WORD, NOT A RUN OF LETTERS ────────────────────────────────────────────
//
// Found chasing the wipes: bare substrings were matching inside longer words, and
// each hit was worth a box size or two. "Makeup REMOver" was a rowing oar.
for (const [name, want] of [
  ['Neutrogena Makeup Remover Face Wipes', 'toiletry'],     // remo  → oversize_long, 21 su
  ['Ray-Ban Aviator Sunglasses', 'rigid_small'],            // glass → fragile, a lamp
  ['Samsonite Suitcase 28in', 'bulky_soft'],                // case  → rigid_small
  ['Levis 725 Bootcut Jeans', 'medium_soft'],               // boot  → shoes
  ['Nike Spring Jacket', 'medium_soft'],                    // ring  → rigid_small
  ['Cardigan Sweater Knit', 'medium_soft'],                 // card  → rigid_small
  ['Oxford Collared Shirt', 'flat_soft'],                   // collar→ rigid_small
  ['Samsung Pantalla 32 pulgadas', 'rigid_large'],          // pant  → medium_soft
]) ok(`"${name}" is ${want}`, archetypeFromName(name) === want);
for (const n of ['Steering Wheel Cover', 'Vaseline Lip Therapy'])
  ok(`"${n}" matches nothing rather than the wrong thing`, archetypeFromName(n) === null || archetypeFromName(n) === 'rigid_small');

// …without breaking the words they were there for in the first place.
for (const [name, want] of [
  ['Wilson Wooden Oar Remo', 'oversize_long'], ['Timberland 6-Inch Boots', 'shoes'],
  ['Nike Trail Running Shoes', 'shoes'], ['Crystal Vase', 'fragile'],
  ['Drinking Glasses Set of 4', 'fragile'], ['Pandora Silver Ring', 'rigid_small'],
  ['Pokemon Trading Cards', 'rigid_small'], ['Ray-Ban Eyeglass Case', 'rigid_small'],
  ['Raincoat Yellow', 'bulky_soft'], ['Coleman 4-Person Tent', 'bulky_soft'],
  ['Cargo Pant Olive', 'medium_soft'], ['Nike Crew Socks', 'flat_soft'],
]) ok(`"${name}" still reads as ${want}`, archetypeFromName(name) === want);
for (const n of ['Neutrogena Makeup Remover Towelettes', 'Head & Shoulders Shampoo 400ml', 'Dove Deodorant 3-pack',
  'Pampers Diapers Size 4', 'Neutrogena Micellar Water', 'La Roche-Posay Sunscreen SPF 50'])
  ok(`"${n}" is a drugstore package`, archetypeFromName(n) === 'toiletry');
ok('ten sanitizers still barely move the bar', ship(Array(10).fill('Touchland Power Mist Sanitizer')).label === 'Chica');

// ── A CASE OF POKER CHIPS IS MOSTLY CHIPS ──────────────────────────────────
//
// Erick added a 500-chip set and the bar read 3%. The title says the answer out loud:
// "500PCS … 11.5 Gram" is 5.75 kg of clay before the aluminium case. Alex sized it by
// hand at "50% of a small" (2026-09-22).
{
  const comie = 'Comie Poker Chips,500PCS Poker Chip Set with Aluminum Travel Case,11.5 Gram Poker Set for Texas Holdem';
  const loy = 'Loychip 500 Piece Poker Chip Set Texas Holdem Blackjack 14G Heavy Clay Composite Numbered Chips With Aluminum Case';
  ok('500 chips at 11.5 g weigh 7 kg, not 0.8', itemKg(comie) === 7);
  ok('…and about half a Caja Chica, which is what Alex measured by eye', Math.round(itemKg(comie) / 15 * 100) === 47);
  ok('a heavier 14 g set is heavier still', itemKg(loy) === 8.2);
  ok('a 300-chip set is proportionally lighter', itemKg('Classic Games 300 Piece Premium ClayFeel Poker Chip Set') === 4.7);
  ok('an unspecified poker set falls back to a 500/11.5 g default', itemKg('Deluxe Poker Chip Set with Case') === 7);
  const r = buildShipment([{ name: comie, quantity: 1, type: 'rigid_medium' }]);
  ok('so the bar is no longer 3%', r.capacity_used_pct > 40);
  ok('and weight is what is filling the box', r.limited_by === 'weight');
}
ok('a deck of cards is not a chip set', itemKg('Copag 1546 Playing Cards') !== 7);

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
