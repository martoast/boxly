<template>
  <div class="rounded-2xl border border-gray-200 bg-white p-4 max-w-md shadow-sm">
    <p class="text-[14px] font-extrabold text-gray-900 flex items-center gap-1.5">📦 Precios de envío por caja</p>
    <p class="text-[11px] text-gray-400 mt-0.5 mb-3 leading-snug">Precio fijo por enviar tu caja consolidada a México. Pagas UNA caja por todo lo que juntes.</p>

    <div class="space-y-1.5">
      <div
        v-for="(b, i) in boxes"
        :key="b.key"
        class="boxrow flex items-center gap-3 rounded-xl border px-3 py-2.5"
        :class="b.popular ? 'border-primary-200 bg-primary-50/60' : 'border-gray-100'"
        :style="{ animationDelay: i * 70 + 'ms' }"
      >
        <div class="min-w-0 flex-1">
          <p class="text-[13px] font-bold text-gray-900 flex items-center gap-1.5 flex-wrap">
            {{ b.label }}
            <span v-if="b.popular" class="text-[9px] font-extrabold uppercase tracking-wide text-primary-700 bg-primary-100 rounded-full px-1.5 py-0.5">Más popular</span>
          </p>
          <p class="text-[11px] text-gray-500 mt-0.5">{{ b.dims }} · hasta {{ b.max_kg }} kg</p>
          <p v-if="b.fits" class="text-[10.5px] text-gray-400 mt-0.5 leading-snug">{{ b.fits }}</p>
        </div>
        <div class="shrink-0 text-right">
          <p class="text-[15px] font-extrabold text-gray-900 leading-none">${{ fmt(b.price_mxn) }}</p>
          <p class="text-[9px] text-gray-400 mt-0.5">MXN</p>
        </div>
      </div>
    </div>

    <div class="mt-3 rounded-xl bg-gray-50 border border-gray-100 px-3 py-2 text-[10.5px] text-gray-500 leading-snug space-y-1">
      <p><span class="font-semibold text-gray-700">Si tú compras tus productos</span> y solo los envías con Boxly: pagas <span class="font-semibold">solo la caja</span> (sin comisión).</p>
      <p><span class="font-semibold text-gray-700">Si Boxly compra por ti</span> (compra asistida): se suma el producto + <span class="font-semibold">10% de comisión</span>.</p>
    </div>
    <p class="mt-2 text-[10px] text-gray-400 leading-tight">Te conviene la caja más chica que te quede y juntar varios productos. Confirmamos el tamaño final al empacar.</p>
  </div>
</template>

<script setup>
defineProps({ boxes: { type: Array, default: () => [] } })
function fmt(n) { return new Intl.NumberFormat('es-MX').format(Number(n) || 0) }
</script>

<style scoped>
.boxrow { animation: boxrow-in .4s cubic-bezier(.2, .8, .2, 1) both; }
@keyframes boxrow-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: none; }
}
@media (prefers-reduced-motion: reduce) {
  .boxrow { animation: none; }
}
</style>
