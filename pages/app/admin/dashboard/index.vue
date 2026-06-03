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
              <p class="text-sm font-medium text-gray-500 mb-1">{{ t.totalRevenueProcessed }}</p>
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
              </div>
            </div>

            <!-- range filter -->
            <div class="inline-flex rounded-xl border border-gray-200 bg-white/80 backdrop-blur p-0.5 text-xs font-semibold shrink-0">
              <button
                v-for="r in ranges"
                :key="r.value"
                @click="setHeroRange(r.value)"
                :class="heroRange === r.value ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'"
                class="px-4 py-2 rounded-lg transition-colors"
              >{{ r.label }}</button>
            </div>
          </div>

          <!-- hero chart -->
          <div class="mt-6 -mx-2">
            <ClientOnly>
              <apexchart type="area" height="300" :options="heroChartOptions" :series="heroSeries" />
              <template #fallback>
                <div class="h-[300px] flex items-center justify-center text-gray-300 text-sm">{{ t.loading }}</div>
              </template>
            </ClientOnly>
          </div>
        </div>
      </div>

      <!-- ============ NETWORK SCALE ============ -->
      <div>
        <h2 class="text-lg font-bold text-gray-900 mb-1">{{ t.networkScale }}</h2>
        <p class="text-sm text-gray-400 mb-5">{{ t.networkScaleSub }}</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div
            v-for="card in scaleCards"
            :key="card.label"
            class="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            <div :class="card.iconBg" class="w-11 h-11 rounded-xl flex items-center justify-center mb-4">
              <component :is="card.icon" :class="card.iconColor" class="w-6 h-6" />
            </div>
            <p class="text-3xl font-extrabold text-gray-900 tabular-nums">{{ card.value }}</p>
            <p class="text-sm font-medium text-gray-500 mt-1">{{ card.label }}</p>
            <p v-if="card.sub" class="text-xs text-gray-400 mt-0.5">{{ card.sub }}</p>
          </div>
        </div>
      </div>

      <!-- ============ BUSINESS PERFORMANCE ============ -->
      <div>
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h2 class="text-lg font-bold text-gray-900">{{ t.businessPerformance }}</h2>
            <p class="text-sm text-gray-400">{{ t.businessPerformanceSub }}</p>
          </div>
          <div class="inline-flex flex-wrap rounded-xl border border-gray-200 bg-white p-0.5 text-xs font-semibold">
            <button
              v-for="m in perfMetrics"
              :key="m.value"
              @click="perfMetric = m.value"
              :class="perfMetric === m.value ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'"
              class="px-4 py-2 rounded-lg transition-colors"
            >{{ m.label }}</button>
          </div>
        </div>

        <TrajectoryChart
          :key="perfMetric"
          :title="activePerfMetric.label"
          type="area"
          :format="activePerfMetric.format"
          :categories="perfCategories"
          :series="perfSeries"
          :colors="[activePerfMetric.color]"
          :height="340"
        />
      </div>

      <!-- ============ OPERATIONS COMMAND CENTER ============ -->
      <div>
        <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
          <div>
            <h2 class="text-lg font-bold text-gray-900">{{ t.operationsCenter }}</h2>
            <p class="text-sm text-gray-400">{{ t.operationsCenterSub }}</p>
          </div>
          <div v-if="pipeline" class="text-left sm:text-right">
            <p class="text-sm text-gray-700"><span class="font-extrabold text-gray-900 tabular-nums">{{ fmtInt(pipeline.packages_received_total) }}</span> {{ t.packagesReceivedTotal }}</p>
            <p class="text-xs text-gray-400">{{ fmtInt(pipeline.packages_pending) }} {{ t.packagesPending }}</p>
          </div>
        </div>

        <div class="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 sm:p-6">
          <div class="flex flex-col lg:flex-row lg:items-stretch gap-2">
            <template v-for="(stage, i) in pipelineStages" :key="stage.key">
              <div class="flex-1 rounded-xl border border-gray-100 bg-gradient-to-b from-gray-50 to-white p-5 text-center transition-all hover:shadow-sm">
                <div :class="stage.iconBg" class="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <component :is="stage.icon" :class="stage.iconColor" class="w-6 h-6" />
                </div>
                <p class="text-3xl font-extrabold text-gray-900 tabular-nums">{{ fmtInt(stage.count) }}</p>
                <p class="text-xs font-semibold text-gray-600 uppercase tracking-wide mt-1">{{ stage.title }}</p>
                <p class="text-[11px] text-gray-400 mt-0.5">{{ stage.desc }}</p>
              </div>
              <div v-if="i < pipelineStages.length - 1" class="flex items-center justify-center text-gray-300 py-1 lg:py-0">
                <svg class="w-5 h-5 rotate-90 lg:rotate-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- ============ GEOGRAPHIC REACH ============ -->
      <div>
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h2 class="text-lg font-bold text-gray-900">{{ t.geoTitle }}</h2>
            <p class="text-sm text-gray-400">
              {{ t.geoSub }}
              <span v-if="geo"> · {{ fmtInt(geo.totals.states_active) }} {{ t.statesActiveLabel }}</span>
            </p>
          </div>
          <div class="inline-flex rounded-xl border border-gray-200 bg-white p-0.5 text-xs font-semibold">
            <button
              v-for="m in geoMetrics"
              :key="m.value"
              @click="geoMetric = m.value"
              :class="geoMetric === m.value ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'"
              class="px-4 py-2 rounded-lg transition-colors"
            >{{ m.label }}</button>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- map -->
          <div class="lg:col-span-2 rounded-2xl border border-gray-100 bg-white shadow-sm p-5 sm:p-6">
            <ClientOnly>
              <CitiesMap
                :cities="geoCities"
                :metric="geoMetric"
                :metric-label="activeGeoMetric.label"
                :format="activeGeoMetric.format"
                :token="mapboxToken"
                :unlocated-label="t.unlocatedCities"
              />
              <template #fallback>
                <div class="h-[440px] flex items-center justify-center text-gray-300 text-sm">{{ t.loading }}</div>
              </template>
            </ClientOnly>
          </div>

          <!-- top cities -->
          <div class="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
            <p class="text-sm font-bold text-gray-900 mb-4">{{ t.topCities }}</p>
            <div v-if="topCities.length" class="space-y-3">
              <div v-for="s in topCities" :key="s.city + s.estado">
                <div class="flex items-center justify-between text-sm mb-1">
                  <span class="font-medium text-gray-700 truncate pr-2">{{ s.city }}<span class="text-gray-400 font-normal"> · {{ s.estado }}</span></span>
                  <span class="font-semibold text-gray-900 tabular-nums shrink-0">{{ fmtGeo(s[geoMetric]) }}</span>
                </div>
                <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full rounded-full bg-primary-500 transition-all duration-500" :style="{ width: ((s[geoMetric] || 0) / topCityMax * 100) + '%' }"></div>
                </div>
              </div>
            </div>
            <p v-else class="text-sm text-gray-400">{{ t.noGeo }}</p>
          </div>
        </div>
      </div>

      <!-- ============ BOXLY INSIGHTS ============ -->
      <div>
        <h2 class="text-lg font-bold text-gray-900">{{ t.insights }}</h2>
        <p class="text-sm text-gray-400 mb-5">{{ t.insightsSub }}</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div
            v-for="card in insightCards"
            :key="card.key"
            class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            <div :class="card.iconBg" class="w-10 h-10 rounded-xl flex items-center justify-center mb-4">
              <component :is="card.icon" :class="card.iconColor" class="w-5 h-5" />
            </div>
            <p class="text-3xl font-extrabold tabular-nums" :class="card.valueClass">{{ card.value }}</p>
            <p class="text-sm font-semibold text-gray-700 mt-2">{{ card.title }}</p>
            <p class="text-xs text-gray-400 mt-0.5">{{ card.desc }}</p>
          </div>
        </div>
      </div>

    </div>
  </section>
