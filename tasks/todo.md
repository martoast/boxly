# Chat: two purchase paths (Boxly buys vs. I bought it myself)

## Goal
In the assistant chat, when a product is being confirmed, make BOTH paths clear in the message itself (not just in the product modal):
1. **Compra asistida** — Boxly buys it (+10% at checkout) → **Purchase Request** (already wired: `create_purchase_request`).
2. **Compra propia (casillero)** — customer buys it themselves, ships to their Boxly US address → **normal shipping ORDER** (no 10%). NEW.

And wire it so when the user says in chat "ya lo compré / lo compré yo", the chat collects the **proof of purchase** (key for verification) and creates the shipping order with that product.

## What creating a shipping order needs (from API audit)
- `POST /orders` → order in `collecting` status. Requires `order_type:shipping` + `delivery_address` (full_address string OR street/colonia/municipio/estado/postal_code). `OrderController@create`.
- `POST /orders/{order}/items` (multipart) → `product_name` (req), `quantity` (req), `product_url`, `declared_value`, optional `proof_of_purchase` file (jpg/png/pdf, ≤10MB), optional `product_image` file. `OrderItemController@store` / `StoreOrderItemRequest`.
- Per-item proof accepts images (good for phone receipts); order-level `/proofs` is PDF-only (not used here).
- Item create does NOT currently accept `product_image_url` (only a file) → tiny API change so we can pass the registry image URL.
- User model already stores a saved address (street/colonia/postal_code/full_address).

## Plan

### API (api/) — minimal
- [ ] `StoreOrderItemRequest`: add `product_image_url => nullable|url|max:1000`.
- [ ] `OrderItemController@store`: include `product_image_url` in the `items()->create([...])` array (uploaded `product_image` file still overwrites it later, unchanged).

### Backend chat tool (app/server/api/assistant.post.ts)
- [ ] Add CLIENT-executed tool `create_self_order` (no server `execute`, mirrors `create_account`) — the browser owns it because the proof file lives in the browser. Input: `items[]` (saved_id OR product_name/url/image/price, quantity, notes).
- [ ] System prompt: when confirming a product the user wants, present BOTH paths in text (tú lo compras → casillero, sin comisión; Boxly lo compra → +10%). On "ya lo compré / lo compré yo" → confirm product, explain we need the comprobante to verify, call `create_self_order`. On "cómpralo por mí" → `create_purchase_request` (unchanged).

### Frontend (app/components/ShoppingAssistant.vue)
- [ ] `onToolCall`: handle `create_self_order` → `pendingSelfOrder = { toolCallId, items }`.
- [ ] Proof-upload modal (mirrors pendingAccount): shows item(s), required file input (image/pdf), [address handling — see decision], submit/cancel.
- [ ] Submit: resolve delivery_address → `POST /orders` → for each item multipart `POST /orders/{id}/items` (product_name, quantity, product_url, declared_value=price, product_image_url; attach proof file to first item) → `addToolResult({ tool:'create_self_order', toolCallId, output:{ success, order_number } })`.
- [ ] Guest: same create_account gate as PR before this can run.

## DECISION (resolved)
Delivery address: reuse the SAVED address but ALWAYS show it in the modal,
prefilled and editable, so the user confirms "this is the address I have for
you — ship here?" before the order is created.

## Review
**API (api/) — 2 tiny changes:**
- `StoreOrderItemRequest`: added `product_image_url => nullable|url|max:1000`.
- `OrderItemController@store`: pass `product_image_url` into the item create (an
  uploaded `product_image` file still overwrites it, unchanged). Lets the chat
  attach the product image we already have from the search registry.

**Chat backend (app/server/api/assistant.post.ts):**
- New CLIENT-executed tool `create_self_order` (no server execute) for "ya lo
  compré yo" → casillero shipping order. Mirrors `create_account`.
- System prompt: now ALWAYS presents BOTH paths in the message when the user
  zeroes in on a product (Tú lo compras → casillero sin comisión; Boxly lo
  compra → +10%), and routes to the right tool: `create_purchase_request`
  (assisted, 10%) vs `create_self_order` (self-buy, no fee). Added post-success
  confirmation guidance + guest/cancel handling.

**Frontend (app/components/ShoppingAssistant.vue):**
- `onToolCall` handles `create_self_order` → `openSelfOrder` opens a proof+address
  card. Guests are bounced back to account creation (avoids a /login redirect).
- Modal: shows item(s), delivery address (prefilled from saved profile via
  /profile, editable, required), required proof-of-purchase file (image/pdf).
- `submitSelfOrder`: POST /orders (shipping, full_address) → multipart POST
  /orders/{id}/items per item (proof attached to the first) → addToolResult.
- `continueAfterAccount` extended to resume the model after `create_self_order`
  completes, so it confirms the order to the user.

**Deploy:** app AND api both need redeploy (api for the item product_image_url
field; app for the tool + UI).

