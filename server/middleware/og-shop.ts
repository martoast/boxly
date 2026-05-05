/**
 * Open Graph / social-share rendering for /shop/<slug> URLs.
 *
 * The Nuxt app runs as a SPA (`ssr: false`), which means social crawlers
 * (facebookexternalhit, WhatsApp, Twitterbot, iMessage Link Preview,
 * Slackbot, LinkedInBot, etc.) only see the static index.html shell when
 * they fetch a product URL — they never execute the JS that calls
 * `useHead({...})` inside the page component. Result: every shared link
 * shows the generic Boxly logo + tagline.
 *
 * This middleware intercepts requests to /shop/<slug>:
 *   • If the User-Agent matches a known crawler, fetch the product from
 *     the API and return a minimal HTML response with product-specific
 *     OG / Twitter meta tags (title, description, hero image, price).
 *   • Otherwise pass through and let the SPA handle the request normally.
 */
export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  const m = url.pathname.match(/^\/shop\/([^/?#]+)\/?$/)
  if (!m) return // not a product page, let the SPA serve

  const ua = (getHeader(event, 'user-agent') || '').toLowerCase()
  const isCrawler = /facebookexternalhit|facebot|twitterbot|whatsapp|slackbot|linkedinbot|telegrambot|discordbot|skypeuripreview|google-inspectiontool|googlebot|bingbot|applebot|pinterest|redditbot|embedly|quora link preview|outbrain|w3c_validator|developers\.google\.com\/\+\/web\/snippet|nuzzel|vkshare|tumblr|bitlybot/i.test(ua)
  if (!isCrawler) return // real user — pass through to the SPA

  const slug = m[1]
  const apiUrl = (useRuntimeConfig().public.apiUrl || '').replace(/\/+$/, '')
  if (!apiUrl) return

  let product: any = null
  try {
    const res: any = await $fetch(`${apiUrl}/store/products/${slug}`, {
      timeout: 4000,
    })
    product = res?.data?.product ?? null
  } catch {
    return // upstream failed — let the SPA handle the 404 / error UX
  }
  if (!product) return

  const fullUrl = `https://boxly.mx/shop/${product.slug}`
  const colorSuffix = product.color ? ` - ${product.color}` : ''
  const title = `${product.name}${colorSuffix} — Tienda Boxly`
  const description = (product.description || `${product.name} en la Tienda Boxly. Cómpralo en EUA y te lo enviamos a México.`)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200)
  const image = product.first_image_url || 'https://boxly.mx/logo.jpeg'
  const priceMxn = (Number(product.price_cents || 0) / 100).toFixed(2)
  const brand = product.store?.name || 'Boxly'

  setHeader(event, 'Content-Type', 'text/html; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=300') // 5min — crawlers re-fetch on share

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(fullUrl)}">

<meta property="og:type" content="product">
<meta property="og:site_name" content="Boxly">
<meta property="og:url" content="${esc(fullUrl)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:image:secure_url" content="${esc(image)}">
<meta property="og:image:alt" content="${esc(product.name)}">
<meta property="og:locale" content="es_MX">
<meta property="product:brand" content="${esc(brand)}">
<meta property="product:price:amount" content="${esc(priceMxn)}">
<meta property="product:price:currency" content="MXN">
<meta property="product:availability" content="in stock">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:url" content="${esc(fullUrl)}">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(image)}">
<meta name="twitter:image:alt" content="${esc(product.name)}">
</head>
<body>
<h1>${esc(title)}</h1>
<p>${esc(description)}</p>
<p>${esc(brand)} — $${esc(priceMxn)} MXN</p>
<img src="${esc(image)}" alt="${esc(product.name)}">
</body>
</html>`
})

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
