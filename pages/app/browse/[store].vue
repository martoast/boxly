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
      <span aria-hidden="true" class="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full" :class="badgeClass">
        <span class="w-1.5 h-1.5 rounded-full" :class="badgeDot" />{{ badge }}
      </span>
    </div>

    <div class="mt-4 relative bg-gray-900 rounded-2xl overflow-hidden shadow-sm" :class="stage === 'ended' ? 'opacity-90' : ''" style="aspect-ratio: 16 / 9;">
      <video ref="videoEl" autoplay playsinline muted class="w-full h-full object-contain outline-none cursor-default select-none" :class="relay.state.value === 'open' && relay.controller.value === 'customer' ? 'cursor-pointer' : ''" aria-label="Tienda en vivo" />
      <div v-if="overlayBusy" class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40 text-white text-sm">
        <svg class="w-7 h-7 animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
        <span>{{ busyCopy }}</span>
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
            <p class="text-xs text-gray-600"><span v-if="priceText">{{ priceText }}</span><span v-if="availabilityLabel"> · {{ availabilityLabel }}</span></p>
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
import { overlayReducer, purchaseItemFor } from '../../../utils/liveBrowse'
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
const stage = ref<'creating' | 'live' | 'error' | 'ended'>('creating')
const errorCopy = ref('No pudimos abrir la tienda en vivo.')
const handle = ref<SessionHandle | null>(null)
const product = ref<Candidate | null>(null)
const adding = ref(false)
const added = ref(false)
const addError = ref('')
const videoEl = ref<HTMLVideoElement | null>(null)

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
  try {
    const r: any = await $customFetch('/live-shopping/stores')
    const entry = (Array.isArray(r?.stores) ? r.stores : []).find((v: any) => v && v.id === storeId)
    if (!entry) { errorCopy.value = 'Esta tienda no está disponible en vivo.'; stage.value = 'error'; return }
    storeName.value = typeof entry.name === 'string' ? entry.name : storeId
  } catch { /* the create will report */ }
  if (videoEl.value) relay.bind(videoEl.value)
  await createSession()
})
onBeforeUnmount(() => { relay.unbind(); teardown() })

const overlayBusy = computed(() => stage.value === 'creating' || (stage.value === 'live' && (viewerState.value !== 'playing')))
const busyCopy = computed(() => {
  if (stage.value === 'creating') return 'Abriendo la tienda…'
  if (mediaState.value === 'failed' || viewerState.value === 'failed') return 'No se pudo cargar el video en vivo.'
  if (viewerState.value === 'reconnecting') return 'Reconectando…'
  return 'Preparando el video en vivo…'
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
</style>
