<template>
  <div class="flex h-[calc(100dvh-4rem)] bg-gray-50 overflow-hidden relative">
    <!-- ===== Mobile history drawer ===== -->
    <Transition name="backdrop">
      <div v-if="user && drawerOpen" class="md:hidden absolute inset-0 z-40 bg-black/30 backdrop-blur-sm" @click="drawerOpen = false" />
    </Transition>
    <Transition name="drawer">
      <aside v-if="user && drawerOpen" class="md:hidden absolute inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 flex flex-col shadow-2xl">
        <ConversationsList :conversations="conversations" :active-id="activeId" @new="newChat" @open="openChat" @delete="deleteConversation" />
      </aside>
    </Transition>

    <!-- ===== Desktop sidebar ===== -->
    <aside v-if="user" class="hidden md:flex md:flex-col w-72 border-r border-gray-200 bg-white">
      <ConversationsList :conversations="conversations" :active-id="activeId" @new="newChat" @open="openChat" @delete="deleteConversation" />
    </aside>

    <!-- ===== Chat area ===== -->
    <main class="flex-1 flex flex-col min-w-0">
      <!-- Mobile top bar (logged-in: history access) -->
      <header v-if="user" class="md:hidden flex items-center justify-between px-3 h-12 border-b border-gray-100 bg-white/80 backdrop-blur shrink-0">
        <button @click="drawerOpen = true" class="p-2 -ml-1 rounded-lg text-gray-600 active:scale-90 transition-transform" aria-label="Historial">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
        <span class="text-sm font-semibold text-gray-700 truncate px-2">{{ activeTitle }}</span>
        <button @click="newChat" class="p-2 -mr-1 rounded-lg text-primary-600 active:scale-90 transition-transform" aria-label="Nuevo chat">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        </button>
      </header>

      <!-- ===== EMPTY STATE — centered prompt ===== -->
      <Transition name="fade-fast">
        <div v-if="!chat.messages.length" class="flex-1 flex flex-col items-center justify-center px-5 overflow-y-auto">
          <div class="w-full max-w-2xl py-8">
            <div class="text-center mb-7">
              <h1 class="text-[26px] leading-tight md:text-4xl font-extrabold text-gray-900 tracking-tight">¿Qué quieres comprar de EE.UU.?</h1>
              <p class="text-gray-500 mt-3 text-[15px] md:text-base max-w-md mx-auto leading-relaxed">Dime qué buscas — aunque no sepas exactamente qué — y te lo encuentro y lo pido por ti hasta México.</p>
            </div>

            <AssistantComposer v-model:text="input" :mic-recording="micRecording" :mic-transcribing="micTranscribing" :busy="isBusy" placeholder="Describe lo que buscas, pega un link o suelta una foto…" @send="onComposerSend" @mic="toggleMic" />
            <p class="text-center text-xs text-gray-400 mt-2">📎 También puedes soltar o pegar una foto del producto.</p>

            <TransitionGroup tag="div" name="chip" class="flex flex-wrap gap-2 justify-center mt-4" appear>
              <button v-for="(s, i) in suggestions" :key="s" :style="{ transitionDelay: i * 55 + 'ms' }" @click="quickSend(s)" class="px-3.5 py-2 rounded-full border border-gray-200 bg-white text-[13px] md:text-sm text-gray-700 hover:border-primary-400 hover:text-primary-600 hover:shadow-sm active:scale-95 transition-all">{{ s }}</button>
            </TransitionGroup>
          </div>
        </div>
      </Transition>

      <!-- ===== CHAT STATE ===== -->
      <template v-if="chat.messages.length">
        <div ref="scroller" class="flex-1 overflow-y-auto overscroll-contain px-3 md:px-4 py-5 scroll-smooth">
          <TransitionGroup tag="div" name="msg" class="max-w-2xl mx-auto space-y-4">
            <div v-for="m in chat.messages" :key="m.id" :class="m.role === 'user' ? 'flex justify-end' : 'flex justify-start'">
              <div :class="m.role === 'user' ? 'bg-primary-500 text-white rounded-3xl rounded-br-lg px-4 py-2.5 max-w-[85%] shadow-sm' : 'w-full max-w-[95%] space-y-3'">
                <template v-for="(part, i) in m.parts" :key="i">
                  <div v-if="part.type === 'text'" :class="m.role === 'user' ? 'whitespace-pre-wrap text-[15px] leading-relaxed' : 'prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap leading-relaxed bg-white border border-gray-100 rounded-3xl rounded-bl-lg px-4 py-3 shadow-sm text-[15px]'">{{ part.text }}</div>

                  <img v-else-if="part.type === 'file' && String(part.mediaType).startsWith('image/')" :src="part.url" class="rounded-2xl max-h-56 w-auto border border-gray-200 shadow-sm" :class="m.role === 'user' ? 'ml-auto' : ''" />

                  <div v-else-if="part.type === 'tool-web_search'" class="flex items-center gap-2 text-xs text-gray-400 pl-1">
                    <svg class="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
                    Buscando en internet…
                  </div>

                  <div v-else-if="part.type === 'tool-extract_product' && part.state === 'output-available' && part.output?.success !== false" class="bg-white border border-gray-200 rounded-2xl p-3 shadow-sm flex gap-3 items-center max-w-sm hover:shadow-md transition-shadow">
                    <img v-if="part.output?.image" :src="part.output.image" class="w-16 h-16 rounded-xl object-cover bg-gray-100 shrink-0" />
                    <div class="min-w-0">
                      <p class="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">{{ part.output?.title }}</p>
                      <p class="text-xs text-gray-400 mt-0.5">{{ part.output?.store }}</p>
                      <p v-if="part.output?.price" class="text-sm font-bold text-gray-900 mt-1">${{ part.output.price }} <span class="text-xs font-medium text-gray-400">USD · ≈ ${{ Math.round(part.output.price * 18) }} MXN</span></p>
                    </div>
                  </div>

                  <div v-else-if="part.type === 'tool-create_purchase_request' && part.state === 'output-available' && part.output?.request_number" class="bg-green-50 border border-green-200 rounded-2xl p-4 max-w-sm">
                    <p class="text-sm font-bold text-green-800 flex items-center gap-1.5"><svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 011.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z" clip-rule="evenodd"/></svg> Solicitud creada: {{ part.output.request_number }}</p>
                    <p class="text-xs text-green-700 mt-1">Boxly la revisará y te enviará la cotización.</p>
                    <NuxtLink to="/app/purchase-requests" class="inline-block mt-2 text-xs font-semibold text-green-800 underline active:scale-95 transition-transform">Ver mis solicitudes →</NuxtLink>
                  </div>

                  <div v-else-if="String(part.type).startsWith('tool-') && part.state !== 'output-available'" class="text-xs text-gray-300 pl-1">…</div>
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
                <input v-model="acct.name" placeholder="Nombre completo" class="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                <input v-model="acct.email" type="email" inputmode="email" placeholder="Correo electrónico" class="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                <input v-model="acct.phone" type="tel" inputmode="tel" placeholder="Teléfono (+52...)" class="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
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
            <AssistantComposer v-model:text="input" :mic-recording="micRecording" :mic-transcribing="micTranscribing" :busy="isBusy" placeholder="Escribe, pega un link o suelta una foto…" @send="onComposerSend" @mic="toggleMic" />
          </div>
        </div>
      </template>
    </main>
  </div>
