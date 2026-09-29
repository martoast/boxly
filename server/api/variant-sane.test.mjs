// An option misread as sold out in every value (live New Balance 2026-09-28: all 8 colours) becomes pickable-unknown.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
let pass = 0; const ok = (n, c) => { assert.ok(c, n); console.log('  ✓ ' + n); pass++ }
const src = readFileSync(new URL('./product-variants.post.ts', import.meta.url), 'utf8')
const fn = src.match(/function sane\(r: any\) \{[\s\S]*?\n  \}\n/)[0].replace(/: any\[\]|: any|<string, any\[\]>/g, '')
const sane = new Function(`${fn}; return sane`)()
const v = (axis, value, available) => ({ key: `${axis}:${value}`, options: { [axis]: value }, available })
const nb = { axes_independent: true, variants: [v('Color', 'BLACK with WHITE', false), v('Color', 'REFLECTION', false), v('Size', '9 (9)', true), v('Size', '10 (10)', false)] }
const out = sane(nb)
ok('every colour "sold out" next to available sizes: colours become unknown', out.variants.filter((x) => x.options.Color).every((x) => x.available === null))
ok('the sizes keep their real availability', out.variants.find((x) => x.key === 'Size:9 (9)').available === true && out.variants.find((x) => x.key === 'Size:10 (10)').available === false)
ok('a product with nothing available is left as it is (really sold out)', sane({ axes_independent: true, variants: [v('Size', 'S', false), v('Size', 'M', false)] }).variants.every((x) => x.available === false))
ok('a combination read is left alone', sane({ axes_independent: false, variants: [v('Color', 'A', false), v('Color', 'B', false), v('Size', 'S', true)] }).variants[0].available === false)
ok('the route applies it to the store read', /const store = sane\(await readStore\(readUrl\)\)/.test(src))
console.log(`\n${pass} checks passed`)
