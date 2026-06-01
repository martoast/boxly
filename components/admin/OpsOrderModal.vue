<template>
  <Teleport to="body">
    <transition name="ops-fade">
      <div v-if="show" class="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4" @click.self="$emit('close')">
        <div class="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" @click="$emit('close')"></div>

        <div class="relative bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] sm:max-h-[88vh] flex flex-col overflow-hidden">
          <!-- Header -->
          <div class="px-5 pt-5 pb-4 border-b border-gray-100">
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <span class="text-sm font-bold text-gray-500">{{ (card?.customer_name || '?').charAt(0).toUpperCase() }}</span>
                </div>
                <div class="min-w-0">
                  <button
                    v-if="customerId"
                    @click="goToCustomer"
                    class="text-base font-bold text-gray-900 truncate hover:text-primary-600 hover:underline transition-colors text-left max-w-full"
                  >{{ card?.customer_name || '—' }}</button>
                  <h2 v-else class="text-base font-bold text-gray-900 truncate">{{ card?.customer_name || '—' }}</h2>
                  <p class="text-xs text-gray-400 font-mono truncate">{{ card?.order_number }}</p>
                </div>
              </div>
              <button @click="$emit('close')" class="p-1.5 -mr-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 shrink-0">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div class="mt-3">
              <span v-if="meta" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold" :style="{ color: meta.hex, backgroundColor: meta.hex + '1a' }">
                <span class="w-1.5 h-1.5 rounded-full" :style="{ backgroundColor: meta.hex }"></span>{{ meta[lang] }}
              </span>
            </div>
          </div>

          <div class="overflow-y-auto px-5 py-4 space-y-4">
            <!-- Ship date section -->
            <div class="rounded-xl border p-3.5" :class="card?.consolidated ? 'border-primary-100 bg-primary-50/40' : 'border-amber-100 bg-amber-50/40'">
              <label class="block text-[11px] font-bold uppercase tracking-wider mb-2" :class="card?.consolidated ? 'text-primary-700' : 'text-amber-700'">{{ t.shipDate }}</label>

              <template v-if="card?.consolidated">
                <div class="flex items-center gap-2">
                  <input v-model="shipDate" type="date" :min="todayStr" class="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white" />
                  <button @click="saveShipDate(shipDate)" :disabled="saving || !shipDate || shipDate === (card?.planned_ship_date || '')" class="px-3.5 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    {{ saving ? '…' : t.save }}
                  </button>
                </div>
                <label class="mt-2.5 flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" v-model="notifyCustomer" class="w-3.5 h-3.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                  <span class="text-xs text-gray-600">{{ t.notifyCustomer }}</span>
                </label>
                <button v-if="card?.planned_ship_date" @click="saveShipDate(null)" :disabled="saving" class="mt-2 text-xs text-gray-400 hover:text-red-500 transition-colors">{{ t.clearDate }}</button>
              </template>

              <template v-else-if="card?.status === 'packages_complete'">
                <p class="text-xs text-amber-700/90 mb-2.5">{{ t.scheduleAtConsolidate }}</p>
                <button @click="$emit('consolidate', card)" class="w-full px-3 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors">{{ t.consolidateNow }}</button>
              </template>

              <template v-else>
                <p class="text-xs text-gray-500">{{ t.stillInProgress }}</p>
              </template>
            </div>

            <!-- Loading -->
            <div v-if="loading" class="flex justify-center py-6">
              <svg class="animate-spin h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            </div>

            <!-- Summary -->
            <dl v-else class="space-y-3">
              <div>
                <dt class="text-[11px] text-gray-400 uppercase tracking-wide">{{ t.boxes }}</dt>
                <dd class="text-sm font-medium text-gray-800 mt-0.5">{{ card?.box_summary || '—' }}</dd>
              </div>
              <div v-if="phone">
                <dt class="text-[11px] text-gray-400 uppercase tracking-wide">{{ t.phone }}</dt>
                <dd class="text-sm font-medium text-gray-800 mt-0.5">{{ phone }}</dd>
              </div>
              <div v-if="address">
                <dt class="text-[11px] text-gray-400 uppercase tracking-wide">{{ t.address }}</dt>
                <dd class="text-sm text-gray-700 mt-0.5">{{ address }}</dd>
              </div>
            </dl>
          </div>

          <!-- Footer -->
          <div class="px-5 py-3.5 border-t border-gray-100">
            <button @click="goToOrder" class="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-primary-700 bg-primary-50 rounded-xl hover:bg-primary-100 transition-colors">
              {{ t.viewFull }}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  card: { type: Object, default: null },
  badgeMeta: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['close', 'updated', 'consolidate'])

