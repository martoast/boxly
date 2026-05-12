// plugins/auth-bootstrap.client.ts
//
// Pre-warm the user's auth state on first client load. Without this, the
// auth middleware does a cold /user round-trip the moment the user clicks
// a protected link (e.g. "Crear solicitud" on /shop) — that's the ~500ms
// delay before the login redirect kicks in.
//
// Here we fire /user immediately on app boot (fire-and-forget, no await
// so we don't block initial render), store the in-flight promise on
// nuxtApp, and let the auth middleware await *that* instead of starting
// its own request. Net effect: by the time a user finishes reading the
// landing page and clicks something, the auth state is already resolved.

export default defineNuxtPlugin((nuxtApp) => {
  const userState = useState<any>('user', () => null)
  const authChecked = useState<boolean>('auth-checked', () => false)

  // Already resolved earlier this session (e.g. came back to /shop after
  // logging in/out). Nothing to do.
  if (authChecked.value) return

  // Fire-and-forget. We attach the promise to nuxtApp so the middleware
  // can await it without kicking off a duplicate /user request.
  ;(nuxtApp as any).$authReady = (async () => {
    try {
      await (nuxtApp as any).$retriveUser()
      markLoggedIn()
    } catch {
      // 401 / network error — userState stays null, auth middleware
      // will read as "not logged in" and redirect to /login.
      markLoggedOut()
    } finally {
      authChecked.value = true
    }
  })()
})
