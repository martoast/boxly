<template>
  <ShoppingAssistant />
</template>

<script setup>
// BOXLY Concierge — the unified conversational interface. The conversation is the
// product; product search is one tool the assistant uses, with galleries rendered
// inline. Handles both the new-chat view (/buscar) and a specific conversation
// (/buscar/<id>, for signed-in users' history).
//
// It's PUBLIC (guests use it too), but it lives inside the app — so a SIGNED-IN
// user must see the app layout (CustomerNavbar), not the landing navbar with a
// "log in" button. We pick the layout from auth state: `app` when logged in,
// `default` for guests.
definePageMeta({ layout: 'default' })
useHead({ title: 'Boxly — Tu asistente para comprar de USA' })

const user = useState('user')
const syncLayout = () => setPageLayout(user.value ? 'app' : 'default')

// Known synchronously (user state persisted from earlier navigation) → no flash.
syncLayout()

onMounted(async () => {
  // Direct load while logged in: the user state isn't populated yet on this public
  // page. Resolve the session SILENTLY with a raw fetch so a guest's 401 does NOT
  // trip the global redirect-to-login. If it succeeds, switch to the app layout.
  if (!user.value) {
    try {
      const cfg = useRuntimeConfig()
      const u = await $fetch('/user', { baseURL: cfg.public.apiUrl, credentials: 'include', headers: { Accept: 'application/json' } })
      if (u) user.value = u
    } catch { /* guest — stay on the default (landing) layout */ }
  }
  syncLayout()
})

// React if the user signs in mid-session (e.g. in-chat account creation).
watch(user, syncLayout)
</script>
