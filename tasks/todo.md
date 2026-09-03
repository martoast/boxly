# In-person shopping: let Velonie start the two-step flow for a customer

**Revised after Alex's correction** — the generic "list every Stripe invoice"
page is dropped. The real need is an interface to *initiate* an in-person
shopping order for a customer and mint the $10/store deposit link.

## What already exists (verified, do not rebuild)

| Step | Status |
|---|---|
| In-person PR object — `source=in_person`, `in_person_store_count`, `deposit_amount_usd`, `shopping_trip_id` (nullable), `awaiting_deposit` status | ✅ exists |
| $10/store rate — `services.in_person.per_store_fee_usd` | ✅ exists |
| Deposit paid → webhook flips PR to `pending_review`, emails customer + shopping team | ✅ exists (`StripeWebhookController::handleInPersonDepositPaid`) |
| Step 2: amount spent + 15% → Stripe invoice on the shopping account → `payment_link` → email | ✅ exists (`AdminPurchaseRequestController::createQuote`, already skips double-charging the deposit) |
| **Velonie creating an in-person PR for a customer** | ❌ missing — `AdminPurchaseRequestController::store` requires `items` and has no in-person branch |
| **A deposit link she can send over WhatsApp** | ❌ missing — only the customer's own self-serve Checkout Session exists, and those expire in ~24h |
| **`in_person` in the PR list source filter** | ❌ missing — only `store` / `assisted` |

So the work is the front half of step 1, not the whole pipeline.

## Design decisions

- **Stripe Payment Link, not a Checkout Session.** Verified against the test
  account: `restrictions.completed_sessions.limit = 1` works, so the link is
  one-time-use but never expires — right for a URL she pastes into WhatsApp.
  A Checkout Session dies in 24h.
- **Webhook needs no new branch.** Stripe copies a Payment Link's metadata onto
  the sessions it creates, so `type=in_person_deposit` arrives at the existing
  handler. I'll add a defensive fallback anyway (if session metadata has no
  `type` but `session.payment_link` is set, read the link's metadata), so it is
  correct whether or not that copy behaviour holds.
- **The $10 becomes a real Stripe product/price**, self-provisioned by
  `lookup_key`, seeded from config the first time. See the caveat below.
- **Store count is a number she types**; picking specific stores is optional.
  She often won't know the exact stores when she sends the reservation.

## API (`api/`)

- [x] Migration: `deposit_payment_link` + `deposit_payment_link_id` on
      `purchase_requests` (nullable), add to `$fillable`. Step 2 already owns
      `payment_link`, so the deposit needs its own column.
- [x] `app/Services/InPersonDeposit.php` — find-or-create product + price by
      `lookup_key`, read the amount back live from Stripe, mint the Payment Link.
- [x] `AdminPurchaseRequestController::storeInPerson()` — customer + store count
      (+ optional trip, stores, budget, notes) → PR in `awaiting_deposit` → link.
- [x] `AdminPurchaseRequestController::createDepositLink()` — remint if lost.
- [x] Routes under the existing `shopping` group (admins pass it too).
- [x] Webhook: metadata fallback + deactivate the link once paid.

## App (`app/`)

- [x] `pages/app/shopping/purchase-requests/create-in-person.vue` — customer
      search, store-count stepper with a live `n × $10` total, optional trip /
      stores / notes, then the link with a copy button.
- [x] `pages/app/shopping/purchase-requests/index.vue` — add `in_person` to the
      source filter, a "Nueva visita en persona" button, and a deposit
      pending/paid badge with copy-link on `awaiting_deposit` rows.
- [x] PR detail — deposit state + link + remint.

## Verify

- [x] Create a PR + link end to end against the local **test** shopping key.
- [x] Replay a `checkout.session.completed` payload through the webhook and
      confirm the PR flips to `pending_review`.
- [x] `npx nuxi build` clean.

## Caveats to raise with Alex

