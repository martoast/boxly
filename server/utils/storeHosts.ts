// A web result (Bing/Google Shopping) that points at a store we carry is that store's product (2026-09-25: a Bing
// row for gymshark.com had no store id, so the Lab box silently never reached the store cart). The catalog lists
// each carried store's web domain (GET /catalog/facets → stores[].host, read from its own product links); this
// tags such rows with the store id. Pure; tested in storeHosts.test.mjs.

export type StoreHosts = Map<string, { id: string, name: string | null }>

const hostOf = (url: any): string | null => {
  try { return new URL(String(url)).hostname.toLowerCase().replace(/^www\./, '') } catch { return null }
}

/** Build the host → store map from the catalog's facets payload. */
export function storeHostsFromFacets(facets: any): StoreHosts {
  const map: StoreHosts = new Map()
  for (const s of facets?.stores || []) if (s?.host && s?.store_id) map.set(String(s.host).toLowerCase(), { id: String(s.store_id), name: s.store_name ?? null })
  return map
}

/** Rows with no store id whose link is on a carried store's domain get that store's id. Returns the same array when nothing changes. */
export function tagCarriedStores(rows: any[], hosts: StoreHosts): any[] {
  if (!Array.isArray(rows) || !hosts.size) return rows
  let changed = false
  const out = rows.map((p) => {
    if (!p || typeof p !== 'object' || (typeof p.store_id === 'string' && p.store_id)) return p
    const hit = hosts.get(hostOf(p.url || p.product_url) || '')
    if (!hit) return p
    changed = true
    return { ...p, store_id: hit.id }
  })
  return changed ? out : rows
}
