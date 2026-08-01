/**
 * What a box actually costs — the one implementation.
 *
 * Boxly prices shipping per BOX at a fixed rate, so the cost of any single item
 * is meaningless on its own. A MX$1,590 shirt bought in the US for MX$1,118
 * looks like a 30% win until you add the MX$1,300 an XS box costs, at which
 * point the shopper has paid 52% MORE than if they'd bought it at home.
 *
 * The shopper panel quoted that half-price for its entire life. This module
 * exists so it can't happen again, and so the chat and the panel can never
 * disagree about which box a set of items lands in — one volume model, one
 * ladder, both surfaces importing from here.
 *
 * Volumes are in "shoe-units": one boxed pair of shoes = 1.0.
 */

/** How much room an item takes. Calibrated so the prenda counts below land right. */
export const ARCHETYPE_VOL: Record<string, number> = {
  rigid_small: 0.05, // cosmetics, perfume, jewelry, accessories, cables
  flat_soft: 0.30, // tees, leggings, shorts, underwear, swimwear
  medium_soft: 0.45, // jeans, hoodies, joggers, light jackets, backpacks
  rigid_medium: 0.25, // bottles, tumblers, electronics
  shoes: 1.50, // a boxed pair
  bulky_soft: 0.80, // boots, thick coats, blankets, pillows, helmets
  fragile: 2.00, // lamps, glass, decor — awkward, poor packing efficiency
}
export const DEFAULT_VOL = 0.40

export const ARCH_LABEL: Record<string, string> = {
  rigid_small: 'Pequeño', flat_soft: 'Ropa', medium_soft: 'Mediano',
  rigid_medium: 'Mediano', shoes: 'Calzado', bulky_soft: 'Voluminoso', fragile: 'Frágil',
}

/** `usable` = volume at which the box is full, in shoe-units. */
export const BOX_TIERS = [
  { key: 'XS', label: 'Extra chica', usable: 2.0 },
  { key: 'S', label: 'Chica', usable: 4.5 },
  // ── The half sizes ────────────────────────────────────────────────────────
  //
  // Boxly ships EIGHT box sizes, not five. Between each of the big ones sits a
  // midpoint box that was never listed on the site and never modelled here:
  //
  //     1300 · 2400 · 3300 · 4400 · 5100 · 5600 · 6250 · 6900
  //      XS     S     SM      M     ML      L    LXL     XL
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
  { key: 'SM', label: 'Mediana chica', usable: 7.25 },
  { key: 'M', label: 'Mediana', usable: 10 },
  { key: 'ML', label: 'Grande chica', usable: 12.25 },
  { key: 'L', label: 'Grande', usable: 14.5 },
  { key: 'LXL', label: 'Extra grande chica', usable: 18 },
  { key: 'XL', label: 'Extra grande', usable: 21.5 },
]

const RE_SHOES = /shoe|sneaker|tenis|boot|bota|cleat|sandal|heel|loafer|zapat/i
const RE_FRAGILE = /lamp|l[aá]mpara|glass|vidrio|vase|florero|mirror|espejo|frame|cuadro|ceramic|porcelain|decor/i
const RE_RIGID_SMALL = /saniti|mist|antibac|perfume|cologne|fragran|skincare|serum|lipstick|labial|mascara|cosmetic|maquillaje|cream|crema|lotion|loci[oó]n|cards?|cartas|pok[eé]mon|wallet|cartera|watch|reloj|jewel|joy|ring|anillo|necklace|collar|earring|arete|sunglass|lentes|case|funda|charger|cargador|earbuds|airpods|keychain|llavero/i
const RE_BULKY = /coat|parka|abrigo|puffer|\bdown\b|blanket|comforter|duvet|cobija|plush|peluche|pillow|almohada|duffel|luggage|maleta|suitcase|tent|sleeping bag|appliance|electrodom|coffee maker|cafetera|\bpot\b|olla|helmet|casco/i
const RE_MEDIUM = /jean|pant|pantal[oó]n|jogger|sudadera|hoodie|sweater|sweatshirt|jacket|chamarra|backpack|mochila|handbag|bolsa|\bbag\b|purse/i
const RE_RIGID_MEDIUM = /bottle|botella|tumbler|termo|\bcup\b|\bmug\b|taza|owala|stanley|hydro|flask|speaker|bocina|camera|c[aá]mara|console|consola|electronic|electr[oó]nico/i
const RE_FLAT_SOFT = /legging|mall[oó]n|shirt|camiset|camisa|\btee\b|playera|\btop\b|blouse|blusa|dress|vestido|short|skirt|falda|underwear|ropa interior|sock|calcet|\bbra\b|brasier|swim|traje de ba/i

/** Guess the archetype from a product name. Order matters — narrowest first. */
export function archetypeFromName(name: string): string | null {
  const t = name || ''
  if (RE_SHOES.test(t)) return 'shoes'
  if (RE_FRAGILE.test(t)) return 'fragile'
  if (RE_RIGID_SMALL.test(t)) return 'rigid_small'
  if (RE_BULKY.test(t)) return 'bulky_soft'
  if (RE_RIGID_MEDIUM.test(t)) return 'rigid_medium'
  if (RE_MEDIUM.test(t)) return 'medium_soft'
  if (RE_FLAT_SOFT.test(t)) return 'flat_soft'
  return null
}

/** Volume of one unit of this product, in shoe-units. */
export function itemUnits(name: string, type?: string | null): number {
  const t = type && ARCHETYPE_VOL[type] ? type : archetypeFromName(name || '')
  return t ? ARCHETYPE_VOL[t] : DEFAULT_VOL
}

/** The smallest box that holds this volume (15% squeeze, as the packers do). */
export function boxFor(units: number) {
  return BOX_TIERS.find((b) => units <= b.usable * 1.15) || BOX_TIERS[BOX_TIERS.length - 1]
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
  // Capped: by volume alone 45 perfumes "fit" an XS, which is true of the space
  // and false of the 8 kg limit — and one unbelievable number discredits every
  // honest one beside it.
  const FITS_CAP = 20
  const fits = Math.min(FITS_CAP, Math.max(1, Math.floor((solo.usable * 1.15) / units)))

  const soloTotal = (productLocalMxn || 0) + soloPrice

  // Break-even: n items save n × saving, and cost whichever box they need. The
  // box can grow as n does, so walk it rather than dividing — dividing quietly
  // assumes the XS holds an unlimited number of shirts.
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
  // not the one a single item ships in. A pair of shoes fits alone in an XS, but
  // break-even is 3 pairs — which is an S. Quoting "fill the XS" there would
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
  XS: 1300, S: 2400, SM: 3300, M: 4400, ML: 5100, L: 5600, LXL: 6250, XL: 6900,
}

const SIZE_BY_NAME: Record<string, string> = {
  'extra small box': 'XS', 'small box': 'S', 'medium box': 'M',
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
