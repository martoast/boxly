# Assisted purchase — ONE purchase request per shipment (not one per item)

## The bug (confirmed on chat #238, Marisol Garcia, 2026-07-24)

The customer added 5 items across one conversation. That produced **5 separate
purchase requests** (PR 160, 161, 162, 163, 164), each one a **superset** of the
previous — 1 + 2 + 3 + 4 + 5 = **15 item rows for 5 real products**. Someone
later merged them by hand into PR 160, which is why it now shows 13 items with
duplicated names and inflated quantities.

Two compounding causes:

1. **Client: a new PR per summary card.**
   `app/components/ShoppingAssistant.vue` → `autoCreateAssisted()` watches for
   each new `tool-show_assisted_summary` part and calls `confirmAssisted()`,
   which does an unconditional `POST /purchase-requests`. Nothing binds the
   conversation to an already-created PR, so every card = a brand-new PR.
   (`POST` in `api/app/Http/Controllers/PurchaseRequestController.php:104`
   always `PurchaseRequest::create(...)`.)

2. **Model: each card carries the FULL running cart.**
   The system prompt (`app/server/api/assistant.post.ts`) tells the model
   "call show_assisted_summary … with EVERY item". Correct as a cart snapshot —
   wrong when the client treats every snapshot as a new order. Card 5 repeats
   items 1-4.

Side effects per extra PR: one `PurchaseRequestCreated` email to the customer
and one `PurchaseRequestCreatedTeamNotification` to the shopping team. Marisol
got 5 confirmation emails; Velonie got 5 "new request" alerts for one shipment.

The merge tool (`AdminPurchaseRequestController::mergePurchaseRequests`) moves
items verbatim with no dedupe, so cleaning up by hand preserves the duplicates.

## The fix — bind the conversation to ONE pending PR

The summary card is already the **full cart**, so the correct write is
*replace the PR's items with this card's items*, not *append a new PR*.

`PUT /purchase-requests/{id}` (customer, `PurchaseRequestController::update`)
already has exactly replace semantics: items with an `id` update, items without
get created, anything missing from the payload gets deleted. Status guard: only
`pending_review` is editable — which is what we want.

- [x] `ShoppingAssistant.vue`: `assistedPr` ref (per conversation). First card →
      `POST`, store `{id, request_number}`. Later cards → `PUT
      /purchase-requests/{id}` with the card's items. Same `request_number` on
      every card, so the customer sees one order growing, not five.
- [x] Persist the link so a reload/resume mid-chat doesn't start a second PR →
      new `purchase_requests.conversation_id` column; `adoptAssistedPr()`
      re-adopts this chat's request on open.
- [x] If the `PUT` 400/403/404s ("Cannot edit request after it has been
      quoted"), fall back to `POST` — the previous one is already in Velonie's
      hands. Any OTHER failure (network/500) surfaces as an error instead, so a
      hiccup can't silently duplicate the shipment.
- [x] `PurchaseRequestController::update`: honor `product_image_url` on newly
      created items (`rehostItemImage`, same as `store`).
- [x] System prompt: the card is the CART SNAPSHOT for the shipment — one
      shipment = one request, re-showing it updates rather than re-orders.
- [x] Emails: `PUT` sends none — one confirmation per shipment, which is the
      point. Velonie works the PR page, which now shows the full cart.

## Also found while fixing — reopening a chat re-placed the order

`openChat()` replays a saved conversation *verbatim*, including
`tool-show_assisted_summary` parts persisted with `state: "output-available"`.
The auto-create watcher couldn't tell replayed cards from live ones, so simply
reopening chat #238 today would have fired 5 more requests. Fixed with
`assistedHandled` — every card present when history is loaded (open, cached
open, `loadOlder`, guest restore/resume) is marked as already placed, and only
cards that arrive live can create anything.

## Verification

- [x] `nuxt build` passes.
- [ ] Replay chat #238's flow on staging: 5 items added one at a time → exactly
      ONE PR, 5 items, no duplicates, one confirmation email.
- [ ] Reopen that chat → no new PR, cards show the real number, adding a 6th
      item updates the same PR.
- [ ] Add an item after the PR is quoted → new PR created, old one untouched.
- [ ] Existing bad data: audit assisted PRs for duplicate `product_url` rows
      (PR 145 has 61 items, PR 48 has 77 — likely the same inflation).
      NOT done — waiting on Alex.

## Review

**api/** (needs `php artisan migrate` on deploy)
- New migration `2026_07_26_000000_add_conversation_id_to_purchase_requests_table`
  — nullable FK to `conversations`, `nullOnDelete`.
- `PurchaseRequest`: `conversation_id` fillable.
- `PurchaseRequestController::store` — accepts + stores `conversation_id`
  (ignored unless the chat belongs to the caller).
- `PurchaseRequestController::index` — optional `conversation_id` / `status`
  filters, so the client can find this chat's open request.
- `PurchaseRequestController::update` — accepts `product_image_url` and
  re-hosts it for items added on a later turn.

**app/**
- `ShoppingAssistant.vue` — `assistedPr` (create-then-update), `assistedHandled`
  (never re-place replayed history), `adoptAssistedPr` (recover the request +
  its confirmation on reopen), reset on `newChat`/`openChat`, "Agregado a tu
  solicitud X" copy for updates.
- `server/api/assistant.post.ts` — prompt now states the card is the whole cart
  and that one chat = one request.
