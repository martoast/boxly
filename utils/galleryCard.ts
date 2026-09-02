// Pure card model for ProductGallery — dependency-free on purpose (root utils
// ship to the client bundle) and extracted so `node --experimental-strip-types`
// can test every mapping branch without Vue.
//
// Two producer families feed the gallery:
//  · legacy scalar shapes (show_products enrichment, store feeds): price /
//    price_usd / was / on_sale numbers and flags;
//  · the engine's persisted ProductV1 (tool-live_results): current_price /
//    list_price as {amount, currency} objects plus a proven `availability`.
// Legacy scalars ALWAYS win; ProductV1 fields are additive fallbacks, so every
// existing producer renders byte-identically. A reloaded live result once
// rendered title-only because this mapping didn't know money objects existed.

/** {amount, currency} → displayable USD amount, or null. Mirrors the Laravel
 * read-path rule (ProductV1::money): only USD may render in the $-USD caption,
 * amounts must be finite non-negative numbers, strings are never coerced. */
function usdAmount(money: unknown): number | null {
  if (!money || typeof money !== 'object' || Array.isArray(money)) return null
  const { amount, currency } = money as { amount?: unknown; currency?: unknown }
  if (typeof currency !== 'string' || currency.trim().toUpperCase() !== 'USD') return null
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0) return null
  return amount
}

export function galleryCardModel(p: any) {
  if (!p || typeof p !== 'object') p = {}
  const title = p.title || p.name || 'Producto'
  const image = p.image || p.image_url || null
  // Multiple photos (store-feed catalogs carry them) → hover-cycle. Falls back
  // to the single thumbnail for sources that only return one image.
  const imgs = (Array.isArray(p.images) ? p.images : []).filter((u: unknown) => typeof u === 'string' && u)
  const images = imgs.length ? imgs : (image ? [image] : [])
  const legacyPrice = p.price ?? p.price_usd ?? null
  const legacyWas = p.was ?? null
  const v1Price = usdAmount(p.current_price)
  const v1Was = usdAmount(p.list_price)
  const price = legacyPrice ?? v1Price
  const was = legacyWas ?? v1Was
  // Sale evidence: the legacy flag rules when present. It is DERIVED only when
  // BOTH money values came from ProductV1 (list above current) — a legacy card
  // that never showed an OFERTA badge must not grow one.
  const onSale = p.on_sale ?? p.onSale
    ?? (legacyPrice == null && legacyWas == null && v1Price != null && v1Was != null && v1Was > v1Price)
  // % off when we have both a was-price and a lower current price.
  const discount = onSale && was && price && was > price ? Math.round(((was - price) / was) * 100) : null
  // Explicit stock ONLY when ProductV1 proved it; 'unknown' or absent stays
  // null — the card never claims a stock state nobody verified.
  const stock = p.availability === 'in_stock' ? 'in_stock' : p.availability === 'out_of_stock' ? 'out_of_stock' : null
  return {
    title,
    url: p.url || p.product_url || p.source_url || '#',
    image,
    images,
    price,
    was,
    onSale,
    discount,
    stock,
    store: p.store || null,
    note: p.note || p.reason || null,
    snippet: p.snippet || null,
    rating: p.rating ?? null,
    reviews: p.reviews ?? null,
    token: p.token || null,
    broken: false,
  }
}