</template>

<script setup>
import { Chat } from '@ai-sdk/vue'
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from 'ai'

const { $customFetch } = useNuxtApp()
const user = useState('user')

const token = ref(null)
const shoppingProfile = ref(null)
const conversations = ref([])
const activeId = ref(null)
const savedCount = ref(0)
const input = ref('')
const scroller = ref(null)
const drawerOpen = ref(false)

const { recording: micRecording, transcribing: micTranscribing, toggle: micToggle } = useVoiceInput()

const pendingAccount = ref(null)
const acct = reactive({ name: '', email: '', phone: '' })
const acctLoading = ref(false)
const acctError = ref('')

const suggestions = [
  'Tenis para correr menos de $150',
  'Una bolsa Coach bonita',
  'Ropa de gym estilo YoungLA',
  'Pega un link de un producto',
]

const isBusy = computed(() => chat.status === 'streaming' || chat.status === 'submitted')
const showTyping = computed(() => {
  if (chat.status !== 'submitted' && chat.status !== 'streaming') return false
  const last = chat.messages[chat.messages.length - 1]
  return !(last?.role === 'assistant' && last.parts?.some((p) => p.type === 'text' && p.text))
})
const activeTitle = computed(() => conversations.value.find((c) => c.id === activeId.value)?.title || 'Asistente')

