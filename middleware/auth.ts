// middleware/auth.ts
//
// Auth gate for protected pages. Optimised for the "anonymous visitor
// clicks a protected link" case — that's the path that used to feel
// slow because we had to wait on /user before knowing where to send them.
//
// Strategy:
//   1. If localStorage says they're definitely-anon, redirect to /login
//      immediately. No API call, no waiting.
//   2. Otherwise, fast-path on existing userState if we already resolved.
//   3. Otherwise, await the bootstrap /user promise (or fire one if no
//      bootstrap was kicked off).
//
// The hint is best-effort — server still has final say. If somehow the
// hint says "logged in" but /user 401s, we fall through to the redirect
// path normally.
export default defineNuxtRouteMiddleware(async (to) => {
  const nuxtApp = useNuxtApp()
  const userState = useState('user')

  // 1. Instant client-side redirect when we already know they're anon.
  if (import.meta.client && getAuthHint() === false && !userState.value) {
    const queryParams = new URLSearchParams({ redirect: to.fullPath })
    return navigateTo(`/login?${queryParams.toString()}`, {
      redirectCode: 302,
      external: false,
    })
  }

  // 2. Already resolved as logged-in this session.
  if (userState.value) return

  // 3. Wait on the in-flight bootstrap (or fire one as a fallback).
  const authChecked = useState<boolean>('auth-checked', () => false)
  if (!authChecked.value) {
    const ready = (nuxtApp as any).$authReady
    if (ready) {
      await ready
    } else {
      try {
        await (nuxtApp as any).$retriveUser()
      } catch {}
      authChecked.value = true
    }
  }

  if (userState.value) return

  // Definitive: not logged in.
  if (import.meta.client) markLoggedOut()
  const queryParams = new URLSearchParams({ redirect: to.fullPath })
  return navigateTo(`/login?${queryParams.toString()}`, {
    redirectCode: 302,
    external: false,
  })
})
