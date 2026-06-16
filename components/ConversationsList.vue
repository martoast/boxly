<template>
  <div class="flex flex-col h-full">
    <div class="p-3">
      <button @click="$emit('new')" class="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 active:scale-[.98] text-white text-sm font-semibold transition-all shadow-sm shadow-primary-500/20">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        Nuevo chat
      </button>
    </div>
    <div class="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
      <div
        v-for="c in conversations"
        :key="c.id"
        @click="$emit('open', c.id)"
        :class="['group flex items-center gap-1 pl-3 pr-1.5 py-2 rounded-lg text-sm cursor-pointer transition-colors', activeId === c.id ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700 hover:bg-gray-100']"
      >
        <span class="flex-1 truncate">{{ c.title || 'Nuevo chat' }}</span>
        <button
          @click.stop="$emit('delete', c.id)"
          class="shrink-0 p-1 rounded-md text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 transition-all"
          aria-label="Eliminar"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.87 12.14A2 2 0 0116.14 21H7.86a2 2 0 01-1.99-1.86L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16"/></svg>
        </button>
      </div>
      <p v-if="!conversations.length" class="px-3 py-6 text-xs text-gray-400 text-center">Tus chats aparecerán aquí.</p>
    </div>

    <!-- Mobile-only: the site navbar is hidden on the full-screen chat, so give
         users a way back into their account from the history drawer. -->
    <div class="md:hidden border-t border-gray-100 p-2 space-y-0.5">
      <NuxtLink to="/app/" class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors">
        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
        Panel principal
      </NuxtLink>
      <NuxtLink to="/app/account" class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors">
        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
        Mi cuenta
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
defineProps({
  conversations: { type: Array, default: () => [] },
  activeId: { type: [Number, String, null], default: null },
})
defineEmits(['new', 'open', 'delete'])
</script>
