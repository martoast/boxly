# A list of product links → one box, one purchase request

Alex 2026-10-10: shoppers who already have the links want to paste them all at once and have the AI add them to the cart, get the total, and create ONE purchase request, without searching for each product one by one.

## How it works for the shopper
1. They paste a list of links in one message (any separator, any mix of stores).
2. The chat answers right away with one card per link (as the box reads each page).
3. A link that already names the exact product version (e.g. Shopify `?variant=`, Amazon ASIN, a colour page) is added as-is. A link that still needs a choice (size, colour) shows a compact chip row on its card. Nothing is guessed.
4. A link we can't buy from (a store not on LIVE STORES, a dead page, sold out) says so on its card and the rest continue.
5. When every card is chosen, one tap of "Agregar todo" puts everything in the box. Then the normal Finalizar builds each store's cart one store at a time, gets the totals and creates ONE purchase request with every item.

## Plan (smallest change on top of what exists)
- [x] **Detect a link list.** In the assistant, a user message with 2+ product URLs is a link list (no search). Up to 20 links per message.
- [x] **Read all links in parallel.** For each URL, the product read we already use for a pasted link (product-variants), up to 4 at a time. Each result is streamed to the chat as soon as it is ready.
- [x] **Decide each link's choice.** A store version in the address (`?variant=`, size/colour params, Amazon `psc`) → already chosen. Otherwise options with more than one value → the shopper picks. A one-value product → nothing to choose.
- [x] **One "link list" card.** A single card lists every link: photo, name, store, price, its chips when it needs a choice, its status (ready / choose / can't buy). Reuses the picker's chip logic and stock marks. Button: "Agregar todo (N)".
- [x] **Add all at once.** "Agregar todo" sends the picks and adds every ready item to the box with one `show_shipment` (it already takes many items).
- [x] **Finalizar as today.** The box → each store's cart one store at a time → totals → ONE purchase request. Nothing new here.
- [x] **Tests.** Link detection (separators, duplicates, non-product links); variant-in-URL decisions for the main stores; the card's states.
- [x] **Live proof.** Lab account: a list of 6 links across 3 stores (e.g. Gymshark, AE, Nordstrom Rack) with some already-chosen and some needing a size → one box → Finalizar → one PR with every item and verified totals. Delete the lab PR after.

## Answers (Alex)
- 20 links per message.
- A link we can't buy: offer a similar product from a store we support ("Buscar similar" on its row; the AI also offers it).

## Review
**Live proof (lab, 2026-10-10):**
- 6 links pasted: YoungLA pinned to Beige/Large, AE jean, Nordstrom Rack dress, Gymshark leggings, a YoungLA tee needing colour + size, and Shein.
- The card read every page in ~14 s. Shein showed "no disponible" with "Buscar similar". The pinned link was ready on its own; the others were picked on their rows.
- "Agregar todo (5)" put all 5 in the box with the store's own option values.
- Finalizar created ONE purchase request (PR-26-CTQAM): YoungLA $89.88, AE $53.17, Nordstrom Rack $90.73, Gymshark $63.58 — all verified, $341.96 total. Lab PRs deleted.

**What changed (app):**
- `utils/linkList.ts` (+ tests): link extraction, list validation, box items.
- `show_link_list` tool: links taken from the message; buyable or not by the Finalizar rule. The `show_shipment` link-list branch adds the whole list with no hold.
- Both steps are mandatory in `prepareStep`. Prompt rule ②b.
- `components/LinkListCard.vue`: each row is the product's own picker card. `ShoppingAssistant.vue`: render + "Agregar todo" + "Buscar similar".

**Fixes the proof needed (engine):**
- A ?variant= link reads with that variant selected (and live: the cache does not keep variant addresses).
- A page still loading with no price/options is a failed read, not an "ok" product.
- A Shopify product in the store's preview-restock / coming-soon collection is not sold yet. YoungLA's hoodie said "RESTOCKS ON OCT 13" while every API said available.
- A quote refuses a checkout press once while a selection was never added.

