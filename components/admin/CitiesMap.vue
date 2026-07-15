<template>
  <div class="relative h-full">
    <div ref="mapEl" class="w-full rounded-xl overflow-hidden bg-gray-100" :style="{ height }"></div>
    <div v-if="!token" class="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
      Falta configurar MAPBOX_API_TOKEN
    </div>
    <div v-if="showCaption" class="flex items-center justify-between mt-2">
      <p class="text-[11px] text-gray-400">{{ caption }}</p>
      <p v-if="unlocated > 0" class="text-[11px] text-gray-400">{{ unlocated }} {{ unlocatedLabel }}</p>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  cities: { type: Array, default: () => [] },
  // When non-empty, the map draws ONE dot per row (a client) instead of the
  // count-based scatter. Each row: { id, name, city, estado, lat, lng, orders, revenue }.
  points: { type: Array, default: () => [] },
  metric: { type: String, default: "customers" }, // customers | orders | revenue
  metricLabel: { type: String, default: "" },
  format: { type: String, default: "number" },
  token: { type: String, default: "" },
  unlocatedLabel: { type: String, default: "ciudades sin ubicar en el mapa" },
  // presentation (defaults preserve the dashboard look) ----------------------
  height: { type: String, default: "440px" },
  mapStyle: { type: String, default: "mapbox://styles/mapbox/light-v11" },
  dotColor: { type: String, default: "#2E6BB7" },
  dotStroke: { type: String, default: "#1E4E8C" },
  showNav: { type: Boolean, default: true },
  navPosition: { type: String, default: "top-right" },
  scrollZoom: { type: Boolean, default: false },
  showCaption: { type: Boolean, default: true },
  glow: { type: Boolean, default: false },
  center: { type: Array, default: () => [-102, 23.6] },
  zoom: { type: Number, default: 4.1 },
});

const mapEl = ref(null);
const unlocated = ref(0);
const dotUnit = ref(1);
let map = null;
let mapboxgl = null;
let popup = null;

const MAX_DOTS = 1600;

const norm = (s) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const COORDS = {
  "ciudad de mexico": [-99.1332, 19.4326], "guadalajara": [-103.3496, 20.6597],
  "monterrey": [-100.3161, 25.6866], "toluca": [-99.6557, 19.2826],
  "puebla": [-98.2063, 19.0414], "queretaro": [-100.3899, 20.5888],
  "leon": [-101.682, 21.1219], "tijuana": [-117.0382, 32.5149],
  "merida": [-89.5926, 20.9674], "veracruz": [-96.1342, 19.1738],
  "cancun": [-86.8515, 21.1619], "hermosillo": [-110.9559, 29.0729],
  "chihuahua": [-106.0691, 28.6353], "culiacan": [-107.3943, 24.8091],
  "saltillo": [-101.0053, 25.4232], "aguascalientes": [-102.2916, 21.8853],
  "morelia": [-101.1949, 19.7008], "san luis potosi": [-100.9855, 22.1565],
  "cuernavaca": [-99.2216, 18.9242], "oaxaca": [-96.7266, 17.0732],
  "tuxtla gutierrez": [-93.1029, 16.7531], "villahermosa": [-92.9475, 17.9892],
  "durango": [-104.6532, 24.0277], "mazatlan": [-106.4111, 23.2494],
  "acapulco": [-99.8237, 16.8531], "ciudad juarez": [-106.4245, 31.6904],
  "mexicali": [-115.4683, 32.6245], "ensenada": [-116.5964, 31.8667],
  "torreon": [-103.4068, 25.5428], "tepic": [-104.8942, 21.5039],
  "colima": [-103.7241, 19.2433], "campeche": [-90.5349, 19.8301],
  "chetumal": [-88.2961, 18.5002], "pachuca": [-98.7591, 20.1011],
  "tlaxcala": [-98.2375, 19.3139], "la paz": [-110.3128, 24.1426],
  "zacatecas": [-102.5832, 22.7709], "tampico": [-97.8686, 22.2553],
  "reynosa": [-98.288, 26.0806], "matamoros": [-97.5027, 25.869],
  "nuevo laredo": [-99.5075, 27.4761], "irapuato": [-101.3563, 20.6767],
  "celaya": [-100.8157, 20.523], "cabo san lucas": [-109.9167, 22.8909],
  "playa del carmen": [-87.0739, 20.6296], "puerto vallarta": [-105.2253, 20.6534],
  "naucalpan": [-99.237, 19.4785], "ecatepec": [-99.05, 19.6097],
  "tlalnepantla": [-99.1954, 19.5404], "zapopan": [-103.3848, 20.7236],
  "san pedro garza garcia": [-100.4022, 25.6585],
};

