<template>
  <div class="rounded-2xl border border-primary-200 bg-gradient-to-b from-primary-50/80 to-white p-4 max-w-md shadow-sm">
    <div class="flex items-center justify-between gap-2">
      <p class="text-[14px] font-extrabold text-primary-900 flex items-center gap-1.5">
        📦 Tu caja Boxly
        <span v-if="itemCount" class="text-[11px] font-bold text-white bg-primary-500 rounded-full px-2 py-0.5 tabular-nums">{{ itemCount }}</span>
      </p>
      <span class="text-[11px] font-semibold text-primary-700 bg-primary-100 rounded-full px-2.5 py-0.5">Caja {{ s.box_label }}</span>
    </div>

    <!-- items — with thumbnails so the box visibly fills up as they add more -->
    <ul class="mt-3 space-y-2">
      <li v-for="(it, i) in s.items" :key="i" class="flex items-center gap-2.5">
        <div class="shrink-0 w-11 h-11 rounded-lg bg-white border border-primary-100 overflow-hidden grid place-items-center">
          <img v-if="it.image" :src="it.image" :alt="it.name" class="w-full h-full object-contain" loading="lazy" />
          <svg v-else class="w-5 h-5 text-primary-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-[13px] text-gray-800 truncate leading-tight"><span v-if="it.quantity > 1" class="font-semibold">{{ it.quantity }}× </span>{{ it.name }}</p>
          <!-- The shopper's OWN choice leads (size · colour), then the packing size and price — a box item must
               show back exactly what they picked (Alex, 2026-09-11). -->
          <p class="text-[11px] leading-tight mt-0.5">
            <span v-if="it.chosen" class="font-semibold text-gray-600">{{ it.chosen }}</span><span v-if="it.chosen" class="text-gray-300"> · </span><span class="text-gray-400">{{ it.size }}<span v-if="it.price"> · ${{ it.price }} USD</span></span>
          </p>
        </div>
      </li>
    </ul>

    <!-- capacity bar -->
    <div class="mt-3">
      <div class="h-2.5 rounded-full bg-gray-100 overflow-hidden">
        <div class="h-full rounded-full transition-all duration-500" :class="barClass" :style="{ width: s.capacity_used_pct + '%' }"></div>
      </div>
      <div class="flex items-center justify-between mt-1 text-[11px]">
        <span class="font-semibold text-primary-800">Capacidad usada {{ s.capacity_used_pct }}%</span>
        <span class="text-gray-400">te queda {{ s.capacity_left_pct }}%</span>
      </div>
    </div>

    <!-- nudge -->
    <p class="mt-2 text-[12px] leading-snug" :class="nearlyFull ? 'text-amber-700 font-semibold' : 'text-primary-700'">
      {{ nudge }}
    </p>

    <!-- actions -->
    <!-- Once the purchase request exists, "Confirmar mi envío" is a dead end: the
         green card above already says the request was created, and tapping it just
         gets "no es necesario realizar ninguna otra confirmación adicional". It
         reads as an unfinished step and makes people think the order didn't go
         through. "Agregar más" stays — that one still does something, and a
         half-empty box is exactly when we want to invite more items. -->
    <div class="mt-3 flex items-center gap-2">
      <button v-if="!requested" type="button" @click="$emit('order')" class="flex-1 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 active:scale-[.97] text-white text-[12.5px] font-bold shadow-sm shadow-primary-500/20 transition-all">Finalizar carrito</button>
      <button type="button" @click="$emit('add')" :class="requested ? 'flex-1 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 active:scale-[.97] text-white text-[12.5px] font-bold shadow-sm shadow-primary-500/20 transition-all' : 'px-3 py-2 rounded-xl border border-primary-200 text-primary-700 text-[12.5px] font-semibold hover:bg-primary-50 active:scale-[.97] transition-all'">Agregar más</button>
    </div>
    <p class="mt-2 text-[10px] text-gray-400 leading-tight">Estimado para que veas cómo se llena tu caja. El tamaño y el costo final se confirman en tu cotización.</p>
  </div>
</template>

<script setup>
const props = defineProps({
  shipment: { type: Object, default: () => ({}) },
  // True once a purchase request already exists for this chat — hides the
  // now-meaningless "Confirmar mi envío" action.
  requested: { type: Boolean, default: false },
})
defineEmits(['order', 'add'])

const s = computed(() => ({
  items: props.shipment?.items || [],
  box_label: props.shipment?.box_label || 'Chica',
  box_key: props.shipment?.box_key || 'S',
  capacity_used_pct: props.shipment?.capacity_used_pct ?? 0,
  capacity_left_pct: props.shipment?.capacity_left_pct ?? 100,
}))

// Total pieces in the box (sums quantities) — the badge that ticks up as they add.
const itemCount = computed(() => (s.value.items || []).reduce((n, it) => n + (Number(it.quantity) || 1), 0))
const nearlyFull = computed(() => s.value.capacity_used_pct >= 85)
const barClass = computed(() => {
  const u = s.value.capacity_used_pct
  if (u >= 85) return 'bg-amber-400'
  if (u >= 50) return 'bg-primary-500'
  return 'bg-primary-400'
})
const nudge = computed(() => {
  const left = s.value.capacity_left_pct
  if (nearlyFull.value) return 'Tu caja está casi llena — buen momento para pedir tu envío 🎉'
  if (left >= 50) return 'Te queda bastante espacio — agrega más y aprovecha el mismo envío 👀'
  return 'Aún cabe algo más en tu caja — ¿agregas otra cosa antes de pedir?'
})
</script>
