<template>
  <section class="min-h-screen bg-gray-50">
    <div class="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 pt-8 pb-14 sm:pb-20">

      <!-- Back to wherever the user came from (?from=…), default the dashboard -->
      <NuxtLink :to="backTo" class="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-8">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
        {{ backLabel }}
      </NuxtLink>

      <!-- Hero -->
      <div class="text-center max-w-2xl mx-auto">
        <h1 class="text-4xl sm:text-5xl font-semibold tracking-tight text-gray-900">Cajas y tarifas</h1>
        <p class="mt-3 text-lg sm:text-xl text-gray-500">Una caja. Un envío. Pagas cuando está lista.</p>
        <div class="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-1.5 text-[13px] text-gray-500">
          <span v-for="tr in TRUST" :key="tr.label" class="inline-flex items-center gap-1.5">
            <svg :class="['w-3.5 h-3.5 shrink-0 text-gray-400']" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" :stroke-width="tr.icon === 'plane' ? 1.8 : 2.5" :d="tr.icon === 'plane' ? ICONS.plane : ICONS.check" /></svg>
            {{ tr.label }}
          </span>
        </div>
      </div>

      <!-- Pricing cards — lead with the offer -->
      <div id="cajas" class="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div
          v-for="b in BOXES"
          :key="b.key"
          :class="['relative flex flex-col rounded-3xl bg-white p-6 transition-shadow duration-200', b.popular ? 'ring-1 ring-gray-900/10 shadow-md' : 'ring-1 ring-gray-900/5 shadow-sm hover:shadow-md']"
        >
          <div class="flex items-center justify-between h-5">
            <p class="text-[17px] font-semibold text-gray-900">{{ b.name }}</p>
            <span v-if="b.tag" :class="['text-[10.5px] font-semibold uppercase tracking-wide', b.popular ? 'text-primary-600' : 'text-emerald-600']">{{ b.tag }}</span>
          </div>

          <!-- price — FIXED per box size -->
          <div class="mt-5">
            <p class="text-[11.5px] text-gray-400">Precio de la caja</p>
            <p class="mt-1 text-[30px] font-semibold tracking-tight text-gray-900 leading-none">${{ b.price.toLocaleString('en-US') }}<span class="text-[13px] font-medium text-gray-400 ml-1">MXN</span></p>
            <p class="mt-1.5 text-[12.5px] text-gray-500">≈ ${{ b.perItem }} por artículo</p>
          </div>

          <!-- capacity — APPROXIMATE examples of what fits (this is what varies) -->
          <div class="mt-5 border-t border-gray-100 pt-4">
            <p class="text-[11px] text-gray-400 mb-2.5">Cuánto le cabe (aprox.)</p>
            <ul class="space-y-2.5 text-[13.5px]">
              <li class="flex items-center justify-between"><span class="text-gray-500">Prendas</span><span class="font-medium text-gray-900">~{{ b.garments }}</span></li>
              <li class="flex items-center justify-between"><span class="text-gray-500">Pares de tenis</span><span class="font-medium text-gray-900">~{{ b.pairs }}</span></li>
              <li class="flex items-center justify-between"><span class="text-gray-500">Peso máximo</span><span class="font-medium text-gray-900">{{ b.maxKg }} kg</span></li>
            </ul>
          </div>

          <div class="mt-auto pt-6">
            <NuxtLink to="/app/orders/create" class="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-full text-[14px] font-semibold transition-colors active:scale-[.98]" :class="b.popular ? 'bg-primary-600 hover:bg-primary-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'">
              Elegir
            </NuxtLink>
            <button @click="specsOpen[b.key] = !specsOpen[b.key]" class="mt-3 w-full text-[12px] text-gray-400 hover:text-gray-600 transition-colors">
              {{ specsOpen[b.key] ? b.dims : 'Ver medidas' }}
            </button>
          </div>
        </div>
      </div>

      <!-- consolidation note, quiet -->
      <p class="mt-5 text-center text-[12.5px] text-gray-400 max-w-xl mx-auto">
        El límite de cada caja es por <span class="text-gray-500">volumen o peso</span> — lo que se alcance primero. Las cantidades son aproximadas.
      </p>

      <!-- AI CTA -->
      <div class="mt-8 text-center">
        <NuxtLink to="/app?q=Ay%C3%BAdame%20a%20elegir%20la%20caja%20correcta%20para%20lo%20que%20quiero%20comprar" class="inline-flex items-center gap-2 text-[14px] font-medium text-primary-600 hover:text-primary-700 transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.9" d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 01-9 9 8.96 8.96 0 01-4.28-1.09L3 21l1.09-4.72A8.96 8.96 0 013 12a9 9 0 019-9 9 9 0 019 9z" /></svg>
          ¿No sabes cuál elegir? Pregúntale a Boxly
        </NuxtLink>
      </div>

      <!-- Footer — how it works + one concise disclaimer, scrunched into a footer -->
      <div class="mt-14 sm:mt-16 pt-9 border-t border-gray-100 max-w-4xl mx-auto">
        <p class="text-center text-[12px] font-semibold text-gray-400 uppercase tracking-[0.2em] mb-8">Cómo funciona</p>
        <div class="relative flex flex-col md:flex-row md:justify-between gap-6 md:gap-0">
          <div class="hidden md:block absolute top-5 left-[8%] right-[8%] h-px bg-gray-200"></div>
          <template v-for="(s, i) in STEPS" :key="s.title">
            <div class="relative flex md:flex-col md:items-center md:text-center gap-3.5 md:gap-0 md:flex-1">
              <span :class="['grid place-items-center w-10 h-10 rounded-full shrink-0 bg-white ring-1', s.trust ? 'ring-primary-300 text-primary-600' : 'ring-gray-200 text-gray-400']">
                <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" :d="ICONS[s.icon]" /></svg>
              </span>
              <div class="md:mt-3 md:px-1">
                <p class="text-[13px] font-medium text-gray-900 leading-tight">{{ s.title }}</p>
                <p v-if="s.sub" class="text-[11.5px] text-gray-400 mt-0.5 leading-snug">{{ s.sub }}</p>
              </div>
            </div>
            <div v-if="i < STEPS.length - 1" class="md:hidden ml-5 my-0.5 h-4 border-l border-gray-200"></div>
          </template>
        </div>
        <p class="mt-9 text-[11.5px] text-gray-400 text-center">Precio fijo por caja · Consolida hasta 60 días · Los pares de tenis se consideran sin caja.</p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { reactive, computed } from 'vue'

definePageMeta({
  layout: 'app',
  middleware: ['auth', 'customer'],
})
useHead({ title: 'Cajas y Tarifas — Boxly' })

// Return to whoever linked here (?from=…), else the dashboard. Only accept safe
// in-app paths so the param can't be used to bounce the user off-site.
const route = useRoute()
const backTo = computed(() => {
  const from = typeof route.query.from === 'string' ? route.query.from : ''
  return from.startsWith('/app') ? from : '/app'
})
const backLabel = computed(() => (backTo.value.startsWith('/app/purchase-requests') ? 'Volver a mi solicitud' : 'Volver al panel'))

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
</script>
