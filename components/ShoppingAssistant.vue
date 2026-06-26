<template>
  <div class="flex bg-gray-50 overflow-hidden relative" :class="fullscreenMobile ? 'h-[100dvh] md:h-[calc(100dvh-4rem)]' : 'h-[calc(100dvh-4rem)]'">
    <!-- ===== Mobile history drawer ===== -->
    <Transition name="backdrop">
      <div v-if="user && drawerOpen" class="md:hidden absolute inset-0 z-40 bg-black/30 backdrop-blur-sm" @click="drawerOpen = false" />
    </Transition>
    <Transition name="drawer">
      <aside v-if="user && drawerOpen" class="md:hidden absolute inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 flex flex-col shadow-2xl">
        <ConversationsList :conversations="conversations" :active-id="activeId" @new="newChat" @open="openChat" @delete="deleteConversation" @memory="showMemory = true" />
      </aside>
    </Transition>

    <!-- ===== Desktop sidebar ===== -->
    <aside v-if="user" class="hidden md:flex md:flex-col w-72 border-r border-gray-200 bg-white">
      <ConversationsList :conversations="conversations" :active-id="activeId" @new="newChat" @open="openChat" @delete="deleteConversation" />
    </aside>

    <!-- ===== Chat area ===== -->
    <main class="flex-1 flex flex-col min-w-0">
      <!-- Mobile top bar (logged-in: history access) -->
      <header v-if="user" class="md:hidden flex items-center justify-between px-3 min-h-[3rem] border-b border-gray-100 bg-white/80 backdrop-blur shrink-0" :class="fullscreenMobile ? 'pt-[env(safe-area-inset-top)]' : ''">
        <button @click="drawerOpen = true" class="p-2 -ml-1 rounded-lg text-gray-600 active:scale-90 transition-transform" aria-label="Historial">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
        <span class="text-sm font-semibold text-gray-700 truncate px-2">{{ activeTitle }}</span>
        <div class="flex items-center">
          <button @click="showMemory = true" class="p-2 rounded-lg text-gray-600 active:scale-90 transition-transform" aria-label="Tu perfil de compras">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
          </button>
          <button @click="newChat" class="p-2 -mr-1 rounded-lg text-primary-600 active:scale-90 transition-transform" aria-label="Nuevo chat">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          </button>
        </div>
      </header>

      <!-- ===== LOADING A CONVERSATION (from history) ===== -->
      <div v-if="loadingChat" class="flex-1 overflow-hidden px-3 md:px-4 py-5">
        <div class="max-w-2xl mx-auto space-y-4 animate-pulse">
          <div class="flex justify-end"><div class="h-9 w-40 rounded-3xl rounded-br-lg bg-primary-200/60"></div></div>
          <div class="flex justify-start"><div class="h-24 w-3/4 rounded-3xl rounded-bl-lg bg-gray-200"></div></div>
          <div class="flex justify-end"><div class="h-9 w-28 rounded-3xl rounded-br-lg bg-primary-200/60"></div></div>
          <div class="flex justify-start"><div class="h-20 w-2/3 rounded-3xl rounded-bl-lg bg-gray-200"></div></div>
          <div class="flex justify-center pt-2"><span class="text-xs text-gray-400">Cargando conversación…</span></div>
        </div>
      </div>

      <!-- ===== EMPTY STATE — ChatGPT-style picture cards; tapping one writes the
                 prompt into the input. Composer pinned at the bottom. ===== -->
      <Transition name="fade-fast">
        <div v-if="!loadingChat && !chat.messages.length && !activeId" class="flex-1 flex flex-col min-h-0">
          <!-- Centered loader until every card image is resolved + decoded, then
               reveal the whole grid at once (no emoji-then-image pop-in). -->
          <Transition name="fade-fast" mode="out-in">
          <div v-if="!cardsReady" key="cards-loading" class="flex-1 grid place-items-center">
            <svg class="w-7 h-7 animate-spin text-gray-300" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
          </div>
          <!-- scrollable cards -->
          <div v-else key="cards-ready" class="flex-1 overflow-y-auto px-4 md:px-5 pt-5 pb-2">
            <div class="max-w-2xl mx-auto">
              <h1 class="text-[26px] md:text-3xl font-extrabold text-gray-900 tracking-tight">Compra en Estados Unidos</h1>
              <p class="text-gray-500 mt-1 mb-4 text-[14px] md:text-[15px]">Toca una idea o escribe lo que buscas — Boxly lo consigue, lo importa y te lo entrega en México.</p>

              <div>
                <!-- featured (first) card -->
                <button
                  v-if="suggestions[0]"
                  :key="suggestions[0].text"
                  @click="pickSuggestion(suggestions[0].text)"
                  class="group relative block w-full h-44 md:h-52 rounded-3xl overflow-hidden mb-3 text-left active:scale-[.99] transition-transform shadow-sm"
                  :class="`bg-gradient-to-br ${suggestions[0].grad}`"
                >
                  <img v-if="cardImg(suggestions[0])" :src="cardImg(suggestions[0])" @error="onCardImgError(suggestions[0])" referrerpolicy="no-referrer" class="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105" />
                  <span v-else class="absolute inset-0 grid place-items-center text-[84px] opacity-90 select-none transition-transform group-hover:scale-105">{{ suggestions[0].emoji }}</span>
                  <span class="absolute top-3 left-3 text-[12px] font-bold text-gray-800 bg-white/90 backdrop-blur rounded-full px-2.5 py-1 shadow-sm">Pruébalo</span>
                  <span class="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/65 to-transparent pointer-events-none"></span>
                  <span class="absolute left-4 bottom-3.5 right-4 text-white text-lg md:text-xl font-bold leading-snug drop-shadow">{{ suggestions[0].title || suggestions[0].text }}</span>
                </button>

                <!-- grid of the rest -->
                <div :key="'grid'" class="grid grid-cols-2 gap-3">
                  <button
                    v-for="s in suggestions.slice(1)"
                    :key="s.text"
                    @click="pickSuggestion(s.text)"
                    class="group relative block aspect-[4/5] rounded-2xl overflow-hidden text-left active:scale-[.98] transition-transform shadow-sm"
                    :class="`bg-gradient-to-br ${s.grad}`"
                  >
                    <img v-if="cardImg(s)" :src="cardImg(s)" @error="onCardImgError(s)" referrerpolicy="no-referrer" class="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105" />
                    <span v-else class="absolute inset-0 grid place-items-center text-[60px] opacity-90 select-none transition-transform group-hover:scale-105">{{ s.emoji }}</span>
                    <span class="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/65 to-transparent pointer-events-none"></span>
                    <span class="absolute left-3 bottom-2.5 right-3 text-white text-[15px] font-bold leading-snug drop-shadow">{{ s.title || s.text }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          </Transition>

          <!-- composer pinned at the bottom -->
          <div class="px-3 md:px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-gray-50 border-t border-gray-100">
            <div class="max-w-2xl mx-auto">
              <AssistantComposer ref="composerRef" v-model:text="input" :mic-recording="micRecording" :mic-transcribing="micTranscribing" :mic-levels="micLevels" :mic-error="micError" :busy="isBusy" placeholder="Compra lo que sea de USA…" @send="onComposerSend" @mic="toggleMic" />
            </div>
          </div>
        </div>
      </Transition>

      <!-- ===== CHAT STATE ===== -->
      <template v-if="!loadingChat && (chat.messages.length || activeId)">
        <div ref="scroller" @scroll.passive="onScroll" class="flex-1 overflow-y-auto overscroll-contain px-3 md:px-4 py-5 scroll-smooth">
          <div v-if="loadingOlder" class="flex justify-center pb-3">
            <svg class="w-5 h-5 animate-spin text-gray-300" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
          </div>
          <TransitionGroup tag="div" name="msg" class="max-w-2xl mx-auto space-y-4">
            <div v-for="m in chat.messages" :key="m.id" :class="m.role === 'user' ? 'flex justify-end' : 'flex justify-start'">
              <div :class="m.role === 'user' ? 'bg-primary-500 text-white rounded-3xl rounded-br-lg px-4 py-2.5 max-w-[85%] shadow-sm' : 'w-full max-w-[95%] space-y-3'">
                <!-- USER: their text + any uploaded image -->
                <template v-if="m.role === 'user'">
                  <div v-if="msgText(m)" class="whitespace-pre-wrap text-[15px] leading-relaxed">{{ msgText(m) }}</div>
                  <template v-for="(part, i) in m.parts" :key="'uf' + i">
                    <img v-if="part.type === 'file' && String(part.mediaType).startsWith('image/')" :src="part.url" class="rounded-2xl max-h-56 w-auto border border-gray-200 shadow-sm ml-auto" />
                  </template>
                </template>

                <!-- ASSISTANT: ALL text merged into ONE bubble, then the inline widgets. -->
                <template v-else>
                  <div v-if="msgText(m)" class="bg-white border border-gray-100 rounded-3xl rounded-bl-lg px-4 py-3 shadow-sm text-[15px]"><MarkdownText :text="msgText(m)" /></div>

                  <template v-for="(part, i) in m.parts" :key="i">
                    <ProductGallery v-if="isGalleryTool(part) && part.state === 'output-available' && part.output?.products?.length" :products="part.output.products" @open="openProduct" @order="onPickProduct" @ask="onAskProduct" />
                    <!-- Search/browse finished but found nothing — clean message, not an empty
                         carousel. Suppress it if ANOTHER search in this turn did find options. -->
                    <div v-else-if="isGalleryTool(part) && part.state === 'output-available' && !hasProducts(m)" class="text-[13px] text-gray-500 bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm">No encontré opciones para eso ahora. ¿Probamos con otra marca o término?</div>

                    <ShipmentCard v-else-if="part.type === 'tool-show_shipment' && part.state === 'output-available'" :shipment="part.output" @order="onFinalizeShipment" @add="onAddMore" />

                    <BoxGuide v-else-if="part.type === 'tool-show_box_guide' && part.state === 'output-available'" :boxes="part.output?.boxes || []" />

                    <div v-else-if="part.type === 'tool-search_products' && part.state !== 'output-available'" class="flex items-center gap-2 text-xs text-gray-400 pl-1">
                      <svg class="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
                      Buscando en todo el mercado…
                    </div>

                    <div v-else-if="(part.type === 'tool-browse_store' || part.type === 'tool-browse_stores') && part.state !== 'output-available'" class="flex items-center gap-2 text-xs text-gray-400 pl-1">
                      <svg class="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
                      Revisando tiendas…
                    </div>

                    <div v-else-if="part.type === 'tool-web_search' && part.state !== 'output-available'" class="flex items-center gap-2 text-xs text-gray-400 pl-1">
                      <svg class="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
                      Buscando información…
                    </div>

                    <div v-else-if="part.type === 'tool-create_purchase_request' && part.state === 'output-available' && part.output?.request_number" class="bg-green-50 border border-green-200 rounded-2xl p-4 max-w-sm">
                      <p class="text-sm font-bold text-green-800 flex items-center gap-1.5"><svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 011.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z" clip-rule="evenodd"/></svg> Listo — nosotros nos encargamos 🎉</p>
                      <p class="text-xs text-green-700 mt-1">Solicitud <span class="font-semibold">{{ part.output.request_number }}</span> creada. Te enviamos la cotización (producto + servicio + envío) para que la apruebes — no pagas nada todavía.</p>
                      <NuxtLink to="/app/purchase-requests" class="inline-block mt-2 text-xs font-semibold text-green-800 underline active:scale-95 transition-transform">Ver mis solicitudes →</NuxtLink>
                    </div>
                  </template>
                </template>
              </div>
            </div>
          </TransitionGroup>

          <div v-if="showTyping" class="max-w-2xl mx-auto mt-4 flex justify-start">
            <div class="bg-white border border-gray-100 rounded-3xl rounded-bl-lg px-4 py-3.5 shadow-sm">
              <span class="typing"><i></i><i></i><i></i></span>
            </div>
          </div>

          <Transition name="pop">
            <div v-if="pendingAccount" class="max-w-sm mx-auto mt-5 bg-white border border-primary-200 rounded-2xl p-4 shadow-lg ring-1 ring-primary-100">
              <p class="text-sm font-bold text-gray-900 mb-0.5">Crea tu cuenta para enviar tu pedido</p>
              <p class="text-xs text-gray-500 mb-3">Te conectamos automáticamente. Nada más sale de aquí.</p>
              <div class="space-y-2">
                <input v-model="acct.name" placeholder="Nombre completo" class="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-primary-500" />
                <input v-model="acct.email" type="email" inputmode="email" placeholder="Correo electrónico" class="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-primary-500" />
                <input v-model="acct.phone" type="tel" inputmode="tel" placeholder="Teléfono (+52...)" class="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <p v-if="acctError" class="text-xs text-red-600 mt-2">{{ acctError }}</p>
              <button @click="submitAccount" :disabled="acctLoading" class="mt-3 w-full px-4 py-2.5 bg-primary-500 hover:bg-primary-600 active:scale-[.98] disabled:bg-gray-300 text-white text-sm font-bold rounded-xl transition-all">
                {{ acctLoading ? 'Creando…' : 'Crear cuenta y continuar' }}
              </button>
            </div>
          </Transition>
        </div>

        <div class="bg-gradient-to-t from-gray-50 via-gray-50 to-transparent px-3 md:px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div class="max-w-2xl mx-auto">
            <AssistantComposer v-model:text="input" :mic-recording="micRecording" :mic-transcribing="micTranscribing" :mic-levels="micLevels" :mic-error="micError" :busy="isBusy" placeholder="Escribe o pega un link…" @send="onComposerSend" @mic="toggleMic" />
          </div>
        </div>
      </template>
    </main>

    <!-- Full-screen product detail modal -->
    <ProductModal :product="selectedProduct" @close="selectedProduct = null" @pick="onModalPick" />

    <!-- Shopping-profile (assistant memory): bottom sheet on mobile, centered
         dialog on desktop. Teleported to <body> so it's never clipped by the
         chat container's overflow/stacking context. -->
    <Teleport to="body">
      <Transition name="backdrop">
        <div v-if="showMemory" class="fixed inset-0 z-[100] flex items-end md:items-center justify-center" role="dialog" aria-modal="true">
          <div class="absolute inset-0 bg-black/50 md:backdrop-blur-sm" @click="closeMemory"></div>
          <Transition name="sheet" appear>
            <div v-if="showMemory" class="relative w-full md:w-auto md:max-w-lg md:mx-4 flex flex-col max-h-[92vh] md:max-h-[85vh]">
              <button @click="closeMemory" class="absolute -top-12 right-4 md:-top-3.5 md:-right-3.5 z-10 w-10 h-10 grid place-items-center rounded-full bg-white shadow-lg ring-1 ring-black/5 text-gray-600 hover:text-gray-900 active:scale-90 transition" aria-label="Cerrar">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
              <div class="overflow-y-auto bg-white rounded-t-3xl md:rounded-3xl shadow-2xl pb-[max(1rem,env(safe-area-inset-bottom))] md:pb-0 md:w-[32rem] max-w-full">
                <!-- grab handle (mobile only) -->
                <div class="md:hidden pt-3 pb-1 flex justify-center"><span class="w-10 h-1.5 rounded-full bg-gray-300"></span></div>
                <ShoppingProfileCard bare />
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { Chat } from '@ai-sdk/vue'
import { DefaultChatTransport } from 'ai'

// Auto-continue ONLY for the client-side create_account tool once it has a
// result. Server tools (search_products/browse_store/…) are fully resolved
// server-side; auto-sending after them re-runs the model and duplicates the
// reply (the "message sent twice" bug).
function continueAfterAccount({ messages }) {
  const last = messages?.[messages.length - 1]
  if (!last || last.role !== 'assistant') return false
  const acct = (last.parts || []).find((p) => p.type === 'tool-create_account')
  return !!acct && acct.state === 'output-available'
}

const props = defineProps({
  // When true (in-app page), go full-screen on mobile since the site navbar is
  // hidden there — the chat's own header is the single top bar.
  fullscreenMobile: { type: Boolean, default: false },
})
const { fullscreenMobile } = toRefs(props)

const { $customFetch } = useNuxtApp()
const user = useState('user')

// Reflect the active conversation in the URL as a QUERY param (?c=<id>) — NOT a
// path segment. A path change (/app/search → /app/search/<id>) remounts the page
// (which wiped the live chat mid-stream — the long bug). A query change does NOT
// remount. So refresh/deep-link loads the chat FROM THE SERVER, and sending never
// remounts.
const route = useRoute()
const router = useRouter()
function syncUrl(id) {
  const want = id != null ? String(id) : null
  // Treat an existing path id (old /app/search/<id> links) as already-reflected.
  const have = route.query.c != null ? String(route.query.c)
    : (route.params.id != null ? String(route.params.id) : null)
  if (want === have) return
  router.replace({ query: want ? { ...route.query, c: want } : (() => { const q = { ...route.query }; delete q.c; return q })() })
}

const token = ref(null)
const shoppingProfile = ref(null)
const conversations = ref([])
const activeId = ref(null)
const savedCount = ref(0)
const input = ref('')
const scroller = ref(null)
const drawerOpen = ref(false)
// Start in the loading state when the URL already points at a conversation, so a
// deep-link/refresh shows ONE loader from the first paint (no flash of the empty
// "new chat" screen before openChat kicks in).
const loadingChat = ref(!!(route.query.c || route.params.id))
const selectedProduct = ref(null)
const showMemory = ref(false)
// Reload the profile on close so edits made in the modal immediately flow into
// the assistant's personalization (system prompt + starter suggestions).
function closeMemory() { showMemory.value = false; loadProfile() }
let openSeq = 0
// In-memory cache of opened conversations (id -> { messages, oldestId, hasMore,
// products }) for instant re-open. Pagination state for the ACTIVE thread:
const msgCache = new Map()

// Single source of truth: every product shown in the active chat (deduped),
// so the assistant can re-display earlier items even after pagination.
const savedProducts = ref([])
// FNV-1a 32-bit → base36. MUST match ConversationController::productId (PHP).
function pid(raw) {
  const s = raw.url || raw.product_url || ((raw.title || '') + (raw.store || ''))
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0 }
  return 'p' + h.toString(36)
}
function registerProducts(list) {
  if (!Array.isArray(list) || !list.length) return
  const byId = new Map(savedProducts.value.map((p) => [p.id, p]))
  for (const raw of list) {
    const url = raw.url || raw.product_url || null
    const title = raw.title || raw.name || null
    if (!title && !url) continue
    const id = raw.id || pid({ url, title, store: raw.store })
    let img = raw.image || raw.image_url || null
    if (typeof img === 'string' && img.startsWith('data:')) img = null
    const prev = byId.get(id) || {}
    byId.set(id, {
      id, title, url,
      store: raw.store ?? prev.store ?? null,
      price: raw.price ?? raw.price_usd ?? prev.price ?? null,
      was: raw.was ?? prev.was ?? null,
      on_sale: raw.on_sale ?? raw.onSale ?? prev.on_sale ?? false,
      image: img || prev.image || null,
      snippet: raw.snippet ?? prev.snippet ?? null,
      token: raw.token ?? prev.token ?? null,
    })
  }
  savedProducts.value = [...byId.values()].slice(-80)
}
function registerFromMessages() {
  for (const m of chat.messages) {
    if (m.role !== 'assistant') continue
    for (const part of (m.parts || [])) {
      if (Array.isArray(part?.output?.products)) registerProducts(part.output.products)
    }
  }
}
const oldestLoadedId = ref(null)
const hasMoreOlder = ref(false)
const loadingOlder = ref(false)

