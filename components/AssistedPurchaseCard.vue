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
      <div class="flex items-center justify-between text-gray-600"><span>Comisión Boxly (15%)</span><span class="font-semibold text-gray-800">${{ commission.toFixed(2) }} USD</span></div>
      <div class="flex items-center justify-between text-gray-400"><span>Caja / envío a México</span><span>se cotiza aparte</span></div>
    </div>
    <p class="mt-2 text-[11px] text-gray-400 leading-snug">El 15% se calcula sobre el total final al hacer checkout en la tienda (producto + envío que cobre la tienda). Este es un estimado — el total exacto va en tu cotización, no pagas nada todavía.</p>

    <!-- The request is created AUTOMATICALLY the moment this card appears (the
         customer already asked Boxly to buy it) — no extra "Continuar" tap. On
         failure we surface a retry so the sale is never silently lost. -->
    <div class="mt-3">
      <!-- SUCCESS in place: when the request is created we keep the items + breakdown above
           and just swap this footer to the confirmation — no card swap, so no "blink". -->
      <transition name="fade" mode="out-in">
        <div v-if="result" key="done" class="rounded-xl bg-green-50 border border-green-200 p-3">
          <p class="text-[13px] font-bold text-green-800 flex items-center gap-1.5"><svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 011.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z" clip-rule="evenodd"/></svg> Listo — nosotros nos encargamos 🎉</p>
          <p class="text-[11.5px] text-green-700 mt-1">Solicitud <span class="font-semibold">{{ result.request_number }}</span> creada. Te enviamos la cotización (producto + servicio + envío) para que la apruebes — no pagas nada todavía.</p>
          <p class="text-[11.5px] text-green-700 mt-1 flex items-start gap-1.5"><span>🛍️</span><span>Nuestro equipo de compras se pondrá en contacto contigo en breve.</span></p>
          <NuxtLink to="/app/purchase-requests" class="inline-block mt-1.5 text-[11.5px] font-semibold text-green-800 underline active:scale-95 transition-transform">Ver mis solicitudes →</NuxtLink>
        </div>
        <div v-else-if="error" key="err">
          <p class="text-[12px] font-semibold text-red-600 mb-2">{{ error }}</p>
          <button type="button" @click="$emit('confirm')" class="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 active:scale-[.98] text-white text-[13px] font-bold rounded-xl transition-all shadow-sm shadow-primary-500/20">Reintentar</button>
        </div>
        <div v-else key="creating" class="inline-flex items-center gap-2 text-[13px] font-bold text-primary-700">
          <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
          Creando tu solicitud…
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  summary: { type: Object, default: () => ({}) },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  result: { type: Object, default: null }, // { request_number, updated } once created — flips the footer to success in place
})
defineEmits(['confirm', 'edit'])

const items = computed(() => (props.summary?.items || []).map((it) => ({
  name: it.name || it.product_name || 'Producto',
  store: it.store || null,
  price: Number(it.price) || 0,
  quantity: Math.max(1, Number(it.quantity) || 1),
  image: it.image || it.product_image_url || null,
})))
const subtotal = computed(() => items.value.reduce((s, it) => s + it.price * it.quantity, 0))
const commission = computed(() => subtotal.value * 0.15)
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .22s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
