import { itemUnits, boxFor, deadZone, loadBoxPrices, DEFAULT_VOL } from './boxMath'

/**
 * Turn the box's CONTENTS into the numbers the panel draws.
 *
 * One implementation, shared by every box endpoint, for the reason COMPASS §1b
 * gives: if the chat and the panel each size a box their own way they will
 * quote different answers for the same items, and the shopper will catch us.
 *
 * The volume model is the same "shoe-units" one the assistant uses — a tee is
 * 0.30, a hoodie 0.45, boxed shoes 1.50 — so ten sanitizers barely move the bar
 * and one coat moves it a lot. Counting items would be simpler and wrong.
 */
export async function withBoxState(box: any, getProducts: () => Promise<any>) {
  const items: any[] = Array.isArray(box?.items) ? box.items : []
  if (!items.length) return box

  // Volume, not count. Quantity matters: two of the same shirt is two shirts.
  let units = 0
  for (const it of items) {
    units += itemUnits(String(it?.name || '')) * Math.max(1, Number(it?.quantity) || 1)
  }

  const tier = boxFor(units)
  const prices = await loadBoxPrices(getProducts)
  const price = prices?.[tier.key] ?? null

  // What a typical item in THIS box looks like, so "room" is measured against
  // what this shopper actually buys rather than an average we invented.
  const avgUnit = items.length ? units / items.reduce((n, it) => n + Math.max(1, Number(it?.quantity) || 1), 0) : DEFAULT_VOL

  return {
    ...box,
    units: Math.round(units * 100) / 100,
    box_key: tier.key,
    box_label: tier.label,
    box_price_mxn: price,
    fill_percent: Math.min(100, Math.round((units / tier.usable) * 100)),
    dead_zone: price ? deadZone(units, price, avgUnit) : null,
  }
}
