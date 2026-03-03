<template>
  <div class="flex h-screen overflow-hidden bg-gray-50">
    <AdminSidebar />
    <main class="flex-1 overflow-y-auto pt-14 md:pt-0">
      <slot />
    </main>
  </div>
</template>

<script setup>
</script>
