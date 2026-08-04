import { createHash } from 'node:crypto'

/**
 * eBay Marketplace Account Deletion endpoint.
 *
 * Every production eBay application must expose one of these. Without it the
 * app is marked **Non Compliant** and the Buy APIs stay restricted — which is
 * what is actually blocking us, not the approval queue.
 *
 * Two jobs, one URL:
 *
 *   GET  — eBay sends `?challenge_code=…` to prove we own this endpoint. We
 *          answer with sha256(challengeCode + verificationToken + endpointUrl),
 *          hashed in EXACTLY that order. Any other order returns a valid-looking
 *          hash that eBay rejects, which is the classic way to lose an afternoon
 *          here.
 *
 *   POST — an eBay user deleted their account. We acknowledge, and there is
 *          nothing to erase: Boxly queries the Browse API with an APPLICATION
 *          token and stores no eBay user data at all — no user ids, no orders,
 *          no personal data. Our used listings are public item summaries, cached
 *          briefly and keyed by product, never by person. Acknowledging honestly
 *          is the whole obligation.
 *
 * Config:
 *   EBAY_VERIFICATION_TOKEN   32–80 chars, [A-Za-z0-9_-] only. We choose it, and
 *                             it must match what is entered in eBay's console
 *                             character for character.
 *   EBAY_DELETION_ENDPOINT    the exact public URL eBay is configured with.
 *                             Hashed as given, so a trailing slash or http vs
 *                             https mismatch fails the challenge.
 */
const DEFAULT_ENDPOINT = 'https://boxly.mx/api/ebay/account-deletion'

export default defineEventHandler(async (event) => {
  const token = process.env.EBAY_VERIFICATION_TOKEN || ''
  const endpoint = process.env.EBAY_DELETION_ENDPOINT || DEFAULT_ENDPOINT

  if (event.method === 'GET') {
    const challenge = String(getQuery(event).challenge_code || '')
    if (!challenge) {
      setResponseStatus(event, 400)
      return { error: 'missing challenge_code' }
    }
    if (!token) {
      // Loud on purpose. A silent 500 here reads to eBay as a broken endpoint,
      // and to us as a mystery — the cause is always the same missing env var.
      console.error('[ebay] EBAY_VERIFICATION_TOKEN is not set — challenge cannot be answered')
      setResponseStatus(event, 500)
      return { error: 'not configured' }
    }

    // Order matters: challengeCode, then token, then endpoint.
    const hash = createHash('sha256')
    hash.update(challenge)
    hash.update(token)
    hash.update(endpoint)

    setResponseStatus(event, 200)
    setResponseHeader(event, 'content-type', 'application/json')
    return { challengeResponse: hash.digest('hex') }
  }

  if (event.method === 'POST') {
    const body = await readBody(event).catch(() => null)
    // Log the fact, never the payload: it carries an eBay user id, and writing
    // it to our logs would be collecting exactly the data this notification
    // exists to have deleted.
    console.info('[ebay] account deletion notification received', {
      topic: body?.metadata?.topic ?? null,
      at: body?.notification?.eventDate ?? null,
    })

    // 200 with no body. eBay retries anything else, and we have nothing to erase
    // — see the note above.
    setResponseStatus(event, 200)
    return null
  }

  setResponseStatus(event, 405)
  return { error: 'method not allowed' }
})
