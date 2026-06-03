<template>
  <section class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

      <!-- ============ HERO ============ -->
      <div class="relative overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        <!-- soft brand gradient backdrop -->
        <div class="absolute inset-0 bg-gradient-to-br from-primary-50/80 via-white to-emerald-50/40 pointer-events-none"></div>
        <div class="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary-100/40 blur-3xl pointer-events-none"></div>

        <div class="relative p-6 sm:p-10">
          <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <div class="flex items-center gap-2 mb-3">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span class="text-sm font-semibold tracking-wide text-gray-500 uppercase">BOXLY Network</span>
              </div>
              <p class="text-sm font-medium text-gray-500 mb-1">{{ heroRevenueLabel }}</p>
              <h1 class="text-4xl sm:text-6xl font-extrabold tracking-tight text-gray-900 tabular-nums">
                {{ heroRevenue }}
                <span class="text-2xl sm:text-3xl font-bold text-gray-400 align-top">MXN</span>
              </h1>

              <div class="flex flex-wrap items-center gap-x-8 gap-y-3 mt-6">
                <div>
                  <p class="text-2xl font-extrabold text-gray-900 tabular-nums">{{ fmtInt(overview?.customers) }}</p>
                  <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">{{ t.customers }}</p>
                </div>
                <div class="h-8 w-px bg-gray-200"></div>
                <div>
                  <p class="text-2xl font-extrabold text-gray-900 tabular-nums">{{ fmtInt(overview?.orders) }}</p>
                  <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">{{ t.orders }}</p>
                </div>
                <div class="h-8 w-px bg-gray-200"></div>
                <div>
                  <p class="text-2xl font-extrabold text-emerald-600 tabular-nums">{{ overview ? overview.margin + '%' : '—' }}</p>
                  <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">{{ t.margin }}</p>
                </div>
                <div class="h-8 w-px bg-gray-200"></div>
                <div>
                  <p class="text-2xl font-extrabold text-gray-900 tabular-nums">{{ fmtMoney0(overview?.aov) }}</p>
                  <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">{{ t.avgOrder }}</p>
                </div>
              </div>
            </div>

            <!-- range filter -->
            <div class="grid grid-cols-4 w-full rounded-xl border border-gray-200 bg-white/80 backdrop-blur p-0.5 text-xs font-semibold sm:inline-flex sm:w-auto shrink-0">
              <button
                v-for="r in ranges"
                :key="r.value"
                @click="setHeroRange(r.value)"
                :class="range === r.value ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'"
                class="px-2 sm:px-4 py-2 rounded-lg transition-colors text-center"
              >{{ r.label }}</button>
            </div>
          </div>

          <!-- metric selector -->
          <div class="mt-6 grid grid-cols-4 rounded-xl border border-gray-200 bg-white/80 backdrop-blur p-0.5 text-xs font-semibold sm:inline-flex">
            <button
              v-for="m in perfMetrics"
              :key="m.value"
              @click="perfMetric = m.value"
              :class="perfMetric === m.value ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'"
              class="px-2 sm:px-4 py-2 rounded-lg transition-colors text-center whitespace-nowrap"
            >{{ m.label }}</button>
          </div>

          <!-- hero chart -->
          <div class="mt-3 -mx-2">
            <ClientOnly>
              <apexchart :key="perfMetric" type="area" height="300" :options="heroChartOptions" :series="heroSeries" />
              <template #fallback>
                <div class="h-[300px] flex items-center justify-center text-gray-300 text-sm">{{ t.loading }}</div>
              </template>
            </ClientOnly>
          </div>
        </div>
      </div>

      <!-- ============ GEOGRAPHIC REACH ============ -->
      <div>
        <div class="mb-5">
          <h2 class="text-lg font-bold text-gray-900">{{ t.geoTitle }}</h2>
          <p class="text-sm text-gray-400">
            {{ t.geoSub }} · {{ rangeLabel }}
            <span v-if="geo"> · {{ fmtInt(geo.totals.states_active) }} {{ t.statesActiveLabel }}</span>
          </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- map -->
          <div class="lg:col-span-2 rounded-2xl border border-gray-100 bg-white shadow-sm p-5 sm:p-6">
            <ClientOnly>
              <CitiesMap
                :cities="geoCities"
                metric="orders"
                :metric-label="t.orders"
                format="number"
                :token="mapboxToken"
                :unlocated-label="t.unlocatedCities"
              />
              <template #fallback>
                <div class="h-[440px] flex items-center justify-center text-gray-300 text-sm">{{ t.loading }}</div>
              </template>
            </ClientOnly>
          </div>

          <!-- top cities by orders -->
          <div class="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
            <p class="text-sm font-bold text-gray-900 mb-4">{{ t.topCities }}</p>
            <div v-if="topCities.length" class="space-y-3">
              <div v-for="s in topCities" :key="s.city + s.estado">
                <div class="flex items-center justify-between text-sm mb-1">
                  <span class="font-medium text-gray-700 truncate pr-2">{{ s.city }}<span class="text-gray-400 font-normal"> · {{ s.estado }}</span></span>
                  <span class="font-semibold text-gray-900 tabular-nums shrink-0">{{ fmtInt(s.orders) }}</span>
                </div>
                <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full rounded-full bg-primary-500 transition-all duration-500" :style="{ width: ((s.orders || 0) / topCityMax * 100) + '%' }"></div>
                </div>
              </div>
            </div>
            <p v-else class="text-sm text-gray-400">{{ t.noGeo }}</p>
          </div>
        </div>
      </div>

    </div>
  </section>
