// Card identity + hover-cycle logic for ProductGallery — extracted pure so
// `node --experimental-strip-types` can prove the no-state-transfer rule
// without Vue (same convention as utils/galleryCard.ts).
//
// Why identity and not index: `visible` is a FILTERED computed. Switching the
// store tab shifts different products under the same indices, and an
// index-addressed :key/cycle state then patches a different product into a
// card that may still be mid-cycle — the hover state silently transfers to a
// product the customer never hovered. Every address below is a card KEY, so a
// list shift can reset state but can never hand it to a different product.

/**
 * Canonical per-card identity for :key and cycle addressing. Prefers the
 * product URL; a missing/blank URL falls back to store+title. The key is the
 * JSON serialization of a [kind, …identity fields, occurrence] tuple — a
 * structured encoding, NOT string concatenation, so no literal URL (even one
 * ending in "#1") and no store/title containing a delimiter can ever collide
 * with another card's key. Occurrence numbering makes duplicates unique while
 * staying deterministic and stable for an unchanged list, and a product's
 * FIRST occurrence keeps the same key across filter changes (same product,
 * same key — cycling continuity depends on it).
 */
export function productCardKeys(list: any[]): string[] {
  const seen = new Map<string, number>()
  return (list || []).map((p) => {
    const url = typeof p?.url === 'string' && p.url.trim() ? p.url.trim() : null
    const identity: unknown[] = url
      ? ['url', url]
      : ['st', typeof p?.store === 'string' ? p.store : '', typeof p?.title === 'string' ? p.title : '']
    const base = JSON.stringify(identity)
    const n = seen.get(base) ?? 0
    seen.set(base, n + 1)
    return JSON.stringify([...identity, n])
  })
}

export interface CycleState { key: string | null; idx: number }

export const IDLE_CYCLE: CycleState = Object.freeze({ key: null, idx: 0 })

/**
 * The image a card must display. Cycling applies ONLY when the card's own
 * identity matches the cycling identity — a stale state left over from another
 * product (or another index) can never leak its cycled frame in.
 */
export function cycleSrc(p: any, key: string, s: CycleState): string | null {
  const images = Array.isArray(p?.images) ? p.images : []
  if (s.key === key && images.length > 1) return images[s.idx % images.length]
  return p?.image || images[0] || null
}

/** Begin cycling a card, or null when there is nothing to cycle (<2 images). */
export function startCycleState(key: string, images: any[]): CycleState | null {
  if (!Array.isArray(images) || images.length < 2) return null
  return { key, idx: 0 }
}

/** One timer tick. A non-cycling state never advances. */
export function stepCycleState(s: CycleState, imageCount: number): CycleState {
  if (s.key === null || imageCount < 2) return s
  return { key: s.key, idx: (s.idx + 1) % imageCount }
}

/**
 * After the visible list changes (store tab, new results): keep cycling ONLY
 * if the SAME identity is still present — that is the same product, not a
 * transfer. Any identity that left the list resets to idle.
 */
export function syncCycleState(s: CycleState, currentKeys: string[]): CycleState {
  if (s.key === null) return s
  return currentKeys.includes(s.key) ? s : IDLE_CYCLE
}
