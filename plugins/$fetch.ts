export default defineNuxtPlugin(async (nuxtApp) => {
  const runtimeConfig = useRuntimeConfig();
  
  const customFetch = $fetch.create({
    baseURL: runtimeConfig.public.apiUrl,
    credentials: "include",
    onRequest({ request, options, error }) {
      const csrfCookie = useCookie("XSRF-TOKEN");
      
      if (csrfCookie.value) {
        let headers = (options.headers ||= {});
        
        if (Array.isArray(headers)) {
          headers.push(["Accept", "application/json"]);
          headers.push(["X-XSRF-TOKEN", csrfCookie.value]);
        } else if (headers instanceof Headers) {
          headers.set("Accept", "application/json");
          headers.set("X-XSRF-TOKEN", csrfCookie.value);
        } else {
          headers["Accept"] = "application/json";
          headers["X-XSRF-TOKEN"] = csrfCookie.value;
        }
      }
    },
    async onResponseError({ response }) {
      if (response.status === 401) {
        useState('user', () => null)
        await nuxtApp.runWithContext(() => navigateTo('/login'))
      }
    }
  });
  
  const initializeCsrf = async () => {
    // Check if we already have a CSRF token
    const existingToken = useCookie("XSRF-TOKEN");

    // Only fetch if we don't have a token
    if (!existingToken.value) {
      await useFetch(`${runtimeConfig.public.apiUrl}/csrf-cookie`, {
        credentials: "include",
      });
    }
  };

  // CSRF tokens are a browser-session concept — there's nothing meaningful
  // for the server to do with /csrf-cookie during SSR (the cookie belongs
  // to the visiting browser, not the render). Gating to client-only also
  // keeps SSR-rendered routes from paying that extra round-trip on every
  // page load.
  if (import.meta.client) {
    await initializeCsrf();
    nuxtApp.hook("page:finish", async () => {
      const csrfCookie = useCookie("XSRF-TOKEN");
      if (!csrfCookie.value) {
        await initializeCsrf();
      }
    });
  }
  
  return {
    provide: {
      initializeCsrf,
      customFetch
    },
  };
});