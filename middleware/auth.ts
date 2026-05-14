// middleware/auth.ts
export default defineNuxtRouteMiddleware(async (to) => {
  const { $retriveUser } = useNuxtApp()
  const userState = useState('user')
  
  if (!userState.value) {
    try {
      await $retriveUser()
      console.log('User retrieved:', userState.value)
    } catch (error) {
      console.error('Authentication failed:', error)
      
      // Build redirect URL with current route + query params
      const redirectUrl = to.fullPath
      const queryParams = new URLSearchParams({
          redirect: redirectUrl
      });
      
      return navigateTo(`/login?${queryParams.toString()}`, {
          redirectCode: 302,
          external: false
      })
    }
  }
  
  if (!userState.value) {
    console.log('No user state after retrieval attempt')
    
    // Build redirect URL with current route + query params
    const redirectUrl = to.fullPath
    const queryParams = new URLSearchParams({
        redirect: redirectUrl
    });
    
    return navigateTo(`/login?${queryParams.toString()}`, {
        redirectCode: 302,
        external: false
    })
  }
})