// middleware/auth.ts
//
// Auth gate for protected pages. The heavy lifting (the actual /user
// fetch) is pre-warmed at app boot by plugins/auth-bootstrap.client.ts,
// so this middleware usually finds either:
//   - userState already populated → continue immediately, no API call
//   - the in-flight $authReady promise → await it (no duplicate request)
//   - both nullish (e.g. SSR or hot reload) → fall back to a fresh fetch
//
// We also short-circuit when we've already tried *and failed* this session
// (authChecked === true, user === null) so a non-logged-in user clicking
// around doesn't hit /user again on every navigation.
export default defineNuxtRouteMiddleware(async (to) => {
  const nuxtApp = useNuxtApp()
  const userState = useState('user')
  const authChecked = useState<boolean>('auth-checked', () => false)

  // Fast path: already logged in this session.
  if (userState.value) return

  // We haven't resolved auth yet — wait on the bootstrap if it's mid-flight.
  if (!authChecked.value) {
    const ready = (nuxtApp as any).$authReady
    if (ready) {
      await ready
    } else {
      // No bootstrap fired (rare — SSR or plugin disabled). Do the call
      // ourselves so we still get a definitive answer.
      try {
        await (nuxtApp as any).$retriveUser()
      } catch {
        // fall through to redirect
      }
      authChecked.value = true
    }
  }

  if (userState.value) return

  // Definitive: not logged in. Redirect to login with the intended path.
  const queryParams = new URLSearchParams({ redirect: to.fullPath })
  return navigateTo(`/login?${queryParams.toString()}`, {
    redirectCode: 302,
    external: false,
  })
})
