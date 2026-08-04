# Take resolution off the shopper's request path

## The measurement that forced this

Production, 2026-08-04, cold products:

| product | result |
|---|---|
| Sony WH-1000XM5 | **502 at 30.34s** |
| Sony WH-1000XM5 (retry) | 200 in 26.3s — 0 listings, 0 used |
| New Balance 2010 | 200 in 22.9s — 0 listings, 0 used |
| Owala FreeSip 24 oz | 200 in 22.9s — 0 listings, 0 used |

Upstream `/products/search` on the Laravel API, same day:

```
Owala FreeSip 24 oz    0.68s   (warm — Laravel caches per query)
Sony WH-1000XM5        2.63s   (warm)
Nike Air Force 1      18.20s   (cold)
New Balance 2010      24.73s   (cold)
```

The panel allows that call 20s (`panel.post.ts:413`), and `api()` turns a timeout
into `null` (`panel.post.ts:72`) — indistinguishable from "found nothing". Then
it runs a second search for `used`, a third if it broadens, plus thumbs, vision
and verify. Netlify kills the function at 30s.

**The work does not fit in the request.** Every mitigation so far has been
shaving a race we keep losing.

## Why the index couldn't save us

`panel.post.ts:535`:

```js
if (!cacheOff() && (listings.length || offers.length)) {
  await storage.setItem(key, base, ...)
  await indexPut(idxKey, base, ...)
}
```

The write is gated on results. Searches time out → zero results → the write
never fires. The index is not broken, it is **starved**: a cache for an answer
that never arrives. It has therefore never been exercised in production, so the
Netlify↔DigitalOcean secret is still unverified.

## The shape of the fix

Laravel has no 30s ceiling and already owns the expensive part (`/products/search`,
and its per-query SerpAPI cache in `multiShopping`). Nuxt owns ranking, vision,
verification and eBay — porting that to PHP would create a second definition of
how a product is resolved, which is exactly what `WarmProductIndex` was written
to avoid.

So we do not move the logic. We **make the upstream warm before the panel runs**:

1. Laravel warms its own SerpAPI cache for the queries the panel is about to make.
2. Laravel then calls the panel, which now completes in ~8–12s instead of timing out.
3. The panel writes the index.
4. Shoppers read the index in ~1s.

Same code path, same single definition of resolution — the slow half just stops
happening while somebody watches.

## Steps

- [x] **1. Panel returns before Netlify kills it.** A request deadline, so a slow
      resolve degrades to `partial: true` at ~20s instead of a 502 at 30.3s.
      A skeleton is honest; a 502 is not.
- [x] **2. Verdict stops asserting from nothing.** `{label: "typical", band: null,
      sample: 0}` shipped to production. No sample → no verdict.
- [x] **3. `used` joins the cached unit.** eBay results are built outside `base`,
      so they are re-fetched on every open and never indexed — and returned 3 rows
      then 0 for the same product minutes apart. Put them in `base`, and widen the
      write gate to include them.
- [x] **4. Laravel warms the upstream before it calls the panel.** The actual fix.
- [ ] **5. Verify in production** that a warmed resolve writes a row, that a second
      call with a different URL reads it back, and therefore that the shared secret
      is right.

## Not doing yet

- Porting ranking/vision/eBay to PHP. Two definitions of resolution is a worse
  problem than the one we are fixing.
- A queue so a shopper's miss schedules a warm. Needed for coverage beyond PR
  history, but it is a second change and this one has to be proven first.

## Review

### What changed

**app/server/utils/shopperPanel.ts** — `priceVerdict` returns `null` instead of
`{label: 'typical', sample: 0}`. Signature is now `Verdict | null`; the panel and
the extension already handled a null verdict (the hero stage returns one), so no
UI work followed.

**app/server/api/shopper/panel.post.ts**
- A 24s budget (`budgetLeft()`), derived from Netlify's 30s kill. The retail
  search cap, the resale cap and the broaden retry all read from it, and running
  out marks the response `partial` — a skeleton instead of a 502.
- The feed lookups moved from before the cache read to after it, gated on
  `needFeeds`. They used to fire on every open including the hero stage, which
  never looks at `used` — so every panel open made an eBay call it discarded.
- eBay/Best Buy rows now live in `base` (`base.ebay`, `base.bestbuy`), so they
  are cached and indexed with everything else. Raw rows only; the 8x sanity
  filter and `percent_less` stay per-request because they depend on the page.
- The write gate counts `ebay`. It was `listings.length || offers.length`, which
  was permanently false in production.
- Rows remembered before the feeds existed backfill on first read.

**app/server/api/shopper/queries.post.ts** (new) — secret-gated, returns the
queries the panel would run. Exists so the scheduler can warm the upstream
without a second copy of `productQuery`/`broadenQuery` in PHP.

**api/app/Console/Commands/WarmProductIndex.php** — `warmUpstream()` asks the app
for the queries, runs each against our own `/products/search` with a 120s
timeout, then calls the panel. Best-effort: a failure degrades to the old
behaviour, never aborts the run.

### Verified so far

- `npx tsc --noEmit` clean on every touched file
- `npm run test:feeds` — all eBay and Best Buy cases pass
- `npm run build` succeeds
- `php -l` clean

### Still to verify — needs the deploy

Step 5 is untested and is the one that matters: that a warmed resolve actually
writes a row, that a second call reads it back, and therefore that the
Netlify↔DigitalOcean secret matches. Until that runs, the index remains
unexercised in production.

### Known gap

The scheduler needs a process running `php artisan schedule:run` every minute on
DigitalOcean. Without it none of this fires on its own — it only helps products
a shopper happens to open twice inside the cache window.
