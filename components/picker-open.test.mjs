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
const realChoice = new Function('o', `${body.match(/if \(!\(o\.axes[^\n]*/)[0].replace('return \'\'', 'return false')}; return true;`);
ok('a one-size product does not open the modal', realChoice({ axes: [{ name: 'Size', values: ['One Size'] }] }) === false);
ok('no axes at all does not open the modal', realChoice({ axes: [] }) === false);
ok('a real size run does open it', realChoice({ axes: [{ name: 'Size', values: ['M', 'L'] }] }) === true);
ok('one size but several colours still opens it', realChoice({ axes: [{ name: 'Size', values: ['One Size'] }, { name: 'Color', values: ['Black', 'Grey'] }] }) === true);

// The other call site is for a product the shopper has NOT added — it must stay.
ok('get_product_variants still opens the picker', /tool-get_product_variants[\s\S]{0,200}openPickerFor/.test(sfc));
console.log(`\n${pass} checks passed`);
