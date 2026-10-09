// STOCK ON PICK (Alex 2026-10-09): a picked colour's own size stock, for stores whose stock depends on the colour on screen (American
// Eagle, New Balance, Dick's). The catalog presses that colour on the store's page and reads its sizes: {colour, axis, sizes:[{value,
// available}]} or {colour, error}. Netlify cuts functions at ~30 s: wait 22 s, then answer `reading` — the picker asks again and the
// catalog (which keeps reading and remembers the answer) replies at once.
const CATALOG_BASE = 'https://catalog.fullstacklabs.org'

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => null)
  const url = typeof body?.url === 'string' ? body.url.trim() : ''
  const colour = typeof body?.colour === 'string' ? body.colour.trim().slice(0, 80) : ''
  if (!/^https?:\/\//i.test(url) || !colour) return { colour: colour || null, error: 'need_url_and_colour' }
  try {
    return await $fetch(`${CATALOG_BASE}/catalog/colour-stock`, { method: 'POST', body: { url, colour }, timeout: 22000 })
  } catch (e: any) {
    if (/timeout|timed out|aborted/i.test(`${e?.message || ''} ${e?.cause?.name || ''}`)) return { colour, reading: true }
    console.warn('[colour-stock] unreachable:', e?.message || e)
    return { colour, error: 'unreachable' }
  }
})
