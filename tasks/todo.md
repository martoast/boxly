# Boxly Store — Frontend Implementation Plan

## Vision

Add the **Boxly Store** — a clean, modern e-commerce storefront inside the Boxly app. Customers browse products Boxly stocks, add them to cart, and pay at checkout. The visual feel is consumer e-commerce (Shopify-clean), not wholesale.

**The Boxly twist:** purchases accumulate into the customer's *open shipment*. They can buy a little now and add more later — items wait at our San Diego warehouse until they request shipment. When they're ready, Boxly consolidates everything into one box and invoices shipping. Bigger consolidated shipments = cheaper per-kg.

**No minimum to buy.** A customer can buy 1 product or 50, today or over weeks. The cart shows an *estimate* of what box their current shipment fits in (XS/S/M/L/XL), but the actual box is only assigned when they request shipment and Boxly packs it.

The cart is **box-aware** as a helpful guide: "Tu envío actual pesa ~5 kg, cabría en una caja XS · Sigue agregando para optimizar tu envío." Never prescriptive, never blocking.

---

## UX Principles (non-negotiable)

These rules protect customer trust and keep the cart honest:

1. **No "Total" line at checkout that includes shipping** — only products are charged at checkout. Shipping is a second invoice after consolidation.
2. **Shipping is always shown as an estimate**, never as a guarantee. Always labeled "estimado".
3. **Box recommendation is informational**, not a commitment. Phrases like "cabría en caja M" are fine; never "your box is M" or "shipping: $4,000".
4. **No minimum order, ever.** Customers can buy as little as they want. The "open shipment" model means small purchases accumulate over time.
5. **Always show the open shipment context** — when a customer has a `collecting` order, the cart and product pages reference it: "Esto se sumará a tu envío actual (X productos, ~Y kg)".
6. **Two-step payment is upfront in messaging** — "Pagas productos ahora. El envío se cotiza cuando pidas que enviemos tu caja."

---

## Page Structure (Phase 1)

### Customer-facing
| Route | Purpose |
|-------|---------|
| `/app/shop` | Storefront browse — grid of products, filters, search |
| `/app/shop/[slug]` | Product detail — gallery, description, weight/dims, Add to Cart |
| `/app/cart` | Cart — list, weight bar, box estimate, checkout CTA |
| `/app/checkout` | Address + payment — redirects to Stripe Checkout |
| `/app/marketplace-orders` | Customer's marketplace order history |
| `/app/marketplace-orders/[id]` | Order detail — status timeline, items, pay-shipping CTA when ready |

### Admin
| Route | Purpose |
|-------|---------|
| `/app/admin/products` | List + manage Boxly's inventory |
| `/app/admin/products/create` | Create product (with weight + dims required) |
| `/app/admin/products/[id]/edit` | Edit product, manage images |
| `/app/admin/marketplace-orders` | List of marketplace orders, work queue |
| `/app/admin/marketplace-orders/[id]` | Order detail — assign box, mark items received, upload GIA |
| `/app/admin/products/expiring` | 7-day window dashboard for return logistics |

---

## Cart Composable Spec

Build `composables/useMarketplaceCart.ts` (or `.js`). Singleton cart state, localStorage persistence.

```ts
useStoreCart() returns {
  items: Ref<CartItem[]>           // {product_id, slug, name, price_cents, weight_kg, image, quantity}

  // current cart (this checkout)
  totalItems: ComputedRef<number>
  cartWeightKg: ComputedRef<number>
  cartSubtotalCents: ComputedRef<number>

  // open shipment context (fetched from API: GET /marketplace/orders/current)
  openOrder: Ref<Order | null>      // null if customer has no collecting order
  openOrderWeightKg: ComputedRef<number>          // weight of items already in open shipment
  combinedWeightKg: ComputedRef<number>           // openOrder + cart, what would be in shipment after this checkout

  // box estimate — based on combinedWeightKg
  estimatedBox: ComputedRef<'XS'|'S'|'M'|'L'|'XL'|'over_50'|null>
  estimatedShippingCents: ComputedRef<number | null>   // always labeled "estimado"
  fillPercent: ComputedRef<number>                     // 0..100 within estimatedBox
  nextBoxThresholdKg: ComputedRef<number | null>       // for "add ~X kg to reach next box"

  // actions
  add(product, qty=1)
  setQuantity(productId, qty)
  remove(productId)
  clear()
}
```

