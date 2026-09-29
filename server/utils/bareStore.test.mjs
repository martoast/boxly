// "Gymshark" alone asks to see Gymshark (Alex, 2026-09-28: it got a pitch and a question, no products).
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { bareStoreAsk } from './bareStore.ts'
let pass = 0; const ok = (n, c) => { assert.ok(c, n); console.log('  ✓ ' + n); pass++ }
const STORES = [{ id: 'gymshark', name: 'Gymshark' }, { id: 'oldnavy', name: 'Old Navy' }, { id: 'alo', name: 'Alo Yoga' }, { id: 'newbalance', name: 'New Balance' }, { id: 'alo-short', name: 'Alo' }]
for (const t of ['Gymshark', 'gymshark', 'Gym shark', 'GYMSHARK!', 'muéstrame Gymshark', 'qué hay en gymshark?', 'algo de gymshark porfa'])
  ok(`"${t}" is a bare Gymshark ask`, bareStoreAsk(t, STORES) === 'Gymshark')
ok('"Old Navy" by its name', bareStoreAsk('old navy', STORES) === 'Old Navy')
ok('"new balance" too', bareStoreAsk('New Balance', STORES) === 'New Balance')
for (const t of ['leggings de gymshark', 'Gymshark crest joggers talla S', 'tenis new balance 9060', 'https://www.gymshark.com/products/x', 'ropa para el gym', 'hola', '¿cuánto cuesta el envío?', 'regalo'])
  ok(`"${t}" is not a bare store ask`, bareStoreAsk(t, STORES) === null)
const api = readFileSync(new URL('../api/assistant.post.ts', import.meta.url), 'utf8')
ok('the first step must ask what they want there (the live browser needs somewhere specific to go)', /if \(bareStore && !\(steps \|\| \[\]\)\.length\) return \{ activeTools: \['ask_to_narrow'\], toolChoice: 'required' \}/.test(api))
console.log(`\n${pass} checks passed`)
