/**
 * What a box actually costs — the one implementation.
 *
 * Boxly prices shipping per BOX at a fixed rate, so the cost of any single item
 * is meaningless on its own. A MX$1,590 shirt bought in the US for MX$1,118
 * looks like a 30% win until you add the MX$2,400 the smallest box costs, at
 * which point the shopper has paid 121% MORE than if they'd bought it at home.
 *
 * The shopper panel quoted that half-price for its entire life. This module
 * exists so it can't happen again, and so the chat and the panel can never
 * disagree about which box a set of items lands in — one volume model, one
 * ladder, both surfaces importing from here.
 *
 * Volumes are in "shoe-units": one boxed pair of shoes = 1.0.
 */

/**
 * How much room an item takes. Calibrated so the prenda counts below land right.
 *
 * THIS TABLE IS THE ONLY ONE. It used to be copied into the assistant, and the
 * copies drifted: `rigid_large` and `oversize_long` were added there in
 * September 2026 and never here, so the chat's box card sized a PlayStation at
 * 2.20 while the cost card beside it — which reads THIS file — sized the same
 * console at the 0.40 default. Two cards, one shipment, two different boxes.
 * Add an archetype here and nowhere else.
 */
export const ARCHETYPE_VOL: Record<string, number> = {
  rigid_small: 0.05, // cosmetics, perfume, jewelry, accessories, cables
  // A TUB OF FACE WIPES IS NOT A LIPSTICK (Alex, 2026-09-21, from a real customer).
  // rigid_small is 403 cm3 — a 7.4 cm cube, which is a perfume carton. It was also
  // the bucket for "cosméticos, accesorios, sanitizers", so a 760 cm3 tub of
  // Neutrogena makeup-remover wipes landed in it at half its real size. One item
  // out by 2x is invisible; the customer ordered NINETY, and the card told them 90
  // filled a Caja Chica at 100% and 13.5 kg when 90 is 1.9x that box's ENTIRE
  // volume and ~27 kg. About 35 fit. The error never grew — the consequence did.
  toiletry: 0.10, // drugstore package: wipes, shampoo, deodorant, sunscreen, cotton pads
  flat_soft: 0.30, // tees, leggings, shorts, underwear, swimwear
  medium_soft: 0.45, // jeans, hoodies, joggers, light jackets, backpacks
  rigid_medium: 0.25, // bottles, tumblers, small electronics (speaker, camera)
  // A GAMES CONSOLE IS NOT A WATER BOTTLE (Alex, 2026-09-15). Boxed consumer
  // electronics are rigid, they do not compress, and the carton is most of the
  // volume.
  rigid_large: 2.20, // console, monitor, printer, microwave, air fryer, vacuum
  shoes: 1.50, // a boxed pair
  bulky_soft: 0.80, // boots, thick coats, blankets, pillows, helmets
  fragile: 2.00, // lamps, glass, decor — awkward, poor packing efficiency
  oversize_long: 21, // guitar, skateboard, golf clubs, handlebar — its own box, ~full
  // NOT A VOLUME. An above-ground pool, a mattress, a fridge, a sofa: no box on
  // the ladder has a side long enough, so there is no number of shoe-units that
  // makes the answer true. Freight items are EXCLUDED from the volume sum and
  // reported by name — see isUnboxable(). The zero is here so a caller that
  // sums blindly under-counts loudly rather than quoting an XL for a pool.
  oversize_freight: 0,
}
export const DEFAULT_VOL = 0.40

export const ARCH_LABEL: Record<string, string> = {
  rigid_small: 'Pequeño', flat_soft: 'Ropa', medium_soft: 'Mediano',
  toiletry: 'Pequeño', rigid_medium: 'Mediano', rigid_large: 'Voluminoso', shoes: 'Calzado',
  bulky_soft: 'Voluminoso', fragile: 'Frágil', oversize_long: 'Grande y largo',
  oversize_freight: 'No cabe en caja',
}

