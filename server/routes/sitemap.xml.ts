/**
 * sitemap.xml — there wasn't one. boxly.mx/sitemap.xml returned 404 and
 * robots.txt pointed at nothing, so Google had no map of the site and was
 * discovering pages purely by following links.
 *
 * That shows up in the data. Search Console (12 months) has /precios at ZERO
 * impressions despite being linked from both the navbar and the footer and
 * carrying a perfectly good title and description — while /sitemap,
 * /terms-of-service and /privacy-policy rank in the top three. Crawl budget
 * was landing on the wrong pages.
 *
 * Deliberately hand-listed rather than derived from the pages/ directory:
 * most routes under pages/ are auth-gated (/app/**, /in-person/**, /producto)
 * or shouldn't be indexed (/login, /register, /reset-password), and a
 * generated list would quietly include them the moment someone adds a page.
 * An explicit list is a decision; a glob is an accident waiting to happen.
 *
 * NOTE: keep this in sync when a public marketing page is added. The three
 * noindex'd utility pages (/sitemap, /terms-of-service, /privacy-policy) are
 * intentionally absent — listing a noindex page contradicts the tag.
 */

const SITE = 'https://boxly.mx'

// priority is relative within our own site, not an absolute ranking signal.
// changefreq is a hint; the marketing pages genuinely do change rarely.
const PAGES: Array<{ path: string; priority: string; changefreq: string }> = [
  { path: '/',                        priority: '1.0', changefreq: 'weekly' },
  { path: '/precios',                 priority: '0.9', changefreq: 'weekly' },
  { path: '/shipping-calculator',     priority: '0.9', changefreq: 'monthly' },
  { path: '/how-it-works',            priority: '0.8', changefreq: 'monthly' },
  { path: '/how-it-works/casillero',  priority: '0.8', changefreq: 'monthly' },
  { path: '/how-it-works/online',     priority: '0.8', changefreq: 'monthly' },
  { path: '/how-it-works/in-person',  priority: '0.8', changefreq: 'monthly' },
  { path: '/faq',                     priority: '0.7', changefreq: 'monthly' },
  { path: '/help-center',             priority: '0.6', changefreq: 'monthly' },
  { path: '/expats',                  priority: '0.6', changefreq: 'monthly' },
  { path: '/affiliate-program',       priority: '0.6', changefreq: 'monthly' },
]

export default defineEventHandler((event) => {
  const lastmod = new Date().toISOString().slice(0, 10)

  const urls = PAGES.map(
    (p) => `  <url>
    <loc>${SITE}${p.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
  ).join('\n')

  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  // Crawlers re-fetch this often; a day of cache is plenty and keeps it off
  // the origin on every bot hit.
  setHeader(event, 'Cache-Control', 'public, max-age=86400')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`
})
