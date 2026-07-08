# Order: make "paid" final + add payment-location field

Decisions (confirmed with Alex): paid-final on **admin + customer**; payment location editable in **both** the mark-paid modal and inline in order details. Non-destructive: keep shipped/delivered enum values + labels so legacy orders still render.

## API (api repo)
- [ ] Migration: add `paid_location` (nullable string) to `orders`, after `paid_at`
- [ ] `Order.php`: add `paid_location` to `$fillable`; add `PAID_LOCATIONS` const (`NU`, `HSBC`, `Stripe`)
- [ ] `AdminOrderController::markConsolidationPaid`: validate + store `paid_location`
- [ ] `AdminOrderController::updateStatus`: store `paid_location` when moving to paid (optional)
- [ ] `AdminOrderManagementController::updateOrder`: add `paid_location` validation rule (powers inline edit)

## Frontend (app repo) — make paid final
- [ ] `useOrderStatus.js`: trim `statusOrder` to end at `paid` (+`cancelled`); keep label/color maps for legacy; map `SHIPPING_MAP.paid` → "Pagado" complete badge
- [ ] `OrderProgressTimeline.vue`: shipping timeline ends at a final **Paid** step (drop Shipped/Delivered steps); crossing timeline ends at the payment step (drop Picked Up)
- [ ] `OrderStatusCard.vue`: map `paid` to a terminal "Payment received" stage (keep legacy `processing` → preparing)
- [ ] Admin `[id]/index.vue`: next-action no longer offers Ship for `paid` (keep legacy `processing`)

## Frontend (app repo) — payment location
- [ ] `AdminOrderModalMarkPaid.vue`: required NU/HSBC/Stripe dropdown; send `paid_location` in POST body
- [ ] Admin `[id]/index.vue`: inline location select next to the paid date; saves via `PUT /admin/orders/{id}`

## Review
Done — non-destructive (kept legacy enum values + labels so old shipped/delivered orders still render).

**API (boxly-api):**
- New migration `2026_07_04_000000_add_paid_location_to_orders_table` — nullable `paid_location` string(20) after `paid_at`. Runs on next API deploy.
- `Order.php`: added `paid_location` to `$fillable`; added `PAID_LOCATIONS = ['NU','HSBC','Stripe']` const.
- `markConsolidationPaid`: validates + stores `paid_location` (nullable|in).
- `updateStatus`: stores `paid_location` on the paid transition when provided; `AdminUpdateOrderStatusRequest` now allows it.
- `updateOrder` (PUT /admin/orders/{id}): added `paid_location` rule → powers inline edit.

**Frontend (boxly app) — paid = final:**
- `useOrderStatus.js`: `statusOrder` ends at `paid` (+cancelled); `SHIPPING_MAP.paid` now shows a green "Pagado" badge instead of "Preparing shipment".
- `OrderProgressTimeline.vue`: shipping ends at a final green **Paid** step (dropped Shipped/Delivered); crossing ends at the payment step (dropped Picked Up); swapped computeds accordingly.
- `OrderStatusCard.vue`: `paid` → terminal "¡Pago recibido!" stage (green, no "next update"); legacy `processing` still maps to preparing.
- Admin `[id]/index.vue` next-action: no longer offers Ship for `paid` (legacy `processing` still can ship).
- `UserOrderStatusBanner.vue`: already showed "Order Complete" for paid — unchanged.

**Frontend — payment location:**
- `AdminOrderModalMarkPaid.vue`: required NU/HSBC/Stripe segmented picker; confirm disabled until chosen; sends `paid_location`.
- Admin `[id]/index.vue`: inline "Pagado en" select in Financials (shows once paid); saves via `PUT /admin/orders/{id}` and updates in place.

Note: the `paid_location` column needs the migration to run (API deploy). Until then the field saves are no-ops server-side; UI is safe (nullable).
