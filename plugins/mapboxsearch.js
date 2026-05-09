// plugins/mapboxsearch.js
//
// @mapbox/search-js-web is the address autocomplete widget. It's only
// needed on the few routes that actually render the address picker —
// /app/account/shipping-address and the checkout flow. Loading it on
// every page (including the marketing landing) costs ~100 KB of JS
// and a chunk download for users who never see the widget.
//
// We register the plugin only when a relevant route is actually
// matched. Other navigations skip the import entirely.

const ADDRESS_ROUTES = [
  '/app/account/shipping-address',
  '/checkout',
]

const needsMapboxSearch = (path) =>
  ADDRESS_ROUTES.some((p) => path.startsWith(p))

export default defineNuxtPlugin((nuxtApp) => {
  if (!import.meta.client) return

  const route = useRoute()
  const router = useRouter()

  let loaded = false
  const loadIfNeeded = (path) => {
    if (loaded) return
    if (!needsMapboxSearch(path)) return
    loaded = true
    return import('@mapbox/search-js-web').then((mapboxsearch) => {
      nuxtApp.provide('mapboxsearch', mapboxsearch)
    })
  }

  // Initial load — if the user lands directly on an address route
  loadIfNeeded(route.path)

  // SPA navigations — load on entry to an address route
  router.afterEach((to) => loadIfNeeded(to.path))
})