**Behavior rules:**
- No minimum order. Cart can be 1 item, any weight. Checkout never blocks on size.
- Box estimate uses `combinedWeightKg` (open shipment + this cart) so it reflects the real shipment that's being built.
- If `combinedWeightKg > 50` → cart still allows checkout, but the "request shipment" action on the open order will warn that it must be split. (We let them buy; shipping is what splits.)

**Box thresholds** (mirror landing page `BoxPricing.vue`):
- XS: ≤ 8 kg → $1,200 MXN
- S: ≤ 15 kg → $2,200 MXN
- M: ≤ 25 kg → $4,000 MXN ⭐
- L: ≤ 35 kg → $5,100 MXN
- XL: ≤ 50 kg → $6,250 MXN
- over 50: split into multiple orders

---

# Phase 1 Tasks — MVP Storefront

## 1. Cart Composable & Layout

- [ ] **1.1** Build `useStoreCart()` composable per spec above
- [ ] **1.2** Persist cart items to localStorage; rehydrate on mount; sync across tabs
- [ ] **1.3** On mount + on auth change, fetch the user's open marketplace order via `GET /marketplace/orders/current`
- [ ] **1.4** Add cart icon + badge to existing main app layout header (next to user menu)
- [ ] **1.5** Cart icon shows item count; tapping opens cart page
- [ ] **1.6** Add **"Tienda"** link to main app navigation (just "Tienda" / "Store", no wholesale framing)

## 2. Storefront Browse `/app/shop`

- [ ] **2.1** Page layout: header with title "Tienda", search input, category filter pills
- [ ] **2.1b** **Open shipment banner** (when customer has a `collecting` order): top of page shows "Tu envío actual: X productos · ~Y kg · cabría en caja Z (estimado)" with link to view shipment
- [ ] **2.2** Product grid — responsive (2 cols mobile, 3 tablet, 4 desktop)
- [ ] **2.3** `ProductCard` component:
  - Image (first from images array, fallback placeholder)
  - Name (truncate to 2 lines)
  - Price (large, MXN)
  - Subtle weight chip ("0.8 kg")
  - Optional `available_until` countdown ("Disponible 5 días más")
  - Hover lift on desktop, active scale on mobile
- [ ] **2.4** Empty state when no products
- [ ] **2.5** Loading skeletons
- [ ] **2.6** Pagination
- [ ] **2.7** Search debounced 300ms

## 3. Product Detail `/app/shop/[slug]`

- [ ] **3.1** Hero gallery — image carousel, large primary, thumbnails strip
- [ ] **3.2** Right column:
  - Name, price (large, MXN)
  - Quantity stepper (default 1, no minimum)
  - "Agregar al carrito" button
- [ ] **3.3** Description (markdown or plain text from API)
- [ ] **3.4** Specs section: peso, dimensiones, SKU, categoría — clean table
- [ ] **3.5** "Agregar al carrito" pulses + brief feedback on confirm
- [ ] **3.6** Stock messaging: "Solo X disponibles" if stock < 10, "Agotado" if 0
- [ ] **3.7** Disable Add to Cart if expired or sold out
- [ ] **3.8** Related products row at bottom (same category)

## 4. Cart Page `/app/cart`

- [ ] **4.1** List: each row is image + name + qty stepper + price + line total + remove
- [ ] **4.2** Empty state: "Tu carrito está vacío" + CTA to /app/shop
- [ ] **4.3** **Open shipment context card** (when customer has a `collecting` order):
  - "Estos productos se sumarán a tu envío actual"
  - Shows current open shipment summary: X productos, ~Y kg
  - Link: "Ver mi envío" → goes to the marketplace order detail
- [ ] **4.4** **Box estimate panel** — informational, never restrictive:
  - Combined weight (open shipment + cart): "Total después de esta compra: ~Z kg"
  - Box callout: "Cabría en una caja **M** *(envío estimado ~$4,000 MXN, se confirma al consolidar)*"
  - Helpful nudge if close to next box: "Si agregas ~6 kg más, llenas una caja L y bajas tu costo por kg"
  - If combined > 50kg: gentle banner — "Tu envío pasa los 50 kg. Cuando pidas envío, lo dividiremos en dos cajas."