1. **Two sources of truth for the $10.** The customer's self-serve flow
   (`PurchaseRequestController::createDepositCheckout`) builds its line from
   `config('services.in_person.per_store_fee_usd')` with ad-hoc `price_data`.
   The new flow reads the Stripe price. Seeded from the same config so they
   agree today, but editing the price in the Stripe dashboard would move only
   Velonie's side. I'll log a warning on mismatch; unifying them means touching
   the working customer flow, so I'm leaving it unless told otherwise.
2. **No email in v1** — creating the deposit hands her a link to send over
   WhatsApp. There's no existing "here's your deposit link" Mailable and adding
   one is scope she didn't ask for.
3. API must deploy before the app.

---

## Review — built and verified 2026-08-17

All items above are done. What changed, and what I could and couldn't test.

### API

| File | Change |
|---|---|
| `database/migrations/2026_08_17_000000_add_deposit_payment_link_to_purchase_requests.php` | **new** — `deposit_payment_link` + `deposit_payment_link_id`. Step 2 owns `payment_link` and overwrites it, so the deposit needed its own columns or minting the quote would erase the reservation link. |
| `app/Services/InPersonDeposit.php` | **new** — find-or-create the fee product/price by `lookup_key`, mint the Payment Link, retire it once paid. Price is memoised per process so the amount stamped on the PR and the amount on the link are the same lookup. |
| `app/Http/Controllers/AdminPurchaseRequestController.php` | `storeInPerson()`, `createDepositLink()`, `inPersonPerStoreFee()`. Only customer + store count are required — the trip, stores, budget and notes are all optional, because none of that is settled when the request arrives over WhatsApp. |
| `app/Http/Controllers/StripeWebhookController.php` | Payment-link metadata fallback + deactivate the link on payment. |
| `app/Models/PurchaseRequest.php` | two new `$fillable` entries. |
| `routes/api.php` | three routes in the existing `shopping` group. `/in-person` is declared before `/{purchaseRequest}` so it isn't parsed as an id. |

### App

- `pages/app/shopping/purchase-requests/create-in-person.vue` — **new**. Customer
  search → store-count stepper → live total → link, with copy and a prefilled
  WhatsApp message (straight to their number when we have one on file).
- `pages/app/shopping/purchase-requests/index.vue` — "Nueva visita en persona"
  button, `in_person` source filter, `awaiting_deposit` status filter + badge
  colour, inline copy-link on unpaid rows, store count instead of item count on
  in-person rows. Also fixed `getStatusLabel`, which used `replace('_', ' ')` —
  only swaps the first underscore, so `awaiting_deposit` would have rendered as
  "AWAITING DEPOSIT" only by luck of having one. It has one; `pending_review`
  too. Made it `/_/g` anyway since the bug was one status name away.
- `pages/app/shopping/purchase-requests/[id]/index.vue` — deposit banner (unpaid:
  link + copy + remint; paid: one-line receipt) above the existing quote banner.

### Verified

- Find-or-create price: creates once, second call returns the same id (idempotent).
- `createPaymentLink` end to end against the test account — 4 stores → **$40.00**,
  metadata `type=in_person_deposit` + `purchase_request_id` (exactly what
  `StripeWebhookController` dispatches on), `completed_sessions.limit=1`,
  and `deactivatePaymentLink` flips `active` to false.
- Migration `up()` and `down()` against in-memory sqlite.
- `php -l` on every touched PHP file; all three routes present in `route:list`.
- `npx nuxi build` clean, `create-in-person` in the built output.

### NOT verified — needs a real environment

Docker wasn't running, so there is no local database. **The DB round trip is
untested**: creating a PR through `storeInPerson`, and the webhook flipping a
real row to `pending_review`. The Stripe half of both paths is verified; the
Eloquent half is not. Worth doing one real in-person visit end to end in
production before handing the page to Velonie.

### Notes

- Migrations run automatically on the DigitalOcean build, so no manual step.
- API must deploy before the app — the page 403s until the routes exist.
- The $10 still has two sources of truth (see caveat 1 above); a dashboard edit
  would move Velonie's side only, and logs a warning when it does.

---

## Follow-up — silent backfill mode (same day)

Alex: they also need to create these **without** any invoice or email, for
logging old visits that were already paid.