const { $customFetch, $toast } = useNuxtApp()
const { t: createTranslations, language } = useLanguage()

const translations = {
  shipDate: { es: 'Fecha de Envío', en: 'Ship Date' },
  save: { es: 'Guardar', en: 'Save' },
  clearDate: { es: 'Quitar fecha', en: 'Clear date' },
  notifyCustomer: { es: 'Notificar al cliente', en: 'Email the customer' },
  scheduleAtConsolidate: { es: 'Esta orden se programa al consolidarla.', en: 'This order is scheduled when you consolidate it.' },
  consolidateNow: { es: 'Consolidar y Programar', en: 'Consolidate & Schedule' },
  stillInProgress: { es: 'Aún recolectando inventario — se podrá programar al consolidar.', en: 'Still collecting inventory — schedulable once consolidated.' },
  boxes: { es: 'Cajas', en: 'Boxes' },
  phone: { es: 'Teléfono', en: 'Phone' },
  address: { es: 'Dirección', en: 'Address' },
  viewFull: { es: 'Ver orden completa', en: 'View full order' },
  error: { es: 'Algo salió mal', en: 'Something went wrong' },
}
const t = createTranslations(translations)
const lang = computed(() => (language.value === 'en' ? 'en' : 'es'))

const meta = computed(() => props.badgeMeta?.[props.card?.badge] || null)

const loading = ref(false)
const saving = ref(false)
const detail = ref(null)
const shipDate = ref('')
const notifyCustomer = ref(true)

const z = (n) => String(n).padStart(2, '0')
const todayStr = computed(() => { const d = new Date(); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}` })

const phone = computed(() => detail.value?.user?.phone || detail.value?.delivery_address?.phone || '')
const address = computed(() => {
  const a = detail.value?.delivery_address
  if (!a) return ''
  return a.full_address || [a.street, a.colonia, a.municipio, a.estado].filter(Boolean).join(', ')
})

watch(() => props.show, async (open) => {
  if (!open || !props.card) return
  shipDate.value = props.card.planned_ship_date || ''
  notifyCustomer.value = true
  detail.value = null
  loading.value = true
  try {
    const res = await $customFetch(`/admin/orders/${props.card.id}`)
    detail.value = res.data ?? res
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})

const saveShipDate = async (value) => {
  if (!props.card) return
  saving.value = true
  try {
    await $customFetch(`/admin/orders/${props.card.id}/ship-date`, {
      method: 'POST',
      body: { planned_ship_date: value, notify: value ? notifyCustomer.value : false },
    })
    shipDate.value = value || ''
    $toast?.success(value ? t.value.save + ' ✓' : t.value.clearDate + ' ✓')
    emit('updated')
  } catch (e) {
    $toast?.error(e.data?.message || t.value.error)
  } finally {
    saving.value = false
  }
}

const customerId = computed(() => props.card?.user_id || detail.value?.user?.id || null)
const goToCustomer = () => {
  if (customerId.value) navigateTo(`/app/admin/customers/${customerId.value}`)
}

const goToOrder = () => {
  if (props.card) navigateTo(`/app/admin/orders/${props.card.id}`)
}
</script>

<style scoped>
.ops-fade-enter-active, .ops-fade-leave-active { transition: opacity 0.2s ease; }
.ops-fade-enter-from, .ops-fade-leave-to { opacity: 0; }
</style>
