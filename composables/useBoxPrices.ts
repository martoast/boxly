/**
 * Live box prices, straight from Stripe.
 *
 * Every public price used to be hardcoded in three components, so a Stripe price
 * change silently left the website quoting the old numbers. This is now the ONE
 * place that answers "what does a box cost".
 *
 * Only the PRICE comes from Stripe. Capacity (max weight, dimensions, how many
 * garments fit) stays in the components: the Stripe product metadata disagrees
 * with what we advertise (XL has no weight at all), so it is not safe to render.
 *
 * Each size has several active prices — the list price plus the in-between ones
 * Alex uses for odd shipments. The public table shows the LIST price, which is
 * the highest for that size. (Stripe's own `default_price` is not it: several
 * products still default to an older, lower tier.)
 */
// "Extra Small Box" is deliberately absent: XS was retired 2026-08-16 and no
// public table shows it. It still exists in Stripe for boxes already in flight,
// so mapping it here would also make the completeness check below demand a size
// we no longer sell.
const SIZE_BY_NAME: Record<string, string> = {
  'small box': 'S',
  'medium box': 'M',
  'large box': 'L',
  'extra large box': 'XL',
}

// Last-known good prices (2026-07-27). Used only if the API is unreachable, so a
// blip shows slightly stale prices rather than an empty or $0 pricing table.
export const FALLBACK_BOX_PRICES: Record<string, number> = { S: 2400, M: 4400, L: 5600, XL: 6900 }

// NOTE: must be `export const … = () => {}`, matching every other composable
// here. Declared as `export function`, Nuxt's auto-import scan skips it and the
// components 500 with "useBoxPrices is not defined" at SSR.
export const useBoxPrices = () => {
  const { $customFetch } = useNuxtApp() as any
  const prices = useState<Record<string, number>>('boxPrices', () => ({ ...FALLBACK_BOX_PRICES }))
  const loaded = useState<boolean>('boxPricesLoaded', () => false)

  async function load() {
    if (loaded.value) return prices.value
    try {
      const res = await $customFetch('/products')
      const next: Record<string, number> = {}
      for (const p of res?.data || []) {
        // shipping=false is the border-pickup "Crossing" catalog — a different
        // service that must never appear in the shipping price table.
        if (String(p?.shipping) !== 'true') continue
        const size = SIZE_BY_NAME[String(p?.name || '').trim().toLowerCase()]
        const price = Number(p?.price)
        if (!size || !Number.isFinite(price)) continue
        if (next[size] === undefined || price > next[size]) next[size] = price
      }
      // Only accept a complete table — a partial response must not blank out
      // sizes that customers are looking at.
      if (Object.keys(FALLBACK_BOX_PRICES).every((s) => next[s] > 0)) {
        prices.value = next
        loaded.value = true
      }
    } catch {
      // keep the fallback; the page still renders a usable price table
    }
    return prices.value
  }

  return { prices, loaded, load }
}
