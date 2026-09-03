
### Electronics broke the relevance guard — fixed 2026-08-03

Testing against real Best Buy retail prices, eBay returned an accessory or a
spare part for almost every electronics query:

| query | retail | what eBay returned |
|---|---|---|
| Apple Watch Series 10 46mm | $429 | "Repair Part - OEM Pull Housing", "Mod Kit Case Band Strap Cover", "Stainless Steel Strap Case" — **all four were bands or parts** |
| Nintendo Switch OLED | $349.99 | "Battery Display Assembly", "Logic Board Motherboard HEG-CPU-01" |
| Bose QuietComfort Ultra **Headphones** | $429 | "Bose Ultra Open Bluetooth **Ear Clip**" at $52 |

A $56.98 watch band beside a $429 watch renders as **"87% menos"** on a row we
mark `verified`. That is the most damaging thing this panel can do.

The model-number guard was useless here — a band FOR an Apple Watch 10 says
"10" and "46mm" *because* it is for that watch. Three additions to
`sameProduct()`:

- **accessory vocabulary** (case, band, strap, charger, motherboard, housing,
  repair, kit…), skipped entirely when the QUERY is itself for an accessory, so
  "AirPods Pro charging case" still works
- **"for the X" / "compatible with"** — a thing that attaches to the product
- **category mismatch** — earbuds are not over-ear headphones

Whole-word matching throughout, which is not cosmetic: a substring test finds
"skin" in "skinny" and "cord" in "corduroy" and would silently delete apparel.

After: every first row is the real product — Sony XM5 $99 (75%), Apple Watch
$150 (65%), Bose QC Ultra Over-Ear $149.99 (65%), Switch OLED console $149
(57%). Shoes and apparel unchanged.

**Best Buy's own feed is still unbuilt** — the key is pending approval, so
`BESTBUY_API_KEY` is unset and `bestBuySearch()` returns null. The retail side
of an electronics comparison remains "precio de referencia" until it lands.

---

## What Phia actually does differently — researched 2026-08-03

Alex: *"they do so much better."* They do, and the reason is architectural, not
a better prompt.

**They match against a pre-built index; we search live.** Phia claims ~250M
products from 40,000+ retail and resale sites. Every panel open for us is a
fresh SerpAPI search plus a live eBay call, and we decide what "the same
product" means inside a 12-second window with 12 candidates. They did that work
offline, over the whole catalogue, with time to canonicalise and dedupe. That
single difference explains both the speed gap (their "instant" vs our 17–26s)
and the quality gap — today's watch-band and motherboard bugs are what live
matching on 12 rows looks like.

**They separate "exact match" from "similar alternative" explicitly.** Their
own description: surfaces "better-priced exact matches AND similar
alternatives". We put both in one list and let a discount badge speak for
either. This is the cheapest thing to copy and we already have the raw material
— the variant work landed today tells us which rows are the exact item.

**They have direct partnerships**: The RealReal, Vestiaire, ThredUp, Poshmark,
eBay, plus retailers. Same conclusion as the top of this file, now with names —
the channel is a business relationship, not a crawler. We have one of those
partners already (eBay), which is why the Usado section is the only part of the
panel that works properly.

### What NOT to copy

In November 2025 researchers found Phia's extension shipping **complete HTML of
every page a user visited** — bank statements, private email — to its servers
via `logCompleteHTMLtoGCS`, while its policy claimed it collected limited data
from "retail sites". They removed it after being contacted and did not notify
users. ([Fortune](https://fortune.com/2025/11/15/phia-ai-shopping-agent-bill-gates-phoebe-gates-sophia-kianni-collecting-user-data/))

COMPASS §5 already forbids exactly this ("no background/proactive page
scanning", and the Web Store disclosure says we don't collect browsing
history). Worth noticing that harvesting users' browsing is *one way* to build
a 250M-product index cheaply. That road is closed for us, deliberately.

### The realistic path

We cannot build their index. We can build a *small* one: cache what we resolve
for the products our customers actually look at, so the second shopper on a
product pays nothing and gets a better answer than the first. Boxly's catalogue
is narrow by nature — Mexican customers buying US retail — which is the one
structural advantage we have over a general-purpose 250M-row index.
