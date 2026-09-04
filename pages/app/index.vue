<template>
  <div class="flex-1 overflow-y-auto px-4 md:px-5 pt-6 pb-6">
    <div class="max-w-2xl mx-auto">
      <!-- WOW HERO — the promise, in one glance: all of the US, at your door in MX. -->
      <div class="relative overflow-hidden rounded-[1.8rem] bg-gradient-to-br from-primary-600 via-primary-600 to-indigo-700 text-white p-6 md:p-8 shadow-xl shadow-primary-600/25 mb-3">
        <span class="absolute -top-16 -right-12 w-56 h-56 rounded-full bg-white/10 blur-3xl pointer-events-none"></span>
        <span class="absolute -bottom-20 -left-12 w-60 h-60 rounded-full bg-indigo-400/25 blur-3xl pointer-events-none"></span>
        <div class="relative">
          <span class="inline-flex items-center gap-1.5 text-[12px] font-bold tracking-wide text-white/85 bg-white/10 border border-white/15 rounded-full px-3 py-1">🇺🇸 → 🇲🇽 De EE. UU. a tu casa en México</span>
          <h1 class="mt-3.5 text-[27px] md:text-[38px] font-extrabold leading-[1.06] tracking-tight">Compra en EE. UU. como<br class="hidden sm:block"> si vivieras allá.</h1>
          <p class="mt-2.5 text-[14.5px] md:text-[16.5px] text-white/85 max-w-xl leading-snug">Compra en cualquier tienda.<br>¿No puedes comprar? Lo hacemos por ti. ¿Ya compraste? Envíalo a tu casillero Boxly. Nosotros lo llevamos a tu casa en México.</p>
          <NuxtLink to="/app/search" class="mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white text-primary-700 text-[14.5px] font-bold shadow-lg shadow-primary-900/20 hover:bg-white/95 active:scale-[.98] transition">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.7 5.6L19 9l-5.3 1.4L12 16l-1.7-5.6L5 9l5.3-1.4z" /></svg>
            Buscar y cotizar con IA
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </NuxtLink>
          <!-- store proof -->
          <div class="relative mt-6 overflow-hidden select-none -mx-6 md:-mx-8" aria-hidden="true">
            <div class="flex w-max gap-8 whitespace-nowrap marquee-track px-6 md:px-8">
              <span v-for="(b, i) in marqueeStores" :key="i" class="text-[12.5px] font-bold tracking-tight text-white/60">{{ b }}</span>
            </div>
            <div class="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-primary-600 to-transparent"></div>
            <div class="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-indigo-700 to-transparent"></div>
          </div>
        </div>
      </div>

      <!-- Card — your US address. -->
      <div class="relative w-full rounded-[1.6rem] border border-primary-100 p-5 md:p-6 overflow-hidden bg-gradient-to-br from-white via-white to-primary-50/60">
        <span class="absolute -top-10 -right-8 w-40 h-40 rounded-full bg-primary-200/30 blur-3xl pointer-events-none"></span>
        <div class="relative flex items-start gap-4">
          <span class="grid place-items-center w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/30 shrink-0">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" :d="ICONS.pin" /></svg>
          </span>
          <div class="min-w-0 flex-1">
            <p class="text-[11px] font-bold uppercase tracking-widest text-primary-700">Tu dirección en Estados Unidos</p>
            <div class="mt-1.5 text-[15px] leading-snug">
              <p class="font-bold text-gray-900">BOXLY {{ user?.name || '' }}</p>
              <p class="text-gray-700">157 Virginia Ave Suite 835</p>
              <p class="text-gray-700">San Ysidro, CA 92173</p>
            </div>
          </div>
          <span class="hidden sm:inline-flex shrink-0">
            <TutorialVideoButton loom-id="46437a61757f41aea84c37842cb3f805" />
          </span>
        </div>
        <div class="relative mt-3 sm:hidden">
          <TutorialVideoButton loom-id="46437a61757f41aea84c37842cb3f805" />
        </div>
        <NuxtLink to="/app/pricing" class="relative mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-gray-600 hover:text-primary-600 transition-colors group">
          <svg class="w-4 h-4 shrink-0 text-gray-400 group-hover:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" :d="ICONS.box" /></svg>
          Ver precios y cómo funciona
          <svg class="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
        </NuxtLink>
        <div class="relative flex flex-wrap items-center gap-2 mt-3.5">
          <button type="button" @click="copyUsAddress" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-[13px] font-semibold transition active:scale-95">
            <svg v-if="!addressCopied" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
            {{ addressCopied ? '¡Copiado!' : 'Copiar dirección' }}
          </button>
          <NuxtLink to="/app/casillero?from=/app" class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-gray-600 text-[13px] font-semibold hover:bg-gray-50 hover:border-gray-300 transition active:scale-95">
            <svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" :d="ICONS.pin"/></svg>
            Entrega en San Diego
          </NuxtLink>
        </div>
      </div>

      <!-- Card — create the shipment. -->
      <NuxtLink
        to="/app/orders/create"
        class="group relative mt-3 flex items-center gap-4 rounded-[1.6rem] border border-gray-200 bg-white p-5 md:p-6 transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01] hover:shadow-xl hover:border-primary-200"
      >
        <span class="relative grid place-items-center w-12 h-12 rounded-2xl bg-gray-100 text-gray-700 group-hover:bg-primary-100 group-hover:text-primary-600 transition-colors shrink-0">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" :d="ICONS.box" /></svg>
          <span class="absolute -top-1 -right-1 grid place-items-center w-4 h-4 rounded-full bg-primary-500 text-white shadow-sm">
            <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3.2" d="M12 5v14M5 12h14" /></svg>
          </span>
        </span>
        <div class="min-w-0 flex-1">
          <p class="text-[16px] font-bold text-gray-900 leading-tight">Crear mi envío</p>
          <p class="text-[13px] text-gray-500 mt-0.5">Ya lo compré, estoy listo para enviar.</p>
        </div>
        <svg class="w-5 h-5 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
      </NuxtLink>

      <!-- Shipment history — a quiet link. -->
      <NuxtLink to="/app/orders" class="mt-4 flex items-center justify-center gap-1.5 text-[13px] font-semibold text-gray-500 hover:text-primary-600 transition-colors group">
        <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" :d="ICONS.box" /></svg>
        Ver mis envíos
        <svg class="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
// The logged-in home. This is the concierge hub's welcome dashboard — the US
// address, create-shipment and shipment-history cards — WITHOUT the removed AI
// search. The live store browser lives at /app/browse.
definePageMeta({
  layout: 'app',
  middleware: ['auth', 'customer', 'complete-profile'],
})
useHead({ title: 'Boxly — Tu casillero' })

const user = useUser()

const STORE_LIST = ['Amazon', 'Costco', 'Target', 'Walmart', 'Nike', 'Apple', 'Home Depot', 'Best Buy', 'Sephora', 'Ross', 'TJ Maxx', 'Burlington', "Macy's", 'Coach', 'Michael Kors', "Levi's", 'Gap', 'Old Navy']
const marqueeStores = [...STORE_LIST, ...STORE_LIST]

const ICONS = {
  pin: 'M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z',
  box: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
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

<style scoped>
.marquee-track { animation: marquee 70s linear infinite; }
@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@media (prefers-reduced-motion: reduce) { .marquee-track { animation: none; } }
</style>