</template>

<script setup>
import CitiesMap from "~/components/admin/CitiesMap.vue";

definePageMeta({
  layout: "admin",
  middleware: ["auth", "admin"],
});

const { $customFetch } = useNuxtApp();
const { t: createTranslations } = useLanguage();
const mapboxToken = useRuntimeConfig().public.MAPBOX_API_TOKEN;

const t = createTranslations({
  totalRevenueProcessed: { es: "Ingresos totales procesados", en: "Total Revenue Processed" },
  revLast30: { es: "Ingresos · últimos 30 días", en: "Revenue · last 30 days" },
  revLast90: { es: "Ingresos · últimos 90 días", en: "Revenue · last 90 days" },
  revLast12m: { es: "Ingresos · últimos 12 meses", en: "Revenue · last 12 months" },
  rl30: { es: "últimos 30 días", en: "last 30 days" },
  rl90: { es: "últimos 90 días", en: "last 90 days" },
  rl1y: { es: "últimos 12 meses", en: "last 12 months" },
  rlAll: { es: "todo el historial", en: "all time" },
  customers: { es: "Clientes", en: "Customers" },
  orders: { es: "Órdenes", en: "Orders" },
  margin: { es: "Margen", en: "Margin" },
  loading: { es: "Cargando...", en: "Loading..." },
  revenue: { es: "Ingresos", en: "Revenue" },
  profit: { es: "Ganancia", en: "Profit" },
  totalCustomers: { es: "Clientes totales", en: "Total Customers" },
  avgOrder: { es: "Valor promedio por orden", en: "Avg. order value" },
  // Geographic
  geoTitle: { es: "Alcance geográfico", en: "Geographic Reach" },
  geoSub: { es: "Presencia nacional por estado", en: "National presence by state" },
  topStates: { es: "Estados principales", en: "Top states" },
  topCities: { es: "Ciudades principales", en: "Top cities" },
  statesActiveLabel: { es: "estados activos", en: "active states" },
  noGeo: { es: "Sin datos geográficos aún", en: "No geographic data yet" },
  unlocatedCities: { es: "ciudades sin ubicar en el mapa", en: "cities not placed on the map" },
});

// ---- state ----
const overview = ref(null);
const heroData = ref(null);
const range = ref("90d");
const perfMetric = ref("revenue");
const geo = ref(null);

const ranges = [
  { value: "30d", label: "30D" },
  { value: "90d", label: "90D" },
  { value: "1y", label: "1Y" },
  { value: "all", label: "ALL" },
];

// ---- formatting ----
const fmtMoney0 = (v) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(v ?? 0);
const fmtInt = (v) => new Intl.NumberFormat("es-MX").format(v ?? 0);

// Plain compact axis label (no Intl "compact" — that feature fails in some envs).
const compactAxis = (v) => {
  const n = Number(v) || 0;
  const a = Math.abs(n);
  if (a >= 1e6) return (n / 1e6).toFixed(a < 1e7 ? 1 : 0).replace(/\.0$/, "") + "M";
  if (a >= 1e3) return (n / 1e3).toFixed(a < 1e4 ? 1 : 0).replace(/\.0$/, "") + "k";
  return String(Math.round(n));
};

// Running total — the "snowball" so cumulative growth is visible.
const cumulative = (arr) => {
  let sum = 0;
  return arr.map((v) => (sum += v ?? 0));
};

