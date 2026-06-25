<template>
  <ShoppingAssistant />
</template>

<script setup>
// BOXLY Concierge — unified chat (new chat at /buscar, a conversation at
// /buscar/<id>).
//
// Uses ONE stable layout ('concierge') that never changes between /buscar and
// /buscar/<id>. Previously we flipped layout via setPageLayout in middleware,
// which remounted the page on every navigation and wiped the in-flight chat.
// The concierge layout shows the right navbar (CustomerNavbar vs landing) based
// on auth reactively, so no layout switch is ever needed.
//
// The middleware ONLY resolves the session silently (so signed-in users are
// recognized on a public page) — a guest's 401 must NOT trip the global
// redirect-to-login, so it uses a raw $fetch and never sets the layout.
definePageMeta({
  layout: 'concierge',
  middleware: async () => {
    if (import.meta.server) return
    const user = useState('user')
    if (!user.value) {
      try {
        const cfg = useRuntimeConfig()
        const u = await $fetch('/user', { baseURL: cfg.public.apiUrl, credentials: 'include', headers: { Accept: 'application/json' } })
        if (u) user.value = u
      } catch { /* guest */ }
    }
  },
})
useHead({ title: 'Boxly — Tu asistente para comprar de USA' })
</script>
