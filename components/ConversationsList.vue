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
  </div>
</template>

<script setup>
defineProps({
  conversations: { type: Array, default: () => [] },
  activeId: { type: [Number, String, null], default: null },
})
defineEmits(['new', 'open', 'delete'])
</script>
