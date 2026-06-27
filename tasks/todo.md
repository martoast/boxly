# Dashboard "Alcance geográfico" — show ALL order locations

## Problem
- Map only plots cities that exist in a hardcoded ~51-city `COORDS` table in `components/admin/CitiesMap.vue`. Every other city is counted as "X ciudades sin ubicar en el mapa" (72 right now) and NOT drawn.
- Sidebar "Ciudades principales" is `.slice(0, 8)` — only top 8 shown.
- API already returns ALL cities + their `estado` + order counts, no limit. So this is 100% a frontend fix. No API repo change.

## Plan (app repo only)
1. **CitiesMap.vue — guarantee every city gets a point.**
   - Add a `STATE_COORDS` table of the 32 Mexican state centroids (small, fixed, no external API).
   - Add `resolveCenter(city)`: use precise city coords if known; otherwise fall back to the city's `estado` centroid, nudged by a city-seeded offset so distinct cities in the same state form separate clusters instead of stacking.
   - Rewrite `buildGeoJson()` to plot any city that resolves to a center. "unlocated" now only counts cities whose estado is also unknown (≈0).
2. **dashboard/index.vue — sidebar shows all cities, scrollable.**
   - Remove `.slice(0, 8)` so the list contains every city, sorted by orders.
   - Make the list container scrollable (`max-h` + `overflow-y-auto`).
   - Relabel "Ciudades principales" → "Todas las ciudades" / "All cities".

## Notes
- State-centroid fallback chosen over an external geocoding service: zero new dependency/cost, and it makes coverage complete since the API gives `estado` for every order. Cities with exact coords still plot exactly.

## Review
Done — frontend only, no API change.

- `components/admin/CitiesMap.vue`
  - Added `STATE_COORDS` (32 Mexican state centroids).
  - Added `resolveCenter(c)`: exact city coords when known, else estado centroid + per-city seeded offset (±0.4°) so cities in the same state don't stack.
  - `buildGeoJson()` now plots every city that resolves to a centre; `unlocated` only counts cities whose estado is also unknown (≈0 in practice). Dot capping/revenue chunking logic unchanged.
- `pages/app/admin/dashboard/index.vue`
  - `topCities` no longer `.slice(0, 8)` — lists all cities, sorted by orders desc.
  - Sidebar list is scrollable (`max-h-[400px] overflow-y-auto`), header shows the count.
  - Label "Ciudades principales" → "Todas las ciudades" / "All cities".

Net effect: the map shows a point for (essentially) every order, the "72 sin ubicar" banner drops to ~0, and the sidebar scrolls through all cities. Two separate repos noted — only the `app` repo was touched.

---

# Part 2 — Dedicated full-screen "Live Map" wall page (for the office TV)

## Goal
Turn the geo visualization into its own premium, full-screen page to flex on a TV.
Light premium theme · auto-scrolling city list · 30D/90D/1Y/ALL filter (default ALL).

## Done
- `components/admin/CitiesMap.vue` — added backward-compatible presentation props
  (`height`, `mapStyle`, `dotColor`, `dotStroke`, `showNav`, `showCaption`, `glow`,
  `center`, `zoom`). Defaults preserve the dashboard's existing look exactly. Added an
  optional soft "glow" halo layer beneath the dots.
- `pages/app/admin/wall/index.vue` — NEW page on the `empty` layout (no sidebar chrome),
  `/app/admin/wall`, auth+admin protected. Full-bleed map with frosted-glass overlays:
  live brand bar, range filter (default ALL), fullscreen toggle (Fullscreen API) + exit,
  auto-scrolling city leaderboard (CSS marquee, pauses on hover, only scrolls when >12
  cities), and animated count-up stat cards (Órdenes/Clientes/Ingresos/Estados). Polls
  the geographic endpoint every 60s so the wall stays live.
- `components/AdminSidebar.vue` — added "Mapa en vivo / Live Map" nav item (GlobeAmericasIcon).

## Verification
- `yarn dev` compiles clean; `GET /app/admin/wall` → 200, no Vue/Vite errors.
- Could not grab a live screenshot (Chrome extension not connected + page is admin-gated).
