<template>
  <div class="rounded-2xl border border-primary-200 bg-white p-4 max-w-md shadow-sm">
    <div class="flex items-center gap-2 mb-2">
      <span class="text-lg">🏬</span>
      <p class="text-[14px] font-extrabold text-primary-900">Compras presenciales — Las Americas</p>
    </div>
    <p class="text-[12px] text-gray-500 mb-3">Vamos por ti a los outlets de San Diego. Elige la fecha, las tiendas y lo que buscas.</p>

    <!-- 1) trip date -->
    <p class="text-[12px] font-bold text-gray-700 mb-1.5">📅 Elige una fecha</p>
    <div v-if="trips.length" class="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 mb-3">
      <button v-for="tr in trips" :key="tr.id" @click="tripId = tr.id"
        :class="['shrink-0 px-3 py-2 rounded-xl border text-center transition active:scale-95', tripId === tr.id ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:border-gray-300']">
        <span class="block text-[13px] font-bold">{{ fmtDay(tr.trip_date) }}</span>
        <span class="block text-[10px] text-gray-400">{{ fmtMonth(tr.trip_date) }}</span>
      </button>
    </div>
    <p v-else class="text-[12px] text-gray-400 mb-3">No hay fechas abiertas ahora — escríbenos por WhatsApp.</p>

    <!-- 2) stores -->
    <p class="text-[12px] font-bold text-gray-700 mb-1.5">🛍️ Tiendas ({{ storeIds.length }})</p>
    <div class="flex flex-wrap gap-2 mb-3">
      <button v-for="s in stores" :key="s.id" @click="toggleStore(s.id)"
        :class="['px-3 py-1.5 rounded-full border text-[12.5px] font-semibold transition active:scale-95', storeIds.includes(s.id) ? 'border-primary-500 bg-primary-500 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300']">
        {{ s.name }}
      </button>
    </div>

    <!-- 3) interests -->
    <p class="text-[12px] font-bold text-gray-700 mb-1.5">✨ ¿Qué te interesa?</p>
    <div class="flex flex-wrap gap-2 mb-3">
      <button v-for="c in categories" :key="c.id" @click="toggleCat(c.id)"
        :class="['px-3 py-1.5 rounded-full border text-[12.5px] font-medium transition active:scale-95', catIds.includes(c.id) ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-500 hover:border-gray-300']">
        {{ c.name }}
      </button>
    </div>

    <!-- 4) budget -->
    <label class="block text-[12px] font-bold text-gray-700 mb-1.5">💵 Presupuesto mínimo (USD)</label>
    <div class="relative w-32 mb-3">
      <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-[13px] text-gray-400">$</span>
      <input v-model.number="budget" type="number" min="0" step="10" class="w-full border border-gray-200 rounded-lg pl-6 pr-2 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary-400" />
    </div>

    <!-- deposit -->
    <div class="rounded-xl bg-primary-50/60 border border-primary-100 px-3 py-2 text-[12px] text-primary-800 mb-3">
      Depósito para reservar: <span class="font-bold">${{ deposit }} USD</span> <span class="text-primary-500">(${{ perStoreFee }}/tienda × {{ storeIds.length || 0 }})</span>. Se abona a tu compra.
    </div>

    <p v-if="error" class="text-[12px] text-red-600 mb-2">{{ error }}</p>
    <button type="button" @click="submit" :disabled="loading || !ready"
      class="w-full px-4 py-2.5 bg-primary-500 hover:bg-primary-600 active:scale-[.98] disabled:bg-gray-300 text-white text-[13px] font-bold rounded-xl transition-all shadow-sm shadow-primary-500/20">
      {{ loading ? 'Creando…' : (ready ? 'Continuar — pagar depósito' : 'Elige fecha y al menos una tienda') }}
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  plan: { type: Object, default: () => ({}) },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
})
const emit = defineEmits(['confirm'])

const trips = computed(() => props.plan?.trips || [])
const stores = computed(() => props.plan?.stores || [])
const categories = computed(() => props.plan?.categories || [])
const perStoreFee = computed(() => Number(props.plan?.per_store_fee_usd) || 10)

const tripId = ref(null)
const storeIds = ref([])
const catIds = ref([])
const budget = ref(100)

function toggleStore(id) { storeIds.value = storeIds.value.includes(id) ? storeIds.value.filter((x) => x !== id) : [...storeIds.value, id] }
function toggleCat(id) { catIds.value = catIds.value.includes(id) ? catIds.value.filter((x) => x !== id) : [...catIds.value, id] }

const deposit = computed(() => (storeIds.value.length * perStoreFee.value).toFixed(0))
const ready = computed(() => !!tripId.value && storeIds.value.length > 0)

function fmtDay(d) { try { return new Date(d + 'T12:00:00').getDate() } catch { return d } }
function fmtMonth(d) { try { return new Intl.DateTimeFormat('es-MX', { month: 'short' }).format(new Date(d + 'T12:00:00')) } catch { return '' } }

function submit() {
  if (!ready.value) return
  // Assign the chosen interests to each selected store (API shape: {storeId:[catIds]}).
  const store_categories = {}
  for (const sid of storeIds.value) store_categories[sid] = catIds.value
  emit('confirm', {
    shopping_trip_id: tripId.value,
    store_ids: storeIds.value,
    store_categories,
    minimum_budget_usd: Math.max(0, Number(budget.value) || 0),
  })
}
</script>
