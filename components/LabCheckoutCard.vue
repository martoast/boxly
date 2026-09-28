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

    <!-- THE FINAL INVOICE (Alex 2026-09-28: "here is your final invoice payment link for all the products they added
         to the box … with the Stripe logo, so it looks very official"): every product, each store's verified
         shipping and tax to the warehouse, the Boxly commission, the total, and Stripe's secure payment. -->
    <div v-if="invoiceReady" class="mt-3 rounded-2xl border border-gray-200 overflow-hidden">
      <div class="px-3.5 pt-3 pb-2.5 bg-gray-50 border-b border-gray-100">
        <div class="flex items-center justify-between gap-2">
          <p class="text-[15px] font-bold text-gray-900">Tu factura final</p>
          <span class="inline-flex items-center gap-1 text-[10px] font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
            <svg viewBox="0 0 20 20" class="w-3 h-3" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 011.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z" clip-rule="evenodd" /></svg>
            Totales verificados
          </span>
        </div>
        <p class="text-[11px] text-gray-500 mt-0.5">{{ requestNumber || request?.request_number }} · todo lo que agregaste a tu caja, con envío e impuestos reales a nuestra bodega en San Diego.</p>
      </div>

      <ul class="px-3.5 py-1 divide-y divide-gray-100">
        <li v-for="it in invoiceItems" :key="it.id" class="py-2 flex items-center gap-2.5">
          <img v-if="it.image" :src="it.image" alt="" class="w-10 h-10 rounded-lg object-cover bg-gray-100 shrink-0" loading="lazy" />
          <div v-else class="w-10 h-10 rounded-lg bg-gray-100 shrink-0" />
          <div class="min-w-0 flex-1">
            <p class="text-[12px] font-semibold text-gray-900 leading-tight line-clamp-2">{{ it.name }}</p>
            <p class="text-[11px] text-gray-500 mt-0.5">{{ [it.options, it.quantity > 1 ? `×${it.quantity}` : ''].filter(Boolean).join(' · ') }}</p>
          </div>
          <p v-if="it.price" class="text-[12px] font-semibold text-gray-900 tabular-nums shrink-0">{{ it.price }}</p>
        </li>
      </ul>

      <div class="px-3.5 py-2.5 border-t border-gray-100 space-y-1 text-[12px]">
        <template v-for="q in billableQuotes" :key="'b' + q.store_id">
          <div class="flex justify-between text-gray-700"><span class="font-semibold">{{ q.store_name || q.store_id }}</span><span class="tabular-nums">{{ formatCents(q.merchandise_cents, q.currency) }}</span></div>
          <div v-if="q.discounts_cents" class="flex justify-between text-gray-500 pl-2"><span>Descuentos</span><span class="tabular-nums">−{{ formatCents(Math.abs(q.discounts_cents), q.currency) }}</span></div>
          <div class="flex justify-between text-gray-500 pl-2"><span>Envío a San Diego</span><span class="tabular-nums">{{ q.shipping_cents ? formatCents(q.shipping_cents, q.currency) : 'Gratis' }}</span></div>
          <div class="flex justify-between text-gray-500 pl-2"><span>Impuestos{{ q.estimated ? ' (estimados por la tienda)' : '' }}</span><span class="tabular-nums">{{ formatCents(q.tax_cents ?? 0, q.currency) }}</span></div>
          <div v-if="q.fees_cents" class="flex justify-between text-gray-500 pl-2"><span>Cargos de la tienda</span><span class="tabular-nums">{{ formatCents(q.fees_cents, q.currency) }}</span></div>
        </template>
        <div v-if="commissionUsd" class="flex justify-between text-gray-700 pt-1"><span class="font-semibold">Comisión Boxly</span><span class="tabular-nums">{{ commissionUsd }}</span></div>
        <div class="flex justify-between items-baseline pt-2 mt-1 border-t border-gray-200">
          <span class="text-[13px] font-bold text-gray-900">Total</span>
          <span class="text-[17px] font-extrabold text-gray-900 tabular-nums">{{ totalUsd }}</span>
        </div>
      </div>

      <div class="px-3.5 pb-3.5">
        <a :href="request.payment_link" target="_blank" rel="noopener" class="flex items-center justify-center gap-2 w-full rounded-xl bg-[#635BFF] hover:bg-[#5249e6] text-white text-sm font-bold py-3 active:scale-[0.98] transition-transform shadow-sm">
          <svg viewBox="0 0 20 20" class="w-4 h-4" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M10 2a4 4 0 00-4 4v2H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-1V6a4 4 0 00-4-4zm2 6V6a2 2 0 10-4 0v2h4z" clip-rule="evenodd" /></svg>
          Pagar {{ totalUsd }}
        </a>
        <div class="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-gray-500">
          <span>Pago seguro con</span>
          <!-- Stripe's wordmark: the invoice and its payment page are Stripe's. -->
          <svg viewBox="0 0 60 25" class="h-[14px] w-auto" role="img" aria-label="Stripe"><path fill="#635BFF" d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 0 1-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.04 1.26-.06 1.48zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.07-2.58-2.08-2.58zM40.95 20.3c-1.44 0-2.32-.6-2.9-1.04l-.02 4.63-4.12.87V5.57h3.76l.08 1.02a4.7 4.7 0 0 1 3.23-1.29c2.9 0 5.62 2.6 5.62 7.4 0 5.23-2.7 7.6-5.65 7.6zM40 8.95c-.95 0-1.54.34-1.97.81l.02 6.12c.4.44.98.78 1.95.78 1.52 0 2.54-1.65 2.54-3.87 0-2.15-1.04-3.84-2.54-3.84zM28.24 5.57h4.13v14.44h-4.13V5.57zm0-4.7L32.37 0v3.36l-4.13.88V.88zm-4.32 9.35v9.79H19.8V5.57h3.7l.12 1.22c1-1.77 3.07-1.41 3.62-1.22v3.79c-.52-.17-2.29-.43-3.32.86zm-8.55 4.72c0 2.43 2.6 1.68 3.12 1.46v3.36c-.55.3-1.54.54-2.89.54a4.15 4.15 0 0 1-4.27-4.24l.01-13.17 4.02-.86v3.54h3.14V9.1h-3.13v5.85zm-4.91.7c0 2.97-2.31 4.66-5.73 4.66a11.2 11.2 0 0 1-4.46-.93v-3.93c1.38.75 3.1 1.31 4.46 1.31.92 0 1.53-.24 1.53-1C6.26 13.77 0 14.51 0 9.95 0 7.04 2.28 5.3 5.62 5.3c1.36 0 2.72.2 4.09.75v3.88a9.23 9.23 0 0 0-4.1-1.06c-.86 0-1.44.25-1.44.9 0 1.85 6.29.97 6.29 5.88z"/></svg>
        </div>
      </div>
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
// The invoice's lines: every product in the request (what the shopper put in the box), its options and price.
const money = (n: any) => { const v = Number(n); return Number.isFinite(v) && v > 0 ? `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '' }
const invoiceItems = computed(() => (request.value?.items ?? []).map((it: any) => {
  const opts = it.options && typeof it.options === 'object' ? Object.values(it.options).filter((v) => typeof v === 'string' && v.trim()).join(' · ') : ''
  const qty = Math.max(1, Number(it.quantity) || 1)
  return { id: it.id, name: it.product_name || 'Producto', image: it.image_full_url || it.product_image_url || null, options: opts, quantity: qty, price: money((Number(it.price) || 0) * qty) }
}))
const billableQuotes = computed(() => quotes.value.filter((q) => billable(q)))
// Boxly's commission is what the invoice adds on top of the stores' verified totals.
const commissionUsd = computed(() => {
  const stores = billableQuotes.value.reduce((sum, q) => sum + (q.total_cents || 0), 0) / 100
  const total = Number(request.value?.total_amount)
  return Number.isFinite(total) && total - stores > 0.004 ? money(total - stores) : ''
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
