// THE VARIANT PICKER'S RULES, pure (2026-09-28): which options a product has, which values a shopper can pick given
// what they already picked, and when a pick is complete. VariantPicker.vue renders them; the variant benchmark
// (~/mcp-servers/computer-use/catalog/variant_benchmark.mjs) imports this same file, so "can a shopper finish a pick
// for this product" is measured with the rules the shopper actually gets.

export interface PickerVariant { options: Record<string, string>, available?: boolean | null, sold_out_with?: Record<string, string> | null, price?: number | null, image?: string | null, color?: string | null, size?: string | null, low_stock?: any }
export interface PickerAxis { name: string, kind: string, values: string[], swatches?: Record<string, string>, chips?: Record<string, string> }
export type Selection = Record<string, string | null | undefined>

export function guessKind(name: string): string {
  const n = String(name).toLowerCase()
  if (/color|colour|shade|wash|finish/.test(n)) return 'color'
  if (/length|inseam|largo/.test(n)) return 'length'
  if (/width|ancho/.test(n)) return 'width'
  if (/oz|capacity|capacidad|ml|size.*oz/.test(n)) return 'capacity'
  if (/scent|fragrance|flavor|flavour|aroma/.test(n)) return 'scent'
  if (/pack|count|cantidad|qty/.test(n)) return 'pack'
  if (/size|talla|waist|cintura/.test(n)) return 'size'
  return 'other'
}

/** Every variant as { options: {axis: value} } (a read may give color/size fields instead). */
export function normalizeVariants(data: any): PickerVariant[] {
  return (data?.variants || []).map((v: any) => {
    const options: Record<string, string> = { ...(v.options && typeof v.options === 'object' ? v.options : {}) }
    if (!Object.keys(options).length) { if (v.color) options.Color = String(v.color); if (v.size) options.Size = String(v.size) }
    for (const k of Object.keys(options)) options[k] = String(options[k])
    return { ...v, options }
  })
}

/** The axes: the read's own list (page order) or derived from the variants' option keys; junk values dropped. */
export function deriveAxes(data: any, variants: PickerVariant[] = normalizeVariants(data)): PickerAxis[] {
  const declared = Array.isArray(data?.axes) ? data.axes.filter((a: any) => a && typeof a === 'object' && a.name) : []
  const names: string[] = declared.length ? declared.map((a: any) => a.name) : [...new Set(variants.flatMap((v) => Object.keys(v.options)))]
  return names.map((name) => {
    const d = declared.find((a: any) => a.name === name) || {}
    const seen: string[] = []; for (const v of variants) { const val = v.options[name]; if (val != null && !seen.includes(val)) seen.push(val) }
    const values = Array.isArray(d.values) && d.values.length ? d.values.map(String) : seen
    return { name, kind: d.kind || guessKind(name), values, ...(d.swatches ? { swatches: d.swatches } : {}), ...(d.chips ? { chips: d.chips } : {}) }
  })
    .map((a) => ({ ...a, values: a.values.filter((v) => /[\p{L}\p{N}]/u.test(v)) }))
    .filter((a) => a.values.length)
}

/** One row PER AXIS VALUE (SFCC: New Balance, Gap) rather than a colour×size matrix: each axis validates on its own. */
export function isIndependent(data: any, axes: PickerAxis[], variants: PickerVariant[]): boolean {
  return data?.axes_independent === true || data?.matrix === false
    || (axes.length > 1 && !variants.some((v) => Object.keys(v.options).length > 1))
}

/** A variant's value on an axis — a single-value axis a row does not name has that one value (a colourway's page). */
export function optOf(v: PickerVariant, a: PickerAxis): string | undefined {
  return v.options[a.name] ?? (a.values.length === 1 ? a.values[0] : undefined)
}

export function matches(v: PickerVariant, ax: PickerAxis, val: string, ctx: { axes: PickerAxis[], independent: boolean, sel: Selection }): boolean {
  if (optOf(v, ax) !== val) return false
  if (ctx.independent) return true
  return ctx.axes.every((a) => a.name === ax.name || !ctx.sel[a.name] || optOf(v, a) === ctx.sel[a.name])
}
/** SOLD OUT WITH ANOTHER VALUE (reader 2026-09-28): a per-option page read marks a size sold out only for the colour on
 * screen, so its row says available:null + sold_out_with {Color: X}. The combination row.options ∪ sold_out_with is
 * sold out; everything else about that value is unknown. True when the selection contains such a combination. */
