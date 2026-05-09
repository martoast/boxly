# Boxly Storefront Performance — Roadmap

**North star:** Mexican shopper on a slow LTE connection sees the catalog *instantly* — fonts and layout in <500ms, first products in <1s, full grid in <2s. Image-heavy pages feel like an app, not a website. Repeat visits are near-instant.

---

## Audit findings (the why)

I dug into the actual codebase + the live prod stack. Five things stood out — most are quick wins:

### 1. Images are NOT going through the Spaces CDN

Prod images are served from `envioscomercialestj.sfo3.digitaloceanspaces.com` — that's the **direct origin** in San Francisco. The CDN endpoint is `envioscomercialestj.sfo3.cdn.digitaloceanspaces.com` — same files, same auth, but DigitalOcean fronts it with **Cloudflare's global edge network**. I checked the DNS:

```
sfo3.digitaloceanspaces.com      → 138.68.34.161  (DO origin only)
sfo3.cdn.digitaloceanspaces.com  → Cloudflare IPs (172.64.x, 104.18.x)
```

For a Mexico shopper, every product image right now is going from CDMX → San Francisco and back (~120ms RTT minimum). Through the CDN, it'd hit a Cloudflare edge in **MEX, GDL, or QRO** (~10-30ms RTT) on cached requests. **Same files, just a different hostname.** This is the single biggest win available.

### 2. API responses say `Cache-Control: no-cache, private`

The prod API is *already behind Cloudflare* (`server: cloudflare`, `cf-cache-status: MISS`). But every response sets `cache-control: no-cache, private`, so Cloudflare's edge cache never engages. We're paying for the CDN and turning it off. `/store/products`, `/store/categories`, `/store/stores`, `/store/genders` are all public, change rarely, and would be perfect cache candidates.

### 3. `three.js` is 600KB of dead weight

`package.json` includes `three: ^0.173.0`. Grepping the entire codebase: **0 imports**. It's not used anywhere. That's ~600KB minified that ships in our deps.

### 4. `pdf-lib` (~300KB) is loaded eagerly but only used for one tax form

Used only in `composables/useForm1583.ts` for generating USPS Form 1583. Currently imported at the top of the file, so it bundles into anything that touches the composable. Should be a dynamic import — only ~5 customers per month need this.

### 5. Mapbox loads on every page including `/shop`

`plugins/mapboxgl.js` imports `mapbox-gl` + its CSS at module level. Mapbox is only used in `/app/account/shipping-address.vue`, `/components/CustomPlacesAutoComplete.vue`, and `/components/CheckoutStep4.vue` — none of which run on the public storefront. This is ~450KB of JS + CSS shipping to every shop page for no reason.

### Other findings (less urgent but real)

- No `<link rel="preconnect">` for the API or image CDN. Each first request pays full DNS + TLS handshake (~150-300ms in Mexico).
- `pages/shop/categories.vue` does an N+1: for each category without a configured cover, it fires a separate `/store/products?category_id=X&per_page=1` query. With 11 categories that's potentially 11 extra requests on the categories landing.
- No PWA / service worker / offline support.
- No image resizing pipeline — admins upload original-res photos (up to 10MB), customers download them at full size on mobile.
- `<NuxtLink>` prefetching is on by default (good!), but we could go further with hover-prefetch for product cards.
- Frontend is on Netlify (which has a Mexico edge in its CDN) but `cache-control: no-cache` is also set on the HTML, so even SSR'd pages aren't being edge-cached.

---

## The plan, ordered by **impact ÷ effort**

### Tier 1 — Free wins (ship this week)

These are 1-line code changes or config tweaks that compound to a *massive* perceived improvement, especially for Mexico.

