import { assignTracking, type Tracking } from '../../utils/labelTracking'

/**
 * One shipping-label photo → the package(s) on it. The phone already decoded the
 * barcodes (exact digits); the vision model reads the name and the tracking number
 * as printed, which only serves to pick the right barcode (see utils/labelTracking).
 *
 * Measured 2026-10-07 on real warehouse photos: ~2.5 s per photo with reasoning off,
 * 1600 px JPEG; names right 32/33, tracking (from barcodes) 33/33.
 */

const MODEL = process.env.OPENAI_LABEL_MODEL || 'gpt-6-luna'

const SCHEMA = {
  type: 'object', additionalProperties: false, required: ['packages'],
  properties: {
    packages: {
      type: 'array', description: 'One entry per shipping label visible (usually 1).',
      items: {
        type: 'object', additionalProperties: false,
        required: ['recipient_name', 'suite', 'ship_from', 'tracking_number_as_printed', 'carrier', 'store_order_numbers', 'confidence'],
        properties: {
          recipient_name: { type: ['string', 'null'], description: 'Name in the SHIP TO / DELIVER TO block, exactly as printed (keep prefixes like BOXLY or FGM).' },
          suite: { type: ['string', 'null'], description: 'Suite / STE / UNIT / APT / # number in the ship-to address.' },
          ship_from: { type: ['string', 'null'], description: 'Sender company as printed in the ship-from block.' },
          tracking_number_as_printed: { type: ['string', 'null'], description: 'The carrier tracking number printed on the label (TRACKING #). For UPS SurePost give the UPS 1Z number.' },
          carrier: { type: ['string', 'null'] },
          store_order_numbers: { type: 'array', items: { type: 'string' } },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
        },
      },
    },
  },
}

const PROMPT = 'Read the shipping label(s) in this photo. Copy names character by character. The recipient is always a PERSON: '
  + 'on UPS SurePost / carrier hand-off labels the top SHIP TO is a post office — take the person from the USPS DELIVER TO block. '
  + 'Never return a carrier or facility as the name.'

type ModelLabel = {
  recipient_name: string | null; suite: string | null; ship_from: string | null
  tracking_number_as_printed: string | null; carrier: string | null
  store_order_numbers: string[]; confidence: 'high' | 'medium' | 'low'
}

export type LabelPackage = {
  tracking_number: string | null; carrier: string | null; other_tracking: string[]
  recipient_name: string | null; suite: string | null; ship_from: string | null
  store_order_numbers: string[]; barcodes: string[]
  model_tracking_read: string | null; confidence: string | null; needs_check: boolean
}

async function askModel(imageDataUrl: string, apiKey: string): Promise<ModelLabel[]> {
  const body = JSON.stringify({
    model: MODEL, max_completion_tokens: 2000, reasoning_effort: 'none',
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
  const picks = assignTracking(list.map((l) => l?.tracking_number_as_printed ?? null), codes)
  return list.map((l, k) => {
    const { pick, others } = picks[k]
    const name = l?.recipient_name || pick?.name || null
    return {
      tracking_number: pick?.tracking ?? null,
      carrier: pick?.carrier ?? l?.carrier ?? null,
      other_tracking: others.map((c) => `${c.carrier}:${c.tracking}`),
      recipient_name: name,
      suite: l?.suite ?? null,
      ship_from: l?.ship_from ?? null,
      store_order_numbers: l?.store_order_numbers ?? [],
      barcodes: rawBarcodes,
      model_tracking_read: l?.tracking_number_as_printed ?? null,
      confidence: l?.confidence ?? null,
      // never a guessed number: no barcode match means a person checks the photo
      needs_check: !pick || !name || l?.confidence === 'low',
    }
  })
}
