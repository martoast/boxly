<template>
  <div class="rounded-2xl border border-primary-200 bg-white p-4 max-w-md shadow-sm">
    <div class="flex items-center gap-2 mb-0.5">
      <p class="text-[14px] font-extrabold text-gray-900">Confirma tu compra</p>
      <span v-if="store" class="ml-auto text-[11px] font-semibold text-primary-700 bg-primary-50 rounded-full px-2.5 py-0.5">{{ store }}</span>
    </div>
    <p class="text-[12px] text-gray-500 mb-3">Revisa lo que compraste. Puedes editar cantidades, precios o quitar algo antes de crear tu pedido.</p>

    <!-- editable line items -->
    <div class="space-y-2">
      <div v-for="(it, i) in rows" :key="i" class="flex items-center gap-2">
        <input v-model="it.name" placeholder="Producto" class="flex-1 min-w-0 border border-gray-200 rounded-lg px-2.5 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary-400" />
        <input v-model.number="it.quantity" type="number" min="1" class="w-12 border border-gray-200 rounded-lg px-1.5 py-1.5 text-[13px] text-center focus:outline-none focus:ring-2 focus:ring-primary-400" />
        <div class="relative w-20 shrink-0">
          <span class="absolute left-2 top-1/2 -translate-y-1/2 text-[12px] text-gray-400">$</span>
          <input v-model.number="it.price" type="number" min="0" step="0.01" class="w-full border border-gray-200 rounded-lg pl-5 pr-1.5 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary-400" />
        </div>
        <button type="button" @click="removeRow(i)" class="shrink-0 p-1 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors" aria-label="Quitar">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
    </div>
    <button type="button" @click="addRow" class="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-primary-600 hover:text-primary-700 active:scale-95 transition">
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
      Agregar artículo
    </button>

    <!-- delivery address -->
    <label class="block text-[12px] font-semibold text-gray-700 mt-3 mb-1">Dirección de entrega en México</label>
    <textarea v-model="addr" rows="2" placeholder="Calle, colonia, ciudad, C.P." class="w-full border border-gray-200 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary-400"></textarea>

    <p class="mt-2 text-[11px] text-gray-400 flex items-center gap-1">
      <svg class="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      Tu comprobante ya está adjunto. Sin comisión — solo pagas la caja de envío.
    </p>

    <p v-if="error" class="mt-2 text-[12px] text-red-600">{{ error }}</p>
    <div class="flex items-center gap-2 mt-3">
      <button type="button" @click="$emit('cancel')" :disabled="loading" class="px-3 py-2.5 text-gray-500 hover:bg-gray-100 text-[13px] font-semibold rounded-xl transition">Cancelar</button>
      <button type="button" @click="confirm" :disabled="loading" class="flex-1 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 active:scale-[.98] disabled:bg-gray-300 text-white text-[13px] font-bold rounded-xl transition-all">
        {{ loading ? 'Creando pedido…' : 'Crear pedido' }}
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  items: { type: Array, default: () => [] },
  store: { type: String, default: '' },
  address: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
})
const emit = defineEmits(['confirm', 'cancel'])

// Local editable copies (deep) so edits don't mutate props.
const rows = ref((props.items || []).map((it) => ({ name: it.name || '', quantity: Math.max(1, Number(it.quantity) || 1), price: Number(it.price) || 0 })))
const addr = ref(props.address || '')
watch(() => props.address, (v) => { if (v && !addr.value) addr.value = v })

function addRow() { rows.value.push({ name: '', quantity: 1, price: 0 }) }
function removeRow(i) { rows.value.splice(i, 1) }

function confirm() {
  const items = rows.value.map((r) => ({ name: (r.name || '').trim(), quantity: Math.max(1, Number(r.quantity) || 1), price: Math.max(0, Number(r.price) || 0) })).filter((r) => r.name)
  emit('confirm', { items, address: addr.value.trim() })
}
</script>
