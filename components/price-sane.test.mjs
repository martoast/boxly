// A read price far under the card's is a misread (live VS 2026-10-16: $49.95 pajamas shown as $8, the AK/HI shipping line): the card's price stands.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
for (const [file, name, ctx] of [['ProductPickerCard.vue', 'sanePrice', 'product'], ['ProductModal.vue', 'sane', 'props']]) {
  const sfc = readFileSync(new URL(`./${file}`, import.meta.url), 'utf8')
  const line = sfc.split('\n').find((l) => l.startsWith(`const ${name} = (p) =>`))
  assert.ok(line, `${file}: ${name}`)
  const make = (card) => new Function(ctx, `${line}; return ${name}`)(ctx === 'props' ? { product: { price: card } } : { value: { price: card } })
  assert.equal(make(49.95)(8), 49.95, `${file}: $8 under a $49.95 card is the card's price`)
  assert.equal(make(49.95)(39.95), 39.95, `${file}: a real sale price stands`)
  assert.equal(make(5)(1.5), 1.5, `${file}: cheap cards are left alone`)
  assert.equal(make(undefined)(8), 8, `${file}: no card price, nothing to compare`)
}
console.log('price-sane: all checks pass')
