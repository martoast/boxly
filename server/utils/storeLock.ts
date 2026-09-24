// Is the whole store closed right now? Shopify stores lock their site before a drop (every page redirects to
// /password: "The site will open at 12:00 PM PST for the September 24th Launch!", YoungLA 2026-09-24), and some
// stores park visitors in a virtual waiting room (queue-it). The Boxly agent cannot add anything then, so the chat
// says so — quoting the store's own words — while the live browser shows the same page.
// lockFromPage is pure (tested in storeLock.test.mjs); checkStoreLock does one bounded request.

export interface StoreLock { kind: 'password' | 'queue', message: string | null }

/** The store's own "opens at …" line from its lock page, or null. */
export function openingLine(html: string): string | null {
  const text = String(html || '')
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&amp;/g, '&').replace(/&#39;|&rsquo;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ')
  const lines = text.split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean)
  const hit = lines.find((l) => l.length <= 200 && /\b(will open|opens? (at|on|soon)|re-?open|back (at|on|soon)|launch(es)? (at|on))\b|\babr(e|imos|irá)\b/i.test(l))
  return hit || null
}

/** From one response of the product URL (redirects not followed): a lock, or null. */
export function lockFromPage(status: number, location: string | null, productUrl: string): StoreLock | null {
  if (status < 300 || status >= 400 || !location) return null
  let to: URL
  try { to = new URL(location, productUrl) } catch { return null }
  if (/(^|\.)queue-it\.net$/i.test(to.hostname)) return { kind: 'queue', message: null }
  if (/^\/password\/?$/i.test(to.pathname)) return { kind: 'password', message: null }
  return null
}

/** One GET of the product page (no redirects followed), then its lock page for the opening line. Never throws. */
export async function checkStoreLock(productUrl: string, timeoutMs = 4000): Promise<StoreLock | null> {
  const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36', Accept: 'text/html' }
  try {
    const res = await fetch(productUrl, { redirect: 'manual', headers, signal: AbortSignal.timeout(timeoutMs) })
    const lock = lockFromPage(res.status, res.headers.get('location'), productUrl)
    if (!lock || lock.kind !== 'password') return lock
    try {
      const page = await fetch(new URL(res.headers.get('location') as string, productUrl), { headers, signal: AbortSignal.timeout(timeoutMs) })
      lock.message = openingLine(await page.text())
    } catch { /* the lock alone is enough */ }
    return lock
  } catch { return null }
}
