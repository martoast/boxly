// Variants for ONE product URL, callable from the BROWSER — so the product modal can behave like a real product
// page: open, load, show sizes/colours/quantity, add to cart. Alex, 2026-09-11: "when they clicked from the browsing
// gallery... have a little loading there and then pull all the info and variants right there... and then they click
// to add to cart directly". The chat's own tool path (assistant.post.ts) still exists for the conversational flow;
// this is the same catalog call, reachable without a chat turn.
//
// Catalog reads go DIRECT to the catalog service (see CATALOG_DIRECT_RE in assistant.post.ts): the Laravel API's
// small PHP-FPM pool stalls them behind slow SerpAPI calls.
const CATALOG_BASE = 'https://catalog.fullstacklabs.org'

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => null)
  const url = typeof body?.url === 'string' ? body.url.trim() : ''
  if (!/^https?:\/\//i.test(url)) return { variants: [], axes: [], reason: 'need_url' }
  // LIVE ON EVERY OPEN (Alex, 2026-09-11: "it should be a live read each time to get the variants and images of
  // the product from the product details page"). max_age_s 0 = never serve a cached row: the shopper who tapped a
  // product gets that product page as it is right now — its photos, its sizes, its stock, its price. For a feed
  // store that is a JSON fetch in 0.4–2 s and no browser at all; only a store without a feed pays for a real page
  // read. The catalog's stored images stay behind this purely as the instant first paint and the fallback when a
  // store is slow or walled, never as the answer.
  const maxAgeS = Number(body?.max_age_s) >= 0 ? Number(body.max_age_s) : 0
  try {
    const r: any = await $fetch(`${CATALOG_BASE}/catalog/product-variants`, {
      method: 'POST',
      body: { url, max_age_s: maxAgeS, skip_colorways: !!body?.skip_colorways },
      timeout: 55_000,
    })
    const variants = Array.isArray(r?.variants) ? r.variants : []
    return {
      product: r?.product || null,
      axes: Array.isArray(r?.axes) ? r.axes : [],
      variants,
      axes_independent: r?.axes_independent !== false,
      selected: r?.selected || null,
      checked_at: r?.checked_at || null,
      source: r?.source || null,
      // Sibling colourways: stores that sell each colour as its own page (DFYNE, Alo, YoungLA) — the modal offers
      // them all and re-reads the one the shopper picks, because availability is per colourway.
      colorways: Array.isArray(r?.colorways) ? r.colorways : [],
      reason: r?.error || (!variants.length ? (r?.reason || 'no_variants') : null),
    }
  } catch (e: any) {
    // Never block the modal on our reader: no variants simply means the picker stays hidden.
    console.warn('[product-variants] unreachable:', e?.message || e)
    return { variants: [], axes: [], reason: 'unreachable' }
  }
})
