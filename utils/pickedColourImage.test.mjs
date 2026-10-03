// The picked colour's photo from the chat's own picker reads (Alex 2026-10-03: "make the image match the color").
import { pickedColourImage } from './pickerLogic.ts'

let passed = 0, failed = 0
const check = (name, ok) => { if (ok) { passed++; console.log(`  ✓ ${name}`) } else { failed++; console.log(`  ✗ ${name}`) } }
const picker = (url, read) => ({ role: 'assistant', parts: [{ type: 'tool-product_picker', state: 'output-available', output: { read_url: url, product: { url }, read } }] })
const url = 'https://www.aloyoga.com/products/w4675r-cropped-micro-plisse-jacket-black'
const read = { variants: [
  { options: { Color: 'Black', Size: 'M' }, color: 'Black', image: 'https://cdn.alo/black.jpg' },
  { options: { Color: 'White', Size: 'M' }, color: 'White', image: 'https://cdn.alo/white.jpg' },
] }
const msgs = [picker(url, read)]
check('the picked colour gives its own photo', pickedColourImage(msgs, url, 'White') === 'https://cdn.alo/white.jpg')
check('case and the query string do not matter', pickedColourImage(msgs, url + '?variant=1', 'white') === 'https://cdn.alo/white.jpg')
check('another page: no photo', pickedColourImage(msgs, 'https://www.aloyoga.com/products/other', 'White') === null)
check('an unknown colour: no photo', pickedColourImage(msgs, url, 'Espresso') === null)
check('no colour: no photo', pickedColourImage(msgs, url, null) === null)
const swatchOnly = [picker(url, { axes: [{ name: 'Color', values: ['Navy'], swatches: { Navy: 'https://cdn.alo/navy.jpg' } }] })]
check('a swatch when the variants carry no photo', pickedColourImage(swatchOnly, url, 'Navy') === 'https://cdn.alo/navy.jpg')
console.log(`\n${passed} passed, ${failed} failed`)
if (failed) process.exit(1)