const PAGE = 30
function mapMsg(m) {
  return {
    id: String(m.id),
    role: m.role,
    parts: (m.content && m.content.parts) || [{ type: 'text', text: typeof m.content === 'string' ? m.content : (m.content?.text || '') }],
  }
}

const { recording: micRecording, transcribing: micTranscribing, levels: micLevels, error: micError, toggle: micToggle } = useVoiceInput()

const retitled = ref(false)
const pendingAccount = ref(null)
const acct = reactive({ name: '', email: '', phone: '' })
const acctLoading = ref(false)
const acctError = ref('')

// ChatGPT-style picture cards. `grad` is the card background; `img` (optional) is a
// real product photo that overrides the gradient when set (graceful fallback to the
// gradient + emoji if the image is missing/fails).
// `imgq` is the query used to fetch a representative product photo for the card.
const DEFAULT_SUGGESTIONS = [
  { emoji: '👟', text: 'Tenis Nike para correr', grad: 'from-slate-600 to-slate-900', imgq: 'Nike running shoes women' },
  { emoji: '🥤', text: 'Stanley Cups', grad: 'from-teal-500 to-cyan-800', imgq: 'Stanley cup tumbler' },
  { emoji: '🧴', text: 'Skincare de Sephora', grad: 'from-rose-400 to-pink-700', imgq: 'Sephora skincare set' },
  { emoji: '👜', text: 'Bolsas Coach', grad: 'from-amber-500 to-orange-800', imgq: 'Coach handbag' },
  { emoji: '🎴', text: 'Cartas Pokémon', grad: 'from-indigo-500 to-violet-800', imgq: 'Pokemon trading cards' },
  { emoji: '📦', text: '¿Cómo funciona Boxly?', grad: 'from-primary-500 to-blue-800', imgq: '' },
]
const GRAD_PALETTE = ['from-fuchsia-500 to-purple-800', 'from-emerald-500 to-teal-800', 'from-sky-500 to-indigo-800', 'from-orange-500 to-rose-800']
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)

