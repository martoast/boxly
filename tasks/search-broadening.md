# AI search — generic catalog served as if it matched

## Symptom (found reviewing 2026-08-10 sessions)

Three customers used AI search that day. Two got answers to questions they
didn't ask, and neither came back.

- **karla garcia** (account 3 minutes old) asked for *"promociones de PINK by
  Victoria's Secret"* → 16 Victoria's Secret push-up bras, thongs and a perfume.
  No PINK. No promos. The bot said *"Encontré varias opciones"*.
- **Luis Angel Solano** asked for Coach's cherry collection → `0 results`, twice.
  The bot invented a coach.com product URL, `show_products` returned nothing,
  and it told him it couldn't load the catalog and linked him to coach.com —
  while the `web_search` snippet it already had listed Cherry Bag Charm $95,
  Corner Zip Wristlet With Cherry Print $35, Soho Sneaker With Cherries $117.

The admin AI-search page showed karla's search as **16 results** — a hit.

## Root causes

1. **Store name prepended to a query that already contained it.**
   `ProductExtractController::search()` built `$store . ' ' . $query`. The model
   is instructed to always put the brand in `store`, and routinely repeats it in
   `query`, so the strings actually sent to Google Shopping that day were
   `"Nike Nike shoes apparel deals"`, `"Owala Owala bottle"`,
   `"Target deals promotions Target"`, `"Coach Outlet cherry print coach"` and
   `"Victoria's Secret Victoria's Secret"`. Those doubled-up phrasings are
   exactly the ones Shopping returns few or zero results for.

2. **Silent broadening.** A query that matched nothing fell back to the store's
   general catalog — in *two* independent places (the Nuxt tool and the API) —
   and neither told the model. It received 16 products and reported them as
   matches. This is the whole of karla's session.

3. **`show_products` returned a bare `[]`** when no URL resolved, which reads as
   "nothing exists". The model apologised and handed over a store link instead
   of using the product names + prices it already had from `web_search`.

4. **Admin analytics double-counted.** The Nuxt retry was a second HTTP call, so
   one customer search wrote two rows — one `0 results` and one `16 results`.
   That is what pushed the dashboard's zero-result rate to 60% for the window.

## Changes

- [x] `composeStoreQuery()` — strip the store's own words out of the query, then
      prepend the store once. Verified against all of that day's real queries.
- [x] `broadened` flag through the whole chain: API response → tool output →
      model, plus a prompt rule that it must say *"no encontré X, pero aquí está
      el catálogo de Y"* rather than present catalog items as matches.
- [x] Broadening moved entirely into the API (the no-store first-word retry came
      along with it). One call, one analytics row, one truth.
- [x] Broadened results skip `curateProducts` — there is nothing to rank against
      a query the items were never matched to.
- [x] `show_products` returns an explicit `error` + `note` when nothing resolves,
      telling the model to use the web_search names/prices instead of linking out.
- [x] `search_events.broadened` + `served_query` (migration), surfaced in
      `/admin/ai-search/events` and `stats`.
- [x] Admin page: broadened rows render amber with *"⚠ No encontramos esto —
      mostramos el catálogo de …"*, and a new **"Sin lo que pidieron"** card
      combines zero-result + broadened into one honest quality number.

## Review

The behaviour change customers will feel is #2: the assistant now admits when it
substituted, instead of confidently showing the wrong thing. Fixing #1 should
also mean it substitutes far less often — every doubled query from that day now
composes cleanly.

Deliberately NOT changed: the broadening itself still happens. Showing a store's
catalog beats an empty gallery — the bug was never saying so.

Needs `php artisan migrate` on the API. Before it runs, the stats and events
endpoints are column-guarded (`Schema::hasColumn`) and report `broadened: false`,
so the page keeps working; it just can't flag anything yet.
