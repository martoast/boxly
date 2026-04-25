<template>
  <span :class="[colorClass, 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap']">
    <span :class="[dotClass, 'h-1.5 w-1.5 rounded-full']"></span>
    {{ label }}
  </span>
</template>

<script setup>
const props = defineProps({
  status: { type: String, required: true },
})

const STATUS = {
  collecting:                { es: 'Acumulando',         en: 'Collecting',         color: 'bg-blue-50 text-blue-700 border-blue-100',     dot: 'bg-blue-400' },
  ready_to_ship:             { es: 'Listo para enviar',  en: 'Ready to ship',      color: 'bg-amber-50 text-amber-700 border-amber-100',  dot: 'bg-amber-400' },
  packing:                   { es: 'Empacando',          en: 'Packing',            color: 'bg-purple-50 text-purple-700 border-purple-100', dot: 'bg-purple-400' },
  awaiting_shipping_payment: { es: 'Pago de envío',      en: 'Awaiting shipping payment', color: 'bg-orange-50 text-orange-700 border-orange-100', dot: 'bg-orange-400' },
  shipping_paid:             { es: 'Envío pagado',       en: 'Shipping paid',      color: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-400' },
  shipped:                   { es: 'Enviado',            en: 'Shipped',            color: 'bg-indigo-50 text-indigo-700 border-indigo-100', dot: 'bg-indigo-400' },
  delivered:                 { es: 'Entregado',          en: 'Delivered',          color: 'bg-green-50 text-green-700 border-green-100',  dot: 'bg-green-500' },
  cancelled:                 { es: 'Cancelado',          en: 'Cancelled',          color: 'bg-gray-50 text-gray-600 border-gray-100',     dot: 'bg-gray-400' },
  refunded:                  { es: 'Reembolsado',        en: 'Refunded',           color: 'bg-red-50 text-red-700 border-red-100',        dot: 'bg-red-400' },
}

const { language } = useLanguage()

const config = computed(() => STATUS[props.status] ?? STATUS.collecting)
const label = computed(() => config.value[language.value] ?? config.value.en)
const colorClass = computed(() => config.value.color)
const dotClass = computed(() => config.value.dot)
</script>
