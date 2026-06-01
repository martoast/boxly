<template>
  <div
    class="bg-white rounded-lg border border-gray-200/70 pl-2.5 pr-2 py-1.5 transition-all hover:shadow-sm hover:border-gray-300"
    :class="isStatic ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'"
    :style="{ borderLeft: '3px solid ' + meta.hex }"
    @click="emit('open')"
  >
    <div class="flex items-center justify-between gap-1.5">
      <span class="text-[13px] font-semibold text-gray-800 truncate leading-tight">{{ card.customer_name || '—' }}</span>
      <svg v-if="card.pending_payment" class="w-3.5 h-3.5 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 20 20" :aria-label="lang === 'en' ? 'Payment pending' : 'Pago pendiente'">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd"/>
      </svg>
    </div>
    <div class="flex items-center justify-between gap-2 mt-0.5">
      <span class="text-[11px] text-gray-400 truncate">{{ metaLine }}</span>
      <span class="text-[10px] text-gray-300 font-mono shrink-0">{{ shortNumber }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  card: { type: Object, required: true },
  badgeMeta: { type: Object, required: true },
  lang: { type: String, default: 'es' },
  isStatic: { type: Boolean, default: false },
})

const emit = defineEmits(['open'])

const meta = computed(() => props.badgeMeta[props.card.badge] || props.badgeMeta.collecting)

const metaLine = computed(() => {
  if (props.card.box_summary) return props.card.box_summary
  if (props.card.items_count > 0) return `${props.card.arrived_count}/${props.card.items_count} ${props.lang === 'en' ? 'pkgs' : 'pzs'}`
  return props.lang === 'en' ? 'No items' : 'Sin paquetes'
})

// Keep order numbers from blowing out the card width
const shortNumber = computed(() => {
  const n = props.card.order_number || ''
  return n.length > 9 ? n.slice(0, 9) : n
})
</script>
