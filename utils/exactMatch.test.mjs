// The Spiral Luxe search (live 2026-10-14): no product carried "Spiral", so the chat must say it is not the exact item.
import assert from 'node:assert/strict'
import { missingQueryWords, notExactly } from './exactMatch.ts'

const spiral = ['Breville - the Grind Control 12-Cup Coffee Maker - Brushed Stainless Steel', 'Breville BKE845BSS Smart Kettle Luxe Water Boiler, Brushed Stainless Steel']
assert.deepEqual(missingQueryWords('Breville Spiral Luxe', spiral), ['spiral'])
assert.equal(notExactly('Breville Spiral Luxe', spiral), true)
assert.equal(notExactly('Breville Spiral Luxe', [...spiral, 'Breville the Spiral Luxe™ Auto Pour-Over']), false, 'one exact hit is enough')
assert.equal(notExactly('tenis', ['Nike Air Max']), false, 'a one-word search never warns')
assert.equal(notExactly('Stanley Quencher', ['Stanley Quencher H2.0 FlowState Tumbler']), false)
assert.equal(notExactly('leggings Alo', ['Alo Airlift Legging']), false, 'plurals match')
assert.equal(notExactly('cámara Sony', ['Sony ZV-1 Camara']), false, 'accents ignored')
assert.equal(notExactly('Breville Spiral Luxe', []), false, 'no products: the no-results line covers it')
console.log('exactMatch: all checks pass')
