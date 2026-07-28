/**
 * CORS preflight for the shopper panel. The extension's service worker doesn't
 * trigger one (host permissions exempt it), but a content script or any browser
 * caller would — answer it here so the panel endpoint is reachable from both.
 */
export default defineEventHandler((event) => {
  setResponseHeaders(event, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
  })
  setResponseStatus(event, 204)
  return null
})
