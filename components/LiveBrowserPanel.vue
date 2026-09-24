<template>
  <!-- The store browser opened beside the chat (desktop: the right-hand column) or over it (mobile: full screen).
       View-only for now; "Pausar y tomar control" arrives with pause/take-control (C4 phase B). -->
  <section class="flex flex-col h-full bg-gray-950 text-white" :aria-label="`${name} en vivo`">
    <header class="flex items-center gap-3 px-4 py-3 border-b border-white/10" :style="mobile ? 'padding-top: calc(env(safe-area-inset-top, 0px) + 0.75rem)' : ''">
      <span class="w-2 h-2 rounded-full shrink-0" :class="ended ? 'bg-green-400' : 'bg-red-500 animate-pulse'" aria-hidden="true" />
      <div class="min-w-0 flex-1">
        <div class="text-sm font-semibold truncate">{{ ended ? 'Listo' : 'En vivo' }} · {{ name }}</div>
        <div class="text-xs text-white/60 truncate">{{ ended ? 'El agente terminó en la tienda.' : 'El agente está agregando tus productos al carrito real de la tienda.' }}</div>
      </div>
      <button type="button" class="inline-flex items-center justify-center w-9 h-9 rounded-lg hover:bg-white/10" :aria-label="mobile ? 'Cerrar' : 'Minimizar'" @click="$emit('close')">
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
          <path v-if="mobile" d="M6 6l12 12M18 6L6 18" />
          <path v-else d="M13 5l7 7-7 7M4 12h15" />
        </svg>
      </button>
    </header>

    <div class="flex-1 min-h-0 flex items-center justify-center p-3 sm:p-4">
      <div class="w-full">
        <LiveBrowserStage :session-id="session.id" :store-name="name" @ended="onEnded" />
      </div>
    </div>

    <footer class="px-4 py-3 border-t border-white/10 flex flex-wrap items-center gap-2" :style="mobile ? 'padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 0.75rem)' : ''">
      <button type="button" disabled class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-white/50 text-sm font-semibold cursor-not-allowed" title="Próximamente">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h3v14H7zM14 5h3v14h-3z" /></svg>
        Pausar y tomar control
      </button>
      <span class="text-[11px] text-white/40">Próximamente: pausa al agente y usa la tienda tú mismo.</span>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { LiveCartSession } from '~/utils/boxlyCart'

const props = defineProps<{ session: LiveCartSession, mobile?: boolean }>()
const emit = defineEmits<{ (e: 'close'): void, (e: 'ended'): void }>()
const name = computed(() => props.session.store_name || props.session.store_id)
const ended = ref(false)
function onEnded() { ended.value = true; emit('ended') }
</script>
