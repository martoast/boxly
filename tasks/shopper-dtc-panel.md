# Shopper panel — the DTC dead-end (ALDO)

## What Alex saw

Opened an ALDO shoe, waited a long time, and the panel came back showing only
ALDO — the store he was already on. v0.30.0 made that *honest* (it's labelled
"misma tienda" now) but it didn't make it *fast*.

## What I measured (prod, 2026-07-30)

Cold panel on youngla.com: **23.7s** end to end. The legs, timed directly
against `api.boxly.mx`:

| Leg | Cold | Warm |
|---|---|---|
| `/products/search` (SerpAPI) | 4.4s | 0.26s |
| `/products/details` (token → merchant link) | 1.6s | — |
| `/products/extract` (ScraperAPI, real price) | 6.3s | — |

`verifyPrices` runs 3 listings in parallel, but each is a **two-hop chain**
(details → extract) ≈ 8s. It is the LAST thing the endpoint does, and nothing
returns until it finishes.

## The root cause

Verification is the only thing that licenses a savings claim:

- `panel.js bestListing()` skips any listing where `!l.verified`
- the row badge renders `"% menos"` only when `l.verified`, otherwise
  "precio de referencia"

But `panel.post.ts` verifies **the 3 cheapest listings unconditionally** —
including listings priced *above* the page the shopper is on. Those can never
produce a badge or a hero. We pay ~8s to confirm prices we will never claim
anything about.

On ALDO the $54.98-vs-$79.98 listing **should** be verified — that's the whole
value. On a page where the shopper is already at the best price, we verify
three listings and show zero savings.

## Plan

- [x] **Verify only what could be claimed.** Filter to listings strictly
      cheaper than the effective page price before slicing to 3. No cheaper
      candidate → skip the step entirely.
      - Effective price = `pagePrice ?? usPrice` — on a localized page
        `pagePrice` is still null inside the cold block, but `usPrice` is
        already resolved there.
      - **Keep today's behaviour when there is no price at all.** With no page
        price nothing can be compared, but `bestListing()` still surfaces the
        cheapest verified listing, so verification is still doing real work.
- [x] **Log what was skipped**, on the existing latency line. An optimization
      that silently stops verifying is indistinguishable from a bug.
- [x] **Re-measure** — see Review.

## Explicitly NOT doing

- **Streaming / two-phase response.** Would fix more, but it changes the
  extension protocol and the panel's render path — too big for this problem.
- **Comparing against *similar* products on generic brands.** The obvious
  "make DTC pages useful" idea, and it breaks the rule Alex set: false savings
  are worse than no savings.
- **Touching search or vision curation.** Not measured yet — don't guess.

## Review

**Change:** `server/api/shopper/panel.post.ts`, ~8 lines.

`byPrice` is sorted ascending, so listings cheaper than the page are exactly its
prefix — the count of them IS the verification limit. `verifyPrices` still
receives the whole list and still returns every listing; only the limit moved.

```ts
const basePrice = pagePrice ?? usPrice
const claimable = basePrice
  ? byPrice.filter((l) => typeof l.price === 'number' && l.price < basePrice).length
  : byPrice.length
const verified = await verifyPrices(byPrice, api, Math.min(3, claimable))
```

The latency log now carries `verify=<ms>(<checked>/<claimable> cheaper than <price>)`.

**Tested** — real `verifyPrices` with a stubbed `api()`, counting upstream calls
(`scratchpad/verify.test.mjs`, bundled through esbuild since the Nuxt server
utils use extensionless imports):

| Case | Verified | Upstream calls | Cost |
|---|---|---|---|
| ALDO — one cheaper same-store variant | 1/2 | 2 | ~8s (earns its keep) |
| DTC — page already the best price | 0/3 | **0** (was 6) | **~0s** |
| Multi-retailer — 4 cheaper, capped | 3/5 | 6 | ~8s (unchanged) |
| Localized MX page — `usPrice` stands in | 1/2 | 2 | ~8s |
| No price at all — unchanged behaviour | 3/4 | 6 | ~8s |

