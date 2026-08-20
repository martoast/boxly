<template>
  <div class="flex h-screen overflow-hidden bg-gray-50">
    <AdminSidebar />
    <main class="flex-1 overflow-y-auto pt-14 md:pt-0">
      <slot />
    </main>
    <Toast />
    <CommandPalette />
  </div>
</template>

<script setup>
import CommandPalette from '~/components/admin/CommandPalette.vue'
</script>

<!--
  iOS Safari zooms the whole page in whenever you focus a field whose
  font-size is under 16px, and never zooms back out. Half these forms use
  text-sm (14px), which is why tapping a filter or a search box made the
  layout "pop" off the side of the screen. Raising just the touch-device
  case fixes it without touching desktop density.

  Not scoped: it has to reach inputs inside every page and modal rendered
  through this layout.
-->
<style>
@media (hover: none) and (pointer: coarse) {
  input:not([type='checkbox']):not([type='radio']),
  select,
  textarea {
    font-size: 16px;
  }
}
</style>