// State centroids — fallback so EVERY city with a known estado lands on the map,
// even when its exact city coords aren't in COORDS above.
const STATE_COORDS = {
  "aguascalientes": [-102.36, 21.88], "baja california": [-115.4, 30.6],
  "baja california sur": [-111.67, 25.5], "campeche": [-90.4, 18.85],
  "chiapas": [-92.5, 16.4], "chihuahua": [-106.0, 28.4],
  "coahuila": [-101.7, 27.3], "coahuila de zaragoza": [-101.7, 27.3],
  "colima": [-103.85, 19.15], "ciudad de mexico": [-99.13, 19.43],
  "durango": [-104.8, 24.8], "guanajuato": [-101.1, 21.0],
  "guerrero": [-99.8, 17.6], "hidalgo": [-98.8, 20.5],
  "jalisco": [-103.5, 20.5], "mexico": [-99.7, 19.35],
  "estado de mexico": [-99.7, 19.35], "michoacan": [-101.7, 19.4],
  "michoacan de ocampo": [-101.7, 19.4], "morelos": [-99.1, 18.75],
  "nayarit": [-104.9, 21.75], "nuevo leon": [-99.9, 25.6],
  "oaxaca": [-96.5, 17.0], "puebla": [-98.0, 19.0],
  "queretaro": [-99.9, 20.8], "queretaro de arteaga": [-99.9, 20.8],
  "quintana roo": [-88.3, 19.6], "san luis potosi": [-100.4, 22.5],
  "sinaloa": [-107.5, 25.0], "sonora": [-110.3, 29.3],
  "tabasco": [-92.6, 17.9], "tamaulipas": [-98.5, 24.3],
  "tlaxcala": [-98.2, 19.4], "veracruz": [-96.4, 19.2],
  "veracruz de ignacio de la llave": [-96.4, 19.2], "yucatan": [-89.1, 20.7],
  "zacatecas": [-102.7, 22.9],
};

// Deterministic pseudo-random so dots don't reshuffle when toggling metrics.
const hash = (s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};
const rand = (seed) => {
  const x = Math.sin(seed) * 43758.5453;
  return x - Math.floor(x);
};

const fmt = (v) =>
  props.format === "currency"
    ? new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(v ?? 0)
    : new Intl.NumberFormat("es-MX").format(v ?? 0);

const isPointMode = computed(() => Array.isArray(props.points) && props.points.length > 0);

const money = (v) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(v ?? 0);

const caption = computed(() => {
  if (isPointMode.value) return "cada punto = 1 cliente";
  return props.format === "currency"
    ? `cada punto ≈ ${fmt(dotUnit.value)}`
    : `cada punto = 1 ${(props.metricLabel || "").toLowerCase().replace(/s$/, "")}`;
});

// Resolve a plotting centre for a city: exact city coords when known, otherwise
// the city's estado centroid nudged by a city-seeded offset so different cities
// in the same state form their own clusters instead of stacking on one point.
const resolveCenter = (c) => {
  // Exact coordinates from the backend (e.g. parsed from a Google Maps link) win.
  if (Number.isFinite(c.lng) && Number.isFinite(c.lat)) return [c.lng, c.lat];
  const exact = COORDS[norm(c.city)];
  if (exact) return exact;
  const est = STATE_COORDS[norm(c.estado)];
  if (!est) return null;
  const seed = hash(c.city + "|" + c.estado);
  const ox = (rand(seed * 1.3) - 0.5) * 0.8;
  const oy = (rand(seed * 2.7) - 0.5) * 0.8;
  return [est[0] + ox, est[1] + oy];
};

// Resolve ONE plotting point for a single client. Exact GPS wins; otherwise the
// city (or its estado centroid) nudged by a CLIENT-seeded offset so different
// clients in the same city each get their own spot instead of stacking.
const resolvePointCenter = (p, i) => {
  if (Number.isFinite(p.lng) && Number.isFinite(p.lat)) return [p.lng, p.lat];
  const city = COORDS[norm(p.city)];
  const base = city || STATE_COORDS[norm(p.estado)];
  if (!base) return null;
  const seed = hash(String(p.id ?? p.name ?? "") + "#" + i);
  const spread = city ? 0.09 : 0.55; // tight around a known city, wide across a state centroid
  return [base[0] + (rand(seed * 1.3) - 0.5) * spread, base[1] + (rand(seed * 2.7) - 0.5) * spread];
};

// One dot per client, radius growing with their order count, tooltip carrying
// their name + order history + total spent.
const buildPointJson = () => {
  const located = [];
  props.points.forEach((p, i) => {
    const c = resolvePointCenter(p, i);
    if (c) located.push({ p, c });
  });
  unlocated.value = props.points.length - located.length;
  dotUnit.value = 1;
  const features = located.slice(0, MAX_DOTS).map(({ p, c }) => {
    const orders = p.orders ?? 0;
    const r = 3 + Math.min(8, Math.sqrt(Math.max(1, orders)) * 1.6);
    return {
      type: "Feature",
      geometry: { type: "Point", coordinates: c },
      properties: {
        name: p.name || "Cliente",
        city: p.city || "",
        estado: p.estado || "",
        orders,
        revenue: money(p.revenue ?? 0),
        radius: r,
        glowRadius: r * 2.2,
      },
    };
  });
  return { type: "FeatureCollection", features };
};

const buildGeoJson = () => (isPointMode.value ? buildPointJson() : buildScatterJson());

