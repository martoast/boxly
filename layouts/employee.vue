<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20">
    <!-- Header -->
    <header class="bg-white/90 backdrop-blur-sm border-b border-gray-100 shadow-sm sticky top-0 z-10">
      <div class="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <img src="/logo.svg" class="h-8 w-8" alt="Boxly" />
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2">
            <div class="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
              <span class="text-primary-600 font-semibold text-xs">{{ initials }}</span>
            </div>
            <span class="text-sm font-medium text-gray-700 hidden sm:block">{{ userName }}</span>
          </div>
          <button
            class="text-sm text-gray-500 hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
            @click="handleLogout"
          >
            Logout
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-2xl mx-auto px-4 py-6">
      <slot />
    </main>
  </div>
</template>

<script setup>
const { $customFetch } = useNuxtApp()
const userState = useState('user')

const userName = computed(() => userState.value?.name?.split(' ')[0] ?? 'Mau')
const initials = computed(() => {
  const name = userState.value?.name ?? ''
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
})

const handleLogout = async () => {
  try {
    await $customFetch('/auth/logout', { method: 'POST' })
  } catch {}
  userState.value = null
  await navigateTo('/login')
}
</script>
