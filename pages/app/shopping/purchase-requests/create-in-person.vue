<template>
  <section class="min-h-screen bg-gray-50 pb-20">
    <!-- Sticky Header -->
    <div class="bg-white border-b border-gray-200 sticky top-14 md:top-0 z-30 shadow-sm">
      <div class="max-w-3xl mx-auto px-4 py-3 sm:py-4">
        <div class="flex items-center gap-3">
          <NuxtLink to="/app/shopping/purchase-requests" class="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
          </NuxtLink>
          <div class="flex-1">
            <h1 class="text-lg sm:text-xl font-semibold text-gray-900">Nueva visita en persona</h1>
            <p class="text-xs text-gray-500">Paso 1 de 2 — reserva de ${{ feeLabel }} USD por tienda</p>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-3xl mx-auto px-4 py-6 space-y-6">

      <!-- ── Result: the link to send ───────────────────────────────── -->
      <div v-if="created" class="bg-white rounded-xl shadow-sm border-2 border-emerald-200 p-6 animate-fadeIn">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <svg class="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
          </div>
          <div class="min-w-0 flex-1">
            <h2 class="text-lg font-bold text-gray-900">
              {{ created.payment_link ? 'Visita creada' : 'Visita registrada' }} — {{ created.request_number }}
            </h2>
            <p v-if="created.payment_link" class="text-sm text-gray-500 mt-0.5">
              Envía este link a {{ created.customerName }}. En cuanto lo pague, la solicitud pasa sola a
              <span class="font-medium text-gray-700">pendiente de revisión</span> y la visita queda apartada.
            </p>
            <p v-else class="text-sm text-gray-500 mt-0.5">
              Guardada como <span class="font-medium text-gray-700">{{ statusLabel(created.status) }}</span>.
              No se generó ningún cobro y no se envió ningún correo.
            </p>

            <div v-if="created.payment_link" class="mt-4 flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <input :value="created.payment_link" readonly class="flex-1 bg-transparent text-sm text-gray-700 truncate focus:outline-none" />
              <button
                @click="copyLink"
                class="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                :class="copied ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-900 text-white hover:bg-gray-700'"
              >{{ copied ? 'Copiado' : 'Copiar' }}</button>
            </div>

            <div class="mt-4 flex flex-wrap gap-2">
              <a
                v-if="created.payment_link"
                :href="whatsappHref"
                target="_blank"
                rel="noopener"
                class="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >Enviar por WhatsApp</a>
              <NuxtLink
                :to="`/app/shopping/purchase-requests/${created.id}`"
                class="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 text-sm font-semibold rounded-lg transition-colors"
              >Ver solicitud</NuxtLink>
              <button
                @click="resetForm"
                class="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 text-sm font-semibold rounded-lg transition-colors"
              >Crear otra</button>
            </div>
          </div>
        </div>
      </div>

      <template v-else>
        <!-- ── Step 1: customer ─────────────────────────────────────── -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 class="text-lg font-bold text-gray-900 mb-4">Cliente</h2>

          <div class="relative" v-if="!selectedCustomer">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input
              v-model="customerSearch"
              type="text"
              placeholder="Buscar por nombre, correo o teléfono..."
              class="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              @input="searchCustomers"
            >
            <div v-if="showCustomerDropdown && customers.length > 0" class="absolute z-10 w-full bg-white mt-1 border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              <div
                v-for="customer in customers"
                :key="customer.id"
                @click="selectCustomer(customer)"
                class="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 flex justify-between items-center"
              >
                <div>
                  <div class="font-medium text-gray-900">{{ customer.name }}</div>
                  <div class="text-xs text-gray-500">{{ customer.email }}</div>
                </div>
                <span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{{ customer.id }}</span>
              </div>
            </div>
          </div>

          <div v-else class="p-4 bg-primary-50 border border-primary-100 rounded-lg flex justify-between items-center animate-fadeIn">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 font-bold">
                {{ selectedCustomer.name ? selectedCustomer.name.charAt(0).toUpperCase() : 'U' }}
              </div>
              <div>
                <p class="font-bold text-primary-900">{{ selectedCustomer.name }}</p>
                <p class="text-sm text-primary-700">{{ selectedCustomer.email }}</p>
              </div>
            </div>
            <button @click="selectedCustomer = null" class="text-primary-600 hover:text-primary-800 text-sm font-medium underline">Cambiar</button>
          </div>
        </div>

        <!-- ── Mode: charge for it, or just write it down ───────────── -->
        <div v-if="selectedCustomer" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-fadeIn">
          <h2 class="text-lg font-bold text-gray-900 mb-4">¿Qué quieres hacer?</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              @click="mode = 'charge'"
              :class="[
                'text-left p-4 rounded-xl border-2 transition-colors',
                mode === 'charge' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300',
              ]"
            >
              <p class="font-semibold text-gray-900">Cobrar la reserva</p>
              <p class="text-xs text-gray-500 mt-1">Genera el link de pago para mandárselo al cliente.</p>
            </button>
            <button
              @click="mode = 'record'"
              :class="[
                'text-left p-4 rounded-xl border-2 transition-colors',
                mode === 'record' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300',
              ]"
            >
              <p class="font-semibold text-gray-900">Solo registrar</p>
              <p class="text-xs text-gray-500 mt-1">Para visitas que ya pasaron. Sin cobro y sin correos.</p>
            </button>
          </div>

          <div v-if="mode === 'record'" class="mt-5 space-y-5 border-t border-gray-100 pt-5">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Estado</label>
              <select v-model="status" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                <option value="awaiting_deposit">Esperando reserva — aún no paga</option>
                <option value="pending_review">Reserva pagada — lista para comprar</option>
                <option value="quoted">Cotizada — ya se le mandó el total</option>
                <option value="paid">Pagada — ya pagó los productos</option>
                <option value="purchased">Comprada — ya se compró todo</option>
              </select>
            </div>

            <label class="flex items-start gap-3 cursor-pointer">
              <input v-model="depositPaid" type="checkbox" class="mt-0.5 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500">
              <span class="text-sm text-gray-700">
                La reserva ya está pagada
                <span class="block text-xs text-gray-500">Márcala para que no aparezca como pendiente de cobro.</span>
              </span>
            </label>

            <div v-if="depositPaid">
              <label class="block text-sm font-medium text-gray-700 mb-2">¿Cuándo la pagó? (opcional)</label>
              <input v-model="depositPaidAt" type="date" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Monto de la reserva (USD)</label>
              <input v-model.number="depositAmountOverride" type="number" min="0" step="0.01" :placeholder="depositTotal" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
              <p class="text-xs text-gray-500 mt-1">Déjalo vacío para usar la tarifa de hoy (${{ depositTotal }}).</p>
            </div>

            <p class="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              Nada de esto manda correos ni crea cobros en Stripe. Los montos de la compra
              (lo gastado + comisión) se editan después desde la solicitud.
            </p>
          </div>
        </div>

        <!-- ── Step 2: how many stores ──────────────────────────────── -->
        <div v-if="selectedCustomer" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-fadeIn">
          <h2 class="text-lg font-bold text-gray-900">¿Cuántas tiendas?</h2>
          <p class="text-sm text-gray-500 mt-1">${{ feeLabel }} USD por cada tienda que visites en Las Américas.</p>

          <div class="mt-5 flex items-center justify-between gap-6 flex-wrap">
            <div class="flex items-center gap-3">
              <button
                @click="storeCount = Math.max(1, storeCount - 1)"
                :disabled="storesLocked || storeCount <= 1"
                class="w-11 h-11 rounded-xl border border-gray-300 text-xl font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >−</button>
              <input
                v-model.number="storeCount"
                type="number"
                min="1"
                max="20"
                :disabled="storesLocked"
                class="w-20 text-center text-2xl font-bold py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
              >
              <button
                @click="storeCount = Math.min(20, storeCount + 1)"
                :disabled="storesLocked || storeCount >= 20"
                class="w-11 h-11 rounded-xl border border-gray-300 text-xl font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >+</button>
            </div>

            <div class="text-right">
              <p class="text-xs text-gray-500">Total de la reserva</p>
              <p class="text-3xl font-bold tracking-tight text-gray-900 leading-none mt-1">
                ${{ depositTotal }}<span class="text-sm font-medium text-gray-500 ml-1">USD</span>
              </p>
              <p class="text-xs text-gray-400 mt-1">{{ storeCount }} × ${{ feeLabel }}</p>
            </div>
          </div>

          <p v-if="storesLocked" class="mt-3 text-xs text-gray-500">
            El número viene de las tiendas que elegiste abajo. Quita la selección para escribirlo a mano.
          </p>
        </div>

        <!-- ── Optional detail ──────────────────────────────────────── -->
        <div v-if="selectedCustomer" class="bg-white rounded-xl shadow-sm border border-gray-200 animate-fadeIn">
          <button @click="showOptional = !showOptional" class="w-full flex items-center justify-between p-6 text-left">
            <div>
              <h2 class="text-lg font-bold text-gray-900">Detalles (opcional)</h2>
              <p class="text-sm text-gray-500 mt-0.5">Tiendas, fecha del viaje, presupuesto y notas. Puedes llenarlo después.</p>
            </div>
            <svg :class="['w-5 h-5 text-gray-400 transition-transform', showOptional && 'rotate-180']" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
          </button>

          <div v-if="showOptional" class="px-6 pb-6 space-y-5 border-t border-gray-100 pt-5">
            <div v-if="stores.length">
              <label class="block text-sm font-medium text-gray-700 mb-2">Tiendas</label>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="s in stores"
                  :key="s.id"
                  @click="toggleStore(s.id)"
                  :class="[
                    'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
                    selectedStoreIds.includes(s.id)
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50',
                  ]"
                >{{ s.name }}</button>
              </div>
            </div>

            <div v-if="trips.length">
              <label class="block text-sm font-medium text-gray-700 mb-2">Viaje programado</label>
              <select v-model="shoppingTripId" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                <option :value="null">Sin viaje asignado</option>
                <option v-for="tr in trips" :key="tr.id" :value="tr.id">
                  {{ formatTripDate(tr.trip_date) }} — {{ tr.location }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Presupuesto mínimo (USD)</label>
              <input v-model.number="minimumBudgetUsd" type="number" min="0" step="1" placeholder="Ej. 300" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Qué busca el cliente</label>
              <textarea v-model="customerNotes" rows="2" placeholder="Lo que pidió por WhatsApp..." class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Notas internas</label>
              <textarea v-model="adminNotes" rows="2" placeholder="Solo para el equipo..." class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"></textarea>
            </div>
          </div>
        </div>

        <p v-if="error" class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{{ error }}</p>

        <button
          v-if="selectedCustomer"
          @click="submit"
          :disabled="loading"
          class="w-full py-4 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg shadow-primary-500/20 transition-colors animate-fadeIn"
        >
          {{ loading
            ? 'Guardando...'
            : (mode === 'charge'
                ? `Crear visita y generar link de $${depositTotal} USD`
                : 'Registrar visita sin cobrar') }}
        </button>
      </template>
    </div>
  </section>
</template>

<script setup>
definePageMeta({
  layout: 'shopping',
  middleware: ['auth', 'shopping'],
})

const { $customFetch } = useNuxtApp()

// Customer picker
const customerSearch = ref('')
const customers = ref([])
const selectedCustomer = ref(null)
const showCustomerDropdown = ref(false)
let searchDebounce = null

// 'charge' mints a Payment Link; 'record' writes the visit down and touches
// nothing outside our database — for backfilling trips that already happened.
const mode = ref('charge')
const status = ref('pending_review')
const depositPaid = ref(true)
const depositPaidAt = ref('')
const depositAmountOverride = ref(null)

// The visit
const storeCount = ref(1)
const selectedStoreIds = ref([])
const shoppingTripId = ref(null)
const minimumBudgetUsd = ref(null)
const customerNotes = ref('')
const adminNotes = ref('')
const showOptional = ref(false)

// Reference data
const perStoreFee = ref(10)
const stores = ref([])
const trips = ref([])

const loading = ref(false)
const error = ref('')
const created = ref(null)
const copied = ref(false)

// Picking specific stores decides the count — two numbers that could disagree
// is a way to bill for four stores and visit three.
const storesLocked = computed(() => selectedStoreIds.value.length > 0)
const recording = computed(() => mode.value === 'record')
const feeLabel = computed(() => Number(perStoreFee.value).toFixed(2).replace(/\.00$/, ''))
const depositTotal = computed(() => (storeCount.value * perStoreFee.value).toFixed(2).replace(/\.00$/, ''))

const whatsappHref = computed(() => {
  if (!created.value) return '#'
  const text = encodeURIComponent(
    `Hola ${created.value.customerName}, aquí está tu link para apartar la visita a ${created.value.storeCount} ` +
    `tienda(s) en Las Américas ($${created.value.total} USD): ${created.value.payment_link}`,
  )
  // Straight to their chat when we have a number on file, otherwise the
  // share sheet so she can pick the contact herself.
  const phone = (created.value.phone || '').replace(/\D/g, '')
  return phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`
})

// "Still awaiting the reservation" and "the reservation is paid" are the same
// claim contradicting itself — keep the two controls honest with each other.
watch(status, (value) => {
  depositPaid.value = value !== 'awaiting_deposit'
})

watch(selectedStoreIds, (ids) => {
  if (ids.length > 0) storeCount.value = ids.length
}, { deep: true })

const STATUS_LABELS = {
  awaiting_deposit: 'esperando reserva',
  pending_review: 'reserva pagada',
  quoted: 'cotizada',
  paid: 'pagada',
  purchased: 'comprada',
}
const statusLabel = (s) => STATUS_LABELS[s] || s

const toggleStore = (id) => {
  const i = selectedStoreIds.value.indexOf(id)
  if (i === -1) selectedStoreIds.value.push(id)
  else selectedStoreIds.value.splice(i, 1)
}

const searchCustomers = () => {
  if (searchDebounce) clearTimeout(searchDebounce)
  if (customerSearch.value.length < 2) {
    customers.value = []
    return
  }
  searchDebounce = setTimeout(async () => {
    try {
      const { data } = await $customFetch('/shopping/customers', {
        params: { search: customerSearch.value, limit: 5 },
      })
      customers.value = data.data
      showCustomerDropdown.value = true
    } catch (e) {
      console.error(e)
    }
  }, 300)
}

const selectCustomer = (customer) => {
  selectedCustomer.value = customer
  showCustomerDropdown.value = false
  customerSearch.value = ''
}

const formatTripDate = (d) => {
  if (!d) return ''
  return new Date(`${String(d).slice(0, 10)}T12:00:00`).toLocaleDateString('es-MX', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

const submit = async () => {
  if (!selectedCustomer.value || loading.value) return
  loading.value = true
  error.value = ''

  try {
    const res = await $customFetch('/shopping/purchase-requests/in-person', {
      method: 'POST',
      body: {
        user_id: selectedCustomer.value.id,
        store_count: storeCount.value,
        store_ids: selectedStoreIds.value.length ? selectedStoreIds.value : undefined,
        shopping_trip_id: shoppingTripId.value || undefined,
        minimum_budget_usd: minimumBudgetUsd.value || undefined,
        customer_notes: customerNotes.value || undefined,
        admin_notes: adminNotes.value || undefined,
        // Backfill mode sends everything explicitly so the server never has to
        // guess whether a historical visit should be charged for.
        ...(recording.value
          ? {
              create_payment_link: false,
              status: status.value,
              deposit_paid: depositPaid.value,
              deposit_paid_at: (depositPaid.value && depositPaidAt.value) || undefined,
              deposit_amount_usd: depositAmountOverride.value ?? undefined,
            }
          : { create_payment_link: true }),
      },
    })

    created.value = {
      id: res.data.id,
      request_number: res.data.request_number,
      status: res.data.status,
      payment_link: res.payment_link,
      customerName: selectedCustomer.value.name,
      phone: selectedCustomer.value.phone,
      storeCount: storeCount.value,
      total: depositTotal.value,
    }
  } catch (e) {
    error.value = e?.data?.message || 'No se pudo crear la visita. Intenta de nuevo.'
  } finally {
    loading.value = false
  }
}

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(created.value.payment_link)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch (e) {
    console.error(e)
  }
}

const resetForm = () => {
  created.value = null
  selectedCustomer.value = null
  mode.value = 'charge'
  status.value = 'pending_review'
  depositPaid.value = true
  depositPaidAt.value = ''
  depositAmountOverride.value = null
  storeCount.value = 1
  selectedStoreIds.value = []
  shoppingTripId.value = null
  minimumBudgetUsd.value = null
  customerNotes.value = ''
  adminNotes.value = ''
  showOptional.value = false
}

onMounted(async () => {
  // The fee comes from Stripe, not from a constant here — the total on screen
  // has to be the total the Payment Link will charge.
  try {
    const res = await $customFetch('/shopping/purchase-requests/in-person/per-store-fee')
    if (res?.per_store_fee_usd) perStoreFee.value = Number(res.per_store_fee_usd)
  } catch (e) {
    console.error(e)
  }

  try {
    const res = await $customFetch('/shopping-trips/in-person-stores')
    stores.value = res.data?.stores ?? []
  } catch (e) {
    console.error(e)
  }

  try {
    const res = await $customFetch('/shopping-trips/availability')
    trips.value = res.data ?? []
  } catch (e) {
    console.error(e)
  }
})
</script>
