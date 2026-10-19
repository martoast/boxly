<template>
  <div class="flex-1 overflow-y-auto px-4 md:px-5 pt-6 pb-6">
    <div class="max-w-2xl mx-auto">
      <!-- Terms update (2026-10-10): a discreet notice for accounts that haven't accepted the current
           version — never a popup, never blocks the dashboard. Dismissed per browser. -->
      <div v-if="showTermsNotice" class="mb-3 flex items-start gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-[13px] text-gray-600">
        <p class="flex-1">
          Actualizamos nuestros Términos de Servicio para explicar con mayor claridad los tiempos, el manejo de paquetes y el proceso de reclamación.
          Puedes consultarlos <NuxtLink to="/terms-of-service" class="font-semibold text-primary-600 hover:underline">aquí</NuxtLink>.
        </p>
        <button type="button" class="shrink-0 -mr-1 p-1 text-gray-400 hover:text-gray-600" aria-label="Cerrar aviso" @click="dismissTermsNotice">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <!-- Greeting -->
      <h1 class="text-[26px] md:text-[30px] font-extrabold tracking-tight text-gray-900 leading-tight">
        Hola<template v-if="firstName">, {{ firstName }}</template>
      </h1>
      <p class="mt-1 text-[14px] text-gray-500">Tu centro de envíos de Estados Unidos a México.</p>

      <!-- Primary action — create the shipment. -->
      <NuxtLink
        to="/app/orders/create"
        class="group relative mt-4 block overflow-hidden rounded-[1.4rem] bg-primary-600 hover:bg-primary-700 text-white p-5 shadow-lg shadow-primary-600/20 active:scale-[.99] transition"
      >
        <div class="flex items-start justify-between">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="1.7" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" :d="ICONS.boxPlus" /></svg>
          <svg class="w-4 h-4 text-white/80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M7 17L17 7M9 7h8v8" /></svg>
        </div>
        <p class="mt-3 text-[19px] font-extrabold leading-tight">Crear mi envío</p>
        <p class="mt-1 text-[13.5px] text-white/85">¿Ya compraste? Registra tus paquetes aquí.</p>
      </NuxtLink>

      <!-- Your US address. -->
      <div class="mt-3 rounded-[1.4rem] border border-gray-200 bg-white p-5">
        <div class="flex items-center justify-between">
          <h2 class="text-[16px] font-bold text-gray-900">Tu dirección en EE. UU.</h2>
          <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" stroke-width="1.7" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" :d="ICONS.pin" /></svg>
        </div>
        <div class="mt-3 text-[15px] leading-relaxed">
          <p class="font-semibold text-gray-900">BOXLY {{ user?.name || '' }}</p>
          <p class="text-gray-600">157 Virginia Ave Suite 835</p>
          <p class="text-gray-600">San Ysidro, CA 92173</p>
        </div>
        <button
          type="button"
          @click="copyUsAddress"
          class="mt-4 w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 text-[14.5px] font-semibold transition active:scale-[.99]"
        >
          <svg v-if="!addressCopied" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
          <svg v-else class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
          {{ addressCopied ? '¡Copiado!' : 'Copiar dirección' }}
        </button>
        <div class="mt-3 flex justify-center">
          <TutorialVideoButton loom-id="46437a61757f41aea84c37842cb3f805" />
        </div>
      </div>

      <!-- Everything else Boxly does. -->
      <div class="mt-3 rounded-[1.4rem] border border-gray-200 bg-white">
        <h2 class="px-5 pt-5 pb-1 text-[16px] font-bold text-gray-900">Explora más con Boxly</h2>
        <NuxtLink
          v-for="(item, i) in explore"
          :key="item.to"
          :to="item.to"
          :class="['group flex items-center gap-3.5 px-5 py-4 hover:bg-gray-50 transition-colors', i < explore.length - 1 ? 'border-b border-gray-100' : 'rounded-b-[1.4rem]']"
        >
          <span class="grid place-items-center w-10 h-10 rounded-xl bg-primary-50 text-primary-600 shrink-0">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.7" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" :d="item.icon" /></svg>
          </span>
          <div class="min-w-0 flex-1">
            <p class="text-[15px] font-semibold text-gray-900 leading-tight">{{ item.title }}</p>
            <p class="mt-0.5 text-[13px] text-gray-500 leading-snug">{{ item.sub }}</p>
          </div>
          <svg class="w-4 h-4 text-gray-400 group-hover:text-primary-500 group-hover:translate-x-0.5 transition shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
// The logged-in home — a shipping control centre (redesign 2026-10-19): who you
// are, the create-shipment action, your US address, and a list of everything
// else. The live store browser lives at /app/browse.
definePageMeta({
  layout: 'app',
  middleware: ['auth', 'customer', 'complete-profile'],
})
useHead({ title: 'Boxly — Tu casillero' })

const user = useUser()

const firstName = computed(() => (user.value?.name || '').trim().split(/\s+/)[0] || '')

const ICONS = {
  pin: 'M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z',
  boxPlus: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v5m-8-1L4 7m8 4v10M4 7v10l8 4m6-5v6m-3-3h6',
  sparkle: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z',
  bag: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z',
  locker: 'M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6',
  tag: 'M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z',
  list: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
}

const explore = [
  { to: '/app/search', title: 'Buscar y cotizar con IA', sub: 'Encuentra productos en tiendas de EE. UU.', icon: ICONS.sparkle },
  { to: '/in-person', title: 'Compras personales', sub: 'Una shopper compra por ti en San Diego', icon: ICONS.bag },
  { to: '/app/orders', title: 'Mis envíos', sub: 'Historial y seguimiento de tus envíos', icon: ICONS.list },
  { to: '/app/casillero?from=/app', title: 'Entrega en San Diego', sub: 'Tu casillero y cómo enviarnos tus compras', icon: ICONS.locker },
  { to: '/app/pricing', title: 'Precios y cómo funciona', sub: 'Tamaños de caja y tarifas', icon: ICONS.tag },
]

// Terms update notice — shown when the account hasn't accepted the version the API calls current.
const termsDismissed = ref(true) // client decides after mount; SSR renders nothing
const termsNoticeKey = computed(() => `boxly-terms-notice-${user.value?.current_terms_version || ''}`)
const showTermsNotice = computed(() =>
  !termsDismissed.value && !!user.value?.current_terms_version && user.value.terms_version !== user.value.current_terms_version)
onMounted(() => {
  try { termsDismissed.value = localStorage.getItem(termsNoticeKey.value) === '1' } catch { termsDismissed.value = false }
})
function dismissTermsNotice() {
  termsDismissed.value = true
  try { localStorage.setItem(termsNoticeKey.value, '1') } catch { /* private mode — hides for this visit */ }
}

const addressCopied = ref(false)
async function copyUsAddress() {
  const text = `BOXLY ${user.value?.name || ''}\n157 Virginia Ave Suite 835\nSan Ysidro, CA 92173`
  try {
    await navigator.clipboard.writeText(text)
    addressCopied.value = true
    setTimeout(() => { addressCopied.value = false }, 2000)
  } catch { /* clipboard blocked — the address is on screen to copy by hand */ }
}
</script>
