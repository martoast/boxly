<template>
  <!-- The store browser opened beside the chat (desktop: the right-hand column) or over it (mobile: full screen).
       View-only for now; "Pausar y tomar control" arrives with pause/take-control (C4 phase B). -->
  <section class="flex flex-col h-full bg-gray-950 text-white" :aria-label="`${name} en vivo`">
    <header class="flex items-center gap-3 px-4 py-3 border-b border-white/10" :style="mobile ? 'padding-top: calc(env(safe-area-inset-top, 0px) + 0.75rem)' : ''">
      <span class="w-2 h-2 rounded-full shrink-0" :class="ended ? 'bg-green-400' : 'bg-red-500 animate-pulse'" aria-hidden="true" />
      <div class="min-w-0 flex-1">
        <div class="text-sm font-semibold truncate">{{ ended ? 'Listo' : 'En vivo' }} · {{ name }}</div>
        <div class="text-xs text-white/60 truncate">{{ subtitle }}</div>
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
        <LiveBrowserStage :session-id="session.id" :store-name="name" :interactive="controller === 'customer'" @ended="onEnded" @control="onControl" @refused="onRefused" />
        <p v-if="notice" class="mt-2 text-xs text-amber-300" role="status">{{ notice }}</p>
      </div>
    </div>

    <footer v-if="!ended" class="px-4 py-3 border-t border-white/10 flex flex-wrap items-center gap-3" :style="mobile ? 'padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 0.75rem)' : ''">
      <button v-if="controller === 'agent'" type="button" :disabled="busy" class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-gray-900 hover:bg-white/90 text-sm font-semibold disabled:opacity-60" @click="takeControl">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h3v14H7zM14 5h3v14h-3z" /></svg>
        Pausar y tomar control
      </button>
      <span v-else-if="controller === 'pausing'" class="inline-flex items-center gap-2 text-sm text-white/80">
        <span class="w-4 h-4 rounded-full border-2 border-white/25 border-t-white animate-spin" aria-hidden="true" />
        Pausando al agente… termina su paso actual
      </span>
      <template v-else>
        <span class="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-primary-500/20 text-primary-200">
          <span class="w-1.5 h-1.5 rounded-full bg-primary-300" aria-hidden="true" />Tú controlas la tienda
        </span>
        <button type="button" :disabled="busy" class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold disabled:opacity-60" @click="handBack">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
          Devolver al agente
        </button>
      </template>
      <span class="text-[11px] text-white/45 basis-full">{{ controller === 'customer' ? 'Navega y agrega lo que quieras. Pagar y finalizar la compra siguen bloqueados: Boxly compra por ti.' : 'Pausa al agente para usar la tienda tú mismo; se lo devuelves cuando termines.' }}</span>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { LiveCartSession } from '~/utils/boxlyCart'

const props = defineProps<{ session: LiveCartSession, mobile?: boolean }>()
const emit = defineEmits<{ (e: 'close'): void, (e: 'ended'): void, (e: 'control', controller: string): void }>()
const name = computed(() => props.session.store_name || props.session.store_id)
const ended = ref(false)
function onEnded() { ended.value = true; controller.value = 'agent'; emit('ended') }

// C4 phase B: who holds the store browser. The engine's control.changed events are the truth; the button's own
// answer ("pausing") only moves the UI ahead of the event.
const { $customFetch } = useNuxtApp() as any
const controller = ref<'agent' | 'pausing' | 'customer'>('agent')
const busy = ref(false)
const notice = ref('')
let noticeTimer: any = null
const subtitle = computed(() => ended.value ? 'El agente terminó en la tienda.'
  : controller.value === 'customer' ? 'Tú controlas el navegador; el agente está en pausa.'
  : controller.value === 'pausing' ? 'Pausando al agente…'
  : props.session.note ? `${props.session.note}.` : 'El agente está agregando tus productos al carrito real de la tienda.')
function onControl(c: string) {
  if (c === 'agent' || c === 'pausing' || c === 'customer') { controller.value = c; emit('control', c) }
}
async function setController(target: 'customer' | 'agent') {
  busy.value = true
  try {
    const r = await $customFetch(`/live-shopping/sessions/${props.session.id}/control`, { method: 'POST', body: { controller: target } })
    const c = r?.data?.controller
    if (c === 'agent' || c === 'pausing' || c === 'customer') controller.value = c
  } catch (e: any) {
    show(e?.data?.code === 'not_controllable' ? 'Este navegador ya no se puede tomar: el agente terminó.' : 'No pudimos cambiar el control. Intenta de nuevo.')
  } finally { busy.value = false }
}
function takeControl() { notice.value = ''; setController('customer') }
// Hand back: the input closes first (interactive goes false), then the agent resumes.
function handBack() { controller.value = 'pausing'; setController('agent') }
function show(text: string) { notice.value = text; clearTimeout(noticeTimer); noticeTimer = setTimeout(() => { notice.value = '' }, 5000) }
function onRefused(code: string) {
  if (code === 'purchase_locked') show('Pagar o finalizar la compra está bloqueado: Boxly hace la compra por ti.')
  else if (code === 'payment_locked') show('Los datos de pago están bloqueados aquí.')
  else if (code === 'key_refused') show('Escribe dentro de la página de la tienda.')
}
</script>
