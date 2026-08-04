# Building a pre-built index — the Boxly-sized version

*2026-08-03. Alex, after seeing what Phia does: "how can we go in that
direction? I also want to create pre-built indexes."*

Phia matches against ~250M products across 40,000 sites. We can't build that,
and we don't need to. See `retail-prices.md` → "What Phia actually does
differently" for why their architecture beats ours.

## The realization

**We don't need a catalogue. We need a KEY.** Once a product has a stable
identifier, other people's catalogues join to it for free — eBay already has
one, Best Buy has SKUs, and retailers publish identifiers in their own page
markup. Our job is to capture the key and remember what we resolved.

Verified today, on live pages:

| source | what it gives us | status |
|---|---|---|
| eBay Browse `item_summary` | **`epid`** on every row — eBay's own product id | ✅ confirmed, we already receive it and ignore it |
| sneakerpolitics.com JSON-LD | `sku: "U20107PT\|13"`, `brand: "New Balance"` | ✅ present |
| owalalife.com JSON-LD | nothing | ❌ absent |
| `detect.js` | **captures no identifiers at all** — 0 references to gtin/sku/mpn | ❌ the gap on our side |

That `U20107PT` is the manufacturer style code, and it is exactly what eBay
sellers put in their titles — we saw `U2010892`, `U2010TTO`, `U201020Q` come
back in the 2010 search. Matching on it would be near-perfect where it exists.

Coverage will be partial and that is fine. An index that answers 40% of opens
instantly is worth far more than no index, and the misses cost only what we pay
today.

## The other asset nobody else has

Phia indexes everything because it doesn't know what you'll look at. **We do.**
`purchase_requests`, `purchase_request_items` and box contents are a record of
what Mexican customers actually buy from US stores. That is a warm list of a
few thousand products, not 250 million, and it is the right few thousand.

## Stages

Each one ships on its own and is useful before the next exists.

### 1. Capture the key — small

`detect.js` already parses JSON-LD; it just never looks at the identifier
fields. Pull `gtin`/`gtin13`/`sku`/`mpn` (and `brand`, which fixes the
`brand: null` bug behind the bare `"FreeSip®"` query), send them as `ids`.

Canonical key, first that exists:

1. `gtin` (globally unique — the strongest join)
2. `brand` + `mpn`/`sku`
3. `slug(brand + title + variant)` — the fallback we effectively use today

### 2. Persist instead of expiring — small

Today every resolution goes into `useStorage('cache')` with a 15-minute TTL and
is then **thrown away**. We already generate exactly the data an index needs,
and delete it four times an hour.

A `product_index` table in Laravel (the DB is already there): canonical key,
identifiers, title, brand, variant, image, the resolved listings, prices, and
`resolved_at`. The panel writes on every resolution and reads before searching.

First real win: the second shopper on a product pays nothing and gets a better
answer than the first.

### 3. Warm it from our own history — small

A cron that walks the PR/box history and resolves those products ahead of time.
Cheap, bounded, and it makes the index useful on day one instead of after
enough traffic accumulates.

### 4. Refresh on a schedule, not on a click — medium

Store `resolved_at` with every price. Refresh popular keys in the background.
**This is where "instant" actually comes from** — the shopper reads a row we
resolved an hour ago instead of waiting 17 seconds for us to resolve it now.

### 5. Exact vs similar — the split Phia has and we don't

With canonical keys, "exact match" means *same key* and everything else is
"similar". Phia states this distinction plainly; we put both in one list and
let a discount badge speak for either, which is how an orange Sway ended up
offered against a blue FreeSip. The variant work already tells us which rows
are the exact item — this stage mostly needs the key to make it rigorous.

## Rules this must not break

- **Never claim a verified saving on a stale price.** An index makes staleness
  a new way to lie, and `verified` is the one thing this panel sells. A cached
  price needs `resolved_at` shown or re-checked before it carries a badge.
- **No background scanning.** COMPASS §5, and the Web Store disclosure says we
  don't collect browsing history. The index is built from pages the shopper
  *opened the panel on* — a deliberate action — never from ambient browsing.
  Harvesting browsing is how Phia got caught; see `retail-prices.md`.
- **The index is a cache, not a source of truth.** A miss must fall through to
  today's live path, silently.

## Where to start

Stages 1 and 2, together. They are small, they are the foundation for 3–5, and
stage 2 alone makes repeat opens instant — which is the complaint that started
this.
