export default defineNuxtRouteMiddleware(async (to) => {
    const userState = useState('user')
    
    if (!userState.value || !userState.value.role) {
      return navigateTo('/login')
    }
    
    // Redirect based on user role
    switch (userState.value.role) {
      case 'admin':
        return navigateTo('/app/admin/dashboard')
      case 'employee':
        return navigateTo('/app/employee/packages')
      case 'customer':
        return navigateTo('/app/')
      default:
        console.error(`Unknown role: ${userState.value.role}`)
        return navigateTo('/login')
    }
  })