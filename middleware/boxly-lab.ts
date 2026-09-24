// middleware/boxly-lab.ts — Boxly Lab: the live-carts product (cart, store sync, automatic quotes) lives under
// /app/lab and is only for allowlisted internal testers (API: GET /user → boxly_lab). Everyone else is sent
// home, as if it did not exist; the API refuses them too.
export default defineNuxtRouteMiddleware(() => {
  const user = useState<any>('user')
  if (!user.value?.boxly_lab) return navigateTo('/app', { redirectCode: 302 })
})
