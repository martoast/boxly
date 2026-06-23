<template>
  <ShoppingAssistant />
</template>

<script setup>
// BOXLY Concierge — the unified conversational interface. The conversation is the
// product; product search is one tool the assistant uses, with galleries rendered
// inline. Handles both the new-chat view (/buscar) and a specific conversation
// (/buscar/<id>, for signed-in users' history). Guests get a clean chat with no
// sidebar — ideal for embedding on the landing page.
definePageMeta({ layout: 'default' })
useHead({ title: 'Boxly — Tu asistente para comprar de USA' })
</script>