const buildScatterJson = () => {
  const metric = props.metric;
  const active = props.cities.filter((c) => (c[metric] ?? 0) > 0);
  const located = active
    .map((c) => ({ c, center: resolveCenter(c) }))
    .filter((x) => x.center);
  unlocated.value = active.length - located.length;

  // For revenue, one dot per chunk so the country isn't a single mass of dots.
  const total = located.reduce((s, x) => s + (x.c[metric] ?? 0), 0);
  let unit = 1;
  if (metric === "revenue") unit = Math.max(1, Math.round(total / 600));
  dotUnit.value = unit;

  // Cap total dots for performance.
  let dotsWanted = located.reduce((s, x) => s + Math.max(1, Math.round((x.c[metric] ?? 0) / unit)), 0);
  const scale = dotsWanted > MAX_DOTS ? MAX_DOTS / dotsWanted : 1;

  const features = [];
  for (const { c, center } of located) {
    const [lng, lat] = center;
    const n = Math.max(1, Math.round(((c[metric] ?? 0) / unit) * scale));
    const seedBase = hash(c.city + c.estado);
    const spread = 0.06 + Math.min(0.16, Math.sqrt(n) * 0.012); // bigger cities spread a touch more
    for (let i = 0; i < n; i++) {
      // two samples averaged -> tighter, centre-weighted cluster
      const jx = ((rand(seedBase + i * 2.1) + rand(seedBase + i * 7.3)) / 2 - 0.5) * 2 * spread;
      const jy = ((rand(seedBase + i * 3.7) + rand(seedBase + i * 11.9)) / 2 - 0.5) * 2 * spread;
      features.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: [lng + jx, lat + jy / 1.15] },
        properties: { city: c.city, estado: c.estado, val: fmt(c[metric] ?? 0) },
      });
    }
  }
  return { type: "FeatureCollection", features };
};

const refreshData = () => {
  if (map && map.getSource("dots")) map.getSource("dots").setData(buildGeoJson());
};

onMounted(async () => {
  if (!props.token || !mapEl.value) return;
  mapboxgl = (await import("mapbox-gl")).default;
  await import("mapbox-gl/dist/mapbox-gl.css");
  mapboxgl.accessToken = props.token;

  map = new mapboxgl.Map({
    container: mapEl.value,
    style: props.mapStyle,
    center: props.center,
    zoom: props.zoom,
    attributionControl: false,
  });
  if (props.showNav) map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), props.navPosition);
  if (!props.scrollZoom) map.scrollZoom.disable();
  popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 10 });

  map.on("load", () => {
    map.addSource("dots", { type: "geojson", data: buildGeoJson() });
    // soft halo beneath the dots — gives the "glowing" look on the wall display
    if (props.glow) {
      map.addLayer({
        id: "dots-glow",
        type: "circle",
        source: "dots",
        paint: {
          // per-feature glowRadius (client mode) else zoom-scaled (scatter mode)
          "circle-radius": ["coalesce", ["get", "glowRadius"], ["interpolate", ["linear"], ["zoom"], 3, 6, 6, 11, 9, 18]],
          "circle-color": props.dotColor,
          "circle-opacity": 0.16,
          "circle-blur": 1,
        },
      });
    }
    map.addLayer({
      id: "dots",
      type: "circle",
      source: "dots",
      paint: {
        // per-feature radius (client mode, grows with order count) else zoom-scaled (scatter)
        "circle-radius": ["coalesce", ["get", "radius"], ["interpolate", ["linear"], ["zoom"], 3, 2.2, 6, 3.4, 9, 5]],
        "circle-color": props.dotColor,
        "circle-opacity": 0.55,
        "circle-stroke-width": 0.4,
        "circle-stroke-color": props.dotStroke,
      },
    });

    map.on("mousemove", "dots", (e) => {
      map.getCanvas().style.cursor = "pointer";
      const p = e.features[0].properties;
      // Client mode: name + order history + total spent. Scatter mode: city + metric value.
      const html = p.name !== undefined
        ? `<div style="font-family:inherit"><div style="font-weight:600;color:#111">${p.name}</div><div style="font-size:12px;color:#6b7280">${p.city}${p.estado ? " · " + p.estado : ""}</div><div style="font-size:12px;color:#374151;margin-top:2px"><b>${p.orders}</b> ${Number(p.orders) === 1 ? "pedido" : "pedidos"} · ${p.revenue}</div></div>`
        : `<div style="font-family:inherit"><div style="font-weight:600;color:#111">${p.city}</div><div style="font-size:12px;color:#6b7280">${p.estado}</div><div style="font-size:12px;color:#374151;margin-top:2px">${props.metricLabel}: <b>${p.val}</b></div></div>`;
      popup.setLngLat(e.lngLat).setHTML(html).addTo(map);
    });
    map.on("mouseleave", "dots", () => {
      map.getCanvas().style.cursor = "";
      popup.remove();
    });
  });
});

watch(() => [props.metric, props.cities, props.points], refreshData, { deep: true });

onBeforeUnmount(() => { if (map) map.remove(); });
</script>
