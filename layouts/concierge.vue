<!-- layouts/concierge.vue
     One STABLE layout for the /buscar concierge. The layout name never changes, so
     navigating /buscar → /buscar/<id> does NOT remount the page (which was wiping
     the in-flight chat). The navbar adapts to auth reactively: CustomerNavbar when
     signed in, the landing navbar for guests — without touching the page. -->
<template>
  <div class="min-h-screen">
    <CustomerNavbar v-if="user" />
    <LandingNavbar v-else />
    <slot />
    <Toast />
  </div>
</template>

<script setup>
const user = useState('user')
</script>
