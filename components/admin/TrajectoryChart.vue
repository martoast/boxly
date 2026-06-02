<template>
  <div class="bg-white rounded-2xl shadow-sm border border-border p-5 sm:p-6 animate-fadeIn">
    <div class="flex items-start justify-between gap-3 mb-1">
      <div>
        <h3 class="text-base font-bold text-gray-900">{{ title }}</h3>
        <p v-if="subtitle" class="text-xs text-gray-400 mt-0.5">{{ subtitle }}</p>
      </div>
      <slot name="action" />
    </div>

    <ClientOnly>
      <apexchart :type="type" :height="height" :options="chartOptions" :series="series" />
      <template #fallback>
        <div class="flex items-center justify-center text-gray-300 text-sm" :style="{ height: height + 'px' }">
          Cargando gráfico...
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup>
const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  type: { type: String, default: 'area' }, // area | line | bar
  series: { type: Array, required: true },
  categories: { type: Array, required: true },
  format: { type: String, default: 'number' }, // number | currency
  colors: { type: Array, default: () => ['#2E6BB7', '#ef4444', '#10b981', '#f59e0b'] },
  height: { type: Number, default: 320 },
})

const compactCurrency = (v) =>
  '$' + new Intl.NumberFormat('es-MX', { notation: 'compact', maximumFractionDigits: 1 }).format(v ?? 0)
const fullCurrency = (v) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(v ?? 0)
const compactNumber = (v) =>
  new Intl.NumberFormat('es-MX', { notation: 'compact', maximumFractionDigits: 1 }).format(v ?? 0)

const isCurrency = computed(() => props.format === 'currency')

const chartOptions = computed(() => ({
  chart: {
    fontFamily: 'inherit',
    toolbar: { show: false },
    zoom: { enabled: false },
    animations: { enabled: true, easing: 'easeinout', speed: 600 },
    parentHeightOffset: 0,
  },
  colors: props.colors,
  dataLabels: { enabled: false },
  stroke: {
    curve: 'smooth',
    width: props.type === 'bar' ? 0 : 3,
    lineCap: 'round',
  },
  fill: props.type === 'area'
    ? {
        type: 'gradient',
        gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.02, stops: [0, 95] },
      }
    : { opacity: props.type === 'bar' ? 0.9 : 1 },
  plotOptions: {
    bar: { borderRadius: 6, columnWidth: '55%', borderRadiusApplication: 'end' },
  },
  grid: {
    borderColor: '#eef2f7',
    strokeDashArray: 4,
    xaxis: { lines: { show: false } },
    padding: { left: 8, right: 8, top: 0 },
  },
  markers: { size: 0, hover: { size: 5 } },
  xaxis: {
    categories: props.categories,
    tickAmount: Math.min(props.categories.length, 12),
    axisBorder: { show: false },
    axisTicks: { show: false },
    tooltip: { enabled: false },
    labels: { style: { colors: '#94a3b8', fontSize: '11px' }, rotate: -45, rotateAlways: false, hideOverlappingLabels: true },
  },
  yaxis: {
    labels: {
      style: { colors: '#94a3b8', fontSize: '11px' },
      formatter: (v) => (isCurrency.value ? compactCurrency(v) : compactNumber(v)),
    },
  },
  legend: {
    position: 'top',
    horizontalAlign: 'right',
    fontWeight: 600,
    labels: { colors: '#5a6474' },
    markers: { radius: 12 },
    itemMargin: { horizontal: 8 },
  },
  tooltip: {
    theme: 'light',
    shared: true,
    intersect: false,
    y: { formatter: (v) => (isCurrency.value ? fullCurrency(v) : compactNumber(v)) },
  },
}))
</script>
