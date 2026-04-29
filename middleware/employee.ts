// Gates Mau's warehouse-employee routes. Shopping employees and admins
// don't belong here — they have their own namespaces.
export default defineNuxtRouteMiddleware(async () => {
  const userState = useState<any>('user')

  if (!userState.value) {
    return navigateTo('/login')
  }

  const { role, team } = userState.value
  if (role !== 'employee' || team !== 'warehouse') {
    return navigateTo('/login')
  }
})

