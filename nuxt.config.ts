// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: false },
  // SSR is on by default so public marketing/storefront pages get
  // proper server-rendered HTML — required for social share previews
  // (WhatsApp / Facebook / Twitter / iMessage all read the initial
  // HTML, never the JS-injected meta) and clean SEO. /app/** used to
  // opt out here, but that forced every authed dashboard load through
  // a blank shell + client-side auth round-trip before first paint.
  // SSR is now on there too — plugins/$fetch.ts forwards the request's
  // session cookie server-side so the auth middleware resolves the
  // user during the server render instead.
  ssr: true,
  // Backs the Nuxt instance with AsyncLocalStorage on the server. Without
  // it, any composable (useState, useCookie, useRequestHeaders...) called
  // after an `await` throws "a composable that requires access to the Nuxt
  // instance was called outside of a plugin..." — the client silently gets
  // away with it via a global-instance fallback, the server has none. That
  // never bit us while /app/** was ssr:false; turning SSR on there means
  // the auth middleware -> $retriveUser -> $customFetch chain now runs on
  // the server, and every hop of it reads a composable post-await.
  experimental: { asyncContext: true },
  routeRules: {
    // /login and /register used to be listed here as { ssr: false }. That was
    // never a decision about these pages — 9f9f568 flipped the whole app from
    // ssr:false to ssr:true and carved out everything that was already SPA, and
    // /app/** has since been brought back in. The cost was severe on the exact
    // page a first-time visitor lands on: the server sent an empty shell (0
    // characters of visible text) plus ~154 KB of inlined CSS, and nothing could
    // paint until ~109 KB of JS downloaded and executed — about 5.3s of 3G
    // before the form appeared.
    //
    // Both pages are SSR-safe: the only browser APIs they touch
    // (document.querySelector, window.location for the OAuth hand-off) are
    // inside onMounted or click handlers, never at setup scope. Their `loggedin`
    // middleware now resolves properly on the server too, since plugins/$fetch
    // forwards Origin so Sanctum treats the render as stateful — without that
    // it would 401 and bounce logged-in users to a login page they don't need.
    // ONE search surface: /app/search. Everything else redirects to it.
    //
    // /search used to be a second copy of the same <ShoppingAssistant /> with a
    // different layout, and the comment that used to live here claimed it was
    // public and guest-friendly — it was not, the page carried middleware:['auth']
    // and bounced guests to /login. Two authed pages rendering one component is a
    // duplicate, not a funnel, so it is gone.
    //
    // The redirects stay for bookmarks, old share links and anything still
    // pointing at the previous paths; every internal link now targets
    // /app/search directly, so nothing depends on a redirect preserving ?q=.
    '/assistant':     { redirect: '/app/search' },
    '/app/assistant': { redirect: '/app/search' },
    '/buscar':        { redirect: '/app/search' },
    '/buscar/**':     { redirect: '/app/search' },
    '/search':        { redirect: '/app/search' },
    '/search/**':     { redirect: '/app/search' },
    // The product page is auth-gated (token-expensive) — client-rendered so the
    // auth middleware resolves the user reliably.
    '/producto':          { ssr: false },
  },
  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      // Warms the connection to the API host ahead of the client-side
      // calls that follow hydration (conversations, starter-prompts,
      // chat token) — those still hit the API separately from SSR.
      link: [
        { rel: 'preconnect', href: 'https://api.boxly.mx', crossorigin: 'use-credentials' }
      ],
      // <html lang="es"> — primary audience is Mexican Spanish, and
      // setting it satisfies the WCAG 3.1.1 a11y rule. Frontend has
      // a language toggle that swaps copy strings client-side; the
      // root html lang stays es as the canonical default for
      // screen-readers, search engines, and translation tools.
      htmlAttrs: { lang: 'es' },
      /**
       * Skimlinks — affiliate monetisation for OUTBOUND links on boxly.mx.
       *
       * It rewrites links to merchants we already send people to (DICK'S,
       * Foot Locker, Walmart…) so a purchase they were going to make anyway
       * pays a commission. It changes nothing about what the shopper sees or
       * pays.
       *
       * Deliberately NOT in the extension. The panel needs Skimlinks' PRODUCT
       * API — real retailer prices, which is a different product entirely — and
       * the extension's Web Store disclosure says we do not collect browsing
       * history. A link-rewriting script inside it would make that false.
       * This runs on our own site only; the snippet is domain-locked to
       * boxly.mx regardless.
       *
       * `defer` because nothing on the page waits for it, and a third-party
       * script has no business blocking our first paint.
       */
      script: [
        {
          src: 'https://s.skimresources.com/js/307089X1795364.skimlinks.js',
          type: 'text/javascript',
          defer: true,
        },
      ],
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
    '@pinia/nuxt'
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
    }
  }
 })