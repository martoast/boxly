<template>
  <div class="min-h-screen bg-white">
    <ShopNavbar />
    <main>
      <slot />
    </main>
    <FooterSection />
    <Toast />
  </div>
</template>

<script setup>
import FooterSection from '~/components/Landing/FooterSection.vue'
</script>
