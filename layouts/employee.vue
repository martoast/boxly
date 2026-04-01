<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div class="flex items-center justify-between px-4 py-3">
        <span class="text-lg font-bold text-gray-900">Boxly</span>
        <button
          class="text-sm text-gray-500 hover:text-gray-700"
          @click="handleLogout"
        >
          Logout
        </button>
      </div>
    </header>
    <main class="max-w-2xl mx-auto px-4 py-6">
      <slot />
    </main>
  </div>
</template>

<script setup>
const { $customFetch } = useNuxtApp()

const handleLogout = async () => {
  try {
    await $customFetch('/auth/logout', { method: 'POST' })
  } catch {}
  useState('user').value = null
  await navigateTo('/login')
}
</script>
