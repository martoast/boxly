# Unify Admin PR Flow (Store + Assisted)

## What's wrong today

Two completely different UXs depending on `source`:

| | Store PR | Assisted PR |
|---|---|---|
| Per-item stock verification | ✅ available/unavailable toggle | ❌ none |
| Per-item delete from detail page | ❌ | ❌ |
| Per-item price/qty editing | ❌ | ❌ |
| Cost breakdown | per-item tax/shipping/commission | aggregate totals in modal |
| Quote modal | none (auto-compute from items) | manual aggregate-total form |
| Stripe invoice lines | one per item | two aggregate lines (goods + fee) |
| Validation coupling | rich (gates on stock check + cost breakdown) | none — admin can type any number |

**User's specific pain (assisted PRs):**
- Can't remove items before quoting
- Modal asks for totals the admin has to compute manually; they can mismatch the items
- The Stripe invoice doesn't reflect what the admin "intended" — it ships whatever was typed in the modal
- Two surfaces of truth (modal numbers vs items) → bugs

## What we want

**One flow.** On the PR detail page, for both source types, while PR is in `pending_review`:

1. Each item is **inline-editable** (price USD, quantity), can be **marked available/unavailable**, can be **deleted**
2. PR-level **adjustments** (admin enters): shipping to USA warehouse, sales tax, service fee % (default 8%)
3. A **live preview** below the items shows the exact Stripe invoice — every line, every USD amount, the FX rate, the MXN total
4. One **"Confirm & Send Quote"** button. What you see is what gets billed.

## The plan

### Backend (api/) — `AdminPurchaseRequestController`

**1.1 New per-item endpoint: update price + qty + stock status**
```
PUT  /admin/purchase-requests/{pr}/items/{item}
PUT  /shopping/purchase-requests/{pr}/items/{item}
```
Validates `price` (nullable), `quantity` (nullable), `stock_status` (nullable enum). Only operable while PR is `pending_review`. Replaces the existing `updateItemStockStatus` and `updateItemCostBreakdown` endpoints with a single unified one.

**1.2 New per-item delete endpoint**
```
DELETE /admin/purchase-requests/{pr}/items/{item}
DELETE /shopping/purchase-requests/{pr}/items/{item}
```
Removes the item from the PR + deletes the Spaces image (PurchaseRequestItem's model already auto-deletes its image on delete via boot hook).
Only operable while PR is `pending_review`. Errors if it's the last item (PRs shouldn't end up empty — admin should reject instead).

**1.3 Refactor `createQuote` to be ONE method**
Drop the source-based branching. New unified behavior:

- Validation accepts: `shipping_cost`, `sales_tax`, `processing_fee_percent` (default 8 if missing), `admin_notes`, `payment_method` (default 'stripe')
- Compute the subtotal from `availableItems()` × their current `price` × `quantity` (NOT from the modal — items are the truth)
- Fetch FX rate (live or fallback, same as today)
- Build Stripe line items:
  - One line per available item (description: product name + qty + USD)
  - One "Shipping to USA warehouse" line if `shipping_cost > 0`
  - One "US Sales Tax" line if `sales_tax > 0`
  - One "Service Fee (X%)" line if `processing_fee_percent > 0`
- All amounts on Stripe in MXN at the captured FX rate
- Store `items_total`, `shipping_cost`, `sales_tax`, `processing_fee`, `total_amount` on the PR for audit (these match what was sent to Stripe exactly)
- Set status to `quoted`, send Stripe invoice (or skip Stripe for `manual_deposit`)

This unifies store + assisted into one path. Store PRs that used to lean on per-item `tax_usd`/`shipping_usd`/`commission_percent` columns will now use the same aggregate fields. We can keep the existing columns on the model for back-compat / future use, but the active code path stops reading them.

**1.4 Routes** — add the two new routes (update item, delete item) inside both the `admin` and `shopping` middleware groups in `routes/api.php`.

### Frontend (app/) — admin + shopping detail pages

The two pages (`/app/admin/purchase-requests/[id]` and `/app/shopping/purchase-requests/[id]`) are near-identical sibling pages. Both edit the same way via the existing `apiNs` pattern.

**2.1 Redesign the items list (while `status === 'pending_review'`)**

For each item, render:
- Image + name + URL + options + notes (read-only)
- **Inline-editable**: `price` (USD, number input with `$` prefix), `quantity` (stepper)
- **Stock status**: 3-state toggle (Unverified / Available / Unavailable)
- **Delete button** with confirm dialog
- Computed line subtotal shown next to the inputs

Edits debounce + auto-save to the new `PUT /items/{item}` endpoint. Optimistic UI updates; toast on failure.

**2.2 Quote settings panel** (replaces the existing QuoteModal entirely)

Lives inline on the detail page (below the items list, above the preview), only visible while PR is `pending_review`:
- Shipping to USA warehouse (USD, number)
- US Sales tax (USD, number)
- Service fee % (number, default 8)
- Admin notes (textarea, optional, shown to customer in email)
- Payment method (Stripe / Manual deposit radio)