- [ ] **4.5** Subtotal line — items only (no shipping)
- [ ] **4.6** Disclaimer card: "**Pagas productos ahora.** El envío se cotiza cuando pidas que enviemos tu caja desde San Diego."
- [ ] **4.7** "Ir a pagar" button — always enabled when cart has items
- [ ] **4.8** Mobile-first sticky checkout footer with subtotal + CTA

## 5. Checkout Page `/app/checkout`

- [ ] **5.1** Address block: pre-fill from `user.full_address`; allow override for this order
- [ ] **5.2** Order summary: items + subtotal (no shipping line in payment total)
- [ ] **5.3** Box estimate restated as info, not commitment
- [ ] **5.4** Big "Pagar productos" button → calls `POST /marketplace/checkout` → redirects to Stripe Checkout URL
- [ ] **5.5** On Stripe success redirect → `/app/marketplace-orders/[id]?status=success`
- [ ] **5.6** On cancel → back to cart with toast "Pago cancelado"
- [ ] **5.7** Loading state while creating session

## 6. Marketplace Order Pages

### Customer order list `/app/marketplace-orders`
- [ ] **6.1** Reuse styling of `/app/orders` list page
- [ ] **6.2** Status badges with colors — pending/items_paid/packing/awaiting_shipping_payment/shipped/delivered/refunded
- [ ] **6.3** Empty state CTA → /app/shop

### Customer order detail `/app/marketplace-orders/[id]`
- [ ] **6.4** Status timeline: Acumulando productos → Listo para enviar → Empacando → Pago de envío → Enviado → Entregado
- [ ] **6.5** Items list with snapshots (image, name, qty, price), grouped by purchase date
- [ ] **6.6** Shipping address block (editable while in `collecting`)
- [ ] **6.7** **When status = `collecting`** (the most-used state for active customers):
  - Big "Pedir envío" CTA → calls `POST /marketplace/orders/{id}/request-shipment` → moves to `ready_to_ship`
  - Shipment summary: total productos, peso estimado, caja estimada
  - Friendly hint: "Sigue agregando productos a tu envío para optimizar el costo de envío" + button "Ir a la tienda"
  - Shipping address editable
- [ ] **6.8** When status = `awaiting_shipping_payment`: prominent "Pagar envío — caja {box_size} ${box_price}" CTA → opens Stripe payment link
- [ ] **6.9** When `shipped`: GIA link, tracking #, estimated delivery
- [ ] **6.10** When `delivered`: delivered date, optional "Comprar de nuevo" CTA
- [ ] **6.11** Cancel button while `collecting` or `ready_to_ship` (refunds items, restores stock)

## 7. Admin Product Management

### List `/app/admin/products`
- [ ] **7.1** Table: image thumb, name, price, stock, status badge, available_until, actions
- [ ] **7.2** Filters: status, category, expiring soon
- [ ] **7.3** "Crear producto" button top-right

### Create `/app/admin/products/create`
- [ ] **7.4** Form sections:
  - Basic: name, slug (auto from name, editable), category, description, SKU (optional)
  - **Sourcing** (admin-only): `source_url` — paste the link to where Boxly buys this product. Future: auto-extract data from this URL
  - Pricing: price (MXN), stock
  - Selling window: available_until (optional, for clearance)
  - **Required physical**: weight (kg), dimensions (L × W × H cm) — validated server-side, used for box estimation
  - Images: drag-drop multi-upload (reuse existing Spaces upload pattern, with client-side compression)
- [ ] **7.5** Image previews with reorder + delete
- [ ] **7.6** Save creates draft → admin can publish from edit page

### Edit `/app/admin/products/[id]/edit`
- [ ] **7.7** Same form, pre-filled
- [ ] **7.8** Status toggle (draft/active/inactive/sold_out)
- [ ] **7.9** Image management: add/remove/reorder existing
- [ ] **7.10** Delete button with confirmation

## 8. Admin Marketplace Order Management

### List `/app/admin/marketplace-orders`
- [ ] **8.1** Default tab: "Por empacar" (status `ready_to_ship` and `packing` — these are customer-requested shipments)
- [ ] **8.2** Other tabs: Acumulando (collecting — informational, not a work queue), Esperando pago de envío, Listas para enviar, Enviadas, Entregadas, Reembolsadas
- [ ] **8.3** Sortable: by date, customer name, item count
- [ ] **8.4** Search by order number or customer name

