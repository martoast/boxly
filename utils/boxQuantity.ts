// ANOTHER UNIT IS ASKED FOR, NEVER ASSUMED (Jonathan 2026-11-27: after "quiero agregar algo más" he typed "Asic s19 pro" — a
// product name, most likely to look at other S19 Pro listings — and the assistant raised the Antminer already in his box to 2;
// he was invoiced for two). An item already in the box may only come back with a higher quantity when the shopper's message
// asks for more units.
const MORE_UNITS = /\b(?:otr[oa]s?|uno m[aá]s|una m[aá]s|dos|tres|cuatro|cinco|seis|diez|doble|par de|m[aá]s unidades|cantidad|another|one more|more units|two|three|pair)\b|(?<![a-z0-9])\d{1,2}(?![a-z0-9])|\bx\s?\d/i

const keysOf = (it: any): string[] => [it?.saved_id, it?.url && String(it.url).split('?')[0].toLowerCase(), it?.name && String(it.name).trim().toLowerCase()]
  .filter(Boolean).map(String)

/** The items already in the box whose quantity the new list raises while the shopper's message asks for no more units. */
export function unaskedExtraUnits(before: any[], drawn: any[], lastUserText: string): any[] {
  if (MORE_UNITS.test(String(lastUserText || ''))) return []
  const had = new Map<string, number>()
  for (const it of Array.isArray(before) ? before : []) for (const k of keysOf(it)) had.set(k, Math.max(had.get(k) || 0, Number(it?.quantity) || 1))
  return (Array.isArray(drawn) ? drawn : []).filter((it: any) => {
    const prev = Math.max(0, ...keysOf(it).map((k) => had.get(k) || 0))
    return prev > 0 && (Number(it?.quantity) || 1) > prev
  })
}
