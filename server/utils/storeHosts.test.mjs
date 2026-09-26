// Pure tests for server/utils/storeHosts.ts — web rows on a carried store's domain get its store id.
import assert from 'node:assert/strict'
import { storeHostsFromFacets, tagCarriedStores } from './storeHosts.ts'

const hosts = storeHostsFromFacets({ stores: [
  { store_id: 'gymshark', store_name: 'Gymshark', host: 'gymshark.com' },
  { store_id: 'old-navy', store_name: 'Old Navy', host: 'oldnavy.gap.com' },
  { store_id: 'x', store_name: 'X', host: null },
] })
assert.equal(hosts.size, 2)
const bing = { id: 'pufc2fh', title: 'Gymshark Crest Joggers - Light Grey Marl', store: 'Gymshark', store_id: null, url: 'https://www.gymshark.com/products/gymshark-crest-joggers-light-grey-marl-aw22', source: 'bing_shopping' }
const tagged = tagCarriedStores([bing], hosts)
assert.equal(tagged[0].store_id, 'gymshark', 'a Bing row on gymshark.com is Gymshark')
assert.equal(tagged[0].store, 'Gymshark', 'the rest of the row is kept')
assert.equal(tagCarriedStores([{ ...bing, url: 'https://oldnavy.gap.com/browse/product.do?pid=1' }], hosts)[0].store_id, 'old-navy')
assert.equal(tagCarriedStores([{ ...bing, url: 'https://www.gap.com/browse/product.do?pid=1' }], hosts)[0].store_id, null, 'a different subdomain is a different store')
assert.equal(tagCarriedStores([{ ...bing, url: 'https://www.amazon.com/dp/B0' }], hosts)[0].store_id, null, 'an uncarried store stays untagged')
const cat = { ...bing, store_id: 'gymshark' }
const same = [cat]
assert.equal(tagCarriedStores(same, hosts), same, 'nothing to tag → same array')
assert.equal(tagCarriedStores([{ ...bing, store_id: 'other' }], hosts)[0].store_id, 'other', 'an existing store id is never replaced')
console.log('PASS — storeHosts')
