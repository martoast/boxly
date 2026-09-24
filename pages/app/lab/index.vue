<template>
  <section class="min-h-screen bg-gray-50 pb-12">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 pt-8 space-y-5">
      <div>
        <span class="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-full">Boxly Lab · uso interno</span>
        <h1 class="mt-3 text-2xl font-bold text-gray-900">Carritos reales en las tiendas</h1>
        <p class="mt-2 text-gray-600 text-sm max-w-xl">
          Solo para el equipo interno: esta página no aparece en ningún menú y los clientes siguen usando Boxly como siempre. Aquí probamos el flujo
          completo: agregar productos, ver el total real de cada tienda con envío e impuestos a la bodega, pagar la
          factura y que el agente haga la compra.
        </p>
      </div>

      <div v-if="!inLab" class="bg-white rounded-2xl border border-primary-200 p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <p class="text-sm text-gray-700">Tu cuenta todavía no está en el Lab. Al entrar, tu carrito y el agente se activan solo para ti.</p>
        <button type="button" :disabled="joining" class="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold disabled:opacity-60 shrink-0" @click="join">
          {{ joining ? 'Entrando…' : 'Entrar al Lab' }}
        </button>
      </div>
      <p v-if="joinError" class="text-sm text-red-600">{{ joinError }}</p>

      <ol class="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100" :class="{ 'opacity-50 pointer-events-none': !inLab }">
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
import { ref, computed } from 'vue'

// No boxly-lab middleware here: this unlisted page is where an account opts in.
definePageMeta({ layout: 'app', middleware: ['auth', 'customer', 'complete-profile'] })

const user = useState('user')
const inLab = computed(() => !!user.value?.boxly_lab)
const joining = ref(false)
const joinError = ref('')
const { $customFetch } = useNuxtApp()
async function join() {
  joining.value = true; joinError.value = ''
  try {
    const res = await $customFetch('/lab/join', { method: 'POST' })
    if (res?.data?.boxly_lab) user.value = { ...user.value, boxly_lab: true }
  } catch (e) {
    joinError.value = e?.data?.message || 'No pudimos activar el Lab. Intenta de nuevo.'
  } finally { joining.value = false }
}

const steps = [
  { title: 'Busca y agrega productos', body: 'Desde el chat "Buscar con IA" (tiendas del catálogo) o navegando una tienda en vivo. Cada producto va a tu carrito de Boxly y el agente lo agrega al carrito real de la tienda.', to: '/app/search', cta: 'Abrir el chat' },
  { title: 'Revisa tu carrito', body: 'Agrupado por tienda, con el estado de cada producto en la tienda real.', to: '/app/lab/cart', cta: 'Ver carrito' },
  { title: 'Finaliza el pedido', body: 'El agente lleva el carrito al checkout de cada tienda y obtiene el total real (productos, envío e impuestos a nuestra bodega). Tarda unos minutos por tienda.' },
  { title: 'Paga la factura', body: 'Cuando todas las tiendas tienen su total verificado, la factura llega sola (por correo y en tu solicitud de compra).', to: '/app/purchase-requests', cta: 'Mis solicitudes' },
]
</script>
