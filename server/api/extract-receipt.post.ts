import { generateObject } from 'ai'
import { z } from 'zod'
import { auxModel, providerOptions, hasModelKey } from '../utils/aiProvider'

/**
 * Receipt / order-confirmation → structured line items, for the "Registrar compra"
 * (casillero) pipeline. The customer uploads a photo or screenshot of a purchase
 * they ALREADY made; vision turns it into an editable order preview so they only
 * tweak + confirm instead of typing everything.
 *
 * Body: { image: dataURL }  — the dataURL may be an image (photo/screenshot) OR a PDF
 *                             (a receipt/invoice PDF from the store).
 * Returns: { items: [{ name, quantity, price }], store, currency }
 */
const schema = z.object({
  store: z.string().describe('The store/retailer the purchase was made at, or "" if unclear.'),
  currency: z.string().describe('ISO currency of the prices, e.g. "USD". "" if unclear.'),
  items: z.array(z.object({
    name: z.string().describe('Product name as printed on the receipt.'),
    quantity: z.number().int().min(1).describe('Quantity purchased (default 1).'),
    price: z.number().describe('Unit price in the receipt currency; 0 if not legible.'),
  })).describe('Every purchased product line. Exclude tax/shipping/subtotal/total rows.'),
})

export default defineEventHandler(async (event) => {
  if (!hasModelKey()) {
    setResponseStatus(event, 503)
    return { error: 'not_configured' }
  }
  const body = await readBody(event)
  const image = body?.image
  if (!image || typeof image !== 'string') {
    setResponseStatus(event, 400)
    return { error: 'no_image' }
  }

  // A PDF receipt must go to the model as a `file` part, not an `image` part.
  const isPdf = /^data:application\/pdf/i.test(image)
  const filePart = isPdf
    ? { type: 'file' as const, data: image, mediaType: 'application/pdf' }
    : { type: 'image' as const, image }

  try {
    const { object } = await generateObject({
      model: auxModel(),
      schema,
      providerOptions: providerOptions(),
      system:
        'You read a US store RECEIPT or ORDER CONFIRMATION and extract the purchased product line items. Return ONLY real products the customer bought — never the tax, shipping, discount, subtotal or total rows. Use the product name as printed. If a unit price is not clearly legible, use 0. Quantity defaults to 1.',
      messages: [{
        role: 'user',
        content: [
          filePart,
          { type: 'text', text: 'Extract the purchased items from this receipt/confirmation.' },
        ],
      }],
      abortSignal: AbortSignal.timeout(30000),
    })
    // Guard: drop empty names, cap the list.
    const items = (object?.items || [])
      .filter((it) => it && String(it.name || '').trim())
      .slice(0, 40)
      .map((it) => ({ name: String(it.name).trim(), quantity: Math.max(1, Number(it.quantity) || 1), price: Math.max(0, Number(it.price) || 0) }))
    return { items, store: object?.store || '', currency: object?.currency || '' }
  } catch (e: any) {
    console.error('[extract-receipt] error:', e?.message || e)
    setResponseStatus(event, 500)
    return { error: 'extraction_failed', items: [] }
  }
})