const chat = new Chat({
  transport: new DefaultChatTransport({
    api: '/api/assistant',
    prepareSendMessagesRequest({ messages }) {
      return { body: { messages, token: token.value, shoppingProfile: shoppingProfile.value } }
    },
  }),
  sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
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

onMounted(async () => { if (user.value) await initLoggedIn() })

async function initLoggedIn() {
  try {
    token.value = (await $customFetch('/me/mcp-token', { method: 'POST' })).token
    shoppingProfile.value = (await $customFetch('/me/shopping-profile')).data
    await loadConversations()
  } catch (e) { console.error('assistant init failed', e) }
}

async function loadConversations() {
  try { conversations.value = (await $customFetch('/conversations')).data } catch {}
}

function onComposerSend({ files } = {}) {
  const text = input.value.trim()
  if (isBusy.value) return
  if (!text && !(files && files.length)) return
  input.value = ''
  chat.sendMessage({ text: text || undefined, files: files || undefined })
  scrollDown()
}
function quickSend(text) { input.value = text; onComposerSend() }

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
  if (s === 'ready' && user.value && chat.messages.length > savedCount.value) await persist()
})

async function persist() {
  try {
    const delta = chat.messages.slice(savedCount.value).map((m) => ({ role: m.role, content: { parts: cleanParts(m.parts) } }))
    if (!delta.length) return
    if (!activeId.value) activeId.value = (await $customFetch('/conversations', { method: 'POST', body: {} })).data.id
    await $customFetch(`/conversations/${activeId.value}/messages`, { method: 'POST', body: { messages: delta } })
    savedCount.value = chat.messages.length
    await loadConversations()
  } catch (e) { console.error('persist failed', e) }
}

function newChat() {
  chat.messages = []
  activeId.value = null
  savedCount.value = 0
  drawerOpen.value = false
}

async function openChat(id) {
  try {
    const r = await $customFetch(`/conversations/${id}`)
    chat.messages = r.data.messages.map((m) => ({
      id: String(m.id),
      role: m.role,
      parts: (m.content && m.content.parts) || [{ type: 'text', text: typeof m.content === 'string' ? m.content : (m.content?.text || '') }],
    }))
    activeId.value = id
    savedCount.value = chat.messages.length
    drawerOpen.value = false
    scrollDown()
  } catch (e) { console.error(e) }
}

async function deleteConversation(id) {
  try {
    await $customFetch(`/conversations/${id}`, { method: 'DELETE' })
    if (activeId.value === id) newChat()
    await loadConversations()
  } catch (e) { console.error(e) }
}

// Don't persist base64 image data-URLs to the DB — replace file parts with a
// lightweight marker (the product was already identified in the conversation).
function cleanParts(parts) {
  return (parts || []).map((p) => (p?.type === 'file' ? { type: 'text', text: '📎 (imagen)' } : p))
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
