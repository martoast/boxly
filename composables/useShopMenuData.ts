// Shared shop-wide taxonomy data — genders, categories, brands.
//
// Fetched ONCE per session via useAsyncData with a stable key, so Nuxt
// dedupes automatically across:
//   - The navbar mega-menu (first paint, before any hover)
//   - The shop catalog filter drawer
//   - /shop/categories grid
//   - /shop/brands grid
//   - The product create form (in /app/admin/...) when an admin browses there
//
// The data is baked into the SSR payload, so client-side it's instant —
// no waterfall, no spinner on hover, no flash of empty drawer.
//
// Subsequent SPA navigations within the shop reuse the cached data; new
// fetches only happen on full page refresh or session start.
//
// Returns reactive computed refs (always defined as arrays) so callers
// can render directly without null guards.

export const useShopMenuData = () => {
  const { $customFetch } = useNuxtApp()

  const { data } = useAsyncData(
    'shop-menu-data',
    async () => {
      // Parallel fetch — three small public endpoints, cacheable on
      // the API side (planned in tasks/todo.md T1.2). Failures are
      // swallowed per-endpoint so a single down endpoint doesn't take
      // the whole menu offline.
      const [g, c, s] = await Promise.all([
        $customFetch('/store/genders').catch(() => null),
        $customFetch('/store/categories').catch(() => null),
        $customFetch('/store/stores').catch(() => null),
      ])
      return {
        genders:    g?.data ?? [],
        categories: c?.data ?? [],
        brands:     s?.data ?? [],
      }
    },
    {
      // Don't block page render on this — Nuxt will still wait for it
      // server-side because useAsyncData is registered, but client-side
      // navigations get the data lazily without holding the route up.
      lazy: true,
      default: () => ({ genders: [], categories: [], brands: [] }),
    },
  )

  return {
    genders:    computed(() => data.value?.genders    ?? []),
    categories: computed(() => data.value?.categories ?? []),
    brands:     computed(() => data.value?.brands     ?? []),
  }
}
