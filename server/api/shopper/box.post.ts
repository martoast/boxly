/**
 * Put a product in the shopper's box, from the extension.
 *
 * A thin proxy to the Laravel API, which owns the rules (one open Order, one
 * purchase request per store, same item = quantity). It exists because the
 * extension holds a host permission for boxly.mx and not for api.boxly.mx —
 * routing through here means no second host in the manifest, and therefore no
 * second thing to justify to the Chrome Web Store.
 *
 * The token comes from the extension, minted by boxly.mx during the account
 * handshake. We never mint or store one here.
 */
const API_BASE = (process.env.API_URL || 'https://api.boxly.mx').replace(/\/$/, '')

export default defineEventHandler(async (event) => {
  setResponseHeaders(event, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  })

  const token = String(getHeader(event, 'authorization') || '')
  if (!/^Bearer\s+\S+/i.test(token)) {
    // Not an error the panel should hide: without an account there is no box,
    // and the shopper needs to be told to connect rather than watching a button
    // do nothing.
    setResponseStatus(event, 401)
    return { error: 'no_account' }
  }

  const body = await readBody(event)
  const item = {
    product_name: String(body?.title || '').slice(0, 255),
    product_url: String(body?.url || '').slice(0, 2000),
    store: String(body?.store || '').slice(0, 120),
    price: typeof body?.price === 'number' && body.price > 0 ? body.price : null,
    product_image_url: body?.image ? String(body.image).slice(0, 2000) : null,
    quantity: 1,
    assisted: body?.assisted !== false,
  }

  if (!item.product_name || !item.product_url || !item.store) {
    setResponseStatus(event, 400)
    return { error: 'missing_product' }
  }

  try {
    const res = await fetch(`${API_BASE}/me/box/items`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: token,
      },
      body: JSON.stringify(item),
      signal: AbortSignal.timeout(15000),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      // `upstream` tells the shopper nothing and tells us less. The one time
      // this fired for real, the actual cause (a NOT NULL order_number) was
      // only visible by curling Laravel directly — the proxy had thrown the
      // message away. Keep the response opaque, keep the log specific.
      console.error('[shopper] box add failed', res.status, data?.message || data?.error || '')
      setResponseStatus(event, res.status === 401 ? 401 : 502)
      return { error: res.status === 401 ? 'no_account' : 'upstream' }
    }
    return { box: data?.data ?? data }
  } catch {
    setResponseStatus(event, 504)
    return { error: 'timeout' }
  }
})
