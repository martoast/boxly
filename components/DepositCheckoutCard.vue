<template>
  <div class="rounded-2xl border border-primary-200 bg-gradient-to-b from-primary-50/70 to-white p-4 max-w-sm shadow-sm">
    <p class="text-[14px] font-extrabold text-primary-900 flex items-center gap-1.5">🏬 Solicitud presencial creada</p>
    <p class="text-[12px] text-gray-500 mt-1">
      Tu solicitud <span v-if="requestNumber" class="font-semibold text-gray-700">{{ requestNumber }}</span> está lista. Paga el depósito para reservar tu visita — se abona a tu compra.
    </p>
    <div v-if="deposit" class="mt-3 rounded-xl bg-white border border-primary-100 px-3 py-2 flex items-center justify-between">
      <span class="text-[12.5px] text-gray-600">Depósito</span>
      <span class="text-[15px] font-extrabold text-gray-900">${{ deposit }} USD</span>
    </div>
    <a v-if="checkoutUrl" :href="checkoutUrl" target="_blank" rel="noopener noreferrer"
      class="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 active:scale-[.98] text-white text-[13px] font-bold rounded-xl transition-all shadow-sm shadow-primary-500/20">
      Pagar depósito
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
    </a>
    <NuxtLink v-else to="/app/purchase-requests" class="mt-3 w-full inline-flex items-center justify-center px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 text-[13px] font-semibold rounded-xl transition">
      Ver mi solicitud
    </NuxtLink>
  </div>
</template>

<script setup>
defineProps({
  checkoutUrl: { type: String, default: '' },
  deposit: { type: [Number, String], default: null },
  requestNumber: { type: String, default: '' },
})
</script>
