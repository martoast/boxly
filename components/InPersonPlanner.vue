<template>
  <!-- Chat card for in-person shopping: the day/hour booking lives on /in-person. -->
  <div class="rounded-2xl border border-primary-200 bg-white p-4 max-w-md shadow-sm">
    <div class="flex items-center gap-2 mb-2">
      <span class="text-lg">🏬</span>
      <p class="text-[14px] font-extrabold text-primary-900">Compras presenciales — Las Américas</p>
    </div>
    <p class="text-[12px] text-gray-500 mb-3">Tu shopper va por ti a los outlets de San Diego. Elige el día y la hora y paga $30 USD para apartar tu horario.</p>
    <NuxtLink to="/in-person" class="w-full inline-flex items-center justify-center px-4 py-2.5 bg-primary-500 hover:bg-primary-600 active:scale-[.98] text-white text-[13px] font-bold rounded-xl transition-all shadow-sm shadow-primary-500/20">
      Reserva tu horario
    </NuxtLink>
  </div>
</template>
