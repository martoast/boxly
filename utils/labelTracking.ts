/**
 * Shipping-label barcodes → tracking numbers, and which one belongs to which label.
 *
 * Why barcodes: on real warehouse photos the vision model misread 5 of 9 printed
 * tracking numbers (dropped digits, V read as U); the barcodes decoded exactly
 * every time. So the barcode gives the digits, and the model only says which
 * barcode is the tracking number (by what it saw printed) and reads the name.
 *
 * Used by the label-scan page (the phone decodes) and /api/label-read (the pick).
 */

export type Tracking = { tracking: string; carrier: string; name?: string | null }

const GS = '\u001d'

/** One decoded barcode → its tracking number, or null for routing codes, SSCC carton labels and store junk. */
export function trackingFrom(raw: string): Tracking | null {
  const s = String(raw || '').replace(/<GS>/g, GS).trim()
  if (!s) return null
  if (s.includes('|')) { // LaserShip/OnTrac 2D code: tracking|…|recipient name|…
    const parts = s.split('|')
    const t = trackingFrom(parts[0])
    if (!t) return null
    const name = parts.find((p, i) => i > 3 && /^[A-Za-z][A-Za-z .'-]+ [A-Za-z]/.test(p) && !/\b(AVE|ST|BLVD|RD|DR|SAN YSIDRO|CA)\b/i.test(p))
    return { ...t, name: name || null }
  }
  // USPS IMpb: "420" + ZIP (5 or 9 digits), with or without a GS separator, + the tracking number
  const impb = /^420(?:\d{5}|\d{9})\u001d(9\d{19,25})$/.exec(s)
    || /^420\d{5}(9[2-5]\d{20,24})$/.exec(s)
    || /^420\d{9}(9[2-5]\d{20,24})$/.exec(s)
  if (impb) return { tracking: impb[1], carrier: 'usps' }
  if (/^420\d{5}(\d{4})?$/.test(s)) return null // ZIP routing barcode
  if (/^00\d{18}$/.test(s)) return null // SSCC carton label
  if (/^1Z[0-9A-Z]{16}$/i.test(s)) return { tracking: s.toUpperCase(), carrier: 'ups' }
  if (/^9[2-5]\d{20,24}$/.test(s)) return { tracking: s, carrier: 'usps' }
  if (/^96\d{32}$/.test(s)) return { tracking: s.slice(-12), carrier: 'fedex' } // FedEx Ground barcode ends with the 12-digit number
  if (/^\d{12}$|^\d{15}$/.test(s)) return { tracking: s, carrier: 'fedex' }
  if (/^1LS[0-9A-Z]{9,}$/i.test(s)) return { tracking: s.toUpperCase(), carrier: 'lasership' }
  if (/^BTS_[0-9A-Z]+$/i.test(s)) return { tracking: s, carrier: 'better_trucks' }
  if (/^TBA\d{9,}$/i.test(s)) return { tracking: s.toUpperCase(), carrier: 'amazon' }
  if (/^TF\d{5}(\d{13})$/.test(s)) return { tracking: s.slice(-13), carrier: 'tforce' } // the label prints only the last 13 digits
  if (/^[A-Z]\d{14}$/.test(s)) return { tracking: s, carrier: 'ontrac' }
  return null
}

/** Every distinct tracking number among a photo's decoded barcodes (a name from a 2D code is kept). */
export function trackingsFrom(raws: string[]): Tracking[] {
  const found = new Map<string, Tracking>()
  for (const raw of raws) {
    const t = trackingFrom(raw)
    if (!t) continue
    const had = found.get(t.tracking)
    found.set(t.tracking, { ...had, ...t, name: t.name || had?.name || null })
  }
  return [...found.values()]
}

/** Edit distance over the longer string's length: 0 = same, 1 = nothing alike. Spaces and case ignored. */
export function readDistance(printed: string | null | undefined, tracking: string): number {
  const a = String(printed || '').replace(/\s/g, '').toUpperCase()
  const b = tracking.toUpperCase()
  if (!a) return 1
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
  }
  return d[a.length][b.length] / Math.max(a.length, b.length)
}

/**
 * Give each label read by the model its exact tracking number from the barcodes.
 * - closest barcode to what the model saw printed wins (under half the characters different);
 * - a lone label takes UPS over USPS (a SurePost label carries both; the model may read either), else the first;
 * - each barcode goes to one label only: with two boxes in one photo, the second never inherits the first's number.
 * Returns, per label (same order), the picked tracking (or null) and the other numbers left on its label.
 */
export function assignTracking(printed: (string | null)[], codes: Tracking[]): { pick: Tracking | null; others: Tracking[] }[] {
  const used = new Set<string>()
  const best = (p: string | null) => Math.min(1, ...codes.map((c) => readDistance(p, c.tracking)))
  const order = printed.map((_, k) => k).sort((a, b) => best(printed[a]) - best(printed[b]))
  const out: { pick: Tracking | null; others: Tracking[] }[] = printed.map(() => ({ pick: null, others: [] }))
  for (const k of order) {
    const ranked = codes.filter((c) => !used.has(c.tracking))
      .map((c) => ({ c, d: readDistance(printed[k], c.tracking) }))
      .sort((x, y) => x.d - y.d)
    let pick: Tracking | null = null
    if (ranked.length && ranked[0].d < 0.5) pick = ranked[0].c
    else if (ranked.length && printed.length === 1) pick = (ranked.find((r) => r.c.carrier === 'ups') || ranked[0]).c
    // UPS SurePost labels print both numbers; the UPS one is the shipment's own number
    if (pick?.carrier === 'usps' && printed.length === 1) pick = ranked.find((r) => r.c.carrier === 'ups')?.c || pick
    if (pick) used.add(pick.tracking)
    out[k].pick = pick
  }
  if (printed.length === 1) out[0].others = codes.filter((c) => c.tracking !== out[0].pick?.tracking)
  return out
}
