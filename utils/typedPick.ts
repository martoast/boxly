// A PICK TYPED IN THE CHAT, ON A PRODUCT'S PICKER CARD (Alex, 2026-09-29: "I can even just say it in a message instead
// of using the component, and the AI should still be smart"). Once the shopper has opened a product, its picker card
// (tool-product_picker) sits in the conversation with the store's own options. A message like "la negra en talla 9"
// counts as the pick ONLY when it names exactly one value of every real choice on exactly one card, and that
// combination is buyable by the picker's own rules (utils/pickerLogic.ts). Anything less — two cards, two values, a
// choice left out, a sold-out combination — is not a pick: the assistant asks, pointing at the card. Before any card
// exists nothing typed ever counts (the first search message never preselects — Alex, 2026-09-28). Pure; tested in
// typedPick.test.mjs.
import { sellerRefused, normalizeVariants, deriveAxes, isIndependent, isComplete, initialSelection } from './pickerLogic'

export const PICKER_PART = 'tool-product_picker'

export interface PickerCard { url: string, urls: string[], title: string | null, store: string | null, read: any }
export type TypedPick =
  | { ok: true, url: string, urls: string[], pick: Record<string, string> }
  | { ok: false, reason: 'no_card' | 'no_match' | 'ambiguous' | 'incomplete' | 'sold_out' | 'colorway' | 'marketplace', url?: string, urls?: string[], missing?: string[] }

/** The picker cards in a conversation: one per product url (its latest read), in the order they first appeared. */
export function pickerCards(messages: any[]): PickerCard[] {
  const byUrl = new Map<string, PickerCard>()
  for (const m of messages || []) {
    if (m?.role !== 'assistant' || !Array.isArray(m.parts)) continue
    for (const p of m.parts) {
      if (p?.type !== PICKER_PART || p.state !== 'output-available') continue
      const o = p.output || {}
      const url = typeof o.product?.url === 'string' ? o.product.url : ''
      if (!url || !o.read || typeof o.read !== 'object') continue
      const urls = [...new Set([url, o.read_url, o.read.product?.url].filter((u) => typeof u === 'string' && u))]
      byUrl.set(url, { url, urls, title: o.product.title || o.read.product?.title || null, store: o.product.store_name || null, read: o.read })
    }
  }
  return [...byUrl.values()]
}

/** The product photo a picker card read for this product url (null when no card has one). */
export function pickerCardPhoto(messages: any[], url: string): string | null {
  const bare = (u: any) => String(u || '').split('?')[0]
  const card = pickerCards(messages).find((c) => c.urls.some((u) => bare(u) === bare(url)))
  const p = card?.read?.product
  const img = [p?.image, Array.isArray(p?.images) ? p.images[0] : null].find((u) => typeof u === 'string' && /^https?:\/\//.test(u))
  return img || null
}

// Case, accents and punctuation never matter; a value is matched as whole words (tokens), never as a substring —
// "9" is not "9.5", "Black" inside "Black Watch" is not "Black".
const fold = (s: any) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
const tokens = (s: any) => fold(s).split(/[^a-z0-9.]+/).map((t) => t.replace(/^\.+|\.+$/g, '')).filter(Boolean).map((t) => (t === 'gray' ? 'grey' : t))
// Shoppers write colours in Spanish; stores name them in English. A translated word still has to be the value's WHOLE
// name ("negra" → "Black", never "Black Watch").
const COLOUR_ES: Record<string, string> = {
  negro: 'black', negra: 'black', negros: 'black', negras: 'black', blanco: 'white', blanca: 'white', blancos: 'white', blancas: 'white',
  rojo: 'red', roja: 'red', rojos: 'red', rojas: 'red', azul: 'blue', azules: 'blue', verde: 'green', verdes: 'green', gris: 'grey', grises: 'grey',
  rosa: 'pink', rosas: 'pink', rosado: 'pink', rosada: 'pink', morado: 'purple', morada: 'purple', amarillo: 'yellow', amarilla: 'yellow',
  cafe: 'brown', marron: 'brown', naranja: 'orange', beige: 'beige', dorado: 'gold', dorada: 'gold', plateado: 'silver', plateada: 'silver',
}
// The names a value answers to: its full label, and for "Standard (D)" / "S (4-6)" also each side of the parenthesis.
function aliases(value: string): string[][] {
  const out = [tokens(value)]
  const m = String(value).match(/^(.*?)\s*\(([^)]+)\)\s*$/)
  if (m) out.push(tokens(m[1]), tokens(m[2]))
  return out.filter((a) => a.length)
}
/** Where a value's name occurs in the text, as [start, end) token spans. */
function spans(text: string[], name: string[]): Array<[number, number]> {
  const out: Array<[number, number]> = []
  for (let i = 0; i + name.length <= text.length; i++) if (name.every((t, j) => text[i + j] === t)) out.push([i, i + name.length])
  return out
}
/** The values of one axis the text names; a value only seen inside another named value's words does not count. */
function namedValues(axis: { kind: string, values: string[] }, said: string[], saidEn: string[]): string[] {
  const hits = axis.values.map((v) => ({ v, at: aliases(v).flatMap((a) => [...spans(said, a), ...(axis.kind === 'color' ? spans(saidEn, a) : [])]) })).filter((h) => h.at.length)
  const inside = (a: [number, number], b: [number, number]) => b[0] <= a[0] && a[1] <= b[1] && b[1] - b[0] > a[1] - a[0]
  return hits.filter((h) => !h.at.every((s) => hits.some((o) => o !== h && o.at.some((b) => inside(s, b))))).map((h) => h.v)
}

