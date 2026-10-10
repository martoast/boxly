// A LIST OF PRODUCT LINKS → ONE BOX (Alex 2026-10-10: "users that already have the links to the products they want … just want to
// pass over the list and have our AI add them all to cart and create the purchase request for all of them together"). The shopper
// pastes the links; one card reads every page and asks only for the choices a link does not already make; "Agregar todo" sends the
// whole list in one message (metadata.link_list) and the box takes it as it is. Pure helpers, shared by the card and the assistant.

export const LINK_LIST_MAX = 20

const OWN_SITES = /(?:^|\.)(?:boxly\.mx|localhost)$/i

/** The distinct product links in a message, in order, at most LINK_LIST_MAX (http becomes https; our own site is skipped). */
export function linkListUrls(text: string | null | undefined): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const m of String(text || '').matchAll(/https?:\/\/[^\s<>"'()]+/gi)) {
    let u: URL
    try { u = new URL(m[0].replace(/[.,;:!?]+$/, '')) } catch { continue }
    if (OWN_SITES.test(u.hostname)) continue
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
