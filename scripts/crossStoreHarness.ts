function normalizeHost(host: string): string {
  const value = String(host || '').trim().toLowerCase().replace(/^www\./, '')
  if (!value || !/^[a-z0-9.-]+$/.test(value)) throw new Error('expected host required')
  return value
}

export function hrefMatchesHost(rawHref: string, expectedHost: string): boolean {
  const raw = String(rawHref || '').trim()
  const href = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  try {
    const url = new URL(href)
    if (!/^https?:$/.test(url.protocol) || url.username || url.password) return false
    return url.hostname.toLowerCase().replace(/^www\./, '') === normalizeHost(expectedHost)
  } catch { return false }
}

export function storeLinks(text: string, host: string): string[] {
  return String(text || '').split('\n').filter((line) => {
    if (!/\blink\b/i.test(line)) return false
    const rawHref = line.split(/\s->\s/)[1]?.split(/\s\[/)[0]?.trim() || ''
    return hrefMatchesHost(rawHref, host)
  }).map((line) => line.trim())
}

export function shouldRetryProbe(result: { composer_readback_verified?: boolean }, attempts: number): boolean {
  // Missing composer evidence means setup/login failed; retrying would hide it.
  return Object.prototype.hasOwnProperty.call(result || {}, 'composer_readback_verified') && result.composer_readback_verified !== true && attempts < 1
}
