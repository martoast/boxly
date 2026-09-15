// Run: node --experimental-strip-types utils/sizing.test.mjs
//
// The cases are real: every title is a gallery row and every axis list was measured from a
// live /api/product-variants read on 2026-09-13. Three of eight Nike running shoes came
// back with no Size axis, which is how an unsized shoe could reach a purchase request.
import { sizeMissing, needsSize, isSizeAxis } from './sizing.ts'

let bad = 0
const check = (label, got, want) => {
  if (got !== want) { console.log(`FAIL ${label}: got ${got}, want ${want}`); bad++ }
}

// Reader gaps measured on real Nike pages — a size is owed and must be asked for.
check('acg pegasus trail, Fit+Color only', sizeMissing("Nike ACG Pegasus Trail Big Kids' Running Shoes", ['Fit', 'Color']), true)
check('pegasus 42, Color only', sizeMissing("Nike Pegasus 42 Big Kids' Road Running Shoes", ['Color']), true)
check('pegasus 41, nothing read', sizeMissing("Nike Pegasus 41 Big Kids' Road Running Shoes", []), true)
check('jordan sweatshirt, Color only', sizeMissing("Jordan Flight Club Fleece Men's Full-Zip Sweatshirt", ['Color']), true)

// Reads that DID find a size — the picker already requires it, so nothing changes.
check('ultrafly, Color+Size', sizeMissing('Nike ACG Ultrafly Trail Racing Shoes', ['Color', 'Size']), false)
check('downshifter, Fit+Size', sizeMissing("Nike Downshifter 14 Women's Road Running Shoes", ['Fit', 'Size']), false)
check('revolution, Fit+Color+Size', sizeMissing("Nike Revolution 8 Women's Road Running Shoes", ['Fit', 'Color', 'Size']), false)

// Products nobody should ever be asked a size for.
check('water bottle', sizeMissing('Owala FreeSip 24oz Water Bottle', []), false)
check('stanley bottle', sizeMissing('Stanley IceFlow Bottle 24 OZ', []), false)
check('backpack', sizeMissing('Kipling Seoul Large Backpack', []), false)
check('candle', sizeMissing('Bath & Body Works 3-Wick Candle', []), false)
check('dog food', sizeMissing('Blue Buffalo Small Breed Dry Dog Food', []), false)

// Word boundaries: a substring must not drag a product into the sized set.
check('bootcut is not a boot', needsSize('Bootcut trim kit for cabinets'), false)
check('teether is not a tee', needsSize('Baby silicone teether toy'), false)

// Spanish, since most shoppers write it.
check('tenis', needsSize('Tenis Nike Revolution para hombre'), true)
check('sudadera', needsSize('Sudadera Adidas mujer talla M'), true)
check('vestido', needsSize('Vestido largo de verano'), true)

// Axis naming, as different stores spell it.
check('Size', isSizeAxis('Size'), true)
check('Talla', isSizeAxis('Talla'), true)
check('Shoe Size', isSizeAxis('Shoe Size'), true)
check('Color is not a size', isSizeAxis('Color'), false)
check('Fit is not a size', isSizeAxis('Fit'), false)

// --- a word can name a garment and a gadget (2026-09-15) -----------------------------------------------------
// "Boot" is footwear and also the rubber base Stanley sells for a Quencher. The tumbler read as
// footwear, so the modal offered "Elegir talla" on a product with no sizes — a dead end, not the
// answerable question a false positive is supposed to be.
check('a tumbler boot is not footwear', needsSize('Stanley Quencher Boot and Straw Cover Set | 30 OZ & 40 OZ'), false)
check('nor is a silicone boot for a tumbler', needsSize('Silicone Boot for Tumbler'), false)
check('nor is a water bottle boot', needsSize('Water Bottle Boot'), false)
check('a plain tumbler never owed one anyway', needsSize('Stanley IceFlow Tumbler'), false)
// Real footwear is untouched.
check('chelsea boots still owe a size', needsSize('Chelsea Boots'), true)
check('an ankle boot still owes a size', needsSize("Women's Ankle Boot"), true)
check('slides still owe a size', needsSize('adidas Adilette Slides'), true)
// A title carrying a REAL garment word is unaffected by the drinkware context.
check('bootcut jeans owe a size on "jeans", not on "boot"', needsSize('Bootcut Jeans'), true)
check('a hoodie owes a size even beside a flask', needsSize('Hydro Flask Hoodie'), true)

console.log(bad ? `${bad} check(s) FAILED` : 'sizing: all checks pass')
process.exit(bad ? 1 : 0)
