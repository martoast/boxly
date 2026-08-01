import { withBoxState } from '../../utils/boxState'

/**
 * Take an item back out of the box.
 *
 * The id rides in a query param rather than the path because the extension
 * talks to one `/api/shopper/box` route per verb; the API scopes the delete to
 * the caller's own open requests, so a foreign id is a 404 and never a deletion.
 */
const API_BASE = (process.env.API_URL || 'https://api.boxly.mx').replace(/\/$/, '')

export default defineEventHandler(async (event) => {
  setResponseHeaders(event, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
  })
  const token = String(getHeader(event, 'authorization') || '')
  if (!/^Bearer\s+\S+/i.test(token)) {
    setResponseStatus(event, 401)
    return { error: 'no_account' }
  }
  const id = Number(getQuery(event)?.id)
  if (!Number.isInteger(id) || id <= 0) {
    setResponseStatus(event, 400)
    return { error: 'bad_id' }
  }
  try {
    const res = await fetch(`${API_BASE}/me/box/items/${id}`, {
      method: 'DELETE',
      headers: { Accept: 'application/json', Authorization: token },
      signal: AbortSignal.timeout(12000),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      setResponseStatus(event, res.status === 401 ? 401 : 502)
      return { error: res.status === 401 ? 'no_account' : 'upstream' }
    }
    // The panel draws the box from these numbers; computing them here keeps a
    // single source of truth (see server/utils/boxState.ts).
    const box = await withBoxState(data?.data ?? data, () =>
      fetch(`${API_BASE}/products`, { signal: AbortSignal.timeout(8000) })
        .then((r) => r.json())
        .then((d: any) => d?.data ?? d),
    )
    return { box }
  } catch {
    setResponseStatus(event, 504)
    return { error: 'timeout' }
  }
})
