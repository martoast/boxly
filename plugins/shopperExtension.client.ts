/**
 * Boxly Shopper (Chrome extension) adoption tracking.
 *
 * The extension's content script on boxly.mx announces itself with a window
 * message. This plugin listens app-wide — not just on the casillero card — so we
 * catch every installed user on any page they visit, whether or not they ever
 * open the card or link their account.
 *
 * What this measures: how many of OUR customers actually have it running. The
 * Chrome Web Store already reports raw downloads; it can't tell us which Boxly
 * accounts those are, which is the number that matters for deciding whether the
 * extension is worth pushing.
 *
 * Throttled to once a day per browser. The server write is idempotent anyway
 * (installed_at is only ever set once), so this is purely to avoid a pointless
 * request on every page load.
 */
const THROTTLE_KEY = 'boxly_ext_seen_at'
const ONE_DAY = 24 * 60 * 60 * 1000

export default defineNuxtPlugin((nuxtApp) => {
  if (!import.meta.client) return

  let reported = false

  const report = async (version: string) => {
    if (reported) return

    // Only meaningful for a signed-in user — the whole point is attributing the
    // install to an account. Crucially we do NOT latch `reported` here: the
    // extension answers our ping long before /user resolves, so latching on the
    // first (anonymous) reply would silently drop almost every install. Bail and
    // let the next page:finish ping try again.
    const user = useState<any>('user')
    if (!user.value?.id) return

    reported = true

    try {
      const last = Number(localStorage.getItem(THROTTLE_KEY) || 0)
      if (Date.now() - last < ONE_DAY) return
    } catch {
      /* storage blocked — fall through and just report */
    }

    try {
      await nuxtApp.$customFetch('/me/shopper-extension', {
        method: 'POST',
        body: { version: version || undefined },
      })
      try {
        localStorage.setItem(THROTTLE_KEY, String(Date.now()))
      } catch {
        /* ignore */
      }
    } catch {
      // Analytics must never surface an error to the shopper.
    }
  }

  /**
   * Hand the extension the shopper's name automatically.
   *
   * The name is what routes a package to the right person ("BOXLY <nombre>"),
   * so an extension without it is half-useless — and making someone hunt for a
   * "connect" button on a settings page to enable something they already chose
   * to install is friction for nothing. If they're signed in on boxly.mx and the
   * extension is installed, that IS the consent.
   *
   * Safe by construction: the extension only accepts this from the boxly.mx
   * origin (verified in its service worker against sender.origin), so no other
   * site can plant a name.
   */
  const link = () => {
    const user = useState<any>('user')
    if (!user.value?.id) return
    window.postMessage(
      {
        source: 'boxly-app',
        type: 'connect',
        payload: { name: user.value.name || '', email: user.value.email || '' },
      },
      window.location.origin,
    )
  }

  const onMessage = (e: MessageEvent) => {
    if (e.source !== window || e.origin !== window.location.origin) return
    const d: any = e.data
    if (!d || d.source !== 'boxly-shopper' || d.type !== 'ready') return
    link()
    report(String(d.version || ''))
  }

  window.addEventListener('message', onMessage)

  // The extension announces at document_start, long before Nuxt hydrates, so we
  // would miss that first broadcast — ping it and let it answer. Re-ping after
  // each route change until we've reported, since the user may only become
  // signed-in partway through a session (e.g. straight after logging in).
  const ping = () => {
    if (reported) return
    window.postMessage({ source: 'boxly-app', type: 'ping' }, window.location.origin)
  }

  nuxtApp.hook('app:mounted', ping)
  nuxtApp.hook('page:finish', ping)
})
