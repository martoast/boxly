<template>
  <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
      <div class="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
        <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
      <div>
        <h2 class="text-lg font-bold text-gray-900">{{ c.title }}</h2>
        <p class="text-xs text-gray-500">{{ c.subtitle }}</p>
      </div>
    </div>

    <div class="px-6 py-5 space-y-4">
      <p class="text-sm text-gray-600 leading-relaxed">{{ c.intro }}</p>

      <!-- Not connected yet -->
      <div v-if="!token">
        <button
          @click="generate"
          :disabled="loading"
          class="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 transition-colors"
        >
          <svg v-if="loading" class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          {{ loading ? c.generating : c.generate }}
        </button>
      </div>

      <!-- Connected — show token + setup -->
      <div v-else class="space-y-5">
        <!-- How to connect (3 steps) -->
        <ol class="space-y-2.5">
          <li class="flex gap-3 text-sm text-gray-700">
            <span class="shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center">1</span>
            <span>{{ c.step1 }}</span>
          </li>
          <li class="flex gap-3 text-sm text-gray-700">
            <span class="shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center">2</span>
            <span>{{ c.step2 }}</span>
          </li>
          <li class="flex gap-3 text-sm text-gray-700">
            <span class="shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center">3</span>
            <span>{{ c.step3 }}</span>
          </li>
        </ol>

        <!-- Token -->
        <div>
          <label class="block text-xs font-semibold text-gray-500 uppercase mb-1.5">{{ c.yourToken }}</label>
          <div class="flex items-stretch gap-2">
            <code class="flex-1 min-w-0 truncate bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono text-gray-800">
              {{ revealed ? token : maskedToken }}
            </code>
            <button @click="revealed = !revealed" class="px-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-medium">
              {{ revealed ? c.hide : c.show }}
            </button>
            <button @click="copy(token, 'token')" class="px-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold">
              {{ copied === 'token' ? c.copied : c.copy }}
            </button>
          </div>
          <div class="mt-2 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            <svg class="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M5 19h14a2 2 0 001.84-2.75L13.74 4a2 2 0 00-3.48 0L3.16 16.25A2 2 0 005 19z" />
            </svg>
            <span>{{ c.warning }}</span>
          </div>
        </div>

        <!-- Setup: Claude Code command (one line, no install) -->
        <div>
          <label class="block text-xs font-semibold text-gray-500 uppercase mb-1.5">{{ c.setupClaudeCode }}</label>
          <div class="relative">
            <pre class="bg-gray-900 text-gray-100 rounded-xl p-3 pr-20 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">{{ claudeCmd }}</pre>
            <button @click="copy(claudeCmd, 'cmd')" class="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold">
              {{ copied === 'cmd' ? c.copied : c.copy }}
            </button>
          </div>
        </div>

        <!-- Manual: server URL for any other MCP client -->
        <details class="group">
          <summary class="cursor-pointer text-xs font-semibold text-primary-600 hover:text-primary-700">{{ c.otherClients }}</summary>
          <div class="mt-2 space-y-2">
            <p class="text-xs text-gray-500">{{ c.otherClientsHint }}</p>
            <div class="flex items-stretch gap-2">
              <code class="flex-1 min-w-0 truncate bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono text-gray-800">{{ mcpUrl }}</code>
              <button @click="copy(mcpUrl, 'url')" class="px-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold">
                {{ copied === 'url' ? c.copied : c.copy }}
              </button>
            </div>
            <p class="text-xs text-gray-500">{{ c.authHeader }} <code class="text-gray-700">Authorization: Bearer &lt;token&gt;</code></p>
          </div>
        </details>

        <!-- Try it -->
        <div class="rounded-xl bg-primary-50/60 border border-primary-100 px-4 py-3">
          <p class="text-xs font-semibold text-primary-900 mb-1.5">{{ c.tryIt }}</p>
          <ul class="space-y-1 text-xs text-primary-800">
            <li>“{{ c.ex1 }}”</li>
            <li>“{{ c.ex2 }}”</li>
            <li>“{{ c.ex3 }}”</li>
          </ul>
        </div>

        <!-- Actions -->
        <div class="flex flex-wrap gap-3 pt-1">
          <button @click="generate" :disabled="loading" class="text-xs font-semibold text-gray-600 hover:text-gray-900 underline">{{ c.regenerate }}</button>
          <button @click="revoke" :disabled="loading" class="text-xs font-semibold text-red-600 hover:text-red-700 underline">{{ c.disconnect }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const { $customFetch } = useNuxtApp()
const { language } = useLanguage()

const token = ref(null)
const apiUrl = ref('')
const loading = ref(false)
const revealed = ref(false)
const copied = ref(null)

const maskedToken = computed(() => {
  if (!token.value) return ''
  const t = token.value
  return t.length > 12 ? `${t.slice(0, 6)}${'•'.repeat(18)}${t.slice(-4)}` : t
})

const mcpUrl = computed(() => `${apiUrl.value || 'https://api.boxly.mx'}/mcp/boxly`)

const claudeCmd = computed(() =>
  `claude mcp add --transport http boxly ${mcpUrl.value} \\\n  --header "Authorization: Bearer ${token.value ?? '<token>'}"`
)

const generate = async () => {
  loading.value = true
  try {
    const res = await $customFetch('/me/mcp-token', { method: 'POST' })
    token.value = res.token
    apiUrl.value = res.api_url
    revealed.value = false
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const revoke = async () => {
  loading.value = true
  try {
    await $customFetch('/me/mcp-token', { method: 'DELETE' })
    token.value = null
    apiUrl.value = ''
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const copy = async (text, which) => {
  try {
    await navigator.clipboard.writeText(text)
    copied.value = which
    setTimeout(() => { if (copied.value === which) copied.value = null }, 1800)
  } catch (e) {
    console.error(e)
  }
}

const COPY = {
  es: {
    title: 'Conecta tu IA',
    subtitle: 'Usa tu cuenta Boxly desde Claude',
    intro: 'Genera un token para conectar tu cuenta a Claude (Code o Desktop) y administrar tus pedidos, paquetes y solicitudes de compra hablando con tu IA.',
    generate: 'Generar token',
    generating: 'Generando…',
    yourToken: 'Tu token',
    show: 'Ver', hide: 'Ocultar', copy: 'Copiar', copied: '¡Copiado!',
    warning: 'Trátalo como una contraseña: da acceso a tu cuenta. No lo compartas. Solo se muestra una vez; si lo pierdes, genera otro.',
    step1: 'Copia tu token (abajo).',
    step2: 'Pega el comando de abajo en tu terminal (Claude Code). No hay que instalar nada.',
    step3: 'Abre Claude y pregúntale por tu cuenta de Boxly.',
    setupClaudeCode: 'Comando para Claude Code',
    otherClients: 'Otros clientes de IA (URL del servidor)',
    otherClientsHint: 'Para cualquier cliente MCP: agrega esta URL del servidor con autenticación Bearer usando tu token.',
    authHeader: 'Encabezado de autenticación:',
    tryIt: 'Pruébalo en Claude:',
    ex1: 'Muéstrame mis pedidos de Boxly',
    ex2: '¿Cuál es mi dirección de casillero en EE.UU.?',
    ex3: 'Pídele a Boxly que me compre esto: <pega un link>',
    regenerate: 'Regenerar token',
    disconnect: 'Desconectar',
  },
  en: {
    title: 'Connect your AI',
    subtitle: 'Use your Boxly account from Claude',
    intro: 'Generate a token to connect your account to Claude (Code or Desktop) and manage your orders, packages and purchase requests by talking to your AI.',
    generate: 'Generate token',
    generating: 'Generating…',
    yourToken: 'Your token',
    show: 'Show', hide: 'Hide', copy: 'Copy', copied: 'Copied!',
    warning: 'Treat it like a password: it grants access to your account. Don’t share it. Shown only once — if you lose it, generate a new one.',
    step1: 'Copy your token (below).',
    step2: 'Paste the command below into your terminal (Claude Code). Nothing to install.',
    step3: 'Open Claude and ask it about your Boxly account.',
    setupClaudeCode: 'Command for Claude Code',
    otherClients: 'Other AI clients (server URL)',
    otherClientsHint: 'For any MCP client: add this server URL with Bearer authentication using your token.',
    authHeader: 'Auth header:',
    tryIt: 'Try it in Claude:',
    ex1: 'Show me my Boxly orders',
    ex2: 'What is my US warehouse (casillero) address?',
    ex3: 'Ask Boxly to buy this for me: <paste a link>',
    regenerate: 'Regenerate token',
    disconnect: 'Disconnect',
  },
}

const c = computed(() => COPY[language.value === 'en' ? 'en' : 'es'])
</script>
