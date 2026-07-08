<template>
  <section class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

      <!-- Hero -->
      <div class="text-center">
        <h1 class="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Cajas y Tarifas</h1>
        <p class="mt-2 text-lg text-gray-500">Elige la caja ideal para tu compra.</p>
      </div>

      <!-- Trust strip — why Boxly, in three seconds -->
      <div class="mt-7 rounded-2xl border border-gray-100 bg-white/70 backdrop-blur px-4 py-3.5 flex flex-wrap items-center justify-center gap-x-7 gap-y-2.5 shadow-sm">
        <span v-for="tr in TRUST" :key="tr.label" class="inline-flex items-center gap-1.5 text-[13px] font-semibold text-gray-700">
          <svg :class="['w-4 h-4 shrink-0', tr.icon === 'plane' ? 'text-primary-500' : 'text-emerald-500']" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" :stroke-width="tr.icon === 'plane' ? 1.8 : 2.5" :d="tr.icon === 'plane' ? ICONS.plane : ICONS.check" /></svg>
          {{ tr.label }}
        </span>
      </div>

      <!-- Timeline — Así funciona Boxly -->
      <div class="mt-8 rounded-2xl border border-gray-100 bg-white shadow-sm p-6 sm:p-8">
        <p class="text-center text-[13px] font-bold text-gray-500 uppercase tracking-widest mb-8">Así funciona Boxly</p>
        <div class="relative">
          <!-- flowing progress line behind the nodes (desktop) -->
          <div class="hidden md:block absolute top-6 left-[9%] right-[9%] h-[3px] rounded-full bg-primary-100 overflow-hidden">
            <div class="h-full w-1/4 rounded-full bg-gradient-to-r from-transparent via-primary-500 to-transparent flow-line"></div>
          </div>
          <div class="relative flex flex-col md:flex-row md:justify-between">
            <template v-for="(s, i) in STEPS" :key="s.title">
              <div class="timeline-step group flex md:flex-col md:items-center md:text-center gap-3.5 md:gap-0 md:flex-1" :style="{ animationDelay: (i * 0.08) + 's' }">
                <span :class="['relative grid place-items-center w-12 h-12 rounded-2xl shrink-0 transition-transform duration-200 group-hover:scale-110', s.trust ? 'bg-emerald-500 text-white ring-4 ring-emerald-100 scale-105' : 'bg-white text-primary-600 ring-2 ring-primary-100 shadow-sm']">
                  <span v-if="s.trust" class="absolute inset-0 rounded-2xl bg-emerald-400/40 animate-ping"></span>
                  <svg class="relative w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" :d="ICONS[s.icon]" /></svg>
                </span>
                <div class="md:mt-3.5 md:px-1">
                  <p :class="['text-[13.5px] font-bold leading-tight', s.trust ? 'text-emerald-700' : 'text-gray-900']">{{ s.title }}</p>
                  <p v-if="s.sub" class="text-[11.5px] text-gray-400 mt-0.5 leading-snug">{{ s.sub }}</p>
                </div>
              </div>
              <!-- mobile connector -->
              <div v-if="i < STEPS.length - 1" class="md:hidden ml-6 my-1 h-5 border-l-2 border-primary-100"></div>
            </template>
          </div>
        </div>
      </div>

      <!-- Value banner -->
      <div class="mt-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 p-5 sm:p-6 flex items-start gap-4 shadow-sm">
        <span class="grid place-items-center w-11 h-11 rounded-xl bg-emerald-500 text-white shadow-sm shadow-emerald-500/30 shrink-0">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9.66 17h4.68M12 3a6 6 0 00-4 10.47V16a1 1 0 001 1h6a1 1 0 001-1v-2.53A6 6 0 0012 3z" /></svg>
        </span>
        <div>
          <p class="text-lg sm:text-xl font-extrabold text-gray-900">Llena tu caja. Aprovecha cada envío.</p>
          <p class="text-[14px] text-gray-500 mt-0.5">Mientras más productos consolides, menor será el costo aproximado por artículo.</p>
          <span class="inline-flex items-center gap-1.5 mt-2.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[11.5px] font-bold">
            <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Consolida tus compras hasta por 60 días
          </span>
        </div>
      </div>

      <!-- how the box limit works -->
      <p class="mt-6 text-center text-[12.5px] text-gray-500">
        El límite de cada caja es por <span class="font-semibold text-gray-700">volumen o peso</span> — lo que se alcance primero.
      </p>

      <!-- Pricing cards -->
      <div id="cajas" class="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div
          v-for="b in BOXES"
          :key="b.key"
          :class="['relative flex flex-col rounded-2xl border bg-white p-5 transition-all hover:shadow-lg hover:-translate-y-0.5', b.popular ? 'border-primary-300 ring-1 ring-primary-200 shadow-md' : b.bestValue ? 'border-emerald-300 ring-1 ring-emerald-200' : 'border-gray-200 shadow-sm']"
        >
          <span v-if="b.tag" :class="['absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full shadow-sm whitespace-nowrap', b.popular ? 'bg-primary-500 text-white' : 'bg-emerald-500 text-white']">{{ b.tag }}</span>

          <p class="text-lg font-extrabold text-gray-900">{{ b.name }}</p>
          <p class="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mt-2">Capacidad aproximada</p>

          <ul class="mt-2 space-y-1.5 text-[13px] text-gray-700">
            <li class="flex items-center gap-2"><span class="w-4 text-center">👕</span> Hasta {{ b.garments }} prendas*</li>
            <li class="flex items-center gap-2"><span class="w-4 text-center">👟</span> Hasta {{ b.pairs }} pares (sin caja)</li>
            <li class="flex items-center gap-2 pt-1 mt-1 border-t border-gray-100"><span class="w-4 text-center">⚖️</span> Máx. {{ b.maxKg }} kg de peso</li>
          </ul>

          <div class="mt-auto pt-4">
            <!-- what you actually pay: the consolidated box price -->
            <p class="text-2xl font-extrabold text-gray-900 leading-none">${{ b.price.toLocaleString('en-US') }} <span class="text-[13px] font-semibold text-gray-400 align-top">MXN</span></p>
            <p class="text-[11px] text-gray-400 mt-0.5">Caja consolidada · todo en un envío</p>
            <!-- value-add: estimated cost per item (greener = better value) -->
            <p class="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-gray-50 border border-gray-100 px-2 py-1 text-[12px] font-bold" :class="perItemColor(b)">
              <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M7 7h.01M7 3h5a2 2 0 011.414.586l7 7a2 2 0 010 2.828l-5 5a2 2 0 01-2.828 0l-7-7A2 2 0 013 10V5a2 2 0 012-2z" /></svg>
              ≈ ${{ b.perItem }} por artículo
            </p>

            <NuxtLink to="/app/orders/create" class="mt-3.5 w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all active:scale-[.98]" :class="b.popular ? 'bg-primary-500 hover:bg-primary-600 text-white shadow-sm shadow-primary-500/20' : 'border border-gray-200 text-gray-700 hover:border-primary-300 hover:text-primary-700'">
              Elegir esta caja
            </NuxtLink>

            <!-- specs tucked away — most people compare value, not centimeters -->
            <button @click="specsOpen[b.key] = !specsOpen[b.key]" class="mt-2 w-full text-[11.5px] text-gray-400 hover:text-gray-600 transition-colors">
              {{ specsOpen[b.key] ? 'Ocultar' : 'Ver especificaciones' }}
            </button>
            <div v-if="specsOpen[b.key]" class="mt-1 text-[11.5px] text-gray-500 text-center leading-relaxed">
              <p>Medidas: {{ b.dims }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- one subtle AI CTA -->
      <div class="mt-7 text-center">
        <NuxtLink to="/app?q=Ay%C3%BAdame%20a%20elegir%20la%20caja%20correcta%20para%20lo%20que%20quiero%20comprar" class="inline-flex flex-col items-center gap-0.5 group">
          <span class="text-[14px] font-semibold text-gray-700 group-hover:text-primary-700 transition-colors">¿No sabes cuál caja elegir?</span>
          <span class="inline-flex items-center gap-1.5 text-[13px] font-bold text-primary-600 group-hover:text-primary-700 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.9" d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 01-9 9 8.96 8.96 0 01-4.28-1.09L3 21l1.09-4.72A8.96 8.96 0 013 12a9 9 0 019-9 9 9 0 019 9z" /></svg>
            Pregúntale a Boxly
          </span>
        </NuxtLink>
      </div>

      <!-- footnote -->
      <p class="mt-6 text-[11px] text-gray-400 text-center max-w-2xl mx-auto">
        Capacidad aproximada. Los pares de tenis se consideran sin caja. La capacidad puede variar según el tamaño y volumen de cada producto.
      </p>
    </div>
  </section>
</template>

<script setup>
import { reactive } from 'vue'

definePageMeta({
  layout: 'app',
  middleware: ['auth', 'customer'],
})
useHead({ title: 'Cajas y Tarifas — Boxly' })

// Trust strip — the four reasons Boxly is different, no paragraphs.
const TRUST = [
  { icon: 'check', label: 'Sin VPN' },
  { icon: 'check', label: 'Sin tarjeta americana' },
  { icon: 'check', label: 'Pagas cuando tu caja está lista' },
  { icon: 'plane', label: 'Envíos rápidos por avión' },
]

// The journey — the "Realizas el pago" step is the emotional centerpiece: Boxly
// earns trust (photos + confirmation) BEFORE asking for money. No carrier names.
const STEPS = [
  { icon: 'pin',    title: 'Llegada a San Diego', sub: 'EE. UU.' },
  { icon: 'truck',  title: 'Cruce a Tijuana', sub: '2–3 días hábiles' },
  { icon: 'camera', title: 'Confirmamos tu envío', sub: 'Te enviamos fotos de todo lo que llegó' },
  { icon: 'card',   title: 'Realizas el pago', sub: 'Solo pagas cuando tu caja está lista', trust: true },
  { icon: 'plane',  title: 'Envío por avión', sub: 'Viaja rápido a cualquier parte de México' },
  { icon: 'home',   title: 'Entrega en México', sub: '2–3 días hábiles' },
]
// Clean, consistent Lucide-style icons.
const ICONS = {
  check: 'M5 13l4 4L19 7',
  pin: 'M12 21s-6.5-5.5-6.5-10.5a6.5 6.5 0 1113 0C18.5 15.5 12 21 12 21zM12 13a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
  truck: 'M2 8a1 1 0 011-1h9a1 1 0 011 1v7H2V8zM13 10h4l3 3.5V15h-7M5.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM17.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z',
  camera: 'M4 8a2 2 0 012-2h1l1-1.5A1 1 0 019 4h6a1 1 0 01.8.5L17 6h1a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2V8zM12 15.5a3 3 0 100-6 3 3 0 000 6z',
  card: 'M3 9.5h18M4 6h16a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V7a1 1 0 011-1zM6.5 14.5h3',
  plane: 'M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z',
  home: 'M4 11l8-7 8 7M6 9.5V19a1 1 0 001 1h3v-5h4v5h3a1 1 0 001-1V9.5',
}

// Capacity-first box table. Dimensions/weight kept but hidden under "Ver especificaciones".
const BOXES = [
  { key: 'XS', name: 'Caja XS', price: 1200, perItem: 240, garments: 5,   pairs: 2,  bags: null, dims: '32 × 24 × 13 cm', maxKg: 8 },
  { key: 'S',  name: 'Caja S',  price: 2200, perItem: 110, garments: 20,  pairs: 5,  bags: null, dims: '42 × 27 × 32 cm', maxKg: 15 },
  { key: 'M',  name: 'Caja M',  price: 4000, perItem: 100, garments: 40,  pairs: 10, bags: 8,  tag: 'Más Popular', popular: true, dims: '42 × 52 × 40 cm', maxKg: 25 },
  { key: 'L',  name: 'Caja L',  price: 5100, perItem: 85,  garments: 60,  pairs: 20, bags: 15, dims: '52 × 42 × 40 cm', maxKg: 35 },
  { key: 'XL', name: 'Caja XL', price: 6250, perItem: 55,  garments: 100, pairs: 30, bags: 20, tag: 'Mejor Valor', bestValue: true, dims: '52 × 62 × 53 cm', maxKg: 50 },
]
const specsOpen = reactive({})

function perItemColor(b) {
  return { XS: 'text-gray-400', S: 'text-gray-500', M: 'text-emerald-600', L: 'text-emerald-600', XL: 'text-emerald-700' }[b.key] || 'text-gray-500'
}
</script>

<style scoped>
/* A highlight that flows along the timeline — suggests movement, subtly. */
.flow-line { animation: flow 2.6s linear infinite; }
@keyframes flow { 0% { transform: translateX(-120%); } 100% { transform: translateX(500%); } }

/* Nodes ease in one-by-one on load. */
.timeline-step { opacity: 0; animation: step-in .5s ease forwards; }
@keyframes step-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

@media (prefers-reduced-motion: reduce) {
  .flow-line { animation: none; opacity: .6; }
  .timeline-step { opacity: 1; animation: none; }
}
</style>
