<!-- layouts/assistant.vue — full-screen chat shell.
     The site navbar shows on desktop only; on mobile the assistant renders its
     own single top bar (history / title / new chat) so we don't stack two navs
     with two hamburgers. -->
<template>
  <div class="min-h-screen">
    <div class="hidden md:block">
      <CustomerNavbar />
    </div>
    <slot />
    <Toast />
  </div>
</template>

<script setup></script>
