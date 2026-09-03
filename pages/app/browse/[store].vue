<template>
  <!-- One streamed store, controlled by the customer. No URL input: the engine
       opens the store's own storefront and keeps the session inside it. -->
  <div class="max-w-6xl mx-auto px-4 py-6">
    <div class="flex items-center justify-between gap-3">
      <div class="min-w-0">
        <NuxtLink to="/app/browse" class="text-xs text-gray-500 hover:text-gray-700">← Tiendas en vivo</NuxtLink>
        <h1 class="text-xl font-semibold text-gray-900 truncate">{{ storeName || storeId }}</h1>
      </div>
      <span class="sr-only" role="status" aria-atomic="true">{{ srStatus }}</span>
      <span class="sr-only">Diag contadores: enviadas {{ relay.sent.value }} recibidos {{ relay.received.value }} foco {{ relay.focusedTag.value }}</span>
      <span class="sr-only">Diag ultima tecla: {{ relay.lastKey.value }}</span>
      <span class="sr-only">Diag por tipo: move {{ relay.sentByType.value['pointer.move'] }} click {{ relay.sentByType.value['pointer.click'] }} scroll {{ relay.sentByType.value['pointer.scroll'] }} text {{ relay.sentByType.value['text.type'] }} key {{ relay.sentByType.value['key.press'] }}</span>
      <span class="sr-only">Diag ultimo evento: {{ lastDocEvent }}</span>
      <span aria-hidden="true" class="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full" :class="badgeClass">
        <span class="w-1.5 h-1.5 rounded-full" :class="badgeDot" />{{ badge }}
      </span>
    </div>

    <div class="mt-4 relative bg-gray-900 rounded-2xl overflow-hidden shadow-sm" :class="stage === 'ended' ? 'opacity-90' : ''" style="aspect-ratio: 16 / 9;">
      <video ref="videoEl" tabindex="0" autoplay playsinline muted class="w-full h-full object-contain outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-inset cursor-default select-none" :class="relay.state.value === 'open' && relay.controller.value === 'customer' ? 'cursor-pointer' : ''" aria-label="Tienda en vivo" />
      <!-- Staged loader while the first frame is on its way: a browser-shaped
           skeleton with a moving sheen, the store's mark breathing in the middle,
           and three steps that tick off real signals (session, media, video). -->
      <div v-if="overlayBusy" class="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-gray-900 text-white text-sm loader-bg" aria-busy="true">
        <div class="absolute inset-0 p-4 sm:p-6 pointer-events-none" aria-hidden="true">
          <div class="h-full w-full rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
            <div class="h-8 border-b border-white/10 flex items-center gap-2 px-3">
              <span class="w-2 h-2 rounded-full bg-white/15" /><span class="w-2 h-2 rounded-full bg-white/15" /><span class="w-2 h-2 rounded-full bg-white/15" />
              <span class="ml-2 h-3 flex-1 rounded bg-white/10 skeleton" />
            </div>
            <div class="p-4 space-y-3">
              <div class="h-3 w-1/2 rounded bg-white/10 skeleton" />
              <div class="h-24 sm:h-32 rounded-lg bg-white/[0.06] skeleton" />
              <div class="grid grid-cols-4 gap-3">
                <div v-for="n in 4" :key="n" class="h-16 sm:h-24 rounded-lg bg-white/[0.06] skeleton" />
              </div>
            </div>
          </div>
        </div>
        <div class="relative flex flex-col items-center gap-4 px-6 py-5 rounded-2xl bg-gray-950/80 backdrop-blur border border-white/10 shadow-xl">
          <div class="relative w-16 h-16 flex items-center justify-center" aria-hidden="true">
            <span v-if="!loaderFailed" class="absolute inset-0 rounded-full border-2 border-primary-400/60 ring-pulse" />
            <span v-if="!loaderFailed" class="absolute inset-0 rounded-full border-2 border-primary-400/30 ring-pulse ring-pulse-late" />
            <div class="w-12 h-12 rounded-xl bg-white flex items-center justify-center overflow-hidden" :class="loaderFailed ? '' : 'breathe'">
              <img v-if="storeImage" :src="storeImage" alt="" width="32" height="32" class="w-8 h-8 object-contain" @error="storeImage = null" />
              <span v-else class="text-gray-900 font-semibold text-lg">{{ (storeName || storeId).slice(0, 1).toUpperCase() }}</span>
            </div>
          </div>
          <ol class="space-y-1.5 text-left min-w-[14rem]">
            <li v-for="step in loaderSteps" :key="step.key" class="flex items-center gap-2.5 text-[13px] transition-colors" :class="step.state === 'pending' ? 'text-white/40' : step.state === 'failed' ? 'text-red-300' : 'text-white'">
              <span class="w-4 h-4 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                <svg v-if="step.state === 'done'" class="w-4 h-4 text-green-400" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 111.4-1.4L8.5 12l6.8-6.7a1 1 0 011.4 0z" clip-rule="evenodd"/></svg>
                <svg v-else-if="step.state === 'active'" class="w-3.5 h-3.5 animate-spin text-primary-300" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                <svg v-else-if="step.state === 'failed'" class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.7 7.3a1 1 0 00-1.4 1.4L8.6 10l-1.3 1.3a1 1 0 101.4 1.4L10 11.4l1.3 1.3a1 1 0 001.4-1.4L11.4 10l1.3-1.3a1 1 0 00-1.4-1.4L10 8.6 8.7 7.3z" clip-rule="evenodd"/></svg>
                <span v-else class="w-1.5 h-1.5 rounded-full bg-white/30" />
              </span>
              <span>{{ step.label }}</span>
            </li>
          </ol>
          <p class="text-xs text-white/60">{{ busyCopy }}</p>
        </div>
      </div>
      <div v-else-if="stage === 'error'" role="alert" class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 text-white text-sm px-6 text-center">
        <span>{{ errorCopy }}</span>
        <button type="button" class="px-3 py-1.5 rounded-lg bg-white text-gray-900 text-xs font-medium" @click="restart">Intentar de nuevo</button>
      </div>
      <div v-else-if="stage === 'ended'" class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 text-white text-sm">
        <span>La sesión en vivo terminó.</span>
        <button type="button" class="px-3 py-1.5 rounded-lg bg-white text-gray-900 text-xs font-medium" @click="restart">Abrir de nuevo</button>
      </div>

      <!-- Product overlay: driven only by the engine's `candidate` event for the
           page the customer is on; hidden on candidate.cleared or a terminal. -->
      <transition name="fade">
        <div v-if="product" class="absolute bottom-3 left-3 right-3 sm:left-auto sm:w-96 bg-white/95 backdrop-blur rounded-xl shadow-lg border border-gray-200 p-3 flex gap-3 items-center">
          <img v-if="product.image" :src="product.image" alt="" class="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-gray-900 truncate">{{ product.title }}</p>
            <p class="text-xs text-gray-600"><span v-if="priceText">{{ priceText }}</span><span v-else class="text-amber-700">Precio por confirmar</span><span v-if="availabilityLabel"> · {{ availabilityLabel }}</span></p>
            <p v-if="added" class="text-xs text-green-700 mt-0.5">Agregado a tu carrito de Boxly.</p>
            <p v-else-if="addError" class="text-xs text-red-600 mt-0.5">{{ addError }}</p>
          </div>
          <button type="button" class="px-3 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold whitespace-nowrap disabled:opacity-60" :disabled="adding || added" @click="addToBoxlyCart">
            {{ adding ? 'Agregando…' : 'Añadir al carrito de Boxly' }}
          </button>
        </div>
      </transition>
    </div>

    <p class="mt-3 text-xs text-gray-500">
      Navega la tienda como en tu computadora. Cuando llegues a un producto, agrégalo a tu carrito de Boxly y nosotros lo compramos por ti.
      <span v-if="relay.lastRefusal.value === 'key_refused'"> Esa tecla no está disponible aquí.</span>
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  parseSessionCreateResponse, isTerminal, candidatePriceText, availabilityText,
  type Candidate, type EventV1, type SessionHandle,
} from '../../../utils/liveShopping'
import { overlayReducer, purchaseItemFor, storeCardImage, loaderStepsFor } from '../../../utils/liveBrowse'
import { useLiveSession } from '../../../composables/useLiveSession'
import { useWhepViewer } from '../../../composables/useWhepViewer'
import { useInputRelay } from '../../../composables/useInputRelay'