// Admin-managed starter cards loaded from the backend (falls back to the
// hardcoded defaults above if the fetch fails or returns nothing). `img` is an
// uploaded image that wins over the `imgq` product-photo lookup.
const serverPrompts = ref(null)
async function loadStarterPrompts() {
  try {
    const rows = (await $customFetch('/starter-prompts'))?.data
    if (Array.isArray(rows) && rows.length) {
      serverPrompts.value = rows.map((r, i) => ({
        emoji: r.emoji || '🛍️',
        text: r.prompt_text,
        title: r.title,
        grad: GRAD_PALETTE[i % GRAD_PALETTE.length],
        imgq: r.image_query || '',
        img: r.image_url || null,
      }))
    }
  } catch { /* keep hardcoded defaults */ }
}
const baseSuggestions = computed(() => serverPrompts.value || DEFAULT_SUGGESTIONS)
// Personalize the starter cards from the shopper's long-term memory (favorite
// brands + interests), then top up with the defaults. Empty memory → defaults.
const suggestions = computed(() => {
  const p = shoppingProfile.value || {}
  const out = []
  let gi = 0
  for (const b of (Array.isArray(p.favorite_brands) ? p.favorite_brands : []).slice(0, 2)) {
    if (b) out.push({ emoji: '🔥', text: `Ofertas en ${b}`, grad: GRAD_PALETTE[gi++ % GRAD_PALETTE.length], imgq: b })
  }
  const cats = [...(Array.isArray(p.interests) ? p.interests : []), ...(Array.isArray(p.categories) ? p.categories : [])]
  for (const c of cats.slice(0, 2)) {
    if (c) out.push({ emoji: '🛍️', text: `${cap(c)} en oferta`, grad: GRAD_PALETTE[gi++ % GRAD_PALETTE.length], imgq: c })
  }
  const seen = new Set()
  return [...out, ...baseSuggestions.value]
    .filter((s) => { const k = s.text.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true })
    .slice(0, 5)
})