/**
 * WEIGHT, THE OTHER LID.
 *
 * A box has two limits and we modelled one. A Hammer Black Widow bowling ball is
 * a 22 cm sphere — about 5% of a Caja Chica by volume, and 7 kg of solid resin
 * against that box's 15 kg limit. Alex put one in a box with a pool and the bar
 * read 23% (2026-09-16); by weight the ball ALONE was at 47%, and two of them
 * would have been over the limit while the bar still showed a tenth full.
 *
 * The 15 kg cap was already written down — in a code comment in this very file,
 * explaining why `fits` is capped at 20 because "100 perfumes fit an S, which is
 * true of the space and false of the 15 kg limit". It was understood and never
 * enforced. Now it is.
 *
 * Boxed weight per unit, in kg. Deliberately rough: these decide which LID binds
 * first, not what the carrier charges.
 */
export const ARCHETYPE_KG: Record<string, number> = {
  rigid_small: 0.15, flat_soft: 0.25, medium_soft: 0.6, rigid_medium: 0.8,
  // Wet goods are mostly liquid: a tub of wipes is 0.3 kg, a shampoo bottle 0.45.
  toiletry: 0.35,
  rigid_large: 6, shoes: 1.2, bulky_soft: 1.5, fragile: 2, oversize_long: 4,
  oversize_freight: 0, // never counted — it isn't in the box
}
export const DEFAULT_KG = 0.5

/**
 * Things whose weight their archetype cannot guess.
 *
 * Every entry is an item where the volume is ordinary and the mass is not, so
 * the archetype alone would let the shopper fill a box they cannot ship. Add
 * here only when that gap is real — an ordinary heavy-ish item is fine at its
 * archetype weight.
 */
const DENSE_KG: Array<[RegExp, number]> = [
  [/bowling ball|bola de boliche/i, 7],
  [/dumbbell|mancuerna|kettlebell|pesa rusa|weight plate|disco de peso|barbell|barra ol[ií]mpica/i, 10],
  [/car battery|bater[ií]a (?:de|para) (?:auto|coche|carro)/i, 15],
  [/cast iron|hierro fundido|dutch oven/i, 3.5],
  [/tool ?(?:box|set|kit)|caja de herramientas|juego de herramientas/i, 8],
  [/brake (?:rotor|disc)|disco de freno/i, 6],
]

/**
 * `usable` = volume at which the box is full, in shoe-units.
 * `max_kg`  = the weight the box is allowed to leave with.
 */
//
// The XS box is DISCONTINUED (2026-08-16): Chica is the smallest thing we sell,
// so it is the floor of the ladder. XS survives in Stripe and in the admin order
// flow for boxes already in flight — it must simply never be QUOTED again.
export const BOX_TIERS = [
  { key: 'S', label: 'Chica', usable: 4.5, max_kg: 15 },
  // ── The half sizes ────────────────────────────────────────────────────────
  //
  // Boxly ships SEVEN box sizes, not four. Between each of the listed ones sits
  // a midpoint box that was never shown on the site and never modelled here:
  //
  //     2400 · 3300 · 4400 · 5100 · 5600 · 6250 · 6900
  //      S     SM      M     ML      L    LXL     XL
  //
  // They were invisible for a precise reason. Stripe carries each one as a
  // SECOND PRICE on its larger neighbour's product — SM on Medium, ML on Large,
  // LXL on Extra Large — so they share a product id, a name and a set of
  // dimensions with the box above them. Name mapping saw duplicates and the
  // highest-wins rule threw the cheaper one away, which meant we quoted the
  // FULL size for every shipment that actually fits a half size.
  //
  // These are NOT separate boxes with their own measurements, and nobody should
  // go looking for any (Alex, 2026-08-01): a half size is what Boxly charges
  // when a shipment lands BETWEEN two defined box sizes — too big for the one
  // below, not filling the one above. So the capacity here is a price boundary,
  // not a physical lid: cross 5.175u and you are no longer paying the S rate,
  // and you pay SM until the shipment is genuinely M-sized.
  //
  // The thresholds are the midpoints of their neighbours, which is the fairest
  // reading of "in between" and keeps the ladder monotonic. They are the only
  // judgement calls in this file; move them if the warehouse prices differently
  // in practice. Everything downstream reads this table.
  //
  // max_kg for the four SHOWN sizes is what the box guide advertises (15/25/
  // 35/50). The half sizes take the midpoint of their neighbours, exactly as
  // their volume does — they are price boundaries, not new cartons.
  { key: 'SM', label: 'Mediana chica', usable: 7.25, max_kg: 20 },
  { key: 'M', label: 'Mediana', usable: 10, max_kg: 25 },
  { key: 'ML', label: 'Grande chica', usable: 12.25, max_kg: 30 },
  { key: 'L', label: 'Grande', usable: 14.5, max_kg: 35 },
  { key: 'LXL', label: 'Extra grande chica', usable: 18, max_kg: 42 },
  { key: 'XL', label: 'Extra grande', usable: 21.5, max_kg: 50 },
]

