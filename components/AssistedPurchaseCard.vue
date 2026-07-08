<template>
  <div class="rounded-2xl border border-primary-200 bg-gradient-to-b from-primary-50/70 to-white p-4 max-w-md shadow-sm">
    <div class="flex items-center gap-2 mb-2">
      <span class="text-lg">💳</span>
      <p class="text-[14px] font-extrabold text-primary-900">Compra asistida — Boxly lo compra por ti</p>
    </div>

    <!-- items -->
    <ul class="space-y-2">
      <li v-for="(it, i) in items" :key="i" class="flex items-center gap-2.5">
        <img v-if="it.image" :src="it.image" referrerpolicy="no-referrer" class="w-11 h-11 rounded-lg object-cover border border-gray-200 bg-white shrink-0" />
        <span v-else class="w-11 h-11 rounded-lg bg-gray-100 grid place-items-center text-gray-300 shrink-0">🛍️</span>
        <span class="flex-1 min-w-0">
          <span class="block text-[13px] font-semibold text-gray-900 truncate">{{ it.name }}</span>
          <span class="block text-[11px] text-gray-400 truncate">{{ it.store ? it.store + ' · ' : '' }}{{ it.quantity }}× {{ it.price ? '$' + it.price + ' USD' : 'precio al confirmar' }}</span>
        </span>
        <span v-if="it.price" class="shrink-0 text-[12.5px] font-bold text-gray-800">${{ (it.price * it.quantity).toFixed(2) }}</span>
      </li>
    </ul>

    <!-- price breakdown -->
    <div class="mt-3 pt-3 border-t border-primary-100 space-y-1 text-[12.5px]">
      <div class="flex items-center justify-between text-gray-600"><span>Productos (ref.)</span><span class="font-semibold text-gray-800">${{ subtotal.toFixed(2) }} USD</span></div>
      <div class="flex items-center justify-between text-gray-600"><span>Comisión Boxly (10%)</span><span class="font-semibold text-gray-800">${{ commission.toFixed(2) }} USD</span></div>
      <div class="flex items-center justify-between text-gray-400"><span>Caja / envío a México</span><span>se cotiza aparte</span></div>
    </div>
    <p class="mt-2 text-[11px] text-gray-400 leading-snug">El 10% se calcula sobre el total final al hacer checkout en la tienda (producto + envío que cobre la tienda). Este es un estimado — el total exacto va en tu cotización, no pagas nada todavía.</p>

    <div class="flex items-center gap-2 mt-3">
      <button type="button" @click="$emit('edit')" class="px-3 py-2.5 text-gray-500 hover:bg-gray-100 text-[13px] font-semibold rounded-xl transition">Editar</button>
      <button type="button" @click="$emit('confirm')" class="flex-1 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 active:scale-[.98] text-white text-[13px] font-bold rounded-xl transition-all shadow-sm shadow-primary-500/20">Continuar — crear solicitud</button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({ summary: { type: Object, default: () => ({}) } })
defineEmits(['confirm', 'edit'])

const items = computed(() => (props.summary?.items || []).map((it) => ({
  name: it.name || it.product_name || 'Producto',
  store: it.store || null,
  price: Number(it.price) || 0,
  quantity: Math.max(1, Number(it.quantity) || 1),
  image: it.image || it.product_image_url || null,
})))
const subtotal = computed(() => items.value.reduce((s, it) => s + it.price * it.quantity, 0))
const commission = computed(() => subtotal.value * 0.10)
</script>
