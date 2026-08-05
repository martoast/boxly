/**
 * Live price for Boxly Protection, straight from Stripe.
 *
 * Same rule as useBoxPrices: the number a customer reads on the site must be
 * the number Stripe will actually charge, so nothing here is authoritative
 * except what the API returns. The API flags the product (`is_protection`)
 * from a config'd product id, so the id never leaks into the UI.
 *
 * The COVER CAP ($10,000 MXN per protected box) is not a Stripe price — it
 * lives in the Terms of Service and is quoted alongside, so it stays here as a
 * constant rather than being fetched.
 */

// Last-known good (2026-08-05). Used only if the API is unreachable, so a blip
// shows a slightly stale price rather than a blank or $0.
export const FALLBACK_PROTECTION_PRICE = 200

// Maximum reimbursement per protected box — see Terms of Service §7.1.
export const PROTECTION_COVERAGE_CAP = 10000

// NOTE: must be `export const … = () => {}` — declared as `export function`,
// Nuxt's auto-import scan skips it and components 500 at SSR.
export const useProtectionPrice = () => {
  const { $customFetch } = useNuxtApp() as any
  const price = useState<number>('protectionPrice', () => FALLBACK_PROTECTION_PRICE)
  const loaded = useState<boolean>('protectionPriceLoaded', () => false)

  async function load() {
    if (loaded.value) return price.value
    try {
      const res = await $customFetch('/products')
      // The product carries several active prices — currently 200 MXN and an
      // 11.6 USD one. Taking the first match rendered the USD figure under a
      // hardcoded "MXN" label. This page quotes pesos, so only pesos qualify.
      const mxn = (res?.data || [])
        .filter((p: any) => p?.is_protection && String(p?.currency).toUpperCase() === 'MXN')
        .map((p: any) => Number(p?.price))
        .filter((n: number) => Number.isFinite(n) && n > 0)
      // Highest is the list price, the same rule the box price table follows.
      if (mxn.length) {
        price.value = Math.max(...mxn)
        loaded.value = true
      }
    } catch {
      // keep the fallback; the page still renders a usable number
    }
    return price.value
  }

  return { price, loaded, load, cap: PROTECTION_COVERAGE_CAP }
}
