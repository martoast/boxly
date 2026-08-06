// vue3-apexcharts is ~140 KB gz and only used on /app/admin/** (the
// dashboard hero chart, the founder trajectory chart). Registering it
// globally on install put it in every page's entry bundle, including
// pages that never render a chart.
//
// Mirrors plugins/mapboxsearch.js's route-gating pattern, but uses
// router.beforeResolve (awaited) instead of afterEach: an admin page's
// own <apexchart> usage resolves components as part of that same
// navigation, so the import + vueApp.use() must land BEFORE the
// navigation resolves — afterEach would let the page mount first and
// race the registration.

const needsApexCharts = (path: string) => path.startsWith('/app/admin')

export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter()

  let loaded = false
  const loadIfNeeded = async (path: string) => {
    if (loaded || !needsApexCharts(path)) return
    loaded = true
    const { default: VueApexCharts } = await import('vue3-apexcharts')
    nuxtApp.vueApp.use(VueApexCharts)
  }

  router.beforeResolve((to) => loadIfNeeded(to.path))

  // Direct navigation straight into an admin route.
  return loadIfNeeded(useRoute().path)
})
