// The picker's rules (utils/pickerLogic.ts), on the live cases of 2026-09-28.
import assert from 'node:assert/strict'
import { simulatePick } from './pickerLogic.ts'
let pass = 0; const ok = (n, c) => { assert.ok(c, n); console.log('  ✓ ' + n); pass++ }
const alo = { axes: [{ name: 'Color', kind: 'color', values: ['Black'] }, { name: 'Size', kind: 'size', values: ['XXS', 'XS', 'S', 'M', 'L'] }, { name: 'Length', kind: 'length', values: ['7/8 24"'] }], axes_independent: false, variants: ['XXS', 'XS', 'S', 'M', 'L'].map((s) => ({ options: { Size: s }, available: true })) }
ok('Alo colourway page: size S completes the pick (colour and length are fixed)', simulatePick(alo, { size: 'S' }).complete)
const nbRaw = { axes_independent: true, axes: [{ name: 'Color', kind: 'color', values: ['A', 'B'] }, { name: 'Size', kind: 'size', values: ['9 (9)', '10 (10)'] }], variants: [{ options: { Color: 'A' }, available: false }, { options: { Color: 'B' }, available: false }, { options: { Size: '9 (9)' }, available: true }, { options: { Size: '10 (10)' }, available: true }] }
ok('every colour read as sold out: the pick is stuck on colour (what the app clean-up prevents)', simulatePick(nbRaw).stuckOn === 'Color')
const matrix = { axes: [{ name: 'Color', values: ['Black', 'Grey'] }, { name: 'Size', values: ['S', 'M'] }], variants: [{ options: { Color: 'Black', Size: 'S' }, available: false }, { options: { Color: 'Black', Size: 'M' }, available: true }, { options: { Color: 'Grey', Size: 'S' }, available: true }] }
ok('matrix: a sold-out combination is not completed', !simulatePick(matrix, { color: 'Black', size: 'S' }).complete)
ok('matrix: an in-stock one is', simulatePick(matrix, { color: 'Black', size: 'M' }).complete)
ok('no preference: the first reachable combination', simulatePick(matrix).complete)
// sold_out_with (reader 2026-09-28): New Balance marks Narrow sold out only for the colour on screen (Bayberry).
const nbw = { axes_independent: true, axes: [{ name: 'Color', kind: 'color', values: ['BLACK with WHITE', 'BLACK with BAYBERRY'] }, { name: 'Size', kind: 'size', values: ['9 (9)'] }, { name: 'Width', kind: 'width', values: ['Narrow (B)', 'Standard (D)'] }],
  variants: [{ options: { Color: 'BLACK with WHITE' }, available: null }, { options: { Color: 'BLACK with BAYBERRY' }, available: null }, { options: { Size: '9 (9)' }, available: true },
    { options: { Width: 'Narrow (B)' }, available: null, sold_out_with: { Color: 'BLACK with BAYBERRY' } }, { options: { Width: 'Standard (D)' }, available: true }] }
ok('a width sold out only with the colour on screen: another colour + that width completes', simulatePick(nbw, { color: 'BLACK with WHITE', size: '9 (9)', width: 'Narrow (B)' }).complete)
ok('…and that exact combination is blocked', !simulatePick(nbw, { color: 'BLACK with BAYBERRY', size: '9 (9)', width: 'Narrow (B)' }).complete)
ok('…while the same colour with another width completes', simulatePick(nbw, { color: 'BLACK with BAYBERRY', size: '9 (9)', width: 'Standard (D)' }).complete)
console.log(`\n${pass} checks passed`)
