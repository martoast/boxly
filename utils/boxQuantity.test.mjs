import assert from 'node:assert/strict'
import { unaskedExtraUnits } from './boxQuantity.ts'

const miner = { name: 'US Ship Bitmain Antminer S19 Pro', url: 'https://www.ebay.com/itm/318672406892', quantity: 1 }
const two = [{ ...miner, quantity: 2 }]
// Jonathan 2026-11-27: a product name after "add more" is not "one more"
assert.equal(unaskedExtraUnits([miner], two, 'Asic s19 pro').length, 1, 'a model name with digits is not a quantity')
assert.equal(unaskedExtraUnits([miner], two, 'quiero otro igual').length, 0)
assert.equal(unaskedExtraUnits([miner], two, 'agrega uno más').length, 0)
assert.equal(unaskedExtraUnits([miner], two, 'ponle 2').length, 0)
assert.equal(unaskedExtraUnits([miner], two, 'dos por favor').length, 0)
assert.equal(unaskedExtraUnits([miner], two, 'one more please').length, 0)
assert.equal(unaskedExtraUnits([miner], [miner, { name: 'Antminer S21', url: 'https://www.ebay.com/itm/1', quantity: 1 }], 'Asic s21').length, 0, 'a NEW item is never blocked')
assert.equal(unaskedExtraUnits([miner], [{ ...miner, url: miner.url + '?hash=x', quantity: 3 }], 'antminer').length, 1, 'same item by URL without its query')
assert.equal(unaskedExtraUnits([], two, 'Asic s19 pro').length, 0, 'nothing in the box before')
console.log('boxQuantity: all checks pass')
