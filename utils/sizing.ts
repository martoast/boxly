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
  'tenis', 'zapatos?', 'zapatillas?', 'botas?', 'huaraches?', 'tacos',
  // tops
  'shirts?', 'tee', 't-shirts?', 'hoodies?', 'sweatshirts?', 'sweaters?', 'jerseys?',
  'jackets?', 'coats?', 'blazers?', 'cardigans?', 'vests?',
  'playeras?', 'camisas?', 'camisetas?', 'sudaderas?', 'chamarras?', 'sueteres?', 'su[eé]ter',
  // bottoms
  'pants?', 'trousers?', 'jeans?', 'shorts?', 'leggings?', 'joggers?', 'skirts?', 'dress(?:es)?',
  'pantalones?', 'faldas?', 'vestidos?', 'mallas',
  // everything else worn
  'bra', 'bras', 'socks?', 'underwear', 'briefs?', 'boxers?', 'swimsuits?', 'bikinis?',
  'calcetines', 'ropa interior', 'trajes? de ba[nñ]o', 'sujetador',
].join('|'), 'i')

// Word-bounded so "boot" does not fire on "bootcut trim" and "tee" not on "teether".
const SIZED_RE = new RegExp(`(^|[^\\p{L}])(?:${SIZED.source})([^\\p{L}]|$)`, 'iu')

export function needsSize(title?: string | null, category?: string | null): boolean {
  const text = `${title || ''} ${category || ''}`
  return SIZED_RE.test(text)
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
