# The variant picker becomes a card IN the chat (Alex, 2026-09-29)

> "instead of making the variant picker a pop-up modal, make it directly in the chat itself … a message the
> assistant sends so it stays there, even if the client refreshes … if I close the modal I have to wait again to open
> it … and I can even just say it in a message instead of using the component, and the AI should still be smart."

## What changes for the shopper
- Tapping a gallery card no longer opens a pop-up. A **picker card** appears in the chat as an assistant message:
  photo, title, price, store, colour chips (with photos), sizes/widths, "Agregar al carrito".
- It loads **once** (the ~12–15 s live read), shows a loading state while it reads, and then **stays**: scroll away,
  refresh the page, come back tomorrow — it's still there with the options it read.
- The shopper can **tap** the chips, **or type** ("la negra en talla 9", "ancho D, 10.5") and the assistant picks those
  exact options on that card and adds it — no second read, no pop-up.
- A small "Actualizar disponibilidad" link re-reads the store live when the card is old (shows "leído hace X").

## How (smallest change that does it)
1. **A persisted assistant part `tool-product_picker`** (same pattern as ShipmentCard / ask_to_narrow cards):
   `{ product: {store_id, store_name, url, title, image, price, was}, read: {axes, variants, colorways, source}, read_at }`.
   Stored with the existing `POST /conversations/{id}/messages` (owner-only, already exists) — no API migration.
   Written server-side by `server/api/product-variants.post.ts` when the app passes `conversation_id` (so the card
   survives a refresh even if the tab closes mid-read).
2. **`components/ProductPickerCard.vue`** renders that part in `ShoppingAssistant.vue` (like the other cards), reusing
   `VariantPicker.vue` unchanged. Its "Agregar" emits the same add flow the modal uses today (`onAssistedProduct` →
   `/cart/items` + the assisted message) — the cart code does not change.
3. **Tap on a gallery card** → append a *pending* picker card immediately (instant feedback) and start the read; when
   it lands the card fills in. Tapping the same product again scrolls to its existing card instead of re-reading.
   The assistant's own "pick a size first" hold (today `openPickerFor`) also shows/points to the card, not a modal.
4. **Typed picks**: the assistant route sees the latest picker card(s) in the history. When the shopper's message
   names values that match **exactly one** card's values (every axis resolved, the combination buyable per
   `pickerLogic.canPick`), it's treated as the pick (the same `pickedOptions` path the chips use) and the card shows
   the selection. Ambiguous or sold-out → the assistant asks, pointing at the card. This only applies to a product
   the shopper already opened — the first search message still never preselects (Alex, 2026-09-28).
5. `ProductModal.vue` is no longer opened from the chat; photos open the existing image viewer from the card.

## Checklist
- [x] `tool-product_picker` part shape + write it from `product-variants.post.ts` (with `conversation_id`)
- [x] `ProductPickerCard.vue` (loading / ready / refreshed / error), reusing `VariantPicker.vue`
- [x] Gallery tap → pending card + read; re-tap scrolls to the existing card
- [x] Assistant hold (`openPickerFor`) → card instead of modal
- [x] Typed pick: exact-match resolver over the card's axes + tests (unique match, sold-out refusal, ambiguous → ask)
- [x] Reload: history maps the part (mapMsg) so the card renders after refresh
- [x] Tests (pickerLogic + resolver + part mapping)
- [ ] A live boxly.mx run: tap → card → refresh → pick by tap and by text → added to box (needs a deploy — not done here)

## Review
**What changed**
- `server/api/product-variants.post.ts` — when the chat sends `conversation_id` + `token` (+ the product meta it knows),
  a read that worked (or found nothing to choose) is saved as one assistant message with a `tool-product_picker` part
  `{ product, read, read_at, read_url }` via `POST /conversations/{id}/messages` (Bearer token, like `persistTurn`).
  Failed reads (busy/blocked/unreachable) are not saved; a failed save only logs. A colourway re-read keeps the
  colourway set the client sends. No change to other callers (no `conversation_id` → nothing saved).
- `components/ProductPickerCard.vue` (new) — photo/title/price/was/store; "Leyendo opciones en vivo…"; error + Reintentar;
  colourway strip (re-reads that page into the same card); `VariantPicker` unchanged; "Leído hace X · Actualizar
  disponibilidad". Emits the same `assisted` payload the modal did (incl. the `size_owed` guard), so the add path
  (`onAssistedProduct` → `/cart/items` + the assisted message with `metadata.pick`) is untouched.
- `components/ShoppingAssistant.vue` — `openProduct` appends a pending card message (queued while a reply streams) and
  reads into it; a re-tap scrolls to the existing card. One card per product (url without query): drawn where it first
  appeared, with the latest read; later saved reads draw nothing of their own. The hold path (`openPickerFor`) now
  points at / creates the card (catalog cache, 900 s) and only for this page's own turns (no re-reads on reopening a chat).
  `ProductModal` stays in the repo but the chat no longer opens it. `mapMsg` already keeps the part (tested).
- `utils/typedPick.ts` (new) — `pickerCards`, `resolveTypedPick` (token-exact, case/accent-insensitive; parenthesised
  aliases "Standard (D)" → "D"; Spanish colour words map only to a value's whole name; every multi-value axis must be
  named once, on exactly one card, and be buyable per `pickerLogic.isComplete`/`blockedBy`; another colourway page →
  ask), `pickerCardsAsText` (the model sees the card as one line with its options and registry id).
- `server/api/assistant.post.ts` — history replays cards as text; in `show_shipment`, with no `metadata.pick`, a typed
  pick that resolves to THIS product's card feeds `pickedOptions` exactly like the chips; otherwise the hold note tells
  the model why (sold out / missing axis / ambiguous / colourway) and to point at the card. Prompt ⓪ mentions the card
  and typed picks. No card in the chat → nothing typed counts (first search never preselects).

**Tests**: new `test:typed-pick` (18) and `test:picker-card` (6: save with conversation, none without, failed save still
returns the read, failed read not saved, colourway set kept, reload mapping). Existing suites all green (test:live,
test:cart, picker-logic, variant-pick, picker-open, variant-read, variant-sane, variant-chrome, narrow, live-gallery,
context, tools-reachable, variant-note, composer, box-fit, bare-store, sizing). Two source-regex tests updated for the
new signatures (`openPickerFor(o, m)`, the history chain). `nuxt build` passes. vue-tsc: identical error set before and
after (see report).

**Not done / notes**
- No live boxly.mx run (no deploy from here) — needs Alex / a deploy.
- A typed pick does not light the chips on the card (VariantPicker kept unchanged); the box card shows the result.
- A card tapped while a reply is streaming appears when the reply ends (appending mid-stream would split the reply).
- Old chats' holds (before this) no longer reopen anything on reload.
