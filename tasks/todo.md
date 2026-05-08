# Public Purchase Request CTA — auth-gated at form entry

## Goal

Add CTAs in the public Boxly Store (catalog + product detail pages) that send shoppers to a Purchase Request form when they can't find what they're looking for. The form itself sits behind auth, so by the time the user reaches it they're logged in — full image upload, no draft persistence gymnastics. The auth bounce must work cleanly across **email login, email register, Google OAuth login, AND Google OAuth register**.

## Approach (revised)

Auth gate moves from "after Submit" to "form entry" — the CTA itself is the trigger.

- CTA links to `/shop/request`
- `/shop/request` has `middleware: ['auth', 'customer', 'complete-profile']`
- Guests get bounced to `/login?redirect=/shop/request`
- After authenticating (any method), they land on `/shop/request` already logged in and use the full form (images included, no localStorage hacks)

**No draft composable needed.** This kills ~150 lines of complexity vs. the previous plan.

## Auth redirect verification (already in place — no work needed)

Audited every flow. The `?redirect=` param survives:

| Flow | File | Status |
|---|---|---|
| Email login | `pages/login.vue:401` | ✓ honors `route.query.redirect` if starts with `/` |
| Email register | `pages/register.vue:786` | ✓ same pattern |
| Google OAuth login | `pages/login.vue:444-450` | ✓ encodes redirect into base64 OAuth `state` param |
| Google OAuth register | `pages/register.vue:812-819` | ✓ same `state` encoding |
| OAuth callback (backend) | `api/.../AuthSocialCallbackController.php:29-31,66` | ✓ decodes state, redirects to `frontend_url + redirectPath` |
| New-social-user complete-profile gate | `app/account/complete-profile.vue:174,308` | ✓ honors `redirect` query param after phone capture |

**Edge case (out of scope):** Forgot-password → reset-password loses the redirect (`pages/reset-password.vue:373` hardcodes `/app`). Mention to user; don't fix unless requested.

## Files to touch

| File | Change |
|---|---|
| `pages/shop/request.vue` | NEW — auth-gated form, `layout: 'shop'`. Functionally equivalent to `pages/app/purchase-requests/create.vue` but rendered inside the shop shell so the shopper-facing flow stays consistent. |
| `components/store/RequestProductCTA.vue` | NEW — shared CTA card. Two visual variants via prop: `'banner'` (full-width card for catalog) and `'inline'` (slim card for product detail). Single source of truth for copy + styling. Renders as `<NuxtLink to="/shop/request">`. |
| `pages/shop/index.vue` | EDIT — add CTA in empty state (when filters return zero products, replacing/augmenting "intenta ajustar"); add `'banner'` variant below the product grid in catalog mode. Skip on landing-mode. |
| `pages/shop/[slug]/index.vue` | EDIT — add `'inline'` variant between the description block and the related-products section (around line 317). |

Two new files, two surgical edits. No backend changes. No middleware changes. No login/register changes.

## On duplicating the form

Per CLAUDE.md ("simplest possible change, impact as little code as possible"), I'll **copy** the form from `pages/app/purchase-requests/create.vue` into `pages/shop/request.vue` rather than refactoring to a shared component. Three modifications to the copy:

1. `layout: 'shop'` instead of `'app'`
2. Page header copy reframed for the discovery moment ("¿No encuentras lo que buscas? Pídelo." instead of "Nueva Solicitud")
3. Post-submit redirect target stays `/app/purchase-requests` (same as existing flow — user sees their requests list)

Refactoring the form into a shared component is the cleaner long-term move, but it would touch the existing battle-tested in-app flow. Avoiding that risk here. Easy to DRY later if we want to.

## Visual placement

- **Catalog empty state** (`pages/shop/index.vue` lines 206-214): keep the "no products" icon + "intenta ajustar tu búsqueda", then add the `<RequestProductCTA variant="banner">` directly below the existing copy. Highest-intent moment — they searched, found nothing.
- **Below product grid** (`pages/shop/index.vue` after pagination ~line 248): one quiet `<RequestProductCTA variant="banner">` card. Soft gradient or neutral border, single CTA button. Only in catalog mode.
- **Product detail** (`pages/shop/[slug]/index.vue` between line 316 description close and line 318 related-products header): one slim `<RequestProductCTA variant="inline">` card. Bordered, light bg — visually quieter than the buy buttons above.

Bilingual via `useLanguage()` like everything else in the shop. Spanish copy: "¿No encuentras lo que buscas? · Te lo conseguimos de cualquier tienda de USA". English: "Can't find what you're looking for? · We'll grab it from any US store".

## Tasks

1. Create `components/store/RequestProductCTA.vue` with `banner` + `inline` variants.
2. Create `pages/shop/request.vue` (copy of in-app create form, shop layout, reframed header copy).
3. Wire CTA into `pages/shop/index.vue` — empty state + below-grid placements.
4. Wire CTA into `pages/shop/[slug]/index.vue` — between description and related products.
5. Manual test: guest hits CTA → bounced to login → logs in → lands on `/shop/request`. Repeat for register, Google OAuth login, Google OAuth register.

## Review

All four tasks complete. Five files touched as planned — no surprises.

