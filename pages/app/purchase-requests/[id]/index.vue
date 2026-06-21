<template>
  <section class="min-h-screen bg-gray-50 pb-12">
    <!-- Header -->
    <div class="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 py-4">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-4 min-w-0">
            <NuxtLink to="/app/purchase-requests" class="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
              <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </NuxtLink>
            <div class="min-w-0">
              <h1 class="text-xl font-bold text-gray-900 truncate">{{ request?.request_number || 'Loading...' }}</h1>
              <p class="text-xs text-gray-500">{{ formatDate(request?.created_at) }}</p>
            </div>
          </div>

          <div v-if="request" class="flex items-center gap-3 flex-shrink-0">
            <!-- Edit only for online PRs in pending_review — in-person PRs aren't editable through that form -->
            <NuxtLink
              v-if="request.status === 'pending_review' && request.source !== 'in_person'"
              :to="`/app/purchase-requests/${request.id}/edit`"
              class="px-3 py-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors flex items-center gap-2 border border-transparent hover:border-primary-200"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              <span class="hidden sm:inline">{{ t.editRequest }}</span>
              <span class="sm:hidden">{{ t.edit }}</span>
            </NuxtLink>

            <span :class="['px-3 py-1 rounded-full text-xs font-semibold border', getStatusColor(request.status)]">
              {{ getStatusLabel(request.status) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-20">
      <div class="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
    </div>

    <!-- Content -->
    <div v-else-if="request" class="max-w-5xl mx-auto px-4 sm:px-6 mt-6 space-y-5 animate-fadeIn">

      <!-- Awaiting-deposit banner (in-person only) — the big Pay CTA -->
      <div
        v-if="request.source === 'in_person' && request.status === 'awaiting_deposit'"
        class="bg-primary-600 rounded-2xl p-6 sm:p-7 text-white relative overflow-hidden"
      >
        <div class="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div class="min-w-0">
            <h2 class="text-xl sm:text-2xl font-bold">{{ t.depositPending }}</h2>
            <p class="text-white/85 mt-1 text-sm sm:text-base">{{ t.depositPendingDesc }}</p>
            <div class="mt-3 text-3xl font-extrabold">${{ Number(request.deposit_amount_usd ?? 0).toFixed(2) }} <span class="text-base font-medium text-white/75">USD</span></div>
          </div>
          <button
            @click="payDeposit"
            :disabled="payingDeposit"
            class="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-primary-700 hover:bg-primary-50 px-7 py-4 rounded-xl font-bold shadow-md transition-colors disabled:opacity-60 flex-shrink-0"
          >
            <span v-if="payingDeposit" class="w-4 h-4 border-2 border-primary-300 border-t-primary-700 rounded-full animate-spin"></span>
            {{ payingDeposit ? t.depositRedirecting : t.depositPay }}
          </button>
        </div>
      </div>

      <!-- Standard banners (apply to both flows once the PR is past awaiting_deposit) -->

      <!-- QUOTED — Stripe -->
      <div
        v-if="request.status === 'quoted' && request.payment_method === 'stripe'"
        class="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl shadow-md p-6 sm:p-7 text-white"
      >
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div class="min-w-0">
            <h2 class="text-xl sm:text-2xl font-bold">{{ t.quoteReady }}</h2>
            <p class="text-white/85 mt-1 max-w-lg text-sm sm:text-base">{{ t.quoteReadyDesc }}</p>
            <div class="mt-3 text-3xl font-extrabold">${{ request.total_amount }} <span class="text-base font-medium text-white/75">USD</span></div>
            <p class="text-xs text-white/70 mt-1">{{ t.includesFees }}</p>
          </div>
          <a
            :href="request.payment_link"
            target="_blank"
            class="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-primary-700 hover:bg-primary-50 px-7 py-4 rounded-xl font-bold shadow-md transition-colors flex-shrink-0"
          >
            {{ t.payNow }}
          </a>
        </div>
      </div>

      <!-- QUOTED — manual deposit (NU Bank) — only relevant to online flow, keeps old behaviour -->
      <div
        v-if="request.status === 'quoted' && request.payment_method === 'manual_deposit'"
        class="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl shadow-md p-6 sm:p-7 text-white"
      >
        <h2 class="text-xl sm:text-2xl font-bold mb-2">{{ t.quoteReady }}</h2>
        <p class="text-purple-200 mb-4">{{ t.bankTransferRequired }}</p>
        <div class="text-3xl font-extrabold mb-5">${{ request.total_amount }} USD</div>
        <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/15 space-y-2 text-sm">
          <div class="flex items-center justify-between"><span class="opacity-80">{{ t.bankName }}</span><span class="font-semibold">NU Bank (NUVO)</span></div>
          <div class="flex items-center justify-between"><span class="opacity-80">{{ t.accountClabe }}</span><span class="font-mono font-semibold">{{ accountNumber }}</span></div>
        </div>
        <a :href="`mailto:support@boxly.com?subject=Payment%20Proof%20-%20${request.request_number}`" class="mt-5 inline-flex items-center justify-center gap-2 bg-white text-purple-700 hover:bg-purple-50 px-5 py-2.5 rounded-xl font-semibold text-sm">{{ t.sendPaymentProof }}</a>
      </div>

      <!-- PAID -->
      <div v-if="request.status === 'paid'" class="bg-primary-50 border border-primary-200 rounded-2xl p-5 flex gap-4 items-start">
        <div class="p-2 bg-primary-100 rounded-full text-primary-600 shrink-0">
          <svg class="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <div>
          <h3 class="font-bold text-primary-900">{{ t.paidTitle }}</h3>
          <p class="text-primary-700 text-sm mt-0.5">{{ t.paidDesc }}</p>
        </div>
      </div>

      <!-- PURCHASED -->
      <div v-if="request.status === 'purchased'" class="bg-green-50 border border-green-200 rounded-2xl p-5 flex gap-4 items-start">
        <div class="p-2 bg-green-100 rounded-full text-green-600 shrink-0">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
        </div>
        <div>
          <h3 class="font-bold text-green-900">{{ t.purchasedTitle }}</h3>
          <p class="text-green-700 text-sm mt-0.5">{{ t.purchasedDesc }}</p>
          <NuxtLink to="/app/orders" class="inline-flex items-center gap-1 text-green-800 font-medium mt-2 text-sm hover:underline">{{ t.goToOrders }} →</NuxtLink>
        </div>
      </div>

      <!-- REJECTED -->
      <div v-if="request.status === 'rejected'" class="bg-red-50 border border-red-200 rounded-2xl p-5">
        <h3 class="font-bold text-red-900">{{ t.requestRejected }}</h3>
        <p class="text-red-700 text-sm mt-1">{{ request.admin_notes || t.noReason }}</p>
      </div>

      <!-- Progress timeline — clear steps for the online assisted purchase -->
      <PurchaseRequestTimeline v-if="request.source !== 'in_person'" :request="request" />

      <!-- ============================================================ -->
      <!-- IN-PERSON LAYOUT — trip + per-store categories + wishlist     -->
      <!-- ============================================================ -->
      <template v-if="request.source === 'in_person'">
        <!-- Confirmed banner once the deposit cleared (status moved off awaiting_deposit) -->
        <div
          v-if="request.status === 'pending_review' && request.deposit_paid_at"
          class="bg-green-50 border border-green-200 rounded-2xl p-5 flex gap-4 items-start"
        >
          <div class="p-2 bg-green-100 rounded-full text-green-600 shrink-0">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
          </div>
          <div>
            <h3 class="font-bold text-green-900">{{ t.confirmedTitle }}</h3>
            <p class="text-green-700 text-sm mt-0.5">{{ t.confirmedDesc }}</p>
          </div>
        </div>

        <!-- Trip card -->
        <div v-if="request.shopping_trip" class="bg-white rounded-2xl border border-gray-200 p-5">
          <div class="text-xs uppercase tracking-wider text-gray-500 font-semibold">{{ t.tripLabel }}</div>
          <div class="mt-1 text-lg font-bold text-gray-900">{{ formatTripDate(request.shopping_trip.trip_date) }}</div>
          <div class="text-sm text-gray-500 mt-0.5">{{ request.shopping_trip.location }}</div>
        </div>

        <!-- Stores + per-store categories -->
        <div v-if="request.in_person_breakdown?.length" class="bg-white rounded-2xl border border-gray-200 p-5">
          <div class="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3">
            {{ t.storesLabel }} ({{ request.in_person_breakdown.length }})
          </div>
          <div class="space-y-2">
            <div
              v-for="row in request.in_person_breakdown"
              :key="row.store_id"
              class="border border-gray-200 rounded-xl p-3"
            >
              <div class="font-semibold text-gray-900 text-sm">{{ row.store_name }}</div>
              <div class="mt-1.5 text-xs">
                <template v-if="row.category_names.length">
                  <span
                    v-for="(name, i) in row.category_names"
                    :key="i"
                    class="inline-block mr-1 mt-0.5 px-2 py-0.5 bg-primary-50 text-primary-700 rounded"
                  >{{ name }}</span>
                </template>
                <span v-else class="text-gray-400 italic">{{ t.anyCategory }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Budget + notes -->
        <div class="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
          <div class="flex justify-between items-baseline">
            <span class="text-sm text-gray-500">{{ t.budgetLabel }}</span>
            <span class="text-base font-bold text-gray-900">${{ Number(request.minimum_budget_usd ?? 0).toFixed(2) }} USD</span>
          </div>
          <div v-if="request.customer_notes" class="pt-3 border-t border-gray-100">
            <div class="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">{{ t.notesLabel }}</div>
            <p class="text-sm text-gray-800 whitespace-pre-wrap">{{ request.customer_notes }}</p>
          </div>
        </div>

        <!-- Wishlist items — only "things to look for" framing, not a confirmed cart -->
        <div v-if="request.items?.length" class="bg-white rounded-2xl border border-gray-200 p-5">
          <div class="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3">
            {{ t.wishlistLabel }} ({{ request.items.length }})
          </div>
          <ul class="divide-y divide-gray-100">
            <li v-for="item in request.items" :key="item.id" class="py-3 first:pt-0 last:pb-0 flex gap-3 items-start">
              <div class="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                <img v-if="item.image_full_url" :src="item.image_full_url" class="w-full h-full object-cover" alt="">
                <svg v-else class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01"/></svg>
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-gray-900">{{ item.product_name }}</div>
                <a v-if="item.product_url" :href="item.product_url" target="_blank" class="text-xs text-primary-600 hover:underline">
                  {{ truncateUrl(item.product_url) }}
                </a>
                <div v-if="item.notes" class="text-xs text-gray-500 italic mt-1">"{{ item.notes }}"</div>
              </div>
            </li>
          </ul>
        </div>

        <!-- What happens next -->
        <div class="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-600 leading-relaxed">
          {{ t.inPersonWhatsNext }}
        </div>
      </template>

      <!-- ============================================================ -->
      <!-- ONLINE LAYOUT — original items list + cost summary sidebar    -->
      <!-- ============================================================ -->
      <div v-else class="grid md:grid-cols-3 gap-6">
        <div class="md:col-span-2 space-y-6">
          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 class="font-semibold text-gray-900">{{ t.requestedItems }}</h3>
            </div>
            <div class="divide-y divide-gray-100">
              <div v-for="item in request.items" :key="item.id" class="p-6 hover:bg-gray-50 transition-colors">
                <div class="flex gap-4 items-start">
                  <a v-if="item.image_full_url" :href="item.image_full_url" target="_blank" class="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                    <img :src="item.image_full_url" class="w-full h-full object-cover" alt="">
                  </a>
                  <div v-else class="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 border border-gray-200">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <h4 class="font-medium text-gray-900 text-lg leading-snug">{{ item.product_name }}</h4>
                    <a :href="item.product_url" target="_blank" class="text-sm text-primary-600 hover:underline flex items-center gap-1 mt-1 mb-3 w-fit">
                      {{ truncateUrl(item.product_url) }}
                    </a>
                    <div class="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div class="bg-gray-50 p-2 rounded-lg">
                        <span class="text-gray-500 block text-xs uppercase tracking-wide">{{ t.price }}</span>
                        <span class="font-semibold text-gray-900">${{ item.price }}</span>
                      </div>
                      <div class="bg-gray-50 p-2 rounded-lg">
                        <span class="text-gray-500 block text-xs uppercase tracking-wide">{{ t.quantity }}</span>
                        <span class="font-semibold text-gray-900">{{ item.quantity }}</span>
                      </div>
                    </div>
                    <div v-if="item.options && Object.keys(item.options).length > 0" class="flex flex-wrap gap-2 mb-2">
                      <span v-for="(val, key) in item.options" :key="key" class="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100"><strong>{{ key }}:</strong> {{ val }}</span>
                    </div>
                    <div v-if="item.notes" class="mt-2 text-sm bg-yellow-50 text-yellow-800 p-3 rounded-lg border border-yellow-100">
                      <span class="font-medium block text-xs uppercase tracking-wide mb-1 text-yellow-600">{{ t.notes }}</span>
                      {{ item.notes }}
                    </div>
                    <!-- Stock-check badge: only meaningful for store/assisted PRs. Hide on in-person (the wishlist branch above renders without it). -->
                    <div v-if="item.stock_status && item.stock_status !== 'unverified' && item.stock_status !== 'wishlist'" class="mt-2">
                      <span :class="['inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border', item.stock_status === 'available' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200']">
                        {{ item.stock_status === 'available' ? 'Disponible' : 'No disponible' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Cost sidebar -->
        <div class="md:col-span-1">
          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-24">
            <h3 class="font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">{{ t.summary }}</h3>
            <div class="space-y-3 text-sm">
              <div class="flex justify-between text-gray-600">
                <span>{{ t.merchandise }}</span>
                <span>${{ request.items_total || request.items.reduce((a,b)=>a+(b.price*b.quantity),0).toFixed(2) }}</span>
              </div>
              <div v-if="request.status !== 'pending_review'" class="space-y-3 pt-3 border-t border-dashed border-gray-200">
                <div class="flex justify-between text-gray-600"><span>{{ t.shipping }}</span><span>${{ request.shipping_cost || '0.00' }}</span></div>
                <div class="flex justify-between text-gray-600"><span>{{ t.tax }}</span><span>${{ request.sales_tax || '0.00' }}</span></div>
                <div class="flex justify-between text-gray-600"><span>{{ t.fee }} (10%)</span><span>${{ request.processing_fee || '0.00' }}</span></div>
              </div>
              <div v-if="request.status !== 'pending_review'" class="pt-4 mt-4 border-t border-gray-200 flex justify-between font-bold text-lg text-gray-900">
                <span>{{ t.total }}</span>
                <span>${{ request.total_amount }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue';

definePageMeta({
  layout: 'app',
  middleware: ['auth', 'customer', 'complete-profile'],
});

const route = useRoute();
const { $customFetch, $toast } = useNuxtApp();
const { t: createTranslations } = useLanguage();
const user = useUser().value;

const translations = {
  // Banners
  depositPending:     { es: 'Pago de reserva pendiente', en: 'Booking deposit pending' },
  depositPendingDesc: { es: 'Tu visita al outlet sólo queda confirmada cuando pagues la reserva. Las fechas se llenan rápido.', en: 'Your outlet visit is only locked in once you pay the deposit. Dates fill up fast.' },
  depositPay:         { es: 'Pagar reserva', en: 'Pay deposit' },
  depositRedirecting: { es: 'Redirigiendo…', en: 'Redirecting…' },
  confirmedTitle:     { es: '¡Reserva confirmada!', en: 'Booking confirmed!' },
  confirmedDesc:      { es: 'Pagaste tu reserva. Vamos a Las Américas en la fecha que elegiste y te enviamos la cuenta final con la mercancía después.', en: "You paid your deposit. We'll visit Las Americas on your chosen date and send the final bill with the merchandise after." },

  quoteReady:    { es: '¡Tu cotización está lista!', en: 'Your quote is ready!' },
  quoteReadyDesc:{ es: 'Hemos revisado tu solicitud y calculado todos los costos. Realiza el pago para que procedamos.', en: 'We reviewed your request and calculated all costs. Pay to continue.' },
  includesFees:  { es: 'Incluye envío al almacén, impuestos y tarifa de servicio.', en: 'Includes warehouse shipping, taxes, and service fee.' },
  payNow:        { es: 'Pagar ahora', en: 'Pay now' },
  bankTransferRequired:{ es: 'Pago por transferencia bancaria', en: 'Bank transfer required' },
  bankName:      { es: 'Banco', en: 'Bank' },
  accountClabe:  { es: 'Cuenta / CLABE', en: 'Account / CLABE' },
  sendPaymentProof:{ es: 'Enviar comprobante', en: 'Send payment proof' },

  paidTitle:     { es: '¡Pago recibido!', en: 'Payment received!' },
  paidDesc:      { es: 'Estamos procesando tu compra. Te avisamos cuando esté lista.', en: 'Processing your purchase. We will notify you when ready.' },
  purchasedTitle:{ es: '¡Compra realizada!', en: 'Purchase complete!' },
  purchasedDesc: { es: 'Tus artículos están en camino al almacén. Pasarán a tu lista de envíos.', en: 'Your items are heading to the warehouse. They will move to your shipments list.' },
  goToOrders:    { es: 'Ir a mis envíos', en: 'Go to my shipments' },
  requestRejected:{ es: 'Solicitud rechazada', en: 'Request rejected' },
  noReason:      { es: 'No se especificó razón.', en: 'No reason specified.' },

  // In-person specific labels
  tripLabel:        { es: 'Fecha de la visita', en: 'Visit date' },
  storesLabel:      { es: 'Tiendas a visitar', en: 'Stores to visit' },
  anyCategory:      { es: 'Cualquier categoría', en: 'Any category' },
  budgetLabel:      { es: 'Presupuesto mínimo', en: 'Minimum budget' },
  notesLabel:       { es: 'Notas para el equipo', en: 'Notes for the team' },
  wishlistLabel:    { es: 'Lista de deseos', en: 'Wishlist' },
  inPersonWhatsNext:{ es: 'Después de la visita revisamos lo que conseguimos y te enviamos una cotización final con la mercancía, el envío al almacén y el 10% de servicio. La reserva ya está cubierta.', en: 'After the trip we review what we found and send you a final quote with the merchandise, warehouse shipping, and 10% service fee. The deposit is already covered.' },

  // Online layout labels
  editRequest:   { es: 'Editar', en: 'Edit' },
  edit:          { es: 'Editar', en: 'Edit' },
  requestedItems:{ es: 'Artículos solicitados', en: 'Requested items' },
  price:         { es: 'Precio', en: 'Price' },
  quantity:      { es: 'Cant.', en: 'Qty' },
  notes:         { es: 'Notas', en: 'Notes' },
  summary:       { es: 'Resumen de costos', en: 'Cost summary' },
  merchandise:   { es: 'Mercancía', en: 'Merchandise' },
  shipping:      { es: 'Envío (USA)', en: 'Shipping (USA)' },
  tax:           { es: 'Impuestos (USA)', en: 'Sales tax' },
  fee:           { es: 'Tarifa de servicio', en: 'Service fee' },
  total:         { es: 'Total (USD)', en: 'Total (USD)' },

  // Status labels
  pending_review:    { es: 'Pendiente de revisión', en: 'Pending review' },
  quoted:            { es: 'Cotizado', en: 'Quoted' },
  paid:              { es: 'Pagado', en: 'Paid' },
  purchased:         { es: 'Comprado', en: 'Purchased' },
  rejected:          { es: 'Rechazado', en: 'Rejected' },
  cancelled:         { es: 'Cancelado', en: 'Cancelled' },
  awaiting_deposit:  { es: 'Pago pendiente', en: 'Awaiting deposit' },
};

const t = createTranslations(translations);
const request = ref(null);
const loading = ref(true);
const payingDeposit = ref(false);

const accountNumber = '1234567890123456';

const fetchRequest = async () => {
  loading.value = true;
  try {
    const response = await $customFetch(`/purchase-requests/${route.params.id}`);
    request.value = response.data || response;
  } catch (e) {
    console.error('Error fetching request:', e);
  } finally {
    loading.value = false;
  }
};

const payDeposit = async () => {
  if (!request.value || payingDeposit.value) return;
  payingDeposit.value = true;
  try {
    const res = await $customFetch(`/purchase-requests/${request.value.id}/deposit-checkout`, {
      method: 'POST',
    });
    if (res?.checkout_url) {
      window.location.href = res.checkout_url;
      return;
    }
    $toast.error('No se pudo iniciar el pago. Intenta de nuevo.');
  } catch (e) {
    console.error('Failed to start deposit checkout:', e);
    $toast.error(e?.data?.message ?? 'No se pudo iniciar el pago.');
  } finally {
    payingDeposit.value = false;
  }
};

const getStatusColor = (status) => ({
  pending_review:   'bg-yellow-50 text-yellow-700 border-yellow-200',
  quoted:           'bg-blue-50 text-blue-700 border-blue-200',
  paid:             'bg-primary-50 text-primary-700 border-primary-200',
  purchased:        'bg-green-50 text-green-700 border-green-200',
  rejected:         'bg-red-50 text-red-700 border-red-200',
  cancelled:        'bg-gray-50 text-gray-700 border-gray-200',
  awaiting_deposit: 'bg-amber-50 text-amber-700 border-amber-200',
})[status] || 'bg-gray-50 text-gray-600';

const getStatusLabel = (status) => t.value[status] || status;

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString(user?.preferred_language === 'es' ? 'es-MX' : 'en-US', {
    month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const formatTripDate = (d) => {
  if (!d) return '';
  const datePart = String(d).substring(0, 10);
  const dt = new Date(datePart + 'T12:00');
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString(user?.preferred_language === 'es' ? 'es-MX' : 'en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
};

const truncateUrl = (url) => {
  try {
    let safeUrl = url;
    if (!safeUrl.match(/^https?:\/\//i)) safeUrl = 'https://' + safeUrl;
    return new URL(safeUrl).hostname.replace('www.', '');
  } catch {
    return 'Link';
  }
};

onMounted(() => {
  fetchRequest();
});
</script>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-fadeIn { animation: fadeIn 0.4s ease-out; }
</style>
