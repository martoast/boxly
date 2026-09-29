<template>
  <!-- The Boxly cart: everything the shopper added from the chat or a live store,
       grouped by store. "Finalizar pedido" turns it into one purchase request. -->
  <div class="max-w-4xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-semibold text-gray-900">Mi carrito</h1>
    <p class="mt-1 text-sm text-gray-500">Lo que quieres que Boxly compre por ti, separado por tienda.</p>

    <div v-if="!loaded && !error" class="mt-8 space-y-4" aria-busy="true">
      <div v-for="n in 2" :key="n" class="h-32 rounded-2xl bg-gray-100 animate-pulse" />
    </div>

    <div v-else-if="!loaded && error" role="alert" class="mt-8 border border-red-200 bg-red-50 text-red-700 rounded-xl px-4 py-3 text-sm flex items-center justify-between gap-3">
      <span>{{ error }}</span>
      <button type="button" class="px-3 py-1.5 rounded-lg bg-white border border-red-200 text-red-700 text-xs font-semibold" @click="load({ force: true })">Reintentar</button>
    </div>

    <!-- Empty -->
    <div v-else-if="!groups.length" class="mt-10 text-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12">
      <svg class="w-10 h-10 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
      <p class="mt-3 text-base font-semibold text-gray-900">Tu carrito está vacío</p>
      <p class="mt-1 text-sm text-gray-500">Pídele productos al asistente o navega una tienda en vivo y agrégalos aquí.</p>
      <div class="mt-5 flex flex-col sm:flex-row gap-3 justify-center">
        <NuxtLink to="/app/search" class="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold">Buscar con IA</NuxtLink>
        <NuxtLink to="/app/browse" class="px-4 py-2 rounded-lg border border-gray-300 hover:border-primary-300 text-gray-700 hover:text-primary-700 text-sm font-semibold">Tiendas en vivo</NuxtLink>
      </div>
    </div>

    <template v-else>
      <p v-if="error" role="alert" class="mt-6 border border-red-200 bg-red-50 text-red-700 rounded-xl px-4 py-2.5 text-sm">{{ error }}</p>

      <section v-for="g in groups" :key="g.store_id" class="mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <header class="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50">
          <h2 class="text-sm font-semibold text-gray-900 truncate">{{ g.store_name }}</h2>
          <p class="text-xs text-gray-600 whitespace-nowrap">
            {{ g.item_count }} {{ g.item_count === 1 ? 'producto' : 'productos' }} ·
            <span class="font-semibold text-gray-900">{{ formatUsd(g.subtotal) }}</span>
            <span v-if="g.has_unpriced" class="text-amber-700"> + precio por confirmar</span>
          </p>
        </header>
        <ul class="divide-y divide-gray-100">
          <li v-for="it in g.items" :key="it.id" class="flex gap-3 px-4 py-3" :class="busy[it.id] ? 'opacity-60' : ''">
            <a :href="it.product_url" target="_blank" rel="noopener noreferrer" class="flex-shrink-0">
              <img v-if="it.image_url" :src="it.image_url" alt="" class="w-16 h-16 rounded-lg object-cover bg-gray-100" />
              <span v-else class="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-lg font-semibold" aria-hidden="true">{{ (it.title || '?').slice(0, 1) }}</span>
            </a>
            <div class="min-w-0 flex-1">
              <a :href="it.product_url" target="_blank" rel="noopener noreferrer" class="text-sm font-medium text-gray-900 hover:text-primary-700 line-clamp-2">{{ it.title }}</a>
              <p v-if="variantsText(it.variants)" class="text-xs text-gray-600 mt-0.5">{{ variantsText(it.variants) }}</p>
              <div class="mt-1 flex flex-wrap items-center gap-2">
                <span v-if="cart.sync_enabled" class="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full" :class="chipClass(it.sync_status)" :title="it.sync_note || ''">
                  <span class="w-1.5 h-1.5 rounded-full" :class="dotClass(it.sync_status)" />{{ syncStatusLabel(it.sync_status).label }}
                </span>
                <span v-if="it.sync_note" class="text-[11px] text-gray-500">{{ it.sync_note }}</span>
              </div>
              <div class="mt-2 flex items-center gap-3">
                <div class="inline-flex items-center rounded-lg border border-gray-200" role="group" :aria-label="`Cantidad de ${it.title}`">
                  <button type="button" class="w-8 h-8 text-gray-600 hover:text-gray-900 disabled:opacity-40" :disabled="busy[it.id] || it.quantity <= 1" aria-label="Quitar uno" @click="setQuantity(it, it.quantity - 1)">−</button>
                  <span class="w-8 text-center text-sm font-medium text-gray-900" aria-live="polite">{{ it.quantity }}</span>
                  <button type="button" class="w-8 h-8 text-gray-600 hover:text-gray-900 disabled:opacity-40" :disabled="busy[it.id] || it.quantity >= 20" aria-label="Agregar uno" @click="setQuantity(it, it.quantity + 1)">+</button>
                </div>
                <button type="button" class="text-xs text-gray-500 hover:text-red-600 disabled:opacity-40" :disabled="busy[it.id]" @click="removeItem(it)">Quitar</button>
              </div>
            </div>
            <div class="text-right whitespace-nowrap">
              <p v-if="it.price !== null" class="text-sm font-semibold text-gray-900">{{ formatUsd(it.price * it.quantity) }}</p>
              <p v-else class="text-xs font-medium text-amber-700">Precio por confirmar</p>
              <p v-if="it.price !== null && it.quantity > 1" class="text-[11px] text-gray-500">{{ formatUsd(it.price) }} c/u</p>
            </div>
          </li>
        </ul>
      </section>

      <!-- Summary + finalize -->
      <div class="mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm p-4">
        <div class="flex items-baseline justify-between">
          <span class="text-sm text-gray-600">Subtotal ({{ cart.item_count }} {{ cart.item_count === 1 ? 'producto' : 'productos' }})</span>
          <span class="text-lg font-semibold text-gray-900">{{ formatUsd(cart.subtotal) }}</span>
        </div>
        <p v-if="cart.has_unpriced" class="mt-1 text-xs text-amber-700">Algunos productos tienen precio por confirmar: el subtotal no los incluye. Te confirmamos el total antes de cobrarte.</p>
        <p class="mt-1 text-xs text-gray-500">Precios de las tiendas en USD. La comisión de Boxly y el envío se calculan en tu solicitud de compra.</p>
        <label for="cart-notes" class="block mt-4 text-xs font-medium text-gray-700">Notas para tu pedido (opcional)</label>
        <textarea id="cart-notes" v-model="notes" rows="2" maxlength="1000" class="mt-1 w-full rounded-lg border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500" placeholder="Ej. si no hay mi talla, la siguiente más grande" />
        <p v-if="finalizeError" role="alert" class="mt-2 text-sm text-red-600">{{ finalizeError }}</p>
        <button
          type="button"
          class="mt-4 w-full sm:w-auto px-5 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold disabled:opacity-60"
          :disabled="finalizing || anyBusy"
          @click="onFinalize"
        >
          {{ finalizing ? 'Enviando…' : 'Finalizar pedido' }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { useBoxlyCart } from '../../composables/useBoxlyCart'
import { groupCartItems, syncStatusLabel, variantsText, formatUsd, type CartItem } from '../../utils/boxlyCart'

definePageMeta({ layout: 'app', middleware: ['auth', 'customer', 'complete-profile'] })
useHead({ title: 'Boxly — Mi carrito' })

const { cart, loaded, loading, error, load, update, remove, finalize, pollWhileSyncing } = useBoxlyCart()
const groups = computed(() => groupCartItems(cart.value))
const busy = reactive<Record<string, boolean>>({})
const anyBusy = computed(() => Object.values(busy).some(Boolean))
const notes = ref('')
const finalizing = ref(false)
const finalizeError = ref('')

onMounted(async () => { await load({ force: true }); pollWhileSyncing() })


async function setQuantity(it: CartItem, quantity: number) {
  if (busy[it.id] || quantity < 1 || quantity > 20) return
  busy[it.id] = true
  try { await update(it.id, { quantity }) } catch { /* error shown from the composable */ } finally { busy[it.id] = false }
}
async function removeItem(it: CartItem) {
  if (busy[it.id]) return
  busy[it.id] = true
  try { await remove(it.id) } catch { /* error shown from the composable */ } finally { delete busy[it.id] }
}
async function onFinalize() {
  if (finalizing.value || anyBusy.value) return
  finalizing.value = true; finalizeError.value = ''
  try {
    const r = await finalize(notes.value.trim() || undefined)
    if (r.purchase_request_id == null) throw new Error('no_purchase_request')
    await navigateTo(`/app/purchase-requests/${r.purchase_request_id}`)
  } catch (e: any) {
    finalizeError.value = e?.data?.message || 'No se pudo finalizar tu pedido. Intenta de nuevo.'
    error.value = '' // shown next to the button instead
  } finally { finalizing.value = false }
}

const TONES: Record<string, [string, string]> = {
  amber: ['bg-amber-50 text-amber-800', 'bg-amber-400'],
  blue: ['bg-blue-50 text-blue-700', 'bg-blue-500 animate-pulse'],
  green: ['bg-green-50 text-green-700', 'bg-green-500'],
  red: ['bg-red-50 text-red-700', 'bg-red-500'],
}
const chipClass = (s: string) => TONES[syncStatusLabel(s).tone][0]
const dotClass = (s: string) => TONES[syncStatusLabel(s).tone][1]
</script>
