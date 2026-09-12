// Variants for ONE product URL, callable from the BROWSER — so the product modal can behave like a real product
// page: open, load, show sizes/colours/quantity, add to cart. Alex, 2026-09-11: "when they clicked from the browsing
// gallery... have a little loading there and then pull all the info and variants right there... and then they click
// to add to cart directly". The chat's own tool path (assistant.post.ts) still exists for the conversational flow;
// this is the same catalog call, reachable without a chat turn.
//
// Catalog reads go DIRECT to the catalog service (see CATALOG_DIRECT_RE in assistant.post.ts): the Laravel API's
// small PHP-FPM pool stalls them behind slow SerpAPI calls.
const CATALOG_BASE = 'https://catalog.fullstacklabs.org'
const API_BASE = 'https://api.boxly.mx'
const hostOf = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, '') } catch { return '' } }

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
  // A GOOGLE ROW HAS NO STORE URL. Google Shopping links to google.com, so before anything can be read we resolve
  // the row to the merchant's own product page via its page token, then fall through and read THAT like any other
  // store (Alex, 2026-09-11: it has to work for any result we show in the gallery).
  let readUrl = url
  let resolved: any = null
  let offers: any[] = []
  if (/(^|\.)google\.[a-z.]+$/i.test(hostOf(url)) && body?.page_token) {
    try {
      const g: any = await $fetch(`${API_BASE}/catalog/google-product`, { method: 'POST', body: { page_token: body.page_token }, timeout: 20_000 })
      // A GOOGLE OFFER OUTLIVES ITS LISTING. The top merchant's link is often already dead (the reader answers
      // page_not_found on its 404), so keep the runners-up: we walk them in order until one reads as a product.
      offers = (g?.offers || []).filter((o: any) => o?.url).slice(0, 3)
      if (!offers.length) return { variants: [], axes: [], colorways: [], reason: 'no_merchant_offer', images: g?.images || [] }
      readUrl = offers[0].url
      resolved = { merchant: offers[0].merchant, price: offers[0].price, images: g.images || [] }
    } catch (e: any) {
      console.warn('[product-variants] google-product unreachable:', e?.message || e)
      return { variants: [], axes: [], colorways: [], reason: 'unreachable' }
    }
  }

  // AMAZON GOES TO ITS OWN PRODUCT PAGE. A gallery row from an Amazon search has one image, no sizes and no
  // stock — but we always have its product URL, so the read is possible and therefore mandatory (Alex, 2026-09-11:
  // "that step is never optional... the page might reveal the product isn't available"). The catalog service
  // cannot do this one: the SerpAPI key lives on the API, so the API reads the page and hands back the same shape.
  const readAmazon = async (u: string) => {
    try {
      const a: any = await $fetch(`${API_BASE}/catalog/amazon-product`, { method: 'POST', body: { url: u }, timeout: 25_000 })
      const variants = Array.isArray(a?.variants) ? a.variants : []
      if (variants.length || (a?.product?.images || []).length) {
        return {
          product: a.product || null,
          axes: Array.isArray(a.axes) ? a.axes : [],
          variants,
          axes_independent: a.axes_independent !== false,
          selected: null,
          checked_at: a.checked_at || null,
          source: a.source || 'amazon-product',
          colorways: [],
          reason: a?.error || null,
        }
      }
      return { variants: [], axes: [], colorways: [], reason: a?.error || 'no_variants' }
    } catch (e: any) {
      console.warn('[product-variants] amazon-product unreachable:', e?.message || e)
      return { variants: [], axes: [], colorways: [], reason: 'unreachable' }
    }
  }

  const readStore = async (u: string) => {
    try {
      const r: any = await $fetch(`${CATALOG_BASE}/catalog/product-variants`, {
        method: 'POST',
        body: { url: u, max_age_s: maxAgeS, skip_colorways: !!body?.skip_colorways },
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
        // BUSY IS NOT "THIS PRODUCT HAS NO OPTIONS" (2026-09-12, found by pdp-truth-retail). The reader answers
        // {busy:true} when another read holds the browser, and mapping that to no_variants gave the shopper an
        // instant, permanent "no sizes" on a product with plenty — indistinguishable from a real single-SKU page,
        // with no retry offered. It is a failed read, and the modal shows Reintentar for those.
        reason: r?.busy ? 'busy' : (r?.error || (!variants.length ? (r?.reason || 'no_variants') : null)),
      }
    } catch (e: any) {
      // Never block the modal on our reader: no variants simply means the picker stays hidden.
      console.warn('[product-variants] unreachable:', e?.message || e)
      return { variants: [], axes: [], reason: 'unreachable' } as any
    }
  }

  const readAny = (u: string) => (/(^|\.)amazon\.[a-z.]+$/i.test(hostOf(u)) ? readAmazon(u) : readStore(u))
  // Did we land on a PRODUCT? A dead link answers page_not_found; a walled or empty page answers nothing usable.
  // Anything with a real axis, several variants, photos or a price is the product page we came for.
  const isProduct = (r: any) => !!r && !['page_not_found', 'not_a_product_page', 'unreachable'].includes(r.reason)
    && ((r.axes || []).length > 0 || (r.variants || []).length > 1 || (r.product?.images || []).length > 0 || r.product?.price != null)

  // Walk the merchants in Google's order until one of them actually has the product.
  if (offers.length) {
    let last: any = null
    for (const o of offers) {
      const r = await readAny(o.url)
      if (isProduct(r)) { readUrl = o.url; resolved = { ...resolved, merchant: o.merchant, price: o.price }; last = r; break }
      console.warn('[product-variants] merchant link not a product:', o.merchant, r?.reason)
      last = last || r
    }
    const r: any = last || { variants: [], axes: [], reason: 'no_merchant_offer' }
    // GOOGLE'S PRICE WINS ON A SINGLE-SKU PAGE. Reading a price off a page is a heuristic, and on a big retailer's
    // product page it finds add-ons: Target's Switch 2 page answered $11.99 (a protection plan) against Google's
    // $499.99 for that same merchant. Google's offer price is structured data for the exact listing we followed,
    // so it replaces the scraped one when nothing on the page told us this product has several prices.
    const singleSku = !(r.axes || []).length && (r.variants || []).length <= 1
    const offerPrice = typeof resolved?.price === 'number' ? resolved.price : null
    const product = { ...(r.product || {}) }
    if (singleSku && offerPrice != null) product.price = offerPrice
    if (!(product.images || []).length && resolved?.images?.length) { product.images = resolved.images; product.image = resolved.images[0] }
    const variants = singleSku && offerPrice != null
      ? (r.variants || []).map((v: any) => ({ ...v, price: offerPrice }))
      : r.variants
    return { ...r, product, variants, resolved_merchant: resolved?.merchant, resolved_url: readUrl }
  }

  if (/(^|\.)amazon\.[a-z.]+$/i.test(hostOf(readUrl))) return await readAmazon(readUrl)

  return await readStore(readUrl)
})
