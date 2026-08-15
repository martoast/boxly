# Remove XS box from public listings

- [x] Drop XS from `components/BoxPricing.vue` box table (shared by landing `/` and `/precios`)
- [x] Change that grid from `lg:grid-cols-5` → `lg:grid-cols-4`
- [x] Drop XS from `pages/app/pricing/index.vue` `BOX_SPECS` + same grid fix
- [x] Update `/precios` SEO description: "precio fijo por caja (XS a XL)" → "(S a XL)"

## Review

XS is no longer listed anywhere on the landing page or either pricing page. Four
cards (S / M / L / XL) now fill the grid evenly on desktop.

Nothing else was touched — prices still come live from Stripe via `useBoxPrices()`,
and the XS price/price_id is untouched in Stripe, the API, the CLI and the order
flow, so existing XS boxes and any admin-side XS selection keep working.

Left alone deliberately (out of scope, flag if you want them changed):
- `components/Landing/Main/ShippingCalculatorModal.vue` — the shipping calculator
  on `/how-it-works/casillero` can still recommend an XS box for a small item.
- `server/api/assistant.post.ts` / `server/utils/boxMath.ts` — the AI concierge
  still quotes XS.
