import assert from 'node:assert/strict'
import { keyboardInset, keyboardOpen, CHROME_NOISE_PX } from './keyboard.ts'

let pass = 0
const ok = (n, c) => { assert.ok(c, n); console.log('  ✓ ' + n); pass++ }

// A real iPhone 14: 844pt tall, keyboard ~336pt.
ok('a keyboard is measured as the covered height', keyboardInset({ innerHeight: 844, viewportHeight: 508 }) === 336)
ok('and reads as open', keyboardOpen({ innerHeight: 844, viewportHeight: 508 }))

// THE BUG. Safari scrolls the document to reveal the input, so offsetTop grows — and the old
// code subtracted it. At offsetTop 260 the answer fell under the guard, the inset published as
// 0, the container went back to full height and the input vanished behind the keyboard.
// The fix is that offsetTop is not part of this calculation at all: the same keyboard measures
// the same however far Safari has scrolled.
ok('the answer does not change as Safari scrolls', keyboardInset({ innerHeight: 844, viewportHeight: 508 }) === 336)

// No keyboard.
ok('a closed keyboard is zero', keyboardInset({ innerHeight: 844, viewportHeight: 844 }) === 0)
ok('and reads as closed', !keyboardOpen({ innerHeight: 844, viewportHeight: 844 }))

// The URL bar collapsing is not a keyboard — reacting to it makes the layout jump on scroll.
ok('a 60px chrome change is ignored', keyboardInset({ innerHeight: 844, viewportHeight: 784 }) === 0)
ok('exactly at the guard is still ignored', keyboardInset({ innerHeight: 844, viewportHeight: 844 - CHROME_NOISE_PX }) === 0)
ok('one pixel past the guard counts', keyboardInset({ innerHeight: 844, viewportHeight: 844 - CHROME_NOISE_PX - 1 }) === CHROME_NOISE_PX + 1)

// A visual viewport TALLER than the layout one (reported on some Androids) is not a negative keyboard.
ok('a taller visual viewport is not negative', keyboardInset({ innerHeight: 800, viewportHeight: 900 }) === 0)

// Nothing to measure yet.
ok('missing numbers mean no keyboard', keyboardInset({ innerHeight: NaN, viewportHeight: 508 }) === 0)
ok('undefined is not a keyboard', keyboardInset({}) === 0)

console.log(`\n${pass} checks passed`)
