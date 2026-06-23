<template>
  <div class="rounded-2xl border border-primary-200 bg-gradient-to-b from-primary-50/80 to-white p-4 max-w-md shadow-sm">
    <div class="flex items-center justify-between gap-2">
      <p class="text-[14px] font-extrabold text-primary-900 flex items-center gap-1.5">📦 Tu envío</p>
      <span class="text-[11px] font-semibold text-primary-700 bg-primary-100 rounded-full px-2.5 py-0.5">Caja {{ s.box_label }}</span>
    </div>

    <!-- items -->
    <ul class="mt-2.5 space-y-1">
      <li v-for="(it, i) in s.items" :key="i" class="flex items-center justify-between gap-2 text-[13px]">
        <span class="text-gray-800 min-w-0 truncate"><span class="font-semibold">{{ it.quantity }}×</span> {{ it.name }}</span>
        <span class="shrink-0 text-[11px] text-gray-400">{{ it.size }}</span>
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
    <div class="mt-3 flex items-center gap-2">
      <button type="button" @click="$emit('order')" class="flex-1 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 active:scale-[.97] text-white text-[12.5px] font-bold shadow-sm shadow-primary-500/20 transition-all">Pedir mi envío</button>
      <button type="button" @click="$emit('add')" class="px-3 py-2 rounded-xl border border-primary-200 text-primary-700 text-[12.5px] font-semibold hover:bg-primary-50 active:scale-[.97] transition-all">Agregar más</button>
    </div>
    <p class="mt-2 text-[10px] text-gray-400 leading-tight">Estimado para que veas cómo se llena tu caja. El tamaño y el costo final se confirman en tu cotización.</p>
  </div>
</template>

<script setup>
const props = defineProps({ shipment: { type: Object, default: () => ({}) } })
defineEmits(['order', 'add'])

const s = computed(() => ({
  items: props.shipment?.items || [],
  box_label: props.shipment?.box_label || 'Chica',
  box_key: props.shipment?.box_key || 'S',
  capacity_used_pct: props.shipment?.capacity_used_pct ?? 0,
  capacity_left_pct: props.shipment?.capacity_left_pct ?? 100,
}))

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
