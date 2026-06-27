<template>
  <div class="relative h-[100dvh] w-screen overflow-hidden bg-gray-50">
    <!-- ============ FULL-BLEED MAP ============ -->
    <ClientOnly>
      <CitiesMap
        :cities="sortedCities"
        metric="orders"
        :metric-label="t.orders"
        format="number"
        :token="mapboxToken"
        height="100dvh"
        :show-caption="false"
        :show-nav="false"
        glow
        :center="[-101.5, 23.2]"
        :zoom="4.55"
      />
      <template #fallback>
        <div class="h-full flex items-center justify-center text-gray-300 text-sm">{{ t.loading }}</div>
      </template>
    </ClientOnly>

    <!-- ============ TOP BAR ============ -->
    <header class="absolute top-0 inset-x-0 p-4 sm:p-6 flex items-start justify-between gap-4 pointer-events-none">
      <div class="flex items-center gap-3 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-lg px-4 py-2.5">
        <span class="relative flex h-2.5 w-2.5">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70"></span>
          <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        <div class="leading-tight">
          <p class="text-base sm:text-lg font-extrabold tracking-tight text-gray-900">BOXLY</p>
          <p class="text-[11px] sm:text-xs font-medium text-gray-500 -mt-0.5">{{ t.title }}</p>
        </div>
      </div>

      <div class="flex items-center gap-2 pointer-events-auto">
        <!-- range filter -->
        <div class="flex items-center gap-1 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-lg p-1">
          <button
            v-for="r in ranges"
            :key="r.value"
            @click="setRange(r.value)"
            :class="[
              'px-3 py-1.5 rounded-xl text-xs font-bold transition-colors',
              range === r.value ? 'bg-primary-600 text-white shadow' : 'text-gray-500 hover:text-gray-900',
            ]"
          >
            {{ r.label }}
          </button>
        </div>
        <!-- fullscreen -->
        <button
          @click="toggleFullscreen"
          class="h-9 w-9 grid place-items-center rounded-2xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-lg text-gray-600 hover:text-gray-900"
          :title="t.fullscreen"
        >
          <ArrowsPointingOutIcon v-if="!isFullscreen" class="h-4 w-4" />
          <ArrowsPointingInIcon v-else class="h-4 w-4" />
        </button>
        <!-- exit -->
        <NuxtLink
          to="/app/admin/dashboard"
          class="h-9 w-9 grid place-items-center rounded-2xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-lg text-gray-600 hover:text-gray-900"
          :title="t.exit"
        >
          <XMarkIcon class="h-4 w-4" />
        </NuxtLink>
      </div>
    </header>

    <!-- ============ CITY LEADERBOARD (auto-scroll) ============ -->
    <aside class="absolute right-4 sm:right-6 top-24 bottom-28 w-64 sm:w-72 pointer-events-none">
      <div class="h-full flex flex-col rounded-2xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl overflow-hidden">
        <div class="px-4 pt-4 pb-3 border-b border-gray-200/60">
          <p class="text-sm font-bold text-gray-900">{{ t.cities }}</p>
          <p class="text-[11px] text-gray-400">{{ fmtInt(cities.length) }} {{ t.citiesActive }} · {{ rangeLabel }}</p>
        </div>
        <div class="city-scroll relative flex-1 overflow-hidden px-4 py-3">
          <div
            :class="enableScroll ? 'city-track' : 'space-y-2.5'"
            :style="enableScroll ? { animationDuration: scrollDur + 's' } : null"
          >
            <div
              v-for="(s, i) in scrollCities"
              :key="i + '-' + s.city + s.estado"
              class="mb-2.5"
            >
              <div class="flex items-center justify-between text-sm mb-1">
                <span class="font-medium text-gray-700 truncate pr-2">
                  {{ s.city }}<span class="text-gray-400 font-normal"> · {{ s.estado }}</span>
                </span>
                <span class="font-bold text-gray-900 tabular-nums shrink-0">{{ fmtInt(s.orders) }}</span>
              </div>
              <div class="h-1.5 bg-gray-200/70 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full bg-primary-500"
                  :style="{ width: ((s.orders || 0) / cityMax * 100) + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <!-- ============ STAT COUNTERS ============ -->
    <footer class="absolute bottom-0 inset-x-0 p-4 sm:p-6 pointer-events-none">
      <div class="flex flex-wrap gap-3">
        <div v-for="m in statCards" :key="m.key" class="flex-1 min-w-[120px] max-w-[220px] rounded-2xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-lg px-4 py-3">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{{ m.label }}</p>
          <p class="text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums" :class="m.color">{{ m.display }}</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import CitiesMap from "~/components/admin/CitiesMap.vue";
import { ArrowsPointingOutIcon, ArrowsPointingInIcon, XMarkIcon } from "@heroicons/vue/24/outline";

definePageMeta({
  layout: "empty",
  middleware: ["auth", "admin"],
});

const { $customFetch } = useNuxtApp();
const { t: createTranslations } = useLanguage();
const mapboxToken = useRuntimeConfig().public.MAPBOX_API_TOKEN;

