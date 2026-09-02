import assert from 'node:assert/strict'
import { hrefMatchesHost, shouldRetryProbe, storeLinks } from './crossStoreHarness.ts'

assert.equal(hrefMatchesHost('www.bestbuy.com/p/laptop', 'bestbuy.com'), true)
assert.equal(hrefMatchesHost('https://bestbuy.com.evil.test/p', 'bestbuy.com'), false)
assert.equal(hrefMatchesHost('https://user:pass@bestbuy.com/p', 'bestbuy.com'), false)
assert.deepEqual(storeLinks('link "bestbuy.com" -> https://evil.test/p/1\nlink "Best Buy" -> https://www.bestbuy.com/p/1\nlink "Target" -> https://www.target.com/p/2', 'bestbuy.com'), ['link "Best Buy" -> https://www.bestbuy.com/p/1'])
assert.equal(shouldRetryProbe({ composer_readback_verified: true }, 0), false)
assert.equal(shouldRetryProbe({ composer_readback_verified: false }, 0), true)
assert.equal(shouldRetryProbe({ composer_readback_verified: false }, 1), false)
assert.equal(shouldRetryProbe({}, 0), false)
console.log('cross-store helper tests passed')
