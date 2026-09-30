<template>
  <!-- $30 x hours + 10% x spent - $30 already paid = total. `b` is the API `final` or computeFinal(). -->
  <dl class="text-sm space-y-2">
    <div class="flex justify-between gap-3"><dt class="text-gray-600">{{ t.hours(b.hours, money(30)) }}</dt><dd class="font-semibold">{{ money(b.hoursFee) }}</dd></div>
    <div class="flex justify-between gap-3"><dt class="text-gray-600">{{ t.commission(money(b.spent), 10) }}</dt><dd class="font-semibold">{{ money(b.commission) }}</dd></div>
    <div class="flex justify-between gap-3"><dt class="text-gray-600">{{ t.credit }}</dt><dd class="font-semibold text-green-700">-{{ money(b.credit) }}</dd></div>
    <div class="flex justify-between gap-3 pt-2 border-t border-gray-200 text-base"><dt class="font-bold text-gray-900">{{ t.total }}</dt><dd class="font-extrabold text-gray-900">{{ money(b.total) }} USD</dd></div>
  </dl>
</template>

<script setup>
import { money } from '~/utils/inPersonReservation'

defineProps({ b: { type: Object, required: true } })
const { t: createTranslations } = useLanguage()
const t = createTranslations({
  hours: { es: (h, rate) => `${h} h trabajadas × ${rate}`, en: (h, rate) => `${h} h worked × ${rate}` },
  commission: { es: (s, p) => `${p}% de ${s} gastados`, en: (s, p) => `${p}% of ${s} spent` },
  credit: { es: 'Reserva ya pagada', en: 'Reservation already paid' },
  total: { es: 'Total a pagar', en: 'Total due' },
})
</script>
