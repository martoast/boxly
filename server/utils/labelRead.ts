import { assignTracking, trackingFrom, type Tracking } from '../../utils/labelTracking'

/**
 * One shipping-label photo → the package(s) on it. The vision model reads the
 * recipient name and the tracking number AS PRINTED (Alex, 2026-10-07: "all we need
 * is the client and the tracking number printed below the barcode"). A barcode the
 * phone happened to decode is still preferred when it matches (exact digits), but a
 * label no longer needs one: 19 of 25 flagged scans on 2026-10-07 had a printed
 * tracking number the model read fine and were flagged only for lacking a barcode.
 * The model also judges the PHOTO (issue: tilted / blurry / far / glare / cut_off)
 * so the camera can ask for a retake on the spot.
 *
 * Benchmarked 2026-10-07 on the 11 real warehouse photos (×3–6 runs each):
 * - ask for ONLY name + printed tracking: names 22/22 vs 18/22 with the old 7-field
 *   schema, and faster (fewer output tokens: 43 vs 90);
 * - 1600 px is the floor: 1280 px → 17/22 names, 1024 px → 10/22, detail "low" → 0/22;
 *   detail "original" = "high" at 1600 px (same 1,622 tokens);
 * - service_tier "fast" (2× price, ~$0.0004/photo): p50 1.35 s / p90 1.5–1.9 s vs
 *   1.65 s / 2.2–2.4 s standard, 66/66 correct;
 * - gpt-6-sol and gpt-5.6-luna were no better (both read a sender as the name once).
 */

const MODEL = process.env.OPENAI_LABEL_MODEL || 'gpt-6-luna'
const TIER = process.env.OPENAI_LABEL_TIER || 'fast' // 'default' turns fast mode off

const SCHEMA = {
  type: 'object', additionalProperties: false, required: ['packages', 'issue'],
  properties: {
    packages: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['name', 'tracking', 'confidence'],
        properties: {
          name: { type: ['string', 'null'] },
          tracking: { type: ['string', 'null'] },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
        },
      },
    },
    // The photo itself: is the label text cleanly readable? Drives the retake prompt.
    issue: { type: 'string', enum: ['ok', 'tilted', 'blurry', 'far', 'glare', 'cut_off', 'no_label'] },
  },
}

const PROMPT = 'Read the shipping label(s) in this photo. Copy names character by character. The recipient is always a PERSON: '
  + 'on UPS SurePost / carrier hand-off labels the top SHIP TO is a post office — take the person from the USPS DELIVER TO block. '
  + 'Never return a carrier or facility as the name. For each label: name = recipient name exactly as printed '
  + '(keep prefixes like BOXLY or FGM); tracking = the carrier tracking number as printed (for UPS SurePost the UPS 1Z number). '
  + 'Then judge the photo: issue = "ok" if the name and tracking text are sharp and easy to read; otherwise the main problem: '
  + '"tilted" (label seen at an angle, text skewed), "blurry" (out of focus / motion), "far" (label too small to read), '
  + '"glare" (reflection over the text), "cut_off" (label not fully in the photo), "no_label".'

type ModelLabel = { name: string | null; tracking: string | null; confidence: 'high' | 'medium' | 'low' }
export type PhotoIssue = 'ok' | 'tilted' | 'blurry' | 'far' | 'glare' | 'cut_off' | 'no_label'

export type LabelPackage = {
  tracking_number: string | null; carrier: string | null; other_tracking: string[]
  recipient_name: string | null; barcodes: string[]
  model_tracking_read: string | null; confidence: string | null; needs_check: boolean
  issue: PhotoIssue
}

async function askModel(imageDataUrl: string, apiKey: string): Promise<{ labels: ModelLabel[]; issue: PhotoIssue }> {
  const body = JSON.stringify({
    model: MODEL, max_completion_tokens: 400, reasoning_effort: 'none',
    ...(TIER !== 'default' ? { service_tier: TIER } : {}),
    response_format: { type: 'json_schema', json_schema: { name: 'labels', strict: true, schema: SCHEMA } },
    messages: [{ role: 'user', content: [
      { type: 'text', text: PROMPT },
      { type: 'image_url', image_url: { url: imageDataUrl, detail: 'high' } },
    ] }],
  })
  let last: unknown
  for (let attempt = 0; attempt < 2; attempt++) { // a stuck request is retried after 12 s, never waited out
    try {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST', headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
        body, signal: AbortSignal.timeout(12000),
      })
      const j: any = await r.json()
      if (!r.ok) throw new Error(j?.error?.message || `OpenAI HTTP ${r.status}`)
      const parsed = JSON.parse(j.choices[0].message.content)
      return { labels: parsed.packages || [], issue: parsed.issue || 'ok' }
    } catch (e) { last = e }
  }
  throw last
}

/** The model's printed tracking read as a tracking number. Spaces are print
 * formatting ("1Z 750 Y1V 03 4208 1692"). A known carrier pattern wins; an
 * unknown format (e.g. "BTPA037702ZR5B2") is kept, carrier unknown, only when
 * the model was confident and it looks like a tracking number. */
export function printedTracking(raw: string, confidence: string | null | undefined): Tracking | null {
  const s = String(raw || '').replace(/[\s-]+/g, '').toUpperCase()
  if (!s) return null
  const known = trackingFrom(s)
  if (known) return known
  // Shaped like a known carrier but failing its pattern = a dropped/misread
  // character (a 17-char "1Z…" on 2026-10-07): reject, don't guess.
  if (/^1Z|^9[2-5]\d|^1LS|^TBA/.test(s) || /^\d+$/.test(s)) return null
  if (confidence === 'high' && /^[A-Z0-9]{10,34}$/.test(s) && /\d{4}/.test(s)) return { tracking: s, carrier: '' }
  return null
}

export async function readLabelPhoto(imageDataUrl: string, codes: Tracking[], rawBarcodes: string[], apiKey: string): Promise<LabelPackage[]> {
  const { labels, issue } = await askModel(imageDataUrl, apiKey)
  const list = labels.length ? labels : [null]
  const picks = assignTracking(list.map((l) => l?.tracking ?? null), codes)
  return list.map((l, k) => {
    const { pick, others } = picks[k]
    const name = l?.name || pick?.name || null
    // The printed number, validated by the same carrier patterns the barcodes use
    // (so "9400 0000 0000…" style garbage or a random string never becomes a tracking).
    const printed = !pick && l?.tracking ? printedTracking(l.tracking, l.confidence) : null
    const track = pick || printed
    return {
      tracking_number: track?.tracking ?? null,
      carrier: track?.carrier || null,
      other_tracking: others.map((c) => `${c.carrier}:${c.tracking}`),
      recipient_name: name,
      barcodes: rawBarcodes,
      model_tracking_read: l?.tracking ?? null,
      confidence: l?.confidence ?? null,
      // a person checks only what the read itself says is missing or unsure — and a
      // number read off a blurry/glary print (a blurry LaserShip number read two
      // ways on 2026-10-07; a barcode match is exact, so it is exempt)
      needs_check: !track || !name || l?.confidence === 'low'
        || (!pick && (issue === 'blurry' || issue === 'glare')),
      issue,
    }
  })
}
