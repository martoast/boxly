// A size picked before a colour stays picked while that colour's stock is checked (live Dick's 2026-10-15: M, then Black →
// "Comprobando disponibilidad de Black…" wiped M); the answer clears it only when that size is sold out in that colour.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const sfc = readFileSync(new URL('./VariantPicker.vue', import.meta.url), 'utf8')
const body = sfc.match(/watch\(colourStock, \(\) => \{([\s\S]*?)\n\}, \{ deep: true \}\)/)[1]
const run = new Function('axes', 'sel', 'colourStock', 'canPick', body)
const axes = { value: [{ name: 'Color', kind: 'color' }, { name: 'Size', kind: 'size' }] }
let sel = { Color: 'Black', Size: 'M' }
run(axes, sel, { Black: { pending: true } }, () => false)
assert.equal(sel.Size, 'M', 'kept while Black is being checked')
run(axes, sel, { Black: { pending: false, sizes: [{ value: 'M', available: true }] } }, () => true)
assert.equal(sel.Size, 'M', 'kept when M is in stock in Black')
run(axes, sel, { Black: { pending: false, sizes: [{ value: 'M', available: false }] } }, () => false)
assert.equal(sel.Size, null, 'cleared when M is sold out in Black')
// the pick message keys a second option of one kind by its own name (VS: Color + Print, both colour-kind)
{
  const line = sfc.split('\n').find((l) => l.includes('variants[k in variants ? a.name : k]'))
  const fn = new Function('axes', 'sel', `const variants = {}; ${line.trim()} return variants`)
  const v = fn({ value: [{ name: 'Color', kind: 'color' }, { name: 'Print', kind: 'color' }, { name: 'Size', kind: 'size' }] }, { Color: 'Black', Print: 'Stripes', Size: 'XS' })
  assert.deepEqual(v, { color: 'Black', Print: 'Stripes', size: 'XS' })
}
console.log('colour-stock-wait: all checks pass')
// a SOLD-OUT page colour is never pre-picked (live Costco 2026-10-24: Gray, sold out, came picked)
{
  const line = sfc.split('\n').find((l) => l.startsWith('const colourSoldOut = '))
  const fn = new Function('variants', `${line}; return colourSoldOut`)
  const soldOut = fn({ value: [{ options: { Color: 'Gray' }, available: false }, { options: { Color: 'Navy' }, available: true }, { options: { Size: 'M' }, available: null }] })
  assert.equal(soldOut({ name: 'Color' }, 'Gray'), true); assert.equal(soldOut({ name: 'Color' }, 'Navy'), false); assert.equal(soldOut({ name: 'Color' }, 'Tan'), false)
  console.log('colour-stock-wait: sold-out page colour not pre-picked')
}
