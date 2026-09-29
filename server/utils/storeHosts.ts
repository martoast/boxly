// A product link on a store the live engine can open is that store's product (2026-09-25: a web row for gymshark.com
// had no store id, so the box silently never reached the store cart). Since the live store gallery replaced the
// catalog search (2026-09-28) the store list is the ENGINE's (GET /live-shopping/stores → id, name, url): this tags a
// row or a pasted link on one of those stores' sites with the engine's store id, so the box puts it in that store's
// real cart. Pure; tested in storeHosts.test.mjs.

export type StoreHosts = Map<string, { id: string, name: string | null }>

const hostOf = (url: any): string | null => {
  try { return new URL(String(url)).hostname.toLowerCase().replace(/^www\./, '') } catch { return null }
}

/** Build the host → store map from the engine's store list (stores without a url are skipped). */
export function storeHostsFromLiveStores(stores: Array<{ id?: unknown, name?: unknown, url?: unknown }> | null | undefined): StoreHosts {
  const map: StoreHosts = new Map()
  for (const s of stores || []) {
    const host = hostOf(s?.url)
    if (host && typeof s?.id === 'string' && s.id) map.set(host, { id: s.id, name: typeof s.name === 'string' ? s.name : null })
  }
  return map
}

/** Rows with no store id whose link is on a live store's domain get that store's id. Returns the same array when nothing changes. */
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
