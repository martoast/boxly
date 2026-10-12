// A STORE'S SHARE LINK IS ITS PRODUCT PAGE (live 2026-10-12: a shopper pasted the eBay app's "https://ebay.io/m/lG5ATC" links for two
// records; the assistant called them "not a store we can buy from" and sent him to Amazon). A short link of a known store is followed
// to the page it stands for (its redirect, a few hops at most) before anything reads the message.

const SHORT_HOSTS = /^(?:ebay\.io|ebay\.us|a\.co|amzn\.to|amzn\.com|amzn\.eu)$/i
const URL_RE = /https?:\/\/[^\s<>"'()]+/gi
const cache = new Map<string, string | null>()

/** PURE. The known-store short links in a text, in order, without duplicates. */
export function shortLinksIn(text: string | null | undefined): string[] {
  const out: string[] = []
  for (const m of String(text || '').matchAll(URL_RE)) {
    const raw = m[0].replace(/[.,;:!?]+$/, '')
    let host = ''
    try { host = new URL(raw).hostname.replace(/^www\./, '') } catch { continue }
    if (SHORT_HOSTS.test(host) && !out.includes(raw)) out.push(raw)
  }
  return out
}

/** The page a short link stands for (redirects followed by hand, up to 4 hops, 4 s in all), or null. Remembered per link. */
export async function expandShortLink(url: string, fetchImpl: typeof fetch = fetch): Promise<string | null> {
  if (cache.has(url)) return cache.get(url) ?? null
  let at = url
  const until = Date.now() + 4000
  try {
    for (let hop = 0; hop < 4 && Date.now() < until; hop++) {
      const r = await fetchImpl(at, { method: 'GET', redirect: 'manual', signal: AbortSignal.timeout(Math.max(500, until - Date.now())) })
      const loc = r.headers.get('location')
      if (r.status >= 300 && r.status < 400 && loc) { at = new URL(loc, at).toString(); continue }
      break
    }
  } catch { /* unreachable: keep what we have */ }
  const out = at !== url ? at : null
  cache.set(url, out)
  return out
}

/** The text with each known-store short link replaced by the page it stands for (a link that does not resolve stays). */
export async function expandShortLinks(text: string, fetchImpl: typeof fetch = fetch): Promise<string> {
  const links = shortLinksIn(text)
  if (!links.length) return text
  const full = await Promise.all(links.map((u) => expandShortLink(u, fetchImpl)))
  let out = text
  links.forEach((u, i) => { if (full[i]) out = out.split(u).join(full[i] as string) })
  return out
}