definePageMeta({ layout: 'app', middleware: ['auth', 'customer', 'complete-profile'] })

const route = useRoute()
const nuxtApp = useNuxtApp() as any
const { $customFetch } = nuxtApp
const STORE_ID_RE = /^[a-z0-9][a-z0-9_-]{0,39}$/
const storeId = String(route.params.store || '')
if (!STORE_ID_RE.test(storeId)) throw createError({ statusCode: 404, statusMessage: 'Tienda no encontrada' })
useHead({ title: `Boxly — Tienda en vivo` })

const storeName = ref<string>('')
const storeImage = ref<string | null>(null)
const stage = ref<'creating' | 'live' | 'error' | 'ended'>('creating')
const errorCopy = ref('No pudimos abrir la tienda en vivo.')
const handle = ref<SessionHandle | null>(null)
const product = ref<Candidate | null>(null)
const adding = ref(false)
const added = ref(false)
const addError = ref('')
const videoEl = ref<HTMLVideoElement | null>(null)
// Diagnostic: where do pointer/key events land in this document? (tag.class of the target)
const lastDocEvent = ref('none')
const docTrace = (ev: Event) => { const t = ev.target as any; lastDocEvent.value = `${ev.type}:${t?.tagName || '?'}.${String(t?.className || '').slice(0, 40)}` }

