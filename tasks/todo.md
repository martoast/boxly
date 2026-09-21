# Cards must not promise sales a brand doesn't have

> "we cannot be forcing trying to show sales when there arent any" — Alex, 2026-09-21

Follows the DFYNE fix. I measured every carried brand card against the live
catalog (60 rows each) instead of guessing which ones were lying.

## Measured

| card | on sale | verdict |
|---|---|---|
| DFYNE | **0 / 60** | fixed (previous commit) |
| RHODE | **0 / 60** | fixed |
| LULULEMON | **0 / 60** | fixed |
| Owala | **4 / 53 (8%)** | fixed — a 4-item gallery is a lonely card |
| New Balance | **2 / 30 (7%)** | fixed — not previously spotted |
| Sephora | 10 / 26 (38%) | honest, left alone |
| PINK | 25 / 60 (42%) | honest |
| Old Navy · NIKE · Victoria's Secret · Bath & Body Works | 58 / 60 (97%) | honest |
| YoungLA | 59 / 60 | honest |
| ALO · GAP · Kipling · Coach Outlet | 60 / 60 | honest |

Live edits (`PUT /admin/starter-prompts/{id}`), all reversible:

    [10] RHODE        Quiero ver promociones de articulos RHODE     → Muéstrame todo el catálogo de RHODE
    [23] LULULEMON    Busco promociones actuales de LULULEMON       → Muéstrame todo el catálogo de LULULEMON
    [ 6] Owala        Quiero ver promociones de vasos Owala         → Muéstrame todos los vasos Owala
    [ 2] New Balance  Quiero ver promociones de Tenis New Balance   → Muéstrame todos los tenis New Balance

The other 19 cards keep their promos framing because their stores genuinely have
promos. The nine we don't carry (Amazon, Target, Walmart, ULTA, Macy's, Nordstrom
Rack, Karl Lagerfeld, Adidas, eBay) take the `find_on_google("<store> deals")`
path, which searches the live web for real markdowns — a different question.

## And a regression I shipped last week

The audience-narrowing gate (`audienceGap`, 2026-09-16) was **hijacking two
advertised cards**:

    [22] Adidas       "Quiero ver promociones actuales de tenis Adidas"
    [ 2] New Balance  "Quiero ver promociones de Tenis New Balance"

Both name a gendered category (`tenis`) with nobody to wear it, so a tap answered
with "¿para quién es?" instead of the store — against the prompt's own oldest
rule, that every advertised card must end in a gallery of that store.

Rewriting those two texts would have hidden it, not fixed it: card texts are
admin-managed, so the next one containing "tenis", "ropa" or "sudadera" breaks
identically. So the **tap** says so itself — `fromStarterCard`, consumed for
exactly one turn, read and cleared in the same breath so a typed follow-up is an
ordinary message again. The server skips the gate for it; the prompt still asks
its narrowing question *after* the gallery is up.

## Todo
- [x] Measure all 17 carried brand cards, don't guess
- [x] Fix the five that promise sales their store doesn't have
- [x] Card taps are never hijacked by the narrowing gate
- [x] Tests for both

13 checks in store-ask. All 14 suites green, build clean.
