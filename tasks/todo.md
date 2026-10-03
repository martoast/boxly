# API docs in account settings, for admins and shopping managers (Alex 2026-10-01)

Problem: an API key works, but nothing tells you (or your AI) which routes exist or what they take — "it's running
blind". Shopping managers can't even create a key (keys are admin-only, and the shopping area has no account page).

Facts: admin = 175 routes, shopping = 69. Only ~54% / 26% have a doc comment; most fields are validated inline.
A hand-written list would go stale, so the reference is GENERATED from the live routes.

API (boxly-api):
- [x] GET /me/api-docs (auth): the routes YOUR role can call — admin -> the admin group, shopping manager -> the
      shopping group. Each: method, path, a one-line summary (doc comment, else the controller method's name in words),
      and the body fields when they can be read (a FormRequest's rules, or the controller's inline validate([...])).
      Also as markdown (?format=md) so it can be pasted into an AI, or fetched BY the AI with its own key.
- [x] /me/api-keys open to shopping managers (Alex OK 2026-10-01, API 0ed00d4): their key reaches /shopping/* only, /admin/* 403 (tested).
- [x] Feature tests: admin sees admin routes, shopping manager sees only shopping routes, customer gets 403.

App (boxly):
- [x] ApiDocsCard: grouped by area, search box, "Copiar para tu IA" (markdown), and the one-line tip
      "your AI can read this itself: GET https://api.boxly.mx/me/api-docs?format=md with your key".
- [x] Admin account page: under the API keys card.
- [x] Shopping managers: new /app/shopping/account ("Mi cuenta", in the shopping menu) with API keys + the docs.
- [x] Build, tests, push; check with a real admin call (I have no admin/shopping key: Alex or a probe).

# Shopping manager: easy availability on the phone (Alex 2026-10-01)

The manager couldn't find where to set in-person hours, and setting them on a phone is tap-by-tap
(7 day tabs x one button per hour, then Save, then "copy week" at the bottom).

- [x] Findable: shopping menu item "Visitas en Persona" -> "Mi disponibilidad", moved to the TOP of the menu
      (today it is 5th, behind the hamburger, next to "Viajes anteriores" with the same icon).
- [x] Findable: on the manager's landing page (Solicitudes de Compra) a banner "Abre tus horarios para visitas en
      persona -> Configurar" when no hours are open in the next 14 days (one read of the existing slots endpoint).
- [x] Quick schedule card at the top of the availability page (phone first): day chips L M X J V S D, "De"/"A" hour
      pickers (default 10:00-18:00), "Por: 1 / 2 / 4 / 8 semanas", one big "Publicar horario" button with the
      count ("Abrirás 32 horas"). One PUT to the existing endpoint (already accepts any future dates, idempotent);
      past hours skipped. No API change.
- [x] The hour-by-hour editor stays below as "Ajustar horas sueltas" (exceptions, bookings, refunds unchanged).
- [x] Pure builder in utils/inPersonSlots.ts + unit test; build; push; check at phone width.

## Review
- Menu: "Mi disponibilidad" is the first item of the shopping menu (page title renamed to match).
- Landing (Solicitudes de Compra): a banner links to it when no hours are open in the next 14 days.
- Availability page: "Publica tu horario" card on top — day chips, Desde/Hasta, 1/2/4/8 semanas, one "Publicar horario
  (N horas)" button → one PUT with `add` only (never removes; past hours skipped; the API's firstOrCreate makes a
  re-publish harmless). quickScheduleHours() in utils/inPersonSlots.ts, 6 new checks.
- The hour grid stays below as "Ajustar horas sueltas". No API change.
- Also: the reply while the agent adds is one exact line (cc74321) — no "¿pasamos a finalizar?" mid-add.

# Box card waits for the store add (Alex 2026-10-01, prod screenshot IMG_2130)

Problem: "Tu caja Boxly" with "Finalizar carrito" shows while the agent is still adding the item in the store
(New Balance 880v15 "Agregando en New Balance…" above the live video). Steps must go in order: add → then the box.

- [x] ShipmentCard.vue: don't render the card while any of its items is still going into a store cart
      (step 2 = pending/syncing). The live video card is the only thing on screen during the add.
- [x] ShoppingAssistant.vue onLiveEnded (cart branch): reload the cart right away, so the box card shows the
      moment the add ends (today the cart polls every 8 s, which is why the card still said "Agregando" under "Listo").
- [x] Tests + build; push (4b0bdf4). [x] Verified on boxly.mx (lab chat 955): no box card during the NB add, card with ✓ + Finalizar right after.

## Review
- ShipmentCard: `v-if="step !== 2"` on the root: hidden while any item is pending/syncing in its store cart.
- ShoppingAssistant: itemStatus returns null when the cart's sync is off (lines default to 'pending' in the DB and would
  hide the card forever); onLiveEnded reloads the cart at once so the card appears right after the video's "Listo".
- Every pending line is synced to a terminal state by the API (in_store_cart / unavailable / failed), so a card is
  never hidden for good. A failed add shows the card with "No se pudo agregar".

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

## 4. The source of the junk — fixed too (catalog service, `ce8364f`)

The app-side guard covers every store today, but the garbage was being *produced* in
`~/mcp-servers/computer-use/catalog/variant_widget.mjs`. Two holes there:

- `NOISE_RE` had `^details$` **anchored**, so "Additional details" and "Return
  details" walked straight past it — and it had never heard of "here",
  "Measurements", "User guide", "Sponsored", or a `3+` swatch-overflow chip.
- The structural one: the label branch accepts **any value that is not a 4-digit
  number** for a kind it has no shape test for. So a heading read as "Style" adopted
  every link sitting beneath it. A link now has to point at a product or a variant to
  count there. Real colourway links are already claimed earlier by their dwvar/param
  href or a sibling style code, so nothing buyable reaches that test — and a store
  that genuinely lists its styles as product links still works (there is a test).

Both layers now agree, which is what we want: the reader stops emitting it, and the
app still refuses it if some other store invents a new shape.

## Todo
- [x] Chrome out of variant axes, at the single read point
- [x] Poker chip weight from the title
- [x] Colours rank, they do not gate
- [x] Spanish filler stopwords
- [x] The catalog service's widget reader — the source of the junk (`ce8364f`)

48 web-rows · 98 box-fit · 43 variant-chrome. All 16 app suites green, build clean.
149 variant_widget · 27 catalog suites green.

## Finalizar = the whole cart (Alex 2026-10-03: "finalizing the order should be everything in the cart")
Bug: finalize_order (and every box-card sync) planned the Boxly cart from THIS chat's box only, so a line added in an
earlier chat was deleted at Finalizar (lab PR-26-NWTYO: cart showed hoodie + leggings, the quote had only the leggings).
- [x] boxCheckout.ts: `boxItemsEver(messages)` — every item any box card of this chat showed
- [x] planCart `removable`: a line is removed only when this chat's box once held it (dropped since); other chats' lines stay
- [x] syncBox passes removable; finalize_order: an empty box no longer stops when the cart holds lines; the stores
      named come from the cart
- [x] tests in server/utils/boxCheckout.test.mjs
### Review
- Box-card syncs and Finalizar now remove only cart lines this chat's box once held and dropped; lines from other chats are
  kept and ordered. Finalizar works from the cart (an empty box with older cart lines still finalizes), and the stores it
  names come from the cart. 4 new tests; cart/box/tools/context suites pass.
