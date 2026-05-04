<template>
  <section class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20 flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
      <!-- Brand -->
      <div class="flex items-center justify-center gap-3 mb-6">
        <img src="/logo.svg" alt="Boxly" class="h-10 w-auto" />
      </div>

      <!-- Loading -->
      <div v-if="state === 'loading'" class="space-y-4">
        <div class="inline-block w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        <h1 class="text-xl font-bold text-gray-900">Conectando con la extensión…</h1>
        <p class="text-sm text-gray-500">Esto toma un segundo.</p>
      </div>

      <!-- Success -->
      <div v-else-if="state === 'success'" class="space-y-4">
        <div class="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
          <svg class="w-9 h-9 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <h1 class="text-2xl font-extrabold text-gray-900">¡Listo, {{ user?.name?.split(' ')?.[0] || '' }}!</h1>
        <p class="text-gray-600 leading-relaxed">
          La extensión está conectada a tu cuenta. Ya puedes cerrar esta pestaña y empezar a capturar productos desde cualquier tienda.
        </p>
        <div class="bg-primary-50 border border-primary-100 rounded-xl p-4 text-left text-sm">
          <p class="font-semibold text-primary-900 mb-1">Cómo usarla:</p>
          <ol class="list-decimal list-inside text-primary-800 space-y-1">
            <li>Abre cualquier producto en una tienda US</li>
            <li>Click en el ícono 📦 de Boxly en la barra de Chrome</li>
            <li>Click en "Extraer producto"</li>
            <li>Revisa los datos y confirma</li>
          </ol>
        </div>
        <button
          type="button"
          @click="closeWindow"
          class="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-colors"
        >
          Cerrar pestaña
        </button>
      </div>

      <!-- Error: extension didn't respond -->
      <div v-else-if="state === 'no_extension'" class="space-y-4">
        <div class="w-16 h-16 mx-auto rounded-full bg-amber-100 flex items-center justify-center">
          <svg class="w-9 h-9 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>
        <h1 class="text-xl font-bold text-gray-900">No detecté la extensión</h1>
        <p class="text-gray-600 leading-relaxed">
          Asegúrate de que la extensión Boxly esté instalada y activa, después vuelve a hacer click en "Conectar" desde el popup.
        </p>
        <p class="text-xs text-gray-400">Extension ID buscado: <code class="bg-gray-100 px-1.5 py-0.5 rounded">{{ extensionId || '(no recibido)' }}</code></p>
        <button
          type="button"
          @click="connect"
          class="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-colors"
        >
          Reintentar
        </button>
      </div>

      <!-- Error: API call failed -->
      <div v-else-if="state === 'api_error'" class="space-y-4">
        <div class="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
          <svg class="w-9 h-9 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </div>
        <h1 class="text-xl font-bold text-gray-900">No pude generar el token</h1>
        <p class="text-gray-600">{{ errorMessage }}</p>
        <button
          type="button"
          @click="connect"
          class="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-colors"
        >
          Reintentar
        </button>
      </div>

      <!-- Error: missing extension id query param -->
      <div v-else-if="state === 'missing_ext'" class="space-y-4">
        <div class="w-16 h-16 mx-auto rounded-full bg-amber-100 flex items-center justify-center">
          <svg class="w-9 h-9 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <h1 class="text-xl font-bold text-gray-900">Falta el ID de la extensión</h1>
        <p class="text-gray-600 text-sm leading-relaxed">
          Esta página solo funciona cuando se abre desde el popup de la extensión Boxly. Abre la extensión y pulsa "Conectar con Boxly".
        </p>
      </div>
    </div>
  </section>
</template>

<script setup>
// Auth-gated: if the user isn't logged in, the standard auth middleware
// bounces them to /login?redirect=/app/extension/connect?ext=... and they
// land back here once they've signed in.
definePageMeta({
  layout: false,
  middleware: ['auth'],
})

const route = useRoute()
const { $customFetch } = useNuxtApp()

const state = ref('loading')         // 'loading' | 'success' | 'no_extension' | 'api_error' | 'missing_ext'
const errorMessage = ref('')
const user = ref(null)
const extensionId = ref(route.query.ext || '')

useHead({ title: 'Conectar extensión — Boxly' })

const closeWindow = () => {
  // window.close() only works for windows opened via JS. The extension
  // popup opens with chrome.tabs.create, so this won't actually close
  // the tab. We still try; if it fails we just leave the success UI up.
  try { window.close() } catch {}
}

const connect = async () => {
  state.value = 'loading'
  errorMessage.value = ''

  if (!extensionId.value) {
    state.value = 'missing_ext'
    return
  }

  // 1. Mint a token for the current user via the cookie-authed session.
  let resp
  try {
    resp = await $customFetch('/me/extension-token', { method: 'POST' })
  } catch (err) {
    console.error('Failed to issue extension token', err)
    state.value = 'api_error'
    errorMessage.value = err?.data?.message || err?.message || 'Error desconocido'
    return
  }
  if (!resp?.token) {
    state.value = 'api_error'
    errorMessage.value = 'La API no devolvió un token'
    return
  }
  user.value = resp.user

  // 2. Hand off to the extension. The extension's manifest must list this
  // origin in `externally_connectable.matches` for sendMessage to reach it.
  if (!window.chrome?.runtime?.sendMessage) {
    state.value = 'no_extension'
    return
  }

  try {
    chrome.runtime.sendMessage(
      extensionId.value,
      {
        type: 'BOXLY_TOKEN_HANDOFF',
        token: resp.token,
        api_url: resp.api_url,
        user: resp.user,
      },
      (ack) => {
        // chrome.runtime.lastError fires if the extension isn't installed
        // or doesn't list our origin under externally_connectable.
        if (chrome.runtime.lastError) {
          console.warn('Extension did not respond:', chrome.runtime.lastError.message)
          state.value = 'no_extension'
          return
        }
        if (ack?.ok) {
          state.value = 'success'
        } else {
          state.value = 'api_error'
          errorMessage.value = ack?.error || 'La extensión rechazó el token'
        }
      },
    )
  } catch (err) {
    console.error('chrome.runtime.sendMessage threw', err)
    state.value = 'no_extension'
  }
}

onMounted(connect)
</script>