/**
 * TOO BIG FOR ANY BOX.
 *
 * The largest box Boxly ships is 52×62×53 cm. An Intex above-ground pool, a
 * mattress, a fridge, a sofa, a 65" TV — none of them have a side that fits, so
 * the honest answer is not a bigger box, it is a human. These route to
 * show_contact_whatsapp; the box card refuses to draw them inside the box.
 *
 * `pool` needs a qualifier because a pool float and a pool towel are not pools.
 */
const RE_OVERSIZE_FREIGHT = /(?:above[ -]?ground|swimming|frame set|inflatable|intex|bestway)[\w ,-]*\bpools?\b|\bpools?\b[\w ,-]*(?:frame|liner|above[ -]?ground)|alberca|piscina|mattress|colch[oó]n|box spring|refrigerator|refrigerador|\bfridge\b|nevera|freezer|congelador|washer|washing machine|lavadora|\bdryer\b|secadora|dishwasher|lavavajillas|\bsofa\b|\bcouch\b|sof[aá]|sill[oó]n|loveseat|sectional|dining table|mesa de comedor|bed frame|headboard|cabecera|\bdresser\b|wardrobe|armario|ropero|treadmill|caminadora|elliptical|el[ií]ptica|exercise bike|bicicleta fija|home gym|\bkayak\b|canoe|canoa|paddle ?boat|trampoline|trampol[ií]n|swing set|columpio|playhouse|casita de juegos|lawn ?mower|podadora|\bgrill\b|asador|\bbbq\b|patio set|gazebo|\bshed\b|cobertizo|air conditioner|aire acondicionado|minisplit|water heater|boiler|calent[aá]n/i

/**
 * A BIG TELEVISION.
 *
 * Its own check because one regex cannot say "a size AND the word TV" without
 * tangling: "TCL 65\" Class QLED 4K Smart TV" puts four words between the two,
 * and every attempt to span them also swallowed "Sony 55 Inch Headphones Stand".
 * Two lookaheads say it plainly.
 *
 * 40 inches, not 60: the box's longest inner side is 62 cm, and a 40" panel is
 * ~89 cm wide. Below that the size is usually unstated and the set stays
 * rigid_large, which is what it was before — this only catches the ones that
 * announce a size we know cannot fit.
 */