// One session per page visit. The composables are created per session so a
// restart is a clean start: new handle, new tickets, new socket.
let live: ReturnType<typeof useLiveSession> | null = null
let viewer: ReturnType<typeof useWhepViewer> | null = null
const relay = useInputRelay()
let stops: Array<() => void> = []

const liveStatus = ref<string>('connecting')
const mediaState = ref<string>('pending')
const viewerState = ref<string>('idle')

async function createSession() {
  stage.value = 'creating'
  product.value = null; added.value = false; addError.value = ''
  let r: any
  try {
    r = await $customFetch('/live-shopping/sessions', { method: 'POST', body: { kind: 'manual', store_id: storeId } })
  } catch (e: any) {
    const code = e?.data?.code
    const status = Number(e?.status || e?.statusCode || e?.response?.status || 0)
    errorCopy.value = status === 409
      ? 'Ya tienes una sesión en vivo abierta. Ciérrala o espera a que termine para abrir otra tienda.'
      : code === 'rate_limited' || code === 'engine_unavailable' || code === 'engine_refused' || code === 'not_configured'
      ? 'Las tiendas en vivo no están disponibles en este momento. Intenta de nuevo en un rato.'
      : code === 'store_unsupported' ? 'Esta tienda no está disponible en vivo.' : 'No pudimos abrir la tienda en vivo.'
    stage.value = 'error'
    return
  }
  const h = parseSessionCreateResponse(r)
  if (!h) { stage.value = 'error'; return }
  handle.value = h
  // The composables read the Nuxt app (fetch plugin); created here, after an
  // await, they need the app context restored explicitly. A restart makes a
  // fresh pair for the fresh session.
  live = nuxtApp.runWithContext(() => useLiveSession(h, {
    onTerminal: () => { viewer?.stop(); relay.stop(); product.value = null; stage.value = 'ended' },
    // Candidates arrive validated through the composable's list; the overlay
    // shows the latest one and clears on candidate.cleared or a terminal.
    onEvent: (ev: EventV1) => { if (ev.type !== 'candidate') product.value = overlayReducer(product.value, ev) },
  }))
  stops.push(watch(live!.candidates, (list) => { const last = list[list.length - 1]; if (last) { product.value = last; added.value = false; addError.value = '' } }))
  viewer = nuxtApp.runWithContext(() => useWhepViewer({ getTicket: live!.getTicket, remintTicket: live!.remintTicket }))
  stops.push(watch(live.status, (s) => { liveStatus.value = s }, { immediate: true }))
  stops.push(watch(live.mediaState, (s) => { mediaState.value = s }, { immediate: true }))
  stops.push(watch(viewer.state, (s) => { viewerState.value = s }, { immediate: true }))
  stops.push(watch(viewer.stream, (s) => { if (videoEl.value && s) videoEl.value.srcObject = s }))
  // The ticket drives both planes: the video when it carries media, the input
  // socket when it carries input_url. A re-minted ticket (media.ready) restarts
  // whichever plane is idle; a socket already open keeps its connection.
  stops.push(watch(live.ticket, (t) => {
    if (!t || isTerminal(live!.status.value)) return
    if (t.mediaAvailable) { const vs = viewer!.state.value; if (vs === 'idle' || vs === 'closed' || vs === 'failed') viewer!.start() }
    if (t.inputUrl && (relay.state.value === 'idle' || relay.state.value === 'closed' || relay.state.value === 'failed')) relay.start(t)
  }, { immediate: true }))
  stage.value = 'live'
  live.start()
}