All four are reactive — changes recompute the preview live.

**2.3 Quote preview** (the "what Stripe will see" panel)

Live-computed beneath the settings:
- Items subtotal (sum of available items × price × qty), with item count
- + Shipping
- + Sales tax
- + Service fee
- = **Total USD**
- × FX rate (display with refresh button — fetches live rate from existing Frankfurter cache; cached 10 min on backend)
- = **Total MXN** (the amount the customer will be charged)
- Mini-table preview of the Stripe line items so the admin sees *exactly* what the customer will see

**2.4 "Confirm & Send Quote" button**

Replaces the current "Create Quote" button. Disabled if:
- No items marked `available`
- Some items still `unverified`
- All edits successfully saved (debounce flush)

POST to the unified `/admin/purchase-requests/{id}/quote` with the settings panel values. Server returns the PR with `status=quoted`; UI flips to the post-quote view.

**2.5 Remove the QuoteModal component** entirely after the refactor. Inline UX is clearer.

### Data model

No migration needed. Existing columns on `purchase_request_items` (`tax_usd`, `shipping_usd`, `commission_percent`, `final_usd`) stay in place for already-quoted historical PRs. New flow simply stops writing to them; we use `price` × `quantity` + the PR-level aggregates instead.

If we want to clean up later, that's a separate migration. Not needed now.

## Edge cases / decisions

1. **What happens to in-flight store PRs that already have per-item cost breakdowns?**
   On the redesigned page, we ignore the per-item breakdowns and let the admin re-enter aggregate shipping/tax/fee. The existing per-item data stays in the DB for audit but doesn't drive billing anymore. Acceptable trade-off — only PRs still in `pending_review` are affected, and Velonie's already comfortable entering aggregates (the assisted flow does it today).

2. **What if a PR has only one item and admin tries to delete it?**
   Return a 422 with message "Reject the PR instead of removing its last item." Reject is the right semantic action there.

3. **FX rate caching**
   Already handled in `fetchLiveFxRate()` (cached 10 min, falls back to config). The preview reuses the same call.

4. **Edit-then-quote race**
   Debounced auto-save fires before the quote button is enabled. If a network failure leaves an edit unsaved, the quote button stays disabled until it succeeds.

## Files touched

**Backend (3 files):**
- `app/Http/Controllers/AdminPurchaseRequestController.php` — add `updateItem`, `deleteItem`; refactor `createQuote` (drop the store/assisted branch); delete `createStoreQuote` (folded into `createQuote`)
- `routes/api.php` — two new routes × two middleware groups (admin + shopping)
- Maybe `app/Models/PurchaseRequest.php` if helper methods need adjusting (probably not)

**Frontend (~3 files):**
- `pages/app/admin/purchase-requests/[id]/index.vue` — redesign items list + add settings panel + add preview panel
- `pages/app/shopping/purchase-requests/[id]/index.vue` — same changes (or refactor to share via composable — but the existing convention duplicates them)
- Delete `components/admin/QuoteModal.vue`

## Order of work

1. Backend endpoints (item update, item delete) — small, isolated
2. Backend createQuote unification — bigger but contained
3. Frontend redesign on the admin detail page — biggest visual change
4. Mirror to shopping detail page
5. Delete QuoteModal
6. Smoke test: create a /shop checkout PR, edit items, delete one, quote it. Then create an assisted PR via /shop/request, do the same. Both should look identical and produce correct Stripe invoices.
7. Commit + push (api + app)

## Open questions for you

Before I start:

1. **Per-item Stripe lines vs aggregate**: Today, store PRs send one Stripe line per available item (transparent — customer sees "Coach Bag × 1 ... $52" etc.). Assisted PRs send 2 lines ("Cost of Goods ... $X" + "Service Fee 8% ... $Y"). In the unified flow, **I'm proposing per-item lines for both** — customers see exactly what they bought. Cleaner, more honest. Is that what you want? (Alternative: keep 2-line aggregate for both. Less detail in the email but shorter invoice.)

2. **Service fee — keep editable per-PR?** Default 8% but admin can override to e.g. 5% on a big order. Or hardcode at 8% forever. Your call.

3. **Shipping / tax — show on Stripe as separate lines, or fold into the cost-of-goods aggregate?** I'm proposing separate lines (customers like itemization). You could also bake them into items only.

4. **"Reject the PR" vs "delete last item"**: when only one item is left, do you want the admin to be forced to reject, or should we just allow empty PRs?

5. **Existing per-item cost breakdown columns** (`tax_usd`, `shipping_usd`, `commission_percent`, `final_usd` on `purchase_request_items`): leave them as dead columns, or drop them in a follow-up migration? I'd leave them for now.

Give me your answers and the go-ahead, and I'll start with the backend endpoints.

## Review

(filled in after implementation)
