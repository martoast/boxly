// A pick typed in the chat against the open picker cards (utils/typedPick.ts).
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
// typedPick.ts imports './pickerLogic' without an extension (as the Nuxt build wants); resolve it to the .ts file here.
registerHooks({ resolve(spec, ctx, next) { try { return next(spec, ctx) } catch (e) { if (/^\.\.?\//.test(spec) && !/\.[a-z]+$/.test(spec)) return next(spec + '.ts', ctx); throw e } } })
const { resolveTypedPick, pickerCards, pickerCardsAsText, PICKER_PART } = await import('./typedPick.ts')

let pass = 0; const ok = (n, c) => { assert.ok(c, n); console.log('  ✓ ' + n); pass++ }
const card = (url, read, title = 'Producto') => ({ role: 'assistant', parts: [{ type: PICKER_PART, state: 'output-available', output: { product: { url, title, store_name: 'Tienda' }, read, read_at: '2026-09-29T00:00:00Z' } }] })

const shoe = {
  axes: [{ name: 'Color', kind: 'color', values: ['Black', 'Black Watch', 'Rosá'] }, { name: 'Size', kind: 'size', values: ['9', '9.5', '10'] }],
  variants: [
    { options: { Color: 'Black', Size: '9' }, available: true }, { options: { Color: 'Black', Size: '9.5' }, available: true }, { options: { Color: 'Black', Size: '10' }, available: false },
    { options: { Color: 'Black Watch', Size: '9' }, available: true }, { options: { Color: 'Rosá', Size: '9' }, available: true },
  ],
}
const tee = { axes: [{ name: 'Size', kind: 'size', values: ['S', 'M', 'L'] }], variants: [{ options: { Size: 'S' }, available: true }, { options: { Size: 'M' }, available: true }, { options: { Size: 'L' }, available: true }] }
const one = pickerCards([card('https://s.com/shoe', shoe)])

let r = resolveTypedPick('la negra en talla 9', one)
ok('unique match: "la negra en talla 9" → Black / 9', r.ok && r.pick.Color === 'Black' && r.pick.Size === '9' && r.url === 'https://s.com/shoe')
r = resolveTypedPick('Black, size 9.5', one)
ok('size "9.5" is 9.5, never 9', r.ok && r.pick.Size === '9.5')
r = resolveTypedPick('black talla 9.5', pickerCards([card('https://s.com/x', { axes: [{ name: 'Color', values: ['Black'] }, { name: 'Size', values: ['9', '10'] }], variants: [{ options: { Color: 'Black', Size: '9' }, available: true }, { options: { Color: 'Black', Size: '10' }, available: true }] })]))
ok('size "9" does not match a typed "9.5" (no such size → nothing picked)', !r.ok)
r = resolveTypedPick('la Black Watch en 9', one)
ok('colour "Black" does not match "Black Watch"', r.ok && r.pick.Color === 'Black Watch')
r = resolveTypedPick('la rosa talla 9', one)
ok('accents: "rosa" matches "Rosá"', r.ok && r.pick.Color === 'Rosá')
r = resolveTypedPick('ROSÁ 9', one)
ok('case/accent-insensitive both ways', r.ok && r.pick.Color === 'Rosá')
r = resolveTypedPick('la negra', one)
ok('missing axis → incomplete, names the axis', !r.ok && r.reason === 'incomplete' && r.missing.join() === 'Size')
r = resolveTypedPick('negra talla 10', one)
ok('sold-out combination is refused', !r.ok && r.reason === 'sold_out')
r = resolveTypedPick('negra 9 o 10', one)
ok('two values on one axis → ambiguous', !r.ok && r.reason === 'ambiguous')
const two = pickerCards([card('https://s.com/shoe', shoe), card('https://s.com/shoe2', shoe, 'Otro tenis')])
r = resolveTypedPick('la negra en talla 9', two)
ok('two cards match → ambiguous', !r.ok && r.reason === 'ambiguous')
r = resolveTypedPick('talla M', pickerCards([card('https://s.com/shoe', shoe), card('https://s.com/tee', tee)]))
ok('only the card whose values are named counts (tee M)', r.ok && r.url === 'https://s.com/tee' && r.pick.Size === 'M')
r = resolveTypedPick('quiero el negro', pickerCards([card('https://s.com/tee', tee)]))
ok('a short value is never found inside a word ("el" is not size L)', !r.ok && r.reason === 'no_match')
ok('no card, no pick (the first search message never preselects)', resolveTypedPick('la negra en talla 9', []).reason === 'no_card')
// sold_out_with (New Balance widths): the typed combination blocked for that colour is refused.
const nb = { axes_independent: true, axes: [{ name: 'Color', kind: 'color', values: ['BLACK with WHITE', 'BLACK with BAYBERRY'] }, { name: 'Size', kind: 'size', values: ['9 (9)', '10 (10)'] }, { name: 'Width', kind: 'width', values: ['Narrow (B)', 'Standard (D)'] }],
  variants: [{ options: { Color: 'BLACK with WHITE' }, available: null }, { options: { Color: 'BLACK with BAYBERRY' }, available: null }, { options: { Size: '9 (9)' }, available: true }, { options: { Size: '10 (10)' }, available: true },
    { options: { Width: 'Narrow (B)' }, available: null, sold_out_with: { Color: 'BLACK with BAYBERRY' } }, { options: { Width: 'Standard (D)' }, available: true }] }
const nbCards = pickerCards([card('https://nb.com/p', nb)])
r = resolveTypedPick('black with white, ancho B, talla 9', nbCards)
ok('parenthesised values answer to their short name ("B", "9")', r.ok && r.pick.Width === 'Narrow (B)' && r.pick.Size === '9 (9)')
r = resolveTypedPick('black with bayberry, ancho B, talla 9', nbCards)
ok('sold_out_with: the blocked colour + width is refused', !r.ok && r.reason === 'sold_out')
// Colourways sold as their own pages: naming another colourway is not a pick of the one on screen.
const cw = { ...tee, product: { url: 'https://s.com/tee-black' }, colorways: [{ name: 'Black', url: 'https://s.com/tee-black', current: true }, { name: 'Olive', url: 'https://s.com/tee-olive' }] }
r = resolveTypedPick('la olive en M', pickerCards([card('https://s.com/tee-black', cw)]))
ok('a colourway not on screen needs its chip', !r.ok && r.reason === 'colorway')
// History: the latest read per product wins; the model sees a line of text, never the raw part.
const hist = [card('https://s.com/tee', { ...tee, variants: tee.variants.map((v) => ({ ...v, available: false })) }), { role: 'user', parts: [{ type: 'text', text: 'actualiza' }] }, card('https://s.com/tee', tee)]
ok('one card per product, latest read', pickerCards(hist).length === 1 && resolveTypedPick('M', pickerCards(hist)).ok)
const asText = pickerCardsAsText([...hist, { role: 'assistant', parts: [{ type: PICKER_PART, state: 'input-available', input: { product: { url: 'https://s.com/y', title: 'Y' } } }] }], () => 'p1')
ok('cards replay as text for the model (ready and still reading)', asText.every((m) => m.parts.every((p) => p.type === 'text')) && /Size: S, M, L/.test(asText[0].parts[0].text) && /leyendo/.test(asText[3].parts[0].text))
console.log(`\n${pass} checks passed`)