const t = createTranslations({
  title: { es: "Alcance Nacional · México", en: "National Reach · Mexico" },
  orders: { es: "Órdenes", en: "Orders" },
  customers: { es: "Clientes", en: "Customers" },
  revenue: { es: "Ingresos", en: "Revenue" },
  statesActive: { es: "Estados", en: "States" },
  cities: { es: "Ciudades", en: "Cities" },
  citiesActive: { es: "ciudades activas", en: "active cities" },
  loading: { es: "Cargando...", en: "Loading..." },
  fullscreen: { es: "Pantalla completa", en: "Fullscreen" },
  exit: { es: "Salir", en: "Exit" },
  rl30: { es: "últimos 30 días", en: "last 30 days" },
  rl90: { es: "últimos 90 días", en: "last 90 days" },
  rl1y: { es: "últimos 12 meses", en: "last 12 months" },
  rlAll: { es: "todo el historial", en: "all time" },
});

// ---- state ----
const geo = ref(null);
const overview = ref(null); // headline KPIs — same source as the main dashboard
const range = ref("all"); // all-time is the default on the wall

const ranges = [
  { value: "30d", label: "30D" },
  { value: "90d", label: "90D" },
  { value: "1y", label: "1Y" },
  { value: "all", label: "ALL" },
];
const rangeLabel = computed(() => ({
  "30d": t.value.rl30, "90d": t.value.rl90, "1y": t.value.rl1y, all: t.value.rlAll,
}[range.value] ?? ""));

// ---- formatting ----
const fmtInt = (v) => new Intl.NumberFormat("es-MX").format(Math.round(v ?? 0));
const fmtMoney0 = (v) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(v ?? 0);
const compact = (v) => {
  const n = Number(v) || 0, a = Math.abs(n);
  if (a >= 1e6) return (n / 1e6).toFixed(a < 1e7 ? 1 : 0).replace(/\.0$/, "") + "M";
  if (a >= 1e3) return (n / 1e3).toFixed(a < 1e4 ? 1 : 0).replace(/\.0$/, "") + "k";
  return String(Math.round(n));
};

// ---- cities ----
const cities = computed(() => geo.value?.cities ?? []);
const sortedCities = computed(() => [...cities.value].sort((a, b) => (b.orders ?? 0) - (a.orders ?? 0)));
const cityMax = computed(() => Math.max(1, ...sortedCities.value.map((s) => s.orders ?? 0)));
// scroll the full list only when there are enough cities to overflow
const enableScroll = computed(() => sortedCities.value.length > 12);
const scrollCities = computed(() => (enableScroll.value ? [...sortedCities.value, ...sortedCities.value] : sortedCities.value));
const scrollDur = computed(() => Math.max(24, sortedCities.value.length * 1.7));

// ---- animated stat counters (count-up tween) ----
const tween = (getTarget) => {
  const val = ref(0);
  let raf = null;
  watch(getTarget, (to) => {
    if (raf) cancelAnimationFrame(raf);
    const from = val.value;
    const start = performance.now();
    const dur = 900;
    const step = (now) => {
      const p = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - p, 3); // easeOutCubic
      val.value = from + (to - from) * e;
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }, { immediate: true });
  onBeforeUnmount(() => { if (raf) cancelAnimationFrame(raf); });
  return val;
};
// Órdenes / Clientes / Ingresos come from the SAME endpoint as the main dashboard
// (overview) so manually-entered months are included and the numbers match exactly.
const ordersV = tween(() => overview.value?.orders ?? 0);
const customersV = tween(() => overview.value?.customers ?? 0);
const revenueV = tween(() => overview.value?.revenue ?? 0);
// Estados is a purely geographic figure, only the geo endpoint has it.
const statesV = tween(() => geo.value?.totals?.states_active ?? 0);

const statCards = computed(() => [
  { key: "orders", label: t.value.orders, display: fmtInt(ordersV.value), color: "text-primary-600" },
  { key: "customers", label: t.value.customers, display: fmtInt(customersV.value), color: "text-violet-600" },
  { key: "revenue", label: t.value.revenue, display: "$" + compact(revenueV.value), color: "text-emerald-600" },
  { key: "states", label: t.value.statesActive, display: fmtInt(statesV.value), color: "text-amber-600" },
]);

// ---- fullscreen ----
const isFullscreen = ref(false);
const toggleFullscreen = () => {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
  else document.exitFullscreen?.();
};
const onFsChange = () => { isFullscreen.value = !!document.fullscreenElement; };

// ---- fetch + live refresh ----
const q = () => ({ query: { range: range.value } });
const fetchGeographic = async () => {
  try { geo.value = (await $customFetch("/admin/dashboard/v3/geographic", q())).data; }
  catch (e) { console.error("v3 geographic", e); }
};
const fetchOverview = async () => {
  try { overview.value = (await $customFetch("/admin/dashboard/v3/overview", q())).data; }
  catch (e) { console.error("v3 overview", e); }
};
const fetchAll = () => { fetchGeographic(); fetchOverview(); };
const setRange = (r) => { range.value = r; fetchAll(); };

let timer = null;
onMounted(() => {
  fetchAll();
  timer = setInterval(fetchAll, 60000); // keep the wall live
  document.addEventListener("fullscreenchange", onFsChange);
});
onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
  document.removeEventListener("fullscreenchange", onFsChange);
});
</script>

<style scoped>
/* seamless vertical auto-scroll of the doubled city list */
.city-track {
  animation-name: scrollY;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  will-change: transform;
}
.city-scroll:hover .city-track {
  animation-play-state: paused;
}
@keyframes scrollY {
  from { transform: translateY(0); }
  to { transform: translateY(-50%); }
}
</style>