// --- Card images: resolve a representative product photo per card, cached in
//     localStorage so each query is fetched at most once per browser. ---
const cardImages = ref({})  // imgq -> url ('' = fetched, none found)
const fetchingImg = new Set()
const CARD_IMG_KEY = 'boxly_card_images'
function loadCardImageCache() {
  try { const raw = localStorage.getItem(CARD_IMG_KEY); if (raw) cardImages.value = JSON.parse(raw) || {} } catch { /* ignore */ }
}
// Persist ONLY successful URLs — failures/'' stay in-memory for the session so a
// transient miss or a dead image URL refetches on the next load.
function saveCardImageCache() {
  try {
    const ok = Object.fromEntries(Object.entries(cardImages.value).filter(([, v]) => v))
    localStorage.setItem(CARD_IMG_KEY, JSON.stringify(ok))
  } catch { /* ignore */ }
}
function cardImg(s) { return s?.img || cardImages.value[s?.imgq] || null }
function onCardImgError(s) { if (s?.imgq) { cardImages.value = { ...cardImages.value, [s.imgq]: '' }; saveCardImageCache() } }

// The starter cards stay hidden behind a single centered loader until ALL their
// images are resolved AND decoded — so the whole grid paints at once instead of
// flashing emoji placeholders and popping images in one by one.
const cardsReady = ref(false)
// Resolve once the browser has actually fetched+decoded each URL (or failed).
function preloadImages(urls) {
  return Promise.all((urls || []).map((u) => new Promise((resolve) => {
    const img = new Image()
    img.referrerPolicy = 'no-referrer'
    img.onload = img.onerror = () => resolve()
    img.src = u
  })))
}
// Full first-paint pipeline: load admin cards → resolve a photo per card →
// preload them → reveal everything together.
async function prepareStarterCards() {
  await loadStarterPrompts()
  await ensureCardImages(suggestions.value)
  await preloadImages(suggestions.value.map(cardImg).filter(Boolean))
  cardsReady.value = true
}
async function ensureCardImages(list) {
  for (const s of list || []) {
    const q = s?.imgq
    if (!q || cardImages.value[q] !== undefined || fetchingImg.has(q)) continue
    fetchingImg.add(q)
    try {
      const r = await $fetch('/api/card-image', { params: { q } })
      cardImages.value = { ...cardImages.value, [q]: r?.image || '' }
      saveCardImageCache()
    } catch {
      cardImages.value = { ...cardImages.value, [q]: '' }
    } finally {
      fetchingImg.delete(q)
    }
  }
}

