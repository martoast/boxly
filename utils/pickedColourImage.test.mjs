// The picked colour's photo from the chat's own picker reads (Alex 2026-10-03: "make the image match the color").
import { pickedColourImage, pickedVariantPrice } from './pickerLogic.ts'

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
check('www. or not is the same page (Owala variant rows)', pickedColourImage(msgs, url.replace('https://www.', 'https://'), 'White') === 'https://cdn.alo/white.jpg')
check('another page: no photo', pickedColourImage(msgs, 'https://www.aloyoga.com/products/other', 'White') === null)
check('an unknown colour: no photo', pickedColourImage(msgs, url, 'Espresso') === null)
check('no colour: no photo', pickedColourImage(msgs, url, null) === null)
const swatchOnly = [picker(url, { axes: [{ name: 'Color', values: ['Navy'], swatches: { Navy: 'https://cdn.alo/navy.jpg' } }] })]
check('a swatch when the variants carry no photo', pickedColourImage(swatchOnly, url, 'Navy') === 'https://cdn.alo/navy.jpg')
// the picked variant's price, not the card's "desde" (Owala 2026-10-07: $23.99 shown for a $34.99 colour)
{
  const ow = 'https://owalalife.com/products/freesip'
  const owRead = { variants: [
    { options: { Color: 'Water in the Desert', Size: '24oz' }, color: 'Water in the Desert', size: '24oz', price: 23.99, image: 'https://cdn/wid.png' },
    { options: { Color: 'Plaid and Simple', Size: '24oz' }, color: 'Plaid and Simple', size: '24oz', price: 34.99, image: 'https://cdn/plaid24.png' },
    { options: { Color: 'Plaid and Simple', Size: '32oz' }, color: 'Plaid and Simple', size: '32oz', price: 39.99, image: 'https://cdn/plaid32.png' },
  ] }
  const m = [picker(ow, owRead)]
  check('picked colour + size price', pickedVariantPrice(m, ow, 'Plaid and Simple', '24oz') === 34.99)
  check('colour only: its cheapest', pickedVariantPrice(m, ow, 'plaid and simple') === 34.99)
  check('the www. variant link finds the same read', pickedVariantPrice(m, 'https://www.owalalife.com/products/freesip?variant=2', 'Plaid and Simple', '24oz') === 34.99)
  check('options-only rows (no .color)', pickedVariantPrice([picker(ow, { variants: [{ options: { Color: 'Navy', Size: 'M' }, price: 50 }] })], ow, 'Navy', 'M') === 50)
  check('unknown colour: null', pickedVariantPrice(m, ow, 'Espresso') === null)
  check('its photo too', pickedColourImage(m, 'https://www.owalalife.com/products/freesip?variant=2', 'Plaid and Simple') === 'https://cdn/plaid24.png')
}
console.log(`\n${passed} passed, ${failed} failed`)
if (failed) process.exit(1)
