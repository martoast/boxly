// Gates Mau's warehouse-employee routes. Shopping employees and admins
// don't belong here — they have their own namespaces.
export default defineNuxtRouteMiddleware(async (to) => {
  const userState = useState<any>('user')

  if (!userState.value) {
    return navigateTo('/login')
  }

  const { role, team } = userState.value
  if (role !== 'employee' || team !== 'warehouse') {
    return navigateTo('/login')
  }

  // The warehouse employee's whole app is the label scans page (Alex, 2026-10-08): the old
  // Packages / Drop-offs pages and any bookmark to them land there.
  if (!to.path.startsWith('/app/employee/label-scans')) {
    return navigateTo('/app/employee/label-scans')
  }
})