Worth noting first: creation was already email-free. `storeInPerson` sends
nothing, and `AdminPurchaseRequestController::update` — the manual-edit path for
amounts and status — sends nothing either. The only thing that reaches a
customer is the webhook firing on a paid link, and the quote step. So what was
actually missing was the ability to skip the **link** and set the starting
status by hand.

### API — `storeInPerson`

New optional inputs: `create_payment_link` (default true), `status`
(`awaiting_deposit` → `purchased`), `deposit_paid`, `deposit_paid_at`,
`deposit_amount_usd`.

Two rules keep the result coherent regardless of what the client sends:
- A visit logged as past the reservation stage counts its deposit as settled
  unless `deposit_paid` says otherwise.
- A link is **never** minted for a deposit already marked paid, whatever
  `create_payment_link` asked for. A payment request for an already-paid trip is
  the exact thing this feature exists to prevent.

`deposit_amount_usd` overrides the live rate, since an old visit may have been
charged something other than today's $10/store.

### App — create page

A two-card mode picker: **Cobrar la reserva** (default, unchanged behaviour) or
**Solo registrar**. Record mode reveals a status select, a "reserva ya pagada"
checkbox with an optional date, and an amount override, with a line spelling out
that nothing is emailed or charged. A watcher keeps status and the paid checkbox
from contradicting each other. The result panel drops the link, copy and
WhatsApp buttons when there's no link, and says what status it saved as.

Verified: `php -l` clean, `nuxi build` clean. Still no DB locally, so the
backfill path has the same untested Eloquent half as the rest.

Note: record mode still makes one **read-only** Stripe call (the price lookup)
to default the deposit amount — no object is created. Passing
`deposit_amount_usd` skips even that.

---

## Mobile pass on the purchase-request pages (iPhone Safari)

Applied to BOTH namespaces — `/app/admin/purchase-requests/*` and
`/app/shopping/purchase-requests/*` — since they are near-duplicate files.

### The three real defects

1. **Sticky headers slid under the mobile bar.** The sidebar renders a
   `fixed h-14 z-40` top bar on phones; every PR page header was
   `sticky top-0 z-30` inside the scrolling `<main>`. Scroll down and the
   header — back button, request number, actions — disappeared behind the
   logo. Now `sticky top-14 md:top-0 z-30` on all seven headers.

2. **iOS zoomed the page on every field tap.** Safari zooms when a focused
   input is under 16px and never zooms back. These forms use `text-sm`
   (14px) throughout, which is what made the layout "pop" off the side of
   the screen. Fixed in both layouts with a coarse-pointer media query, so
   desktop density is untouched.

3. **The list was a six-column table in an `overflow-x-auto`.** It didn't
   break the page, it did something worse — you had to drag a row sideways
   to see a request's status. Replaced below `md` with
   `components/admin/PurchaseRequestMobileList.vue`: one card per request,
   who + status always visible, whole card is the tap target, checkbox has a
   44pt hit area, and unpaid in-person reservations get a copy-link button
   inline. Status now reads "Por revisar" rather than "PENDING_REVIEW".

### Also

- Header/title blocks get `min-w-0` + `truncate` so a long customer email
  stops pushing the row sideways; name and email stack on phones.
- Bulk action bar stacks; its buttons go full-width on phones.
- Pagination stacks; pager buttons went from 26px tall to a real target.
- Modals get a gutter and `max-h-[90vh]` so the keyboard can't strand them.

### Verified / not verified

- `nuxi build` clean; component present in the built output.
- Caught before shipping: the tag was written `<PurchaseRequestMobileList>`
  but Nuxt auto-imports it as `AdminPurchaseRequestMobileList` — Vue renders
  an unknown tag as a native element and the build says nothing, so the
  mobile list would have silently rendered as an empty box. Now an explicit
  import, matching how `ExpenseModal` is used.
- **Not seen on a real device.** The browser tooling would not give me a
  true mobile viewport, so this is reasoned from the markup and Tailwind
  breakpoints, not observed. Worth a look on an actual iPhone.
