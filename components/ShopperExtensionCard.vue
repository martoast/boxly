<template>
  <!--
    Boxly Shopper (Chrome extension) — install prompt + one-click account link.

    The handshake is window.postMessage, NOT chrome.runtime.sendMessage: that
    would need the extension's published ID hardcoded here, which breaks for
    every unpacked/dev install and every time the ID changes. Instead the
    extension runs a tiny content script on boxly.mx that announces itself and
    listens for the connect payload — so this card never needs to know the ID.
  -->
  <div class="bg-white rounded-2xl border border-gray-200 p-6 sm:p-7">
    <div class="flex items-start gap-4">
      <span class="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-primary-50 text-primary-600 flex-shrink-0">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </span>

      <div class="min-w-0 flex-1">
        <h3 class="text-lg font-bold text-gray-900">{{ t.title }}</h3>
        <p class="mt-1 text-sm text-gray-600 leading-relaxed">{{ t.desc }}</p>

        <!-- Installed + linked -->
        <p v-if="state === 'connected'" class="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
          {{ t.connected }}
        </p>

        <!-- Installed, not linked yet -->
        <button
          v-else-if="state === 'detected'"
          type="button"
          @click="connect"
          class="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
          {{ t.connect }}
        </button>

        <!-- Not installed (or still looking) -->
        <a
          v-else
          :href="storeUrl"
          target="_blank"
          rel="noopener"
          class="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-black transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" /></svg>
          {{ t.install }}
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  /** Full name the extension shows as "BOXLY <name>" in its address block. */
  name: { type: String, default: '' },
})

const { t: createTranslations } = useLanguage()
const { $toast } = useNuxtApp()
const user = useUser()

// Published listing. Until the extension is in the Web Store this points at the
// install instructions in the app.
const storeUrl = 'https://boxly.mx/extension'

const state = ref('unknown') // 'unknown' | 'detected' | 'connected'

const onMessage = (e) => {
  if (e.source !== window || !e.data || e.data.source !== 'boxly-shopper') return
  if (e.data.type === 'ready') state.value = e.data.connected ? 'connected' : 'detected'
  if (e.data.type === 'connected') {
    state.value = 'connected'
    $toast.success(t.value.connectedToast)
  }
}

/**
 * Linking lives in ONE place: plugins/shopperExtension.client.ts.
 *
 * This button used to post its own `connect` payload with just a name and
 * email. The extension replaces the whole stored account on every handshake, so
 * that tokenless payload DELETED the API token the plugin had just minted — and
 * a shopper who pressed "Conectar mi cuenta" ended up strictly worse off than
 * one who never touched it: the panel could read their box but never add to it,
 * failing with a generic error.
 *
 * A ping makes the extension re-announce, which the plugin answers with a full,
 * token-carrying link. One path, so the two can't disagree.
 */
const connect = () => {
  window.postMessage({ source: 'boxly-app', type: 'ping' }, window.location.origin)
}

onMounted(() => {
  window.addEventListener('message', onMessage)
  // Ask any installed extension to announce itself. It replies with 'ready';
  // no reply means it isn't installed and the card stays on the install CTA.
  window.postMessage({ source: 'boxly-app', type: 'ping' }, window.location.origin)
})

onBeforeUnmount(() => window.removeEventListener('message', onMessage))

const t = createTranslations({
  title: { es: 'Boxly Shopper para Chrome', en: 'Boxly Shopper for Chrome' },
  desc: {
    es: 'Instala la extensión y, mientras compras en cualquier tienda de USA, te decimos si el precio es bueno, te mostramos cupones y opciones más baratas, y copias tu dirección Boxly sin salir de la página.',
    en: 'Install the extension and, while you shop any US store, we tell you whether the price is good, show you coupons and cheaper options, and let you copy your Boxly address without leaving the page.',
  },
  install: { es: 'Instalar extensión', en: 'Install extension' },
  connect: { es: 'Conectar mi cuenta', en: 'Link my account' },
  connected: { es: 'Extensión conectada a tu cuenta', en: 'Extension linked to your account' },
  connectedToast: { es: '¡Extensión conectada!', en: 'Extension linked!' },
})
</script>
