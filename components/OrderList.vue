<template>
  <div class="rounded-2xl border border-gray-200 bg-white p-2 max-w-md shadow-sm">
    <p class="px-2 pt-1.5 pb-1 text-[12px] font-bold text-gray-500 uppercase tracking-wide">Tus envíos</p>
    <ul class="divide-y divide-gray-100">
      <li v-for="ord in list" :key="ord.id">
        <button
          type="button"
          @click="$emit('track', ord)"
          class="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-gray-50 active:scale-[.99] transition-all text-left"
        >
          <span class="shrink-0 w-9 h-9 grid place-items-center rounded-xl bg-primary-50 text-primary-500 text-base">{{ ord.order_type === 'crossing' ? '🛃' : '📦' }}</span>
          <span class="flex-1 min-w-0">
            <span class="block text-[13.5px] font-semibold text-gray-900 truncate">{{ ord.order_number }}</span>
            <span class="block text-[11.5px] text-gray-400">{{ ord.item_count }} artículo{{ ord.item_count === 1 ? '' : 's' }}<span v-if="ord.created"> · {{ ord.created }}</span></span>
          </span>
          <span :class="['shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full', statusOf(ord).badge]">{{ statusOf(ord).label }}</span>
          <svg class="shrink-0 w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        </button>
      </li>
    </ul>
    <p v-if="!list.length" class="px-3 py-6 text-center text-[13px] text-gray-400">Aún no tienes envíos.</p>
  </div>
</template>

<script setup>
const props = defineProps({ orders: { type: Array, default: () => [] } })
defineEmits(['track'])
const { getCustomerStatus } = useOrderStatus()

const list = computed(() => (props.orders || []).map((o) => ({
  id: o.id,
  order_number: o.order_number || '—',
  status: o.status || 'collecting',
  order_type: o.order_type || 'shipping',
  item_count: o.item_count ?? (Array.isArray(o.items) ? o.items.length : 0),
  created: o.created || null,
})))
const statusOf = (o) => getCustomerStatus(o)
</script>
