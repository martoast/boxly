<template>
  <ShoppingAssistant />
</template>

<script setup>
// BOXLY Concierge — the unified conversational interface (new chat at /buscar, a
// specific conversation at /buscar/<id>).
//
// LAYOUT must be decided BEFORE the page mounts. Switching the layout AFTER mount
// (setPageLayout in onMounted/watch) remounts the page component, which wiped the
// in-progress chat and stopped the first message from persisting — leaving an
// empty chat with a stray sidebar row. So we resolve the session + set the layout
// in middleware (pre-mount): `app` (CustomerNavbar) when logged in, `default` for
// guests. No post-mount switch → no remount.
definePageMeta({
  layout: 'default',
  middleware: async () => {
    if (import.meta.server) return
    const user = useState('user')
    if (!user.value) {
      // Resolve the session SILENTLY — a guest's 401 must NOT trip the global
      // redirect-to-login, so use a raw $fetch (not $customFetch).
      try {
        const cfg = useRuntimeConfig()
        const u = await $fetch('/user', { baseURL: cfg.public.apiUrl, credentials: 'include', headers: { Accept: 'application/json' } })
        if (u) user.value = u
      } catch { /* guest — keep the default layout */ }
    }
    setPageLayout(user.value ? 'app' : 'default')
  },
})
useHead({ title: 'Boxly — Tu asistente para comprar de USA' })
</script>