const isBusy = computed(() => chat.status === 'streaming' || chat.status === 'submitted')
const GALLERY_TOOLS = ['tool-show_products', 'tool-browse_store', 'tool-browse_stores', 'tool-search_products', 'tool-show_saved_products']
function isGalleryTool(part) { return GALLERY_TOOLS.includes(part?.type) }
// Merge ALL text parts of a message into one string so a multi-step reply renders
// in ONE bubble instead of fragmenting into many (the "split bubbles" bug).
function msgText(m) { return (m.parts || []).filter((p) => p.type === 'text' && p.text).map((p) => p.text).join('\n\n') }
// Did ANY gallery tool in this message return products? Used to suppress a stray
// "no results" message when another search in the same turn did find options.
function hasProducts(m) { return (m.parts || []).some((p) => isGalleryTool(p) && p.state === 'output-available' && p.output?.products?.length) }
// Show the typing dots ONLY while the assistant turn has nothing visible yet — once
// any text or tool widget/spinner appears, that's the indicator (no double bubble).
const showTyping = computed(() => {
  if (chat.status !== 'submitted' && chat.status !== 'streaming') return false
  const last = chat.messages[chat.messages.length - 1]
  if (last?.role !== 'assistant') return true // user just sent; assistant forming
  return !(last.parts || []).some((p) => (p.type === 'text' && p.text) || String(p.type).startsWith('tool-'))
})
const activeTitle = computed(() => conversations.value.find((c) => c.id === activeId.value)?.title || 'Asistente')

const chat = new Chat({
  transport: new DefaultChatTransport({
    api: '/api/assistant',
    prepareSendMessagesRequest({ messages }) {
      return { body: { messages, token: token.value, shoppingProfile: shoppingProfile.value, savedProducts: savedProducts.value } }
    },
  }),
  sendAutomaticallyWhen: continueAfterAccount,
  onToolCall({ toolCall }) {
    if (toolCall.toolName === 'create_account') {
      const inp = toolCall.input || {}
      acct.name = inp.name || acct.name
      acct.email = inp.email || acct.email
      acct.phone = inp.phone || acct.phone
      pendingAccount.value = { toolCallId: toolCall.toolCallId }
    }
  },
})

// Init on the client once the user is known. Load history + profile in PARALLEL
// so the sidebar shows fast; the chat token is only needed to SEND (authed
// tools), so it's minted in the background, off the load path.
let inited = false
onMounted(() => {
  watch(user, (u) => { if (u && !inited) initLoggedIn() }, { immediate: true })
  // Reflect the active chat in the URL as ?c=<id> (query, no remount).
  watch(activeId, (id) => syncUrl(id))
  // Resolve a real product photo for each starter card (cached in localStorage).
  loadCardImageCache()
  // Prepare ALL starter cards + images, then reveal them at once (centered loader
  // until ready — no emoji-then-image pop-in). Never block longer than 6s on the
  // image prefetch in case a lookup is slow/unreachable.
  prepareStarterCards()
  setTimeout(() => { cardsReady.value = true }, 6000)
  // After the first reveal, keep filling images if the personalized set changes.
  watch(suggestions, (list) => { if (cardsReady.value) ensureCardImages(list) })
})

