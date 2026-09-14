import assert from 'node:assert/strict'
import { landedCost, BOXLY_COMMISSION } from './landed.ts'

let pass = 0
const ok = (n, c) => { assert.ok(c, n); console.log('  ✓ ' + n); pass++ }
const near = (a, b, eps = 0.5) => Math.abs(a - b) <= eps

// Oswaldo's actual ask: 140 bottles of BioSchwartz magnesium at $11.97, medium box.
{
  const r = landedCost({ items: [{ price: 11.97, quantity: 140 }], boxPriceMxn: 4400, fx: 20 })
  ok('every piece is counted', r.units === 140)
  ok('subtotal is price × quantity', near(r.subtotalUsd, 1675.8))
  ok('commission is 15% of that', near(r.commissionUsd, 251.37))
  // (1675.80 + 251.37) × 20 + 4400
  ok('the total lands product + commission at FX, plus the box', near(r.totalMxn, 42943.4))
  ok('and the per-piece cost is the total over the pieces', near(r.perUnitMxn, 306.7, 0.5))
}

// The consolidation argument, stated in numbers: more pieces, cheaper each.
{
  const few = landedCost({ items: [{ price: 11.97, quantity: 10 }], boxPriceMxn: 4400, fx: 20 })
  const many = landedCost({ items: [{ price: 11.97, quantity: 140 }], boxPriceMxn: 4400, fx: 20 })
  ok('each extra piece lands cheaper than the last', many.perUnitMxn < few.perUnitMxn)
  // The product cost per piece is identical in both, so the entire gap is the box share:
  // 4400/10 = 440 against 4400/140 = 31.43.
  ok('and the whole gap is the box share, nothing else', near(few.perUnitMxn - many.perUnitMxn, 4400 / 10 - 4400 / 140, 0.01))
}

// A single piece: per-unit is just the total again, so it is not shown.
{
  const one = landedCost({ items: [{ price: 24.75, quantity: 1 }], boxPriceMxn: 2400, fx: 20 })
  ok('a single piece reports no per-piece line', one.perUnitMxn === null)
  ok('but still has a real total', one.totalMxn > 2400)
}

// Mixed lines add up across products, which is the whole point of consolidating.
{
  const mix = landedCost({ items: [{ price: 11.97, quantity: 100 }, { price: 30, quantity: 2 }], boxPriceMxn: 4400, fx: 20 })
  ok('units span every line', mix.units === 102)
  ok('subtotal spans every line', near(mix.subtotalUsd, 1257))
}

// Never quote a total built on a missing input.
{
  ok('no FX rate → no quote at all', landedCost({ items: [{ price: 10, quantity: 5 }], boxPriceMxn: 4400, fx: null }) === null)
  ok('no box price → no quote at all', landedCost({ items: [{ price: 10, quantity: 5 }], boxPriceMxn: null, fx: 20 }) === null)
  ok('no items → no quote at all', landedCost({ items: [], boxPriceMxn: 4400, fx: 20 }) === null)
  ok('a zero FX rate is not a rate', landedCost({ items: [{ price: 10, quantity: 5 }], boxPriceMxn: 4400, fx: 0 }) === null)
}

// Junk rows must not poison the arithmetic.
{
  const r = landedCost({ items: [{ price: 10, quantity: 3 }, { price: NaN, quantity: 2 }], boxPriceMxn: 4400, fx: 20 })
  ok('a row with no price is skipped, not counted as zero', r.units === 3)
  ok('a fractional quantity never creates a fractional piece', landedCost({ items: [{ price: 10, quantity: 2.7 }], boxPriceMxn: 4400, fx: 20 }).units === 2)
}

ok('the commission rate is stated once', BOXLY_COMMISSION === 0.15)

console.log(`\n${pass} checks passed`)