**T1.1 — Route images through the Spaces CDN** (≈2h)
- Update `api/config/filesystems.php` `spaces.url` env to `https://envioscomercialestj.sfo3.cdn.digitaloceanspaces.com` (note the added `.cdn`).
- One-shot artisan migration to rewrite existing image URLs in: `products.images` (JSON), `stores.logo_url`, `stores.cover_image_url`, `categories.image_url`, `genders.image_url`, `purchase_request_items.image_url`. Simple `str_replace` on each row.
- New uploads will use the CDN URL automatically once the env var changes.
- **Expected win:** -100 to -200ms per image for Mexico users on first load. Subsequent loads from Cloudflare edge cache are ~10ms (vs origin's ~150ms).

**T1.2 — Make `/store/*` API responses cacheable** (≈3h)
- Add a tiny middleware that sets `Cache-Control: public, max-age=300, s-maxage=3600, stale-while-revalidate=86400` on `/store/products`, `/store/products/{slug}`, `/store/categories`, `/store/stores`, `/store/genders`, `/store/hero`.
- 5 min browser cache, 1 hour shared (Cloudflare) cache, 24 hour stale-while-revalidate window.
- Add cache-busting on writes: when an admin updates a product/category/store/gender, hit the Cloudflare API to purge `/store/*`. (We have the Cloudflare zone already since the API is behind it.)
- **Expected win:** Cold catalog page load drops from ~400ms (PHP+SQL roundtrip) to ~30ms (Cloudflare edge HIT). Repeat visitors don't even hit the network for 5 minutes.

**T1.3 — Add `preconnect` + `dns-prefetch` hints to the shop layout** (≈30min)
- In `layouts/shop.vue`, add `useHead` with `<link rel="preconnect">` to:
  - `https://api.boxly.mx`
  - `https://envioscomercialestj.sfo3.cdn.digitaloceanspaces.com`
- Plus `<link rel="dns-prefetch">` for the same hosts as a fallback.
- Browser warms TLS + DNS in parallel with HTML parse instead of serially when the first image/api call fires.
- **Expected win:** 100-200ms shaved off first image / first API call.

**T1.4 — Drop `three.js` from `package.json`** (≈5min)
- Confirmed unused. Remove the line, run `yarn install`.
- **Expected win:** ~600KB off the dependency tree. Some of that may have been tree-shaken already, but the dev-time install is faster and the bundle analyzer no longer has to inspect it.

**T1.5 — Lazy-load `pdf-lib`** (≈30min)
- In `composables/useForm1583.ts`, change `import { PDFDocument } from 'pdf-lib'` to a dynamic `await import('pdf-lib')` inside the function that needs it.
- The 1583 form runs maybe 5 times a month. No reason to bundle ~300KB into the storefront for it.
- **Expected win:** ~300KB off any route that transitively imports useForm1583.

**T1.6 — Make the mapbox plugin route-scoped** (≈1h)
- Move the `import 'mapbox-gl/dist/mapbox-gl.css'` and `import mapboxgl from 'mapbox-gl'` out of `plugins/mapboxgl.js`.
- Inline the imports inside `CustomPlacesAutoComplete.vue` and `CheckoutStep4.vue` as dynamic imports (`onMounted(async () => { const mb = await import('mapbox-gl'); ... })`).
- Or: make the plugin a "client-side, conditional" plugin that only registers when navigating to a route that needs it.
- **Expected win:** ~450KB off every shop page bundle. Mapbox doesn't load until checkout.

**T1.7 — Cache the Netlify-served HTML for shop landings** (≈30min)
- Add `routeRules` in nuxt.config:
  ```ts
  routeRules: {
    '/shop':            { headers: { 'cache-control': 'public, max-age=60, stale-while-revalidate=600' } },
    '/shop/categories': { headers: { 'cache-control': 'public, max-age=300, stale-while-revalidate=3600' } },
    '/shop/brands':     { headers: { 'cache-control': 'public, max-age=300, stale-while-revalidate=3600' } },
  }
  ```
- The catalog grid (`/shop?view=all`) is harder to cache since it's filter-dependent — leave it for now.
- **Expected win:** Repeat visits to shop landing serve instantly from Netlify edge.

**Tier 1 totals: ~7 hours of work, payoff is massive on Mexico-cellular.**

---

### Tier 2 — Big wins (ship over 1-2 weeks)

**T2.1 — Image transformation pipeline** (≈2-3 days)

Today's flow: admin uploads a 4MB iPhone photo → stored at full resolution → mobile shopper downloads 4MB. Two paths to fix:

**Option A — Cloudflare Images** (recommended, lowest effort)
- $5/mo + $1 per 100K transformations.
- Update image URLs from `sfo3.cdn.digitaloceanspaces.com/products/.../img.jpg` to `https://imagedelivery.net/{account}/{...}/public` style URLs.
- Auto WebP/AVIF, auto-resize, edge-cached globally.
- Migration: bulk-import existing Spaces images into Cloudflare Images, swap URLs in the DB.

**Option B — Server-side resize on upload** (more code, no recurring cost)
- On admin upload, generate sm (400px), md (800px), lg (1200px), xl (original) variants.
- Convert to WebP + keep original as fallback.
- Store all variants in Spaces.
- Return srcset-ready data: `{ url, url_sm, url_md, url_lg, blur }` per image.

**Frontend** for either option: update `<StoreImage>` to render `<img srcset="... 400w, ... 800w, ... 1200w" sizes="(max-width: 768px) 50vw, 25vw">` so the browser picks the right size for the viewport.

- **Expected win:** Mobile catalog page goes from ~5-15MB of images to ~500KB-1.5MB. This is the biggest single mobile-bandwidth win available.

**T2.2 — LQIP (real blurry placeholders, not just shimmer)** (≈1 day, depends on T2.1)
- On image upload (or as a one-shot job), generate a tiny ~24×24 px blurred preview, base64-encoded (~1KB).
- Return it as a `blur` field on each image in API responses.
- `<StoreImage>` renders the base64 blur as a CSS `background-image` while the real image loads. When real image loads, fade over.
- This is what Spotify/Pinterest/Notion do — placeholder is an actual blurred preview of the real image, not a generic shimmer.
- Pairs naturally with T2.1.
- **Expected win:** Pages feel "loaded" the moment SSR HTML arrives, even before any image bytes have downloaded.

**T2.3 — Hover-prefetch on product cards** (≈4h)
- On `mouseenter` of a `ProductCard`, kick off a `$customFetch('/store/products/{slug}')` (cached by Nuxt's data cache).
- When the user clicks, the detail page already has the data — instant transition.
- Same trick for category links in nav, brand links.
- Also intersection-prefetch the "next page" of the catalog grid when the user scrolls within 200px of the bottom.
- **Expected win:** Click → render of product detail goes from ~600ms to ~50ms. Subjectively feels native-app fast.

**T2.4 — Fix the N+1 on `/shop/categories`** (≈3h)
- The categories page currently fires one `/store/products?category_id=X&per_page=1` request per category to fetch a cover image fallback.
- Add a `cover_image_first_product_url` accessor on the Category model OR (better) pre-compute it as a `cover_image_url` column that gets refreshed when products are added/removed.
- Backend change is small; frontend gets a clean single-fetch payload.
- **Expected win:** /shop/categories first paint goes from ~12 round-trips to 1.

**T2.5 — Service worker for offline-tolerant catalog** (≈2 days)
- Add `@vite-pwa/nuxt` module, config it for cache-first on `/store/categories`, `/store/genders`, `/store/stores` (very stable data) and stale-while-revalidate on `/store/products`.
- Cache hashed JS/CSS bundles forever.
- Cache the last-visited product detail pages so going back through the browser is offline-safe.
- App becomes browseable on an iffy LTE connection — even when the network drops mid-tap, the previous catalog is still there.
- **Expected win:** Boxly becomes "installable" (Add to Home Screen). Repeat visits are essentially instant — cached HTML serves while we revalidate in the background.

**Tier 2 totals: ~5-7 days of work, takes us from "fast" to "elite."**

---

### Tier 3 — Architectural plays (worth considering, weeks of work each)

**T3.1 — Edge-rendered SSR**
- The frontend is on Netlify. Netlify Edge Functions run Nuxt SSR at edge nodes (including Mexico).
- Currently: Mexico shopper's HTML round-trip goes Mexico → Netlify origin (likely US-East) → back. ~150-300ms TTFB.
- With edge SSR: Mexico → Netlify Mexico edge → back. ~30-50ms TTFB.
- Configuration is `defineRouteRules({ swr: 60 })` plus deploying with `NITRO_PRESET=netlify_edge`.
- **Expected win:** TTFB on shop landing drops by ~150ms for Mexico users. Material for above-fold paint.

**T3.2 — Real User Monitoring (RUM)**
- Add the `web-vitals` library (~3KB) to capture LCP, CLS, INP, FCP, TTFB on real user sessions.
- Send to either:
  - Cloudflare Web Analytics (free, simple, but limited filtering)
  - A custom `/metrics` endpoint on the API that logs to a small Postgres table
  - PostHog or Plausible (~$10-30/mo, much better dashboards)
- Filter by country: we want to see Mexico-specific p75 numbers, not aggregate.
- Without this, we're optimizing in the dark — we can't tell if T1/T2 actually helped real customers.
- **Expected win:** We can prove (or disprove) every change empirically and prioritize the next round based on data.

**T3.3 — Admin-side image optimizer** (paired with T2.1 Option B)
- A queued job that watches for new uploads and runs `sharp` (Node) or `intervention/image` (PHP) to generate variants + WebP + AVIF + LQIP.
- Runs in background — admin upload returns immediately, variants populate within a minute.
- This is a nice-to-have if we go with Option B; not needed if we use Cloudflare Images.

**T3.4 — Streaming SSR for the catalog**
- Nuxt 3 supports streaming HTML — render the layout + above-fold immediately, then stream product cards in as they're queried.
- Most useful when data fetching is slow. Less impactful if T1.2 (API caching) lands first.
- File this as "consider after we measure."

---

## Recommended ship order

I'd do it like this — measurable wins each week, no big-bang risk:

**Week 1** (Free wins): T1.1, T1.2, T1.3, T1.4, T1.5, T1.6, T1.7 — the whole Tier 1 in one go. Maybe split into two PRs (frontend bundle cleanup + backend cache headers + image URL migration). After this, expect catalog page to feel ~2× snappier on Mexico mobile, and repeat-visit catalog to be near-instant.

**Week 2** (Measurement): T3.2 RUM. Before we invest in the image pipeline, we want a baseline so we can prove the win. Pick PostHog or Cloudflare Web Analytics. Measure for 5-7 days.

**Week 3** (Image pipeline): T2.1 (recommend Option A — Cloudflare Images, $5-15/mo is nothing for the win). T2.2 (LQIP) right after.

**Week 4** (Polish): T2.3 (hover prefetch), T2.4 (N+1 fix), T2.5 (PWA).

**Then evaluate:** T3.1 edge SSR, T3.4 streaming. By that point we'll have RUM data showing whether they're worth it.

---

## What I'd push back on

A few things people typically suggest that I think aren't right for Boxly:

- **Removing SSR entirely / going SPA.** Bad for SEO, bad for WhatsApp/social previews. SSR is keeping us on Google + getting the share-card right.
- **Custom fonts.** We're using system fonts and they look fine. Adding a custom font means downloading 50-150KB of font files. Skip unless brand demands it.
- **Heavy state libs (Vuex/Redux).** We're already on Pinia + composables. Tiny footprint. Don't change this.
- **Aggressive code splitting per component.** Diminishing returns past the modal-level splits we've identified. Smaller bundles ≠ always faster — too many requests hurts on cellular.
- **Replacing Tailwind.** It's already JIT-purged, the production CSS is tiny.

---

## TL;DR for the conversation

**Three findings stand out:**
1. We're not using the Spaces CDN. Same files, faster delivery, free. ~2 hour fix.
2. We're paying for Cloudflare in front of the API but blocking it with `Cache-Control: no-cache`. ~3 hour fix.
3. ~1.3MB of unused/misconfigured JS (three, pdf-lib, mapbox) ships on every shop page. ~2 hour fix.

**Tier 1 alone** (a single week of work) gets us most of the way. **Tier 2** (image pipeline + LQIP + PWA) takes us from "fast" to "feels native." **Tier 3** is the cherry on top once we have RUM data to prove what's worth doing.

I'm ready to start on T1.1–T1.7 the moment you give the word — they're independent enough that I can ship them as small focused PRs, easy to review.
