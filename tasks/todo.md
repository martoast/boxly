# eBay is opt-in

> "Let's suppress eBay results unless they explicitly asked for it. I don't want
> us to be searching for eBay. That's kind of making it look bad." — Alex,
> 2026-09-17

Ranking marketplaces last (1140bc5) fixed WHICH row led. It still left
third-party eBay listings sitting in the gallery for shoppers who never asked,
which makes Boxly read as a reseller aggregator instead of a way to buy from
real US stores.

## Todo
- [x] `wantsEbay()` / `isEbayRow()` / `dropEbay()` next to the marketplace ranking
- [x] The web fan-out and Google Shopping both filter before the gallery
- [x] Consent travels separately from the query (see below)
- [x] The `ebay` engine stops being reported as a source once its rows are gone
- [x] Tool description stops promising eBay to the shopper
- [x] The eBay store card still works

## The subtlety worth keeping in mind

`productTerms()` strips a **retailer's** own name out of the outgoing web query
— it has to, because Amazon turns "Macy's" into gift cards. So by the time the
words reach the engines, "eBay" is gone.

Asking the outgoing query whether the shopper wanted eBay answers **no every
time**, including on the advertised eBay store card, which would have silently
suppressed its own results. Consent is therefore passed separately: the raw ask
plus the store param (`getWebApi(webQuery, a.store, a.query)`), and the
shopper's own sentence for `find_on_google`, whose query is model-written.

There is a test for exactly this, because it is the failure that would have
shipped quietly.

## Review

Three small pure functions beside `merchantTier`, where the marketplace rules
already live. A row counts as eBay by its **engine** (`source: 'ebay'`), its
**merchant** (Google resells eBay listings under its own engine name), or its
**link** (`ebay.com`) — one of the three catches every shape we see.

Filtering happens in `getWebFanoutApi` and `getGoogleShopApi`, so every gallery
path inherits it: `search_products`, `curate_products`, `find_on_google`,
`web_search` and the uncarried-store fallback. `getAmazonApi` is Amazon-only and
needs nothing.

`sources` no longer reports `ebay: 14` when those 14 rows were dropped —
otherwise the model reads the count and tells the shopper the gallery includes
eBay listings that are not on screen.

Etsy, Poshmark, Mercari and the rest are untouched: they are still ranked last
by `merchantTier`, not removed. Alex asked about eBay.

30 checks in web-rows. All 13 suites green, build clean.
