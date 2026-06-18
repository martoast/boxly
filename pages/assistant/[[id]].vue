<template>
  <ShoppingAssistant />
</template>

<script setup>
// Public entry — usable without an account. Guests can chat, discover, and
// create their account inline; if they're already signed in, they get their
// history sidebar too (same component).
//
// Optional [[id]] param: /assistant is the new-chat view, /assistant/<id> is a
// specific conversation (logged-in users). Same component for both, so the live
// chat survives the URL update and a refresh keeps you in the same chat.
definePageMeta({ layout: 'default' })
useHead({ title: 'Asistente de compras — Boxly' })
</script>
