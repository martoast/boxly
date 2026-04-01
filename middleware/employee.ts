export default defineNuxtRouteMiddleware(async () => {
  const userState = useState('user')

  if (!userState.value) {
    return navigateTo('/login')
  }

  if (userState.value.role !== 'employee') {
    return navigateTo('/login')
  }
})
