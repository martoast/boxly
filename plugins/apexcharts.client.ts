import VueApexCharts from 'vue3-apexcharts'

// Client-only: ApexCharts touches the DOM and can't render during SSR.
// Wrap chart usage in <ClientOnly> in pages/components.
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(VueApexCharts)
})
