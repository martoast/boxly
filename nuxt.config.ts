// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: false },
  // SSR is on by default so public marketing/storefront pages get
  // proper server-rendered HTML — required for social share previews
  // (WhatsApp / Facebook / Twitter / iMessage all read the initial
  // HTML, never the JS-injected meta) and clean SEO. Private
  // dashboards under /app/** opt out via routeRules below — they're
  // JS-heavy auth-gated screens with no SEO need, no upside from SSR.
  ssr: true,
  routeRules: {
    '/app/**':   { ssr: false },
    '/login':    { ssr: false },
    '/register': { ssr: false },
    // Legacy assistant entry points → the single clean search entry.
    '/assistant':     { redirect: '/buscar' },
    '/app/assistant': { redirect: '/buscar' },
  },
  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      // <html lang="es"> — primary audience is Mexican Spanish, and
      // setting it satisfies the WCAG 3.1.1 a11y rule. Frontend has
      // a language toggle that swaps copy strings client-side; the
      // root html lang stays es as the canonical default for
      // screen-readers, search engines, and translation tools.
      htmlAttrs: { lang: 'es' },
      title: 'Boxly - Compra en cualquier parte del mundo y recibe en México',
      meta: [
        // Essential SEO tags
        {
          name: 'viewport',
          // Dropped maximum-scale=1 — that disables pinch-zoom and is
          // an accessibility regression for low-vision users. Keep
          // viewport-fit=cover for iPhone notch handling.
          content: 'width=device-width, initial-scale=1, viewport-fit=cover'
        },
        { 
          name: 'description', 
          content: 'Compra en cualquier parte del mundo y recibe en México. Te damos un domicilio en USA, consolidamos tus paquetes y enviamos a todo México al mejor precio.'
        },
        // Facebook domain verification
        {
          name: 'facebook-domain-verification',
          content: 'kmve28gubfhfg1vgfz3xpxxwqyde9e'
        },
        // Open Graph / Facebook
        { 
          property: 'og:type', 
          content: 'website'
        },
        { 
          property: 'og:url', 
          content: 'https://boxly.mx/'
        },
        { 
          property: 'og:title', 
          content: 'Boxly - Compra en cualquier tienda del mundo y recíbelo en México'
        },
        { 
          property: 'og:description', 
          content: 'Compra en cualquier tienda del mundo y recíbelo en México. Te damos un domicilio en USA, consolidamos tus paquetes y enviamos a todo México al mejor precio.'
        },
        {
          property: 'og:image',
          content: 'https://boxly.mx/logo.jpeg'
        },
        // Intentionally NOT setting og:image:width/height globally —
        // page-level useHead calls (e.g. /shop/<slug>) override og:image
        // with photos of all aspect ratios, and asserting fixed
        // dimensions globally was producing wrong values for those
        // pages. Platforms auto-detect dimensions from the image itself.
        // Twitter
        { 
          name: 'twitter:card', 
          content: 'summary_large_image'
        },
        { 
          name: 'twitter:title', 
          content: 'Boxly - Compra en cualquier tienda del mundo y recíbelo en México'
        },
        { 
          name: 'twitter:description', 
          content: 'Compra en cualquier tienda del mundo y recíbelo en México. Te damos un domicilio en USA, consolidamos tus paquetes y enviamos a todo México al mejor precio.'
        },
        { 
          name: 'twitter:image', 
          content: 'https://boxly.mx/logo.jpeg'
        }
      ]
    }
  },
  modules: [
    '@nuxtjs/tailwindcss', 
    '@pinia/nuxt',
    'nuxt-meta-pixel'
  ],
  vue: {  
    compilerOptions: {
      isCustomElement: (tag) => ['mapbox-search-box'].includes(tag),
    },
  },
  runtimeConfig: {
    // NOTE: do NOT add OPENAI_API_KEY (or any other secret) here.
    // Anything assigned to runtimeConfig from process.env in this file is
    // evaluated at BUILD time and baked into the server bundle as a
    // string literal — Netlify's secrets scanner then catches it inside
    // .netlify/functions-internal/server/chunks/nitro/nitro.mjs and the
    // build fails. Read secrets directly from process.env inside the
    // server route instead (see server/api/voice/session.post.ts).
    public: {
      apiUrl: process.env.API_URL,
      cookieDomain: process.env.COOKIE_DOMAIN,
      MAPBOX_API_TOKEN: process.env.MAPBOX_API_TOKEN,
      gtagId: process.env.GTAG_ID,
      // Meta Pixel configuration
      metapixel: {
        default: {
          id: process.env.META_PIXEL_ID || '1259587282078463',
          pageView: '**' // Track all pages by default
        }
      }
    }
  }
 })