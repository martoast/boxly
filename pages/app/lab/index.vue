<template>
  <section class="min-h-screen bg-gray-50 pb-12">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 pt-8 space-y-5">
      <div>
        <span class="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-full">Boxly Lab · uso interno</span>
        <h1 class="mt-3 text-2xl font-bold text-gray-900">Carritos reales en las tiendas</h1>
        <p class="mt-2 text-gray-600 text-sm max-w-xl">
          Solo lo ven los testers internos. Los clientes siguen usando Boxly como siempre. Aquí probamos el flujo
          completo: agregar productos, ver el total real de cada tienda con envío e impuestos a la bodega, pagar la
          factura y que el agente haga la compra.
        </p>
      </div>

      <ol class="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
        <li v-for="(step, i) in steps" :key="i" class="p-4 flex gap-3">
          <span class="w-6 h-6 rounded-full bg-primary-600 text-white text-xs font-bold inline-flex items-center justify-center shrink-0">{{ i + 1 }}</span>
          <div class="min-w-0">
            <div class="font-semibold text-gray-900 text-sm">{{ step.title }}</div>
            <p class="text-xs text-gray-500 mt-0.5">{{ step.body }}</p>
            <NuxtLink v-if="step.to" :to="step.to" class="inline-block mt-2 text-xs font-semibold text-primary-700 hover:text-primary-800">{{ step.cta }} →</NuxtLink>
          </div>
        </li>
      </ol>

      <p class="text-xs text-gray-500">
        Pagos reales: usa pedidos pequeños. ¿Algo raro o confuso? Anótalo y compártelo con el equipo; es justo lo que
        queremos aprender.
      </p>
    </div>
  </section>
</template>

<script setup>
definePageMeta({ layout: 'app', middleware: ['auth', 'customer', 'complete-profile', 'boxly-lab'] })

const steps = [
  { title: 'Busca y agrega productos', body: 'Desde el chat "Buscar con IA" (tiendas del catálogo) o navegando una tienda en vivo. Cada producto va a tu carrito de Boxly y el agente lo agrega al carrito real de la tienda.', to: '/app/search', cta: 'Abrir el chat' },
  { title: 'Revisa tu carrito', body: 'Agrupado por tienda, con el estado de cada producto en la tienda real.', to: '/app/lab/cart', cta: 'Ver carrito' },
  { title: 'Finaliza el pedido', body: 'El agente lleva el carrito al checkout de cada tienda y obtiene el total real (productos, envío e impuestos a nuestra bodega). Tarda unos minutos por tienda.' },
  { title: 'Paga la factura', body: 'Cuando todas las tiendas tienen su total verificado, la factura llega sola (por correo y en tu solicitud de compra).', to: '/app/purchase-requests', cta: 'Mis solicitudes' },
]
</script>
