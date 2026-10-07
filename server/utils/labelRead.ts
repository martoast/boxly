import { assignTracking, type Tracking } from '../../utils/labelTracking'

/**
 * One shipping-label photo → the package(s) on it. The phone already decoded the
 * barcodes (exact digits); the vision model reads the name and the tracking number
 * as printed, which only serves to pick the right barcode (see utils/labelTracking).
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
  type: 'object', additionalProperties: false, required: ['packages'],
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
  },
}

const PROMPT = 'Read the shipping label(s) in this photo. Copy names character by character. The recipient is always a PERSON: '
  + 'on UPS SurePost / carrier hand-off labels the top SHIP TO is a post office — take the person from the USPS DELIVER TO block. '
  + 'Never return a carrier or facility as the name. For each label: name = recipient name exactly as printed '
  + '(keep prefixes like BOXLY or FGM); tracking = the carrier tracking number as printed (for UPS SurePost the UPS 1Z number).'

type ModelLabel = { name: string | null; tracking: string | null; confidence: 'high' | 'medium' | 'low' }

export type LabelPackage = {
  tracking_number: string | null; carrier: string | null; other_tracking: string[]
  recipient_name: string | null; barcodes: string[]
  model_tracking_read: string | null; confidence: string | null; needs_check: boolean
}

async function askModel(imageDataUrl: string, apiKey: string): Promise<ModelLabel[]> {
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
      return JSON.parse(j.choices[0].message.content).packages || []
    } catch (e) { last = e }
  }
  throw last
}

export async function readLabelPhoto(imageDataUrl: string, codes: Tracking[], rawBarcodes: string[], apiKey: string): Promise<LabelPackage[]> {
  const labels = await askModel(imageDataUrl, apiKey)
  const list = labels.length ? labels : [null]
  const picks = assignTracking(list.map((l) => l?.tracking ?? null), codes)
  return list.map((l, k) => {
    const { pick, others } = picks[k]
    const name = l?.name || pick?.name || null
    return {
      tracking_number: pick?.tracking ?? null,
      carrier: pick?.carrier ?? null,
      other_tracking: others.map((c) => `${c.carrier}:${c.tracking}`),
      recipient_name: name,
      barcodes: rawBarcodes,
      model_tracking_read: l?.tracking ?? null,
      confidence: l?.confidence ?? null,
      // never a guessed number: no barcode match means a person checks the photo
      needs_check: !pick || !name || l?.confidence === 'low',
    }
  })
}
