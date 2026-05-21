<!-- components/user/UserOrderStatusBanner.vue -->
<template>
    <!-- COLLECTING (No Items) -->
    <div v-if="status === 'collecting' && !hasItems" class="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-6 text-white">
      <div class="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
        <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        </div>
        <div class="flex-1">
          <h3 class="text-lg font-semibold">{{ t.collectingNoItemsTitle }}</h3>
          <p class="text-sm text-white/90 mt-1">{{ t.collectingNoItemsDescription }}</p>
        </div>
        <NuxtLink :to="`/app/orders/${order.id}/items`" class="px-6 py-3 bg-white text-primary-600 font-medium rounded-lg hover:bg-gray-50 transition-colors">
          {{ t.addItems }}
        </NuxtLink>
      </div>
    </div>
  
    <!-- COLLECTING (With Items) -->
    <div v-else-if="status === 'collecting' && hasItems" class="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-6 text-white">
      <div class="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
        <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
        </div>
        <div class="flex-1">
          <h3 class="text-lg font-semibold">{{ t.completeOrderTitle }}</h3>
          <p class="text-sm text-white/90 mt-1">{{ t.completeOrderDesc }}</p>
        </div>
        <button @click="$emit('complete')" class="px-6 py-3 bg-white text-primary-600 font-medium rounded-lg hover:bg-gray-50 transition-colors">
          {{ t.completeOrder }}
        </button>
      </div>
    </div>
  
    <!-- PACKAGES COMPLETE / PROCESSING -->
    <div v-else-if="['packages_complete', 'processing'].includes(status)" class="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
      <div class="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
        <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <svg v-if="status === 'processing'" class="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
        </div>
        <div class="flex-1">
          <h3 class="text-lg font-semibold">{{ status === 'processing' ? t.processingTitle : t.packagesCompleteTitle }}</h3>
          <p class="text-sm text-white/90 mt-1">{{ status === 'processing' ? t.processingDescription : t.packagesCompleteDescription }}</p>
        </div>
        <div class="px-6 py-3 bg-white/20 rounded-lg border border-white/30">
          <span class="text-sm font-medium">{{ t.inProgress }}</span>
        </div>
      </div>
    </div>
  
    <!-- SHIPPED (Deposit Pending) -->
    <div v-else-if="status === 'shipped' && !order.deposit_paid_at && order.deposit_payment_link" class="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white shadow-lg">
      <div class="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
        <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
        </div>
        <div class="flex-1">
          <h3 class="text-lg font-bold text-white">{{ t.depositRequiredTitle }}</h3>
          <p class="text-sm text-white/90 mt-1">{{ t.depositRequiredDesc }}</p>
          <p class="text-xl font-bold mt-2">${{ order.deposit_amount }} {{ order.currency?.toUpperCase() }}</p>
        </div>
        <a :href="order.deposit_payment_link" target="_blank" class="px-6 py-3 bg-white text-indigo-700 font-bold rounded-lg hover:bg-indigo-50 transition-colors shadow-md flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
          {{ t.payDeposit }}
        </a>
      </div>
    </div>
  
    <!-- SHIPPED (Deposit Paid) -->
    <div v-else-if="status === 'shipped'" class="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl p-6 text-white">
      <div class="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
        <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
        </div>
        <div class="flex-1">
          <h3 class="text-lg font-semibold">{{ t.shippedTitle }}</h3>
          <p class="text-sm text-white/90 mt-1">{{ t.shippedDescription }}</p>
          <p v-if="order.deposit_paid_at" class="text-xs bg-white/20 inline-block px-2 py-1 rounded mt-2">
            ✅ {{ t.depositPaid }}
          </p>
        </div>
        <div class="px-6 py-3 bg-white/20 rounded-lg border border-white/30">
          <span class="text-sm font-medium">{{ t.inTransit }}</span>
        </div>
      </div>
    </div>
  
    <!-- AWAITING PAYMENT (Final Balance) -->
    <div v-else-if="status === 'awaiting_payment'" class="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
      <div class="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
        <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <div class="flex-1">
          <h3 class="text-lg font-bold text-white">{{ t.finalPaymentTitle }}</h3>
          <p class="text-sm text-white/90 mt-1">{{ t.finalPaymentDesc }}</p>
          <p class="text-xl font-bold mt-2">${{ order.quoted_amount }} {{ order.currency?.toUpperCase() }}</p>
        </div>
        <a v-if="order.payment_link" :href="order.payment_link" target="_blank" class="px-6 py-3 bg-white text-orange-700 font-bold rounded-lg hover:bg-orange-50 transition-colors shadow-md flex items-center gap-2">
          {{ t.payBalance }}
        </a>
      </div>
    </div>
  
    <!-- PAID -->
    <div v-else-if="status === 'paid'" class="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
      <div class="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
        <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <div class="flex-1">
          <h3 class="text-lg font-semibold">{{ t.orderComplete }}</h3>
          <p class="text-sm text-white/90 mt-1">{{ t.orderCompleteDesc }}</p>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { computed } from 'vue'
  const props = defineProps(['order'])
  const { t: createTranslations } = useLanguage()
  
  const status = computed(() => props.order?.status)
  const hasItems = computed(() => props.order?.items?.length > 0)
  
  const translations = {
    collectingNoItemsTitle: { es: "Comienza tu envío", en: "Start Your Shipment" },
    collectingNoItemsDescription: { es: "Agrega los productos que vas a enviar.", en: "Add the products you are going to ship." },
    addItems: { es: "Agregar Artículos", en: "Add Items" },
    completeOrderTitle: { es: "Completa tu Orden", en: "Complete Your Order" },
    completeOrderDesc: { es: "Si ya agregaste todos tus artículos, completa la orden.", en: "If you've added all items, complete the order." },
    completeOrder: { es: "Completar Orden", en: "Complete Order" },
    awaitingPackagesTitle: { es: "Esperando Paquetes", en: "Awaiting Packages" },
    awaitingPackagesDescription: { es: "Estamos esperando tus paquetes en nuestro almacén.", en: "We are waiting for your packages at our warehouse." },
    reopenOrder: { es: "Reabrir Orden", en: "Reopen Order" },
    processingTitle: { es: "Procesando", en: "Processing" },
    processingDescription: { es: "Estamos preparando tu envío.", en: "We are preparing your shipment." },
    packagesCompleteTitle: { es: "Paquetes Recibidos", en: "Packages Received" },
    packagesCompleteDescription: { es: "Tus paquetes han llegado. Pronto iniciaremos el proceso.", en: "Your packages have arrived. We will start processing soon." },
    inProgress: { es: "En Progreso", en: "In Progress" },
    depositRequiredTitle: { es: "¡Orden Enviada! Depósito Requerido", en: "Order Shipped! Deposit Required" },
    depositRequiredDesc: { es: "Tu paquete está en camino. Paga el 50% de depósito para continuar.", en: "Your package is on its way. Pay the 50% deposit to continue." },
    payDeposit: { es: "Pagar Depósito", en: "Pay Deposit" },
    shippedTitle: { es: "En Camino", en: "On Its Way" },
    shippedDescription: { es: "Tu paquete ha sido enviado.", en: "Your package has been shipped." },
    depositPaid: { es: "Depósito Pagado", en: "Deposit Paid" },
    inTransit: { es: "En Tránsito", en: "In Transit" },
    finalPaymentTitle: { es: "Pago Final Requerido", en: "Final Payment Required" },
    finalPaymentDesc: { es: "Tu paquete fue entregado. Paga el saldo restante.", en: "Your package was delivered. Please pay the remaining balance." },
    payBalance: { es: "Pagar Saldo", en: "Pay Balance" },
    orderComplete: { es: "¡Orden Completada!", en: "Order Complete!" },
    orderCompleteDesc: { es: "Gracias por tu pago. Tu orden ha finalizado.", en: "Thank you for your payment. Your order is complete." },
  }
  const t = createTranslations(translations)
  </script>