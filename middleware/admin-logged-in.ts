export default defineNuxtRouteMiddleware(async (to) => {
    const { $retriveUser } = useNuxtApp()
    const userState = useState('user')
    
    // Check if there's a CSRF token
    const csrfCookie = useCookie("XSRF-TOKEN");
    
    if (csrfCookie.value) {
      try {
        if (!userState.value) {
          await $retriveUser()
        }
        
        // Route by role+team so employees don't bounce off the customer middleware
        const u = userState.value
        if (u?.role === 'admin') return navigateTo('/app/admin/dashboard')
        if (u?.role === 'employee') {
          if (u.team === 'shopping') return navigateTo('/app/shopping/purchase-requests')
          return navigateTo('/app/employee/packages')
        }
        return navigateTo('/app/')
      } catch (error) {
        // If retrieval fails, clear the user state
        useState('user', () => null)
        csrfCookie.value = null
      }
    }
    
    // Allow access to login page
    return
  })