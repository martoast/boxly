// Gates the /app/shopping/* routes. Allows admins (full visibility) and
// employees on the shopping team (Velonie). Anyone else is bounced.
export default defineNuxtRouteMiddleware(async () => {
  const userState = useState<any>('user')

  if (!userState.value) {
    return navigateTo('/login')
  }

  const user = userState.value
  const isAdmin = user.role === 'admin'
  const isShopper = user.role === 'employee' && user.team === 'shopping'

  if (!isAdmin && !isShopper) {
    return navigateTo('/login')
  }
})
