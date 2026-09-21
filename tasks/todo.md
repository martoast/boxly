# The DFYNE card promised promotions DFYNE does not have

Gabriela Pérez Martínez, conversation 771, 2026-09-21 14:08. She tapped the DFYNE
starter card, whose text was:

> "Quiero ver promociones de articulos DFYNE para mujer"

DFYNE has **0 marked-down rows out of 60**. So the first sentence of her first
Boxly search was:

> "Ahorita DFYNE no tiene descuentos activos marcados en la tienda, pero aquí
> tienes su catálogo actual…"

23 real DFYNE products were on screen and the copy was warm — but a shopper who
tapped a brand card was told first what that brand *doesn't* have.

## Why it happened
Two things pointing the same way, and the model followed both correctly:

1. **The card asked for promociones.** `starter_prompts` id 5 — admin-managed, so
   the text is data, not code.
2. **The prompt scripts the apology.** Step (2) of the PROMOS rule contains that
   exact sentence, and it fired unconditionally whenever `relaxed:'deals'` came
   back — which is *always*, for a full-price brand.

The tool call was `curate_products({store:'DFYNE', gender:'women', intent:'deals',
department:'apparel'})`. Correct, given what it was asked.

## Todo
- [x] Card 5 → catalog framing (done live; old text recorded below)
- [x] A store ask is no longer automatically a DEALS ask
- [x] Never volunteer the absence of discounts to someone who didn't ask
- [x] Check the new text doesn't trip the audience-narrowing gate
- [x] Tests

## Review

**Live DB change** (`PUT /admin/starter-prompts/5`), reversible:

    old   Quiero ver promociones de articulos DFYNE para mujer
    new   Muéstrame todo el catálogo de DFYNE para mujer

"para mujer" stays on purpose: without it `audienceGap()` would stop the card to
ask "¿para quién es?", which is the last thing a brand card should do. Verified
against the real function.

**Prompt, three places, all saying one thing** — *seeing a store is not asking
for deals*:
- `curate_products({store})` with `intent:'deals'` only when they asked about
  promos/ofertas; `intent:'browse'` for a plain "catálogo"/"qué hay"/"muéstrame".
- Step (2): mention the absence of markdowns **only if they asked about promos**.
  Opening a brand's gallery with what it doesn't have is the worst possible first
  impression of that brand.
- The named-store rule repeats the same split, since it also said `intent:'deals'`
  for any store ask.

## Two more cards make the identical promise

Measured against the live catalog, 60 rows each:

| card | on sale | card text |
|---|---|---|
| **DFYNE** | **0 / 60** | fixed |
| **RHODE** | **0 / 60** | "Quiero ver promociones de articulos RHODE" |
| **LULULEMON** | **0 / 60** | "Busco promociones actuales de LULULEMON" |
| Owala | 4 / 53 | "Quiero ver promociones de vasos Owala" — borderline |
| ALO 60/60, GAP 60/60, Coach Outlet 60/60, NIKE 58/60, Old Navy 58/60, YoungLA 59/60 | | honest promises |

RHODE and LULULEMON will produce the same opening sentence Gabriela saw. Left
alone — Alex scoped this to DFYNE, and these are advertised marketing surfaces.
One `PUT` each whenever he says so.