async function initLoggedIn() {
  if (inited) return
  inited = true
  await Promise.all([loadConversations(), loadProfile()])
  ensureChatToken()
  // Refresh / deep-link: load the conversation named in the URL FROM THE SERVER.
  // Accept ?c=<id> (new) or an old /app/search/<id> path id.
  const cid = route.query.c || route.params.id
  if (cid) openChat(cid)
}

async function loadProfile() {
  try { shoppingProfile.value = (await $customFetch('/me/shopping-profile')).data } catch {}
}

// Mint the chat token once (background). Distinct from the MCP token so it never
// clobbers the user's Claude Desktop connection.
let tokenPromise = null
function ensureChatToken() {
  // Guests have no session — minting a chat token would 401 and the global
  // $fetch plugin would bounce them to /login. They don't need a token until
  // they create an account (submitAccount sets it directly). So skip for guests.
  if (!user.value || token.value) return
  if (!tokenPromise) {
    tokenPromise = $customFetch('/me/chat-token', { method: 'POST' })
      .then((r) => { token.value = r.token })
      .catch((e) => { console.error('chat token failed', e); tokenPromise = null })
  }
  return tokenPromise
}

// Create the thread the instant the user sends their first message (like
// ChatGPT) — it shows in the sidebar immediately, before the AI even responds.
// SINGLE, GUARDED creator: a send and the background persist() can both ask for a
// conversation at once; without this guard they each POST one, producing a
// duplicate sidebar entry whose id ≠ the chat we're viewing (the "empty chat on
// the side" bug). Concurrent callers share one in-flight promise; once activeId is
// set, later calls are no-ops.
let convPromise = null
function ensureConversation(firstText) {
  if (!user.value) return Promise.resolve(null)
  if (activeId.value) return Promise.resolve(activeId.value)
  if (convPromise) return convPromise
  const title = (firstText || '').replace(/\s+/g, ' ').trim().slice(0, 60) || 'Nuevo chat'
  convPromise = $customFetch('/conversations', { method: 'POST', body: { title } })
    .then((r) => {
      const c = r.data
      activeId.value = c.id
      conversations.value = [c, ...conversations.value.filter((x) => x.id !== c.id)]
      return c.id
    })
    .catch((e) => { console.error('create conversation failed', e); return null })
    .finally(() => { convPromise = null })
  return convPromise
}

async function loadConversations() {
  try { conversations.value = (await $customFetch('/conversations')).data } catch {}
}

function onComposerSend({ files } = {}) {
  const text = input.value.trim()
  if (isBusy.value) return
  if (!text && !(files && files.length)) return
  input.value = ''
  ensureChatToken()
  ensureConversation(text)
  chat.sendMessage({ text: text || undefined, files: files || undefined })
  scrollDown()
}
// Tapping a suggestion card sends the prompt right away (no edit step).
const composerRef = ref(null)
function pickSuggestion(text) {
  if (isBusy.value || !text) return
  input.value = ''
  ensureChatToken()
  ensureConversation(text)
  chat.sendMessage({ text })
  scrollDown()
}

// When the user taps "Pedir con Boxly"/"Agregar al pedido" while the assistant
// is still streaming its follow-up text (common on desktop — mouse clicks land
// faster than the stream finishes), we can't send mid-stream. Queue it and flush
// the instant the chat is ready, so the button never silently does nothing.
const pendingPick = ref(null)
function onPickProduct(p) {
  ensureChatToken()
  if (isBusy.value) { pendingPick.value = p; return }
  const store = p.store ? ` de ${p.store}` : ''
  // State the EXACT price the customer saw — the sale price if on sale — so the
  // AI records that price (not a re-extracted regular price).
  const onSale = p.onSale && p.was
  const price = p.price ? ` — precio $${p.price} USD${onSale ? ` (EN OFERTA, antes $${p.was})` : ''}` : ''
  // Google Shopping links aren't buyable URLs — omit so the AI resolves the real
  // product page; include real merchant URLs directly.
  const isGoogle = (p.url || '').includes('google.com/search')
  const urlPart = p.url && !isGoogle ? ` — ${p.url}` : ''
  // If the customer picked a variant in the modal, pass it through so the AI adds
  // it DIRECTLY (size/color/quantity already chosen — don't re-ask).
  const opts = p.selectedOptions && Object.keys(p.selectedOptions).length
    ? ' — ' + Object.entries(p.selectedOptions).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(', ')
    : ''
  const qtyN = Number(p.quantity) > 0 ? Number(p.quantity) : 1
  const qtyPart = ` — cantidad ${qtyN}`
  const ready = opts ? ' (ya elegí estas opciones, agrégalo directo sin volver a preguntar)' : ''
  const text = `Agrégalo a mi envío: ${p.title}${store}${opts}${qtyPart}${price}${urlPart}${ready}`
  ensureConversation(text)
  chat.sendMessage({ text })
  scrollDown()
}

// "Preguntar 💬" on a card — keep the conversation alive by asking the assistant
// about that specific product (it can see it in the chat's product registry).
function onAskProduct(p) {
  if (isBusy.value) return
  const store = p.store ? ` de ${p.store}` : ''
  const text = `Cuéntame más sobre esta opción: ${p.title}${store}`
  ensureConversation(text)
  chat.sendMessage({ text })
  scrollDown()
}

// Shipment card actions — finalize the consolidated order, or keep adding.
function onFinalizeShipment() {
  if (isBusy.value) return
  ensureChatToken()
  const text = 'Pedir mi envío'
  ensureConversation(text)
  chat.sendMessage({ text })
  scrollDown()
}
function onAddMore() {
  if (isBusy.value) return
  const text = 'Quiero agregar algo más a mi envío'
  ensureConversation(text)
  chat.sendMessage({ text })
  scrollDown()
}

function openProduct(p) { selectedProduct.value = p }
function onModalPick(p) { selectedProduct.value = null; onPickProduct(p) }

async function toggleMic() {
  const text = await micToggle()
  if (text) input.value = (input.value ? input.value.trim() + ' ' : '') + text
}

