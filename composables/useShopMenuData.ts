// Shop-wide taxonomy (genders, categories, brands) for the navbar
// dropdowns + the catalog filter drawer.
//
// CLIENT-ONLY, deferred to idle. None of this data is visible on first
// paint — the dropdowns are behind hover, the filter drawer is behind
// a button. So we don't pay for the fetch during SSR, which keeps
// /shop's cold-cache TTFB lower. After hydration, when the browser
// is idle, we hit the three /store endpoints in parallel and stash
// the result in useState so every consumer reads the same data.
//
// Pages that DO need the taxonomy server-rendered (e.g. the
// /shop/categories grid) should do their own useAsyncData fetch
// rather than rely on this composable.

export const useShopMenuData = () => {
  const { $customFetch } = useNuxtApp()

  // useState gives us SSR-safe, cross-component shared state. Default
  // is empty arrays so consumers can render fallback UI (or simply
  // hide their lists) until the fetch resolves.
  const data = useState('shop-menu-data', () => ({
    genders: [] as any[],
    categories: [] as any[],
    brands: [] as any[],
  }))

  // Idempotent fetcher. Safe to call from many places; only fires
  // once per session. Skips if data is already populated (e.g. by
  // a marketing-page prefetch that ran first).
  const ensureLoaded = async () => {
    if (! import.meta.client) return
    if (data.value.genders.length || data.value.categories.length || data.value.brands.length) return

    try {
      const [g, c, s] = await Promise.all([
        $customFetch('/store/genders').catch(() => null),
        $customFetch('/store/categories').catch(() => null),
        $customFetch('/store/stores').catch(() => null),
      ])
      data.value = {
        genders:    g?.data ?? [],
        categories: c?.data ?? [],
        brands:     s?.data ?? [],
      }
    } catch {
      // Swallow — leaves state empty so retry on next call.
    }
  }

  // Auto-trigger on the first component that calls the composable —
  // but defer to browser idle so we don't compete with LCP.
  if (import.meta.client) {
    onMounted(() => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => ensureLoaded(), { timeout: 3000 })
      } else {
        setTimeout(ensureLoaded, 500)
      }
    })
  }

  return {
    genders:    computed(() => data.value.genders),
    categories: computed(() => data.value.categories),
    brands:     computed(() => data.value.brands),
    // Exposed so callers can fire the fetch eagerly (e.g. on hover
    // of a /shop link from the marketing site, before SPA navigation).
    ensureLoaded,
  }
}
