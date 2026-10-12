// Store share links are read as their product pages (live 2026-10-12: the eBay app's ebay.io links were refused).
import assert from 'node:assert/strict'
import { shortLinksIn, expandShortLinks } from './shortLinks.ts'

assert.deepEqual(shortLinksIn('mira https://ebay.io/m/lG5ATC y https://a.co/d/abc. y https://www.ebay.com/itm/1'), ['https://ebay.io/m/lG5ATC', 'https://a.co/d/abc'])
assert.deepEqual(shortLinksIn('https://bit.ly/x https://www.nike.com/t/x'), [], 'only known store short links')
const hops = { 'https://ebay.io/m/lG5ATC': 'https://www.ebay.com/itm/365889710205?mkevt=1' }
const fake = async (u) => ({ status: hops[u] ? 301 : 200, headers: { get: (h) => (h === 'location' ? hops[u] || null : null) } })
assert.equal(await expandShortLinks('cotiza https://ebay.io/m/lG5ATC porfa', fake), 'cotiza https://www.ebay.com/itm/365889710205?mkevt=1 porfa')
const down = async () => { throw new Error('offline') }
assert.equal(await expandShortLinks('https://ebay.io/m/zzz', down), 'https://ebay.io/m/zzz', 'unreachable: left as is')
console.log('shortLinks: all checks pass')
