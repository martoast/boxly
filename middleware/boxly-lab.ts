// middleware/boxly-lab.ts — Boxly Lab: the live-carts product (cart, store sync, automatic quotes) lives under
// /app/lab and is only for accounts that opted in on /app/lab (API: GET /user → boxly_lab). Anyone else is
// sent to the Lab page, where they can opt in; the API refuses them until then.
export default defineNuxtRouteMiddleware(() => {
  const user = useState<any>('user')
  if (!user.value?.boxly_lab) return navigateTo('/app/lab', { redirectCode: 302 })
})
