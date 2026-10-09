export default defineNuxtRouteMiddleware(async () => {
  const userState = useState<any>('user')

  if (!userState.value || !userState.value.role) {
    return navigateTo('/login')
  }

  const { role, team } = userState.value

  switch (role) {
    case 'admin':
      return navigateTo('/app/admin/dashboard')
    case 'employee':
      // Sub-route by team: warehouse → packages, shopping → purchase requests
      if (team === 'shopping') return navigateTo('/app/shopping/dashboard')
      return navigateTo('/app/employee/label-scans')
    case 'customer':
      return navigateTo('/app/')
    default:
      console.error(`Unknown role: ${role}`)
      return navigateTo('/login')
  }
})
