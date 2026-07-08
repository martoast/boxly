<template>
  <!-- Logged-in dashboard = the Boxly Assistant OS. The chat is the main interface;
       the four pipeline action cards (search / register / assisted / status) are
       conversation starters. Classic dashboard preserved in git history + the
       per-pipeline pages (/app/orders, /app/purchase-requests, /in-person) remain
       reachable for anyone who prefers the forms. -->
  <ClientOnly>
    <ShoppingAssistant hub fullscreen-mobile />
    <template #fallback>
      <div class="h-[60vh] flex items-center justify-center">
        <svg class="w-8 h-8 animate-spin text-primary-500" viewBox="0 0 24 24" fill="none" aria-label="Cargando">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    </template>
  </ClientOnly>
</template>

<script setup>
// The assistant is a client-only interactive surface (like /search). SSR would
// have nothing meaningful to render for an authed chat.
definePageMeta({
  layout: 'app',
  middleware: ['auth', 'customer', 'complete-profile'],
})
useHead({ title: 'Boxly — Tu asistente' })
</script>
