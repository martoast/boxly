/**
 * One step of the extension funnel, forwarded to the API.
 *
 * Same reason as the box endpoints: the extension holds a host permission for
 * boxly.mx and not api.boxly.mx, so routing through here means no second host in
 * the manifest and nothing extra to justify to the Chrome Web Store.
 *
 * This deliberately carries no URL, no store and no product — see the migration
 * `create_shopper_extension_events_table` for why that is a commitment rather
 * than an oversight.
 *
 * Analytics must never cost the shopper anything, so every failure here is a
 * 204: the extension is fire-and-forget and must not retry.
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
    setResponseStatus(event, 204)
    return null
  }

  const body = await readBody(event)
  try {
    await fetch(`${API_BASE}/me/shopper-extension/event`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: token,
      },
      body: JSON.stringify({
        kind: String(body?.kind || ''),
        localized: !!body?.localized,
        gap_percent:
          typeof body?.gap_percent === 'number' && body.gap_percent >= 0 && body.gap_percent <= 100
            ? Math.round(body.gap_percent)
            : null,
      }),
      signal: AbortSignal.timeout(8000),
    })
  } catch {
    // Swallowed on purpose. A dropped analytics event is a rounding error; a
    // shopper seeing an error because of one is a bug.
  }

  setResponseStatus(event, 204)
  return null
})
