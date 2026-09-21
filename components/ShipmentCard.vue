<template>
  <div class="rounded-2xl border border-primary-200 bg-gradient-to-b from-primary-50/80 to-white p-4 max-w-md shadow-sm">
    <div class="flex items-center justify-between gap-2">
      <p class="text-[14px] font-extrabold text-primary-900 flex items-center gap-1.5">
        📦 Tu caja Boxly
        <span v-if="itemCount" class="text-[11px] font-bold text-white bg-primary-500 rounded-full px-2 py-0.5 tabular-nums">{{ itemCount }}</span>
      </p>
      <!-- No box chip when nothing in the shipment actually fits one. -->
      <span v-if="packed.length" class="text-[11px] font-semibold text-primary-700 bg-primary-100 rounded-full px-2.5 py-0.5">Caja {{ s.box_label }}</span>
    </div>

    <!-- items — with thumbnails so the box visibly fills up as they add more -->
    <ul v-if="packed.length" class="mt-3 space-y-2">
      <li v-for="(it, i) in packed" :key="i" class="flex items-center gap-2.5">
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

    <!-- DOESN'T FIT IN ANY BOX. Alex added an Intex above-ground pool and the card
         drew it inside a Caja Chica at 23% and invited him to add more (2026-09-16).
         The biggest box Boxly ships is 52x62x53 cm; a pool has no side that fits, so
         it is shown OUTSIDE the box with the honest answer attached. -->
    <div v-if="freight.length" class="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 p-2.5">
      <p class="text-[12px] font-bold text-amber-800">📐 No cabe en ninguna caja</p>
      <ul class="mt-1.5 space-y-1">
        <li v-for="(it, i) in freight" :key="i" class="flex items-center gap-2">
          <div class="shrink-0 w-8 h-8 rounded-md bg-white border border-amber-100 overflow-hidden grid place-items-center">
            <img v-if="it.image" :src="it.image" :alt="it.name" class="w-full h-full object-contain" loading="lazy" />
          </div>
          <p class="min-w-0 flex-1 text-[12px] text-amber-900 truncate leading-tight"><span v-if="it.quantity > 1" class="font-semibold">{{ it.quantity }}× </span>{{ it.name }}</p>
        </li>
      </ul>
      <p class="mt-1.5 text-[11px] text-amber-700 leading-snug">La caja más grande mide 52×62×53 cm. Esto se envía como carga especial — te lo cotizamos por WhatsApp.</p>
    </div>

    <!-- capacity bar — of whichever lid is closer. A bowling ball is 5% of a Caja
         Chica by volume and half of the 15 kg it may weigh; showing the volume
         would say "te queda 95%" about a box that is nearly at its limit. -->
    <div v-if="packed.length" class="mt-3">
      <div class="h-2.5 rounded-full bg-gray-100 overflow-hidden">
        <div class="h-full rounded-full transition-all duration-500" :class="barClass" :style="{ width: s.capacity_used_pct + '%' }"></div>
      </div>
      <div class="flex items-center justify-between mt-1 text-[11px]">
        <span class="font-semibold text-primary-800">{{ byWeight ? 'Peso usado' : 'Capacidad usada' }} {{ s.bulk ? '~' : '' }}{{ s.capacity_used_pct }}%</span>
        <span class="text-gray-400"><span v-if="byWeight" class="tabular-nums">{{ s.weight_kg }} / {{ s.max_kg }} kg · </span>te queda {{ s.capacity_left_pct }}%</span>
      </div>
    </div>

    <!-- nudge -->
    <p v-if="packed.length" class="mt-2 text-[12px] leading-snug" :class="s.bulk ? 'text-gray-500' : nearlyFull ? 'text-amber-700 font-semibold' : 'text-primary-700'">
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
  limited_by: props.shipment?.limited_by || 'volume',
  bulk: !!props.shipment?.bulk,
  weight_kg: props.shipment?.weight_kg ?? 0,
  max_kg: props.shipment?.max_kg ?? 15,
}))

// What is actually in the box, and what can never be. An item the estimator
// flagged as freight is drawn separately — it is not 0.80 shoe-units of pillow.
const packed = computed(() => (s.value.items || []).filter((it) => !it.unboxable))
const freight = computed(() => (s.value.items || []).filter((it) => it.unboxable))
const byWeight = computed(() => s.value.limited_by === 'weight')

// Total pieces in the box (sums quantities) — the badge that ticks up as they add.
const itemCount = computed(() => packed.value.reduce((n, it) => n + (Number(it.quantity) || 1), 0))
const nearlyFull = computed(() => s.value.capacity_used_pct >= 85)
const barClass = computed(() => {
  const u = s.value.capacity_used_pct
  if (u >= 85) return 'bg-amber-400'
  if (u >= 50) return 'bg-primary-500'
  return 'bg-primary-400'
})
const nudge = computed(() => {
  const left = s.value.capacity_left_pct
  // AT BULK THE BAR IS A GUESS x90, SO IT MUST NOT READ AS A VERDICT. A real customer
  // was shown "100% · te queda 0% · buen momento para pedir tu envío" for 90 packs of
  // face wipes that actually needed a Caja Grande (Alex, 2026-09-21). Pushing someone
  // to finalise on a number that is out by two box sizes is the worst moment to push.
  if (s.value.bulk) return 'Por volumen esta es una estimación aproximada — la cantidad exacta que entra la confirma nuestro equipo al empacar en bodega 📦'
  if (nearlyFull.value) return byWeight.value ? 'Tu caja ya casi llega a su peso máximo — buen momento para pedir tu envío 🎉' : 'Tu caja está casi llena — buen momento para pedir tu envío 🎉'
  // "Te queda bastante espacio" is the wrong invitation when the LIMIT IS WEIGHT:
  // the room is real and the allowance is not, so point at what still fits.
  if (byWeight.value) return 'Lo que llevas pesa bastante — aún cabe más, mejor si es algo ligero 👀'
  if (left >= 50) return 'Te queda bastante espacio — agrega más y aprovecha el mismo envío 👀'
  return 'Aún cabe algo más en tu caja — ¿agregas otra cosa antes de pedir?'
})
</script>
