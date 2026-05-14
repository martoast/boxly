// middleware/loggedin.ts
//
// Guards /login and /register: if the visitor is already authenticated,
// bounce them to where they belong; otherwise let the auth page render.
//
// The old version always did a blocking /user round-trip whenever the
// XSRF-TOKEN cookie was present — but that cookie is set for *everyone*
// on first visit, logged in or not, so an anonymous visitor coming from
// the landing page paid a pointless ~500ms wait before /login showed.
//
// Now we lean on the same localStorage auth hint the auth middleware
// uses: if it says "definitely anonymous," render /login immediately
// with zero API calls. Otherwise we await the in-flight bootstrap probe
// (fired once at app boot) rather than starting a fresh request.
export default defineNuxtRouteMiddleware(async (to) => {
  const nuxtApp = useNuxtApp()
  const userState = useState('user')

  // Fast path: hint says definitely-anonymous → show /login right away.
  if (import.meta.client && getAuthHint() === false && !userState.value) {
    return
  }

  // We might be logged in — resolve auth state without firing a duplicate
  // /user request if the boot-time bootstrap is still in flight.
  if (!userState.value) {
    const ready = (nuxtApp as any).$authReady
    if (ready) {
      await ready
    } else {
      try {
        await (nuxtApp as any).$retriveUser()
      } catch {
        // 401 / network error — stays anonymous, fall through to render.
      }
    }
  }

  // Still anonymous → let them see the login/register page.
  if (!userState.value) return

  // Authenticated — send them where they belong. Honor ?redirect=/path
  // if it points back into the app (e.g. /checkout from the cart).
  const redirectTo = to.query.redirect
  if (typeof redirectTo === 'string' && redirectTo.startsWith('/') && !redirectTo.startsWith('//')) {
    return navigateTo(redirectTo)
  }

  const u: any = userState.value
  if (u?.role === 'admin') return navigateTo('/app/admin/dashboard')
  if (u?.role === 'employee') {
    if (u.team === 'shopping') return navigateTo('/app/shopping/purchase-requests')
    return navigateTo('/app/employee/packages')
  }
  return navigateTo('/app/')
})
