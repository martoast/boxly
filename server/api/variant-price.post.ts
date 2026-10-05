// PRICE ON PICK (2026-10-05): one option's own price from its store page, for an option the product read left unpriced
// (Ulta prices only the selected size). The catalog answers {sku, price, list_price} or {sku, price: null, why}.
const CATALOG_BASE = 'https://catalog.fullstacklabs.org'

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => null)
  const url = typeof body?.url === 'string' ? body.url.trim() : ''
  const sku = typeof body?.sku === 'string' || typeof body?.sku === 'number' ? String(body.sku).trim() : ''
  if (!/^https?:\/\//i.test(url) || !/^[A-Za-z0-9_-]{1,40}$/.test(sku)) return { sku: sku || null, price: null, why: 'need_url_and_sku' }
  try {
    return await $fetch(`${CATALOG_BASE}/catalog/variant-price`, { method: 'POST', body: { url, sku }, timeout: 20000 })
  } catch (e: any) {
    console.warn('[variant-price] unreachable:', e?.message || e)
    return { sku, price: null, why: 'unreachable' }
  }
})