### Detail `/app/admin/marketplace-orders/[id]`
- [ ] **8.5** Reuse layout patterns from `app/admin/orders/[id]` for consistency
- [ ] **8.6** Customer card top
- [ ] **8.7** Items list — checkbox or button per item to mark received
- [ ] **8.8** When all items received: prominent "Asignar caja y enviar cotización" panel
  - Choose box size (XS/S/M/L/XL with prices visible)
  - Optional packing notes
  - "Enviar invoice de envío" button → calls API → invoice link generated and emailed
- [ ] **8.9** When `awaiting_shipping_payment`: shows "Esperando pago del cliente" + invoice link
- [ ] **8.10** When `shipping_paid`: "Subir GIA y marcar enviado" panel (reuse existing GIA upload component)
- [ ] **8.11** Refund button with reason input

### Expiring products `/app/admin/products/expiring`
- [ ] **8.12** Simple list of products with `available_until` ≤ 7 days
- [ ] **8.13** Mark as "Returned to retailer" action → sets status=inactive
- [ ] **8.14** Surface this view as a card on the main admin dashboard

## 9. Cross-Cutting

- [ ] **9.1** Toast component for feedback (already exists — `Toast.vue`)
- [ ] **9.2** Confirmation modal for destructive actions
- [ ] **9.3** Translations (es/en) for all marketplace strings
- [ ] **9.4** Loading skeletons for all list pages
- [ ] **9.5** Error states with retry
- [ ] **9.6** SEO meta tags on product detail (title, og:image, description)

## 10. Image Compression

- [ ] **10.1** Reuse the client-side compression pattern from `pages/app/employee/packages/[id]/index.vue` (canvas resize to 1600px @ 78%) for **product image uploads** — sellers/admins are often on slow connections too

---

# Phase 1.5 — Ride-Along With Forwarding Orders

- [ ] **1.5.1** On `/app/orders/[id]` (forwarding order detail) when status is `collecting` or `awaiting_packages`: show a "Añadir productos Boxly a esta caja sin costo extra de envío" CTA
- [ ] **1.5.2** Opens a slide-over with a mini storefront filtered to active products
- [ ] **1.5.3** Add to existing order — calls `POST /orders/{id}/marketplace-items`
- [ ] **1.5.4** Customer pays only product cost via Stripe Checkout (no shipping line)
- [ ] **1.5.5** Marketplace items show inline in the forwarding order's item list with a "Boxly" badge
- [ ] **1.5.6** Admin sees them in the existing order detail page packing list

---

# Phase 2 — Polish (Post-MVP)

- [ ] Reviews & ratings UI on product detail
- [ ] Categories navigation in storefront
- [ ] Search with autocomplete
- [ ] Product variants (size/color) selector UI
- [ ] Wishlist / save for later
- [ ] "Re-buy" from delivered orders
- [ ] Bulk product CSV upload (admin)
- [ ] Tiered/volume pricing UI (Phase 1 is flat per-unit)
- [ ] Auto-fetch product preview from `source_url` to speed up admin upload

---

## Files Affected (Phase 1)

### New files
```
composables/useMarketplaceCart.ts

components/marketplace/ProductCard.vue
components/marketplace/CartLineItem.vue
components/marketplace/BoxFillPanel.vue
components/marketplace/CheckoutSummary.vue
components/marketplace/MarketplaceOrderTimeline.vue
components/admin/AdminProductForm.vue
components/admin/AdminProductImageManager.vue
components/admin/AdminMarketplaceOrderItemRow.vue
components/admin/AssignBoxPanel.vue

pages/app/shop/index.vue
pages/app/shop/[slug]/index.vue
pages/app/cart.vue
pages/app/checkout.vue
pages/app/marketplace-orders/index.vue
pages/app/marketplace-orders/[id]/index.vue

pages/app/admin/products/index.vue
pages/app/admin/products/create.vue
pages/app/admin/products/[id]/edit.vue
pages/app/admin/products/expiring.vue
pages/app/admin/marketplace-orders/index.vue
pages/app/admin/marketplace-orders/[id]/index.vue
```

### Modified files
```
layouts/app.vue            (add Shop link + cart icon to nav)
components/AppNavbar.vue   (or wherever main nav lives — wire cart icon)
i18n/translations/es.json  (add marketplace strings)
i18n/translations/en.json
```

---

## Open Questions for Team Review

