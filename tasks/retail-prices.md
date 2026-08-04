
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
