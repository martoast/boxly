// WHAT ONE PIECE ACTUALLY COSTS, LANDED IN MEXICO.
//
// A shopper buying one shirt reads the total and is done. Someone buying 140 bottles of
// magnesium is doing different arithmetic: they need the per-piece cost with the 15%
// commission and the box already spread across it, because that is the number they price
// against (Oswaldo, 2026-09-14 — "estoy pensando traer 130 piezas", then 140, then
// "cuántos frascos caben en una caja chica"). He was quoted a total and left to divide it
// himself, three times.
//
// It is also the plainest statement of why consolidating pays: the box is ONE cost split
// over every piece, so each extra piece lands cheaper than the last.

export const BOXLY_COMMISSION = 0.15

export interface LandedInput {
  /** Unit price in USD × quantity, per line. */
  items: { price: number; quantity: number }[]
  /** MXN price of the box the shipment is estimated to need. */
  boxPriceMxn: number | null
  /** USD→MXN rate. Null when unknown — we quote nothing rather than guess. */
  fx: number | null
}

export interface Landed {
  units: number
  subtotalUsd: number
  commissionUsd: number
  totalMxn: number
  /** Null for a single piece, where it is just the total again. */
  perUnitMxn: number | null
}

/**
 * The delivered cost of a shipment, and what that works out to per piece.
 *
 * Returns null when the box price or the FX rate is missing: a total built on a guessed
 * rate is worse than "se cotiza aparte", and the card already knows how to say that.
 */
export function landedCost({ items, boxPriceMxn, fx }: LandedInput): Landed | null {
  if (!Number.isFinite(boxPriceMxn as number) || !(boxPriceMxn as number) || !fx || !(fx > 0)) return null
  const rows = (items || []).filter((i) => Number.isFinite(i?.price) && Number.isFinite(i?.quantity))
  const units = rows.reduce((n, i) => n + Math.max(1, Math.trunc(i.quantity)), 0)
  if (!units) return null
  const subtotalUsd = rows.reduce((s, i) => s + i.price * Math.max(1, Math.trunc(i.quantity)), 0)
  const commissionUsd = subtotalUsd * BOXLY_COMMISSION
  const totalMxn = (subtotalUsd + commissionUsd) * fx + (boxPriceMxn as number)
  return {
    units,
    subtotalUsd,
    commissionUsd,
    totalMxn,
    perUnitMxn: units >= 2 ? totalMxn / units : null,
  }
}
