# AI search — "stuck loading forever"

## Symptom
`/app/search`: one product card renders, then "Comparando precios en tiendas de
USA…" spins indefinitely. The conversation row ends up with `messages: []`.

## Root cause (measured 2026-08-07, production)

Direct `curl` to `https://boxly.mx/api/assistant`, no browser:

| query | time | result |
|---|---|---|
| Alo Yoga sudaderas | 29.6s | ✓ `finish` event |
| Gymshark joggers | **30.3s** | ✗ **no finish — stream truncated, HTTP 200** |
| YoungLA promociones | 7.2s | ✓ `finish` event |

**Turns that cross ~30s get their response stream cut mid-flight.** The status is
still 200, so nothing looks like an error; the stream simply stops.

Driver: `POST /products/search` takes **~26s on its own** (measured 25.8s prod,
26.7s local). Add model time and a turn tips past the limit. Whether any given
query survives depends on search latency, which is why it's intermittent.

**NOT the SSR change** — reproduces via curl with no browser or hydration.

### Secondary bug (independent, makes it look worse)
`ShoppingAssistant.vue` lines 325/328/332/342/352 gate loaders on
`part.state !== 'output-available'`, which is also true for `output-error`. Any
tool failure therefore renders an eternal spinner. Line 1226 already excludes
`output-error` when computing `isBusy`, so the bottom typing dots stop while the
inline loader keeps going — the terminal state was known, these were missed.

## Plan — pick a scope

### A. Make failure terminal in the UI — DONE
- [x] Treat `output-error` as terminal in all five loader branches; render a
      short error line instead of a spinner.
- [x] Detect a truncated stream client-side (stream ends with a tool part still
      pending) and surface the same terminal state.
- [x] Give it a "Reintentar" affordance so the turn isn't a dead end.

Fixes the *stuck forever* experience permanently, whatever the backend does.
Does not make any search succeed that doesn't succeed today.

### B. Get `/products/search` under ~10s — DONE (0.6s cold, 0.02s warm)
- [x] Profile the endpoint — where do the 26s go? (Google Shopping upstream?
      per-product enrichment? image fetching? serial calls that could be
      parallel?)
- [x] Cache by (query, store) — repeat searches shouldn't pay full price.
- [ ] (not needed) Consider returning the gallery on a first fast pass and enriching after.

This is the only fix that makes slow turns actually work.

### C. Stop losing the turn when the stream dies
- [ ] Confirm the exact ~30s limit and where it comes from (Netlify function
      timeout — there is no `netlify.toml`, so it's whatever the default is).
      Raise it if configurable.
- [ ] Persist the turn even on truncation so history isn't lost (today
      `onFinish` never runs and the conversation is left empty).
- [ ] Consider a heartbeat/keepalive frame during long tool calls.

## Recommendation
**A now** (it's contained and stops the worst symptom), then **B** — 26s for a
product search is the real defect and it will keep causing this. C is the
belt-and-braces once B lands.

## Review

### What changed

**`api/` — ProductExtractController** (commit 501fbca)
The 26s was `brandOwnCatalog()` → `shopifyProducts()` → `fetch()`, routing a
PUBLIC Shopify `products.json` through ScraperAPI. The cheap pool times out at
12s on these stores, then ultra-premium runs. That endpoint answers a plain GET
in under a second and never needed a proxy.
- Added `fetchDirect()` — plain unproxied GET, 8s cap, null on failure.
  `shopifyProducts` tries it first, proxy only if the store actually blocks us.
- Cached `brandOwnCatalog` per store+limit (30 min; 10 min for an empty result
  so a non-Shopify store doesn't re-pay the lookup on every search).

Measured: Gymshark 26.1s → **0.63s** cold, **0.02s** warm. YoungLA → 0.49s.
Identical results (16 products, correct store).

**`app/` — ShoppingAssistant.vue**
- `toolFailed(m, part)` — a tool is dead if it errored OR is unfinished while
  nothing is running (the truncated-stream case, where the part freezes at
  `input-available` and no frame ever completes it).
- A terminal error row with **Reintentar**, placed BEFORE the loader branches so
  it wins. `retryLastTurn()` re-sends the last user message.
- The five loaders previously gated on `state !== 'output-available'`, which is
  also true for `output-error`. `showTyping` already excluded `output-error` —
  so the bottom dots stopped while the inline loader spun forever. That
  divergence was the tell.

### Note on C
Not needed once B landed — turns no longer approach the ~30s ceiling. The limit
still exists, so A is what keeps a future overrun from hanging the chat. Left
undone deliberately: persisting a truncated turn, and a stream keepalive.