export function blockedBy(variants: PickerVariant[], sel: Selection): boolean {
  return variants.some((v) => {
    if (!v.sold_out_with) return false
    const combo = { ...v.options, ...v.sold_out_with }
    return Object.entries(combo).every(([k, x]) => sel[k] === x)
  })
}
export function canPick(ax: PickerAxis, val: string, ctx: { axes: PickerAxis[], independent: boolean, sel: Selection, variants: PickerVariant[] }): boolean {
  if (blockedBy(ctx.variants, { ...ctx.sel, [ax.name]: val })) return false
  return ctx.variants.some((v) => v.available !== false && matches(v, ax, val, ctx))
}
/** The row the selection lands on (matrix: the one matching every axis; independent: the last axis's row). */
export function chosenVariant(ctx: { axes: PickerAxis[], independent: boolean, sel: Selection, variants: PickerVariant[] }): PickerVariant | null {
  const { axes, independent, sel, variants } = ctx
  if (!axes.length) return variants[0] || null
  if (independent) { const last = axes[axes.length - 1]; return sel[last.name] ? (variants.find((v) => optOf(v, last) === sel[last.name]) || null) : null }
  return variants.find((v) => axes.every((a) => sel[a.name] && optOf(v, a) === sel[a.name])) || null
}
export function isComplete(ctx: { axes: PickerAxis[], independent: boolean, sel: Selection, variants: PickerVariant[] }): boolean {
  const { axes, independent, sel, variants } = ctx
  if (blockedBy(variants, sel)) return false
  if (!axes.length) { const c = chosenVariant(ctx); return !!(c && c.available !== false) }
  if (independent) return axes.every((a) => sel[a.name] && (a.values.length === 1 || variants.some((v) => v.available !== false && optOf(v, a) === sel[a.name])))
  const c = chosenVariant(ctx)
  return !!(c && c.available !== false)
}
/** A tap on a chip: toggles it, and clears other multi-value picks it made impossible. Returns the new selection. */
export function applyPick(axisName: string, val: string, ctx: { axes: PickerAxis[], independent: boolean, sel: Selection, variants: PickerVariant[] }): Selection {
  const sel: Selection = { ...ctx.sel, [axisName]: ctx.sel[axisName] === val ? null : val }
  const next = { ...ctx, sel }
  for (const a of ctx.axes) if (a.name !== axisName && a.values.length > 1 && sel[a.name] && !canPick(a, sel[a.name] as string, next)) sel[a.name] = null
  return sel
}
/** The picker's starting selection: single-value axes filled in, nothing else (the shopper picks). */
export function initialSelection(axes: PickerAxis[]): Selection {
  const sel: Selection = {}
  for (const a of axes) if (a.values.length === 1) sel[a.name] = a.values[0]
  return sel
}

/**
 * PURE. Can a shopper complete a pick, and with which values? Tries, axis by axis in page order, the first value
 * still pickable — for the benchmark. `want` pins values ({Size: "9 (9)"}); returns the selection and whether it is
 * complete (the "Agregar al carrito" state).
 */
export function simulatePick(data: any, want: Record<string, string> = {}): { complete: boolean, sel: Selection, stuckOn: string | null } {
  const variants = normalizeVariants(data)
  const axes = deriveAxes(data, variants)
  const independent = isIndependent(data, axes, variants)
  let sel = initialSelection(axes)
  const ctx = () => ({ axes, independent, sel, variants })
  for (const a of axes) {
    if (a.values.length === 1) continue
    const wanted = Object.entries(want).find(([k]) => k.toLowerCase() === a.name.toLowerCase() || k.toLowerCase() === a.kind)?.[1]
    const val = wanted != null ? a.values.find((v) => v.toLowerCase() === String(wanted).toLowerCase()) : a.values.find((v) => canPick(a, v, ctx()))
    if (val == null || !canPick(a, val, ctx())) return { complete: false, sel, stuckOn: a.name }
    sel = applyPick(a.name, val, ctx())
  }
  return { complete: isComplete(ctx()), sel, stuckOn: isComplete(ctx()) ? null : (axes.find((a) => !sel[a.name])?.name || 'combination') }
}
