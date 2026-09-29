// Pure tests for server/utils/storeHosts.ts — links on a live store's domain get the engine's store id.
import assert from 'node:assert/strict'
import { storeHostsFromLiveStores, tagCarriedStores } from './storeHosts.ts'

// The engine's store list (GET /live-shopping/stores): url is optional there.
const hosts = storeHostsFromLiveStores([
  { id: 'gymshark', name: 'Gymshark', url: 'https://www.gymshark.com/' },
  { id: 'old-navy', name: 'Old Navy', url: 'https://oldnavy.gap.com' },
  { id: 'x', name: 'X' },
  { id: 'bad', name: 'Bad', url: 'not a url' },
])
assert.equal(hosts.size, 2)
assert.equal(storeHostsFromLiveStores(null).size, 0, 'no list (a guest, the engine off) → nothing to tag')
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
