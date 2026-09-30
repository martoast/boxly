<template>
  <!-- The little window in the chat (C4): the store browser the agent is running for this cart. Click to open it
       beside the chat (desktop) or full screen (mobile). While it is open, the card just says where it went. -->
  <div class="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden max-w-sm">
    <button type="button" class="w-full text-left" :aria-label="`Ver ${name} en vivo`" @click="$emit('expand')">
      <LiveBrowserStage v-if="!expanded" :session-id="session.id" :store-name="name" compact @ended="done = true; $emit('ended')" @control="(c, reason, at) => $emit('control', c, reason, at)" />
      <div v-else class="flex items-center justify-center bg-gray-900 text-white/80 text-xs" style="aspect-ratio: 16 / 9">
        Abierto {{ isDesktop ? 'a la derecha' : 'en pantalla completa' }}
      </div>
      <div class="flex items-center gap-2 px-3 py-2">
        <svg v-if="finished" class="w-3.5 h-3.5 text-green-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 13l4 4L19 7" /></svg>
        <span v-else class="w-2 h-2 rounded-full animate-pulse shrink-0" :class="needsHelp ? 'bg-amber-500' : 'bg-red-500'" aria-hidden="true" />
        <div class="min-w-0 flex-1">
          <div class="text-[13px] font-semibold text-gray-900 truncate">{{ finished ? `Listo · ${name}` : `En vivo · ${name}` }}</div>
          <!-- Challenge hand-off: flagged here too, so the shopper sees it even with the panel closed. -->
          <div v-if="needsHelp" class="text-[11px] text-amber-800" role="alert">{{ challengeHelpCopy(name, 'chat') }}</div>
          <div v-else-if="!finished && help === 'resumed'" class="text-[11px] text-green-700" role="status">{{ CHALLENGE_RESUMED_COPY }}</div>
          <div v-else class="text-[11px] text-gray-500 truncate">{{ finished ? `El agente terminó en ${name}. Así quedó la tienda.` : (session.note || 'El agente está agregando tus productos al carrito de la tienda') }}</div>
        </div>
        <span v-if="needsHelp" class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 shrink-0">Necesita tu ayuda</span>
        <span v-else class="text-[12px] font-semibold text-primary-700 shrink-0">{{ expanded ? 'Abierto' : 'Ver' }}</span>
      </div>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { LiveCartSession } from '~/utils/boxlyCart'
import { challengeHelpCopy, CHALLENGE_RESUMED_COPY, type HelpState } from '~/utils/liveShopping'

const props = defineProps<{ session: LiveCartSession, expanded?: boolean, isDesktop?: boolean, help?: HelpState }>()
// Finished: this card stays in the chat with the store's last frame (a new session replaces it).
const done = ref(false)
watch(() => props.session?.id, () => { done.value = false })
const finished = computed(() => done.value || (props.session?.status && props.session.status !== 'running'))
defineEmits<{ (e: 'expand'): void, (e: 'ended'): void, (e: 'control', controller: string, reason: string | null, occurredAt: string | null): void }>()
const needsHelp = computed(() => !finished.value && props.help === 'needed')
const name = computed(() => props.session.store_name || props.session.store_id)
</script>
