// Prefetch the data + hero image needed by /shop. Called from the
// marketing-site navbar (LandingNavbar) on first hover/focus of any
// /shop link, so the moment the user actually clicks, everything's
// already in Nuxt's payload cache.
//
// Why this works: each useAsyncData call below uses the same stable
// key as the corresponding component on /shop (HeroBanner,
// BrandShowcase, FeaturedProducts, useShopMenuData). Nuxt's data
// cache is keyed by name — when /shop's components mount and call
// useAsyncData with the same key, they get the cached value back
// without firing a new fetch.
//
// Idempotent — called multiple times during the same session, the
// composables' own guards prevent duplicate work.

let prefetchFired = false

export const useShopLandingPrefetch = () => {
  const { $customFetch } = useNuxtApp()

  const prefetch = () => {
    if (prefetchFired) return
    prefetchFired = true

    // Only fire client-side. Marketing pages are SSR'd; we don't want
    // to add four extra calls to every server render.
    if (import.meta.server) return

    // Hero — the component awaits this. Same key, same shape.
    useAsyncData('shop-hero', () =>
      $customFetch('/store/hero').catch(() => null),
    ).then(({ data }) => {
      // Once we know the active hero, push a prefetch hint so the
      // browser can start downloading the image during idle time.
      const hero = data.value?.data
      if (! hero) return
      const url = hero.image_url ?? null
      const mobileUrl = hero.mobile_image_url ?? hero.image_url ?? null
      if (url) injectPrefetchLink(url)
      if (mobileUrl && mobileUrl !== url) injectPrefetchLink(mobileUrl)
    })

    // Brand showcase — top 10 with show_on_landing
    useAsyncData('shop-landing-brands', async () => {
      const res = await $customFetch('/store/stores', {
        query: { on_landing: 1, limit: 10 },
      }).catch(() => null)
      return res?.data ?? []
    })

    // Featured products row
    useAsyncData('shop-landing-featured', async () => {
      const res = await $customFetch('/store/products', {
        query: { per_page: 10 },
      }).catch(() => null)
      return res?.data?.data ?? []
    })

    // Taxonomy (genders + categories + brands) — also used by /shop
    // catalog filter drawer and navbar dropdowns. Same composable, so
    // calling it pre-populates the same key.
    useShopMenuData()
  }

  return { prefetch }
}

// Append a <link rel="prefetch" as="image"> to the document head.
// No-op if a link for this URL is already present (idempotent).
// Lower priority than the visible page's resources, runs during idle.
function injectPrefetchLink(url: string) {
  if (typeof document === 'undefined') return
  if (document.querySelector(`link[rel="prefetch"][href="${url}"]`)) return
  const link = document.createElement('link')
  link.rel = 'prefetch'
  link.as = 'image'
  link.href = url
  // fetchpriority=low explicitly: don't compete with the marketing
  // page's own LCP image.
  link.setAttribute('fetchpriority', 'low')
  document.head.appendChild(link)
}
