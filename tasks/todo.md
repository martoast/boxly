# Erick Martos, conversation 775 — four faults

80 messages, 2026-09-22 01:07–01:30. Everything below is from that thread.

## 1. "I had picked the variation and it asked again" — page chrome read as variants

Three products in a row he could not add:

    [3562]  "…en color Black"   →  Style ["Additional details", "here", "Measurements"]
    [3572]  (tapped Add)        →  Style ["Return details", "Measurements", "Sponsored", …]
    [3576]  "…en color Blue"    →  Color ["3+", "Green", "Blue"] + Style ["here", "User guide"]

Amazon's own links and section headings, read off the page as if they were choices.

The third is the one that explains "it asked again and didn't register it": **the
Color axis WAS satisfied** — he said Blue, Blue was in the list — but the hold gate
needs EVERY multi-value axis answered, and the junk `Style` axis can never be
answered by anyone. So he was asked to re-pick what he had already picked, from
options that meant nothing. He replied "?".

`CHROME_VALUE` + `cleanAxes()` / `cleanVariants()`, applied at the single point both
readers pass through, so an unseen store gets the same guard. Anchored patterns
only — a colour really can be called "Floral Details". An axis left with nothing is
dropped, and the read's `reason` is now judged on what SURVIVED, so a page whose only
"variants" were "Sponsored" and "Return details" honestly reports no variants and the
item goes in the box.

## 2. "Poker set would be 50% of a small" — 500 chips weighed 0.8 kg

The title says the answer out loud: *"500PCS … 11.5 Gram"* is 5.75 kg of clay before
the aluminium case. It was modelled as `rigid_medium`, 0.8 kg, and drew a 3% bar.

`DENSE_KG` entries may now be a function of the name, so the count and the gram weight
are read off the title — a 300-chip set and a 1000-chip set are not the same shipment:

    Comie 500PCS · 11.5 Gram     7.0 kg   47% of a Chica
    Loychip 500 Piece · 14G      8.2 kg   55%
    Classic Games 300 Piece      4.7 kg   31%

Alex eyeballed 50%.

## 3. Photo search returned 1 result out of 72

[3581] he sent a photo. Vision read it correctly and searched
`"asics gel nyc light blue sky cream"`. The engines returned 72 rows. **One** reached
the gallery.

`onlyWhatTheyAsked` did that — my own filter. `askTerms()` ignores tokens under four
characters, so **"gel" and "nyc" — the entire identity of the shoe — were invisible**,
and the score ran on `asic` plus three colour words. One FARFETCH listing happened to
spell "Cream/Blue" in its title, scored 3, and every genuine ASICS GEL-NYC scored 2 and
was thrown away for describing its colour differently.

A photo search always produces a long descriptive query, so this is its normal shape,
not an edge case. Colours now RANK and never GATE — which is what curate_products' own
free-text field has always promised ("Ranks, never gates"). The colourway they
photographed still leads the gallery. `"Puma shorts de mujer"` still drops the sneaker.

While there: `algo`, `quiero`, `busco`, `muéstrame` and friends became stopwords —
"algo azul" was scoring on "algo".

## 4. Not fixed, worth knowing

The junk axes come from the **catalog service's** widget reader
(`~/mcp-servers/computer-use/catalog/variant_widget.mjs`), which is what turned
Amazon's link list into a Style axis. The guard above is in the app, so every store is
covered today, but the reader is still producing the garbage and the modal will show
it in other surfaces. Worth a pass there.

## Todo
- [x] Chrome out of variant axes, at the single read point
- [x] Poker chip weight from the title
- [x] Colours rank, they do not gate
- [x] Spanish filler stopwords
- [ ] The catalog service's widget reader — the source of the junk

48 web-rows · 98 box-fit · 43 variant-chrome. All 16 suites green, build clean.