async function submitAccount() {
  acctError.value = ''
  if (!acct.name || !acct.email || !acct.phone) { acctError.value = 'Completa todos los campos.'; return }
  acctLoading.value = true
  try {
    const res = await $customFetch('/auth/chat-register', { method: 'POST', body: { name: acct.name, email: acct.email, phone: acct.phone } })
    token.value = res.token
    user.value = res.user
    try {
      const msgs = chat.messages.map((m) => ({ role: m.role, content: { parts: cleanParts(m.parts) } }))
      const c = await $customFetch('/conversations/claim', { method: 'POST', body: { messages: msgs } })
      activeId.value = c.data.id
      savedCount.value = chat.messages.length
      await loadConversations()
    } catch {}
    const toolCallId = pendingAccount.value.toolCallId
    pendingAccount.value = null
    await chat.addToolResult({ tool: 'create_account', toolCallId, output: { success: true, user: res.user } })
  } catch (e) {
    acctError.value = e?.data?.message || 'No se pudo crear la cuenta. ¿Ya tienes una? Inicia sesión.'
  } finally {
    acctLoading.value = false
  }
}

watch(() => chat.status, async (s) => {
  scrollDown()
  registerFromMessages() // keep the product registry current with what's shown
  // Flush a product pick that was queued while the assistant was streaming.
  if ((s === 'ready' || s === 'error') && pendingPick.value) {
    const p = pendingPick.value
    pendingPick.value = null
    onPickProduct(p)
    return
  }
  if (s === 'ready' && user.value && chat.messages.length > savedCount.value) {
    await persist()
    maybeRetitle()
  }
})

// ChatGPT-style: after the first reply, ask a fast model for a concise title
// based on what the user actually wants, then rename the thread. Best-effort.
async function maybeRetitle() {
  if (retitled.value || !activeId.value) return
  const firstText = (m) => (m?.parts || []).filter((p) => p.type === 'text').map((p) => p.text).join(' ').trim()
  const userText = firstText(chat.messages.find((m) => m.role === 'user'))
  const assistantText = firstText(chat.messages.find((m) => m.role === 'assistant'))
  if (!userText || !assistantText) return
  retitled.value = true
  try {
    const { title } = await $fetch('/api/title', { method: 'POST', body: { user: userText, assistant: assistantText } })
    if (!title) return
    await $customFetch(`/conversations/${activeId.value}`, { method: 'PATCH', body: { title } })
    const c = conversations.value.find((x) => x.id === activeId.value)
    if (c) c.title = title
  } catch (e) { console.error('retitle failed', e) }
}

async function persist() {
  try {
    const delta = chat.messages.slice(savedCount.value).map((m) => ({ role: m.role, content: { parts: cleanParts(m.parts) } }))
    if (!delta.length) return
    // Go through the SAME guarded creator (don't POST a second conversation here).
    if (!activeId.value) {
      const firstUser = chat.messages.find((m) => m.role === 'user')
      const title = (firstUser?.parts || []).filter((p) => p.type === 'text').map((p) => p.text).join(' ').trim()
      await ensureConversation(title)
    }
    if (!activeId.value) return // creation failed (e.g. guest) — don't post to a null id
    await $customFetch(`/conversations/${activeId.value}/messages`, { method: 'POST', body: { messages: delta } })
    savedCount.value = chat.messages.length
    // Keep state local — no full list refetch every turn. Cache the thread and
    // bump it to the top of the sidebar.
    msgCache.set(activeId.value, { messages: chat.messages, oldestId: oldestLoadedId.value, hasMore: hasMoreOlder.value, products: savedProducts.value })
    bumpActiveToTop()
  } catch (e) { console.error('persist failed', e) }
}

function bumpActiveToTop() {
  const list = conversations.value
  const i = list.findIndex((c) => c.id === activeId.value)
  if (i > 0) conversations.value = [list[i], ...list.slice(0, i), ...list.slice(i + 1)]
}

function newChat() {
  openSeq++ // invalidate any in-flight openChat
  loadingChat.value = false
  chat.messages = []
  activeId.value = null
  savedCount.value = 0
  retitled.value = false
  oldestLoadedId.value = null
  hasMoreOlder.value = false
  savedProducts.value = []
  drawerOpen.value = false
}

async function openChat(id) {
  // Normalize to a number so activeId is always the same type as the API's
  // conversation ids (the sidebar highlight + all `=== activeId` checks rely on
  // it). Route params arrive as strings, sidebar clicks as numbers.
  id = Number(id)
  // Highlight + close drawer instantly; serve from cache if we have it.
  activeId.value = id
  retitled.value = true
  drawerOpen.value = false
  const cached = msgCache.get(id)
  if (cached) {
    loadingChat.value = false
    chat.messages = cached.messages
    oldestLoadedId.value = cached.oldestId
    hasMoreOlder.value = cached.hasMore
    savedProducts.value = cached.products || []
    savedCount.value = chat.messages.length
    scrollDown()
    return
  }
  // Show the loading skeleton; clear the previous chat so we don't show stale
  // content. openSeq guards against spam-tapping multiple chats (latest wins).
  const seq = ++openSeq
  loadingChat.value = true
  chat.messages = []
  savedProducts.value = []
  try {
    const r = await $customFetch(`/conversations/${id}?limit=${PAGE}`)
    if (seq !== openSeq) return // a newer open won
    const msgs = r.data.messages.map(mapMsg)
    chat.messages = msgs
    oldestLoadedId.value = msgs.length ? msgs[0].id : null
    hasMoreOlder.value = !!r.data.has_more
    savedProducts.value = r.data.products || [] // full registry, derived from all history
    savedCount.value = msgs.length
    msgCache.set(id, { messages: msgs, oldestId: oldestLoadedId.value, hasMore: hasMoreOlder.value, products: savedProducts.value })
    scrollDown()
  } catch (e) {
    console.error(e)
    // Bad/forbidden id (e.g. a stale or pasted link) — fall back to the
    // new-chat view so the user isn't stranded on a broken URL.
    if (seq === openSeq && activeId.value === id) { activeId.value = null }
  } finally {
    if (seq === openSeq) loadingChat.value = false
  }
}

