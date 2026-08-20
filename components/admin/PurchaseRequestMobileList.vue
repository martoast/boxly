<template>
  <!--
    Phone view of the purchase-request list.

    The desktop table has six columns and `whitespace-nowrap`, so on a 390pt
    iPhone it becomes a sideways-scrolling strip inside a vertically-scrolling
    page — you cannot see a request's status without dragging the row. A phone
    has room for one column, so this is one column: the two facts you scan for
    (who, and what state it's in) are always visible, and the row is one big
    tap target.
  -->
  <ul class="divide-y divide-gray-100">
    <li v-for="req in requests" :key="req.id">
      <div
        class="relative flex items-start gap-3 px-4 py-3.5 active:bg-gray-50 transition-colors"
        :class="isSelected(req.id) && 'bg-primary-50/40'"
        @click="open(req)"
      >
        <!-- Generous hit area around a 16px box — the checkbox itself is far
             below the 44pt minimum and sits next to a navigating tap. -->
        <label class="-m-2 p-2 shrink-0 cursor-pointer" @click.stop>
          <input
            type="checkbox"
            :checked="isSelected(req.id)"
            @change="toggle(req.id)"
            class="h-5 w-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
        </label>

        <div class="min-w-0 flex-1">
          <div class="flex items-start justify-between gap-2">
            <p class="text-[15px] font-semibold text-gray-900 leading-tight truncate">
              {{ req.user?.name || '—' }}
            </p>
            <svg class="w-4 h-4 text-gray-300 shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
          </div>

          <p class="text-[13px] text-gray-500 truncate mt-0.5">{{ req.user?.email }}</p>

          <div class="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <span :class="['px-2 py-0.5 rounded-full text-[11px] font-semibold border', statusColor(req.status)]">
              {{ statusLabel(req.status) }}
            </span>
            <span v-if="req.source === 'in_person'" class="text-[11px] font-medium text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
              {{ t.inPerson }}
            </span>
            <span class="text-[12.5px] text-gray-500">{{ countLabel(req) }}</span>
            <span class="text-[12.5px] text-gray-400">·</span>
            <span class="text-[12.5px] text-gray-500">{{ shortDate(req.created_at) }}</span>
          </div>

          <!-- An unpaid reservation's whole job is resending the link, so it
               gets a real button here rather than a trip to the detail page. -->
          <button
            v-if="req.status === 'awaiting_deposit' && req.deposit_payment_link"
            @click.stop="copyLink(req)"
            class="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold border transition-colors"
            :class="copiedId === req.id
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-white border-gray-300 text-gray-700 active:bg-gray-100'"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
            {{ copiedId === req.id ? t.copied : t.copyLink }}
          </button>
        </div>
      </div>
    </li>
  </ul>
</template>

<script setup>
const props = defineProps({
  requests: { type: Array, required: true },
  basePath: { type: String, required: true },
  modelValue: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue'])

const router = useRouter()
const { t: createTranslations } = useLanguage()

const t = createTranslations({
  inPerson: { es: 'En persona', en: 'In person' },
  copyLink: { es: 'Copiar link', en: 'Copy link' },
  copied: { es: 'Copiado', en: 'Copied' },
  item: { es: 'artículo', en: 'item' },
  items: { es: 'artículos', en: 'items' },
  store: { es: 'tienda', en: 'store' },
  stores: { es: 'tiendas', en: 'stores' },
  awaitingDeposit: { es: 'Sin reserva', en: 'Awaiting deposit' },
  pendingReview: { es: 'Por revisar', en: 'Pending review' },
  quoted: { es: 'Cotizada', en: 'Quoted' },
  paid: { es: 'Pagada', en: 'Paid' },
  purchased: { es: 'Comprada', en: 'Purchased' },
  rejected: { es: 'Rechazada', en: 'Rejected' },
  cancelled: { es: 'Cancelada', en: 'Cancelled' },
})

const isSelected = (id) => props.modelValue.includes(id)

const toggle = (id) => {
  const next = isSelected(id)
    ? props.modelValue.filter((x) => x !== id)
    : [...props.modelValue, id]
  emit('update:modelValue', next)
}

const open = (req) => router.push(`${props.basePath}/${req.id}`)

// Real words, not the raw enum shouted in caps — "AWAITING_DEPOSIT" is a
// column name, not something to hand an operator on a phone.
const statusLabel = (s) => ({
  awaiting_deposit: t.value.awaitingDeposit,
  pending_review: t.value.pendingReview,
  quoted: t.value.quoted,
  paid: t.value.paid,
  purchased: t.value.purchased,
  rejected: t.value.rejected,
  cancelled: t.value.cancelled,
}[s] || String(s || '').replace(/_/g, ' '))

const statusColor = (s) => ({
  awaiting_deposit: 'bg-orange-100 text-orange-800 border-orange-200',
  pending_review: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  quoted: 'bg-blue-100 text-blue-800 border-blue-200',
  paid: 'bg-primary-100 text-primary-800 border-primary-200',
  purchased: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  cancelled: 'bg-gray-100 text-gray-700 border-gray-200',
}[s] || 'bg-gray-100 text-gray-800 border-gray-200')

// In-person requests are counted in stores; everything else in line items.
const countLabel = (req) => {
  if (req.source === 'in_person') {
    const n = req.in_person_store_count || 0
    return `${n} ${n === 1 ? t.value.store : t.value.stores}`
  }
  const n = req.items?.length || 0
  return `${n} ${n === 1 ? t.value.item : t.value.items}`
}

// "19 ago" beats "8/19/2026" when the row is already tight.
const shortDate = (d) => {
  if (!d) return ''
  return new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

const copiedId = ref(null)
const copyLink = async (req) => {
  try {
    await navigator.clipboard.writeText(req.deposit_payment_link)
    copiedId.value = req.id
    setTimeout(() => { if (copiedId.value === req.id) copiedId.value = null }, 2000)
  } catch (e) {
    console.error(e)
  }
}
</script>
