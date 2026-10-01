// Variants for ONE product URL, callable from the BROWSER — so the product modal can behave like a real product
// page: open, load, show sizes/colours/quantity, add to cart. Alex, 2026-09-11: "when they clicked from the browsing
// gallery... have a little loading there and then pull all the info and variants right there... and then they click
// to add to cart directly". The chat's own tool path (assistant.post.ts) still exists for the conversational flow;
// this is the same catalog call, reachable without a chat turn.
//
// Catalog reads go DIRECT to the catalog service (see CATALOG_DIRECT_RE in assistant.post.ts): the Laravel API's
// small PHP-FPM pool stalls them behind slow calls. Since 2026-09-28 every gallery row is a store's own product page
// (the live store gallery), so the Google-row resolution (/catalog/google-product) and the Amazon page read
// (/catalog/amazon-product) that lived here are gone with the web search that produced those rows.
const CATALOG_BASE = 'https://catalog.fullstacklabs.org'
// Hardcoding production here meant a local stack still called the live API for the feed
// variant reads, so a fix could be verified locally and appear not to work — and testing
// that was supposed to stay off production quietly did not. Honour API_URL exactly as
// assistant.post.ts does; production sets it, so nothing changes there.
const API_BASE = (process.env.API_URL || 'https://api.boxly.mx').replace(/\/$/, '')
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
  const readUrl = url

  // STORES WE CANNOT READ AT ALL GET READ FROM THE FEED INSTEAD.
  // New Balance answers every server fetch with 403, and in the headless browser its page
  // loads but exposes an EMPTY accessibility tree — measured three times on 2026-09-13 at
  // 7s, +3s and +8s, all "this page exposes no content". So no retry reads it, and the
  // modal fell back to a mirror with no colour photos: pick a colour, nothing moves.
  // Google's feed knows the product, and knows per-option availability the mirror never
  // had. Keyed by host so adding the next bot-walled store is one line.
  const FEED_STORES: Record<string, string> = { 'newbalance.com': 'New Balance' }
  const feedBrand = (u: string) => {
    const h = hostOf(u)
    for (const [dom, brand] of Object.entries(FEED_STORES)) if (h === dom || h.endsWith('.' + dom)) return brand
    return null
  }
  const readFeed = async (u: string, brand: string) => {
    // The shopper's own title is the best query; a New Balance url still carries the model
    // ("/pd/9060/…") when the modal did not send one.
    const fromUrl = (u.match(/\/pd\/([^/]+)/)?.[1] || '').replace(/[-_]+/g, ' ').trim()
    // Do not say the brand twice: gallery titles usually already start with it, and
    // "New Balance New Balance 9060" matches nothing in the shopping feed.
    const name = String(body?.title || fromUrl || '').slice(0, 80).trim()
    const query = (new RegExp(`^${brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(name) ? name : `${brand} ${name}`).trim()
    try {
      const f: any = await $fetch(`${API_BASE}/catalog/feed-product`, { method: 'POST', body: { query, brand }, timeout: 60_000 })
      const variants = Array.isArray(f?.variants) ? f.variants : []
      if (!variants.length) return { variants: [], axes: [], colorways: [], reason: f?.error || 'no_variants' }
      return {
        // Keep the STORE's own url and photos — the feed's link points at Google, and the
        // shopper is buying from New Balance, not from a search result.
        product: { ...(f.product || {}), url: u },
        axes: Array.isArray(f.axes) ? f.axes : [],
        variants,
        axes_independent: f.axes_independent !== false,
        selected: f.selected || null,
        checked_at: f.checked_at || null,
        source: f.source || 'feed',
        colorways: [],
        reason: null,
      }
    } catch (e: any) {
      console.warn('[product-variants] feed unreachable:', e?.message || e)
      return { variants: [], axes: [], colorways: [], reason: 'unreachable' }
    }
  }

  const readStore = async (u: string) => {
    try {
      const r: any = await $fetch(`${CATALOG_BASE}/catalog/product-variants`, {
        method: 'POST',
        // The card's title lets the reader re-pin a family page that served another style (VS, 2026-09-30); a
        // colourway pick is a deliberate other style, so it goes without.
        body: { url: u, max_age_s: maxAgeS, skip_colorways: !!body?.skip_colorways, ...(!body?.colorways?.length ? { ...(body?.title ? { title: String(body.title).slice(0, 300) } : {}), ...(body?.image ? { image: String(body.image).slice(0, 2000) } : {}) } : {}) },
        // NETLIFY CUTS THIS FUNCTION AT ~30 s (live 2026-10-01: a 41 s VS read and a 35 s Sprouts read both succeeded in the
        // catalog but the shopper got a 502 → "No pudimos leer"). Wait 22 s; past that the card asks again ("reading") and
        // the catalog — which keeps reading and joins an identical in-flight read — answers the retry.
        timeout: 22_000,
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
        // The reader read the card's own style instead of the family page's default ({from, to}), or could not
        // (style_mismatch {card_title, served_title, served_price}): the picker names the served product, never passes it off.
        repinned: r?.repinned?.to ? r.repinned : null,
        style_mismatch: r?.style_mismatch?.served_title ? r.style_mismatch : null,
        // BUSY IS NOT "THIS PRODUCT HAS NO OPTIONS" (2026-09-12, found by pdp-truth-retail). The reader answers
        // {busy:true} when another read holds the browser, and mapping that to no_variants gave the shopper an
        // instant, permanent "no sizes" on a product with plenty — indistinguishable from a real single-SKU page,
        // with no retry offered. It is a failed read, and the modal shows Reintentar for those.
        // BLOCKED IS NOT "NO OPTIONS" EITHER (2026-09-12). Kohl's answers our reader with an Access Denied wall,
        // and flattening that to no_variants told the shopper the product has no sizes or colours — a lie about
        // the product when the truth is about us. The reader already reports blocked; the modal renders any
        // reason as "we could not read this" with a retry, which is what a wall deserves.
        reason: r?.busy ? 'busy' : (r?.blocked ? 'blocked' : (r?.error || (!variants.length ? (r?.reason || 'no_variants') : null))),
      }
    } catch (e: any) {
      // Still reading (our own 22 s wait ran out, not the reader): the card retries and joins the read in flight.
      if (/timeout|timed out|aborted/i.test(`${e?.message || ''} ${e?.cause?.name || ''}`)) return { variants: [], axes: [], reason: 'reading' } as any
      // Never block the modal on our reader: no variants simply means the picker stays hidden.
      console.warn('[product-variants] unreachable:', e?.message || e)
      return { variants: [], axes: [], reason: 'unreachable' } as any
    }
  }

  // AN OPTION CANNOT BE SOLD OUT IN EVERY VALUE WHILE THE PRODUCT HAS STOCK (live 2026-09-28: New Balance's reader
  // marked all 8 colours of the 860v15 unavailable next to 18 available sizes/widths, so no colour could be picked and
  // the shopper was stuck on "Elige color"). Such an axis was misread: its values become unknown (pickable, dashed),
  // never a wall. Only for per-option reads (axes_independent), where each variant is one value of one axis.
  function sane(r: any) {
    const variants: any[] = Array.isArray(r?.variants) ? r.variants : []
    if (!variants.length || r?.axes_independent === false || !variants.some((v) => v.available === true)) return r
    const axisOf = (v: any) => Object.keys(v?.options || {})[0] || (v?.color != null ? 'color' : v?.size != null ? 'size' : null)
    const byAxis = new Map<string, any[]>()
    for (const v of variants) { const a = axisOf(v); if (a) byAxis.set(a, [...(byAxis.get(a) || []), v]) }
    const wrong = new Set([...byAxis].filter(([, vs]) => vs.length > 1 && vs.every((v) => v.available === false)).map(([a]) => a))
    if (!wrong.size) return r
    return { ...r, variants: variants.map((v) => (wrong.has(axisOf(v)) ? { ...v, available: null } : v)) }
  }

  // THE STORE'S OWN PAGE FIRST, the feed only when it comes back empty (live 2026-09-28: New Balance's page now reads
  // fine — colour, size and width in ~12 s — while the feed answered nothing, so the modal offered a running shoe with
  // no size to pick and "Agregar al carrito" sent it to the store without one).
  const store = sane(await readStore(readUrl))
  const readUrlBrand = feedBrand(readUrl)
  let out: any = store
  if (store.reason === 'reading') return store
  if (readUrlBrand && !store.variants.length) {
    const feed = await readFeed(readUrl, readUrlBrand)
    if (feed.variants.length) out = feed
  }
  // A colourway re-read skips re-discovering the siblings; the chat's picker card keeps the set it already holds.
  if (Array.isArray(body?.colorways) && body.colorways.length && !out.colorways?.length) out = { ...out, colorways: body.colorways.slice(0, 60) }
  // A re-pinned read's URL is the card's own style: the cart adds THAT, not the family link's default.
  await persistPickerCard(body, out.repinned?.to || url, out)
  return out
})

// THE PICKER CARD LIVES IN THE CONVERSATION (Alex, 2026-09-29: "make it directly in the chat itself … so it stays there,
// even if the client refreshes"). When the chat asks for a read with its conversation, the read is saved there as one
// assistant message carrying a tool-product_picker part — written here, server-side, so the card survives even a tab
// closed mid-read. Same owner-authenticated call the assistant's persistTurn makes. Only a read that worked is saved
// (a busy / walled / unreachable read is retried from the card instead); a failed save never costs the shopper the read.
const READ_SUCCEEDED_EMPTY = new Set(['no_variants', 'need_url'])
async function persistPickerCard(body: any, url: string, read: any) {
  const conversationId = Number(body?.conversation_id)
  const token = typeof body?.token === 'string' ? body.token : ''
  if (!(conversationId > 0) || !token || (read?.reason && !READ_SUCCEEDED_EMPTY.has(read.reason))) return
  const p = body?.product && typeof body.product === 'object' ? body.product : {}
  const str = (v: any, n: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, n) : null)
  const num = (v: any) => (typeof v === 'number' && Number.isFinite(v) ? v : null)
  const cardUrl = str(p.url, 2000) || url
  const part = {
    type: 'tool-product_picker',
    toolCallId: 'picker-' + Date.now().toString(36),
    state: 'output-available',
    input: {},
    output: {
      product: { store_id: str(p.store_id, 64), store_name: str(p.store_name, 120), url: cardUrl, title: str(p.title, 300), image: str(p.image, 2000), price: num(p.price), was: num(p.was) },
      read,
      read_at: new Date().toISOString(),
      read_url: url,
    },
  }
  try {
    const res = await fetch(`${API_BASE}/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ messages: [{ role: 'assistant', content: { parts: [part] } }] }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) console.warn('[product-variants] picker card not saved:', res.status)
  } catch (e: any) {
    console.warn('[product-variants] picker card not saved:', e?.message || e)
  }
}