</template>

<script setup>
import TrajectoryChart from "~/components/admin/TrajectoryChart.vue";
import CitiesMap from "~/components/admin/CitiesMap.vue";
import {
  UsersIcon,
  ShoppingBagIcon,
  ArchiveBoxIcon,
  MapPinIcon,
  InboxArrowDownIcon,
  Square3Stack3DIcon,
  ArrowsRightLeftIcon,
  TruckIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
  CubeIcon,
  ArrowPathIcon,
} from "@heroicons/vue/24/outline";

definePageMeta({
  layout: "admin",
  middleware: ["auth", "admin"],
});

const { $customFetch } = useNuxtApp();
const { t: createTranslations } = useLanguage();
const mapboxToken = useRuntimeConfig().public.MAPBOX_API_TOKEN;

const t = createTranslations({
  totalRevenueProcessed: { es: "Ingresos totales procesados", en: "Total Revenue Processed" },
  customers: { es: "Clientes", en: "Customers" },
  orders: { es: "Órdenes", en: "Orders" },
  margin: { es: "Margen", en: "Margin" },
  loading: { es: "Cargando...", en: "Loading..." },
  networkScale: { es: "Escala de la red", en: "Network Scale" },
  networkScaleSub: { es: "El alcance de la infraestructura Boxly", en: "The reach of the Boxly infrastructure" },
  customersServed: { es: "Clientes atendidos", en: "Customers Served" },
  ordersProcessed: { es: "Órdenes procesadas", en: "Orders Processed" },
  packagesReceived: { es: "Paquetes recibidos", en: "Packages Received" },
  citiesReached: { es: "Ciudades alcanzadas", en: "Cities Reached" },
  statesLabel: { es: "estados", en: "states" },
  businessPerformance: { es: "Desempeño del negocio", en: "Business Performance" },
  businessPerformanceSub: { es: "Tendencia mensual desde el inicio", en: "Monthly trend since inception" },
  revenue: { es: "Ingresos", en: "Revenue" },
  profit: { es: "Ganancia", en: "Profit" },
  totalCustomers: { es: "Clientes totales", en: "Total Customers" },
  // Operations pipeline
  operationsCenter: { es: "Centro de operaciones", en: "Operations Command Center" },
  operationsCenterSub: { es: "Flujo logístico en vivo", en: "Live logistics pipeline" },
  packagesReceivedTotal: { es: "paquetes recibidos", en: "packages received" },
  packagesPending: { es: "pendientes por llegar", en: "pending arrival" },
  stReceived: { es: "San Diego", en: "San Diego" },
  stReceivedDesc: { es: "Recibiendo", en: "Receiving" },
  stConsolidating: { es: "Consolidación", en: "Consolidation" },
  stConsolidatingDesc: { es: "Preparando", en: "Preparing" },
  stCross: { es: "Cruce fronterizo", en: "Border Crossing" },
  stCrossDesc: { es: "Listo para cruzar", en: "Ready to cross" },
  stTransit: { es: "Red México", en: "Mexico Network" },
  stTransitDesc: { es: "En tránsito", en: "In transit" },
  stDelivered: { es: "Entregado", en: "Delivered" },
  stDeliveredDesc: { es: "Completado", en: "Completed" },
  // Insights
  insights: { es: "Boxly Insights", en: "Boxly Insights" },
  insightsSub: { es: "Aspectos clave generados automáticamente", en: "Automatically generated highlights" },
  inGrowth: { es: "Crecimiento de ingresos", en: "Revenue growth" },
  inGrowthDesc: { es: "este mes vs. el anterior", en: "this month vs. last" },
  inAov: { es: "Valor promedio de orden", en: "Average order value" },
  inAovDesc: { es: "por orden pagada", en: "per paid order" },
  inTopMarket: { es: "Mercado más activo", en: "Most active market" },
  inLargestBox: { es: "Caja más popular", en: "Top box category" },
  inLargestBoxDesc: { es: "por volumen enviado", en: "by shipped volume" },
  inRepeat: { es: "Ingresos recurrentes", en: "Repeat-customer revenue" },
  inRepeatDesc: { es: "de clientes que regresan", en: "from returning customers" },
  customersLabel: { es: "clientes", en: "customers" },
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
const heroRange = ref("90d");
const months = ref([]);
const perfMetric = ref("revenue");
const pipeline = ref(null);
const insights = ref(null);
const geo = ref(null);
const geoMetric = ref("customers");

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

const heroRevenue = computed(() => fmtMoney0(overview.value?.revenue));

// ---- network scale cards ----
const scaleCards = computed(() => [
  { label: t.value.customersServed, value: fmtInt(overview.value?.customers), icon: UsersIcon, iconBg: "bg-primary-50", iconColor: "text-primary-600" },
  { label: t.value.ordersProcessed, value: fmtInt(overview.value?.orders), icon: ShoppingBagIcon, iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
  { label: t.value.packagesReceived, value: fmtInt(overview.value?.packages_received), icon: ArchiveBoxIcon, iconBg: "bg-amber-50", iconColor: "text-amber-600" },
  {
    label: t.value.citiesReached,
    value: fmtInt(overview.value?.cities_reached),
    sub: `${fmtInt(overview.value?.states_reached)} ${t.value.statesLabel}`,
    icon: MapPinIcon, iconBg: "bg-violet-50", iconColor: "text-violet-600",
  },
]);

// ---- hero chart ----
const heroSeries = computed(() => [
  { name: t.value.revenue, data: (heroData.value?.points ?? []).map((p) => p.revenue) },
]);
const heroCategories = computed(() => (heroData.value?.points ?? []).map((p) => p.label));

const heroChartOptions = computed(() => ({
  chart: { fontFamily: "inherit", toolbar: { show: false }, zoom: { enabled: false }, animations: { enabled: true, speed: 600 }, parentHeightOffset: 0, sparkline: { enabled: false } },
  colors: ["#2E6BB7"],
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
    labels: {
      style: { colors: "#94a3b8", fontSize: "11px" },
      formatter: (v) => "$" + new Intl.NumberFormat("es-MX", { notation: "compact", maximumFractionDigits: 1 }).format(v ?? 0),
    },
  },
  tooltip: { theme: "light", y: { formatter: (v) => fmtMoney0(v) } },
}));

// ---- performance ----
const perfMetrics = computed(() => [
  { value: "revenue", label: t.value.revenue, format: "currency", color: "#2E6BB7", field: "revenue" },
  { value: "profit", label: t.value.profit, format: "currency", color: "#10b981", field: "profit" },
  { value: "orders", label: t.value.orders, format: "number", color: "#f59e0b", field: "orders_count" },
  { value: "customers", label: t.value.totalCustomers, format: "number", color: "#8b5cf6", field: "cumulative_customers" },
]);
const activePerfMetric = computed(() => perfMetrics.value.find((m) => m.value === perfMetric.value));
const perfCategories = computed(() => months.value.map((m) => m.label));
const perfSeries = computed(() => [
  { name: activePerfMetric.value.label, data: months.value.map((m) => m[activePerfMetric.value.field]) },
]);

// ---- pipeline ----
const stageMeta = computed(() => ({
  received: { title: t.value.stReceived, desc: t.value.stReceivedDesc, icon: InboxArrowDownIcon, iconBg: "bg-primary-50", iconColor: "text-primary-600" },
  consolidating: { title: t.value.stConsolidating, desc: t.value.stConsolidatingDesc, icon: Square3Stack3DIcon, iconBg: "bg-sky-50", iconColor: "text-sky-600" },
  ready_to_cross: { title: t.value.stCross, desc: t.value.stCrossDesc, icon: ArrowsRightLeftIcon, iconBg: "bg-amber-50", iconColor: "text-amber-600" },
  in_transit: { title: t.value.stTransit, desc: t.value.stTransitDesc, icon: TruckIcon, iconBg: "bg-indigo-50", iconColor: "text-indigo-600" },
  delivered: { title: t.value.stDelivered, desc: t.value.stDeliveredDesc, icon: CheckCircleIcon, iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
}));
const pipelineStages = computed(() =>
  (pipeline.value?.stages ?? []).map((s) => ({ ...s, ...stageMeta.value[s.key] }))
);

// ---- insights ----
const boxLabels = { "extra-small": "XS", small: "S", medium: "M", large: "L", "extra-large": "XL" };
const insightCards = computed(() => {
  const d = insights.value;
  if (!d) return [];
  const growth = d.revenue_growth;
  const growthStr = growth === null || growth === undefined ? "—" : `${growth > 0 ? "+" : ""}${growth}%`;
  const topMarket = d.top_market;
  return [
    {
      key: "growth", icon: ArrowTrendingUpIcon,
      iconBg: growth >= 0 ? "bg-emerald-50" : "bg-red-50",
      iconColor: growth >= 0 ? "text-emerald-600" : "text-red-600",
      value: growthStr, valueClass: growth > 0 ? "text-emerald-600" : growth < 0 ? "text-red-600" : "text-gray-900",
      title: t.value.inGrowth, desc: t.value.inGrowthDesc,
    },
    {
      key: "aov", icon: CurrencyDollarIcon, iconBg: "bg-primary-50", iconColor: "text-primary-600",
      value: fmtMoney0(d.aov), valueClass: "text-gray-900",
      title: t.value.inAov, desc: t.value.inAovDesc,
    },
    {
      key: "market", icon: MapPinIcon, iconBg: "bg-violet-50", iconColor: "text-violet-600",
      value: topMarket?.state ?? "—", valueClass: "text-gray-900",
      title: t.value.inTopMarket, desc: topMarket ? `${fmtInt(topMarket.customers)} ${t.value.customersLabel}` : "—",
    },
    {
      key: "box", icon: CubeIcon, iconBg: "bg-amber-50", iconColor: "text-amber-600",
      value: d.largest_box ? (boxLabels[d.largest_box.size] ?? d.largest_box.size) : "—", valueClass: "text-gray-900",
      title: t.value.inLargestBox, desc: t.value.inLargestBoxDesc,
    },
    {
      key: "repeat", icon: ArrowPathIcon, iconBg: "bg-emerald-50", iconColor: "text-emerald-600",
      value: `${d.repeat_revenue_pct ?? 0}%`, valueClass: "text-gray-900",
      title: t.value.inRepeat, desc: t.value.inRepeatDesc,
    },
  ];
});

// ---- geographic ----
const geoMetrics = computed(() => [
  { value: "customers", label: t.value.customers, format: "number" },
  { value: "orders", label: t.value.orders, format: "number" },
  { value: "revenue", label: t.value.revenue, format: "currency" },
]);
const activeGeoMetric = computed(() => geoMetrics.value.find((m) => m.value === geoMetric.value));
const geoStates = computed(() => geo.value?.states ?? []);
const geoCities = computed(() => geo.value?.cities ?? []);
const topCities = computed(() =>
  [...geoCities.value].sort((a, b) => (b[geoMetric.value] ?? 0) - (a[geoMetric.value] ?? 0)).slice(0, 8)
);
const topCityMax = computed(() => Math.max(1, ...topCities.value.map((s) => s[geoMetric.value] ?? 0)));
const fmtGeo = (v) =>
  activeGeoMetric.value.format === "currency" ? fmtMoney0(v) : fmtInt(v);

// ---- fetch ----
const fetchOverview = async () => {
  try {
    const res = await $customFetch("/admin/dashboard/v3/overview");
    overview.value = res.data;
  } catch (e) { console.error("v3 overview", e); }
};
const fetchHeroSeries = async () => {
  try {
    const res = await $customFetch("/admin/dashboard/v3/revenue-series", { query: { range: heroRange.value } });
    heroData.value = res.data;
  } catch (e) { console.error("v3 revenue-series", e); }
};
const fetchTimeSeries = async () => {
  try {
    const res = await $customFetch("/admin/dashboard/time-series");
    months.value = res.data?.months ?? [];
  } catch (e) { console.error("v3 time-series", e); }
};
const fetchPipeline = async () => {
  try {
    const res = await $customFetch("/admin/dashboard/v3/pipeline");
    pipeline.value = res.data;
  } catch (e) { console.error("v3 pipeline", e); }
};
const fetchInsights = async () => {
  try {
    const res = await $customFetch("/admin/dashboard/v3/insights");
    insights.value = res.data;
  } catch (e) { console.error("v3 insights", e); }
};
const fetchGeographic = async () => {
  try {
    const res = await $customFetch("/admin/dashboard/v3/geographic");
    geo.value = res.data;
  } catch (e) { console.error("v3 geographic", e); }
};
const setHeroRange = (r) => { heroRange.value = r; fetchHeroSeries(); };

onMounted(() => {
  fetchOverview();
  fetchHeroSeries();
  fetchTimeSeries();
  fetchPipeline();
  fetchInsights();
  fetchGeographic();
});
</script>
