// Run: node --experimental-strip-types utils/linkList.test.mjs
import assert from 'node:assert/strict'
import { linkListUrls, linkListFromMetadata, linkListBox, LINK_LIST_MAX, isLinkOnly, isCartLink, cartLinks, statedQuantity, quantityOnly, keepsBoxAsIs, recentStatedQuantity } from './linkList.ts'
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

// ONE link pasted on its own goes to the card too (live 2026-10-17: a lone Walmart link got no reply — the server read passed the cut)
{
    assert.equal(isLinkOnly('https://www.walmart.com/ip/Starbucks-Fall-Blend/999606829?classType=VARIANT'), true)
  assert.equal(isLinkOnly('cotízame este https://www.walmart.com/ip/x/1'), true, 'a few words beside it')
  assert.equal(isLinkOnly('¿este viene en talla M y en color negro? y cuánto tarda en llegar a Tijuana? https://www.walmart.com/ip/x/1'), false, 'a real question stays with the assistant')
  assert.equal(isLinkOnly('https://a.com/p/1 https://b.com/p/2'), false, 'two links are the list path')
  assert.equal(isLinkOnly('hola'), false)
  console.log('isLinkOnly: ok')
}
console.log(bad ? `${bad} check(s) FAILED` : 'linkList: all checks pass')
// cart / bag / checkout pages are not products (live WSS 2026-10-18)
for (const u of ['https://www.shopwss.com/cart', 'https://www.amazon.com/gp/cart/view.html', 'https://www.on.com/en-us/cart', 'https://www.victoriassecret.com/us/vs/bag', 'https://shop.com/checkouts/cn/abc', 'https://www.target.com/account']) assert.equal(isCartLink(u), true, u)
for (const u of ['https://www.youngla.com/products/4117', 'https://www.target.com/p/x/-/A-1', 'https://www.walmart.com/ip/x/1', 'https://www.bathandbodyworks.com/p/bag-x', 'https://www.shopwss.com/products/07mxc00546?variant=1']) assert.equal(isCartLink(u), false, u)
assert.deepEqual(linkListUrls('https://www.shopwss.com/cart'), [])
assert.equal(isLinkOnly('https://www.shopwss.com/cart'), false)
assert.deepEqual(cartLinks('mira https://www.shopwss.com/cart.'), ['https://www.shopwss.com/cart'])
assert.deepEqual(linkListUrls('https://www.shopwss.com/cart https://www.youngla.com/products/4117'), ['https://www.youngla.com/products/4117'])

// a stated quantity — never a size, volume, percent or a product's own "6 Pack"
for (const [t, n] of [['Necesito 6 paquetes', 6], ['quiero 3', 3], ['dame seis', 6], ['x4', 4], ['cantidad 5', 5], ['son 12 piezas', 12], ['quiero 2 de este https://a.com/p/1', 2], ['quiero 2 packs', 2]]) assert.equal(statedQuantity(t), n, t)
for (const t of ['talla 9', '6 Pack Extra Large Crew', 'quiero los de 32 oz', 'necesito 10%', 'quiero 1', 'Quiero los 6 Pack Extra Large Crew en talla XL — agrégalos a mi caja']) assert.equal(statedQuantity(t), null, t)
assert.equal(quantityOnly('Necesito 6 paquetes'), 6)
assert.equal(quantityOnly('quiero 2 de este https://a.com/p/1'), null)
assert.equal(recentStatedQuantity(['https://www.shopwss.com/products/x', '07MXC00546', 'Necesito 6 paquetes']), 6)
assert.equal(recentStatedQuantity(['https://a.com/p/2', 'https://a.com/p/1', 'Necesito 6 paquetes']), null)
assert.equal(recentStatedQuantity(['https://a.com/p/2']), null)

// "solo el que ya agregué" keeps the box as it is (live Dick's 2026-10-18)
for (const t of ['entonces solo el jersey que ya había agregado', 'solo eso', 'nada más lo que tengo', 'solo lo que ya tengo en la caja']) assert.equal(keepsBoxAsIs(t), true, t)
for (const t of ['solo el negro', 'solo quiero ver', 'quiero el jersey', 'solo la talla M']) assert.equal(keepsBoxAsIs(t), false, t)

process.exit(bad ? 1 : 0)