const RE_BIG_TV = /(?=[\s\S]*\b(?:4\d|[5-9]\d|1\d\d)\s*(?:["”]|-? ?inch(?:es)?\b|-? ?in\b|pulgadas))(?=[\s\S]*\b(?:tv|television|televisi[oó]n)\b)/i

/**
 * AN ACCESSORY FOR A FREIGHT ITEM IS NOT THE FREIGHT ITEM.
 *
 * "Intex Pool Float Lounger" is an Intex, and a pool, and it packs flat. So do a
 * pool cover, a mattress topper, a grill brush and a TV wall mount. This vetoes
 * the freight branch — every one of these is an ordinary box item that happens to
 * be named after something that is not.
 */
const RE_FREIGHT_ACCESSORY = /\b(?:float|floatie|lounger|flotador|noodle|cover|funda|slipcover|protector|topper|pad|filter|filtro|pump|bomba|skimmer|hose|manguera|net|brush|cepillo|cleaner|limpiador|chemical|cloro|chlorine|towel|toalla|toy|juguete|mount|soporte|bracket|remote|replacement|repuesto|accessor|refacci[oó]n|sheets?|s[aá]banas?|pillowcase|air mattress|colch[oó]n inflable)\b|test strips?|control remoto|inflatable (?:mattress|bed)/i

// ── A WORD, NOT A RUN OF LETTERS ─────────────────────────────────────────────
//
// These matched anywhere inside a longer word, and every hit was a whole box size:
//
//   remo   (oar)      → "Makeup REMOver Wipes"  → oversize_long, 21 shoe-units
//   glass             → "SunGLASSes"            → fragile, the volume of a lamp
//   case              → "SuitCASE"              → rigid_small, a 7 cm cube
//   boot              → "BOOTcut Jeans"         → shoes
//   ring              → "SpRING Jacket"         → rigid_small
//   card              → "CARDigan Sweater"      → rigid_small
//   heel              → "Steering wHEEL Cover"  → shoes
//   collar            → "COLLARed Shirt"        → rigid_small
//   vase              → "VASEline Lip Therapy"  → fragile
//   pant              → "PANTalla 32 pulgadas"  → medium_soft
//
// Found chasing the wipes (Alex, 2026-09-21). Anchor anything short enough to live
// inside another word; a suffix-only \b (coats?\b) still lets raincoat through.
const RE_OVERSIZE_LONG = /guitar|guitarra|\bbass guitar|skateboard|patineta|longboard|\bskate\b|snowboard|surfboard|tabla de surf|golf club|palos de golf|hockey stick|fishing rod|ca[nñ]a de pescar|violonc|\bcello\b|keyboard piano|\bpiano\b|handlebar|manubrio|bike frame|cuadro de bici|bicycle frame|\bfork(?:s)? (?:bike|bicycle|bmx)|seatpost|\btijas?\b|\bskis?\b|\besqu[ií]e?s?\b|baseball bat|bate de b[eé]isbol|paddle ?board|\bremos?\b/i
const RE_SHOES = /\bshoes?\b|sneaker|\btenis\b|\bboots?\b|\bbotas?\b|cleats?\b|\bsandal|\bheels?\b|loafer|zapat/i
const RE_FRAGILE = /\blamps?\b|l[aá]mpara|\bglass|vidrio|\bvases?\b|florero|mirror|espejo|\bframes?\b|cuadro|ceramic|porcelain|\bdecor/i
const RE_TOILETRY = /\bwipes?\b|towelettes?|toallitas|cleansing cloths|shampoo|champ[uú]|conditioner|acondicionador|body wash|gel de ducha|jab[oó]n l[ií]quido|deodorant|desodorante|antitranspirante|diapers?|pa[nñ]ales|toallas femeninas|cotton rounds?|cotton pads?|discos de algod[oó]n|micellar|micelar|sunscreen|bloqueador solar|protector solar|body lotion|loci[oó]n corporal|crema corporal|hand soap|refill|repuesto/i
const RE_RIGID_SMALL = /saniti|\bmist\b|antibac|perfume|parfum|cologne|fragran|skincare|serum|lipstick|\bgloss\b|lip balm|b[aá]lsamo labial|labial|mascara|cosmetic|maquillaje|\bcreams?\b|crema|lotion|loci[oó]n|\bcards?\b|cartas|pok[eé]mon|wallet|cartera|\bwatch(?:es)?\b|jewel|\bjoyas?\b|joyer[ií]a|\bring\b|anillo|necklace|\bcollar\b|earring|\baretes?\b|sunglass|lentes|\bcase\b|funda|charger|cargador|earbuds|airpods|keychain|llavero/i
const RE_RIGID_LARGE = /console|consola|playstation|\bps[345]\b|xbox|nintendo switch|monitor|printer|impresora|microwave|microondas|air ?fryer|freidora|vacuum|aspiradora|blender|licuadora|toaster oven|horno|\btv\b|television|televisi[oó]n|\bpantallas?\b/i
const RE_BULKY = /coats?\b|parka|abrigo|puffer|\bdown\b|blanket|comforter|duvet|cobija|plush|peluche|pillow|almohada|duffel|luggage|maleta|suitcase|\btents?\b|sleeping bag|appliance|electrodom|coffee maker|cafetera|\bpot\b|\bollas?\b|helmet|\bcascos?\b/i
const RE_MEDIUM = /\bjeans?\b|\bpants?\b|pantal[oó]n(?:es)?|jogger|sudadera|hoodie|sweater|sweatshirt|jacket|chamarra|backpack|mochila|handbag|\bbolsas?\b|\bbag\b|purse/i
const RE_RIGID_MEDIUM = /bottle|botella|tumbler|\btermos?\b|\bcup\b|\bmug\b|\btazas?\b|owala|stanley|hydro|flask|speaker|bocina|camera|c[aá]mara|electronic|electr[oó]nico/i
const RE_FLAT_SOFT = /legging|mall[oó]n|shirt|camiset|camisa|\btee\b|playera|\btop\b|blouse|blusa|dress|vestido|\bshorts?\b|skirt|falda|underwear|ropa interior|\bsocks?\b|calcet|\bbra\b|brasier|swim|traje de ba/i

/** Guess the archetype from a product name. Order matters — narrowest first. */
export function archetypeFromName(name: string): string | null {
  const t = name || ''
  // Freight first: a "65 inch TV" is also a TV, and an above-ground pool frame
  // is also a frame. The biggest classification has to win.
  if ((RE_OVERSIZE_FREIGHT.test(t) || RE_BIG_TV.test(t)) && !RE_FREIGHT_ACCESSORY.test(t)) return 'oversize_freight'
  if (RE_OVERSIZE_LONG.test(t)) return 'oversize_long'
  if (RE_SHOES.test(t)) return 'shoes'
  if (RE_FRAGILE.test(t)) return 'fragile'
  if (RE_TOILETRY.test(t)) return 'toiletry'
  if (RE_RIGID_SMALL.test(t)) return 'rigid_small'
  if (RE_RIGID_LARGE.test(t)) return 'rigid_large'
  if (RE_BULKY.test(t)) return 'bulky_soft'
  if (RE_MEDIUM.test(t)) return 'medium_soft'
  if (RE_RIGID_MEDIUM.test(t)) return 'rigid_medium'
  if (RE_FLAT_SOFT.test(t)) return 'flat_soft'
  return null
}

/**
 * The archetype we will actually use for this item.
 *
 * A model-supplied `type` normally wins — it has seen the product page and we
 * have seen a title. The exception is freight: the model called an Intex
 * above-ground pool `bulky_soft`, which is what a pillow is, so when the NAME
 * says freight the name wins. Nothing the model can pass makes a pool fit.
 */
export function archetypeOf(name: string, type?: string | null): string | null {
  const byName = archetypeFromName(name || '')
  if (byName === 'oversize_freight') return byName
  return (type && ARCHETYPE_VOL[type] !== undefined) ? type : byName
}

/** True when no box on the ladder can take this item at all. */
export function isUnboxable(name: string, type?: string | null): boolean {
  return archetypeOf(name, type) === 'oversize_freight'
}

/** Volume of one unit of this product, in shoe-units. */
export function itemUnits(name: string, type?: string | null): number {
  const t = archetypeOf(name, type)
  return t ? ARCHETYPE_VOL[t] : DEFAULT_VOL
}

/** Boxed weight of one unit, in kg. A dense-item override beats the archetype. */
export function itemKg(name: string, type?: string | null): number {
  for (const [re, kg] of DENSE_KG) if (re.test(name || '')) return kg
  const t = archetypeOf(name, type)
  return t ? ARCHETYPE_KG[t] : DEFAULT_KG
}

/** The smallest box that holds this volume (15% squeeze, as the packers do). */
export function boxFor(units: number) {
  return BOX_TIERS.find((b) => units <= b.usable * 1.15) || BOX_TIERS[BOX_TIERS.length - 1]
}

/**
 * The smallest box that holds this volume AND this weight.
 *
 * Both lids are hard: the shipment needs the larger of the two answers. There is
 * no 15% squeeze on weight — you cannot compress a bowling ball.
 */
export function fitTier<T extends { usable: number; max_kg: number }>(tiers: T[], units: number, kg: number): T {
  const last = tiers.length - 1
  const byVol = tiers.findIndex((b) => units <= b.usable * 1.15)
  const byKg = tiers.findIndex((b) => kg <= b.max_kg)
  return tiers[Math.max(byVol < 0 ? last : byVol, byKg < 0 ? last : byKg)]
}

/** The same two-lid answer on the PRICING ladder (all seven sizes). */
export function boxForLoad(units: number, kg: number) {
  return fitTier(BOX_TIERS, units, kg)
}

export type BoxEconomics = {
  /** Volume of ONE of this item. */
  item_units: number
  /** How many of this item fill the box it would ship in. */
  fits: number
  /** The box a single one of these would ship in. */
  solo_box: { key: string; label: string; price_mxn: number }
  /** Total for ONE, all in — the number the shopper actually pays. */
  solo_total_mxn: number
  /** Positive = buying one from the US costs MORE than buying it locally. */
  solo_vs_local_pct: number | null
  /** Items needed before the saving covers the box. null when it never does. */
  breakeven_items: number | null
  /** What a full box of this item is worth. */
  full_box: { items: number; saving_mxn: number } | null
}

/**
 * The honest economics of buying THIS product through Boxly.
 *
 * @param productLocalMxn what the item costs from the US, in pesos
 * @param savingPerItemMxn what each one saves vs the Mexican price (0 if unknown)
 * @param name product title, for the volume guess
 * @param boxPrices live MXN price per box key (from Stripe — never hardcode)
 */
export function boxEconomics(
  productLocalMxn: number | null,
  savingPerItemMxn: number,
  name: string,
  boxPrices: Record<string, number>,
): BoxEconomics | null {
  const units = itemUnits(name)
  if (!units) return null

  const solo = boxFor(units)
  const soloPrice = boxPrices[solo.key]
  if (!Number.isFinite(soloPrice)) return null

  // How many fit in that same box — the number the shopper is being asked for.
  // Capped: by volume alone 100 perfumes "fit" an S, which is true of the space
  // and false of the 15 kg limit — and one unbelievable number discredits every
  // honest one beside it.
  const FITS_CAP = 20
  const fits = Math.min(FITS_CAP, Math.max(1, Math.floor((solo.usable * 1.15) / units)))

  const soloTotal = (productLocalMxn || 0) + soloPrice

  // Break-even: n items save n × saving, and cost whichever box they need. The
  // box can grow as n does, so walk it rather than dividing — dividing quietly
  // assumes the S holds an unlimited number of shirts.
  let breakeven: number | null = null
  if (savingPerItemMxn > 0) {
    for (let n = 1; n <= 80; n++) {
      const box = boxFor(units * n)
      const price = boxPrices[box.key]
      if (!Number.isFinite(price)) break
      if (savingPerItemMxn * n - price > 0) { breakeven = n; break }
    }
  }

  // The box worth describing is the one the shopper would actually END UP in,
  // not the one a single item ships in. A pair of shoes fits alone in an S, but
  // if break-even is 4 pairs that is an SM. Quoting "fill the S" there would
  // promise a full box that still loses money.
  let fullBox: { items: number; saving_mxn: number } | null = null
  if (savingPerItemMxn > 0 && breakeven) {
    const target = boxFor(units * breakeven)
    const targetPrice = boxPrices[target.key]
    if (Number.isFinite(targetPrice)) {
      const holds = Math.max(breakeven, Math.floor((target.usable * 1.15) / units))
      fullBox = { items: holds, saving_mxn: Math.round(savingPerItemMxn * holds - targetPrice) }
    }
  }

  return {
    item_units: units,
    fits,
    solo_box: { key: solo.key, label: solo.label, price_mxn: soloPrice },
    solo_total_mxn: Math.round(soloTotal),
    solo_vs_local_pct:
      productLocalMxn && savingPerItemMxn > 0
        ? Math.round(((soloTotal - (productLocalMxn + savingPerItemMxn)) / (productLocalMxn + savingPerItemMxn)) * 100)
        : null,
    breakeven_items: breakeven,
    full_box: fullBox,
  }
}

// ─── Live prices ─────────────────────────────────────────────────────────────

/**
 * Offline fallback ONLY. Real prices come from the Stripe catalog below, so a
 * price change reaches every surface without a deploy. Never quote these
 * directly — a stale box price is a broken promise at checkout.
 */
const FALLBACK_PRICES: Record<string, number> = {
  S: 2400, SM: 3300, M: 4400, ML: 5100, L: 5600, LXL: 6250, XL: 6900,
}

// "Extra Small Box" is deliberately unmapped — the size is retired, and mapping
// it would let a price we no longer sell back into the quote table.
const SIZE_BY_NAME: Record<string, string> = {
  'small box': 'S', 'medium box': 'M',
  'large box': 'L', 'extra large box': 'XL',
}

/**
 * The half sizes, which Stripe cannot express by name.
 *
 * Each is a second PRICE on its larger neighbour's product, so it shares that
 * box's name and dimensions and is indistinguishable by name alone. Price ids
 * are unambiguous.
 *
 * If these ever get their own Stripe products, delete this map and let the name
 * mapping do the work.
 */
const SIZE_BY_PRICE_ID: Record<string, string> = {
  price_1TycM4BAXLV60x1LO8mJ9d0K: 'SM', // "Medium Box" @ MX$3,300
  price_1TyzynBAXLV60x1LQuPHhomo: 'ML', // "Large Box" @ MX$5,100
  price_1TyzyNBAXLV60x1L1E2qaslp: 'LXL', // "Extra Large Box" @ MX$6,250
}

let cache: { at: number; prices: Record<string, number> } | null = null

/**
 * Box prices in MXN, live from the Stripe catalog, cached a few minutes.
 *
 * Each size has several active prices — the list price is the HIGHEST for that
 * size; the cheaper ones are in-between amounts used for odd shipments and must
 * never be quoted publicly. `shipping=false` is the border-pickup catalog, a
 * different service.
 *
 * @param getProducts returns the raw /products catalog
 */
/**
 * The dead zone: the worst place to stop, and the most honest place to push.
 *
 * COMPASS §1b computes it and calls it "the highest-leverage nudge in the
 * product". Shipping is priced per BOX, so just tipping over a size boundary
 * means paying for the bigger box while carrying the smaller one's contents —
 * about 1.8x the per-unit cost of simply filling the box below.
 *
 * Pushing here is honest in a way most upsells are not: **the shopper has
 * already paid for that space.** Filling it costs them nothing more in
 * shipping, and every item they add makes every other item cheaper.
 *
 * Deliberately NOT an upsell to a bigger box (§5): the only number that may go
 * up is how full it is. `room` is how many more of a typical item fit in the
 * box they are ALREADY in.
 */
export type DeadZone = {
  /** True when they've crossed into this box but are nowhere near filling it. */
  in: boolean
  box_key: string
  box_label: string
  /** Units already used, and what the box holds. */
  units: number
  usable: number
  /** How many more typical items fit in the space they've already bought. */
  room: number
  per_unit_now: number
  per_unit_full: number
}

/**
 * @param units   total shoe-units currently in the box
 * @param price   what that box costs, MXN
 * @param avgUnit typical size of the things this shopper adds
 */
export function deadZone(units: number, price: number, avgUnit: number): DeadZone | null {
  if (!units || units <= 0 || !price || price <= 0) return null

  const box = boxFor(units)
  const usable = box.usable
  const unit = avgUnit > 0 ? avgUnit : DEFAULT_VOL

  // Room measured against the box they are IN — never the next one up.
  const room = Math.max(0, Math.floor((usable * 1.15 - units) / unit))

  const perNow = price / Math.max(units, 0.01)
  const perFull = price / usable

  // "Just crossed" = using no more than ~65% of what they already paid for,
  // with real room left. Below that the nudge is noise; above it the shopper is
  // genuinely leaving money on the table.
  //
  // 0.65, not 0.6, because of a case the flow test surfaced: four pairs of
  // shoes is 6.0u, which lands in an M (usable 10) at exactly 60% — so the
  // strict `<` missed it. And it is the textbook dead zone: three pairs ship in
  // an S at MX$800 each, the fourth pushes them into an M at MX$1,100 each.
  // Adding an item made every item MORE expensive, and we said nothing.
  const inZone = units <= usable * 0.65 && room >= 2

  return {
    in: inZone,
    box_key: box.key,
    box_label: box.label,
    units: Math.round(units * 100) / 100,
    usable,
    room,
    per_unit_now: Math.round(perNow),
    per_unit_full: Math.round(perFull),
  }
}

export async function loadBoxPrices(
  getProducts: () => Promise<any>,
): Promise<Record<string, number>> {
  if (cache && Date.now() - cache.at < 10 * 60 * 1000) return cache.prices
  try {
    const res = await getProducts()
    const next: Record<string, number> = {}
    for (const p of Array.isArray(res) ? res : []) {
      if (String(p?.shipping) !== 'true') continue
      const size =
        SIZE_BY_PRICE_ID[String(p?.price_id || '')] ??
        SIZE_BY_NAME[String(p?.name || '').trim().toLowerCase()]
      const price = Number(p?.price)
      if (!size || !Number.isFinite(price)) continue
      if (next[size] === undefined || price > next[size]) next[size] = price
    }
    // Only accept a COMPLETE table; a partial catalog must not half-update the
    // quote the shopper sees.
    if (BOX_TIERS.every((b) => next[b.key] > 0)) {
      cache = { at: Date.now(), prices: next }
      return next
    }
  } catch {
    /* keep the last good prices, or the static fallback */
  }
  return cache?.prices ?? FALLBACK_PRICES
}
