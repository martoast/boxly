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

      // credentials: "include" only attaches cookies in a browser — during
      // SSR the Nitro server's request to the API carries none, so the
      // auth middleware's $retriveUser() would 401 on every server render.
      // Forward the incoming request's own cookies. useRequestHeaders is
      // request-scoped (this plugin instantiates per request on the
      // server), so nothing leaks across users.
      if (import.meta.server) {
        const { cookie } = useRequestHeaders(["cookie"]);
        if (cookie) {
          let headers = (options.headers ||= {});

          if (Array.isArray(headers)) {
            headers.push(["cookie", cookie]);
          } else if (headers instanceof Headers) {
            headers.set("cookie", cookie);
          } else {
            headers["cookie"] = cookie;
          }
        }
      }
    },
    async onResponseError({ response }) {
      if (response.status === 401) {
        // Client only. This handler runs after an await, so the Nuxt
        // instance is off the async context — runWithContext restores it
        // for both useState and navigateTo (useState alone threw on the
        // server, which has no global-instance fallback).
        //
        // Left out of SSR on purpose: there the auth middleware already
        // owns the 401 and redirects to /login?redirect=<path>. Firing a
        // second redirect from here would win the race and drop that
        // param, so the user would lose the page they asked for.
        if (import.meta.client) {
          await nuxtApp.runWithContext(() => {
            useState('user', () => null)
            return navigateTo('/login')
          })
        }
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