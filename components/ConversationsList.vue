<template>
  <!-- ===== COLLAPSED: icon-only rail (desktop) ===== -->
  <div v-if="collapsed" class="flex flex-col items-center h-full py-3 gap-1">
    <button @click="$emit('toggle')" title="Expandir" aria-label="Expandir" class="w-10 h-10 grid place-items-center rounded-lg text-gray-500 hover:bg-gray-100 active:scale-90 transition-all">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2" stroke-width="2"/><path stroke-width="2" stroke-linecap="round" d="M9 4v16"/></svg>
    </button>
    <button @click="$emit('new')" title="Nuevo chat" aria-label="Nuevo chat" class="w-10 h-10 grid place-items-center rounded-lg bg-primary-500 hover:bg-primary-600 text-white active:scale-90 transition-all shadow-sm shadow-primary-500/20">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
    </button>
    <button v-if="user" @click="$emit('memory')" title="Tu perfil de compras" aria-label="Tu perfil de compras" class="w-10 h-10 grid place-items-center rounded-lg text-primary-500 hover:bg-gray-100 active:scale-90 transition-all">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
    </button>

    <!-- profile / login (bottom of the rail, ChatGPT-style) -->
    <div v-if="showProfile" class="mt-auto relative">
      <button v-if="user" @click="menuOpen = !menuOpen" :title="user.name || 'Cuenta'" class="w-9 h-9 grid place-items-center rounded-full bg-primary-100 text-primary-700 text-xs font-bold ring-1 ring-primary-200 hover:ring-primary-300 active:scale-90 transition">{{ initials }}</button>
      <NuxtLink v-else :to="loginTo" title="Iniciar sesión" aria-label="Iniciar sesión" class="w-10 h-10 grid place-items-center rounded-lg text-gray-500 hover:bg-gray-100 active:scale-90 transition">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
      </NuxtLink>
      <!-- menu, opens up-and-right of the narrow rail -->
      <template v-if="menuOpen && user">
        <div class="fixed inset-0 z-40" @click="menuOpen = false"></div>
        <div class="absolute bottom-0 left-full ml-2 z-50 w-48 bg-white rounded-xl shadow-xl ring-1 ring-black/5 p-1">
          <NuxtLink to="/app/" @click="menuOpen = false" class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition">Mi cuenta</NuxtLink>
          <div class="flex items-center gap-1 px-3 py-1.5">
            <span class="text-[11px] text-gray-400 mr-1">Idioma</span>
            <button @click="switchLanguage('es')" :class="['px-2 py-0.5 rounded-md text-xs font-semibold transition', language === 'es' ? 'bg-primary-500 text-white' : 'text-gray-600 hover:bg-gray-100']">ES</button>
            <button @click="switchLanguage('en')" :class="['px-2 py-0.5 rounded-md text-xs font-semibold transition', language === 'en' ? 'bg-primary-500 text-white' : 'text-gray-600 hover:bg-gray-100']">EN</button>
          </div>
          <button @click="menuOpen = false; $emit('logout')" class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition text-left">Cerrar sesión</button>
        </div>
      </template>
    </div>
  </div>

  <!-- ===== EXPANDED: full panel ===== -->
  <div v-else class="flex flex-col h-full">
    <div class="p-3 space-y-2">
      <!-- collapse toggle (desktop only — mobile uses the drawer backdrop) -->
      <div class="hidden md:flex justify-end -mb-1">
        <button @click="$emit('toggle')" title="Contraer" aria-label="Contraer" class="w-8 h-8 grid place-items-center rounded-lg text-gray-400 hover:bg-gray-100 active:scale-90 transition-all">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2" stroke-width="2"/><path stroke-width="2" stroke-linecap="round" d="M9 4v16"/></svg>
        </button>
      </div>
      <button @click="$emit('new')" class="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 active:scale-[.98] text-white text-sm font-semibold transition-all shadow-sm shadow-primary-500/20">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        Nuevo chat
      </button>
      <button v-if="user" @click="$emit('memory')" class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 active:scale-[.98] text-gray-700 text-sm font-semibold transition-all">
        <svg class="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
        Tu perfil de compras
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
      <p v-if="user && !conversations.length" class="px-3 py-6 text-xs text-gray-400 text-center">Tus chats aparecerán aquí.</p>
    </div>

    <!-- ===== Profile / login (bottom-left, ChatGPT-style) ===== -->
    <div v-if="showProfile" class="border-t border-gray-100 p-2 relative">
      <!-- signed in -->
      <button v-if="user" @click="menuOpen = !menuOpen" class="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-gray-100 active:scale-[.99] transition">
        <span class="w-8 h-8 shrink-0 grid place-items-center rounded-full bg-primary-100 text-primary-700 text-xs font-bold ring-1 ring-primary-200">{{ initials }}</span>
        <span class="flex-1 min-w-0 text-left">
          <span class="block truncate text-sm font-semibold text-gray-800">{{ user.name || 'Mi cuenta' }}</span>
          <span v-if="user.email" class="block truncate text-[11px] text-gray-400">{{ user.email }}</span>
        </span>
        <svg class="w-4 h-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"/></svg>
      </button>
      <!-- guest -->
      <div v-else class="space-y-1.5">
        <NuxtLink :to="loginTo" class="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 active:scale-[.98] text-white text-sm font-semibold transition">Iniciar sesión</NuxtLink>
        <NuxtLink :to="registerTo" class="w-full flex items-center justify-center px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 active:scale-[.98] text-gray-700 text-sm font-semibold transition">Crear cuenta</NuxtLink>
      </div>
      <!-- account menu (opens upward) -->
      <template v-if="menuOpen && user">
        <div class="fixed inset-0 z-40" @click="menuOpen = false"></div>
        <div class="absolute bottom-full left-2 right-2 mb-1 z-50 bg-white rounded-xl shadow-xl ring-1 ring-black/5 p-1">
          <NuxtLink to="/app/" @click="menuOpen = false" class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition">Mi cuenta</NuxtLink>
          <div class="flex items-center gap-1 px-3 py-1.5">
            <span class="text-[11px] text-gray-400 mr-1">Idioma</span>
            <button @click="switchLanguage('es')" :class="['px-2 py-0.5 rounded-md text-xs font-semibold transition', language === 'es' ? 'bg-primary-500 text-white' : 'text-gray-600 hover:bg-gray-100']">ES</button>
            <button @click="switchLanguage('en')" :class="['px-2 py-0.5 rounded-md text-xs font-semibold transition', language === 'en' ? 'bg-primary-500 text-white' : 'text-gray-600 hover:bg-gray-100']">EN</button>
          </div>
          <button @click="menuOpen = false; $emit('logout')" class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition text-left">Cerrar sesión</button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  conversations: { type: Array, default: () => [] },
  activeId: { type: [Number, String, null], default: null },
  collapsed: { type: Boolean, default: false },
  user: { type: Object, default: null },
  showProfile: { type: Boolean, default: false },
})
defineEmits(['new', 'open', 'delete', 'memory', 'toggle', 'logout'])

const menuOpen = ref(false)
const back = encodeURIComponent('/search')
const loginTo = `/login?redirect=${back}`
const registerTo = `/register?redirect=${back}`

const initials = computed(() => {
  const n = (props.user?.name || '').trim()
  if (!n) return 'U'
  return n.split(/\s+/).map((w) => w[0]).join('').toUpperCase().slice(0, 2)
})

const { language, switchLanguage } = useLanguage()
</script>