1. **Cart drawer vs full cart page** — recommend full page for clarity; drawer can come later
2. **Address re-entry at checkout** — recommend pre-fill from profile + "Use a different address" toggle
3. **Stripe Checkout vs Payment Element** — recommend Stripe Checkout (simpler, hosted)
4. **Cart persistence across devices** — localStorage only for MVP
5. **Estimated shipping display** — single estimate with box-name shown + "se confirma al consolidar" disclaimer
6. **Open shipment surfacing** — should we put a persistent "Mi envío actual" mini-widget in the app navbar (always visible when `collecting` exists), or only in the storefront/cart? Recommend storefront/cart only for MVP, persistent widget later if useful.
7. **Auto-prompt to ship** — should we email customers after N days of inactivity in `collecting` to remind them they can request shipment? Recommend yes, after 14 days, but ship without it for MVP.

---

## API Counterpart

See `api/tasks/todo.md` for the Laravel-side plan (data models, endpoints, webhook handling, admin controllers, refund/cancel logic).

---

## Review — Phase 1 Implementation Complete

**Cart composable + nav** ✅
- `composables/useStoreCart.ts` — singleton with localStorage persistence, cross-tab sync,
  open-shipment context fetching, box estimation based on combined weight
- CustomerNavbar: Tienda link + cart icon with count badge
- LandingNavbar: Tienda link + cart icon (visible for guest users browsing)

**Public storefront** ✅
- `pages/shop/index.vue` — paginated grid (24/page) with search (debounced 300ms),
  sort (newest/price asc-desc), category pills, smart pagination with ellipses,
  responsive 2/3/4 col grid, URL state, open shipment banner for logged-in users
- `pages/shop/[slug]/index.vue` — Amazon-style detail with:
  - Image gallery (large primary + thumbs + click-to-zoom lightbox)
  - Sticky info column on desktop with name, price, qty stepper, Add to Cart, Buy Now
  - Stock indicators (in stock / only N left / sold out)
  - Trust signals (verified, consolidation, shipping later)
  - Specs table (weight, dimensions, SKU, category)
  - Full description below
  - Related products grid
  - SEO meta tags (title, og:image, description)
- `components/store/ProductCard.vue` — reusable card with expiring-soon badge

**Cart + Checkout** ✅
- `pages/cart.vue` — public, qty steppers, line items, sticky summary sidebar
  with box estimate panel, fill progress bar, next-box-threshold nudge,
  open shipment banner, "pay products now / shipping later" disclaimer
- `pages/checkout.vue` — auth-gated (redirects to login with redirect=/checkout),
  pre-fills address from profile, calls `/marketplace/checkout`, redirects to Stripe

**Customer marketplace orders** ✅
- `pages/app/marketplace-orders/index.vue` — paginated list with status badges
- `pages/app/marketplace-orders/[id]/index.vue` — status-aware detail:
  - `collecting` → big "Pedir envío" CTA with weight + box estimate
  - `awaiting_shipping_payment` → "Pagar envío" linking to Stripe invoice
  - `shipped`/`delivered` → tracking + delivery dates
  - Cancel CTA when status allows

**Admin product CRUD** ✅
- `pages/app/admin/products/index.vue` — paginated table with status filter, search
- `pages/app/admin/products/create.vue` — form
- `pages/app/admin/products/[id]/edit.vue` — pre-filled form, multi-image upload
  with client-side compression (1600px @ 78%), per-image delete, deactivate
- `components/admin/AdminProductForm.vue` — reusable form

**Admin marketplace orders** ✅
- `pages/app/admin/marketplace-orders/index.vue` — tabbed list (Por empacar default)
- `pages/app/admin/marketplace-orders/[id]/index.vue` — full workflow:
  - Visual box selector (XS-XL with prices), assigns box + sends Stripe invoice
  - GIA upload + mark-shipped flow
  - Per-item mark-received toggle
  - Mark-delivered after shipped
  - Refund panel with reason input

**Components** ✅
- `MarketplaceStatusBadge.vue` — shared status badge with i18n labels and colors
- `AdminProductForm.vue` — shared form for create + edit

**Sidebar nav** ✅ — Added Productos Tienda + Pedidos Tienda links

**Translations** ✅ — All marketplace strings have es/en versions inline per page

**Pending operational steps:**
- Add `checkout.session.completed` to Stripe webhook event subscriptions in dashboard
  (the controller now handles it but Stripe needs to deliver it)
- Run `php artisan migrate` on production
- Create first product(s) via admin UI

