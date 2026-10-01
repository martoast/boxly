<template>
  <!-- The little window in the chat (C4): the store browser the agent is running for this cart. Click to open it
       beside the chat (desktop) or full screen (mobile). While it is open, the card just says where it went.
       hideVideo (Alex 2026-09-30: the stream "is just creating complication for the user"): a progress card that says
       what the agent is doing instead — the session is still followed underneath, and a store's human check (only a
       person may pass it) brings the live browser back, since the shopper has to press it there. -->
  <div class="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden max-w-sm">
    <div v-if="progressOnly" class="flex items-center gap-3 px-4 py-3.5" role="status" aria-live="polite">
      <LiveBrowserStage class="hidden" :session-id="session.id" :store-name="name" compact video-hidden @ended="(f) => { done = true; $emit('ended', f) }" @control="(c, reason, at) => $emit('control', c, reason, at)" @phase="onPhase" />
      <svg v-if="finished" class="w-5 h-5 text-green-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 13l4 4L19 7" /></svg>
      <span v-else class="w-5 h-5 rounded-full border-2 border-primary-100 border-t-primary-600 animate-spin shrink-0" aria-hidden="true" />
      <div class="min-w-0 flex-1">
        <div class="text-[13px] font-semibold text-gray-900 truncate">{{ finished ? `Listo · ${name}` : name }}</div>
        <Transition name="fade-step" mode="out-in">
          <div :key="stepText" class="text-[12px] text-gray-500">{{ stepText }}</div>
        </Transition>
      </div>
    </div>
    <button v-else type="button" class="w-full text-left" :aria-label="`Ver ${name} en vivo`" @click="$emit('expand')">
      <LiveBrowserStage v-if="!expanded" :session-id="session.id" :store-name="name" compact @ended="(f) => { done = true; $emit('ended', f) }" @control="(c, reason, at) => $emit('control', c, reason, at)" />
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
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import type { LiveCartSession } from '~/utils/boxlyCart'
import { challengeHelpCopy, CHALLENGE_RESUMED_COPY, liveProgressSteps, type HelpState, type LiveProgressMode } from '~/utils/liveShopping'

const props = defineProps<{ session: LiveCartSession, expanded?: boolean, isDesktop?: boolean, help?: HelpState, hideVideo?: boolean, mode?: LiveProgressMode }>()
// Finished: this card stays in the chat with the store's last frame (a new session replaces it).
const done = ref(false)
watch(() => props.session?.id, () => { done.value = false; stepIdx.value = 0; queued.value = null })
const finished = computed(() => done.value || (props.session?.status && props.session.status !== 'running'))
defineEmits<{ (e: 'expand'): void, (e: 'ended', lastFrame?: string | null): void, (e: 'control', controller: string, reason: string | null, occurredAt: string | null): void }>()
const needsHelp = computed(() => !finished.value && props.help === 'needed')
const name = computed(() => props.session.store_name || props.session.store_id)

// The progress card: the video stays hidden unless the store asks for a person.
const progressOnly = computed(() => !!props.hideVideo && !needsHelp.value)
const queued = ref<number | null>(null)
function onPhase(phase: string, position: number | null) { queued.value = phase === 'queued' ? (position || 1) : null }
const steps = computed(() => liveProgressSteps(props.mode || 'cart', name.value, props.session.note || null))
const stepIdx = ref(0)
// One step every ~7 s, stopping on the last one (the result or the "Listo" replaces the card).
const timer = setInterval(() => { if (!finished.value && stepIdx.value < steps.value.length - 1) stepIdx.value++ }, 7000)
onBeforeUnmount(() => clearInterval(timer))
const stepText = computed(() => {
  if (finished.value) return 'Listo'
  if (queued.value) return queued.value > 1 ? `En fila · ${queued.value - 1} antes que tú…` : `Eres el siguiente en ${name.value}…`
  return steps.value[Math.min(stepIdx.value, steps.value.length - 1)]
})
</script>

<style scoped>
.fade-step-enter-from, .fade-step-leave-to { opacity: 0; transform: translateY(3px); }
.fade-step-enter-active, .fade-step-leave-active { transition: opacity .25s ease, transform .25s ease; }
</style>
