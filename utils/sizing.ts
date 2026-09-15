// DOES THIS PRODUCT NEED A SIZE BEFORE ANYONE CAN BUY IT?
//
// The variant picker requires every axis it was given, which is correct — but it can only
// require what the reader found. Measured on eight real Nike running shoes, three came back
// without a Size axis at all (one with Fit+Color, one with Color only, one with nothing),
// so the picker believed the choice was complete and a shopper could add an unsized shoe
// to their box. A purchase request for "the Pegasus 41, colour black" is not something
// anyone can actually buy (Alex, 2026-09-13: "they need to be putting all the variants
// necessary to actually add to cart, just like you would in a normal store").
//
// We cannot fix every reader gap, so this decides from the product itself whether a size
// is owed. Deliberately a list of things that are ALWAYS sized rather than a clever guess:
// a false positive asks a shopper a question they can answer, while a false negative sends
// an unbuyable order to the buyer.
const SIZED = new RegExp([
  // footwear
  'shoes?', 'sneakers?', 'trainers?', 'boots?', 'sandals?', 'cleats?', 'spikes?', 'slides?',
  'loafers?', 'slippers?', 'flip[- ]?flops?', 'mules?', 'heels?', 'flats?', 'moccasins?',
  'tenis', 'zapatos?', 'zapatillas?', 'botas?', 'huaraches?', 'tacos', 'pantuflas?', 'sandalias?',
  // tops
  'shirts?', 'tee', 'tees', 't-shirts?', 'hoodies?', 'sweatshirts?', 'sweaters?', 'jerseys?',
  'jackets?', 'coats?', 'blazers?', 'cardigans?', 'vests?',
  'polos?', 'blouses?', 'tank tops?', 'tanks?', 'crop tops?', 'camisoles?', 'windbreakers?',
  'pullovers?', 'anoraks?', 'parkas?', 'turtlenecks?',
  'playeras?', 'camisas?', 'camisetas?', 'sudaderas?', 'chamarras?', 'sueteres?', 'su[eé]ter',
  'blusas?', 'chalecos?',
  // bottoms
  'pants?', 'trousers?', 'jeans?', 'shorts?', 'leggings?', 'joggers?', 'skirts?', 'dress(?:es)?',
  'sweatpants', 'sweat pants', 'tights', 'chinos?', 'khakis?', 'overalls', 'jumpsuits?', 'rompers?',
  'pantalones?', 'faldas?', 'vestidos?', 'mallas', 'jardineras?',
  // everything else worn
  'bra', 'bras', 'bralettes?', 'bodysuits?', 'socks?', 'underwear', 'briefs?', 'boxers?',
  'swimsuits?', 'bikinis?', 'onesies?', 'pyjamas?', 'pajamas?', 'robes?', 'gloves?', 'beanies?',
  'calcetines', 'ropa interior', 'trajes? de ba[nñ]o', 'sujetador', 'pijamas?',
].join('|'), 'i')

// Word-bounded so "boot" does not fire on "bootcut trim" and "tee" not on "teether".
const SIZED_RE = new RegExp(`(^|[^\\p{L}])(?:${SIZED.source})([^\\p{L}]|$)`, 'iu')

// A WORD CAN NAME A GARMENT AND A GADGET. "Boot" is footwear, and it is also the rubber base
// Stanley sells for a Quencher — "Stanley Quencher Boot and Straw Cover Set" read as footwear
// and owed a size, so the modal offered "Elegir talla" on a product that has no sizes and the
// shopper had nothing to answer with (audit, 2026-09-15). The comment above is right that a
// false positive is usually the cheap direction, but only while the question is answerable;
// here it is a dead end.
//
// So the ambiguous words alone cannot owe a size when the title is plainly drinkware or an
// accessory for it. A title that ALSO names a real garment is unaffected ("Bootcut Jeans" owes
// one on "jeans"), and so is anything matched by an unambiguous word.
const AMBIGUOUS_ONLY = /\b(boots?|slides?|tanks?)\b/i
const DRINKWARE = /\b(tumbler|bottle|quencher|straw|lid|sleeve|mug|flask|cup|jug|thermos|canteen|keychain|ornament|wash|lotion|spray|mist|scrub|butter|oil|gel|cream|fuel|gas|propane|water tank|air)\b/i

export function needsSize(title?: string | null, category?: string | null): boolean {
  const text = `${title || ''} ${category || ''}`
  if (!SIZED_RE.test(text)) return false
  // Would it still read as sized with the ambiguous words removed? If yes, a real garment
  // word carried it and the drinkware context is incidental.
  if (SIZED_RE.test(text.replace(AMBIGUOUS_ONLY, ' '))) return true
  return !DRINKWARE.test(text)
}

// A size axis by any of the names stores actually use for one.
export function isSizeAxis(name?: string | null): boolean {
  return /^(?:size|sizes|talla|tallas|shoe size|clothing size|sock size|waist|length|inseam)$/i.test(String(name || '').trim())
}

// The question is owed when the product is a sized one and no axis on offer is a size.
export function sizeMissing(title: string | null | undefined, axisNames: string[], category?: string | null): boolean {
  if (!needsSize(title, category)) return false
  return !axisNames.some((n) => isSizeAxis(n))
}
