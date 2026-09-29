// The shopper picks size and colour on the chips; typed words never count (Alex, 2026-09-28).
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { pickedOptions } from './variantPick.ts'
let pass = 0; const ok = (n, c) => { assert.ok(c, n); console.log('  ✓ ' + n); pass++ }
const NB = [{ name: 'Color', kind: 'color', values: ['BREAKFAST TEA with ANGORA', 'BLACK with CASTLEROCK'] }, { name: 'Size', kind: 'size', values: ['M8.5 / W10 (8.5)', 'M9 / W10.5 (9)'] }]
ok('nothing picked: both axes missing', pickedOptions(NB, null).missing.length === 2)
ok('the picker choice (by kind) is the store value', JSON.stringify(pickedOptions(NB, { size: 'M9 / W10.5 (9)', color: 'BLACK with CASTLEROCK' }).chosen) === JSON.stringify({ Color: 'BLACK with CASTLEROCK', Size: 'M9 / W10.5 (9)' }))
ok('…or by axis name', pickedOptions(NB, { Size: 'M9 / W10.5 (9)', Color: 'BLACK with CASTLEROCK' }).missing.length === 0)
ok('a value the store does not offer counts for nothing', pickedOptions(NB, { size: '9', color: 'negro' }).missing.length === 2)
ok('a pick this chat already made keeps the product in the box', pickedOptions(NB, null, { size: 'M9 / W10.5 (9)', color: 'BLACK with CASTLEROCK' }).missing.length === 0)
const GYM = [{ name: 'Size', kind: 'size', values: ['XS (2-4)', 'S (4-6)'] }]
ok('a colourway page has no colour to pick', JSON.stringify(pickedOptions(GYM, { size: 'S (4-6)' }).chosen) === JSON.stringify({ Size: 'S (4-6)' }))
const api = readFileSync(new URL('../server/api/assistant.post.ts', import.meta.url), 'utf8')
ok('the chat gate reads the picker choice from the message metadata', /lastUser\?\.metadata\?\.pick/.test(api) && /pickedOptions\(axes, pickRaw, prior\)/.test(api))
ok('nothing typed is matched or pre-selected any more', !/variants_for\.selected =/.test(api) && !/const fromWords/.test(api))
const picker = readFileSync(new URL('../components/VariantPicker.vue', import.meta.url), 'utf8')
ok('the picker pre-selects nothing', !/props\.data\?\.selected/.test(picker))
const chat = readFileSync(new URL('../components/ShoppingAssistant.vue', import.meta.url), 'utf8')
ok('the chat sends the picker choice as metadata', /metadata: \{ pick \}/.test(chat) && !/preselect/.test(chat))
console.log(`\n${pass} checks passed`)
