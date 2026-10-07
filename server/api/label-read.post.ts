import { createHash } from 'node:crypto'
import { trackingsFrom } from '../../utils/labelTracking'
import { readLabelPhoto } from '../utils/labelRead'

/**
 * Label scans: one label photo (+ the barcodes the phone decoded from it) → the package(s) on it.
 * The page then saves photo + packages through the API (/admin|/employee/label-scans).
 *
 * Body: { image: dataURL (JPEG, ~1600 px), barcodes: string[] }
 * Returns: { packages: LabelPackage[] }
 *
 * Admin / employee only — this spends OpenAI credit. Checked by forwarding the
 * caller's session cookie to the API's /user (cached 5 min per session).
 */
const roleCache = new Map<string, { ok: boolean; at: number }>()

async function staffSession(cookie: string | undefined, origin: string): Promise<boolean> {
  if (!cookie) return false
  const key = createHash('sha256').update(cookie).digest('hex')
  const hit = roleCache.get(key)
  if (hit && Date.now() - hit.at < 5 * 60_000) return hit.ok
  let ok = false
  try {
    const user: any = await $fetch(`${useRuntimeConfig().public.apiUrl}/user`, {
      // Origin is required: Sanctum only treats a request as stateful (session cookie) when it has one.
      headers: { cookie, origin, accept: 'application/json' },
      timeout: 8000,
    })
    ok = user?.role === 'admin' || user?.role === 'employee'
  } catch { ok = false }
  roleCache.set(key, { ok, at: Date.now() })
  return ok
}

export default defineEventHandler(async (event) => {
  if (!(await staffSession(getRequestHeader(event, 'cookie'), getRequestURL(event).origin))) {
    setResponseStatus(event, 403)
    return { error: 'forbidden' }
  }
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    setResponseStatus(event, 503)
    return { error: 'not_configured' }
  }
  const body = await readBody(event)
  const image = body?.image
  if (!image || typeof image !== 'string' || !/^data:image\//.test(image)) {
    setResponseStatus(event, 400)
    return { error: 'no_image' }
  }
  const raw: string[] = Array.isArray(body?.barcodes) ? body.barcodes.filter((b: unknown) => typeof b === 'string').slice(0, 30) : []
  try {
    return { packages: await readLabelPhoto(image, trackingsFrom(raw), raw, apiKey) }
  } catch (e: any) {
    console.error('[label-read] error:', e?.message || e)
    setResponseStatus(event, 502)
    return { error: 'read_failed', message: String(e?.message || e) }
  }
})