**New files:**
- `components/store/RequestProductCTA.vue` — single CTA component with two visual variants (`banner`, `inline`). Bilingual via `useLanguage()`, renders as `<NuxtLink to="/shop/request">`.
- `pages/shop/request.vue` — auth-gated PR form. `layout: 'shop'`, `middleware: ['auth', 'customer', 'complete-profile']`. Functional copy of `pages/app/purchase-requests/create.vue` with three deltas: shop layout, reframed header ("¿No encuentras lo que buscas? Pídelo."), back link points to `/shop` instead of `/app/purchase-requests`. Submit logic unchanged — POSTs FormData to `/purchase-requests`, redirects to `/app/purchase-requests` on success.

**Edits:**
- `pages/shop/index.vue` — banner CTA in two places: inside the empty-state card (when filters return zero products), and below the product grid in catalog mode (only when products exist and not loading). Added `import RequestProductCTA from '~/components/store/RequestProductCTA.vue'` to match existing convention (file already imports `ProductCard` explicitly).
- `pages/shop/[slug]/index.vue` — inline CTA between description block and related products section. Same explicit-import pattern.

**Verified locally** by running `nuxt dev` on port 3002 (port 3000 was held by another project) and probing routes:
- `GET /shop?view=all` → 200, SSR'd HTML contains "¿No encuentras lo que buscas?", "Pídelo", "Te lo conseguimos" ✓
- `GET /shop/request` → 302 → `/login?redirect=/shop/request` ✓ (auth middleware bouncing correctly with redirect param intact)
- `GET /login?redirect=/shop/request` → 200 ✓
- Product detail page rendered 200 but hit its 404 branch (local backend wasn't running, so the data fetch failed) — CTA insertion verified via source review since the live render couldn't be exercised end-to-end. The component is identical to the catalog one, just rendered with `variant="inline"`.

**Auth round-trip is solid by construction:** the standard `auth` middleware writes `?redirect=` from `to.fullPath`, and that param is honored downstream by email login (`pages/login.vue:401`), email register (`pages/register.vue:786`), Google OAuth login (encoded into base64 OAuth `state` at `login.vue:444-450` and decoded server-side at `AuthSocialCallbackController.php:29-31,66`), Google OAuth register (`register.vue:812-819`), and the new-social-user "complete profile" gate (`complete-profile.vue:174,308`). No changes needed to any of those files.

**Out of scope:** forgot-password → reset-password drops the redirect (`reset-password.vue:373` hardcodes `/app`). Flagged for later per user.

**Manual browser test still pending** — the user should walk through the flow once: shop catalog → click banner CTA → bounced to login → log in (or register, or use Google) → land on `/shop/request` → add an item with image → submit → see PR appear in `/app/purchase-requests`.

---

# Shop personal-shopping help line — `/shop/help`

## Goal

Surface a clean WhatsApp help line on `/shop` and `/shop/[slug]` so shoppers can reach Boxly's personal-shopping number `+1 (619) 493-7969` for shopping help. Keep the product UI uncluttered.

## Approach

- New public page `pages/shop/help.vue` (shop layout, no auth) with:
  - Big WhatsApp CTA → `https://wa.me/16194937969?text=…` with a pre-filled greeting
  - Tap-to-call `tel:+16194937969`
  - Short "what we help with" bullets + hours
- Single navbar entry in `components/Shop/Navbar.vue` ("Ayuda") on desktop nav and in the mobile sheet, pointing to `/shop/help`. This is the only CTA on `/shop` and `/shop/[slug]` — keeps product pages clean.
- Number used elsewhere (`+1 619 559-1910` for general support) is untouched. The new `493-7969` is the personal-shopping line only.

## Todos

- [x] Create `pages/shop/help.vue`
- [x] Add "Ayuda" link to `components/Shop/Navbar.vue` (desktop + mobile)
- [x] Verify dev server renders both routes and WhatsApp deep-link works

## Review

**Files changed**

- `pages/shop/help.vue` (new) — single-page WhatsApp help line. Big green WhatsApp CTA → `wa.me/16194937969` with a pre-filled greeting (ES/EN), tap-to-call link, "what we help with" bullets, and support hours. Uses the shop layout so it picks up `ShopNavbar` + `FooterSection` automatically.
- `components/Shop/Navbar.vue` — added one entry to `navItems`: `{ to: '/shop/help', label: 'Ayuda' }`. Because the mobile sheet renders the same `navItems` array, the link shows up automatically in both desktop nav and the hamburger sheet — no other edits to the navbar were needed.

**Verification**

- Dev server boots clean. `GET /shop` → 200, `GET /shop/help` → 200.
- `/shop` HTML contains `/shop/help` (navbar link is there).
- `/shop/help` HTML title is `Ayuda · Personal Shopping — Tienda Boxly` and embeds `wa.me/16194937969`.
- Existing footer/help-center number `+1 (619) 559-1910` is left untouched — only the new personal-shopping line `+1 (619) 493-7969` is added.

**Why this approach**

The user offered "maybe a /shop/help page" and confirmed the navbar-link approach. This keeps `/shop` and `/shop/[slug]` clean — no FAB, no extra inline cards, no clutter on the product UI. Discoverability comes from the persistent nav item; the help page itself follows the established WhatsApp-card pattern from `pages/help-center.vue` so it feels native to the rest of the platform.
