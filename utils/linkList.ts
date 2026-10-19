// A LIST OF PRODUCT LINKS → ONE BOX (Alex 2026-10-10: "users that already have the links to the products they want … just want to
// pass over the list and have our AI add them all to cart and create the purchase request for all of them together"). The shopper
// pastes the links; one card reads every page and asks only for the choices a link does not already make; "Agregar todo" sends the
// whole list in one message (metadata.link_list) and the box takes it as it is. Pure helpers, shared by the card and the assistant.

export const LINK_LIST_MAX = 20

const OWN_SITES = /(?:^|\.)(?:boxly\.mx|localhost)$/i

// A STORE'S CART, BAG, CHECKOUT OR ACCOUNT PAGE IS NOT A PRODUCT (live WSS 2026-10-18: a shopper pasted shopwss.com/cart twice and
// got a link card that could not read it). Those pages live in the shopper's own browser session — we see an empty cart — so they
// are answered on their own (paste each product's link), never read.
const CART_SEGMENT = /^(?:cart|carts|bag|basket|shopping-?bag|shoppingbag|shopping-?cart|checkouts?|wishlists?|favorites|favourites|saved(?:-items)?|account|my-?account|login|signin|sign-in|orders?)$/i
const PRODUCT_SEGMENT = /^(?:p|dp|ip|product|products|item|itm|pd|prd|t)$/i

/** PURE. A link to a store's cart / bag / checkout / account page (never a product page). */
export function isCartLink(url: string): boolean {
  let u: URL
  try { u = new URL(url) } catch { return false }
  const segs = u.pathname.split('/').filter(Boolean).map((s) => s.replace(/\.(?:html?|aspx?|jsp)$/i, ''))
  if (segs.some((s) => PRODUCT_SEGMENT.test(s))) return false
  return segs.some((s) => CART_SEGMENT.test(s))
}