No listings dropped in any case.

**End-to-end re-measurement not done.** The local Laravel API on :8001 wasn't
running, and prod still has the old code. The 8s figure is the measured cost of
one details→extract chain against `api.boxly.mx`, not a re-timed panel. Worth
confirming from the `[shopper] cold panel` log line after deploy.

---

# Follow-up: price verification was broken in prod

Re-measuring against the local stack surfaced something bigger than latency.

`/products/extract` was returning **422 "Could not reach the product page"** for
Foot Locker, Nordstrom and DICK'S — so `verified` was false for every listing at
those retailers, so the panel showed "precio de referencia" and **no saving**,
at exactly the stores where the saving lives. v0.29.0's verification was, in
practice, not working for big-box retail.

**Not credits** — 99,101 of 100,000 remaining. (Checked first, deliberately: I
misdiagnosed a ScraperAPI failure as credits once before.)

Two root causes, both confirmed by calling ScraperAPI directly:

1. **The standard proxy pool is refused by protected retailers**, and it says so
   in two different ways — Foot Locker `403 "requires the use of our Ultra
   Premium Proxies"`, Nordstrom `500 "Protected domains…"` after ~53s. Passing
   `ultra_premium=true` returns `200` with the real price.
2. **Foot Locker's JSON-LD is a `ProductGroup`** with no top-level `offers` —
   the price sits on each `hasVariant`. `parseJsonLd()` only accepted `Product`,
   so it reported "could not parse" on a page that states its price 13 times.

## Fixes

`api/` — `ProductExtractController`:
- `fetch()` retries once on `ultra_premium=true`, but only where the *proxy*
  failed (timeout, 5xx, or the explicit 403). A 404 never retries — a dearer
  proxy fetches the same 404. `SCRAPERAPI_ULTRA=false` disables it.
- Ultra timeout 45s (vs 12s): Nordstrom needs ~24s, so the old cap would have
  rejected every success it buys.
- `parseJsonLd()` accepts `ProductGroup` and reads the variant offer matching
  the requested URL (`variantOffer()`), falling back to the first priced one.

`app/` — `verifyPrices()` extract timeout 25s → 35s, or the app aborts just
before the slower pool answers.

## Measured, local stack, before → after

| Panel | Before | After |
|---|---|---|
| YoungLA (DTC, page is best price) | 19.5s | **3.6s** |
| ALDO (generic fashion) | 14.4s | **3.2s** |
| New Balance (4 cheaper listings) | 56.9s, **0 verified** | 39.9s, **2 verified** |

New Balance now surfaces `Nordstrom $124.99 — 22% menos`, verified live. That
hero was previously impossible: the chain 422'd every time.

Retry paths tested individually: Foot Locker (403 → ultra, 200 @1.4s, price 115),
Nordstrom (timeout → ultra, 200 @12.9s), and a deliberately bad ALDO URL
(422 @2.1s, **no** ultra retry — doesn't pay for a known-dead page).

## Still open

- **~40s on panels that DO have savings.** Verification is a serial
  details→extract chain and ultra premium is slow (DICK'S exceeded even the 35s
  cap). This is now the main latency problem, and it is the opposite trade from
  the one above: those panels are the valuable ones.
- **Credit cost of ultra premium is unmeasured.** ScraperAPI's `/account`
  endpoint appears to lag — it reported 0 credits spent across three panels,
  which cannot be right. Don't trust that number; watch the real balance over a
  day. Ultra is documented as substantially dearer per request.

---

**Known tradeoff.** We no longer catch a listing whose indexed price is stale
*high* but is really cheaper live. Previously the 3 cheapest were checked
regardless, so such a listing could be rescued if it happened to be in that
window. Google's index skews stale-*low* (expired sales), which is the direction
that burns a customer, and that case is still fully covered. The rescue was
costing ~8s on every panel.