/** The shopper's message against the open picker cards: a complete, buyable pick on exactly one card, or why not. */
export function resolveTypedPick(text: string, cards: PickerCard[]): TypedPick {
  if (!cards?.length) return { ok: false, reason: 'no_card' }
  const said = tokens(text)
  const saidEn = said.map((t) => COLOUR_ES[t] || t)
  const found: Array<{ card: PickerCard, axes: any[], chosen: Record<string, string[]>, missing: string[], mentioned: boolean, variants: any[], independent: boolean, colorway: boolean }> = []
  for (const card of cards) {
    const variants = normalizeVariants(card.read)
    const axes = deriveAxes(card.read, variants)
    const chosen: Record<string, string[]> = {}
    for (const a of axes) if (a.values.length > 1) { const v = namedValues(a, said, saidEn); if (v.length) chosen[a.name] = v }
    // A colour sold as its own page (a sibling colourway) is not on this read: naming one that is not on screen needs
    // the card's colour chip (it re-reads that page), so it is never taken as a pick of the colour on screen.
    const cws: any[] = Array.isArray(card.read?.colorways) ? card.read.colorways : []
    const onScreen = (c: any) => c?.current || card.urls.includes(c?.url)
    const colorway = cws.length > 1 && cws.some((c) => !onScreen(c) && namedValues({ kind: 'color', values: [String(c?.name || '')] }, said, saidEn).length)
    const missing = axes.filter((a) => a.values.length > 1 && !chosen[a.name]).map((a) => a.name)
    found.push({ card, axes, chosen, missing, mentioned: Object.keys(chosen).length > 0 || colorway, variants, independent: isIndependent(card.read, axes, variants), colorway })
  }
  const named = found.filter((f) => f.mentioned)
  if (!named.length) return { ok: false, reason: 'no_match' }
  if (named.length > 1) return { ok: false, reason: 'ambiguous' }
  const f = named[0]
  const where = { url: f.card.url, urls: f.card.urls }
  // A third-party seller is never added, typed or tapped (the card says so) — except on a marketplace store (Walmart, Amazon).
  if (sellerRefused(f.card.read?.product?.seller, f.card.read?.product?.url || f.card.url)) return { ok: false, reason: 'marketplace', ...where }
  if (f.colorway) return { ok: false, reason: 'colorway', ...where }
  if (Object.values(f.chosen).some((v) => v.length > 1)) return { ok: false, reason: 'ambiguous', ...where }
  if (f.missing.length) return { ok: false, reason: 'incomplete', ...where, missing: f.missing }
  const sel: Record<string, string> = { ...(initialSelection(f.axes) as Record<string, string>) }
  for (const [k, v] of Object.entries(f.chosen)) sel[k] = v[0]
  if (!isComplete({ axes: f.axes, independent: f.independent, sel, variants: f.variants })) return { ok: false, reason: 'sold_out', ...where }
  return { ok: true, ...where, pick: sel }
}

/**
 * For the MODEL: a picker card is not a tool call it made (the app appended it when the shopper tapped a product), so
 * it is replayed as one line of text naming the product and its options. A card still reading becomes a line too, so
 * a message never reaches the model empty.
 */
export function pickerCardsAsText(messages: any[], productId?: (p: any) => string | null): any[] {
  return (messages || []).map((m: any) => {
    if (!Array.isArray(m?.parts) || !m.parts.some((p: any) => p?.type === PICKER_PART)) return m
    return {
      ...m,
      parts: m.parts.map((p: any) => {
        if (p?.type !== PICKER_PART) return p
        const prod = p.output?.product || p.input?.product || {}
        const id = productId ? productId({ url: prod.url }) : null
        const name = `"${String(prod.title || 'producto').slice(0, 80)}"${prod.store_name ? ` de ${prod.store_name}` : ''}${id ? ` (id ${id})` : ''}`
        if (p.state !== 'output-available' || !p.output?.read) return { type: 'text', text: `[Tarjeta del producto ${name} abierta en el chat — leyendo sus opciones en la tienda.]` }
        const axes = deriveAxes(p.output.read).filter((a) => a.values.length > 1)
        const opts = axes.map((a) => `${a.name}: ${a.values.slice(0, 24).join(', ')}${a.values.length > 24 ? ', …' : ''}`).join('; ')
        return { type: 'text', text: `[Tarjeta del producto ${name} abierta en el chat con sus opciones de la tienda${opts ? ` — ${opts}` : ' (sin opciones que elegir)'}. El cliente elige ahí o escribe su elección; si la escribe, agrégalo con show_shipment y la caja la valida contra esta tarjeta.]` }
      }),
    }
  })
}
