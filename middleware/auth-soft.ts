// middleware/auth-soft.ts
//
// Soft auth for PUBLIC pages (e.g. the AI search/chat): populate `user` if a
// session already exists, but NEVER redirect a guest to /login. We use a RAW
// $fetch (not $customFetch) so a guest's 401 doesn't trip the global
// onResponseError handler, which would bounce them to /login. Guests simply
// stay with `user === null` and get the guest experience.
export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) return // /app/** is ssr:false — run on the client
  const userState = useState('user')
  if (userState.value) return // already known (e.g. client-side nav from another /app page)
  const cfg = useRuntimeConfig()
  try {
    userState.value = await $fetch('/user', {
      baseURL: cfg.public.apiUrl,
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })
  } catch {
    userState.value = null // guest — no redirect
  }
})
