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

  // The warehouse employee's app is three sections — dashboard (label scans), customer map,
  // drop-offs (Alex, 2026-10-08); anything else (the old Packages page, old bookmarks) lands on
  // the dashboard.
  if (!['/app/employee/label-scans', '/app/employee/map', '/app/employee/drop-off-receipts'].some((p) => to.path.startsWith(p))) {
    return navigateTo('/app/employee/label-scans')
  }
})

