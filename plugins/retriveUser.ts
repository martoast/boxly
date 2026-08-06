// plugins/retriveUser.ts
export default defineNuxtPlugin((nuxtApp) => {
    const retriveUser = async () => {
        // Resolved before the await, not after. useState needs the Nuxt
        // instance; the client has a global fallback so reading it late
        // worked there, the server has none. (nuxt.config's
        // experimental.asyncContext also covers this now — belt and
        // braces, and it keeps the two reads down to one.)
        const userState = useState('user')

        try {
            const response = await nuxtApp.$customFetch('/user');
            const user: User = response
            userState.value = user
            return user
        } catch(error) {
            console.error(error)
            userState.value = null
            throw error
        }
    }
    
    return {
        provide: {
            retriveUser: retriveUser
        }
    }
})