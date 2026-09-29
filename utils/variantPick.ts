// WHO PICKS THE SIZE AND COLOUR: the shopper, on the product's own chips (Alex, 2026-09-28: "let the user do that —
// they see all the available options and pick them themselves, so it feels like a real shopping experience").
// A size or colour typed in the chat never counts and is never pre-selected. What counts: the picker's choice, which
// rides on the user message as metadata.pick ({size, color} or {<axis name>: value}), or the choice this chat already
// made for the product (a later box update must not reopen the picker). Pure; tested in variantPick.test.mjs.

export interface Axis { name: string, kind?: string, values: string[] }
const norm = (v: any) => String(v ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '')
export const axisKind = (a: any): 'size' | 'color' | null =>
  a?.kind === 'size' || /size|talla/i.test(String(a?.name || '')) ? 'size' : a?.kind === 'color' || /colou?r/i.test(String(a?.name || '')) ? 'color' : null

/** The store's value per axis the shopper chose ({axis name: store value}), and the multi-value axes still to pick. */
export function pickedOptions(axes: Axis[], pick: Record<string, any> | null, prior: Record<string, any> | null = null) {
  const source = pick && typeof pick === 'object' ? pick : prior && typeof prior === 'object' ? prior : null
  const chosen: Record<string, string> = {}
  for (const a of axes || []) {
    const k = axisKind(a)
    // The picker keys each choice by its axis kind ("size", "color", "width", …) or its name.
    const want = source ? (source[a.name] ?? (a.kind ? source[a.kind] : undefined) ?? (k ? source[k] : undefined) ?? source[String(a.name).toLowerCase()]) : undefined
    const v = want != null ? (a.values || []).find((x) => norm(x) === norm(want)) : undefined
    if (v != null) chosen[a.name] = String(v)
  }
  const missing = (axes || []).filter((a) => (a?.values?.length || 0) > 1 && chosen[a.name] == null)
  return { chosen, missing }
}
