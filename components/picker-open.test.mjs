// WHEN THE PRODUCT MODAL IS ALLOWED TO OPEN ITSELF.
//
// It opens so the shopper can PICK. Two ways that went wrong: it reopened over a product
// already in the box (show_shipment re-reads variants for the item it just added, so the
// modal sprang back after add-to-cart), and it opened on a one-size product where the
// picker renders no chips at all — a modal asking for a choice it does not offer.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
let pass = 0; const ok = (n, c) => { assert.ok(c, n); console.log('  ✓ ' + n); pass++; };

const sfc = readFileSync(new URL('./ShoppingAssistant.vue', import.meta.url), 'utf8');

// The template gate for show_shipment.
const line = sfc.split('\n').find((l) => l.includes("part.type === 'tool-show_shipment'") && l.includes('openPickerFor'));
ok('show_shipment only opens the picker while the item is HELD', /part\.output\?\.hold\s*&&/.test(line));
ok('and still requires variants to exist', /variants_for\?\.variants\?\.length/.test(line));

// The guard inside openPickerFor.
const body = sfc.match(/function openPickerFor\(o\) \{[\s\S]*?\n\}/)[0];
// The guard reads the axes (or rebuilds them from the variants — live Lab 2026-09-28: a payload without axes never
// opened the modal) and needs a real choice.
const axesFn = sfc.match(/function axesFromVariants\(variants\) \{[\s\S]*?\n\}/)[0];
const axesLine = body.match(/const axes = [^\n]*/)[0];
const guard = body.match(/if \(!axes\.some[^\n]*/)[0].replace("return ''", 'return false');
const realChoice = new Function('o', `${axesFn}\n${axesLine}\n${guard}; return true;`);
ok('a one-size product does not open the modal', realChoice({ axes: [{ name: 'Size', values: ['One Size'] }] }) === false);
ok('no axes at all does not open the modal', realChoice({ axes: [] }) === false);
ok('a real size run does open it', realChoice({ axes: [{ name: 'Size', values: ['M', 'L'] }] }) === true);
ok('a payload with NO axes but several colours in its variants opens it', realChoice({ variants: [{ size: '24oz', color: 'Plaid' }, { size: '24oz', color: 'Ghost' }] }) === true);
ok('one size but several colours still opens it', realChoice({ axes: [{ name: 'Size', values: ['One Size'] }, { name: 'Color', values: ['Black', 'Grey'] }] }) === true);

// The other call site is for a product the shopper has NOT added — it must stay.
ok('get_product_variants still opens the picker', /tool-get_product_variants[\s\S]{0,200}openPickerFor/.test(sfc));
// Nothing is pre-selected: the shopper picks on the chips (Alex, 2026-09-28).
ok('the picker carries no pre-selection into the modal', !/preselect/.test(body));
const modal = readFileSync(new URL('./ProductModal.vue', import.meta.url), 'utf8');
ok('the tapped card\'s photo leads the modal gallery', /props\.product\?\.image \? \[props\.product\.image, \.\.\.base\]/.test(modal));
ok('the modal adds no pre-selection', !/preselect/.test(modal));
console.log(`\n${pass} checks passed`);