// Big figure follows the selected range (matches the chart below it).
const heroRevenue = computed(() => fmtMoney0(heroData.value?.total ?? overview.value?.revenue));
const heroRevenueLabel = computed(() => ({
  "30d": t.value.revLast30,
  "90d": t.value.revLast90,
  "1y": t.value.revLast12m,
  all: t.value.totalRevenueProcessed,
}[range.value] ?? t.value.totalRevenueProcessed));

// Short label for the active timeframe, shown on every section subtitle.
const rangeLabel = computed(() => ({
  "30d": t.value.rl30, "90d": t.value.rl90, "1y": t.value.rl1y, all: t.value.rlAll,
}[range.value] ?? ""));

// ---- hero chart (cumulative trend of the selected metric) ----
const perfMetrics = computed(() => [
  { value: "revenue", label: t.value.revenue, format: "currency", color: "#2E6BB7", field: "revenue" },
  { value: "profit", label: t.value.profit, format: "currency", color: "#10b981", field: "profit" },
  { value: "orders", label: t.value.orders, format: "number", color: "#f59e0b", field: "orders" },
  { value: "customers", label: t.value.customers, format: "number", color: "#8b5cf6", field: "customers" },
]);
const activePerfMetric = computed(() => perfMetrics.value.find((m) => m.value === perfMetric.value) ?? perfMetrics.value[0]);
const heroIsCurrency = computed(() => activePerfMetric.value.format === "currency");
const heroSeries = computed(() => [
  { name: activePerfMetric.value.label, data: cumulative((heroData.value?.points ?? []).map((p) => p[activePerfMetric.value.field])) },
]);
const heroCategories = computed(() => (heroData.value?.points ?? []).map((p) => p.label));

const heroChartOptions = computed(() => ({
  chart: { fontFamily: "inherit", toolbar: { show: false }, zoom: { enabled: false }, animations: { enabled: true, speed: 600 }, parentHeightOffset: 0, sparkline: { enabled: false } },
  colors: [activePerfMetric.value.color],
  dataLabels: { enabled: false },
  stroke: { curve: "smooth", width: 3, lineCap: "round" },
  fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.02, stops: [0, 95] } },
  grid: { borderColor: "#eef2f7", strokeDashArray: 4, xaxis: { lines: { show: false } }, padding: { left: 8, right: 8 } },
  markers: { size: 0, hover: { size: 5 } },
  xaxis: {
    categories: heroCategories.value,
    tickAmount: Math.min(heroCategories.value.length, 8),
    axisBorder: { show: false }, axisTicks: { show: false }, tooltip: { enabled: false },
    labels: { style: { colors: "#94a3b8", fontSize: "11px" }, hideOverlappingLabels: true, rotate: 0 },
  },
  yaxis: {
    forceNiceScale: true,
    decimalsInFloat: 0,
    labels: {
      style: { colors: "#94a3b8", fontSize: "11px" },
      formatter: (v) => (heroIsCurrency.value ? "$" : "") + compactAxis(v),
    },
  },
  tooltip: { theme: "light", y: { formatter: (v) => (heroIsCurrency.value ? fmtMoney0(v) : fmtInt(v)) } },
}));

// ---- geographic (orders only — where the orders are going) ----
const geoCities = computed(() => geo.value?.cities ?? []);
const topCities = computed(() =>
  [...geoCities.value].sort((a, b) => (b.orders ?? 0) - (a.orders ?? 0)).slice(0, 8)
);
const topCityMax = computed(() => Math.max(1, ...topCities.value.map((s) => s.orders ?? 0)));

// ---- fetch (every section is scoped to the single global `range`) ----
const q = () => ({ query: { range: range.value } });
const fetchOverview = async () => {
  try { overview.value = (await $customFetch("/admin/dashboard/v3/overview", q())).data; }
  catch (e) { console.error("v3 overview", e); }
};
const fetchHeroSeries = async () => {
  try { heroData.value = (await $customFetch("/admin/dashboard/v3/revenue-series", q())).data; }
  catch (e) { console.error("v3 revenue-series", e); }
};
const fetchGeographic = async () => {
  try { geo.value = (await $customFetch("/admin/dashboard/v3/geographic", q())).data; }
  catch (e) { console.error("v3 geographic", e); }
};
const fetchAll = () => {
  fetchOverview();
  fetchHeroSeries();
  fetchGeographic();
};
const setHeroRange = (r) => { range.value = r; fetchAll(); };

onMounted(fetchAll);
</script>