function teardown() {
  for (const s of stops) s()
  stops = []
  viewer?.stop(); viewer = null
  relay.stop()
  live?.stop(); live = null
}

async function restart() { teardown(); await createSession() }

onMounted(async () => {
  for (const t of ['pointerdown', 'keydown', 'wheel']) document.addEventListener(t, docTrace, { capture: true, passive: true })
  try {
    const r: any = await $customFetch('/live-shopping/stores')
    const entry = (Array.isArray(r?.stores) ? r.stores : []).find((v: any) => v && v.id === storeId)
    if (!entry) { errorCopy.value = 'Esta tienda no está disponible en vivo.'; stage.value = 'error'; return }
    storeName.value = typeof entry.name === 'string' ? entry.name : storeId
    storeImage.value = typeof entry.url === 'string' ? storeCardImage(entry.url) : null
  } catch { /* the create will report */ }
  if (videoEl.value) relay.bind(videoEl.value)
  await createSession()
})
onBeforeUnmount(() => { for (const t of ['pointerdown', 'keydown', 'wheel']) document.removeEventListener(t, docTrace, { capture: true } as any); relay.unbind(); teardown() })

const overlayBusy = computed(() => stage.value === 'creating' || (stage.value === 'live' && (viewerState.value !== 'playing')))
const loaderSteps = computed(() => loaderStepsFor({ stage: stage.value, mediaState: mediaState.value, viewerState: viewerState.value }, storeName.value))
const loaderFailed = computed(() => loaderSteps.value.some((s) => s.state === 'failed'))
const busyCopy = computed(() => {
  if (mediaState.value === 'failed' || viewerState.value === 'failed') return 'No se pudo cargar el video en vivo.'
  if (viewerState.value === 'reconnecting') return 'Reconectando…'
  if (stage.value === 'creating') return 'Esto toma unos segundos.'
  return 'Casi listo: estamos abriendo la tienda en un navegador seguro.'
})
const badge = computed(() => {
  if (stage.value === 'ended') return 'Sesión terminada'
  if (stage.value === 'error') return 'No disponible'
  if (relay.state.value === 'open' && relay.controller.value === 'customer') return 'Tú controlas'
  if (relay.controller.value === 'agent') return 'Agente navegando'
  return 'Conectando…'
})
const badgeClass = computed(() => (relay.state.value === 'open' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'))
const badgeDot = computed(() => (relay.state.value === 'open' ? 'bg-green-500' : 'bg-amber-400 animate-pulse'))
const srStatus = computed(() => `${storeName.value || storeId}: ${badge.value}`)
const priceText = computed(() => (product.value ? candidatePriceText(product.value) : ''))
const availabilityLabel = computed(() => (product.value ? availabilityText(product.value.availability) : null))

async function addToBoxlyCart() {
  if (!product.value || adding.value) return
  adding.value = true; addError.value = ''
  try {
    await $customFetch('/purchase-requests', { method: 'POST', body: { currency: 'usd', items: [purchaseItemFor(product.value)] } })
    added.value = true
  } catch (e: any) {
    addError.value = e?.data?.message || 'No se pudo agregar. Intenta de nuevo.'
  } finally { adding.value = false }
}
</script>

<style scoped>
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(6px); }
.fade-enter-active, .fade-leave-active { transition: opacity .2s ease, transform .2s ease; }
.loader-bg { background-image: radial-gradient(60% 60% at 50% 40%, rgba(99, 102, 241, .18), transparent 70%); }
.skeleton { position: relative; overflow: hidden; }
.skeleton::after { content: ''; position: absolute; inset: 0; transform: translateX(-100%); background: linear-gradient(90deg, transparent, rgba(255,255,255,.08), transparent); animation: sheen 1.8s ease-in-out infinite; }
@keyframes sheen { to { transform: translateX(100%); } }
.breathe { animation: breathe 2.2s ease-in-out infinite; }
@keyframes breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.06); } }
.ring-pulse { animation: ring 2.2s ease-out infinite; }
.ring-pulse-late { animation-delay: 1.1s; }
@keyframes ring { 0% { transform: scale(.8); opacity: .9; } 100% { transform: scale(1.5); opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .skeleton::after, .breathe, .ring-pulse { animation: none; } }
</style>