// Load the previous page of messages when the user scrolls near the top, keeping
// the scroll position pinned so the view doesn't jump.
async function loadOlder() {
  if (loadingOlder.value || !hasMoreOlder.value || !activeId.value || !oldestLoadedId.value) return
  loadingOlder.value = true
  const el = scroller.value
  const prevHeight = el ? el.scrollHeight : 0
  try {
    const r = await $customFetch(`/conversations/${activeId.value}?limit=${PAGE}&before=${oldestLoadedId.value}`)
    const older = (r.data.messages || []).map(mapMsg)
    if (older.length) {
      chat.messages = [...older, ...chat.messages]
      savedCount.value += older.length // prepended messages are already saved
      oldestLoadedId.value = older[0].id
      hasMoreOlder.value = !!r.data.has_more
      msgCache.set(activeId.value, { messages: chat.messages, oldestId: oldestLoadedId.value, hasMore: hasMoreOlder.value, products: savedProducts.value })
      nextTick(() => {
        if (!el) return
        const prev = el.style.scrollBehavior
        el.style.scrollBehavior = 'auto'
        el.scrollTop = el.scrollHeight - prevHeight
        el.style.scrollBehavior = prev
      })
    } else {
      hasMoreOlder.value = false
    }
  } catch (e) { console.error(e) } finally { loadingOlder.value = false }
}

function onScroll() {
  if (scroller.value && scroller.value.scrollTop < 120 && hasMoreOlder.value && !loadingOlder.value) loadOlder()
}

async function deleteConversation(id) {
  // Optimistic: drop it from the sidebar + cache immediately, then sync.
  conversations.value = conversations.value.filter((c) => c.id !== id)
  msgCache.delete(id)
  if (activeId.value === id) newChat()
  try { await $customFetch(`/conversations/${id}`, { method: 'DELETE' }) }
  catch (e) { console.error(e); loadConversations() }
}

// Don't persist base64 image data-URLs to the DB — replace file parts with a
// lightweight marker (the product was already identified in the conversation).
function cleanParts(parts) {
  return (parts || [])
    // Drop tool calls that never produced output — a dangling tool_use breaks
    // the next request to the model when this history is replayed.
    .filter((p) => !(typeof p?.type === 'string' && p.type.startsWith('tool-') && p.state !== 'output-available' && p.state !== 'output-error'))
    .map((p) => {
      if (p?.type === 'file') return { type: 'text', text: '📎 (imagen)' }
      // Strip heavy base64 thumbnails (Google Shopping) from persisted tool
      // outputs so history rows stay small; the live gallery already rendered.
      const prods = p?.output?.products
      if (Array.isArray(prods)) {
        return {
          ...p,
          output: {
            ...p.output,
            products: prods.map((x) => (typeof x?.image === 'string' && x.image.startsWith('data:')) ? { ...x, image: null } : x),
          },
        }
      }
      return p
    })
}

function scrollDown() {
  nextTick(() => { if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight })
}
</script>

<style scoped>
.msg-enter-from { opacity: 0; transform: translateY(10px); }
.msg-enter-active { transition: opacity .3s ease, transform .3s cubic-bezier(.2,.8,.2,1); }
.msg-move { transition: transform .3s cubic-bezier(.2,.8,.2,1); }

.chip-enter-from { opacity: 0; transform: translateY(8px) scale(.96); }
.chip-enter-active { transition: opacity .35s ease, transform .35s cubic-bezier(.2,.8,.2,1); }

.fade-fast-enter-from, .fade-fast-leave-to { opacity: 0; }
.fade-fast-enter-active, .fade-fast-leave-active { transition: opacity .2s ease; }

.pop-enter-from { opacity: 0; transform: translateY(12px) scale(.97); }
.pop-enter-active { transition: opacity .3s ease, transform .3s cubic-bezier(.2,.8,.2,1); }

/* Memory modal: slide up from the bottom on mobile (sheet)… */
.sheet-enter-from, .sheet-leave-to { opacity: 0; transform: translateY(100%); }
.sheet-enter-active, .sheet-leave-active { transition: opacity .25s ease, transform .32s cubic-bezier(.2,.8,.2,1); }
/* …and a subtle pop when it's a centered desktop dialog. */
@media (min-width: 768px) {
  .sheet-enter-from, .sheet-leave-to { transform: translateY(10px) scale(.97); }
}
@media (prefers-reduced-motion: reduce) {
  .sheet-enter-active, .sheet-leave-active { transition: opacity .2s ease; }
  .sheet-enter-from, .sheet-leave-to { transform: none; }
}

.drawer-enter-from, .drawer-leave-to { transform: translateX(-100%); }
.drawer-enter-active, .drawer-leave-active { transition: transform .28s cubic-bezier(.2,.8,.2,1); }
.backdrop-enter-from, .backdrop-leave-to { opacity: 0; }
.backdrop-enter-active, .backdrop-leave-active { transition: opacity .25s ease; }

.typing { display: inline-flex; gap: 4px; align-items: center; }
.typing i { width: 6px; height: 6px; border-radius: 9999px; background: #9ca3af; display: inline-block; animation: typing-blink 1.3s infinite both; }
.typing i:nth-child(2) { animation-delay: .18s; }
.typing i:nth-child(3) { animation-delay: .36s; }
@keyframes typing-blink { 0%, 70%, 100% { opacity: .25; transform: translateY(0); } 35% { opacity: 1; transform: translateY(-2px); } }

@media (prefers-reduced-motion: reduce) {
  .msg-enter-active, .chip-enter-active, .fade-fast-enter-active, .pop-enter-active, .drawer-enter-active, .drawer-leave-active, .backdrop-enter-active, .backdrop-leave-active { transition: none; }
  .typing i { animation: none; }
}
</style>
