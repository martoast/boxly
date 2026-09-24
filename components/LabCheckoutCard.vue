<template>
  <!-- Boxly Lab: the order placed from the chat box (finalize_lab_order). The agent fills each store's real cart
       and checks out to the warehouse; this card follows it — which store it is on (watch it live), each
       store's real total, then the automatic invoice with Pagar. Everything stays in the thread. -->
  <div class="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 max-w-sm w-full">
    <div class="flex items-center justify-between gap-2">
      <p class="text-sm font-bold text-gray-900">Tu pedido<span v-if="requestNumber" class="font-medium text-gray-500"> · {{ requestNumber }}</span></p>
      <span v-if="working" class="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full">
        <span class="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" aria-hidden="true" />Trabajando
      </span>
    </div>
    <p v-if="working" class="text-xs text-gray-500 mt-1">El agente llena tu carrito en cada tienda y hace el checkout a nuestra bodega en San Diego para sacar el total real. Tarda unos minutos por tienda.</p>

    <ul class="mt-3 divide-y divide-gray-100">
      <li v-for="q in quotes" :key="q.store_id" class="py-2.5">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="text-[13px] font-semibold text-gray-900 truncate">{{ q.store_name || q.store_id }}</div>
            <div class="text-[11px] mt-0.5" :class="statusClass(q)">{{ storeQuoteLabel(q) }}</div>
          </div>
          <div v-if="billable(q)" class="text-right shrink-0 text-[13px] font-bold text-gray-900 tabular-nums">{{ formatCents(q.total_cents, q.currency) }}</div>
          <button v-else-if="q.live_session_id" type="button" class="shrink-0 inline-flex items-center gap-1.5 text-[12px] font-semibold text-primary-700 active:scale-95 transition-transform" @click="$emit('watch', sessionOf(q))">
            <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse" aria-hidden="true" />Ver en vivo
          </button>
        </div>
      </li>
      <li v-if="!quotes.length" class="py-2.5 text-[12px] text-gray-500">{{ loadError ? 'No pudimos cargar tu pedido.' : 'Preparando…' }}</li>
    </ul>

    <div v-if="invoiceReady" class="mt-3 rounded-xl bg-green-50 border border-green-200 p-3">
      <p class="text-sm font-bold text-green-800">Tu factura está lista</p>
      <p class="text-xs text-green-700 mt-0.5">Total <span class="font-bold tabular-nums">{{ totalUsd }}</span> — incluye envío e impuestos de cada tienda a San Diego y la comisión Boxly.</p>
      <a :href="request.payment_link" target="_blank" rel="noopener" class="mt-2 flex items-center justify-center w-full rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-2.5 active:scale-[0.98] transition-transform">Pagar</a>
    </div>
    <p v-else-if="paid" class="mt-3 text-sm font-semibold text-green-700">Pagado ✓ — compramos tus productos y te avisamos.</p>
    <p v-else-if="settledWithoutInvoice && waitingInvoice" class="mt-3 text-xs text-gray-600">Preparando tu factura…</p>
    <p v-else-if="settledWithoutInvoice" class="mt-3 text-xs text-gray-600">Nuestro equipo revisa tu pedido y te envía la factura por WhatsApp.</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { formatCents, quoteInFlight, storeQuoteLabel, type StoreQuote } from '~/utils/storeQuotes'

const props = defineProps<{ purchaseRequestId: number, requestNumber?: string | null }>()
const emit = defineEmits<{ (e: 'watch', session: any): void, (e: 'live', session: any): void }>()

const { $customFetch } = useNuxtApp() as any
const request = ref<any>(null)
const loadError = ref(false)
// Once every store settled, the invoice follows within seconds (Stripe); a request still unquoted after ~1 min
// went to the team's manual quote.
const settledPolls = ref(0)
const SETTLED_POLLS = 8
let errors = 0
let timer: any = null
let stopped = false

const quotes = computed<StoreQuote[]>(() => request.value?.store_quotes ?? [])
const status = computed(() => request.value?.status ?? null)
const working = computed(() => !request.value || (status.value === 'pending_review' && (!quotes.value.length || quotes.value.some(quoteInFlight))))
const invoiceReady = computed(() => status.value === 'quoted' && !!request.value?.payment_link)
const paid = computed(() => ['paid', 'purchased'].includes(status.value))
const settledWithoutInvoice = computed(() => status.value === 'pending_review' && quotes.value.length > 0 && !quotes.value.some(quoteInFlight))
const waitingInvoice = computed(() => settledPolls.value < SETTLED_POLLS)
const totalUsd = computed(() => {
  const n = Number(request.value?.total_amount)
  return Number.isFinite(n) && n > 0 ? `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD` : ''
})
const billable = (q: StoreQuote) => (q.status === 'verified' || q.status === 'partial') && typeof q.total_cents === 'number'
const statusClass = (q: StoreQuote) => quoteInFlight(q) ? 'text-primary-600' : q.status === 'verified' ? 'text-green-600' : q.status === 'partial' ? 'text-amber-600' : 'text-gray-500'
const sessionOf = (q: StoreQuote) => ({ id: q.live_session_id, store_id: q.store_id, store_name: q.store_name, status: 'running', note: 'El agente llena tu carrito y hace el checkout' })

// The store the agent is on right now → the chat shows its browser (the live card / split view).
const running = computed(() => quotes.value.find((q) => q.live_session_id) || null)
watch(() => running.value?.live_session_id ?? null, () => emit('live', running.value ? sessionOf(running.value) : null))

async function load() {
  try {
    const r = await $customFetch(`/purchase-requests/${props.purchaseRequestId}`)
    request.value = r?.data ?? r
    loadError.value = false
    errors = 0
  } catch { errors++; loadError.value = !request.value }
  if (stopped || errors >= 5) return
  if (settledWithoutInvoice.value) settledPolls.value++
  // Poll while the agent works, then a little longer for the invoice (it goes out right after the last store settles).
  const more = !request.value || working.value || (settledWithoutInvoice.value && waitingInvoice.value)
  if (more) timer = setTimeout(load, working.value ? 4000 : 8000)
}
onMounted(load)
onBeforeUnmount(() => { stopped = true; clearTimeout(timer); if (running.value) emit('live', null) })
</script>
