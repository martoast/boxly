// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: false },
  // Hybrid rendering — keep the app SPA-first but server-render the
  // public marketing/storefront pages so social share previews and
  // SEO indexing work natively. Private dashboards under /app/** stay
  // SPA-only (no SEO need, less risk of hydration mismatches).
  ssr: false,
  routeRules: {
    '/':        { ssr: true },
    '/shop':    { ssr: true },
    '/shop/**': { ssr: true },
  },
  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      title: 'Boxly - Compra en cualquier parte del mundo y recibe en México',
      meta: [
        // Essential SEO tags
        {
          name: 'viewport',
          content: 'width=device-width,initial-scale=1,viewport-fit=cover,maximum-scale=1'
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
        { 
          property: 'og:image:width', 
          content: '1200'
        },
        { 
          property: 'og:image:height', 
          content: '630'
        },
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