/** The cart / bag / checkout links in a message (see isCartLink). */
export function cartLinks(text: string | null | undefined): string[] {
  const out: string[] = []
  for (const m of String(text || '').matchAll(/https?:\/\/[^\s<>"'()]+/gi)) {
    const u = m[0].replace(/[.,;:!?]+$/, '')
    if (isCartLink(u) && !out.includes(u)) out.push(u)
  }
  return out
}

/** The distinct product links in a message, in order, at most LINK_LIST_MAX (http becomes https; our own site and cart pages are skipped). */
export function linkListUrls(text: string | null | undefined): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const m of String(text || '').matchAll(/https?:\/\/[^\s<>"'()]+/gi)) {
    let u: URL
    try { u = new URL(m[0].replace(/[.,;:!?]+$/, '')) } catch { continue }
    if (OWN_SITES.test(u.hostname)) continue
    if (isCartLink(u.toString())) continue
    if (u.protocol === 'http:') u.protocol = 'https:'
    u.hash = ''
    const key = `${u.hostname.replace(/^www\./, '')}${u.pathname.replace(/\/+$/, '')}${u.search}`.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(u.toString())
    if (out.length >= LINK_LIST_MAX) break
  }
  return out
}

export interface LinkListEntry {
  url: string
  title: string
  image?: string | null
  price?: number | null
  quantity: number
  /** the shopper's choice, keyed like the picker's: size, color, or the option's kind/name → the STORE's own value */
  variants: Record<string, string>
}

const str = (v: any, max: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null)

/** PURE. The "Agregar todo" list carried by the shopper's message, validated (anything malformed is dropped). */
export function linkListFromMetadata(meta: any): LinkListEntry[] {
  const raw = Array.isArray(meta?.link_list) ? meta.link_list.slice(0, LINK_LIST_MAX) : []
  const out: LinkListEntry[] = []
  for (const e of raw) {
    const url = str(e?.url, 2048)
    const title = str(e?.title, 200)
    if (!url || !/^https:\/\//i.test(url) || !title) continue
    const variants: Record<string, string> = {}
    for (const [k, v] of Object.entries(e?.variants && typeof e.variants === 'object' ? e.variants : {})) {
      const key = str(k, 40), val = str(v, 80)
      if (key && val) variants[key.toLowerCase()] = val
    }
    const q = Number(e?.quantity)
    out.push({
      url, title,
      image: str(e?.image, 2048),
      price: typeof e?.price === 'number' && Number.isFinite(e.price) && e.price > 0 ? e.price : null,
      quantity: Number.isInteger(q) && q >= 1 && q <= 20 ? q : 1,
      variants,
    })
  }
  return out
}

/** PURE. The list as box items (the shape show_shipment draws) and their store-option fixes (keyed by the item's url). */
export function linkListBox(list: LinkListEntry[]): { items: any[], storeOptions: any[] } {
  const items = list.map((e) => ({
    name: e.title, url: e.url, quantity: e.quantity,
    ...(e.image ? { image: e.image } : {}), ...(e.price != null ? { price: e.price } : {}),
    ...(e.variants.size ? { size: e.variants.size } : {}), ...(e.variants.color ? { color: e.variants.color } : {}),
  }))
  const storeOptions = list.map((e) => {
    const { size = null, color = null, ...rest } = e.variants
    return { key: e.url, size, color, options: rest }
  })
  return { items, storeOptions }
}

/** A message that is a link and little else (the link pasted on its own, or with "este" / "cotízame esto"): the card reads it in the
 * browser like a list (live 2026-10-17: a lone Walmart link read for 38 s on the server, past boxly.mx's ~30 s cut — the shopper got no
 * reply at all, twice). A link with a real question beside it (over 40 characters of other text) is left to the assistant. */
export function isLinkOnly(text: string | null | undefined): boolean {
  const t = String(text || '')
  if (linkListUrls(t).length !== 1) return false
  return t.replace(/https?:\/\/[^\s<>"'()]+/gi, ' ').replace(/\s+/g, ' ').trim().length <= 40
}

// HOW MANY THE SHOPPER SAID THEY WANT (live WSS 2026-10-18: "Necesito 6 paquetes" got a "¿qué categoría?" question, and the link pasted
// next went into the box ×1). A number they said beside a quantity word or verb, 2-20; never a size, a volume or a price.
const NUM_WORDS: Record<string, number> = { dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12, quince: 15, veinte: 20, two: 2, three: 3, four: 4, five: 5, six: 6, ten: 10, twelve: 12 }
const NUM = `(\\d{1,2}|${Object.keys(NUM_WORDS).join('|')})`
const UNIT = '(?:paquetes|packs|piezas?|pzas?|unidades|unids?|pares|cajas|bolsas|botes|botellas|frascos|latas|juegos|sets|iguales|de\\s+(?:este|esta|estos|estas|ese|esa|esos|esas|cada\\s+(?:uno|una)|ellos|ellas))'
const QTY_PATTERNS = [
  new RegExp(`\\b(?:cantidad|qty)\\s*:?\\s*${NUM}\\b`, 'i'),
  new RegExp(`(?:^|\\s)[x×]\\s?(\\d{1,2})\\b|\\b(\\d{1,2})\\s?[x×](?:\\s|$)`, 'i'),
  new RegExp(`\\b${NUM}\\s+${UNIT}\\b`, 'i'),
  new RegExp(`\\b(?:necesito|ocupo|quiero|dame|ponme|p[oó]nme|agrega(?:me)?|añade(?:me)?|serían|ser[ií]an|son|m[aá]ndame|compra(?:me)?|tr[aá]eme)\\s+(?:unos?\\s+|unas?\\s+)?${NUM}(?!\\s*(?:%|\\$|usd|d[oó]lares|oz|ml|cm|mm|kg|gb|tb|pulgadas|años|meses|talla|"|\\.\\d|/))(?:\\b|$)`, 'i'),
]

/** PURE. The quantity the shopper stated in this message (2-20), or null. The message's links are ignored. */
export function statedQuantity(text: string | null | undefined): number | null {
  const t = String(text || '').replace(/https?:\/\/[^\s<>"'()]+/gi, ' ').toLowerCase()
  for (const re of QTY_PATTERNS) {
    const m = t.match(re)
    if (!m) continue
    const raw = m.slice(1).find((g) => g != null)
    const n = raw == null ? NaN : /^\d+$/.test(raw) ? Number(raw) : (NUM_WORDS[raw] ?? NaN)
    if (Number.isInteger(n) && n >= 2 && n <= 20) return n
  }
  return null
}

/** PURE. A short message that only says how many ("Necesito 6 paquetes", "quiero 3"): it is about the product already in play. */
export function quantityOnly(text: string | null | undefined): number | null {
  const t = String(text || '')
  if (/https?:\/\//i.test(t) || t.trim().split(/\s+/).length > 8) return null
  return statedQuantity(t)
}

/** PURE. "Solo el que ya había agregado" / "nada más eso": the box stays as it is — no new product goes in (live Dick's 2026-10-18:
 * that line added a different jersey the shopper had only looked at). */
export function keepsBoxAsIs(text: string | null | undefined): boolean {
  const t = String(text || '').toLowerCase()
  if (/\b(?:s[oó]lo|solamente|nada\s+m[aá]s|[uú]nicamente)\b[^.?!]{0,50}?\b(?:ya\s+(?:lo\s+|la\s+|los\s+|las\s+|me\s+)?(?:hab[ií]a\s+|he\s+|hab[ií]amos\s+|hemos\s+)?(?:agregad|añadid|puest|elegid|escogid|apartad)|que\s+ya\s+(?:est|ten|llev|hab)|lo\s+que\s+(?:ya\s+)?(?:tengo|llevo))/i.test(t)) return true
  return /^\s*(?:entonces\s+|ok\s+|bueno\s+)?(?:s[oó]lo|nada\s+m[aá]s)\s+(?:eso|ese|esa|esos|esas)\s*[.!]?\s*$/i.test(t)
}

/** PURE. The quantity for a link pasted now: said in this message, or in one of the shopper's last few messages before it (live WSS
 * 2026-10-18: "Necesito 6 paquetes", then a product code, then the link). Stops at an earlier link or add — that was another product.
 * `userTexts` is the shopper's messages, newest first. */
export function recentStatedQuantity(userTexts: string[]): number | null {
  for (const [i, t] of (userTexts || []).slice(0, 4).entries()) {
    const n = statedQuantity(t)
    if (n) return n
    if (i > 0 && (/https?:\/\//i.test(t) || /agr[eé]g(?:alo|alos|ala|alas)\b|a mi caja/i.test(t))) return null
  }
  return null
}
