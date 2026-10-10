// Run: node --experimental-strip-types utils/linkList.test.mjs
import { linkListUrls, linkListFromMetadata, linkListBox, LINK_LIST_MAX } from './linkList.ts'
let bad = 0
const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) { bad++; console.log(`✗ ${name}\n  got  ${JSON.stringify(got)}\n  want ${JSON.stringify(want)}`) } }

const msg = `Hola, quiero estos:
1. https://www.gymshark.com/products/gymshark-everyday-seamless-leggings-black-aw23?variant=123,
2) http://www.ae.com/us/en/p/women/jeans/ae-mom-jean/4433_6396 y https://www.nordstromrack.com/s/marina-pleated-midi-dress/7034768.
https://www.gymshark.com/products/gymshark-everyday-seamless-leggings-black-aw23?variant=123
https://boxly.mx/app/search?c=1`
check('separators, trailing punctuation, http → https, duplicate and our own site dropped', linkListUrls(msg), [
  'https://www.gymshark.com/products/gymshark-everyday-seamless-leggings-black-aw23?variant=123',
  'https://www.ae.com/us/en/p/women/jeans/ae-mom-jean/4433_6396',
  'https://www.nordstromrack.com/s/marina-pleated-midi-dress/7034768',
])
check('a different ?variant= is another link', linkListUrls('https://a.com/p/1?variant=1 https://a.com/p/1?variant=2').length, 2)
check(`at most ${LINK_LIST_MAX}`, linkListUrls(Array.from({ length: 30 }, (_, i) => `https://shop.com/p/${i}`).join(' ')).length, LINK_LIST_MAX)
check('no links', linkListUrls('quiero unos tenis'), [])

const meta = { link_list: [
  { url: 'https://www.ae.com/us/en/p/x/1', title: 'AE Mom Jean', price: 41.97, quantity: 2, variants: { size: '6 Regular', Color: 'Black' } },
  { url: 'javascript:alert(1)', title: 'bad' },
  { url: 'https://www.gymshark.com/products/x', title: 'Leggings', quantity: 99, variants: { size: '', width: 'Standard' } },
  { title: 'no url' },
] }
const list = linkListFromMetadata(meta)
check('malformed entries dropped; quantity bounded; empty values dropped; keys lower-cased', list.map((e) => [e.title, e.quantity, e.variants]), [
  ['AE Mom Jean', 2, { size: '6 Regular', color: 'Black' }],
  ['Leggings', 1, { width: 'Standard' }],
])
check('box items and store options keyed by url', linkListBox(list), {
  items: [
    { name: 'AE Mom Jean', url: 'https://www.ae.com/us/en/p/x/1', quantity: 2, price: 41.97, size: '6 Regular', color: 'Black' },
    { name: 'Leggings', url: 'https://www.gymshark.com/products/x', quantity: 1 },
  ],
  storeOptions: [
    { key: 'https://www.ae.com/us/en/p/x/1', size: '6 Regular', color: 'Black', options: {} },
    { key: 'https://www.gymshark.com/products/x', size: null, color: null, options: { width: 'Standard' } },
  ],
})
check('no list in metadata', linkListFromMetadata({ pick: { size: 'M' } }), [])

console.log(bad ? `${bad} check(s) FAILED` : 'linkList: all checks pass')
process.exit(bad ? 1 : 0)
