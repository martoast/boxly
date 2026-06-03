<template>
  <div class="relative">
    <div ref="mapEl" class="w-full h-[440px] rounded-xl overflow-hidden bg-gray-100"></div>
    <div v-if="!token" class="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
      Falta configurar MAPBOX_API_TOKEN
    </div>
    <div class="flex items-center justify-between mt-2">
      <p class="text-[11px] text-gray-400">{{ caption }}</p>
      <p v-if="unlocated > 0" class="text-[11px] text-gray-400">{{ unlocated }} {{ unlocatedLabel }}</p>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  cities: { type: Array, default: () => [] },
  metric: { type: String, default: "customers" }, // customers | orders | revenue
  metricLabel: { type: String, default: "" },
  format: { type: String, default: "number" },
  token: { type: String, default: "" },
  unlocatedLabel: { type: String, default: "ciudades sin ubicar en el mapa" },
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

const caption = computed(() =>
  props.format === "currency"
    ? `cada punto ≈ ${fmt(dotUnit.value)}`
    : `cada punto = 1 ${(props.metricLabel || "").toLowerCase().replace(/s$/, "")}`
);

const buildGeoJson = () => {
  const metric = props.metric;
  const located = props.cities.filter((c) => (c[metric] ?? 0) > 0 && COORDS[norm(c.city)]);
  unlocated.value = props.cities.filter((c) => (c[metric] ?? 0) > 0 && !COORDS[norm(c.city)]).length;

  // For revenue, one dot per chunk so the country isn't a single mass of dots.
  const total = located.reduce((s, c) => s + (c[metric] ?? 0), 0);
  let unit = 1;
  if (metric === "revenue") unit = Math.max(1, Math.round(total / 600));
  dotUnit.value = unit;

  // Cap total dots for performance.
  let dotsWanted = located.reduce((s, c) => s + Math.max(1, Math.round((c[metric] ?? 0) / unit)), 0);
  const scale = dotsWanted > MAX_DOTS ? MAX_DOTS / dotsWanted : 1;

  const features = [];
  for (const c of located) {
    const [lng, lat] = COORDS[norm(c.city)];
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
    style: "mapbox://styles/mapbox/light-v11",
    center: [-102, 23.6],
    zoom: 4.1,
    attributionControl: false,
  });
  map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
  map.scrollZoom.disable();
  popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 10 });

  map.on("load", () => {
    map.addSource("dots", { type: "geojson", data: buildGeoJson() });
    map.addLayer({
      id: "dots",
      type: "circle",
      source: "dots",
      paint: {
        // grow slightly with zoom so clusters read at every level
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 2.2, 6, 3.4, 9, 5],
        "circle-color": "#2E6BB7",
        "circle-opacity": 0.5,
        "circle-stroke-width": 0.4,
        "circle-stroke-color": "#1E4E8C",
      },
    });

    map.on("mousemove", "dots", (e) => {
      map.getCanvas().style.cursor = "pointer";
      const p = e.features[0].properties;
      popup
        .setLngLat(e.lngLat)
        .setHTML(`<div style="font-family:inherit"><div style="font-weight:600;color:#111">${p.city}</div><div style="font-size:12px;color:#6b7280">${p.estado}</div><div style="font-size:12px;color:#374151;margin-top:2px">${props.metricLabel}: <b>${p.val}</b></div></div>`)
        .addTo(map);
    });
    map.on("mouseleave", "dots", () => {
      map.getCanvas().style.cursor = "";
      popup.remove();
    });
  });
});

watch(() => [props.metric, props.cities], refreshData, { deep: true });

onBeforeUnmount(() => { if (map) map.remove(); });
</script>
